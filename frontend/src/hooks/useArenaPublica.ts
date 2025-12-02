/**
 * useArenaPublica.ts
 *
 * Responsabilidade única: Gerenciar estado e busca de dados da arena pública
 */

import { useState, useEffect } from "react";
import {
  ArenaPublica,
  EtapaPublica,
  arenaPublicService,
} from "../services/arenaPublicService";
import logger from "../utils/logger";

interface UseArenaPublicaReturn {
  arena: ArenaPublica | null;
  etapas: EtapaPublica[];
  loading: boolean;
  error: string;
}

/**
 * Hook para carregar dados públicos da arena
 */
export const useArenaPublica = (slug?: string): UseArenaPublicaReturn => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [arena, setArena] = useState<ArenaPublica | null>(null);
  const [etapas, setEtapas] = useState<EtapaPublica[]>([]);

  useEffect(() => {
    const fetchArenaData = async () => {
      if (!slug) {
        setError("Arena não encontrada");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        // Buscar arena pública
        const arenaData = await arenaPublicService.buscarArena(slug);
        setArena(arenaData);

        // Buscar etapas públicas
        const etapasData = await arenaPublicService.listarEtapas(slug);
        setEtapas(etapasData);
      } catch (err: any) {
        logger.error("Erro ao carregar arena pública", { slug }, err);
        setError(err.message || "Erro ao carregar informações da arena");
      } finally {
        setLoading(false);
      }
    };

    fetchArenaData();
  }, [slug]);

  return {
    arena,
    etapas,
    loading,
    error,
  };
};

export default useArenaPublica;
