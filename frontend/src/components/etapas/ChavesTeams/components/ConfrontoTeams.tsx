/**
 * Confronto entre duas equipes, com ações e as partidas (quando expandido)
 */

import React from "react";
import styled from "styled-components";
import { Alert, Badge, Button } from "@/components/ui";
import { CardConfronto, ListaConfrontos } from "@/components/torneio";
import { theme } from "@/styles/theme";
import {
  ConfrontoEquipe,
  PartidaTeams,
  VarianteTeams,
} from "@/types/teams";
import {
  confrontoFinalizado,
  equipeVenceu,
  getSituacaoConfronto,
  precisaDecider,
} from "@/utils/teams";
import { SeloTipoJogo } from "./SeloTipoJogo";

interface ConfrontoTeamsProps {
  confronto: ConfrontoEquipe;
  /** Preenchido só quando o confronto está expandido */
  partidas: PartidaTeams[];
  expandido: boolean;
  varianteTeams?: VarianteTeams;
  etapaFinalizada: boolean;
  /** Fase de grupos depois de gerar a eliminatória */
  resultadosBloqueados: boolean;
  onResultados: () => void;
  onGerarDecider: () => void;
  onAlternar: () => void;
  onDefinirJogadores: (partida: PartidaTeams) => void;
}

const Complemento = styled.div`
  margin-top: ${theme.spacing[3]};
`;

const Partidas = styled(ListaConfrontos)`
  margin-top: ${theme.spacing[3]};
  padding-top: ${theme.spacing[3]};
  border-top: 1px solid ${theme.semantic.superficie.borda};
`;

const PartidaCard: React.FC<{
  partida: PartidaTeams;
  numero: number;
  confronto: ConfrontoEquipe;
  etapaFinalizada: boolean;
  onDefinirJogadores: () => void;
}> = ({
  partida,
  numero,
  confronto,
  etapaFinalizada,
  onDefinirJogadores,
}) => {
  const semJogadores = !partida.dupla1?.length;
  const finalizada = partida.status === "finalizada";

  const montarLado = (lado: 1 | 2) => {
    const dupla = lado === 1 ? partida.dupla1 : partida.dupla2;
    const equipeId = lado === 1 ? partida.equipe1Id : partida.equipe2Id;
    // O decider é criado sem o nome das equipes na partida
    const equipeNome =
      lado === 1 ? confronto.equipe1Nome : confronto.equipe2Nome;
    const campo = lado === 1 ? "gamesDupla1" : "gamesDupla2";

    return {
      nome: dupla?.length
        ? dupla.map((j) => j.nome).join(" / ")
        : equipeNome || "A definir",
      placar:
        finalizada && partida.placar?.length
          ? partida.placar.map((set) => set[campo]).join(", ")
          : undefined,
      vencedor:
        finalizada && !!equipeId && partida.vencedoraEquipeId === equipeId,
    };
  };

  return (
    <CardConfronto
      compacto
      titulo={`Jogo ${numero}`}
      etiquetas={
        <>
          <SeloTipoJogo tipo={partida.tipoJogo} />
          {semJogadores && <Badge>Sem jogadores definidos</Badge>}
        </>
      }
      lado1={montarLado(1)}
      lado2={montarLado(2)}
      acoes={
        !etapaFinalizada &&
        !finalizada && (
          <Button
            size="sm"
            variant={semJogadores ? "primary" : "outline"}
            onClick={onDefinirJogadores}
          >
            {semJogadores ? "Definir Jogadores" : "Editar"}
          </Button>
        )
      }
    />
  );
};

export const ConfrontoTeams: React.FC<ConfrontoTeamsProps> = ({
  confronto,
  partidas,
  expandido,
  varianteTeams,
  etapaFinalizada,
  resultadosBloqueados,
  onResultados,
  onGerarDecider,
  onAlternar,
  onDefinirJogadores,
}) => {
  const equipesDefinidas = !!confronto.equipe1Id && !!confronto.equipe2Id;
  const finalizado = confrontoFinalizado(confronto);
  const faltaDecider = precisaDecider(confronto, varianteTeams);

  return (
    <CardConfronto
      situacao={getSituacaoConfronto(confronto)}
      lado1={{
        nome: confronto.equipe1Nome || confronto.equipe1Origem || "A definir",
        placar: confronto.jogosEquipe1,
        vencedor: equipeVenceu(confronto, confronto.equipe1Id),
      }}
      lado2={{
        nome: confronto.equipe2Nome || confronto.equipe2Origem || "A definir",
        placar: confronto.jogosEquipe2,
        vencedor: equipeVenceu(confronto, confronto.equipe2Id),
      }}
      acoes={
        equipesDefinidas && (
          <>
            {!etapaFinalizada && !resultadosBloqueados && (
              <>
                <Button
                  size="sm"
                  variant={finalizado ? "outline" : "primary"}
                  onClick={onResultados}
                >
                  {finalizado ? "Editar" : "Resultados"}
                </Button>
                {faltaDecider && (
                  <Button size="sm" onClick={onGerarDecider}>
                    Gerar Decider
                  </Button>
                )}
              </>
            )}
            <Button
              size="sm"
              variant="secondary"
              aria-expanded={expandido}
              onClick={onAlternar}
            >
              {expandido ? "Ocultar" : "Ver Partidas"}
            </Button>
          </>
        )
      }
    >
      {faltaDecider && (
        <Complemento>
          <Alert variant="warning">
            Empate 1-1! Gere o Decider para definir o vencedor.
          </Alert>
        </Complemento>
      )}

      {expandido && partidas.length > 0 && (
        <Partidas>
          {partidas.map((partida, index) => (
            <PartidaCard
              key={partida.id}
              partida={partida}
              numero={index + 1}
              confronto={confronto}
              etapaFinalizada={etapaFinalizada}
              onDefinirJogadores={() => onDefinirJogadores(partida)}
            />
          ))}
        </Partidas>
      )}
    </CardConfronto>
  );
};
