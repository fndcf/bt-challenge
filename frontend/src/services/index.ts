/**
 * Arena Services - Index
 *
 * Exporta os services de arena organizados por responsabilidade:
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │                      ARENA SERVICES                         │
 * ├─────────────────────────────────────────────────────────────┤
 * │                                                             │
 * │  arenaAdminService     →  Operações administrativas         │
 * │  (autenticado)            - criar, atualizar, deletar       │
 * │                           - buscar por ID/slug              │
 * │                           - listar arenas                   │
 * │                                                             │
 * │  arenaPublicService    →  Operações públicas                │
 * │  (sem auth)               - ranking                         │
 * │                           - estatísticas                    │
 * │                           - etapas públicas                 │
 * │                           - jogadores públicos              │
 * │                                                             │
 * └─────────────────────────────────────────────────────────────┘
 *
 */

// Services principais
export { arenaAdminService } from "./arenaAdminService";
export { arenaPublicService } from "./arenaPublicService";

// Tipos do Admin
export type { CreateArenaDTO, CreateArenaResponse } from "./arenaAdminService";

// Tipos do Public
export type {
  EtapaPublica,
  JogadorPublico,
  EstatisticasAgregadas,
  ArenaPublica,
  FiltrosEtapasPublicas,
  FiltrosJogadoresPublicos,
} from "./arenaPublicService";
