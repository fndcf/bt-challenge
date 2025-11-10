import { Timestamp } from "firebase-admin/firestore";

/**
 * Interface do Grupo
 */
export interface Grupo {
  id: string;
  etapaId: string;
  arenaId: string;

  // Identificação
  nome: string; // Ex: "Grupo A", "Grupo B"
  ordem: number; // 1, 2, 3...

  // Duplas do grupo
  duplas: string[]; // Array de IDs das duplas
  totalDuplas: number;

  // Partidas
  partidas: string[]; // Array de IDs das partidas
  totalPartidas: number;
  partidasFinalizadas: number;

  // Status
  completo: boolean; // Todas partidas finalizadas

  // Classificação
  classificadas: string[]; // IDs das duplas classificadas

  // Metadados
  criadoEm: Timestamp | string;
  atualizadoEm: Timestamp | string;
}
