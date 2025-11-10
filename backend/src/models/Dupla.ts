import { Timestamp } from "firebase-admin/firestore";

/**
 * Interface da Dupla
 */
export interface Dupla {
  id: string;
  etapaId: string;
  arenaId: string;

  // Jogadores da dupla
  jogador1Id: string;
  jogador1Nome: string;
  jogador1Nivel: string;

  jogador2Id: string;
  jogador2Nome: string;
  jogador2Nivel: string;

  // Grupo
  grupoId: string;
  grupoNome: string; // Ex: "Grupo A"

  // Estatísticas na etapa
  jogos: number;
  vitorias: number;
  derrotas: number;
  pontos: number;
  setsVencidos: number;
  setsPerdidos: number;
  gamesVencidos: number;
  gamesPerdidos: number;

  // Saldo
  saldoSets: number; // setsVencidos - setsPerdidos
  saldoGames: number; // gamesVencidos - gamesPerdidos

  // Classificação
  posicaoGrupo?: number;
  classificada?: boolean;

  // Metadados
  criadoEm: Timestamp | string;
  atualizadoEm: Timestamp | string;
}

/**
 * Resultado de uma partida (para atualização)
 */
export interface ResultadoPartida {
  duplaVencedoraId: string;
  duplaPerdedoraId: string;
  setsVencedor: number;
  setsPerdedor: number;
  placar: string[]; // Ex: ["6-4", "7-5", "6-3"]
}
