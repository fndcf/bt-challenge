/**
 * Hook para renovação automática do token de autenticação
 *
 * O token do Firebase expira em ~1 hora. Este hook:
 * 1. Renova o token automaticamente a cada 50 minutos
 * 2. Renova o token quando a janela ganha foco (usuário volta à aba)
 * 3. Expõe função para renovar manualmente quando necessário
 */

import { useEffect, useCallback, useRef } from "react";
import { auth } from "../config/firebase";
import logger from "../utils/logger";

// Intervalo de renovação: 50 minutos (token expira em ~60 min)
const TOKEN_REFRESH_INTERVAL = 50 * 60 * 1000;

// Tempo mínimo entre renovações para evitar spam (5 minutos)
const MIN_REFRESH_INTERVAL = 5 * 60 * 1000;

interface UseTokenRefreshOptions {
  enabled?: boolean;
  onRefreshError?: (error: Error) => void;
}

interface UseTokenRefreshReturn {
  refreshToken: () => Promise<string | null>;
  isRefreshing: boolean;
}

export const useTokenRefresh = (
  options: UseTokenRefreshOptions = {}
): UseTokenRefreshReturn => {
  const { enabled = true, onRefreshError } = options;
  const lastRefreshRef = useRef<number>(Date.now());
  const isRefreshingRef = useRef<boolean>(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Renova o token do Firebase e atualiza o localStorage
   */
  const refreshToken = useCallback(async (): Promise<string | null> => {
    // Evitar renovações simultâneas
    if (isRefreshingRef.current) {
      logger.debug("Token refresh already in progress, skipping");
      return null;
    }

    // Evitar renovações muito frequentes
    const timeSinceLastRefresh = Date.now() - lastRefreshRef.current;
    if (timeSinceLastRefresh < MIN_REFRESH_INTERVAL) {
      logger.debug("Token refreshed recently, skipping", {
        timeSinceLastRefresh: Math.round(timeSinceLastRefresh / 1000) + "s",
      });
      return localStorage.getItem("authToken");
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      logger.debug("No user logged in, skipping token refresh");
      return null;
    }

    try {
      isRefreshingRef.current = true;

      // Força a renovação do token (true = forceRefresh)
      const newToken = await currentUser.getIdToken(true);
      localStorage.setItem("authToken", newToken);
      lastRefreshRef.current = Date.now();

      logger.info("Token refreshed successfully", {
        uid: currentUser.uid,
      });

      return newToken;
    } catch (error: any) {
      logger.error("Failed to refresh token", {
        errorCode: error.code,
        errorMessage: error.message,
      });

      // Se o erro for de autenticação, o token é inválido
      if (
        error.code === "auth/user-token-expired" ||
        error.code === "auth/user-disabled" ||
        error.code === "auth/user-not-found"
      ) {
        localStorage.removeItem("authToken");
        onRefreshError?.(error);
      }

      return null;
    } finally {
      isRefreshingRef.current = false;
    }
  }, [onRefreshError]);

  /**
   * Configura o intervalo de renovação automática
   */
  useEffect(() => {
    if (!enabled) return;

    // Renovar imediatamente ao montar (se houver usuário)
    refreshToken();

    // Configurar intervalo de renovação
    intervalRef.current = setInterval(() => {
      refreshToken();
    }, TOKEN_REFRESH_INTERVAL);

    logger.debug("Token refresh interval started", {
      intervalMinutes: TOKEN_REFRESH_INTERVAL / 60000,
    });

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        logger.debug("Token refresh interval cleared");
      }
    };
  }, [enabled, refreshToken]);

  /**
   * Renova o token quando a janela ganha foco
   * (usuário volta à aba após ficar ausente)
   */
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        logger.debug("Window became visible, checking token");
        refreshToken();
      }
    };

    const handleFocus = () => {
      logger.debug("Window gained focus, checking token");
      refreshToken();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [enabled, refreshToken]);

  return {
    refreshToken,
    isRefreshing: isRefreshingRef.current,
  };
};

/**
 * Função utilitária para renovar token fora de componentes React
 * Útil para o interceptor do axios
 */
export const refreshTokenManually = async (): Promise<string | null> => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    return null;
  }

  try {
    const newToken = await currentUser.getIdToken(true);
    localStorage.setItem("authToken", newToken);
    logger.info("Token refreshed manually");
    return newToken;
  } catch (error: any) {
    logger.error("Failed to refresh token manually", {
      errorCode: error.code,
    });
    return null;
  }
};

export default useTokenRefresh;
