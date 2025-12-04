/**
 * Interface do repository de ConfrontoEliminatorio
 */

import {
  ConfrontoEliminatorio,
  TipoFase,
  StatusConfrontoEliminatorio,
} from "../../models/Eliminatoria";
import { IBaseRepository, IBatchOperations } from "./IBaseRepository";

/**
 * DTO para criar confronto eliminatório
 */
export interface CriarConfrontoDTO {
  etapaId: string;
  arenaId: string;
  fase: TipoFase;
  ordem: number;
  dupla1Id?: string;
  dupla1Nome?: string;
  dupla1Origem?: string;
  dupla2Id?: string;
  dupla2Nome?: string;
  dupla2Origem?: string;
  status?: StatusConfrontoEliminatorio;
}

/**
 * DTO para registrar resultado do confronto
 */
export interface RegistrarResultadoConfrontoDTO {
  partidaId?: string;
  status: StatusConfrontoEliminatorio;
  vencedoraId: string;
  vencedoraNome: string;
  placar?: string;
}

/**
 * Interface do repository de ConfrontoEliminatorio
 */
export interface IConfrontoEliminatorioRepository
  extends IBaseRepository<
      ConfrontoEliminatorio,
      CriarConfrontoDTO,
      Partial<ConfrontoEliminatorio>
    >,
    IBatchOperations<ConfrontoEliminatorio> {
  /**
   * Buscar confronto por ID com validação de arena
   */
  buscarPorIdEArena(
    id: string,
    arenaId: string
  ): Promise<ConfrontoEliminatorio | null>;

  /**
   * Buscar confrontos de uma etapa
   */
  buscarPorEtapa(
    etapaId: string,
    arenaId: string
  ): Promise<ConfrontoEliminatorio[]>;

  /**
   * Buscar confrontos de uma etapa ordenados
   */
  buscarPorEtapaOrdenado(
    etapaId: string,
    arenaId: string
  ): Promise<ConfrontoEliminatorio[]>;

  /**
   * Buscar confrontos por fase
   */
  buscarPorFase(
    etapaId: string,
    arenaId: string,
    fase: TipoFase
  ): Promise<ConfrontoEliminatorio[]>;

  /**
   * Buscar confrontos por fase ordenados
   */
  buscarPorFaseOrdenado(
    etapaId: string,
    arenaId: string,
    fase: TipoFase
  ): Promise<ConfrontoEliminatorio[]>;

  /**
   * Buscar confrontos por status
   */
  buscarPorStatus(
    etapaId: string,
    arenaId: string,
    status: StatusConfrontoEliminatorio
  ): Promise<ConfrontoEliminatorio[]>;

  /**
   * Buscar confrontos de uma dupla
   */
  buscarPorDupla(
    etapaId: string,
    duplaId: string
  ): Promise<ConfrontoEliminatorio[]>;

  /**
   * Buscar confrontos finalizados de uma fase
   */
  buscarFinalizadosPorFase(
    etapaId: string,
    arenaId: string,
    fase: TipoFase
  ): Promise<ConfrontoEliminatorio[]>;

  /**
   * Buscar confrontos pendentes de uma fase
   */
  buscarPendentesPorFase(
    etapaId: string,
    arenaId: string,
    fase: TipoFase
  ): Promise<ConfrontoEliminatorio[]>;

  /**
   * Registrar resultado do confronto
   */
  registrarResultado(
    id: string,
    resultado: RegistrarResultadoConfrontoDTO
  ): Promise<ConfrontoEliminatorio>;

  /**
   * Atualizar duplas do confronto (para próxima fase)
   */
  atualizarDuplas(
    id: string,
    dados: {
      dupla1Id?: string;
      dupla1Nome?: string;
      dupla1Origem?: string;
      dupla2Id?: string;
      dupla2Nome?: string;
      dupla2Origem?: string;
    }
  ): Promise<void>;

  /**
   * Limpar resultado do confronto
   */
  limparResultado(id: string): Promise<void>;

  /**
   * Definir próximo confronto
   */
  definirProximoConfronto(
    id: string,
    proximoConfrontoId: string
  ): Promise<void>;

  /**
   * Deletar todos os confrontos de uma etapa
   */
  deletarPorEtapa(etapaId: string, arenaId: string): Promise<number>;

  /**
   * Deletar confrontos de uma fase
   */
  deletarPorFase(
    etapaId: string,
    arenaId: string,
    fase: TipoFase
  ): Promise<number>;

  /**
   * Contar confrontos de uma etapa
   */
  contar(etapaId: string, arenaId: string): Promise<number>;

  /**
   * Contar confrontos por fase
   */
  contarPorFase(
    etapaId: string,
    arenaId: string,
    fase: TipoFase
  ): Promise<number>;

  /**
   * Verificar se todos os confrontos de uma fase estão finalizados
   */
  faseCompleta(
    etapaId: string,
    arenaId: string,
    fase: TipoFase
  ): Promise<boolean>;

  /**
   * Buscar vencedores de uma fase
   */
  buscarVencedoresPorFase(
    etapaId: string,
    arenaId: string,
    fase: TipoFase
  ): Promise<
    Array<{
      id: string;
      nome: string;
      origem: string;
      ordem: number;
      confrontoId: string;
    }>
  >;
}
