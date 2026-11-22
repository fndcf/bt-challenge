/**
 * Partidas e confrontos da página pública
 */

import React from "react";
import styled from "styled-components";
import { CardConfronto, ListaConfrontos } from "@/components/torneio";
import { Badge } from "@/components/ui";
import { theme } from "@/styles/theme";
import { equipeVenceu, getSituacaoConfronto } from "@/utils/teams";
import {
  estaFinalizada,
  formatarPlacar,
  getDuplaNomes,
  getSituacaoPartida,
  getVencedorPartida,
} from "../gruposHelpers";
import { Confronto, Partida, PartidaTeams } from "../types";

const PartidasDoConfronto = styled(ListaConfrontos)`
  margin-top: ${theme.spacing[3]};
  padding-top: ${theme.spacing[3]};
  border-top: 1px solid ${theme.semantic.superficie.borda};
`;

const TIPO_JOGO: Record<PartidaTeams["tipoJogo"], string> = {
  feminino: "Feminino",
  masculino: "Masculino",
  misto: "Misto",
  decider: "Decider",
};

const SeloTipo: React.FC<{ tipo: PartidaTeams["tipoJogo"] }> = ({ tipo }) =>
  tipo === "feminino" || tipo === "masculino" ? (
    <Badge genero={tipo}>{TIPO_JOGO[tipo]}</Badge>
  ) : (
    <Badge tom={tipo === "decider" ? "aviso" : "neutro"}>
      {TIPO_JOGO[tipo] ?? tipo}
    </Badge>
  );

export const PartidaPublica: React.FC<{ partida: Partida }> = ({ partida }) => {
  const vencedor = getVencedorPartida(partida);

  return (
    <CardConfronto
      situacao={getSituacaoPartida(partida.status)}
      lado1={{
        nome: partida.dupla1Nome,
        placar: formatarPlacar(partida, 1),
        vencedor: vencedor === 1,
      }}
      lado2={{
        nome: partida.dupla2Nome,
        placar: formatarPlacar(partida, 2),
        vencedor: vencedor === 2,
      }}
    />
  );
};

const PartidaTeamsPublica: React.FC<{
  partida: PartidaTeams;
  confronto: Confronto;
}> = ({ partida, confronto }) => {
  const montarLado = (lado: 1 | 2) => {
    const dupla = lado === 1 ? partida.dupla1 : partida.dupla2;
    // A dupla pode vir como lista de jogadores, sem a equipe: vale a do confronto
    const equipeId =
      dupla?.equipeId ??
      (lado === 1 ? confronto.equipe1Id : confronto.equipe2Id);

    return {
      nome: getDuplaNomes(dupla) ?? "A definir",
      placar: formatarPlacar(partida, lado),
      vencedor:
        estaFinalizada(partida.status) &&
        !!equipeId &&
        partida.vencedoraEquipeId === equipeId,
    };
  };

  return (
    <CardConfronto
      compacto
      etiquetas={<SeloTipo tipo={partida.tipoJogo} />}
      situacao={getSituacaoPartida(partida.status)}
      lado1={montarLado(1)}
      lado2={montarLado(2)}
    />
  );
};

export const ConfrontoPublico: React.FC<{ confronto: Confronto }> = ({
  confronto,
}) => (
  <CardConfronto
    situacao={getSituacaoConfronto(confronto, "Agendado")}
    lado1={{
      nome: confronto.equipe1Nome || "A definir",
      placar: confronto.jogosEquipe1 || 0,
      vencedor: equipeVenceu(confronto, confronto.equipe1Id),
    }}
    lado2={{
      nome: confronto.equipe2Nome || "A definir",
      placar: confronto.jogosEquipe2 || 0,
      vencedor: equipeVenceu(confronto, confronto.equipe2Id),
    }}
  >
    {!!confronto.partidas?.length && (
      <PartidasDoConfronto>
        {confronto.partidas.map((partida) => (
          <PartidaTeamsPublica
            key={partida.id}
            partida={partida}
            confronto={confronto}
          />
        ))}
      </PartidasDoConfronto>
    )}
  </CardConfronto>
);
