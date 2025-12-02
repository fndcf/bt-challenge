/**
 * IPartidaRepository.ts
 * Interface do repository de Partida
 */

import { Partida, StatusPartida } from "../../models/Partida";
import { FaseEtapa } from "../../models/Etapa";
import { IBaseRepository, IBatchOperations } from "./IBaseRepository";

/**
 * DTO para criar partida
 */
export interface CriarPartidaDTO {
  etapaId: string;
  arenaId: string;
  fase: FaseEtapa;
  tipo?: "grupos" | "eliminatoria";
  grupoId?: string;
  grupoNome?: string;
  dupla1Id: string;
  dupla1Nome: string;
  dupla2Id: string;
  dupla2Nome: string;
  dataHora?: Date | string;
  quadra?: string;
}

/**
 * DTO para registrar resultado
 */
export interface RegistrarResultadoDTO {
  status: StatusPartida;
  setsDupla1: number;
  setsDupla2: number;
  placar: Array<{
    numero: number;
    gamesDupla1: number;
    gamesDupla2: number;
    vencedorId?: string;
  }>;
  vencedoraId: string;
  vencedoraNome: string;
}

/**
 * Interface do repository de Partida
 */
export interface IPartidaRepository
  extends IBaseRepository<Partida, CriarPartidaDTO, Partial<Partida>>,
    IBatchOperations<Partida> {
  /**
   * Buscar partida por ID com validação de arena
   */
  buscarPorIdEArena(id: string, arenaId: string): Promise<Partida | null>;

  /**
   * Buscar partidas de uma etapa
   */
  buscarPorEtapa(etapaId: string, arenaId: string): Promise<Partida[]>;

  /**
   * Buscar partidas de um grupo
   */
  buscarPorGrupo(grupoId: string): Promise<Partida[]>;

  /**
   * Buscar partidas de um grupo ordenadas
   */
  buscarPorGrupoOrdenado(grupoId: string): Promise<Partida[]>;

  /**
   * Buscar partidas por fase
   */
  buscarPorFase(etapaId: string, arenaId: string, fase: FaseEtapa): Promise<Partida[]>;

  /**
   * Buscar partidas por tipo (grupos ou eliminatória)
   */
  buscarPorTipo(etapaId: string, arenaId: string, tipo: "grupos" | "eliminatoria"): Promise<Partida[]>;

  /**
   * Buscar partidas por status
   */
  buscarPorStatus(etapaId: string, arenaId: string, status: StatusPartida): Promise<Partida[]>;

  /**
   * Buscar partidas de uma dupla
   */
  buscarPorDupla(etapaId: string, duplaId: string): Promise<Partida[]>;

  /**
   * Buscar partidas finalizadas de um grupo
   */
  buscarFinalizadasPorGrupo(grupoId: string): Promise<Partida[]>;

  /**
   * Buscar partidas pendentes de um grupo
   */
  buscarPendentesPorGrupo(grupoId: string): Promise<Partida[]>;

  /**
   * Buscar confronto direto entre duas duplas
   */
  buscarConfrontoDireto(grupoId: string, dupla1Id: string, dupla2Id: string): Promise<Partida | null>;

  /**
   * Registrar resultado da partida
   */
  registrarResultado(id: string, resultado: RegistrarResultadoDTO): Promise<Partida>;

  /**
   * Agendar partida
   */
  agendar(id: string, dataHora: Date | string, quadra?: string): Promise<void>;

  /**
   * Cancelar partida
   */
  cancelar(id: string): Promise<void>;

  /**
   * Deletar todas as partidas de uma etapa
   */
  deletarPorEtapa(etapaId: string, arenaId: string): Promise<number>;

  /**
   * Deletar partidas de um grupo
   */
  deletarPorGrupo(grupoId: string): Promise<number>;

  /**
   * Deletar partidas eliminatórias de uma etapa
   */
  deletarEliminatoriasPorEtapa(etapaId: string, arenaId: string): Promise<number>;

  /**
   * Contar partidas de uma etapa
   */
  contar(etapaId: string, arenaId: string): Promise<number>;

  /**
   * Contar partidas finalizadas de um grupo
   */
  contarFinalizadasPorGrupo(grupoId: string): Promise<number>;

  /**
   * Contar partidas pendentes de uma etapa
   */
  contarPendentes(etapaId: string, arenaId: string): Promise<number>;
}
