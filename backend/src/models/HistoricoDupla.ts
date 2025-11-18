/**
 * HistoricoDupla.ts
 *
 * Model para rastrear duplas já formadas em etapas anteriores
 * Usado para evitar repetir combinações de cabeças de chave
 */

import { Timestamp } from "firebase-admin/firestore";

/**
 * Histórico de Dupla
 * Registra todas as duplas já formadas
 */
export interface HistoricoDupla {
  id: string;
  arenaId: string;
  etapaId: string;
  etapaNome: string;
  jogador1Id: string;
  jogador1Nome: string;
  jogador2Id: string;
  jogador2Nome: string;
  chaveNormalizada: string; // "jogadorA_jogadorB" (sempre alfabética)
  ambosForamCabecas: boolean; // Se ambos eram cabeças de chave quando formaram dupla
  criadoEm: Timestamp;
}

/**
 * DTO para criar histórico de dupla
 */
export interface CriarHistoricoDuplaDTO {
  arenaId: string;
  etapaId: string;
  etapaNome: string;
  jogador1Id: string;
  jogador1Nome: string;
  jogador2Id: string;
  jogador2Nome: string;
  ambosForamCabecas: boolean;
}

/**
 * Estatísticas de combinações
 */
export interface EstatisticasCombinacoes {
  totalCabecas: number;
  combinacoesPossiveis: number;
  combinacoesRealizadas: number;
  combinacoesRestantes: number;
  todasCombinacoesFeitas: boolean;
  combinacoesDisponiveis: string[][]; // [jogador1Id, jogador2Id][]
}
