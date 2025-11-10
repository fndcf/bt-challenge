import { Timestamp } from "firebase-admin/firestore";

export enum TipoFase {
  OITAVAS = "oitavas",
  QUARTAS = "quartas",
  SEMIFINAL = "semifinal",
  FINAL = "final",
}

export enum StatusConfrontoEliminatorio {
  BYE = "bye",
  AGENDADA = "agendada",
  FINALIZADA = "finalizada",
}

export interface ConfrontoEliminatorio {
  id: string;
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
  partidaId?: string;
  status: StatusConfrontoEliminatorio;
  vencedoraId?: string;
  vencedoraNome?: string;
  placar?: string;
  proximoConfrontoId?: string;
  criadoEm: Timestamp;
  atualizadoEm: Timestamp;
}
