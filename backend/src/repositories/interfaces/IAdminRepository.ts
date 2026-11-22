/**
 * Interface do repository de Admin
 */

import { Admin, CriarAdminDTO } from "../../models/Admin";

export interface IAdminRepository {
  /**
   * Criar o admin com a primeira arena
   */
  criar(data: CriarAdminDTO): Promise<void>;

  /**
   * Buscar admin pelo uid do Firebase Auth
   */
  buscarPorUid(uid: string): Promise<Admin | null>;

  /**
   * Trocar a arena padrão; com `arenaIds`, troca também a lista de arenas
   */
  definirArenaPadrao(
    uid: string,
    arenaId: string,
    arenaIds?: string[]
  ): Promise<void>;
}
