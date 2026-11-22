/**
 * Fase eliminatória do Teams: gerar, cancelar e confrontos por fase
 */

import React from "react";
import styled from "styled-components";
import { Button } from "@/components/ui";
import { AcoesChaves, GrupoPainel, ListaConfrontos } from "@/components/torneio";
import { theme } from "@/styles/theme";
import { FormatoEtapa } from "@/types/etapa";
import { ConfrontoEquipe } from "@/types/teams";
import { FASES_ELIMINATORIA_TEAMS, ordenarConfrontos } from "@/utils/teams";
import { PainelConteudo } from "./GrupoTeamsPainel";

const { texto, superficie, status } = theme.semantic;
const { fontSize } = theme.typography;

interface EliminatoriaTeamsProps {
  confrontos: ConfrontoEquipe[];
  gerada: boolean;
  gruposConcluidos: boolean;
  temEmpatePendente: boolean;
  etapaFinalizada: boolean;
  onGerar: () => void;
  onCancelar: () => void;
  renderConfronto: (confronto: ConfrontoEquipe) => React.ReactNode;
}

const GerarCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${theme.spacing[4]};
  padding: ${theme.spacing[6]};
  border: 1px solid ${superficie.borda};
  border-radius: ${theme.borderRadius.lg};
  background: ${superficie.fundo};
  color: ${texto.secundario};
  text-align: center;

  p {
    margin: 0;
  }

  small {
    color: ${status.aviso.texto};
    font-size: ${fontSize.sm};
  }
`;

export const EliminatoriaTeams: React.FC<EliminatoriaTeamsProps> = ({
  confrontos,
  gerada,
  gruposConcluidos,
  temEmpatePendente,
  etapaFinalizada,
  onGerar,
  onCancelar,
  renderConfronto,
}) => (
  <>
    {!etapaFinalizada && !gerada && (
      <GerarCard>
        <p>
          {gruposConcluidos
            ? "A fase de grupos foi concluída! Gere a fase eliminatória para preencher as vagas com os classificados."
            : "Finalize todos os confrontos da fase de grupos para gerar a fase eliminatória."}
        </p>
        <Button
          onClick={onGerar}
          disabled={!gruposConcluidos || temEmpatePendente}
        >
          Gerar Fase Eliminatória
        </Button>
        {gruposConcluidos && temEmpatePendente && (
          <small>Resolva o empate indicado acima para liberar esta ação.</small>
        )}
      </GerarCard>
    )}

    {gerada && (
      <AcoesChaves>
        <Button variant="danger" onClick={onCancelar} disabled={etapaFinalizada}>
          Cancelar Eliminatória
        </Button>
      </AcoesChaves>
    )}

    {FASES_ELIMINATORIA_TEAMS.map(({ fase, nome }) => {
      const confrontosFase = confrontos.filter((c) => c.fase === fase);
      if (confrontosFase.length === 0) return null;

      return (
        <GrupoPainel key={fase} formato={FormatoEtapa.TEAMS} nome={nome}>
          <PainelConteudo>
            <ListaConfrontos>
              {ordenarConfrontos(confrontosFase).map(renderConfronto)}
            </ListaConfrontos>
          </PainelConteudo>
        </GrupoPainel>
      );
    })}
  </>
);
