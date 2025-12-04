/**
 * Container de Injeção de Dependência
 * Centraliza a criação e gerenciamento de todas as instâncias
 * de repositories e services da aplicação.
 */

// ==================== REPOSITORIES ====================
import {
  IArenaRepository,
  arenaRepository,
} from "../repositories/ArenaRepository";

// Repositories da Fase 2
import {
  IEtapaRepository,
  IJogadorRepository,
  IDuplaRepository,
  IGrupoRepository,
  IPartidaRepository,
  IInscricaoRepository,
  IConfrontoEliminatorioRepository,
} from "../repositories/interfaces";

import {
  etapaRepository,
  jogadorRepository,
  duplaRepository,
  grupoRepository,
  partidaRepository,
  inscricaoRepository,
  confrontoEliminatorioRepository,
} from "../repositories/firebase";

// ==================== SERVICES ====================
import { ArenaService, arenaService } from "./ArenaService";
import EtapaService from "./EtapaService";
import JogadorService from "./JogadorService";

// Services da Fase 3
import DuplaService, { IDuplaService } from "./DuplaService";
import GrupoService, { IGrupoService } from "./GrupoService";
import PartidaGrupoService, {
  IPartidaGrupoService,
} from "./PartidaGrupoService";
import ClassificacaoService, {
  IClassificacaoService,
} from "./ClassificacaoService";
import EliminatoriaService, {
  IEliminatoriaService,
} from "./EliminatoriaService";
import ChaveService, { IChaveService } from "./ChaveService";

// Services auxiliares
import CabecaDeChaveService from "./CabecaDeChaveService";
import EstatisticasJogadorService from "./EstatisticasJogadorService";
import HistoricoDuplaService from "./HistoricoDuplaService";
import ReiDaPraiaService from "./ReiDaPraiaService";

/**
 * Interface do Container
 */
export interface IServiceContainer {
  // Repositories
  readonly repositories: {
    arena: IArenaRepository;
    etapa: IEtapaRepository;
    jogador: IJogadorRepository;
    dupla: IDuplaRepository;
    grupo: IGrupoRepository;
    partida: IPartidaRepository;
    inscricao: IInscricaoRepository;
    confrontoEliminatorio: IConfrontoEliminatorioRepository;
  };

  // Services
  readonly services: {
    arena: ArenaService;
    etapa: typeof EtapaService;
    jogador: typeof JogadorService;
    dupla: IDuplaService;
    grupo: IGrupoService;
    partidaGrupo: IPartidaGrupoService;
    classificacao: IClassificacaoService;
    eliminatoria: IEliminatoriaService;
    chave: IChaveService;
    cabecaDeChave: typeof CabecaDeChaveService;
    estatisticasJogador: typeof EstatisticasJogadorService;
    historicoDupla: typeof HistoricoDuplaService;
    reiDaPraia: typeof ReiDaPraiaService;
  };
}

/**
 * Container de Services
 * Implementação padrão com singletons
 */
class ServiceContainer implements IServiceContainer {
  private static instance: ServiceContainer;

  // Cache de instâncias
  private _repositories: IServiceContainer["repositories"] | null = null;
  private _services: IServiceContainer["services"] | null = null;

  private constructor() {}

  /**
   * Obter instância única do container (Singleton)
   */
  static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }

  /**
   * Resetar container (útil para testes)
   */
  static reset(): void {
    ServiceContainer.instance = new ServiceContainer();
  }

  /**
   * Repositories
   */
  get repositories(): IServiceContainer["repositories"] {
    if (!this._repositories) {
      this._repositories = {
        arena: arenaRepository,
        etapa: etapaRepository,
        jogador: jogadorRepository,
        dupla: duplaRepository,
        grupo: grupoRepository,
        partida: partidaRepository,
        inscricao: inscricaoRepository,
        confrontoEliminatorio: confrontoEliminatorioRepository,
      };
    }
    return this._repositories;
  }

  /**
   * Services
   */
  get services(): IServiceContainer["services"] {
    if (!this._services) {
      this._services = {
        arena: arenaService,
        etapa: EtapaService,
        jogador: JogadorService,
        dupla: DuplaService,
        grupo: GrupoService,
        partidaGrupo: PartidaGrupoService,
        classificacao: ClassificacaoService,
        eliminatoria: EliminatoriaService,
        chave: ChaveService,
        cabecaDeChave: CabecaDeChaveService,
        estatisticasJogador: EstatisticasJogadorService,
        historicoDupla: HistoricoDuplaService,
        reiDaPraia: ReiDaPraiaService,
      };
    }
    return this._services;
  }

  /**
   * Substituir repository (para testes)
   */
  setRepository<K extends keyof IServiceContainer["repositories"]>(
    key: K,
    repository: IServiceContainer["repositories"][K]
  ): void {
    if (!this._repositories) {
      this.repositories; // Inicializa
    }
    (this._repositories as any)[key] = repository;
  }

  /**
   * Substituir service (para testes)
   */
  setService<K extends keyof IServiceContainer["services"]>(
    key: K,
    service: IServiceContainer["services"][K]
  ): void {
    if (!this._services) {
      this.services; // Inicializa
    }
    (this._services as any)[key] = service;
  }
}

// ==================== EXPORTS ====================

/**
 * Container global (singleton)
 */
export const container = ServiceContainer.getInstance();

/**
 * Atalhos para acesso rápido
 */
export const repositories = container.repositories;
export const services = container.services;

/**
 * Factory para criar container de testes
 */
export function createTestContainer(
  overrides?: Partial<{
    repositories: Partial<IServiceContainer["repositories"]>;
    services: Partial<IServiceContainer["services"]>;
  }>
): IServiceContainer {
  // Resetar para limpar cache
  ServiceContainer.reset();
  const testContainer = ServiceContainer.getInstance();

  // Aplicar overrides de repositories
  if (overrides?.repositories) {
    Object.entries(overrides.repositories).forEach(([key, value]) => {
      if (value) {
        testContainer.setRepository(
          key as keyof IServiceContainer["repositories"],
          value as any
        );
      }
    });
  }

  // Aplicar overrides de services
  if (overrides?.services) {
    Object.entries(overrides.services).forEach(([key, value]) => {
      if (value) {
        testContainer.setService(
          key as keyof IServiceContainer["services"],
          value as any
        );
      }
    });
  }

  return testContainer;
}

/**
 * Helper para resetar container após testes
 */
export function resetContainer(): void {
  ServiceContainer.reset();
}
