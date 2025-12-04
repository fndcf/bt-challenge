/**
 * StatsCards.tsx
 *
 * Responsabilidade única: Exibir cards de estatísticas do dashboard
 */

import React from "react";
import * as S from "../Dashboard.styles";
import { DashboardStats } from "../hooks/useDashboard";

export interface StatsCardsProps {
  stats: DashboardStats;
}

interface StatConfig {
  label: string;
  color: string;
  getValue: (stats: DashboardStats) => number;
}

const statsConfig: StatConfig[] = [
  {
    label: "Total de Jogadores",
    color: "#2563eb",
    getValue: (stats) => stats.totalJogadores,
  },
  {
    label: "Total de Etapas",
    color: "#7c3aed",
    getValue: (stats) => stats.totalEtapas,
  },
  {
    label: "Inscrições Abertas",
    color: "#059669",
    getValue: (stats) => stats.inscricoesAbertas,
  },
  {
    label: "Em Andamento",
    color: "#f59e0b",
    getValue: (stats) => stats.emAndamento,
  },
  {
    label: "Finalizadas",
    color: "#10b981",
    getValue: (stats) => stats.finalizadas,
  },
];

export const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  return (
    <S.StatsGrid>
      {statsConfig.map((config, index) => (
        <S.StatCard key={index} $color={config.color}>
          <S.StatContent>
            <p>{config.label}</p>
            <h3>{config.getValue(stats)}</h3>
          </S.StatContent>
        </S.StatCard>
      ))}
    </S.StatsGrid>
  );
};

export default StatsCards;
