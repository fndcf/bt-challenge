/**
 * Interface do repository de Jogador
 */

import {
  Jogador,
  CriarJogadorDTO,
  AtualizarJogadorDTO,
  FiltrosJogador,
  ListagemJogadores,
  NivelJogador,
  StatusJogador,
  GeneroJogador,
} from "../../models/Jogador";
import { IBaseRepository } from "./IBaseRepository";

/**
 * Interface do repository de Jogador
 */
export interface IJogadorRepository
  extends IBaseRepository<
    Jogador,
    CriarJogadorDTO & { arenaId: string; criadoPor: string },
    AtualizarJogadorDTO
  > {
  /**
   * Buscar jogador por ID com validação de arena
   */
  buscarPorIdEArena(id: string, arenaId: string): Promise<Jogador | null>;

  /**
   * Buscar jogador por nome (exato)
   */
  buscarPorNome(arenaId: string, nome: string): Promise<Jogador | null>;

  /**
   * Listar jogadores com filtros e paginação
   */
  listar(filtros: FiltrosJogador): Promise<ListagemJogadores>;

  /**
   * Buscar jogadores por IDs
   */
  buscarPorIds(ids: string[], arenaId: string): Promise<Jogador[]>;

  /**
   * Buscar jogadores por nível
   */
  buscarPorNivel(arenaId: string, nivel: NivelJogador): Promise<Jogador[]>;

  /**
   * Buscar jogadores por status
   */
  buscarPorStatus(arenaId: string, status: StatusJogador): Promise<Jogador[]>;

  /**
   * Buscar jogadores por gênero
   */
  buscarPorGenero(arenaId: string, genero: GeneroJogador): Promise<Jogador[]>;

  /**
   * Buscar jogadores ativos
   */
  buscarAtivos(arenaId: string): Promise<Jogador[]>;

  /**
   * Atualizar estatísticas do jogador
   */
  atualizarEstatisticas(
    id: string,
    estatisticas: {
      vitorias?: number;
      derrotas?: number;
      pontos?: number;
    }
  ): Promise<void>;

  /**
   * Incrementar vitórias
   */
  incrementarVitorias(id: string): Promise<void>;

  /**
   * Incrementar derrotas
   */
  incrementarDerrotas(id: string): Promise<void>;

  /**
   * Contar jogadores de uma arena
   */
  contar(arenaId: string): Promise<number>;

  /**
   * Contar jogadores por nível
   */
  contarPorNivel(arenaId: string): Promise<Record<NivelJogador, number>>;

  /**
   * Contar jogadores por gênero
   */
  contarPorGenero(arenaId: string): Promise<Record<GeneroJogador, number>>;

  /**
   * Verificar se nome já existe na arena
   */
  nomeExiste(
    arenaId: string,
    nome: string,
    excluirId?: string
  ): Promise<boolean>;
}
