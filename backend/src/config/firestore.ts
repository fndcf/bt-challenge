/**
 * Estrutura de Coleções do Firestore
 */

export const COLLECTIONS = {
  // Coleção principal de arenas (multi-tenancy)
  ARENAS: "arenas",

  // Coleção de jogadores
  JOGADORES: "jogadores",

  // Coleção de challenges (etapas do torneio)
  CHALLENGES: "challenges",

  // Coleção de duplas
  DUPLAS: "duplas",

  // Coleção de grupos
  GRUPOS: "grupos",

  // Coleção de partidas
  PARTIDAS: "partidas",

  // Coleção de histórico de parceiros
  HISTORICO_PARCEIROS: "historicoParceiros",

  // Coleção de ranking
  RANKING: "ranking",

  // Coleção de administradores
  ADMINS: "admins",
} as const;

/**
 * Estrutura do Firestore:
 *
 * arenas/
 *   {arenaId}/
 *     - dados da arena
 *
 * jogadores/
 *   {jogadorId}/
 *     - dados do jogador
 *
 * challenges/
 *   {challengeId}/
 *     - dados do challenge
 *
 * duplas/
 *   {duplaId}/
 *     - dados da dupla
 *
 * grupos/
 *   {grupoId}/
 *     - dados do grupo
 *
 * partidas/
 *   {partidaId}/
 *     - dados da partida
 *
 * historicoParceiros/
 *   {historicoId}/
 *     - dados do histórico
 *
 * ranking/
 *   {rankingId}/
 *     - dados do ranking individual
 *
 * admins/
 *   {adminId}/
 *     - dados do administrador
 */
