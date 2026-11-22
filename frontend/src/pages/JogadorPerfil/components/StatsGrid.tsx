/**
 * Responsabilidade única: Grid de estatísticas do jogador
 */

import React from "react";
import { Games } from "./Games";
import { CartaoNumero, Grade } from "@/components/layout/Pagina";

export interface StatsGridProps {
  posicaoAtual: number;
  totalVitorias: number;
  totalDerrotas: number;
  totalEtapas: number;
  totalGamesVencidos: number;
  totalGamesPerdidos: number;
}

export const StatsGrid: React.FC<StatsGridProps> = ({
  posicaoAtual,
  totalVitorias,
  totalDerrotas,
  totalEtapas,
  totalGamesVencidos,
  totalGamesPerdidos,
}) => (
  <Grade $minimo="9rem">
    <CartaoNumero
      rotulo="Posição no Ranking"
      valor={posicaoAtual > 0 ? `${posicaoAtual}º` : "-"}
    />
    <CartaoNumero rotulo="Vitórias" valor={totalVitorias} />
    <CartaoNumero rotulo="Derrotas" valor={totalDerrotas} />
    <CartaoNumero
      rotulo="Games"
      valor={
        <Games vencidos={totalGamesVencidos} perdidos={totalGamesPerdidos} />
      }
    />
    <CartaoNumero rotulo="Etapas Participadas" valor={totalEtapas} />
  </Grade>
);

export default StatsGrid;
