/**
 * Grupo do Teams: classificação, equipes e confrontos
 */

import React from "react";
import styled from "styled-components";
import {
  GrupoPainel,
  ListaConfrontos,
  TabelaClassificacao,
} from "@/components/torneio";
import { theme } from "@/styles/theme";
import { FormatoEtapa } from "@/types/etapa";
import { ConfrontoEquipe } from "@/types/teams";
import {
  COLUNAS_ADMIN_TEAMS,
  linhasDeEquipes,
  ordenarEquipes,
} from "@/utils/classificacao";
import { contarFinalizados } from "@/utils/teams";
import { GrupoTeams } from "../hooks/useChavesTeams";
import { EquipeCard } from "./EquipeCard";

interface GrupoTeamsPainelProps {
  grupo: GrupoTeams;
  podeRenomear: boolean;
  onRenomear: (equipeId: string, nome: string) => Promise<boolean>;
  renderConfronto: (confronto: ConfrontoEquipe) => React.ReactNode;
}

export const PainelConteudo = styled.div`
  padding: ${theme.spacing[4]};
`;

const EquipesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 18rem), 1fr));
  gap: ${theme.spacing[4]};
`;

const Titulo = styled.h4`
  margin: ${theme.spacing[6]} 0 ${theme.spacing[3]} 0;
  font-size: ${theme.typography.fontSize.base};
  font-weight: ${theme.typography.fontWeight.semibold};
  color: ${theme.semantic.texto.principal};
`;

export const GrupoTeamsPainel: React.FC<GrupoTeamsPainelProps> = ({
  grupo,
  podeRenomear,
  onRenomear,
  renderConfronto,
}) => {
  const { nome, equipes, confrontos } = grupo;

  return (
    <GrupoPainel
      formato={FormatoEtapa.TEAMS}
      nome={nome}
      etiquetas={[
        `${equipes.length} equipes`,
        `${contarFinalizados(confrontos)}/${confrontos.length} confrontos`,
      ]}
    >
      <TabelaClassificacao
        formato={FormatoEtapa.TEAMS}
        legenda={`Classificação: ${nome}`}
        rotuloNome="Equipe"
        colunas={COLUNAS_ADMIN_TEAMS}
        linhas={linhasDeEquipes(equipes)}
      />

      <PainelConteudo>
        <EquipesGrid>
          {ordenarEquipes(equipes).map((equipe, index) => (
            <EquipeCard
              key={equipe.id}
              equipe={equipe}
              posicao={index + 1}
              podeRenomear={podeRenomear}
              onRenomear={onRenomear}
            />
          ))}
        </EquipesGrid>

        {confrontos.length > 0 && (
          <>
            <Titulo>
              {grupo.id === "todas" ? "Confrontos" : "Confrontos do Grupo"}
            </Titulo>
            <ListaConfrontos>{confrontos.map(renderConfronto)}</ListaConfrontos>
          </>
        )}
      </PainelConteudo>
    </GrupoPainel>
  );
};
