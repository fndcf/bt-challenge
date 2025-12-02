/**
 * Services Index
 * backend/src/services/index.ts
 * 
 * Exportação centralizada de todos os services
 */

// ==================== SERVICES PRINCIPAIS ====================
export { ArenaService, arenaService } from "./ArenaService";
export { default as EtapaService } from "./EtapaService";
export { default as JogadorService } from "./JogadorService";

// ==================== SERVICES FASE 3 (SOLID) ====================
export { DuplaService, IDuplaService, default as duplaService } from "./DuplaService";
export { GrupoService, IGrupoService, default as grupoService } from "./GrupoService";
export { PartidaGrupoService, IPartidaGrupoService, default as partidaGrupoService } from "./PartidaGrupoService";
export { ClassificacaoService, IClassificacaoService, default as classificacaoService } from "./ClassificacaoService";
export { EliminatoriaService, IEliminatoriaService, default as eliminatoriaService } from "./EliminatoriaService";
export { ChaveService, IChaveService, default as chaveService } from "./ChaveService";

// ==================== SERVICES AUXILIARES ====================
export { default as CabecaDeChaveService } from "./CabecaDeChaveService";
export { default as EstatisticasJogadorService } from "./EstatisticasJogadorService";
export { default as HistoricoDuplaService } from "./HistoricoDuplaService";
export { default as ReiDaPraiaService } from "./ReiDaPraiaService";

// ==================== CONTAINER DI ====================
export {
  container,
  repositories,
  services,
  createTestContainer,
  resetContainer,
  IServiceContainer,
} from "./ServiceContainer";

// ==================== TIPOS ====================
export type { PlacarSet } from "./PartidaGrupoService";
