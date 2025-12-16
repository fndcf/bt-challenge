import { useState, useEffect, useCallback, useRef } from "react";
import { GeneroJogador, NivelJogador } from "@/types/jogador";
import { getArenaPublicService } from "@/services";
import { JogadorPublico } from "@/services/arenaPublicService";

// ============== TIPOS ==============

interface RankingCache {
  data: Record<GeneroJogador, Record<NivelJogador, JogadorPublico[]>>;
  contadores: Record<GeneroJogador, Record<NivelJogador, number>>;
  timestamp: number;
  arenaSlug: string;
}

interface UseRankingCacheProps {
  arenaSlug?: string;
}

interface UseRankingCacheReturn {
  // Dados
  getRanking: (genero: GeneroJogador, nivel: NivelJogador) => JogadorPublico[];
  getContador: (genero: GeneroJogador, nivel: NivelJogador) => number;

  // Estado
  loading: boolean;
  error: string | null;
  isLoaded: boolean;

  // Actions
  refresh: () => Promise<void>;
}

// Cache em memória (singleton fora do hook para persistir entre re-renders)
let globalCache: RankingCache | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

export const useRankingCache = ({
  arenaSlug,
}: UseRankingCacheProps): UseRankingCacheReturn => {
  const arenaPublicService = getArenaPublicService();
  // Iniciar como loading=true se não houver cache válido
  const [loading, setLoading] = useState(() => {
    if (!arenaSlug) return false;
    if (globalCache && globalCache.arenaSlug === arenaSlug) {
      const now = Date.now();
      if (now - globalCache.timestamp < CACHE_TTL) return false;
    }
    return true;
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(() => {
    if (!arenaSlug) return false;
    if (globalCache && globalCache.arenaSlug === arenaSlug) {
      const now = Date.now();
      return now - globalCache.timestamp < CACHE_TTL;
    }
    return false;
  });
  const [, forceUpdate] = useState(0); // Para forçar re-render após carregar cache
  const loadingRef = useRef(false); // Evitar múltiplas chamadas simultâneas
  const lastRefreshRef = useRef<number>(0);

  /**
   * Verifica se o cache é válido para a arena atual
   */
  const isCacheValid = useCallback(() => {
    if (!globalCache || !arenaSlug) return false;
    if (globalCache.arenaSlug !== arenaSlug) return false;

    const now = Date.now();
    return now - globalCache.timestamp < CACHE_TTL;
  }, [arenaSlug]);

  /**
   * Carrega todos os dados do ranking de uma vez
   */
  const loadAllRankingData = useCallback(async () => {
    if (!arenaSlug || loadingRef.current) return;

    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const generos = [GeneroJogador.MASCULINO, GeneroJogador.FEMININO];
      const niveis = [
        NivelJogador.INICIANTE,
        NivelJogador.INTERMEDIARIO,
        NivelJogador.AVANCADO,
      ];

      // Criar estruturas de cache vazias
      const data: Record<GeneroJogador, Record<NivelJogador, JogadorPublico[]>> = {
        [GeneroJogador.MASCULINO]: {
          [NivelJogador.INICIANTE]: [],
          [NivelJogador.INTERMEDIARIO]: [],
          [NivelJogador.AVANCADO]: [],
        },
        [GeneroJogador.FEMININO]: {
          [NivelJogador.INICIANTE]: [],
          [NivelJogador.INTERMEDIARIO]: [],
          [NivelJogador.AVANCADO]: [],
        },
        [GeneroJogador.MISTO]: {
          [NivelJogador.INICIANTE]: [],
          [NivelJogador.INTERMEDIARIO]: [],
          [NivelJogador.AVANCADO]: [],
        },
      };

      const contadores: Record<GeneroJogador, Record<NivelJogador, number>> = {
        [GeneroJogador.MASCULINO]: {
          [NivelJogador.INICIANTE]: 0,
          [NivelJogador.INTERMEDIARIO]: 0,
          [NivelJogador.AVANCADO]: 0,
        },
        [GeneroJogador.FEMININO]: {
          [NivelJogador.INICIANTE]: 0,
          [NivelJogador.INTERMEDIARIO]: 0,
          [NivelJogador.AVANCADO]: 0,
        },
        [GeneroJogador.MISTO]: {
          [NivelJogador.INICIANTE]: 0,
          [NivelJogador.INTERMEDIARIO]: 0,
          [NivelJogador.AVANCADO]: 0,
        },
      };

      // Buscar todos os rankings em paralelo (6 chamadas: 2 gêneros x 3 níveis)
      const promises: Promise<{ genero: GeneroJogador; nivel: NivelJogador; ranking: JogadorPublico[] }>[] = [];

      for (const genero of generos) {
        for (const nivel of niveis) {
          promises.push(
            arenaPublicService
              .buscarRanking(arenaSlug, 999, genero, nivel)
              .then((ranking) => ({ genero, nivel, ranking }))
          );
        }
      }

      const results = await Promise.all(promises);

      // Preencher o cache com os resultados
      for (const { genero, nivel, ranking } of results) {
        data[genero][nivel] = ranking;
        contadores[genero][nivel] = ranking.length;
      }

      // Atualizar cache global
      globalCache = {
        data,
        contadores,
        timestamp: Date.now(),
        arenaSlug,
      };

      lastRefreshRef.current = Date.now();
      setIsLoaded(true);
      forceUpdate((n) => n + 1);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar ranking");
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [arenaSlug, arenaPublicService]);

  /**
   * Carrega o cache inicial se necessário
   */
  useEffect(() => {
    if (!arenaSlug) return;

    // Se cache existe e é válido, apenas marcar como carregado
    if (isCacheValid()) {
      setIsLoaded(true);
      return;
    }

    // Carregar dados do ranking
    loadAllRankingData();
  }, [arenaSlug, isCacheValid, loadAllRankingData]);

  /**
   * Listener para mudança de visibilidade da aba
   * Recarrega quando o usuário volta para a aba após um tempo
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && arenaSlug) {
        const now = Date.now();
        const timeSinceLastRefresh = now - lastRefreshRef.current;

        // Se passaram mais de 30 segundos desde o último refresh, recarregar
        if (timeSinceLastRefresh > 30000) {
          loadAllRankingData();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [arenaSlug, loadAllRankingData]);

  /**
   * Obtém o ranking do cache para um gênero e nível específicos
   */
  const getRanking = useCallback(
    (genero: GeneroJogador, nivel: NivelJogador): JogadorPublico[] => {
      if (!globalCache || globalCache.arenaSlug !== arenaSlug) {
        return [];
      }
      return globalCache.data[genero]?.[nivel] || [];
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [arenaSlug, isLoaded] // isLoaded força recriação quando cache é carregado
  );

  /**
   * Obtém o contador do cache para um gênero e nível específicos
   */
  const getContador = useCallback(
    (genero: GeneroJogador, nivel: NivelJogador): number => {
      if (!globalCache || globalCache.arenaSlug !== arenaSlug) {
        return 0;
      }
      return globalCache.contadores[genero]?.[nivel] || 0;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [arenaSlug, isLoaded] // isLoaded força recriação quando cache é carregado
  );

  /**
   * Força refresh dos dados (invalidando cache)
   */
  const refresh = useCallback(async () => {
    globalCache = null;
    await loadAllRankingData();
  }, [loadAllRankingData]);

  return {
    getRanking,
    getContador,
    loading,
    error,
    isLoaded,
    refresh,
  };
};

/**
 * Função para invalidar o cache externamente
 * Pode ser chamada quando uma etapa é finalizada, por exemplo
 */
export const invalidateRankingCache = () => {
  globalCache = null;
};

export default useRankingCache;
