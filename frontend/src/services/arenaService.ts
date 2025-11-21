import { apiClient } from "./apiClient";
import { Arena } from "../types";
import { handleError } from "../utils/errorHandler";

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
 * ✅ ATUALIZADO: Suporta campos do backend (ranking e inscricoes)
 */
export interface JogadorPublico {
  id: string;
  nome?: string; // Campo esperado
  jogadorNome?: string; // ✅ Campo real do backend (ranking)
  jogadorId?: string; // ID do jogador
  nivel?: string; // Campo esperado
  jogadorNivel?: string; // ✅ Campo real do backend (ranking)
  genero?: string; // ✅ ADICIONAR - importante para filtrar/exibir
  jogadorGenero?: string; // ✅ ADICIONAR - campo real do backend
  ranking?: number; // Campo esperado (pontos)
  pontos?: number; // ✅ Campo real do backend (ranking)
  seed?: number;
  statusInscricao?: string;
  // Campos adicionais do backend (grupos/ranking)
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
      console.error("Erro ao buscar arena:", error);
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
      console.error("Erro ao buscar arena:", error);
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
      console.error("Erro ao buscar minha arena:", error);
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
      console.error("Erro ao listar arenas:", error);
      return [];
    }
  }

  /**
   * Atualizar arena (admin)
   */
  async update(id: string, data: Partial<Arena>): Promise<Arena> {
    try {
      const arena = await apiClient.put<Arena>(`${this.basePath}/${id}`, data);
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
      console.error("Erro ao verificar slug:", error);
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
   *
   * ✅ CORRIGIDO: apiClient já retorna apenas response.data.data
   */
  async getArenaPublica(slug: string): Promise<Arena> {
    try {
      console.log("🔍 Buscando arena:", slug);

      // apiClient.get já retorna apenas o 'data' do response
      // Então recebemos diretamente: { id, nome, slug, ativa }
      const arena = await apiClient.get<Arena>(`${this.publicPath}/${slug}`);

      console.log("✅ Arena encontrada:", arena);
      return arena;
    } catch (error: any) {
      console.error("❌ Erro ao buscar arena pública:", error);
      throw new Error(error.message || "Arena não encontrada");
    }
  }

  /**
   * Listar etapas públicas de uma arena
   * GET /api/public/:arenaSlug/etapas
   *
   * ✅ CORRIGIDO: apiClient já retorna response.data.data
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

      if (params?.status) {
        queryParams.append("status", params.status);
      }
      if (params?.nivel) {
        // ✅ ADICIONAR
        queryParams.append("nivel", params.nivel);
      }
      if (params?.genero) {
        // ✅ ADICIONAR
        queryParams.append("genero", params.genero);
      }
      if (params?.limite) {
        queryParams.append("limite", params.limite.toString());
      }
      if (params?.offset) {
        queryParams.append("offset", params.offset.toString());
      }

      const url = `${this.publicPath}/${slug}/etapas${
        queryParams.toString() ? `?${queryParams.toString()}` : ""
      }`;

      console.log("🔍 Buscando etapas:", url);

      // apiClient.get já retorna o 'data'
      // Backend retorna: { etapas: [...], total: N }
      const response = await apiClient.get<EtapasResponse>(url);

      console.log("✅ Etapas encontradas:", response.etapas.length);
      return response.etapas;
    } catch (error: any) {
      console.error("❌ Erro ao buscar etapas públicas:", error);
      return [];
    }
  }

  /**
   * Buscar etapa pública específica
   * GET /api/public/:arenaSlug/etapas/:etapaId
   *
   * ✅ CORRIGIDO: apiClient já retorna response.data.data
   */
  async getEtapaPublica(slug: string, etapaId: string): Promise<EtapaPublica> {
    try {
      console.log("🔍 Buscando etapa:", etapaId);

      // apiClient.get já retorna apenas o 'data'
      const etapa = await apiClient.get<EtapaPublica>(
        `${this.publicPath}/${slug}/etapas/${etapaId}`
      );

      console.log("✅ Etapa encontrada:", etapa);
      return etapa;
    } catch (error: any) {
      console.error("❌ Erro ao buscar etapa pública:", error);
      throw new Error(error.message || "Etapa não encontrada");
    }
  }

  /**
   * Buscar jogadores inscritos em uma etapa
   * GET /api/public/:arenaSlug/etapas/:etapaId/inscricoes
   *
   * ✅ CORRIGIDO: Mapeia dados do backend para formato esperado
   */
  async getJogadoresEtapa(
    slug: string,
    etapaId: string
  ): Promise<JogadorPublico[]> {
    try {
      console.log("🔍 Buscando jogadores da etapa:", etapaId);

      // Backend retorna inscrições com campos: jogadorNome, jogadorNivel, etc
      const inscricoes = await apiClient.get<InscricaoBackend[]>(
        `${this.publicPath}/${slug}/etapas/${etapaId}/inscricoes`
      );

      console.log("✅ Inscrições encontradas:", inscricoes.length);

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

      console.log("✅ Jogadores mapeados:", jogadores[0]);
      return jogadores;
    } catch (error: any) {
      console.error("❌ Erro ao buscar jogadores da etapa:", error);
      return [];
    }
  }

  /**
   * Buscar ranking geral da arena
   * GET /api/public/:arenaSlug/ranking
   *
   * ✅ ATUALIZADO: Aceita filtros de gênero e nível
   */
  async getRankingPublico(
    slug: string,
    limite = 50,
    genero?: string,
    nivel?: string
  ): Promise<JogadorPublico[]> {
    try {
      console.log("🔍 Buscando ranking:", { slug, limite, genero, nivel });

      // Construir query params
      const queryParams = new URLSearchParams();
      queryParams.append("limite", limite.toString());

      if (genero) {
        queryParams.append("genero", genero);
      }

      if (nivel) {
        queryParams.append("nivel", nivel);
      }

      const url = `${
        this.publicPath
      }/${slug}/ranking?${queryParams.toString()}`;
      console.log("📡 URL:", url);

      // Backend retorna array direto com jogadorNome, jogadorNivel, pontos
      const ranking = await apiClient.get<JogadorPublico[]>(url);

      console.log("✅ Ranking recebido:", ranking.length, "jogadores");
      if (ranking.length > 0) {
        console.log("📊 Exemplo:", ranking[0]);
      }

      return ranking;
    } catch (error: any) {
      console.error("❌ Erro ao buscar ranking público:", error);
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
      console.error("❌ Erro ao buscar estatísticas públicas:", error);
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
      console.error("❌ Erro ao buscar jogadores públicos:", error);
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
      console.error("❌ Erro ao buscar jogador público:", error);
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
      console.error("❌ Erro ao buscar histórico do jogador:", error);
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
      console.log("📊 Buscando estatísticas agregadas:", { slug, jogadorId });

      const stats = await apiClient.get<EstatisticasAgregadas>(
        `${this.publicPath}/${slug}/jogadores/${jogadorId}/estatisticas`
      );

      console.log("✅ Estatísticas agregadas recebidas:", stats);
      return stats;
    } catch (error: any) {
      console.error("❌ Erro ao buscar estatísticas agregadas:", error);
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
      console.log("🔍 Buscando chaves da etapa:", etapaId);

      const chaves = await apiClient.get<any>(
        `${this.publicPath}/${slug}/etapas/${etapaId}/chaves`
      );

      console.log("✅ Chaves encontradas:", chaves);
      return chaves;
    } catch (error: any) {
      console.error("❌ Erro ao buscar chaves da etapa:", error);
      return null;
    }
  }

  /**
   * Buscar grupos de uma etapa
   * GET /api/public/:arenaSlug/etapas/:etapaId/grupos
   */
  async getGruposEtapa(slug: string, etapaId: string): Promise<any> {
    try {
      console.log("🔍 Buscando grupos da etapa:", etapaId);

      const grupos = await apiClient.get<any>(
        `${this.publicPath}/${slug}/etapas/${etapaId}/grupos`
      );

      console.log("✅ Grupos encontrados:", grupos);
      return grupos;
    } catch (error: any) {
      console.error("❌ Erro ao buscar grupos da etapa:", error);
      return null;
    }
  }
}

export const arenaService = new ArenaService();
