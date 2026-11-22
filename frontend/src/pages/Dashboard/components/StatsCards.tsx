/**
 * Responsabilidade única: Exibir cards de estatísticas do dashboard
 */

import React from "react";
import { CartaoNumero, Grade } from "@/components/layout/Pagina";
import { DashboardStats } from "../hooks/useDashboard";

export interface StatsCardsProps {
  stats: DashboardStats;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => (
  <Grade $minimo="9rem">
    <CartaoNumero rotulo="Total de Jogadores" valor={stats.totalJogadores} />
    <CartaoNumero rotulo="Total de Etapas" valor={stats.totalEtapas} />
    <CartaoNumero rotulo="Inscrições Abertas" valor={stats.inscricoesAbertas} />
    <CartaoNumero rotulo="Em Andamento" valor={stats.emAndamento} />
    <CartaoNumero rotulo="Finalizadas" valor={stats.finalizadas} />
  </Grade>
);

export default StatsCards;
