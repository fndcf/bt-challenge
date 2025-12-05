/**
 * Responsabilidade única: Renderizar cards de estatísticas
 */

import React from "react";
import { EstatisticasEtapas } from "../hooks/useListagemEtapas";
import * as S from "../ListagemEtapas.styles";

interface StatsCardsProps {
  stats: EstatisticasEtapas;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  return (
    <S.StatsGrid>
      {/* Total de Etapas */}
      <S.StatCard>
        <S.StatContent>
          <S.StatLabel>Total de Etapas</S.StatLabel>
          <S.StatValue>{stats.totalEtapas}</S.StatValue>
        </S.StatContent>
      </S.StatCard>

      {/* Inscrições Abertas */}
      <S.StatCard>
        <S.StatContent>
          <S.StatLabel>Inscrições Abertas</S.StatLabel>
          <S.StatValue>{stats.inscricoesAbertas}</S.StatValue>
        </S.StatContent>
      </S.StatCard>

      {/* Em Andamento */}
      <S.StatCard>
        <S.StatContent>
          <S.StatLabel>Em Andamento</S.StatLabel>
          <S.StatValue>{stats.emAndamento}</S.StatValue>
        </S.StatContent>
      </S.StatCard>

      {/* Rei da Praia */}
      <S.StatCard>
        <S.StatContent>
          <S.StatLabel> Rei da Praia</S.StatLabel>
          <S.StatValue>{stats.reiDaPraia}</S.StatValue>
        </S.StatContent>
      </S.StatCard>

      {/* Dupla Fixa */}
      <S.StatCard>
        <S.StatContent>
          <S.StatLabel>Dupla Fixa</S.StatLabel>
          <S.StatValue>{stats.duplaFixa}</S.StatValue>
        </S.StatContent>
      </S.StatCard>
    </S.StatsGrid>
  );
};

export default StatsCards;
