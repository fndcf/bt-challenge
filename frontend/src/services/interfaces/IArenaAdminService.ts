/**
 * Interface para operações ADMINISTRATIVAS de Arena
 */

import { Arena } from "@/types/arena";
import { CreateArenaDTO, CreateArenaResponse } from "../arenaAdminService";

export interface IArenaAdminService {
  /**
   * Criar nova arena
   */
  criar(data: CreateArenaDTO): Promise<CreateArenaResponse>;

  /**
   * Buscar arena por slug
   */
  buscarPorSlug(slug: string): Promise<Arena | null>;

  /**
   * Buscar arena por ID
   */
  buscarPorId(id: string): Promise<Arena | null>;

  /**
   * Obter arena do administrador autenticado
   */
  obterMinhaArena(): Promise<Arena | null>;

  /**
   * Listar todas as arenas
   */
  listar(): Promise<Arena[]>;

  /**
   * Atualizar arena
   */
  atualizar(id: string, data: Partial<Arena>): Promise<Arena>;

  /**
   * Desativar arena
   */
  desativar(id: string): Promise<void>;

  /**
   * Verificar disponibilidade de slug
   */
  verificarSlugDisponivel(slug: string): Promise<boolean>;
}
