// Enums e Tipos Básicos

export type NivelJogador = "Iniciante" | "Intermediário" | "Avançado";
export type GeneroJogador = "Masculino" | "Feminino";
export type StatusPartida = "Pendente" | "EmAndamento" | "Finalizada";
export type FaseChallenge = "Grupos" | "Oitavas" | "Quartas" | "Semi" | "Final";

// Jogador
export interface Jogador {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  nivel: NivelJogador;
  genero: GeneroJogador;
  arenaId: string;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Arena (Multi-tenancy)
export interface Arena {
  id: string;
  nome: string;
  slug: string; // URL amigável: arenaazul, arenavermelha
  adminEmail: string;
  adminUid: string;
  ativa: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Dupla
export interface Dupla {
  id: string;
  jogador1Id: string;
  jogador2Id: string;
  challengeId: string;
  grupoId?: string;
  vitorias: number;
  derrotas: number;
  saldoGames: number;
  pontos: number;
  classificada: boolean;
  posicaoGrupo?: number;
  createdAt: Date;
}

// Grupo
export interface Grupo {
  id: string;
  numero: number;
  challengeId: string;
  duplas: string[]; // IDs das duplas
  createdAt: Date;
}

// Partida
export interface Partida {
  id: string;
  challengeId: string;
  grupoId?: string;
  fase: FaseChallenge;
  dupla1Id: string;
  dupla2Id: string;
  scoresDupla1: number[]; // Ex: [6, 7] - ganhou o primeiro set 6x?, perdeu o tiebreak 7x?
  scoresDupla2: number[]; // Ex: [4, 5]
  vencedorId?: string;
  status: StatusPartida;
  dataJogo?: Date;
  createdAt: Date;
  updatedAt: Date;
}
