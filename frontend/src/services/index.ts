/**
 * Exporta services, interfaces e container (DI)
 */

// ============================================
// DEPENDENCY INJECTION CONTAINER
// ============================================

export {
  container,
  getArenaAdminService,
  getArenaPublicService,
  getEtapaService,
  getJogadorService,
  getChaveService,
  getCabecaDeChaveService,
  getPartidaService,
  getReiDaPraiaService,
} from "./container";

// ============================================
// INTERFACES
// ============================================

export type {
  IArenaAdminService,
  IArenaPublicService,
  IEtapaService,
  IJogadorService,
  IChaveService,
  ICabecaDeChaveService,
  IPartidaService,
  IReiDaPraiaService,
} from "./interfaces";

// ============================================
// SERVICES (backward compatibility)
// ============================================

export { default as arenaAdminService } from "./arenaAdminService";
export { default as arenaPublicService } from "./arenaPublicService";
export { default as etapaService } from "./etapaService";
export { default as jogadorService } from "./jogadorService";
export { default as chaveService } from "./chaveService";
export { default as cabecaDeChaveService } from "./cabecaDeChaveService";
export { default as partidaService } from "./partidaService";
export { default as reiDaPraiaService } from "./reiDaPraiaService";

// ============================================
// TYPES & DTOs
// ============================================

// Arena Admin
export type { CreateArenaDTO, CreateArenaResponse } from "./arenaAdminService";

// Arena Public
export type {
  EtapaPublica,
  JogadorPublico,
  EstatisticasAgregadas,
  ArenaPublica,
  FiltrosEtapasPublicas,
  FiltrosJogadoresPublicos,
} from "./arenaPublicService";
