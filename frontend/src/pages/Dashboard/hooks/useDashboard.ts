/**
 * useDashboard.ts
 *
 * Responsabilidade única: Gerenciar estado e lógica de negócio do Dashboard
 */

import { useState, useEffect, useCallback } from "react";
import { getEtapaService, getJogadorService } from "@/services";
import logger from "@/utils/logger";

export interface DashboardStats {
  totalJogadores: number;
  totalEtapas: number;
  inscricoesAbertas: number;
  emAndamento: number;
  finalizadas: number;
}

export interface UseDashboardReturn {
  stats: DashboardStats;
  loading: boolean;
  error: string | null;
  recarregar: () => void;
}

export const useDashboard = (): UseDashboardReturn => {
  const [stats, setStats] = useState<DashboardStats>({
    totalJogadores: 0,
    totalEtapas: 0,
    inscricoesAbertas: 0,
    emAndamento: 0,
    finalizadas: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregarDados = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      logger.info("Carregando estatísticas do dashboard");

      const etapaService = getEtapaService();
      const jogadorService = getJogadorService();

      // Buscar estatísticas em paralelo
      const [estatisticasEtapas, listagemJogadores] = await Promise.all([
        etapaService.obterEstatisticas(),
        jogadorService.listar({ limite: 1 }), // Busca apenas 1 para pegar o total
      ]);

      const novasStats: DashboardStats = {
        totalJogadores: listagemJogadores.total,
        totalEtapas: estatisticasEtapas.totalEtapas,
        inscricoesAbertas: estatisticasEtapas.inscricoesAbertas,
        emAndamento: estatisticasEtapas.emAndamento,
        finalizadas: estatisticasEtapas.finalizadas,
      };

      setStats(novasStats);

      logger.info("Estatísticas do dashboard carregadas", novasStats);
    } catch (err: any) {
      const mensagemErro =
        err.response?.data?.error || "Erro ao carregar estatísticas";
      setError(mensagemErro);
      logger.error("Erro ao carregar dashboard", {}, err);
    } finally {
      setLoading(false);
    }
  }, []);

  const recarregar = useCallback(() => {
    logger.info("Recarregando dashboard");
    carregarDados();
  }, [carregarDados]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  return {
    stats,
    loading,
    error,
    recarregar,
  };
};

export default useDashboard;
