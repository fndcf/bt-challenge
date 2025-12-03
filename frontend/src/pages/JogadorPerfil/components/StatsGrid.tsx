/**
 * StatsGrid.tsx
 *
 * Responsabilidade única: Grid de estatísticas do jogador
 */

import React from "react";
import * as S from "../JogadorPerfil.styles";

export interface StatsGridProps {
  totalVitorias: number;
  totalDerrotas: number;
  totalEtapas: number;
}

export const StatsGrid: React.FC<StatsGridProps> = ({
  totalVitorias,
  totalDerrotas,
  totalEtapas,
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

      {/* Etapas Participadas */}
      <S.StatCard>
        <S.StatValue>{totalEtapas}</S.StatValue>
        <S.StatLabel>Etapas Participadas</S.StatLabel>
      </S.StatCard>
    </>
  );
};

export default StatsGrid;
