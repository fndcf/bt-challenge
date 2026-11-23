/**
 * Interface do repository de EstatisticasJogador
 */

import {
  CriarEstatisticasJogadorDTO,
  EstatisticasJogador,
} from "../../models/EstatisticasJogador";
import { IncrementosDaPartida } from "../../utils/estatisticas";

export type { EstatisticasJogador };

/**
 * DTO para atualizar pontuação em lote
 */
export interface AtualizarPontuacaoEmLoteDTO {
  estatisticaId: string;
  pontos: number;
  colocacao: string;
}

/**
 * Interface do repository de EstatisticasJogador
 */
export interface IEstatisticasJogadorRepository {
  /**
   * Criar estatísticas zeradas
   */
  criar(dto: CriarEstatisticasJogadorDTO): Promise<EstatisticasJogador>;

  /**
   * Criar estatísticas zeradas de vários jogadores
   */
  criarEmLote(
    dtos: CriarEstatisticasJogadorDTO[]
  ): Promise<EstatisticasJogador[]>;

  /**
   * Buscar estatísticas por etapa
   */
  buscarPorEtapa(
    etapaId: string,
    arenaId: string
  ): Promise<EstatisticasJogador[]>;

  /**
   * Buscar estatísticas da arena, de um nível ou de todos
   */
  buscarPorArena(
    arenaId: string,
    nivel?: string
  ): Promise<EstatisticasJogador[]>;

  /**
   * Buscar estatísticas de um jogador em uma etapa
   */
  buscarPorJogadorEEtapa(
    jogadorId: string,
    etapaId: string
  ): Promise<EstatisticasJogador | null>;

  /**
   * Buscar estatísticas de vários jogadores em uma etapa
   */
  buscarPorJogadoresDaEtapa(
    jogadorIds: string[],
    etapaId: string
  ): Promise<EstatisticasJogador[]>;

  /**
   * Buscar todas as estatísticas de um jogador na arena
   */
  buscarPorJogador(
    jogadorId: string,
    arenaId: string
  ): Promise<EstatisticasJogador[]>;

  /**
   * Buscar estatísticas por grupo
   */
  buscarPorGrupo(grupoId: string): Promise<EstatisticasJogador[]>;

  /**
   * Buscar estatísticas por grupo ordenadas por posição
   */
  buscarPorGrupoOrdenado(grupoId: string): Promise<EstatisticasJogador[]>;

  /**
   * Buscar os primeiros colocados de um grupo
   */
  buscarClassificados(
    grupoId: string,
    limite: number
  ): Promise<EstatisticasJogador[]>;

  /**
   * Atualizar estatísticas
   */
  atualizar(
    id: string,
    dados: Partial<EstatisticasJogador>
  ): Promise<EstatisticasJogador>;

  /**
   * Atualizar vários registros
   */
  atualizarEmLote(
    itens: { id: string; dados: Partial<EstatisticasJogador> }[]
  ): Promise<void>;

  /**
   * Somar valores em vários registros. A soma é feita pelo banco: partidas
   * gravadas ao mesmo tempo não se sobrescrevem.
   */
  incrementarEmLote(
    itens: { id: string; incrementos: IncrementosDaPartida }[]
  ): Promise<void>;

  /**
   * Atualizar pontuação em lote
   */
  atualizarPontuacaoEmLote(items: AtualizarPontuacaoEmLoteDTO[]): Promise<void>;

  /**
   * Deletar estatísticas
   */
  deletar(id: string): Promise<void>;

  /**
   * Deletar todas as estatísticas de uma etapa
   */
  deletarPorEtapa(etapaId: string, arenaId: string): Promise<number>;
}
