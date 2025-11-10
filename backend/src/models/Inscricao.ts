import { Timestamp } from "firebase-admin/firestore";

/**
 * Enum de Status da Inscrição
 */
export enum StatusInscricao {
  CONFIRMADA = "confirmada",
  AGUARDANDO = "aguardando",
  CANCELADA = "cancelada",
}

/**
 * Interface da Inscrição
 */
export interface Inscricao {
  id: string;
  etapaId: string;
  arenaId: string;

  // Jogador
  jogadorId: string;
  jogadorNome: string;
  jogadorNivel: string;

  // Status
  status: StatusInscricao;

  // Dupla (preenchido após geração de chaves)
  duplaId?: string;
  parceiroId?: string;
  parceiroNome?: string;

  // Grupo (preenchido após geração de chaves)
  grupoId?: string;
  grupoNome?: string; // Ex: "Grupo A"

  // Metadados
  criadoEm: Timestamp | string;
  atualizadoEm: Timestamp | string;
  canceladoEm?: Timestamp | string;
}

/**
 * Histórico de Parceiros
 * Para implementar a regra de não repetição
 */
export interface HistoricoParceiro {
  id: string;
  arenaId: string;
  jogadorId: string;

  // Lista de parceiros que já jogou
  parceiros: {
    parceiroId: string;
    parceiroNome: string;
    etapasJuntos: string[]; // IDs das etapas
    ultimaVez: Timestamp | string;
  }[];

  atualizadoEm: Timestamp | string;
}
