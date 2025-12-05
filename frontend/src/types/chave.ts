import { NivelJogador } from "./jogador";

export interface Dupla {
  id: string;
  etapaId: string;
  arenaId: string;
  jogador1Id: string;
  jogador1Nome: string;
  jogador1Nivel: NivelJogador;
  jogador1Genero?: string;
  jogador2Id: string;
  jogador2Nome: string;
  jogador2Nivel: NivelJogador;
  jogador2Genero?: string;
  grupoId: string;
  grupoNome: string;
  jogos: number;
  vitorias: number;
  derrotas: number;
  pontos: number;
  setsVencidos: number;
  setsPerdidos: number;
  gamesVencidos: number;
  gamesPerdidos: number;
  saldoSets: number;
  saldoGames: number;
  posicaoGrupo?: number;
  classificada: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

/**
 * Grupo de duplas
 */
export interface Grupo {
  id: string;
  etapaId: string;
  arenaId: string;
  nome: string;
  ordem: number;
  duplas: string[];
  totalDuplas: number;
  partidas: string[];
  totalPartidas: number;
  partidasFinalizadas: number;
  completo: boolean;
  classificadas: string[];
  criadoEm: string;
  atualizadoEm: string;
}

/**
 * Status da partida
 */
export enum StatusPartida {
  AGENDADA = "agendada",
  EM_ANDAMENTO = "em_andamento",
  FINALIZADA = "finalizada",
  CANCELADA = "cancelada",
  WO = "wo",
}

/**
 * Fase da etapa
 */
export enum FaseEtapa {
  GRUPOS = "grupos",
  OITAVAS = "oitavas",
  QUARTAS = "quartas",
  SEMIFINAL = "semifinal",
  FINAL = "final",
  TERCEIRO_LUGAR = "terceiro_lugar",
}

/**
 * Set de uma partida
 */
export interface SetPartida {
  numero: number;
  gamesDupla1: number;
  gamesDupla2: number;
  tiebreak?: boolean;
  vencedorId: string;
}

/**
 * Partida entre duplas
 */
export interface Partida {
  id: string;
  etapaId: string;
  arenaId: string;
  tipo?: "dupla_fixa" | "eliminatoria";
  fase: FaseEtapa;
  grupoId?: string;
  grupoNome?: string;
  dupla1Id: string;
  dupla1Nome: string;
  dupla2Id: string;
  dupla2Nome: string;
  dataHora?: string;
  quadra?: string;
  status: StatusPartida;
  setsDupla1: number;
  setsDupla2: number;
  placar: SetPartida[];
  vencedoraId?: string;
  vencedoraNome?: string;
  criadoEm: string;
  atualizadoEm: string;
  finalizadoEm?: string;
}

/**
 * Resultado da geração de chaves
 */
export interface ResultadoGeracaoChaves {
  duplas: Dupla[];
  grupos: Grupo[];
  partidas: Partida[];
}

/**
 * Tipo de fase eliminatória
 */
export enum TipoFase {
  OITAVAS = "oitavas",
  QUARTAS = "quartas",
  SEMIFINAL = "semifinal",
  FINAL = "final",
}

/**
 * Status do confronto eliminatório
 */
export enum StatusConfrontoEliminatorio {
  BYE = "bye",
  AGENDADA = "agendada",
  FINALIZADA = "finalizada",
}

/**
 * Confronto da fase eliminatória
 */
export interface ConfrontoEliminatorio {
  id: string;
  etapaId: string;
  arenaId: string;
  fase: TipoFase;
  ordem: number;
  dupla1Id?: string;
  dupla1Nome?: string;
  dupla1Origem?: string; // Ex: "1º Grupo A" ou "Vencedor Q1"
  dupla2Id?: string;
  dupla2Nome?: string;
  dupla2Origem?: string;
  partidaId?: string;
  status: StatusConfrontoEliminatorio;
  vencedoraId?: string;
  vencedoraNome?: string;
  placar?: string; // Ex: "6-4"
  proximoConfrontoId?: string;
  criadoEm: string;
  atualizadoEm: string;
}

/**
 * Fase eliminatória completa
 */
export interface FaseEliminatoria {
  id: string;
  etapaId: string;
  arenaId: string;
  tipo: TipoFase;
  confrontos: string[];
  totalConfrontos: number;
  confrontosFinalizados: number;
  completa: boolean;
  classificados: string[];
  totalClassificados: number;
  byes: number;
  criadoEm: string;
  atualizadoEm: string;
}
