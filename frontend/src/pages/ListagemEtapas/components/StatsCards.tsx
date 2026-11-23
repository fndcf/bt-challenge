/**
 * Responsabilidade única: Renderizar cards de estatísticas
 */

import React from "react";
import { CartaoNumero, Grade } from "@/components/layout/Pagina";
import { getCoresFormato } from "@/styles/semantic";
import { FormatoEtapa } from "@/types/etapa";
import { EstatisticasEtapas } from "../hooks/useListagemEtapas";

interface StatsCardsProps {
  stats: EstatisticasEtapas;
}

const FORMATOS = [
  FormatoEtapa.DUPLA_FIXA,
  FormatoEtapa.REI_DA_PRAIA,
  FormatoEtapa.SUPER_X,
  FormatoEtapa.TEAMS,
];

export const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => (
  <Grade $minimo="9rem">
    <CartaoNumero rotulo="Total de Etapas" valor={stats.totalEtapas} />
    <CartaoNumero rotulo="Inscrições Abertas" valor={stats.inscricoesAbertas} />
    <CartaoNumero rotulo="Em Andamento" valor={stats.emAndamento} />
    {FORMATOS.map((formato) => (
      <CartaoNumero
        key={formato}
        rotulo={getCoresFormato(formato).nome}
        valor={stats.porFormato[formato]}
      />
    ))}
  </Grade>
);

export default StatsCards;
