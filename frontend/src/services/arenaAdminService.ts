/**
 * arenaAdminService.ts
 * Service para operações ADMINISTRATIVAS de Arena (requerem autenticação)
 *
 * Responsabilidade única: CRUD de arenas para administradores
 */

import { apiClient } from "./apiClient";
import { Arena } from "../types/arena";
import { handleError } from "../utils/errorHandler";
import logger from "../utils/logger";

// ============================================
// DTOs
// ============================================

export interface CreateArenaDTO {
  nome: string;
  slug: string;
  adminEmail: string;
  adminPassword: string;
}

export interface CreateArenaResponse {
  arena: Arena;
  adminUid: string;
  url: string;
}

// ============================================
// SERVICE
// ============================================

class ArenaAdminService {
  private readonly basePath = "/arenas";

  /**
   * Criar nova arena
   */
  async criar(data: CreateArenaDTO): Promise<CreateArenaResponse> {
    try {
      const response = await apiClient.post<CreateArenaResponse>(
        this.basePath,
        data
      );

      logger.info("Arena criada", {
        arenaId: response.arena.id,
        nome: response.arena.nome,
        slug: response.arena.slug,
        adminUid: response.adminUid,
      });

      return response;
    } catch (error) {
      const appError = handleError(error, "ArenaAdminService.criar");
      throw new Error(appError.message);
    }
  }

  /**
   * Buscar arena por slug
   */
  async buscarPorSlug(slug: string): Promise<Arena | null> {
    try {
      const arena = await apiClient.get<Arena>(`${this.basePath}/slug/${slug}`);
      return arena;
    } catch (error) {
      logger.warn("Arena não encontrada por slug", { slug });
      return null;
    }
  }

  /**
   * Buscar arena por ID
   */
  async buscarPorId(id: string): Promise<Arena | null> {
    try {
      const arena = await apiClient.get<Arena>(`${this.basePath}/${id}`);
      return arena;
    } catch (error) {
      logger.warn("Arena não encontrada por ID", { id });
      return null;
    }
  }

  /**
   * Obter arena do administrador autenticado
   */
  async obterMinhaArena(): Promise<Arena | null> {
    try {
      const arena = await apiClient.get<Arena>(`${this.basePath}/me`);
      return arena;
    } catch (error) {
      logger.warn("Erro ao buscar arena do admin autenticado");
      return null;
    }
  }

  /**
   * Listar todas as arenas
   */
  async listar(): Promise<Arena[]> {
    try {
      const response = await apiClient.get<{ arenas: Arena[]; total: number }>(
        this.basePath
      );
      return response.arenas;
    } catch (error) {
      logger.warn("Erro ao listar arenas - retornando lista vazia");
      return [];
    }
  }

  /**
   * Atualizar arena
   */
  async atualizar(id: string, data: Partial<Arena>): Promise<Arena> {
    try {
      const arena = await apiClient.put<Arena>(`${this.basePath}/${id}`, data);

      logger.info("Arena atualizada", {
        arenaId: arena.id,
        nome: arena.nome,
        camposAtualizados: Object.keys(data),
      });

      return arena;
    } catch (error) {
      const appError = handleError(error, "ArenaAdminService.atualizar");
      throw new Error(appError.message);
    }
  }

  /**
   * Desativar arena
   */
  async desativar(id: string): Promise<void> {
    try {
      await apiClient.delete(`${this.basePath}/${id}`);

      logger.info("Arena desativada", { arenaId: id });
    } catch (error) {
      const appError = handleError(error, "ArenaAdminService.desativar");
      throw new Error(appError.message);
    }
  }

  /**
   * Verificar disponibilidade de slug
   */
  async verificarSlugDisponivel(slug: string): Promise<boolean> {
    try {
      const response = await apiClient.get<{
        slug: string;
        available: boolean;
        message: string;
      }>(`${this.basePath}/check-slug/${slug}`);
      return response.available;
    } catch (error) {
      logger.warn("Erro ao verificar slug - retornando indisponível", { slug });
      return false;
    }
  }
}

// Exportar instância única
export const arenaAdminService = new ArenaAdminService();
export default arenaAdminService;
