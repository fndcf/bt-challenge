/**
 * Fase de grupos na página pública: resumo recolhido e detalhes ao expandir
 */

import React, { useState } from "react";
import styled from "styled-components";
import { GruposGrid, SecaoPublica } from "@/components/torneio";
import { Badge, Button, EmptyState } from "@/components/ui";
import { getCoresFormato } from "@/styles/semantic";
import { theme } from "@/styles/theme";
import { FormatoEtapa } from "@/types/etapa";
import { GrupoPublico } from "./components/GrupoPublico";
import { getFormato, ordenarGrupos, resumirGrupos } from "./gruposHelpers";
import { Grupo } from "./types";

interface GruposViewerProps {
  grupos: Grupo[];
}

const { texto, superficie } = theme.semantic;
const { fontSize, fontWeight } = theme.typography;

const Resumo = styled.dl`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(7rem, 1fr));
  gap: ${theme.spacing[4]};
  margin: 0;
  padding: ${theme.spacing[4]};
  border-radius: ${theme.borderRadius.lg};
  background: ${superficie.pagina};
  text-align: center;

  div {
    display: flex;
    flex-direction: column;
  }

  dt {
    font-size: ${fontSize.sm};
    color: ${texto.secundario};
  }

  dd {
    margin: 0;
    font-size: ${fontSize["2xl"]};
    font-weight: ${fontWeight.bold};
    color: ${texto.principal};
  }
`;

const GruposViewer: React.FC<GruposViewerProps> = ({ grupos }) => {
  const [expandido, setExpandido] = useState(false);

  if (!grupos?.length) {
    return (
      <SecaoPublica titulo="Fase de Grupos">
        <EmptyState titulo="Grupos ainda não formados" />
      </SecaoPublica>
    );
  }

  const formato = getFormato(grupos);
  const isTeams = formato === FormatoEtapa.TEAMS;
  const { total, finalizados, progresso } = resumirGrupos(grupos, formato);

  const resumo: [string, string | number][] = [
    [isTeams ? "Confrontos" : "Partidas", total],
    ["Finalizados", finalizados],
    ["Progresso", `${progresso}%`],
  ];
  if (!isTeams) resumo.unshift(["Grupos", grupos.length]);

  return (
    <SecaoPublica
      titulo={isTeams ? "Confrontos" : "Fase de Grupos"}
      selo={<Badge formato={formato}>{getCoresFormato(formato).nome}</Badge>}
      acao={
        <Button
          variant="outline"
          size="sm"
          aria-expanded={expandido}
          onClick={() => setExpandido(!expandido)}
        >
          {expandido ? "▲ Recolher" : "▼ Expandir"}
        </Button>
      }
    >
      {expandido ? (
        <GruposGrid>
          {ordenarGrupos(grupos).map((grupo) => (
            <GrupoPublico key={grupo.id} grupo={grupo} formato={formato} />
          ))}
        </GruposGrid>
      ) : (
        <Resumo>
          {resumo.map(([rotulo, valor]) => (
            <div key={rotulo}>
              <dt>{rotulo}</dt>
              <dd>{valor}</dd>
            </div>
          ))}
        </Resumo>
      )}
    </SecaoPublica>
  );
};

export default GruposViewer;
