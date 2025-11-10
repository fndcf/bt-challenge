import { z } from "zod";
import { Timestamp } from "firebase-admin/firestore";
import { FaseEtapa } from "./Etapa";

/**
 * Enum de Status da Partida
 */
export enum StatusPartida {
  AGENDADA = "agendada",
  EM_ANDAMENTO = "em_andamento",
  FINALIZADA = "finalizada",
  CANCELADA = "cancelada",
}

/**
 * Interface da Partida
 */
export interface Partida {
  id: string;
  etapaId: string;
  arenaId: string;

  tipo?: "grupos" | "eliminatoria";

  // Fase
  fase: FaseEtapa; // grupos, oitavas, quartas, semifinal, final
  grupoId?: string; // Apenas para fase de grupos
  grupoNome?: string;

  // Duplas
  dupla1Id: string;
  dupla1Nome: string; // "João & Maria"

  dupla2Id: string;
  dupla2Nome: string;

  // Agendamento
  dataHora?: Timestamp | string;
  quadra?: string;

  // Placar
  status: StatusPartida;
  setsDupla1: number;
  setsDupla2: number;

  // Placar detalhado por set
  placar: string[]; // Ex: ["6-4", "7-5", "6-3"]

  // Resultado
  vencedoraId?: string;
  vencedoraNome?: string;

  // Metadados
  criadoEm: Timestamp | string;
  atualizadoEm: Timestamp | string;
  finalizadoEm?: Timestamp | string;
}

/**
 * DTOs
 */

// Registrar Resultado
export const RegistrarResultadoSchema = z.object({
  vencedoraId: z.string().min(1, "Vencedora é obrigatória"),
  setsDupla1: z.number().min(0),
  setsDupla2: z.number().min(0),
  placar: z.array(z.string()).min(1), // Ex: ["6-4", "7-5"]
});

export type RegistrarResultadoDTO = z.infer<typeof RegistrarResultadoSchema>;

// Agendar Partida
export const AgendarPartidaSchema = z.object({
  dataHora: z.string().datetime().or(z.date()),
  quadra: z.string().max(50).optional(),
});

export type AgendarPartidaDTO = z.infer<typeof AgendarPartidaSchema>;
