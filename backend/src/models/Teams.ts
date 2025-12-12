import { Timestamp } from "firebase-admin/firestore";
import { NivelJogador, GeneroJogador } from "./Jogador";
import { FaseEtapa } from "./Etapa";
import { StatusPartida } from "./Partida";

/**
 * Variantes do formato TEAMS
 * - TEAMS_4: 4 jogadores por equipe, 2 jogos (+1 decider se 1-1)
 * - TEAMS_6: 6 jogadores por equipe, 3 jogos (sempre misto)
 */
export enum VarianteTeams {
  TEAMS_4 = 4,
  TEAMS_6 = 6,
}

/**
 * Tipos de formação de equipes
 * - MESMO_NIVEL: Apenas jogadores do mesmo nível
 * - BALANCEADO: Distribuição por "potes" de níveis
 * - MANUAL: Organizador define manualmente as equipes
 */
export enum TipoFormacaoEquipe {
  MESMO_NIVEL = "mesmo_nivel",
  BALANCEADO = "balanceado",
  MANUAL = "manual",
}

/**
 * Tipos de formação dos jogos dentro de um confronto
 * - SORTEIO: Sistema gera pareamentos automaticamente
 * - MANUAL: Organizador define quem joga com quem
 */
export enum TipoFormacaoJogos {
  SORTEIO = "sorteio",
  MANUAL = "manual",
}

/**
 * Status de um confronto entre equipes
 */
export enum StatusConfronto {
  AGENDADO = "agendado",
  EM_ANDAMENTO = "em_andamento",
  FINALIZADO = "finalizado",
}

/**
 * Tipo de jogo dentro de um confronto
 */
export enum TipoJogoTeams {
  FEMININO = "feminino",
  MASCULINO = "masculino",
  MISTO = "misto",
  DECIDER = "decider",
}

/**
 * Jogador dentro de uma equipe
 */
export interface JogadorEquipe {
  id: string;
  nome: string;
  nivel: NivelJogador;
  genero: GeneroJogador;
}

/**
 * Equipe no formato TEAMS
 */
export interface Equipe {
  id: string;
  etapaId: string;
  arenaId: string;
  nome: string; // "Equipe 1" ou nome personalizado
  ordem: number;

  // Grupo (para 6+ equipes)
  grupoId?: string; // "A", "B", etc.
  grupoNome?: string; // "Grupo A", "Grupo B", etc.

  // Jogadores (4 ou 6)
  jogadores: JogadorEquipe[];

  // Estatísticas do campeonato (confrontos)
  confrontos: number; // Total de confrontos jogados
  vitorias: number; // Confrontos vencidos
  derrotas: number; // Confrontos perdidos
  pontos: number; // 3 por vitória

  // Estatísticas de jogos (dentro dos confrontos)
  jogosVencidos: number;
  jogosPerdidos: number;
  saldoJogos: number;

  // Estatísticas de games
  gamesVencidos: number;
  gamesPerdidos: number;
  saldoGames: number;

  // Classificação
  posicao?: number;
  classificada?: boolean;

  criadoEm: Timestamp | string;
  atualizadoEm: Timestamp | string;
}

/**
 * Dupla que joga uma partida dentro do confronto
 */
export interface DuplaPartidaTeams {
  jogador1Id: string;
  jogador1Nome: string;
  jogador2Id: string;
  jogador2Nome: string;
  equipeId: string;
  equipeNome: string;
}

/**
 * Confronto entre duas equipes
 */
export interface ConfrontoEquipe {
  id: string;
  etapaId: string;
  arenaId: string;
  fase: FaseEtapa; // GRUPOS ou eliminatória
  rodada?: number; // Rodada do round-robin
  ordem: number;

  // Grupo (para fase de grupos)
  grupoId?: string; // "A", "B", etc.

  // Equipes
  equipe1Id: string;
  equipe1Nome: string;
  equipe2Id: string;
  equipe2Nome: string;

  // Resultado do confronto
  status: StatusConfronto;
  jogosEquipe1: number; // Jogos vencidos pela equipe 1
  jogosEquipe2: number; // Jogos vencidos pela equipe 2
  vencedoraId?: string;
  vencedoraNome?: string;

  // Jogos do confronto
  partidas: string[]; // IDs das partidas
  totalPartidas: number; // 2 ou 3 (sem contar decider)
  partidasFinalizadas: number;
  temDecider: boolean; // Se está 1-1 em TEAMS_4

  // Config de formação dos jogos
  tipoFormacaoJogos: TipoFormacaoJogos;

  // Para fase eliminatória
  proximoConfrontoId?: string;
  equipe1Origem?: string; // "1º Grupo A" ou "Vencedor Quartas 1"
  equipe2Origem?: string;
  isBye?: boolean; // True se for um BYE (equipe passa direto)

  criadoEm: Timestamp | string;
  atualizadoEm: Timestamp | string;
}

/**
 * Set de uma partida
 */
export interface SetPlacarTeams {
  numero: number;
  gamesDupla1: number;
  gamesDupla2: number;
}

/**
 * Partida (jogo) dentro de um confronto
 */
export interface PartidaTeams {
  id: string;
  etapaId: string;
  arenaId: string;
  confrontoId: string; // Confronto pai
  ordem: number; // 1, 2, 3
  tipoJogo: TipoJogoTeams; // feminino, masculino, misto, decider

  // Dupla 1 (2 jogadores da equipe 1)
  dupla1: DuplaPartidaTeams;

  // Dupla 2 (2 jogadores da equipe 2)
  dupla2: DuplaPartidaTeams;

  // Resultado
  status: StatusPartida;
  setsDupla1: number;
  setsDupla2: number;
  placar: SetPlacarTeams[];
  vencedoraEquipeId?: string;
  vencedoraEquipeNome?: string;

  criadoEm: Timestamp | string;
  atualizadoEm: Timestamp | string;
  finalizadoEm?: Timestamp | string;
}

// ==================== DTOs ====================

/**
 * DTO para criar uma equipe
 */
export interface CriarEquipeDTO {
  etapaId: string;
  arenaId: string;
  nome?: string;
  jogadores: JogadorEquipe[];
  grupoId?: string;
  grupoNome?: string;
}

/**
 * DTO para criar um confronto
 */
export interface CriarConfrontoDTO {
  etapaId: string;
  arenaId: string;
  fase: FaseEtapa;
  rodada?: number;
  ordem: number;
  grupoId?: string;
  equipe1Id: string;
  equipe1Nome: string;
  equipe2Id: string;
  equipe2Nome: string;
  tipoFormacaoJogos: TipoFormacaoJogos;
  // Para fase eliminatória
  equipe1Origem?: string;
  equipe2Origem?: string;
  proximoConfrontoId?: string;
  isBye?: boolean;
}

/**
 * DTO para criar uma partida dentro do confronto
 */
export interface CriarPartidaTeamsDTO {
  etapaId: string;
  arenaId: string;
  confrontoId: string;
  ordem: number;
  tipoJogo: TipoJogoTeams;
  dupla1: DuplaPartidaTeams;
  dupla2: DuplaPartidaTeams;
}

/**
 * DTO para registrar resultado de uma partida
 */
export interface RegistrarResultadoTeamsDTO {
  placar: SetPlacarTeams[];
}

/**
 * DTO para atualizar estatísticas de equipe
 */
export interface AtualizarEstatisticasEquipeDTO {
  confrontos?: number;
  vitorias?: number;
  derrotas?: number;
  pontos?: number;
  jogosVencidos?: number;
  jogosPerdidos?: number;
  saldoJogos?: number;
  gamesVencidos?: number;
  gamesPerdidos?: number;
  saldoGames?: number;
  posicao?: number;
  classificada?: boolean;
}

/**
 * DTO para formação manual de equipes
 */
export interface FormacaoManualEquipeDTO {
  nome?: string;
  jogadorIds: string[];
}

/**
 * DTO para definir partidas manualmente
 */
export interface DefinirPartidasManualDTO {
  partidas: {
    ordem: number;
    tipoJogo: TipoJogoTeams;
    dupla1JogadorIds: [string, string];
    dupla2JogadorIds: [string, string];
  }[];
}
