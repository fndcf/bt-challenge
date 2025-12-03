/**
 * useEtapaDetalhe.ts
 *
 * Responsabilidade única: Gerenciar estado e dados da página de detalhes da etapa
 *
 * SOLID aplicado:
 * - SRP: Hook único com responsabilidade de gerenciar dados da etapa
 * - DIP: Depende de abstrações (arenaPublicService), não de implementações
 */

import { useState, useEffect } from "react";
import {
  ArenaPublica,
  arenaPublicService,
  EtapaPublica,
  JogadorPublico,
} from "@/services/arenaPublicService";

export interface UseEtapaDetalheReturn {
  // Dados
  arena: ArenaPublica | null;
  etapa: EtapaPublica | null;
  jogadores: JogadorPublico[];
  chaves: any;
  grupos: any[];

  // Estado
  loading: boolean;
  error: string;
}

export const useEtapaDetalhe = (
  slug: string | undefined,
  etapaId: string | undefined
): UseEtapaDetalheReturn => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [arena, setArena] = useState<ArenaPublica | null>(null);
  const [etapa, setEtapa] = useState<EtapaPublica | null>(null);
  const [jogadores, setJogadores] = useState<JogadorPublico[]>([]);
  const [chaves, setChaves] = useState<any>(null);
  const [grupos, setGrupos] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!slug || !etapaId) {
        setError("Parâmetros inválidos");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        // Buscar arena
        const arenaData = await arenaPublicService.buscarArena(slug);
        setArena(arenaData);

        // Buscar etapa
        const etapaData = await arenaPublicService.buscarEtapa(slug, etapaId);
        setEtapa(etapaData);

        // Buscar jogadores inscritos
        const jogadoresData = await arenaPublicService.buscarInscritosEtapa(
          slug,
          etapaId
        );
        setJogadores(jogadoresData);

        // Buscar grupos (se existirem)
        const gruposData = await arenaPublicService.buscarGruposEtapa(
          slug,
          etapaId
        );
        setGrupos(gruposData || []);

        // Buscar chaves (se existirem)
        const chavesData = await arenaPublicService.buscarChavesEtapa(
          slug,
          etapaId
        );
        setChaves(chavesData);
      } catch (err: any) {
        setError(err.message || "Erro ao carregar detalhes da etapa");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug, etapaId]);

  return {
    // Dados
    arena,
    etapa,
    jogadores,
    chaves,
    grupos,

    // Estado
    loading,
    error,
  };
};
