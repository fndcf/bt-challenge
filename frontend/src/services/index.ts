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
 * │  arenaService          →  ⚠️ DEPRECATED                     │
 * │                           Compatibilidade com código antigo │
 * │                           Delega para os services acima     │
 * │                                                             │
 * └─────────────────────────────────────────────────────────────┘
 * 
 * USO RECOMENDADO:
 * 
 * // ✅ Novo código
 * import { arenaAdminService } from "@/services/arena";
 * import { arenaPublicService } from "@/services/arena";
 * 
 * // ⚠️ Código legado (ainda funciona, mas migrar gradualmente)
 * import { arenaService } from "@/services/arena";
 */

// Services principais
export { arenaAdminService } from "./arenaAdminService";
export { arenaPublicService } from "./arenaPublicService";

// Compatibilidade (deprecated)
export { arenaService } from "./arenaService";

// Tipos do Admin
export type {
  CreateArenaDTO,
  CreateArenaResponse,
} from "./arenaAdminService";

// Tipos do Public
export type {
  EtapaPublica,
  JogadorPublico,
  EstatisticasAgregadas,
  ArenaPublica,
  FiltrosEtapasPublicas,
  FiltrosJogadoresPublicos,
} from "./arenaPublicService";
