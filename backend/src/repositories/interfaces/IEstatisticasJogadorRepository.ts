/**
 * IEstatisticasJogadorRepository.ts
 * Interface do repository de EstatisticasJogador
 */

import { IBaseRepository } from "./IBaseRepository";

/**
 * Estrutura de estatísticas do jogador em uma etapa
 */
export interface EstatisticasJogador {
  id: string;
  jogadorId: string;
  jogadorNome: string;
  jogadorNivel?: string;
  jogadorGenero?: string;
  etapaId: string;
  arenaId: string;
  grupoId?: string;
  grupoNome?: string;
  // Estatísticas gerais
  vitorias: number;
  derrotas: number;
  setsVencidos: number;
  setsPerdidos: number;
  pontosFeitos: number;
  pontosSofridos: number;
  saldoSets: number;
  saldoPontos: number;
  // Estatísticas de grupo (Rei da Praia)
  pontosGrupo?: number;
  vitoriasGrupo?: number;
  saldoGamesGrupo?: number;
  saldoSetsGrupo?: number;
  gamesVencidosGrupo?: number;
  // Classificação
  posicaoGrupo?: number;
  pontos?: number;
  colocacao?: string;
  classificado?: boolean;
  // Metadados
  criadoEm: FirebaseFirestore.Timestamp;
  atualizadoEm: FirebaseFirestore.Timestamp;
}

/**
 * DTO para criar estatísticas
 */
export interface CriarEstatisticasJogadorDTO {
  jogadorId: string;
  jogadorNome: string;
  jogadorNivel?: string;
  jogadorGenero?: string;
  etapaId: string;
  arenaId: string;
  grupoId?: string;
  grupoNome?: string;
}

/**
 * DTO para atualizar estatísticas após partida
 */
export interface AtualizarEstatisticasPartidaDTO {
  vitorias?: number;
  derrotas?: number;
  setsVencidos?: number;
  setsPerdidos?: number;
  pontosFeitos?: number;
  pontosSofridos?: number;
}

/**
 * DTO para atualizar pontuação final
 */
export interface AtualizarPontuacaoDTO {
  pontos: number;
  colocacao: string;
}

/**
 * Interface do repository de EstatisticasJogador
 */
export interface IEstatisticasJogadorRepository
  extends Omit<IBaseRepository<EstatisticasJogador, CriarEstatisticasJogadorDTO, Partial<EstatisticasJogador>>, 'listar'> {
  
  /**
   * Buscar estatísticas por etapa
   */
  buscarPorEtapa(etapaId: string, arenaId: string): Promise<EstatisticasJogador[]>;

  /**
   * Buscar estatísticas de um jogador em uma etapa
   */
  buscarPorJogadorEEtapa(jogadorId: string, etapaId: string): Promise<EstatisticasJogador | null>;

  /**
   * Buscar estatísticas por grupo
   */
  buscarPorGrupo(grupoId: string): Promise<EstatisticasJogador[]>;

  /**
   * Buscar estatísticas por grupo ordenadas por posição
   */
  buscarPorGrupoOrdenado(grupoId: string): Promise<EstatisticasJogador[]>;

  /**
   * Atualizar estatísticas após partida
   */
  atualizarEstatisticasPartida(id: string, dados: AtualizarEstatisticasPartidaDTO): Promise<void>;

  /**
   * Incrementar estatísticas (soma aos valores existentes)
   */
  incrementarEstatisticas(id: string, dados: AtualizarEstatisticasPartidaDTO): Promise<void>;

  /**
   * Atualizar posição no grupo
   */
  atualizarPosicaoGrupo(id: string, posicao: number): Promise<void>;

  /**
   * Atualizar pontuação final
   */
  atualizarPontuacao(id: string, dados: AtualizarPontuacaoDTO): Promise<void>;

  /**
   * Atribuir grupo ao jogador
   */
  atribuirGrupo(id: string, grupoId: string, grupoNome: string): Promise<void>;

  /**
   * Deletar todas as estatísticas de uma etapa
   */
  deletarPorEtapa(etapaId: string, arenaId: string): Promise<number>;

  /**
   * Recalcular saldos (setsVencidos - setsPerdidos, etc)
   */
  recalcularSaldos(id: string): Promise<void>;

  /**
   * Zerar estatísticas (para recálculo)
   */
  zerarEstatisticas(id: string): Promise<void>;
}
