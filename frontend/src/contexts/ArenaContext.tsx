import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useLocation } from "react-router-dom";
import { Arena, ArenaContextType } from "../types";
import { arenaService } from "../services/arenaService";
import { useAuth } from "./AuthContext"; // ✅ NOVO

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
  const location = useLocation();
  const { user } = useAuth(); // ✅ NOVO: Pegar usuário autenticado

  /**
   * Extrair slug da arena da URL
   * Exemplo: /arena/arenaazul -> arenaazul
   */
  const extractArenaSlug = (pathname: string): string | null => {
    const match = pathname.match(/^\/arena\/([^\/]+)/);
    return match ? match[1] : null;
  };

  /**
   * Buscar arena pelo slug (rotas públicas)
   */
  const fetchArenaBySlug = async (slug: string) => {
    try {
      setLoading(true);
      setError(null);

      console.log("🔍 Buscando arena pelo slug:", slug);

      const arenaData = await arenaService.getBySlug(slug);

      if (!arenaData) {
        setError("Arena não encontrada");
        setArena(null);
        return;
      }

      console.log("✅ Arena carregada (slug):", arenaData);
      setArena(arenaData);
    } catch (err: any) {
      console.error("❌ Erro ao carregar arena:", err);
      setError(err.message || "Erro ao carregar arena");
      setArena(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * ✅ NOVO: Buscar arena do admin logado (rotas admin)
   */
  const fetchMyArena = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("🔍 Buscando arena do admin logado...");

      const arenaData = await arenaService.getMyArena();

      if (!arenaData) {
        setError("Arena não encontrada");
        setArena(null);
        return;
      }

      console.log("✅ Arena carregada (admin):", arenaData);
      setArena(arenaData);
    } catch (err: any) {
      console.error("❌ Erro ao carregar arena:", err);
      setError(err.message || "Erro ao carregar arena");
      setArena(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Observar mudanças na URL e carregar arena correspondente
   */
  useEffect(() => {
    const slug = extractArenaSlug(location.pathname);

    if (slug) {
      // ✅ Rota pública com slug: /arena/:slug
      fetchArenaBySlug(slug);
    } else if (location.pathname.startsWith("/admin") && user) {
      // ✅ NOVO: Rota admin: buscar arena do admin logado
      fetchMyArena();
    } else {
      // Não está em uma rota de arena
      setArena(null);
      setLoading(false);
    }
  }, [location.pathname, user]); // ✅ Adicionar user como dependência

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
