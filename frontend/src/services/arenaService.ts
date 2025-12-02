/**
 * arenaService.ts
 *
 * ⚠️ ARQUIVO DE COMPATIBILIDADE
 *
 * Este arquivo mantém a API antiga para não quebrar imports existentes.
 * Use os services específicos para novos códigos:
 *
 * - arenaAdminService  → Operações administrativas (autenticadas)
 * - arenaPublicService → Operações públicas (sem auth)
 *
 * @deprecated Use arenaAdminService ou arenaPublicService diretamente
 */

import {
  arenaAdminService,
  CreateArenaDTO,
  CreateArenaResponse,
} from "./arenaAdminService";
import {
  arenaPublicService,
  EtapaPublica,
  JogadorPublico,
  EstatisticasAgregadas,
  FiltrosEtapasPublicas,
  FiltrosJogadoresPublicos,
} from "./arenaPublicService";
import { Arena } from "../types/arena";

// Re-exportar tipos para compatibilidade
export type {
  CreateArenaDTO,
  CreateArenaResponse,
  EtapaPublica,
  JogadorPublico,
  EstatisticasAgregadas,
};

/**
 * @deprecated Use arenaAdminService ou arenaPublicService
 */
class ArenaService {
  // ============================================
  // MÉTODOS ADMIN → Delegam para arenaAdminService
  // ============================================

  /** @deprecated Use arenaAdminService.criar() */
  async create(data: CreateArenaDTO): Promise<CreateArenaResponse> {
    return arenaAdminService.criar(data);
  }

  /** @deprecated Use arenaAdminService.buscarPorSlug() */
  async getBySlug(slug: string): Promise<Arena | null> {
    return arenaAdminService.buscarPorSlug(slug);
  }

  /** @deprecated Use arenaAdminService.buscarPorId() */
  async getById(id: string): Promise<Arena | null> {
    return arenaAdminService.buscarPorId(id);
  }

  /** @deprecated Use arenaAdminService.obterMinhaArena() */
  async getMyArena(): Promise<Arena | null> {
    return arenaAdminService.obterMinhaArena();
  }

  /** @deprecated Use arenaAdminService.listar() */
  async list(): Promise<Arena[]> {
    return arenaAdminService.listar();
  }

  /** @deprecated Use arenaAdminService.atualizar() */
  async update(id: string, data: Partial<Arena>): Promise<Arena> {
    return arenaAdminService.atualizar(id, data);
  }

  /** @deprecated Use arenaAdminService.desativar() */
  async deactivate(id: string): Promise<void> {
    return arenaAdminService.desativar(id);
  }

  /** @deprecated Use arenaAdminService.verificarSlugDisponivel() */
  async checkSlugAvailability(slug: string): Promise<boolean> {
    return arenaAdminService.verificarSlugDisponivel(slug);
  }

  // ============================================
  // MÉTODOS PÚBLICOS → Delegam para arenaPublicService
  // ============================================

  /** @deprecated Use arenaPublicService.buscarArena() */
  async getArenaPublica(slug: string): Promise<Arena> {
    return arenaPublicService.buscarArena(slug) as Promise<Arena>;
  }

  /** @deprecated Use arenaPublicService.listarEtapas() */
  async getEtapasPublicas(
    slug: string,
    params?: FiltrosEtapasPublicas
  ): Promise<EtapaPublica[]> {
    return arenaPublicService.listarEtapas(slug, params);
  }

  /** @deprecated Use arenaPublicService.buscarEtapa() */
  async getEtapaPublica(slug: string, etapaId: string): Promise<EtapaPublica> {
    return arenaPublicService.buscarEtapa(slug, etapaId);
  }

  /** @deprecated Use arenaPublicService.buscarInscritosEtapa() */
  async getJogadoresEtapa(
    slug: string,
    etapaId: string
  ): Promise<JogadorPublico[]> {
    return arenaPublicService.buscarInscritosEtapa(slug, etapaId);
  }

  /** @deprecated Use arenaPublicService.buscarRanking() */
  async getRankingPublico(
    slug: string,
    limite = 50,
    genero?: string,
    nivel?: string
  ): Promise<JogadorPublico[]> {
    return arenaPublicService.buscarRanking(slug, limite, genero, nivel);
  }

  /** @deprecated Use arenaPublicService.buscarEstatisticas() */
  async getEstatisticasPublicas(slug: string): Promise<any> {
    return arenaPublicService.buscarEstatisticas(slug);
  }

  /** @deprecated Use arenaPublicService.listarJogadores() */
  async getJogadoresPublicos(
    slug: string,
    params?: FiltrosJogadoresPublicos
  ): Promise<{ jogadores: JogadorPublico[]; total: number }> {
    return arenaPublicService.listarJogadores(slug, params);
  }

  /** @deprecated Use arenaPublicService.buscarJogador() */
  async getJogadorPublico(
    slug: string,
    jogadorId: string
  ): Promise<JogadorPublico | null> {
    return arenaPublicService.buscarJogador(slug, jogadorId);
  }

  /** @deprecated Use arenaPublicService.buscarHistoricoJogador() */
  async getHistoricoJogador(slug: string, jogadorId: string): Promise<any> {
    return arenaPublicService.buscarHistoricoJogador(slug, jogadorId);
  }

  /** @deprecated Use arenaPublicService.buscarEstatisticasJogador() */
  async getEstatisticasAgregadas(
    slug: string,
    jogadorId: string
  ): Promise<EstatisticasAgregadas> {
    return arenaPublicService.buscarEstatisticasJogador(slug, jogadorId);
  }

  /** @deprecated Use arenaPublicService.buscarChavesEtapa() */
  async getChavesEtapa(slug: string, etapaId: string): Promise<any> {
    return arenaPublicService.buscarChavesEtapa(slug, etapaId);
  }

  /** @deprecated Use arenaPublicService.buscarGruposEtapa() */
  async getGruposEtapa(slug: string, etapaId: string): Promise<any> {
    return arenaPublicService.buscarGruposEtapa(slug, etapaId);
  }
}

// Exportar instância para compatibilidade
export const arenaService = new ArenaService();

// Exportar services novos para migração gradual
export { arenaAdminService, arenaPublicService };
