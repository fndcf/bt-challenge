/**
 * Interface do repository de Dupla
 */

import { Dupla } from "../../models/Dupla";
import { IBaseRepository, IBatchOperations } from "./IBaseRepository";

/**
 * DTO para criar dupla
 */
export interface CriarDuplaDTO {
  etapaId: string;
  arenaId: string;
  jogador1Id: string;
  jogador1Nome: string;
  jogador1Nivel: string;
  jogador1Genero: string;
  jogador2Id: string;
  jogador2Nome: string;
  jogador2Nivel: string;
  jogador2Genero: string;
  grupoId?: string;
  grupoNome?: string;
}

/**
 * DTO para atualizar estatísticas da dupla
 */
export interface AtualizarEstatisticasDuplaDTO {
  jogos?: number;
  vitorias?: number;
  derrotas?: number;
  pontos?: number;
  setsVencidos?: number;
  setsPerdidos?: number;
  gamesVencidos?: number;
  gamesPerdidos?: number;
  saldoSets?: number;
  saldoGames?: number;
  posicaoGrupo?: number;
  classificada?: boolean;
}

/**
 * Interface do repository de Dupla
 */
export interface IDuplaRepository
  extends IBaseRepository<Dupla, CriarDuplaDTO, Partial<Dupla>>,
    IBatchOperations<Dupla> {
  /**
   * Buscar dupla por ID com validação de arena
   */
  buscarPorIdEArena(id: string, arenaId: string): Promise<Dupla | null>;

  /**
   * Buscar duplas de uma etapa
   */
  buscarPorEtapa(etapaId: string, arenaId: string): Promise<Dupla[]>;

  /**
   * Buscar duplas de um grupo
   */
  buscarPorGrupo(grupoId: string): Promise<Dupla[]>;

  /**
   * Buscar duplas de um grupo ordenadas por posição
   */
  buscarPorGrupoOrdenado(grupoId: string): Promise<Dupla[]>;

  /**
   * Buscar duplas classificadas de uma etapa
   */
  buscarClassificadas(etapaId: string, arenaId: string): Promise<Dupla[]>;

  /**
   * Buscar duplas classificadas de um grupo
   */
  buscarClassificadasPorGrupo(
    grupoId: string,
    limite?: number
  ): Promise<Dupla[]>;

  /**
   * Buscar dupla por jogador
   */
  buscarPorJogador(etapaId: string, jogadorId: string): Promise<Dupla | null>;

  /**
   * Atribuir dupla a um grupo
   */
  atribuirGrupo(id: string, grupoId: string, grupoNome: string): Promise<void>;

  /**
   * Atualizar estatísticas da dupla
   */
  atualizarEstatisticas(
    id: string,
    stats: AtualizarEstatisticasDuplaDTO
  ): Promise<void>;

  /**
   * Atualizar estatísticas usando FieldValue.increment (operações atômicas)
   */
  atualizarEstatisticasComIncrement(
    id: string,
    stats: AtualizarEstatisticasDuplaDTO
  ): Promise<void>;

  /**
   * Incrementar estatísticas após partida
   */
  registrarResultadoPartida(
    id: string,
    venceu: boolean,
    setsVencidos: number,
    setsPerdidos: number,
    gamesVencidos: number,
    gamesPerdidos: number
  ): Promise<void>;

  /**
   * Atualizar posição no grupo
   */
  atualizarPosicaoGrupo(id: string, posicao: number): Promise<void>;

  /**
   * Marcar como classificada
   */
  marcarClassificada(id: string, classificada: boolean): Promise<void>;

  /**
   * Deletar todas as duplas de uma etapa
   */
  deletarPorEtapa(etapaId: string, arenaId: string): Promise<number>;

  /**
   * Contar duplas de uma etapa
   */
  contar(etapaId: string, arenaId: string): Promise<number>;

  /**
   * Contar duplas de um grupo
   */
  contarPorGrupo(grupoId: string): Promise<number>;
}
