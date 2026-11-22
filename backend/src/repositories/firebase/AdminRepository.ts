/**
 * Implementação Firebase do repository de Admin
 */

import { db } from "../../config/firebase";
import { COLLECTIONS } from "../../config/firestore";
import { Admin, CriarAdminDTO } from "../../models/Admin";
import { IAdminRepository } from "../interfaces/IAdminRepository";

export class AdminRepository implements IAdminRepository {
  private collection = db.collection(COLLECTIONS.ADMINS);

  /**
   * Criar o admin com a primeira arena
   */
  async criar(data: CriarAdminDTO): Promise<void> {
    await this.collection.doc(data.uid).set({
      uid: data.uid,
      email: data.email,
      arenaId: data.arenaId,
      role: "admin",
      createdAt: new Date(),
    });
  }

  /**
   * Buscar admin pelo uid do Firebase Auth
   */
  async buscarPorUid(uid: string): Promise<Admin | null> {
    const doc = await this.collection.doc(uid).get();

    if (!doc.exists) {
      return null;
    }

    const dados = doc.data();

    return {
      ...dados,
      uid,
      // Cadastro antigo: uma arena só, no campo arenaId
      arenaIds: dados?.arenaIds || (dados?.arenaId ? [dados.arenaId] : []),
    } as Admin;
  }

  /**
   * Trocar a arena padrão; com `arenaIds`, troca também a lista de arenas
   */
  async definirArenaPadrao(
    uid: string,
    arenaId: string,
    arenaIds?: string[]
  ): Promise<void> {
    await this.collection.doc(uid).update({
      defaultArenaId: arenaId,
      ...(arenaIds && { arenaIds }),
    });
  }
}

// Exportar instância única
export const adminRepository = new AdminRepository();
