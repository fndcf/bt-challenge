// Enums e Tipos Básicos

export type NivelJogador = "Iniciante" | "Intermediário" | "Avançado";
export type GeneroJogador = "Masculino" | "Feminino";
export type StatusChallenge = "Cadastro" | "EmAndamento" | "Finalizado";
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

// Challenge (Etapa do Torneio)
export interface Challenge {
  id: string;
  arenaId: string;
  numero: number; // Etapa 1, 2, 3...
  nome: string;
  status: StatusChallenge;
  dataInicio?: Date;
  dataFim?: Date;
  jogadoresInscritos: string[]; // IDs dos jogadores
  nivel: NivelJogador;
  genero: GeneroJogador;
  chavesGeradas: boolean;
  vencedorDupla?: string; // ID da dupla vencedora
  createdAt: Date;
  updatedAt: Date;
}

// Histórico de Parceiros (para evitar repetição)
export interface HistoricoParceiro {
  id: string;
  jogador1Id: string;
  jogador2Id: string;
  arenaId: string;
  challengesJuntos: string[]; // IDs dos challenges que jogaram juntos
  createdAt: Date;
}

// Ranking Individual
export interface RankingJogador {
  id: string;
  jogadorId: string;
  arenaId: string;
  nivel: NivelJogador;
  genero: GeneroJogador;
  pontosTotais: number;
  titulos: number;
  vices: number;
  semifinais: number;
  participacoes: number;
  vitorias: number;
  derrotas: number;
  saldoGames: number;
  updatedAt: Date;
}

// Pontuação por Colocação
export interface PontuacaoColocacao {
  campeao: number;
  vice: number;
  semifinalista: number;
  quartas: number;
  oitavas: number;
  participacao: number;
}

// Estatísticas do Jogador
export interface EstatisticasJogador {
  jogadorId: string;
  arenaId: string;
  challengesParticipados: number;
  vitorias: number;
  derrotas: number;
  percentualVitorias: number;
  saldoGames: number;
  melhorColocacao: string;
  parceirosHistorico: Array<{
    jogadorId: string;
    vezesJuntos: number;
  }>;
}
