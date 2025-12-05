/**
 * Interface para serviço de operações públicas de Arena (sem autenticação)
 */

import {
  ArenaPublica,
  EtapaPublica,
  JogadorPublico,
  EstatisticasAgregadas,
  FiltrosEtapasPublicas,
  FiltrosJogadoresPublicos,
} from "@/services/arenaPublicService";

export interface IArenaPublicService {
  /**
   * Buscar dados públicos da arena
   * @param slug - Slug único da arena
   * @returns Promise com dados públicos da arena
   */
  buscarArena(slug: string): Promise<ArenaPublica>;

  /**
   * Buscar estatísticas gerais da arena
   * @param slug - Slug único da arena
   * @returns Promise com estatísticas gerais ou null em caso de erro
   */
  buscarEstatisticas(slug: string): Promise<any>;

  /**
   * Listar etapas públicas da arena
   * @param slug - Slug único da arena
   * @param filtros - Filtros opcionais (status, nivel, genero, paginação)
   * @returns Promise com lista de etapas públicas
   */
  listarEtapas(
    slug: string,
    filtros?: FiltrosEtapasPublicas
  ): Promise<EtapaPublica[]>;

  /**
   * Buscar etapa específica
   * @param slug - Slug único da arena
   * @param etapaId - ID da etapa
   * @returns Promise com dados da etapa
   */
  buscarEtapa(slug: string, etapaId: string): Promise<EtapaPublica>;

  /**
   * Buscar grupos de uma etapa
   * @param slug - Slug único da arena
   * @param etapaId - ID da etapa
   * @returns Promise com dados dos grupos ou null em caso de erro
   */
  buscarGruposEtapa(slug: string, etapaId: string): Promise<any>;

  /**
   * Buscar chaves/partidas de uma etapa
   * @param slug - Slug único da arena
   * @param etapaId - ID da etapa
   * @returns Promise com dados das chaves ou null em caso de erro
   */
  buscarChavesEtapa(slug: string, etapaId: string): Promise<any>;

  /**
   * Buscar inscritos de uma etapa
   * @param slug - Slug único da arena
   * @param etapaId - ID da etapa
   * @returns Promise com lista de jogadores inscritos
   */
  buscarInscritosEtapa(
    slug: string,
    etapaId: string
  ): Promise<JogadorPublico[]>;

  /**
   * Buscar ranking da arena
   * @param slug - Slug único da arena
   * @param limite - Número máximo de jogadores no ranking (padrão: 50)
   * @param genero - Filtro opcional por gênero
   * @param nivel - Filtro opcional por nível
   * @returns Promise com lista de jogadores ranqueados
   */
  buscarRanking(
    slug: string,
    limite?: number,
    genero?: string,
    nivel?: string
  ): Promise<JogadorPublico[]>;

  /**
   * Listar jogadores públicos da arena
   * @param slug - Slug único da arena
   * @param filtros - Filtros opcionais (nivel, status, genero, busca, paginação)
   * @returns Promise com lista paginada de jogadores
   */
  listarJogadores(
    slug: string,
    filtros?: FiltrosJogadoresPublicos
  ): Promise<{ jogadores: JogadorPublico[]; total: number }>;

  /**
   * Buscar jogador específico
   * @param slug - Slug único da arena
   * @param jogadorId - ID do jogador
   * @returns Promise com dados do jogador ou null se não encontrado
   */
  buscarJogador(
    slug: string,
    jogadorId: string
  ): Promise<JogadorPublico | null>;

  /**
   * Buscar histórico de um jogador
   * @param slug - Slug único da arena
   * @param jogadorId - ID do jogador
   * @returns Promise com histórico do jogador ou null em caso de erro
   */
  buscarHistoricoJogador(slug: string, jogadorId: string): Promise<any>;

  /**
   * Buscar estatísticas agregadas de um jogador
   * @param slug - Slug único da arena
   * @param jogadorId - ID do jogador
   * @returns Promise com estatísticas agregadas do jogador
   */
  buscarEstatisticasJogador(
    slug: string,
    jogadorId: string
  ): Promise<EstatisticasAgregadas>;
}
