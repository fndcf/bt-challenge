/**
 * useEtapaData.ts
 *
 * Responsabilidade única: Carregar e gerenciar dados da etapa
 *
 * SOLID aplicado:
 * - SRP: Hook focado apenas em gerenciar dados (loading, error, fetch)
 * - DIP: Depende de IEtapaService (abstração), não de implementação
 */

import { useState, useEffect, useCallback } from "react";
import { Etapa, Inscricao, FormatoEtapa } from "@/types/etapa";
import { getEtapaService } from "@/services";
import logger from "@/utils/logger";

// Etapa estendida com inscrições
export interface EtapaComInscricoes extends Etapa {
  inscricoes?: Inscricao[];
}

export interface UseEtapaDataReturn {
  // Dados
  etapa: EtapaComInscricoes | null;
  loading: boolean;
  error: string;

  // Flags derivadas
  isReiDaPraia: boolean;
  progresso: number;

  // Actions
  carregarEtapa: () => Promise<void>;
  recarregar: () => Promise<void>;
}

/**
 * Hook para carregar e gerenciar dados de uma etapa
 *
 * @param etapaId - ID da etapa a ser carregada
 * @returns Dados da etapa, loading state e função de recarga
 */
export const useEtapaData = (etapaId?: string): UseEtapaDataReturn => {
  // Estado
  const [etapa, setEtapa] = useState<EtapaComInscricoes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Flags derivadas
  const isReiDaPraia = etapa?.formato === FormatoEtapa.REI_DA_PRAIA;
  const progresso = etapa && etapa.maxJogadores > 0
    ? Math.round((etapa.totalInscritos / etapa.maxJogadores) * 100)
    : 0;

  /**
   * Carregar dados da etapa
   */
  const carregarEtapa = useCallback(async () => {
    if (!etapaId) {
      setError("ID da etapa não fornecido");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Obter service do container
      const etapaService = getEtapaService();

      // Carregar etapa e inscrições em paralelo
      const [etapaData, inscricoesData] = await Promise.all([
        etapaService.buscarPorId(etapaId),
        etapaService.listarInscricoes(etapaId)
      ]);

      // Adicionar inscrições ao objeto da etapa
      const etapaComInscricoes: EtapaComInscricoes = {
        ...etapaData,
        inscricoes: inscricoesData
      };

      setEtapa(etapaComInscricoes);
    } catch (err: any) {
      logger.error("Erro ao carregar etapa", { etapaId }, err);
      setError(err.message || "Erro ao carregar etapa");
    } finally {
      setLoading(false);
    }
  }, [etapaId]);

  /**
   * Recarregar etapa (alias para carregarEtapa)
   */
  const recarregar = useCallback(async () => {
    await carregarEtapa();
  }, [carregarEtapa]);

  // Carregar etapa ao montar ou quando etapaId mudar
  useEffect(() => {
    carregarEtapa();
  }, [carregarEtapa]);

  return {
    // Dados
    etapa,
    loading,
    error,

    // Flags derivadas
    isReiDaPraia,
    progresso,

    // Actions
    carregarEtapa,
    recarregar,
  };
};

export default useEtapaData;
