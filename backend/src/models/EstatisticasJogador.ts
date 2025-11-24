import { Timestamp } from "firebase-admin/firestore";

/**
 * Estatísticas individuais de um jogador em uma etapa
 *
 * IMPORTANTE: Funciona para AMBOS os formatos de torneio:
 * - DUPLA FIXA: Cada jogador acumula estatísticas ao jogar em duplas fixas
 * - REI DA PRAIA: Cada jogador acumula estatísticas ao jogar em duplas rotativas
 *
 * Esta separação permite:
 * - Histórico completo do jogador
 * - Ranking global de jogadores
 * - Análise de performance individual
 * - Premiações individuais
 */
export interface EstatisticasJogador {
  id: string;
  etapaId: string;
  arenaId: string;

  // Dados do jogador
  jogadorId: string;
  jogadorNome: string;
  jogadorNivel?: string;
  jogadorGenero?: string;

  // Grupo (pode ser null se ainda não distribuído em grupos)
  grupoId?: string;
  grupoNome?: string;

  // ✅ ESTATÍSTICAS DE GRUPO (classificação para rei da praia)
  jogosGrupo: number;
  vitoriasGrupo: number;
  derrotasGrupo: number;
  pontosGrupo: number; // 3 pontos por vitória
  setsVencidosGrupo: number;
  setsPerdidosGrupo: number;
  saldoSetsGrupo: number;
  gamesVencidosGrupo: number;
  gamesPerdidosGrupo: number;
  saldoGamesGrupo: number;

  // Estatísticas individuais
  jogos: number; // Total de partidas jogadas
  vitorias: number; // Total de vitórias
  derrotas: number; // Total de derrotas
  pontos: number; // 3 pontos por vitória

  // Estatísticas de sets e games
  setsVencidos: number;
  setsPerdidos: number;
  gamesVencidos: number;
  gamesPerdidos: number;
  saldoSets: number; // vencidos - perdidos
  saldoGames: number; // vencidos - perdidos

  // Classificação no grupo
  posicaoGrupo?: number; // 1º, 2º, 3º, 4º dentro do grupo
  classificado: boolean; // Se passou para fase eliminatória

  // Metadados
  criadoEm: Timestamp;
  atualizadoEm: Timestamp;
}

/**
 * DTO para criar estatísticas de jogador
 */
export interface CriarEstatisticasJogadorDTO {
  etapaId: string;
  arenaId: string;
  jogadorId: string;
  jogadorNome: string;
  jogadorNivel?: string;
  jogadorGenero?: string;
  grupoId?: string;
  grupoNome?: string;
}

/**
 * DTO para atualizar estatísticas após uma partida
 */
export interface AtualizarEstatisticasPartidaDTO {
  venceu: boolean;
  setsVencidos: number;
  setsPerdidos: number;
  gamesVencidos: number;
  gamesPerdidos: number;
}
