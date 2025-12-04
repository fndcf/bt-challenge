import { db } from "../config/firebase";
import { COLLECTIONS } from "../config/firestore";
import { Arena, ArenaType } from "../domain/Arena";
import { NotFoundError, ConflictError } from "../utils/errors";

/**
 * Define o contrato de operações com arenas
 */
export interface IArenaRepository {
  create(arena: ArenaType): Promise<Arena>;
  findById(id: string): Promise<Arena | null>;
  findBySlug(slug: string): Promise<Arena | null>;
  findByAdminUid(adminUid: string): Promise<Arena | null>;
  list(): Promise<Arena[]>;
  update(id: string, data: Partial<ArenaType>): Promise<Arena>;
  delete(id: string): Promise<void>;
  exists(slug: string): Promise<boolean>;
}

/**
 * Implementa operações de persistência para arenas
 */
export class ArenaRepository implements IArenaRepository {
  private collection = db.collection(COLLECTIONS.ARENAS);

  /**
   * Criar nova arena
   */
  async create(arenaData: ArenaType): Promise<Arena> {
    // Verificar se slug já existe
    const existingArena = await this.findBySlug(arenaData.slug);
    if (existingArena) {
      throw new ConflictError(`Arena com slug "${arenaData.slug}" já existe`);
    }

    // Criar documento
    const docRef = this.collection.doc();
    const arena = new Arena({
      ...arenaData,
      id: docRef.id,
      ativa: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Salvar no Firestore
    await docRef.set(arena.toObject());

    return arena;
  }

  /**
   * Buscar arena por ID
   */
  async findById(id: string): Promise<Arena | null> {
    const doc = await this.collection.doc(id).get();

    if (!doc.exists) {
      return null;
    }

    return Arena.fromFirestore({ id: doc.id, ...doc.data() });
  }

  /**
   * Buscar arena por slug
   */
  async findBySlug(slug: string): Promise<Arena | null> {
    const snapshot = await this.collection
      .where("slug", "==", slug)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return Arena.fromFirestore({ id: doc.id, ...doc.data() });
  }

  /**
   * Buscar arena por UID do admin
   */
  async findByAdminUid(adminUid: string): Promise<Arena | null> {
    const snapshot = await this.collection
      .where("adminUid", "==", adminUid)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return Arena.fromFirestore({ id: doc.id, ...doc.data() });
  }

  /**
   * Listar todas as arenas
   */
  async list(): Promise<Arena[]> {
    const snapshot = await this.collection
      .where("ativa", "==", true)
      .orderBy("createdAt", "desc")
      .get();

    return snapshot.docs.map((doc) =>
      Arena.fromFirestore({ id: doc.id, ...doc.data() })
    );
  }

  /**
   * Atualizar arena
   */
  async update(id: string, data: Partial<ArenaType>): Promise<Arena> {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundError("Arena não encontrada");
    }

    // Se estiver atualizando slug, verificar se já existe
    if (data.slug && data.slug !== doc.data()?.slug) {
      const existingArena = await this.findBySlug(data.slug);
      if (existingArena) {
        throw new ConflictError(`Arena com slug "${data.slug}" já existe`);
      }
    }

    // Atualizar
    const updateData = {
      ...data,
      updatedAt: new Date(),
    };

    await docRef.update(updateData);

    // Buscar e retornar arena atualizada
    const updated = await this.findById(id);
    if (!updated) {
      throw new NotFoundError("Arena não encontrada após atualização");
    }

    return updated;
  }

  /**
   * Deletar arena (soft delete)
   */
  async delete(id: string): Promise<void> {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundError("Arena não encontrada");
    }

    // Soft delete - apenas desativa
    await docRef.update({
      ativa: false,
      updatedAt: new Date(),
    });
  }

  /**
   * Verificar se slug existe
   */
  async exists(slug: string): Promise<boolean> {
    const arena = await this.findBySlug(slug);
    return arena !== null;
  }
}

// Exportar instância única
export const arenaRepository = new ArenaRepository();
