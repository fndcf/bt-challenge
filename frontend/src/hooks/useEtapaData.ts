/**
 * Responsabilidade única: Carregar e gerenciar dados da etapa
 */

import { useState, useEffect, useCallback } from "react";
import { Etapa, Inscricao, FormatoEtapa } from "@/types/etapa";
import { getEtapaService, getSuperXService, getTeamsService } from "@/services";
import { StatusConfronto } from "@/types/teams";
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
  isSuperX: boolean;
  isTeams: boolean;
  progresso: number;
  todasPartidasFinalizadas: boolean;

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
  const [todasPartidasFinalizadas, setTodasPartidasFinalizadas] = useState(false);

  // Flags derivadas
  const isReiDaPraia = etapa?.formato === FormatoEtapa.REI_DA_PRAIA;
  const isSuperX = etapa?.formato === FormatoEtapa.SUPER_X;
  const isTeams = etapa?.formato === FormatoEtapa.TEAMS;
  const progresso =
    etapa && etapa.maxJogadores > 0
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
        etapaService.listarInscricoes(etapaId),
      ]);

      // Adicionar inscrições ao objeto da etapa
      const etapaComInscricoes: EtapaComInscricoes = {
        ...etapaData,
        inscricoes: inscricoesData,
      };

      setEtapa(etapaComInscricoes);

      // Verificar se todas as partidas estão finalizadas
      if (etapaData.chavesGeradas) {
        try {
          if (etapaData.formato === FormatoEtapa.SUPER_X) {
            const superXService = getSuperXService();
            const partidas = await superXService.buscarPartidas(etapaId);
            const todasFinalizadas = partidas.length > 0 &&
              partidas.every((p: any) => p.status === "finalizada");
            setTodasPartidasFinalizadas(todasFinalizadas);
          } else if (etapaData.formato === FormatoEtapa.TEAMS) {
            const teamsService = getTeamsService();
            const confrontos = await teamsService.buscarConfrontos(etapaId);
            const todosFinalizados = confrontos.length > 0 &&
              confrontos.every((c) => c.status === StatusConfronto.FINALIZADO);
            setTodasPartidasFinalizadas(todosFinalizados);
          } else {
            setTodasPartidasFinalizadas(false);
          }
        } catch (err) {
          // Se falhar ao buscar, assume que não estão todas finalizadas
          logger.warn("Erro ao verificar partidas/confrontos", { etapaId, error: String(err) });
          setTodasPartidasFinalizadas(false);
        }
      } else {
        setTodasPartidasFinalizadas(false);
      }
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
    isSuperX,
    isTeams,
    progresso,
    todasPartidasFinalizadas,

    // Actions
    carregarEtapa,
    recarregar,
  };
};

export default useEtapaData;
