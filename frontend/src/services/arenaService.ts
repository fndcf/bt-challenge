import { apiClient } from "./apiClient";
import { Arena } from "../types";
import { handleError } from "../utils/errorHandler";

/**
 * DTO para criar arena
 */
export interface CreateArenaDTO {
  nome: string;
  slug: string;
  adminEmail: string;
  adminPassword: string;
}

/**
 * Resposta da criação de arena
 */
export interface CreateArenaResponse {
  arena: Arena;
  adminUid: string;
  url: string;
}

/**
 * Serviço de Arena
 * Gerencia operações relacionadas a arenas
 */
class ArenaService {
  private readonly basePath = "/arenas";

  /**
   * Criar nova arena
   */
  async create(data: CreateArenaDTO): Promise<CreateArenaResponse> {
    try {
      const response = await apiClient.post<CreateArenaResponse>(
        this.basePath,
        data
      );
      return response;
    } catch (error) {
      const appError = handleError(error, "EtapaService.listar");
      throw new Error(appError.message);
    }
  }

  /**
   * Buscar arena por slug
   */
  async getBySlug(slug: string): Promise<Arena | null> {
    try {
      const arena = await apiClient.get<Arena>(`${this.basePath}/slug/${slug}`);
      return arena;
    } catch (error) {
      console.error("Erro ao buscar arena:", error);
      return null;
    }
  }

  /**
   * Buscar arena por ID
   */
  async getById(id: string): Promise<Arena | null> {
    try {
      const arena = await apiClient.get<Arena>(`${this.basePath}/${id}`);
      return arena;
    } catch (error) {
      console.error("Erro ao buscar arena:", error);
      return null;
    }
  }

  /**
   * Obter minha arena (admin autenticado)
   */
  async getMyArena(): Promise<Arena | null> {
    try {
      const arena = await apiClient.get<Arena>(`${this.basePath}/me`);
      return arena;
    } catch (error) {
      console.error("Erro ao buscar minha arena:", error);
      return null;
    }
  }

  /**
   * Listar todas as arenas
   */
  async list(): Promise<Arena[]> {
    try {
      const response = await apiClient.get<{ arenas: Arena[]; total: number }>(
        this.basePath
      );
      return response.arenas;
    } catch (error) {
      console.error("Erro ao listar arenas:", error);
      return [];
    }
  }

  /**
   * Atualizar arena
   */
  async update(id: string, data: Partial<Arena>): Promise<Arena> {
    try {
      const arena = await apiClient.put<Arena>(`${this.basePath}/${id}`, data);
      return arena;
    } catch (error) {
      const appError = handleError(error, "EtapaService.listar");
      throw new Error(appError.message);
    }
  }

  /**
   * Desativar arena
   */
  async deactivate(id: string): Promise<void> {
    try {
      await apiClient.delete(`${this.basePath}/${id}`);
    } catch (error) {
      const appError = handleError(error, "EtapaService.listar");
      throw new Error(appError.message);
    }
  }

  /**
   * Verificar disponibilidade de slug
   */
  async checkSlugAvailability(slug: string): Promise<boolean> {
    try {
      const response = await apiClient.get<{
        slug: string;
        available: boolean;
        message: string;
      }>(`${this.basePath}/check-slug/${slug}`);
      return response.available;
    } catch (error) {
      console.error("Erro ao verificar slug:", error);
      return false;
    }
  }
}

export const arenaService = new ArenaService();
