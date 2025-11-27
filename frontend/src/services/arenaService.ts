import { apiClient } from "./apiClient";
import { Arena } from "../types";
import { handleError } from "../utils/errorHandler";
import logger from "../utils/logger"; // ← IMPORTAR LOGGER

/**
 * DTO para criar arena
 */
export interface CreateArenaDTO {
  nome: string;
  slug: string;
  adminEmail: string;
  adminPassword: string;
}

/**
 * Resposta da criação de arena
 */
export interface CreateArenaResponse {
  arena: Arena;
  adminUid: string;
  url: string;
}

/**
 * Etapa pública
 */
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

/**
 * Jogador/Inscrição pública
 */
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

  // Totais
  etapasParticipadas: number;
  jogos: number;
  vitorias: number;
  derrotas: number;
  pontos: number;
  posicaoRanking: number;

  // Sets e Games
  setsVencidos: number;
  setsPerdidos: number;
  gamesVencidos: number;
  gamesPerdidos: number;
  saldoSets: number;
  saldoGames: number;
}

/**
 * Inscrição retornada pelo backend
 */
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

/**
 * Resposta das etapas
 */
interface EtapasResponse {
  etapas: EtapaPublica[];
  total: number;
}

/**
 * Resposta dos jogadores
 */
interface JogadoresResponse {
  jogadores: JogadorPublico[];
  total: number;
}

/**
 * Serviço de Arena
 * Gerencia operações relacionadas a arenas
 */
class ArenaService {
  private readonly basePath = "/arenas";
  private readonly publicPath = "/public";

  // ============================================
  // MÉTODOS ADMINISTRATIVOS (com autenticação)
  // ============================================

  /**
   * Criar nova arena
   */
  async create(data: CreateArenaDTO): Promise<CreateArenaResponse> {
    try {
      const response = await apiClient.post<CreateArenaResponse>(
        this.basePath,
        data
      );

      logger.info("Arena criada", {
        arenaId: response.arena.id,
        nome: response.arena.nome,
        slug: response.arena.slug,
        adminUid: response.adminUid,
      });

      return response;
    } catch (error) {
      const appError = handleError(error, "ArenaService.create");
      throw new Error(appError.message);
    }
  }

  /**
   * Buscar arena por slug (admin)
   */
  async getBySlug(slug: string): Promise<Arena | null> {
    try {
      const arena = await apiClient.get<Arena>(`${this.basePath}/slug/${slug}`);
      return arena;
    } catch (error) {
      logger.warn("Erro ao buscar arena por slug - retornando null", { slug });
      return null;
    }
  }

  /**
   * Buscar arena por ID (admin)
   */
  async getById(id: string): Promise<Arena | null> {
    try {
      const arena = await apiClient.get<Arena>(`${this.basePath}/${id}`);
      return arena;
    } catch (error) {
      logger.warn("Erro ao buscar arena por ID - retornando null", { id });
      return null;
    }
  }

  /**
   * Obter minha arena (admin autenticado)
   */
  async getMyArena(): Promise<Arena | null> {
    try {
      const arena = await apiClient.get<Arena>(`${this.basePath}/me`);
      return arena;
    } catch (error) {
      logger.warn("Erro ao buscar minha arena - retornando null");
      return null;
    }
  }

  /**
   * Listar todas as arenas (admin)
   */
  async list(): Promise<Arena[]> {
    try {
      const response = await apiClient.get<{ arenas: Arena[]; total: number }>(
        this.basePath
      );
      return response.arenas;
    } catch (error) {
      logger.warn("Erro ao listar arenas - retornando lista vazia");
      return [];
    }
  }

  /**
   * Atualizar arena (admin)
   */
  async update(id: string, data: Partial<Arena>): Promise<Arena> {
    try {
      const arena = await apiClient.put<Arena>(`${this.basePath}/${id}`, data);

      logger.info("Arena atualizada", {
        arenaId: arena.id,
        nome: arena.nome,
        camposAtualizados: Object.keys(data),
      });

      return arena;
    } catch (error) {
      const appError = handleError(error, "ArenaService.update");
      throw new Error(appError.message);
    }
  }

  /**
   * Desativar arena (admin)
   */
  async deactivate(id: string): Promise<void> {
    try {
      await apiClient.delete(`${this.basePath}/${id}`);

      logger.info("Arena desativada", { arenaId: id });
    } catch (error) {
      const appError = handleError(error, "ArenaService.deactivate");
      throw new Error(appError.message);
    }
  }

  /**
   * Verificar disponibilidade de slug
   */
  async checkSlugAvailability(slug: string): Promise<boolean> {
    try {
      const response = await apiClient.get<{
        slug: string;
        available: boolean;
        message: string;
      }>(`${this.basePath}/check-slug/${slug}`);
      return response.available;
    } catch (error) {
      logger.warn("Erro ao verificar slug - retornando false", { slug });
      return false;
    }
  }

  // ============================================
  // MÉTODOS PÚBLICOS (sem autenticação)
  // Usam /api/public/:arenaSlug
  // ============================================

  /**
   * Buscar arena pública por slug
   * GET /api/public/:arenaSlug
   */
  async getArenaPublica(slug: string): Promise<Arena> {
    try {
      const arena = await apiClient.get<Arena>(`${this.publicPath}/${slug}`);
      return arena;
    } catch (error: any) {
      logger.error("Erro ao buscar arena pública", { slug }, error);
      throw new Error(error.message || "Arena não encontrada");
    }
  }

  /**
   * Listar etapas públicas de uma arena
   * GET /api/public/:arenaSlug/etapas
   */
  async getEtapasPublicas(
    slug: string,
    params?: {
      status?: string;
      nivel?: string;
      genero?: string;
      limite?: number;
      offset?: number;
    }
  ): Promise<EtapaPublica[]> {
    try {
      const queryParams = new URLSearchParams();

      if (params?.status) queryParams.append("status", params.status);
      if (params?.nivel) queryParams.append("nivel", params.nivel);
      if (params?.genero) queryParams.append("genero", params.genero);
      if (params?.limite)
        queryParams.append("limite", params.limite.toString());
      if (params?.offset)
        queryParams.append("offset", params.offset.toString());

      const url = `${this.publicPath}/${slug}/etapas${
        queryParams.toString() ? `?${queryParams.toString()}` : ""
      }`;

      const response = await apiClient.get<EtapasResponse>(url);
      return response.etapas;
    } catch (error: any) {
      logger.error("Erro ao buscar etapas públicas", { slug }, error);
      return [];
    }
  }

  /**
   * Buscar etapa pública específica
   * GET /api/public/:arenaSlug/etapas/:etapaId
   */
  async getEtapaPublica(slug: string, etapaId: string): Promise<EtapaPublica> {
    try {
      const etapa = await apiClient.get<EtapaPublica>(
        `${this.publicPath}/${slug}/etapas/${etapaId}`
      );
      return etapa;
    } catch (error: any) {
      logger.error("Erro ao buscar etapa pública", { slug, etapaId }, error);
      throw new Error(error.message || "Etapa não encontrada");
    }
  }

  /**
   * Buscar jogadores inscritos em uma etapa
   * GET /api/public/:arenaSlug/etapas/:etapaId/inscricoes
   */
  async getJogadoresEtapa(
    slug: string,
    etapaId: string
  ): Promise<JogadorPublico[]> {
    try {
      const inscricoes = await apiClient.get<InscricaoBackend[]>(
        `${this.publicPath}/${slug}/etapas/${etapaId}/inscricoes`
      );

      // Mapear para o formato esperado pelo frontend
      const jogadores: JogadorPublico[] = inscricoes.map(
        (inscricao, index) => ({
          id: inscricao.jogadorId || inscricao.id,
          nome: inscricao.jogadorNome,
          nivel: inscricao.jogadorNivel,
          genero: inscricao.jogadorGenero,
          seed: inscricao.seed || index + 1,
          statusInscricao: inscricao.status,
        })
      );

      return jogadores;
    } catch (error: any) {
      logger.error(
        "Erro ao buscar jogadores da etapa",
        { slug, etapaId },
        error
      );
      return [];
    }
  }

  /**
   * Buscar ranking geral da arena
   * GET /api/public/:arenaSlug/ranking
   */
  async getRankingPublico(
    slug: string,
    limite = 50,
    genero?: string,
    nivel?: string
  ): Promise<JogadorPublico[]> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append("limite", limite.toString());

      if (genero) queryParams.append("genero", genero);
      if (nivel) queryParams.append("nivel", nivel);

      const url = `${
        this.publicPath
      }/${slug}/ranking?${queryParams.toString()}`;
      const ranking = await apiClient.get<JogadorPublico[]>(url);

      return ranking;
    } catch (error: any) {
      logger.error("Erro ao buscar ranking público", { slug }, error);
      return [];
    }
  }

  /**
   * Buscar estatísticas gerais da arena
   * GET /api/public/:arenaSlug/estatisticas
   */
  async getEstatisticasPublicas(slug: string): Promise<any> {
    try {
      const estatisticas = await apiClient.get<any>(
        `${this.publicPath}/${slug}/estatisticas`
      );
      return estatisticas;
    } catch (error: any) {
      logger.error("Erro ao buscar estatísticas públicas", { slug }, error);
      return null;
    }
  }

  /**
   * Listar jogadores públicos de uma arena
   * GET /api/public/:arenaSlug/jogadores
   */
  async getJogadoresPublicos(
    slug: string,
    params?: {
      nivel?: string;
      status?: string;
      genero?: string;
      busca?: string;
      limite?: number;
      offset?: number;
    }
  ): Promise<{ jogadores: JogadorPublico[]; total: number }> {
    try {
      const queryParams = new URLSearchParams();

      if (params?.nivel) queryParams.append("nivel", params.nivel);
      if (params?.status) queryParams.append("status", params.status);
      if (params?.genero) queryParams.append("genero", params.genero);
      if (params?.busca) queryParams.append("busca", params.busca);
      if (params?.limite)
        queryParams.append("limite", params.limite.toString());
      if (params?.offset)
        queryParams.append("offset", params.offset.toString());

      const url = `${this.publicPath}/${slug}/jogadores${
        queryParams.toString() ? `?${queryParams.toString()}` : ""
      }`;

      const response = await apiClient.get<JogadoresResponse>(url);
      return response;
    } catch (error: any) {
      logger.error("Erro ao buscar jogadores públicos", { slug }, error);
      return { jogadores: [], total: 0 };
    }
  }

  /**
   * Buscar jogador público específico
   * GET /api/public/:arenaSlug/jogadores/:jogadorId
   */
  async getJogadorPublico(
    slug: string,
    jogadorId: string
  ): Promise<JogadorPublico | null> {
    try {
      const jogador = await apiClient.get<JogadorPublico>(
        `${this.publicPath}/${slug}/jogadores/${jogadorId}`
      );
      return jogador;
    } catch (error: any) {
      logger.error(
        "Erro ao buscar jogador público",
        { slug, jogadorId },
        error
      );
      return null;
    }
  }

  /**
   * Buscar histórico de um jogador
   * GET /api/public/:arenaSlug/jogadores/:jogadorId/historico
   */
  async getHistoricoJogador(slug: string, jogadorId: string): Promise<any> {
    try {
      const historico = await apiClient.get<any>(
        `${this.publicPath}/${slug}/jogadores/${jogadorId}/historico`
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
   * Buscar estatísticas agregadas de um jogador (todas as etapas)
   * GET /api/public/:arenaSlug/jogadores/:jogadorId/estatisticas
   */
  async getEstatisticasAgregadas(
    slug: string,
    jogadorId: string
  ): Promise<EstatisticasAgregadas> {
    try {
      const stats = await apiClient.get<EstatisticasAgregadas>(
        `${this.publicPath}/${slug}/jogadores/${jogadorId}/estatisticas`
      );
      return stats;
    } catch (error: any) {
      logger.error(
        "Erro ao buscar estatísticas agregadas",
        { slug, jogadorId },
        error
      );

      // Retornar valores zerados em caso de erro
      return {
        jogadorId: jogadorId,
        jogadorNome: "",
        jogadorNivel: undefined,
        jogadorGenero: undefined,
        arenaId: undefined,
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

  /**
   * Buscar chaves/partidas de uma etapa
   * GET /api/public/:arenaSlug/etapas/:etapaId/chaves
   */
  async getChavesEtapa(slug: string, etapaId: string): Promise<any> {
    try {
      const chaves = await apiClient.get<any>(
        `${this.publicPath}/${slug}/etapas/${etapaId}/chaves`
      );
      return chaves;
    } catch (error: any) {
      logger.error("Erro ao buscar chaves da etapa", { slug, etapaId }, error);
      return null;
    }
  }

  /**
   * Buscar grupos de uma etapa
   * GET /api/public/:arenaSlug/etapas/:etapaId/grupos
   */
  async getGruposEtapa(slug: string, etapaId: string): Promise<any> {
    try {
      const grupos = await apiClient.get<any>(
        `${this.publicPath}/${slug}/etapas/${etapaId}/grupos`
      );
      return grupos;
    } catch (error: any) {
      logger.error("Erro ao buscar grupos da etapa", { slug, etapaId }, error);
      return null;
    }
  }
}

export const arenaService = new ArenaService();
