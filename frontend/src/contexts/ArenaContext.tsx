/**
 * ArenaContext.tsx - VERSÃO REFATORADA
 *
 * Responsabilidade única: Gerenciar estado da arena atual
 *
 * Lógica de roteamento movida para hooks/useArenaLoader.ts
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
 * Gerencia a arena atual baseado na URL
 */
export const ArenaProvider: React.FC<ArenaProviderProps> = ({ children }) => {
  const [arena, setArena] = useState<Arena | null>(null);
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
   */
  const fetchMyArena = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const arenaAdminService = getArenaAdminService();
      const arenaData = await arenaAdminService.obterMinhaArena();

      if (!arenaData) {
        setError("Arena não encontrada");
        setArena(null);
        return;
      }

      setArena(arenaData);
    } catch (err: any) {
      logger.error("Erro ao carregar arena do admin", {}, err);
      setError(err.message || "Erro ao carregar arena");
      setArena(null);
    } finally {
      setLoading(false);
    }
  }, []);

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
    loading,
    error,
    setArena,
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
