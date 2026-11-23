/**
 * Responsabilidade única: Gerenciar estado e dados da página de detalhes da etapa
 */

import { useState, useEffect } from "react";
import {
  ArenaPublica,
  EtapaPublica,
  JogadorPublico,
} from "@/services/arenaPublicService";
import { getArenaPublicService } from "@/services";
import { Chaves, Grupo } from "@/types/etapaPublica";
import { getMensagemErro } from "@/utils/erro";

export interface UseEtapaDetalheReturn {
  // Dados
  arena: ArenaPublica | null;
  etapa: EtapaPublica | null;
  jogadores: JogadorPublico[];
  chaves: Chaves | null;
  grupos: Grupo[];

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
  const [chaves, setChaves] = useState<Chaves | null>(null);
  const [grupos, setGrupos] = useState<Grupo[]>([]);

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

        const arenaPublicService = getArenaPublicService();

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
      } catch (err) {
        setError(getMensagemErro(err, "Erro ao carregar detalhes da etapa"));
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
