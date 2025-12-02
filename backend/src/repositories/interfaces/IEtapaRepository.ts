/**
 * IEtapaRepository.ts
 * Interface do repository de Etapa
 */

import {
  Etapa,
  CriarEtapaDTO,
  AtualizarEtapaDTO,
  FiltrosEtapa,
  ListagemEtapas,
  StatusEtapa,
  EstatisticasEtapa,
} from "../../models/Etapa";
import { IBaseRepository } from "./IBaseRepository";

/**
 * Interface do repository de Etapa
 */
export interface IEtapaRepository
  extends IBaseRepository<Etapa, CriarEtapaDTO & { arenaId: string; criadoPor: string }, AtualizarEtapaDTO> {
  /**
   * Buscar etapa por ID com validação de arena
   */
  buscarPorIdEArena(id: string, arenaId: string): Promise<Etapa | null>;

  /**
   * Listar etapas com filtros e paginação
   */
  listar(filtros: FiltrosEtapa): Promise<ListagemEtapas>;

  /**
   * Buscar etapas por status
   */
  buscarPorStatus(arenaId: string, status: StatusEtapa): Promise<Etapa[]>;

  /**
   * Buscar etapas ativas (não finalizadas)
   */
  buscarAtivas(arenaId: string): Promise<Etapa[]>;

  /**
   * Atualizar status da etapa
   */
  atualizarStatus(id: string, status: StatusEtapa): Promise<Etapa>;

  /**
   * Marcar chaves como geradas
   */
  marcarChavesGeradas(id: string, geradas: boolean): Promise<void>;

  /**
   * Incrementar total de inscritos
   */
  incrementarInscritos(id: string, jogadorId: string): Promise<void>;

  /**
   * Decrementar total de inscritos
   */
  decrementarInscritos(id: string, jogadorId: string): Promise<void>;

  /**
   * Definir campeão da etapa
   */
  definirCampeao(id: string, campeaoId: string, campeaoNome: string): Promise<void>;

  /**
   * Obter estatísticas das etapas de uma arena
   */
  obterEstatisticas(arenaId: string): Promise<EstatisticasEtapa>;

  /**
   * Contar etapas de uma arena
   */
  contar(arenaId: string): Promise<number>;

  /**
   * Verificar se jogador está inscrito
   */
  jogadorInscrito(id: string, jogadorId: string): Promise<boolean>;
}
