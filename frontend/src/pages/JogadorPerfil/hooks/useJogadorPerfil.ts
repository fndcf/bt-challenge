/**
 * Responsabilidade única: Gerenciar estado e lógica de negócio do perfil do jogador
 */

import { useState, useEffect } from "react";
import {
  JogadorPublico,
  EstatisticasAgregadas,
  ArenaPublica,
} from "@/services/arenaPublicService";
import { getArenaPublicService } from "@/services";
import logger from "@/utils/logger";

export interface UseJogadorPerfilReturn {
  // Estados principais
  loading: boolean;
  error: string;
  arena: ArenaPublica | null;
  jogador: JogadorPublico | null;
  historico: any[];
  estatisticas: EstatisticasAgregadas | null;

  // Dados processados
  nomeJogador: string;
  nivelJogador: string | undefined;
  generoJogador: string | undefined;
  totalEtapas: number;
  totalVitorias: number;
  totalDerrotas: number;
  posicaoAtual: number;

  // Funções utilitárias
  getInitials: (nome: string) => string;
}

export const useJogadorPerfil = (
  slug: string | undefined,
  jogadorId: string | undefined
): UseJogadorPerfilReturn => {
  // Estados principais
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [arena, setArena] = useState<ArenaPublica | null>(null);
  const [jogador, setJogador] = useState<JogadorPublico | null>(null);
  const [historico, setHistorico] = useState<any[]>([]);
  const [estatisticas, setEstatisticas] =
    useState<EstatisticasAgregadas | null>(null);

  /**
   * Helper para pegar o nome do jogador (suporta vários campos)
   */
  const getNomeJogador = (j: JogadorPublico | null): string => {
    if (!j) return "Jogador";
    return (
      j.nome ||
      j.jogadorNome ||
      (j as any).nomeCompleto ||
      (j as any).apelido ||
      "Jogador"
    );
  };

  /**
   * Helper para pegar o nível
   */
  const getNivel = (j: JogadorPublico | null): string | undefined => {
    if (!j) return undefined;
    return j.nivel || j.jogadorNivel || (j as any).categoria;
  };

  /**
   * Helper para pegar o gênero
   */
  const getGenero = (j: JogadorPublico | null): string | undefined => {
    if (!j) return undefined;
    return j.genero || j.jogadorGenero || (j as any).sexo;
  };

  /**
   * Função para gerar iniciais do nome
   */
  const getInitials = (nome: string): string => {
    const parts = nome.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return nome.substring(0, 2).toUpperCase();
  };

  // Dados processados
  const generoJogador = getGenero(jogador);
  const nomeJogador = getNomeJogador(jogador);
  const nivelJogador = getNivel(jogador);
  const totalEtapas = estatisticas?.etapasParticipadas || 0;
  const totalVitorias = estatisticas?.vitorias || 0;
  const totalDerrotas = estatisticas?.derrotas || 0;
  const posicaoAtual = estatisticas?.posicaoRanking || 0;

  /**
   * Carregar dados do perfil
   */
  useEffect(() => {
    const fetchData = async () => {
      if (!slug || !jogadorId) {
        setError("Parâmetros inválidos");
        setLoading(false);
        logger.warn("Parâmetros inválidos", { slug, jogadorId });
        return;
      }

      try {
        setLoading(true);
        setError("");

        logger.info("Carregando perfil do jogador", { slug, jogadorId });

        const arenaPublicService = getArenaPublicService();

        // Buscar arena
        const arenaData = await arenaPublicService.buscarArena(slug);
        setArena(arenaData);
        logger.info("Arena carregada", { arena: arenaData.nome });

        // Buscar jogador
        const jogadorData = await arenaPublicService.buscarJogador(
          slug,
          jogadorId
        );
        if (!jogadorData) {
          throw new Error("Jogador não encontrado");
        }
        setJogador(jogadorData);
        logger.info("Jogador carregado", { jogador: jogadorData.nome });

        // Buscar estatísticas agregadas
        const statsData = await arenaPublicService.buscarEstatisticasJogador(
          slug,
          jogadorId
        );
        setEstatisticas(statsData);
        logger.info("Estatísticas carregadas", statsData);

        // Buscar histórico
        const historicoData = await arenaPublicService.buscarHistoricoJogador(
          slug,
          jogadorId
        );
        setHistorico(historicoData || []);
        logger.info("Histórico carregado", {
          total: historicoData?.length || 0,
        });
      } catch (err: any) {
        const mensagemErro =
          err.message || "Erro ao carregar perfil do jogador";
        setError(mensagemErro);
        logger.error("Erro ao carregar perfil", { slug, jogadorId }, err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug, jogadorId]);

  return {
    // Estados principais
    loading,
    error,
    arena,
    jogador,
    historico,
    estatisticas,

    // Dados processados
    nomeJogador,
    nivelJogador,
    generoJogador,
    totalEtapas,
    totalVitorias,
    totalDerrotas,
    posicaoAtual,

    // Funções utilitárias
    getInitials,
  };
};

export default useJogadorPerfil;
