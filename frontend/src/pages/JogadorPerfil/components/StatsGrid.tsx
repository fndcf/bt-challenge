/**
 * Responsabilidade única: Grid de estatísticas do jogador
 */

import React from "react";
import * as S from "../JogadorPerfil.styles";

export interface StatsGridProps {
  totalVitorias: number;
  totalDerrotas: number;
  totalEtapas: number;
  totalGamesVencidos: number;
  totalGamesPerdidos: number;
}

export const StatsGrid: React.FC<StatsGridProps> = ({
  totalVitorias,
  totalDerrotas,
  totalEtapas,
  totalGamesVencidos,
  totalGamesPerdidos,
}) => {
  return (
    <>
      {/* Vitórias */}
      <S.StatCard>
        <S.StatValue>{totalVitorias}</S.StatValue>
        <S.StatLabel>Vitórias</S.StatLabel>
      </S.StatCard>

      {/* Derrotas */}
      <S.StatCard>
        <S.StatValue>{totalDerrotas}</S.StatValue>
        <S.StatLabel>Derrotas</S.StatLabel>
      </S.StatCard>

      {/* Games */}
      <S.StatCard>
        <S.StatValue>
          <span style={{ color: "#16a34a" }}>{totalGamesVencidos}</span>
          <span style={{ color: "#6b7280" }}>/</span>
          <span style={{ color: "#dc2626" }}>{totalGamesPerdidos}</span>
        </S.StatValue>
        <S.StatLabel>Games</S.StatLabel>
      </S.StatCard>

      {/* Etapas Participadas */}
      <S.StatCard>
        <S.StatValue>{totalEtapas}</S.StatValue>
        <S.StatLabel>Etapas Participadas</S.StatLabel>
      </S.StatCard>
    </>
  );
};

export default StatsGrid;
