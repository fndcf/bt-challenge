/**
 * IPartidaReiDaPraiaRepository.ts
 * Interface do repository de Partida Rei da Praia
 *
 * CORREÇÃO v2: DTO de resultado agora inclui placar e vencedores
 */

import { IBaseRepository, IBatchOperations } from "./IBaseRepository";
import { StatusPartida } from "../../models/Partida";
import { FaseEtapa } from "../../models/Etapa";

/**
 * Estrutura de partida Rei da Praia
 * (4 jogadores individuais formando 2 duplas temporárias)
 */
export interface PartidaReiDaPraia {
  id: string;
  etapaId: string;
  arenaId: string;
  fase: FaseEtapa;
  grupoId?: string;
  grupoNome?: string;
  // Dupla 1 (jogadores A e B)
  jogador1AId: string;
  jogador1ANome: string;
  jogador1BId: string;
  jogador1BNome: string;
  dupla1Nome: string;
  // Dupla 2 (jogadores C e D)
  jogador2AId: string;
  jogador2ANome: string;
  jogador2BId: string;
  jogador2BNome: string;
  dupla2Nome: string;
  // Resultado
  status: StatusPartida;
  setsDupla1: number;
  setsDupla2: number;
  sets?: Array<{
    pontosDupla1: number;
    pontosDupla2: number;
  }>;
  placar?: Array<{
    numero: number;
    gamesDupla1: number;
    gamesDupla2: number;
    vencedorId?: string;
  }>;
  vencedorDupla?: 1 | 2;
  vencedores?: string[]; // IDs dos jogadores vencedores
  vencedoresNomes?: string;
  // Para fase eliminatória
  confrontoId?: string;
  // Metadados
  criadoEm: FirebaseFirestore.Timestamp;
  atualizadoEm: FirebaseFirestore.Timestamp;
  finalizadoEm?: FirebaseFirestore.Timestamp;
}

/**
 * DTO para criar partida
 */
export interface CriarPartidaReiDaPraiaDTO {
  etapaId: string;
  arenaId: string;
  fase: FaseEtapa;
  grupoId?: string;
  grupoNome?: string;
  jogador1AId: string;
  jogador1ANome: string;
  jogador1BId: string;
  jogador1BNome: string;
  dupla1Nome: string;
  jogador2AId: string;
  jogador2ANome: string;
  jogador2BId: string;
  jogador2BNome: string;
  dupla2Nome: string;
  confrontoId?: string;
}

/**
 * DTO para registrar resultado
 * CORREÇÃO v2: Agora inclui placar e vencedores
 */
export interface RegistrarResultadoReiDaPraiaDTO {
  setsDupla1: number;
  setsDupla2: number;
  sets: Array<{
    pontosDupla1: number;
    pontosDupla2: number;
  }>;
  placar: Array<{
    numero: number;
    gamesDupla1: number;
    gamesDupla2: number;
  }>;
  vencedorDupla: 1 | 2;
  vencedores: string[]; // IDs dos jogadores vencedores
  vencedoresNomes: string; // Nomes formatados para exibição
}

/**
 * Interface do repository de PartidaReiDaPraia
 */
export interface IPartidaReiDaPraiaRepository
  extends IBaseRepository<
      PartidaReiDaPraia,
      CriarPartidaReiDaPraiaDTO,
      Partial<PartidaReiDaPraia>
    >,
    IBatchOperations<PartidaReiDaPraia> {
  /**
   * Buscar partida por ID com validação de arena
   */
  buscarPorIdEArena(
    id: string,
    arenaId: string
  ): Promise<PartidaReiDaPraia | null>;

  /**
   * Buscar partidas de uma etapa
   */
  buscarPorEtapa(
    etapaId: string,
    arenaId: string
  ): Promise<PartidaReiDaPraia[]>;

  /**
   * Buscar partidas de um grupo
   */
  buscarPorGrupo(grupoId: string): Promise<PartidaReiDaPraia[]>;

  /**
   * Buscar partidas por fase
   */
  buscarPorFase(
    etapaId: string,
    arenaId: string,
    fase: FaseEtapa
  ): Promise<PartidaReiDaPraia[]>;

  /**
   * Buscar partidas de grupos de uma etapa
   */
  buscarPartidasGrupos(
    etapaId: string,
    arenaId: string
  ): Promise<PartidaReiDaPraia[]>;

  /**
   * Buscar partidas eliminatórias de uma etapa
   */
  buscarPartidasEliminatorias(
    etapaId: string,
    arenaId: string
  ): Promise<PartidaReiDaPraia[]>;

  /**
   * Buscar partidas finalizadas de uma etapa
   */
  buscarFinalizadas(
    etapaId: string,
    arenaId: string
  ): Promise<PartidaReiDaPraia[]>;

  /**
   * Buscar partidas pendentes de uma etapa
   */
  buscarPendentes(
    etapaId: string,
    arenaId: string
  ): Promise<PartidaReiDaPraia[]>;

  /**
   * Registrar resultado da partida
   */
  registrarResultado(
    id: string,
    resultado: RegistrarResultadoReiDaPraiaDTO
  ): Promise<PartidaReiDaPraia>;

  /**
   * Limpar resultado (reverter para agendada)
   */
  limparResultado(id: string): Promise<void>;

  /**
   * Contar partidas por grupo
   */
  contarPorGrupo(grupoId: string): Promise<number>;

  /**
   * Contar partidas finalizadas por grupo
   */
  contarFinalizadasPorGrupo(grupoId: string): Promise<number>;

  /**
   * Verificar se todas as partidas do grupo estão finalizadas
   */
  grupoCompleto(grupoId: string): Promise<boolean>;

  /**
   * Buscar partidas por confronto (fase eliminatória)
   */
  buscarPorConfronto(confrontoId: string): Promise<PartidaReiDaPraia[]>;

  /**
   * Deletar todas as partidas de uma etapa
   */
  deletarPorEtapa(etapaId: string, arenaId: string): Promise<number>;

  /**
   * Deletar partidas de grupos
   */
  deletarPartidasGrupos(etapaId: string, arenaId: string): Promise<number>;

  /**
   * Deletar partidas eliminatórias
   */
  deletarPartidasEliminatorias(
    etapaId: string,
    arenaId: string
  ): Promise<number>;
}
