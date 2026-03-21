/**
 * Responsabilidade única: Gerenciar estado da arena atual e lista de arenas do admin
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { ArenaContextType } from "../types";
import { Arena } from "../types/arena";
import { useArenaLoader } from "../hooks/useArenaLoader";
import logger from "../utils/logger";
import { getArenaAdminService } from "@/services";

const ArenaContext = createContext<ArenaContextType | undefined>(undefined);

interface ArenaProviderProps {
  children: ReactNode;
}

/**
 * Provider de Arena
 * Gerencia a arena atual e lista de arenas do admin
 */
export const ArenaProvider: React.FC<ArenaProviderProps> = ({ children }) => {
  const [arena, setArena] = useState<Arena | null>(null);
  const [arenas, setArenas] = useState<Arena[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Buscar arena pelo slug (rotas públicas)
   */
  const fetchArenaBySlug = useCallback(async (slug: string) => {
    try {
      setLoading(true);
      setError(null);

      const arenaAdminService = getArenaAdminService();
      const arenaData = await arenaAdminService.buscarPorSlug(slug);

      if (!arenaData) {
        setError("Arena não encontrada");
        setArena(null);
        return;
      }

      setArena(arenaData);
    } catch (err: any) {
      logger.error("Erro ao carregar arena por slug", { slug }, err);
      setError(err.message || "Erro ao carregar arena");
      setArena(null);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Buscar arena do admin logado (rotas admin)
   * Carrega todas as arenas e seleciona a default
   */
  const fetchMyArena = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const arenaAdminService = getArenaAdminService();
      const { arenas: adminArenas, defaultArenaId } =
        await arenaAdminService.obterMinhasArenas();

      if (adminArenas.length === 0) {
        // Fallback: tentar endpoint antigo /me
        const arenaData = await arenaAdminService.obterMinhaArena();
        if (arenaData) {
          setArena(arenaData);
          setArenas([arenaData]);
          localStorage.setItem("selectedArenaId", arenaData.id);
        } else {
          setError("Arena não encontrada");
          setArena(null);
        }
        return;
      }

      setArenas(adminArenas);

      // Selecionar arena ativa
      const savedArenaId = localStorage.getItem("selectedArenaId");
      const activeArena =
        adminArenas.find((a) => a.id === savedArenaId) ||
        adminArenas.find((a) => a.id === defaultArenaId) ||
        adminArenas[0];

      setArena(activeArena);
      localStorage.setItem("selectedArenaId", activeArena.id);
    } catch (err: any) {
      logger.error("Erro ao carregar arenas do admin", {}, err);
      setError(err.message || "Erro ao carregar arena");
      setArena(null);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Carregar lista de arenas do admin
   */
  const loadArenas = useCallback(async () => {
    try {
      const arenaAdminService = getArenaAdminService();
      const { arenas: adminArenas } = await arenaAdminService.obterMinhasArenas();
      setArenas(adminArenas);
    } catch (err: any) {
      logger.error("Erro ao recarregar arenas", {}, err);
    }
  }, []);

  /**
   * Trocar arena ativa
   */
  const switchArena = useCallback(
    async (arenaId: string) => {
      try {
        const arenaAdminService = getArenaAdminService();
        await arenaAdminService.trocarArena(arenaId);

        const novaArena = arenas.find((a) => a.id === arenaId);
        if (novaArena) {
          setArena(novaArena);
          localStorage.setItem("selectedArenaId", arenaId);
        }

        // Recarregar página para atualizar dados
        window.location.reload();
      } catch (err: any) {
        logger.error("Erro ao trocar arena", { arenaId }, err);
        throw err;
      }
    },
    [arenas]
  );

  /**
   * Criar arena adicional
   */
  const createArena = useCallback(
    async (nome: string, slug?: string): Promise<Arena> => {
      const arenaAdminService = getArenaAdminService();
      const novaArena = await arenaAdminService.criarArenaAdicional(nome, slug);

      // Atualizar lista e selecionar nova arena
      setArenas((prev) => [...prev, novaArena]);
      setArena(novaArena);
      localStorage.setItem("selectedArenaId", novaArena.id);

      return novaArena;
    },
    []
  );

  /**
   * Limpar arena (quando não está em rota de arena)
   */
  const clearArena = useCallback(() => {
    setArena(null);
    setLoading(false);
  }, []);

  /**
   * Hook que observa mudanças na URL e carrega arena correspondente
   */
  useArenaLoader({
    onPublicArena: fetchArenaBySlug,
    onAdminArena: fetchMyArena,
    onNoArena: clearArena,
  });

  const value: ArenaContextType = {
    arena,
    arenas,
    loading,
    error,
    setArena,
    switchArena,
    createArena,
    loadArenas,
  };

  return (
    <ArenaContext.Provider value={value}>{children}</ArenaContext.Provider>
  );
};

/**
 * Hook para usar o contexto de arena
 */
export const useArena = (): ArenaContextType => {
  const context = useContext(ArenaContext);
  if (context === undefined) {
    throw new Error("useArena deve ser usado dentro de um ArenaProvider");
  }
  return context;
};
