/**
 * Estrutura de Coleções do Firestore
 *
 * Este arquivo define todas as coleções e subcoleções
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

// Índices que devem ser criados no Firestore
export const FIRESTORE_INDEXES = [
  // Jogadores por arena e nível
  {
    collection: COLLECTIONS.JOGADORES,
    fields: ["arenaId", "nivel", "genero", "ativo"],
  },

  // Challenges por arena
  {
    collection: COLLECTIONS.CHALLENGES,
    fields: ["arenaId", "status", "numero"],
  },

  // Duplas por challenge
  {
    collection: COLLECTIONS.DUPLAS,
    fields: ["challengeId", "pontos", "saldoGames"],
  },

  // Partidas por challenge e fase
  {
    collection: COLLECTIONS.PARTIDAS,
    fields: ["challengeId", "fase", "status"],
  },

  // Ranking por arena, nível e pontos
  {
    collection: COLLECTIONS.RANKING,
    fields: ["arenaId", "nivel", "genero", "pontosTotais"],
  },

  // Histórico de parceiros por arena
  {
    collection: COLLECTIONS.HISTORICO_PARCEIROS,
    fields: ["arenaId", "jogador1Id", "jogador2Id"],
  },
];

// Regras de segurança sugeridas (implementar no Firebase Console)
export const SECURITY_RULES = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Função auxiliar para verificar se é admin da arena
    function isArenaAdmin(arenaId) {
      return request.auth != null && 
             exists(/databases/$(database)/documents/admins/$(request.auth.uid)) &&
             get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.arenaId == arenaId;
    }
    
    // Arenas - apenas leitura pública, escrita por admins
    match /arenas/{arenaId} {
      allow read: if true;
      allow write: if isArenaAdmin(arenaId);
    }
    
    // Jogadores - leitura pública, escrita por admins
    match /jogadores/{jogadorId} {
      allow read: if true;
      allow write: if isArenaAdmin(resource.data.arenaId);
    }
    
    // Challenges - leitura pública, escrita por admins
    match /challenges/{challengeId} {
      allow read: if true;
      allow write: if isArenaAdmin(resource.data.arenaId);
    }
    
    // Demais coleções - leitura pública, escrita por admins
    match /{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
`;
