/**
 * Interface do repository de Grupo
 */

import { Grupo } from "../../models/Grupo";
import { IBaseRepository, IBatchOperations } from "./IBaseRepository";

/**
 * DTO para criar grupo
 */
export interface CriarGrupoDTO {
  etapaId: string;
  arenaId: string;
  nome: string;
  ordem: number;
  duplas?: string[];
  totalDuplas?: number;
}

/**
 * Interface do repository de Grupo
 */
export interface IGrupoRepository
  extends IBaseRepository<Grupo, CriarGrupoDTO, Partial<Grupo>>,
    IBatchOperations<Grupo> {
  /**
   * Buscar grupo por ID com validação de arena
   */
  buscarPorIdEArena(id: string, arenaId: string): Promise<Grupo | null>;

  /**
   * Buscar grupos de uma etapa
   */
  buscarPorEtapa(etapaId: string, arenaId: string): Promise<Grupo[]>;

  /**
   * Buscar grupos de uma etapa ordenados
   */
  buscarPorEtapaOrdenado(etapaId: string, arenaId: string): Promise<Grupo[]>;

  /**
   * Buscar grupos completos (todas partidas finalizadas)
   */
  buscarCompletos(etapaId: string, arenaId: string): Promise<Grupo[]>;

  /**
   * Buscar grupos incompletos
   */
  buscarIncompletos(etapaId: string, arenaId: string): Promise<Grupo[]>;

  /**
   * Adicionar dupla ao grupo
   */
  adicionarDupla(id: string, duplaId: string): Promise<void>;

  /**
   * Remover dupla do grupo
   */
  removerDupla(id: string, duplaId: string): Promise<void>;

  /**
   * Adicionar partida ao grupo
   */
  adicionarPartida(id: string, partidaId: string): Promise<void>;

  /**
   * Incrementar partidas finalizadas
   */
  incrementarPartidasFinalizadas(id: string): Promise<void>;

  /**
   * Decrementar partidas finalizadas
   */
  decrementarPartidasFinalizadas(id: string): Promise<void>;

  /**
   * Marcar grupo como completo
   */
  marcarCompleto(id: string, completo: boolean): Promise<void>;

  /**
   * Definir duplas classificadas
   */
  definirClassificadas(id: string, duplasIds: string[]): Promise<void>;

  /**
   * Atualizar contadores do grupo
   */
  atualizarContadores(
    id: string,
    dados: {
      totalDuplas?: number;
      totalPartidas?: number;
      partidasFinalizadas?: number;
    }
  ): Promise<void>;

  /**
   * Deletar todos os grupos de uma etapa
   */
  deletarPorEtapa(etapaId: string, arenaId: string): Promise<number>;

  /**
   * Contar grupos de uma etapa
   */
  contar(etapaId: string, arenaId: string): Promise<number>;

  /**
   * Verificar se todos os grupos estão completos
   */
  todosCompletos(etapaId: string, arenaId: string): Promise<boolean>;
}
