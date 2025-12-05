/**
 * Responsabilidade única: Lógica de carregamento de arena baseado na rota
 */

import { useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface ArenaLoaderConfig {
  onPublicArena: (slug: string) => void;
  onAdminArena: () => void;
  onNoArena: () => void;
}

/**
 * Extrair slug da arena da URL
 * Exemplo: /arena/arenaazul -> arenaazul
 */
export const extractArenaSlug = (pathname: string): string | null => {
  const match = pathname.match(/^\/arena\/([^\/]+)/);
  return match ? match[1] : null;
};

/**
 * Verificar se é rota administrativa
 */
export const isAdminRoute = (pathname: string): boolean => {
  return pathname.startsWith("/admin");
};

/**
 * Hook para carregar arena baseado na rota atual
 */
export const useArenaLoader = (config: ArenaLoaderConfig) => {
  const location = useLocation();
  const { user } = useAuth();

  const { onPublicArena, onAdminArena, onNoArena } = config;

  const loadArena = useCallback(() => {
    const slug = extractArenaSlug(location.pathname);

    if (slug) {
      // Rota pública com slug: /arena/:slug
      onPublicArena(slug);
    } else if (isAdminRoute(location.pathname) && user) {
      // Rota admin: buscar arena do admin logado
      onAdminArena();
    } else {
      // Não está em uma rota de arena
      onNoArena();
    }
  }, [location.pathname, user, onPublicArena, onAdminArena, onNoArena]);

  useEffect(() => {
    loadArena();
  }, [loadArena]);

  return {
    currentPath: location.pathname,
    currentSlug: extractArenaSlug(location.pathname),
    isAdmin: isAdminRoute(location.pathname),
    isAuthenticated: !!user,
  };
};

export default useArenaLoader;
