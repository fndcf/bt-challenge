/**
 * Constantes da aplicação
 */

// Regras do Torneio
export const TORNEIO_REGRAS = {
  MIN_JOGADORES: 12,
  MIN_DUPLAS_POR_GRUPO: 3,
  MAX_DUPLAS_POR_GRUPO: 4,
  GAMES_PARA_VITORIA: 6,
  DIFERENCA_MINIMA_GAMES: 2,
  PONTOS_TIEBREAK: 7,
} as const;

// Pontuação por Colocação (pode ser sobrescrito por arena)
export const PONTUACAO_PADRAO = {
  campeao: 100,
  vice: 70,
  semifinalista: 50,
  quartas: 30,
  oitavas: 20,
  participacao: 10,
} as const;

// Critérios de Desempate (ordem de prioridade)
export const CRITERIOS_DESEMPATE = [
  "vitorias",
  "saldoGames",
  "confrontoDireto",
  "sorteio",
] as const;

// Níveis de Jogador
export const NIVEIS_JOGADOR = {
  INICIANTE: "Iniciante",
  INTERMEDIARIO: "Intermediário",
  AVANCADO: "Avançado",
} as const;

// Gêneros
export const GENEROS = {
  MASCULINO: "Masculino",
  FEMININO: "Feminino",
} as const;

// Status do Challenge
export const STATUS_CHALLENGE = {
  CADASTRO: "Cadastro",
  EM_ANDAMENTO: "EmAndamento",
  FINALIZADO: "Finalizado",
} as const;

// Status da Partida
export const STATUS_PARTIDA = {
  PENDENTE: "Pendente",
  EM_ANDAMENTO: "EmAndamento",
  FINALIZADA: "Finalizada",
} as const;

// Fases do Challenge
export const FASES_CHALLENGE = {
  GRUPOS: "Grupos",
  OITAVAS: "Oitavas",
  QUARTAS: "Quartas",
  SEMI: "Semi",
  FINAL: "Final",
} as const;

// Mensagens de Erro
export const ERROR_MESSAGES = {
  JOGADORES_INSUFICIENTES: "Número de jogadores insuficiente. Mínimo: 12",
  NUMERO_IMPAR_JOGADORES: "Número de jogadores deve ser par",
  ARENA_NAO_ENCONTRADA: "Arena não encontrada",
  JOGADOR_NAO_ENCONTRADO: "Jogador não encontrado",
  CHALLENGE_NAO_ENCONTRADO: "Challenge não encontrado",
  DUPLA_NAO_ENCONTRADA: "Dupla não encontrada",
  PARCEIROS_REPETIDOS: "Estes jogadores já jogaram juntos em outro challenge",
  NAO_AUTORIZADO: "Não autorizado",
  TOKEN_INVALIDO: "Token inválido",
  DADOS_INVALIDOS: "Dados inválidos",
} as const;

// Mensagens de Sucesso
export const SUCCESS_MESSAGES = {
  JOGADOR_CRIADO: "Jogador cadastrado com sucesso",
  JOGADOR_ATUALIZADO: "Jogador atualizado com sucesso",
  JOGADOR_REMOVIDO: "Jogador removido com sucesso",
  CHALLENGE_CRIADO: "Challenge criado com sucesso",
  CHAVES_GERADAS: "Chaves geradas com sucesso",
  RESULTADO_REGISTRADO: "Resultado registrado com sucesso",
  ARENA_CRIADA: "Arena criada com sucesso",
} as const;

// Configurações de Paginação
export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

// Regex para Validações
export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  TELEFONE: /^\(\d{2}\)\s?\d{4,5}-?\d{4}$/,
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
} as const;

// Roles de Usuário
export const USER_ROLES = {
  ADMIN: "admin",
  SUPER_ADMIN: "superAdmin",
} as const;

// Configurações de Cache (em segundos)
export const CACHE_TTL = {
  RANKING: 300, // 5 minutos
  ESTATISTICAS: 600, // 10 minutos
  JOGADORES: 180, // 3 minutos
  CHALLENGES: 120, // 2 minutos
} as const;

// Limites de Rate Limiting
export const RATE_LIMITS = {
  GERAR_CHAVES: 5, // máximo 5 tentativas por hora
  CRIAR_CHALLENGE: 10, // máximo 10 challenges por hora
  REGISTRAR_RESULTADO: 100, // máximo 100 resultados por hora
} as const;
