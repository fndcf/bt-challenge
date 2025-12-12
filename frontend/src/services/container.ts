/**
 * Dependency Injection Container
 */

// Importar interfaces
import {
  IArenaAdminService,
  IArenaPublicService,
  IEtapaService,
  IJogadorService,
  IChaveService,
  ICabecaDeChaveService,
  IPartidaService,
  IReiDaPraiaService,
  ISuperXService,
  ITeamsService,
} from "./interfaces";

// Importar implementações
import arenaAdminService from "./arenaAdminService";
import arenaPublicService from "./arenaPublicService";
import etapaService from "./etapaService";
import jogadorService from "./jogadorService";
import chaveService from "./chaveService";
import cabecaDeChaveService from "./cabecaDeChaveService";
import partidaService from "./partidaService";
import reiDaPraiaService from "./reiDaPraiaService";
import superXService from "./superXService";
import teamsService from "./teamsService";

/**
 * Gerencia todas as instâncias de services da aplicação
 */
class ServiceContainer {
  private services = new Map<string, any>();

  /**
   * Registrar um service no container
   */
  register<T>(key: string, instance: T): void {
    this.services.set(key, instance);
  }

  /**
   * Obter um service do container
   */
  get<T>(key: string): T {
    const service = this.services.get(key);
    if (!service) {
      throw new Error(`Service "${key}" não encontrado no container`);
    }
    return service as T;
  }

  /**
   * Verificar se um service está registrado
   */
  has(key: string): boolean {
    return this.services.has(key);
  }

  /**
   * Remover um service do container (útil para testes)
   */
  remove(key: string): void {
    this.services.delete(key);
  }

  /**
   * Limpar todos os services (útil para testes)
   */
  clear(): void {
    this.services.clear();
  }
}

// Criar instância única do container
export const container = new ServiceContainer();

// ============================================
// REGISTRAR SERVICES
// ============================================

// Arena Services
container.register<IArenaAdminService>("arenaAdminService", arenaAdminService);
container.register<IArenaPublicService>(
  "arenaPublicService",
  arenaPublicService
);

// Etapa Service
container.register<IEtapaService>("etapaService", etapaService);

// Jogador Service
container.register<IJogadorService>("jogadorService", jogadorService);

// Chave Services
container.register<IChaveService>("chaveService", chaveService);
container.register<ICabecaDeChaveService>(
  "cabecaDeChaveService",
  cabecaDeChaveService
);
container.register<IPartidaService>("partidaService", partidaService);
container.register<IReiDaPraiaService>("reiDaPraiaService", reiDaPraiaService);
container.register<ISuperXService>("superXService", superXService);
container.register<ITeamsService>("teamsService", teamsService);

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Obter ArenaAdminService
 */
export const getArenaAdminService = (): IArenaAdminService => {
  return container.get<IArenaAdminService>("arenaAdminService");
};

/**
 * Obter ArenaPublicService
 */
export const getArenaPublicService = (): IArenaPublicService => {
  return container.get<IArenaPublicService>("arenaPublicService");
};

/**
 * Obter EtapaService
 */
export const getEtapaService = (): IEtapaService => {
  return container.get<IEtapaService>("etapaService");
};

/**
 * Obter JogadorService
 */
export const getJogadorService = (): IJogadorService => {
  return container.get<IJogadorService>("jogadorService");
};

/**
 * Obter ChaveService
 */
export const getChaveService = (): IChaveService => {
  return container.get<IChaveService>("chaveService");
};

/**
 * Obter CabecaDeChaveService
 */
export const getCabecaDeChaveService = (): ICabecaDeChaveService => {
  return container.get<ICabecaDeChaveService>("cabecaDeChaveService");
};

/**
 * Obter PartidaService
 */
export const getPartidaService = (): IPartidaService => {
  return container.get<IPartidaService>("partidaService");
};

/**
 * Obter ReiDaPraiaService
 */
export const getReiDaPraiaService = (): IReiDaPraiaService => {
  return container.get<IReiDaPraiaService>("reiDaPraiaService");
};

/**
 * Obter SuperXService
 */
export const getSuperXService = (): ISuperXService => {
  return container.get<ISuperXService>("superXService");
};

/**
 * Obter TeamsService
 */
export const getTeamsService = (): ITeamsService => {
  return container.get<ITeamsService>("teamsService");
};

/**
 * Exportar tipo do container para uso em testes
 */
export type { ServiceContainer };
