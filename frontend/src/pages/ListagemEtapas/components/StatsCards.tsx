/**
 * Responsabilidade única: Renderizar cards de estatísticas
 */

import React from "react";
import { CartaoNumero, Grade } from "@/components/layout/Pagina";
import { EstatisticasEtapas } from "../hooks/useListagemEtapas";

interface StatsCardsProps {
  stats: EstatisticasEtapas;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => (
  <Grade $minimo="9rem">
    <CartaoNumero rotulo="Total de Etapas" valor={stats.totalEtapas} />
    <CartaoNumero rotulo="Inscrições Abertas" valor={stats.inscricoesAbertas} />
    <CartaoNumero rotulo="Em Andamento" valor={stats.emAndamento} />
    <CartaoNumero rotulo="Rei da Praia" valor={stats.reiDaPraia} />
    <CartaoNumero rotulo="Dupla Fixa" valor={stats.duplaFixa} />
  </Grade>
);

export default StatsCards;
