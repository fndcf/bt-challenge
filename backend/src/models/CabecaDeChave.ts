/**
 * CabecaDeChave.ts
 *
 * Model para gerenciar cabeças de chave (seeding)
 */

import { Timestamp } from "firebase-admin/firestore";

/**
 * Cabeça de Chave
 * Jogadores que não podem ser sorteados juntos
 */
export interface CabecaDeChave {
  id: string;
  arenaId: string;
  etapaId: string;
  jogadorId: string;
  jogadorNome: string;
  jogadorNivel?: string;
  jogadorGenero?: string;
  ordem: number; // 1 = melhor cabeça, 2 = segundo melhor, etc.
  ativo: boolean;
  motivoDesativacao?: string;
  criadoEm: Timestamp;
  atualizadoEm: Timestamp;
}

/**
 * DTO para criar cabeça de chave
 */
export interface CriarCabecaDeChaveDTO {
  arenaId: string;
  etapaId: string;
  jogadorId: string;
  jogadorNome: string;
  jogadorNivel?: string;
  jogadorGenero?: string;
  ordem: number;
}

/**
 * DTO para atualizar cabeça de chave
 */
export interface AtualizarCabecaDeChaveDTO {
  ordem?: number;
  ativo?: boolean;
  motivoDesativacao?: string;
}
