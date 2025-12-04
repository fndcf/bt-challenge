/**
 * arenaPublicService.ts
 * Service para operações PÚBLICAS de Arena (sem autenticação)
 *
 * Responsabilidade única: Consulta de dados públicos para visitantes
 * Usado nas páginas públicas da arena (ranking, etapas, jogadores)
 */

import { apiClient } from "./apiClient";
import logger from "../utils/logger";
import { IArenaPublicService } from "./interfaces/IArenaPublicService";

// ============================================
// TIPOS
// ============================================

export interface EtapaPublica {
  id: string;
  numero: number;
  nome: string;
  descricao?: string;
  dataRealizacao: string;
  status: "planejada" | "aberta" | "em_andamento" | "finalizada";
  formato: string;
  arenaId: string;
  totalJogadores?: number;
  nivel?: string;
  genero?: string;
}

export interface JogadorPublico {
  id: string;
  nome?: string;
  jogadorNome?: string;
  jogadorId?: string;
  nivel?: string;
  jogadorNivel?: string;
  genero?: string;
  jogadorGenero?: string;
  ranking?: number;
  pontos?: number;
  seed?: number;
  statusInscricao?: string;
  etapaId?: string;
  arenaId?: string;
  grupoId?: string;
  grupoNome?: string;
  vitorias?: number;
  derrotas?: number;
  saldoGames?: number;
  classificado?: boolean;
  etapasParticipadas?: number;
}

export interface EstatisticasAgregadas {
  jogadorId: string;
  jogadorNome: string;
  jogadorNivel?: string;
  jogadorGenero?: string;
  arenaId?: string;
  etapasParticipadas: number;
  jogos: number;
  vitorias: number;
  derrotas: number;
  pontos: number;
  posicaoRanking: number;
  setsVencidos: number;
  setsPerdidos: number;
  gamesVencidos: number;
  gamesPerdidos: number;
  saldoSets: number;
  saldoGames: number;
}

export interface ArenaPublica {
  id: string;
  nome: string;
  slug: string;
  descricao?: string;
  logoUrl?: string;
  corPrimaria?: string;
  corSecundaria?: string;
}

export interface FiltrosEtapasPublicas {
  status?: string;
  nivel?: string;
  genero?: string;
  limite?: number;
  offset?: number;
}

export interface FiltrosJogadoresPublicos {
  nivel?: string;
  status?: string;
  genero?: string;
  busca?: string;
  limite?: number;
  offset?: number;
}

// ============================================
// TIPOS INTERNOS
// ============================================

interface InscricaoBackend {
  id: string;
  etapaId: string;
  arenaId: string;
  jogadorId: string;
  jogadorNome: string;
  jogadorNivel?: string;
  jogadorGenero?: string;
  status: string;
  seed?: number;
  duplaId?: string | null;
  parceiroId?: string | null;
  parceiroNome?: string | null;
  grupoId?: string | null;
  grupoNome?: string | null;
}

// ============================================
// SERVICE
// ============================================

class ArenaPublicService implements IArenaPublicService {
  private readonly basePath = "/public";

  // ============================================
  // ARENA
  // ============================================

  /**
   * Buscar dados públicos da arena
   */
  async buscarArena(slug: string): Promise<ArenaPublica> {
    try {
      const arena = await apiClient.get<ArenaPublica>(
        `${this.basePath}/${slug}`
      );
      return arena;
    } catch (error: any) {
      logger.error("Erro ao buscar arena pública", { slug }, error);
      throw new Error(error.message || "Arena não encontrada");
    }
  }

  /**
   * Buscar estatísticas gerais da arena
   */
  async buscarEstatisticas(slug: string): Promise<any> {
    try {
      const estatisticas = await apiClient.get<any>(
        `${this.basePath}/${slug}/estatisticas`
      );
      return estatisticas;
    } catch (error: any) {
      logger.error("Erro ao buscar estatísticas da arena", { slug }, error);
      return null;
    }
  }

  // ============================================
  // ETAPAS
  // ============================================

  /**
   * Listar etapas públicas
   */
  async listarEtapas(
    slug: string,
    filtros?: FiltrosEtapasPublicas
  ): Promise<EtapaPublica[]> {
    try {
      const params = new URLSearchParams();

      if (filtros?.status) params.append("status", filtros.status);
      if (filtros?.nivel) params.append("nivel", filtros.nivel);
      if (filtros?.genero) params.append("genero", filtros.genero);
      if (filtros?.limite) params.append("limite", filtros.limite.toString());
      if (filtros?.offset) params.append("offset", filtros.offset.toString());

      const queryString = params.toString();
      const url = `${this.basePath}/${slug}/etapas${
        queryString ? `?${queryString}` : ""
      }`;

      const response = await apiClient.get<{
        etapas: EtapaPublica[];
        total: number;
      }>(url);

      return response.etapas;
    } catch (error: any) {
      logger.error("Erro ao buscar etapas públicas", { slug }, error);
      return [];
    }
  }

  /**
   * Buscar etapa específica
   */
  async buscarEtapa(slug: string, etapaId: string): Promise<EtapaPublica> {
    try {
      const etapa = await apiClient.get<EtapaPublica>(
        `${this.basePath}/${slug}/etapas/${etapaId}`
      );
      return etapa;
    } catch (error: any) {
      logger.error("Erro ao buscar etapa pública", { slug, etapaId }, error);
      throw new Error(error.message || "Etapa não encontrada");
    }
  }

  /**
   * Buscar grupos de uma etapa
   */
  async buscarGruposEtapa(slug: string, etapaId: string): Promise<any> {
    try {
      const grupos = await apiClient.get<any>(
        `${this.basePath}/${slug}/etapas/${etapaId}/grupos`
      );
      return grupos;
    } catch (error: any) {
      logger.error("Erro ao buscar grupos da etapa", { slug, etapaId }, error);
      return null;
    }
  }

  /**
   * Buscar chaves/partidas de uma etapa
   */
  async buscarChavesEtapa(slug: string, etapaId: string): Promise<any> {
    try {
      const chaves = await apiClient.get<any>(
        `${this.basePath}/${slug}/etapas/${etapaId}/chaves`
      );
      return chaves;
    } catch (error: any) {
      logger.error("Erro ao buscar chaves da etapa", { slug, etapaId }, error);
      return null;
    }
  }

  /**
   * Buscar inscritos de uma etapa
   */
  async buscarInscritosEtapa(
    slug: string,
    etapaId: string
  ): Promise<JogadorPublico[]> {
    try {
      const inscricoes = await apiClient.get<InscricaoBackend[]>(
        `${this.basePath}/${slug}/etapas/${etapaId}/inscricoes`
      );

      // Mapear para formato público
      return inscricoes.map((inscricao, index) => ({
        id: inscricao.jogadorId || inscricao.id,
        nome: inscricao.jogadorNome,
        nivel: inscricao.jogadorNivel,
        genero: inscricao.jogadorGenero,
        seed: inscricao.seed || index + 1,
        statusInscricao: inscricao.status,
      }));
    } catch (error: any) {
      logger.error(
        "Erro ao buscar inscritos da etapa",
        { slug, etapaId },
        error
      );
      return [];
    }
  }

  // ============================================
  // RANKING
  // ============================================

  /**
   * Buscar ranking da arena
   */
  async buscarRanking(
    slug: string,
    limite = 50,
    genero?: string,
    nivel?: string
  ): Promise<JogadorPublico[]> {
    try {
      const params = new URLSearchParams();
      params.append("limite", limite.toString());

      if (genero) params.append("genero", genero);
      if (nivel) params.append("nivel", nivel);

      const url = `${this.basePath}/${slug}/ranking?${params.toString()}`;
      const ranking = await apiClient.get<JogadorPublico[]>(url);

      return ranking;
    } catch (error: any) {
      logger.error("Erro ao buscar ranking", { slug }, error);
      return [];
    }
  }

  // ============================================
  // JOGADORES
  // ============================================

  /**
   * Listar jogadores públicos
   */
  async listarJogadores(
    slug: string,
    filtros?: FiltrosJogadoresPublicos
  ): Promise<{ jogadores: JogadorPublico[]; total: number }> {
    try {
      const params = new URLSearchParams();

      if (filtros?.nivel) params.append("nivel", filtros.nivel);
      if (filtros?.status) params.append("status", filtros.status);
      if (filtros?.genero) params.append("genero", filtros.genero);
      if (filtros?.busca) params.append("busca", filtros.busca);
      if (filtros?.limite) params.append("limite", filtros.limite.toString());
      if (filtros?.offset) params.append("offset", filtros.offset.toString());

      const queryString = params.toString();
      const url = `${this.basePath}/${slug}/jogadores${
        queryString ? `?${queryString}` : ""
      }`;

      const response = await apiClient.get<{
        jogadores: JogadorPublico[];
        total: number;
      }>(url);

      return response;
    } catch (error: any) {
      logger.error("Erro ao buscar jogadores públicos", { slug }, error);
      return { jogadores: [], total: 0 };
    }
  }

  /**
   * Buscar jogador específico
   */
  async buscarJogador(
    slug: string,
    jogadorId: string
  ): Promise<JogadorPublico | null> {
    try {
      const jogador = await apiClient.get<JogadorPublico>(
        `${this.basePath}/${slug}/jogadores/${jogadorId}`
      );
      return jogador;
    } catch (error: any) {
      logger.error("Erro ao buscar jogador público", { slug, jogadorId }, error);
      return null;
    }
  }

  /**
   * Buscar histórico de um jogador
   */
  async buscarHistoricoJogador(slug: string, jogadorId: string): Promise<any> {
    try {
      const historico = await apiClient.get<any>(
        `${this.basePath}/${slug}/jogadores/${jogadorId}/historico`
      );
      return historico;
    } catch (error: any) {
      logger.error(
        "Erro ao buscar histórico do jogador",
        { slug, jogadorId },
        error
      );
      return null;
    }
  }

  /**
   * Buscar estatísticas agregadas de um jogador
   */
  async buscarEstatisticasJogador(
    slug: string,
    jogadorId: string
  ): Promise<EstatisticasAgregadas> {
    try {
      const stats = await apiClient.get<EstatisticasAgregadas>(
        `${this.basePath}/${slug}/jogadores/${jogadorId}/estatisticas`
      );
      return stats;
    } catch (error: any) {
      logger.error(
        "Erro ao buscar estatísticas do jogador",
        { slug, jogadorId },
        error
      );

      // Retornar valores zerados em caso de erro
      return {
        jogadorId,
        jogadorNome: "",
        etapasParticipadas: 0,
        jogos: 0,
        vitorias: 0,
        derrotas: 0,
        pontos: 0,
        posicaoRanking: 0,
        setsVencidos: 0,
        setsPerdidos: 0,
        gamesVencidos: 0,
        gamesPerdidos: 0,
        saldoSets: 0,
        saldoGames: 0,
      };
    }
  }
}

// Exportar instância única
export const arenaPublicService = new ArenaPublicService();
export default arenaPublicService;
