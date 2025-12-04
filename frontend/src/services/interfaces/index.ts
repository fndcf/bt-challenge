/**
 * index.ts
 * Exportação centralizada de todas as interfaces de serviços
 *
 * Facilita importação: import { IJogadorService, IChaveService } from '@/services/interfaces'
 */

export type { IJogadorService } from "./IJogadorService";
export type { IArenaPublicService } from "./IArenaPublicService";
export type { IChaveService } from "./IChaveService";
export type { ICabecaDeChaveService } from "./ICabecaDeChaveService";
export type { IPartidaService } from "./IPartidaService";
export type { IReiDaPraiaService } from "./IReiDaPraiaService";

// Interfaces já existentes
export type { IArenaAdminService } from "./IArenaAdminService";
export type { IEtapaService } from "./IEtapaService";
