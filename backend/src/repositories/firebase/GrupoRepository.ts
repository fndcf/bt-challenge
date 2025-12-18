/**
 * Implementação Firebase do repository de Grupo
 */

import { db } from "../../config/firebase";
import { Timestamp } from "firebase-admin/firestore";
import { Grupo } from "../../models/Grupo";
import {
  IGrupoRepository,
  CriarGrupoDTO,
} from "../interfaces/IGrupoRepository";
import { NotFoundError } from "../../utils/errors";
import logger from "../../utils/logger";

const COLLECTION = "grupos";

/**
 * Repository de Grupo - Implementação Firebase
 */
export class GrupoRepository implements IGrupoRepository {
  private collection = db.collection(COLLECTION);

  /**
   * Criar novo grupo
   */
  async criar(data: CriarGrupoDTO): Promise<Grupo> {
    const agora = Timestamp.now();

    const grupoData = {
      ...data,
      duplas: data.duplas || [],
      totalDuplas: data.totalDuplas || 0,
      partidas: [],
      totalPartidas: 0,
      partidasFinalizadas: 0,
      completo: false,
      classificadas: [],
      criadoEm: agora,
      atualizadoEm: agora,
    };

    const docRef = await this.collection.add(grupoData);

    return {
      id: docRef.id,
      ...grupoData,
    } as Grupo;
  }

  /**
   * Buscar grupo por ID
   */
  async buscarPorId(id: string): Promise<Grupo | null> {
    const doc = await this.collection.doc(id).get();

    if (!doc.exists) {
      return null;
    }

    return {
      id: doc.id,
      ...doc.data(),
    } as Grupo;
  }

  /**
   * Buscar grupo por ID com validação de arena
   */
  async buscarPorIdEArena(id: string, arenaId: string): Promise<Grupo | null> {
    const grupo = await this.buscarPorId(id);

    if (!grupo || grupo.arenaId !== arenaId) {
      return null;
    }

    return grupo;
  }

  /**
   * Atualizar grupo
   */
  async atualizar(id: string, data: Partial<Grupo>): Promise<Grupo> {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundError("Grupo não encontrado");
    }

    const updateData = {
      ...data,
      atualizadoEm: Timestamp.now(),
    };

    await docRef.update(updateData);

    const updated = await this.buscarPorId(id);
    if (!updated) {
      throw new NotFoundError("Grupo não encontrado após atualização");
    }

    return updated;
  }

  /**
   * Deletar grupo
   */
  async deletar(id: string): Promise<void> {
    const doc = await this.collection.doc(id).get();

    if (!doc.exists) {
      throw new NotFoundError("Grupo não encontrado");
    }

    await this.collection.doc(id).delete();
  }

  /**
   * Verificar se grupo existe
   */
  async existe(id: string): Promise<boolean> {
    const doc = await this.collection.doc(id).get();
    return doc.exists;
  }

  /**
   * Buscar grupos de uma etapa
   */
  async buscarPorEtapa(etapaId: string, arenaId: string): Promise<Grupo[]> {
    const snapshot = await this.collection
      .where("etapaId", "==", etapaId)
      .where("arenaId", "==", arenaId)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Grupo[];
  }

  /**
   * Buscar grupos de uma etapa ordenados
   */
  async buscarPorEtapaOrdenado(
    etapaId: string,
    arenaId: string
  ): Promise<Grupo[]> {
    const snapshot = await this.collection
      .where("etapaId", "==", etapaId)
      .where("arenaId", "==", arenaId)
      .orderBy("ordem", "asc")
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Grupo[];
  }

  /**
   * Buscar grupos completos
   */
  async buscarCompletos(etapaId: string, arenaId: string): Promise<Grupo[]> {
    const snapshot = await this.collection
      .where("etapaId", "==", etapaId)
      .where("arenaId", "==", arenaId)
      .where("completo", "==", true)
      .orderBy("ordem", "asc")
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Grupo[];
  }

  /**
   * Buscar grupos incompletos
   */
  async buscarIncompletos(etapaId: string, arenaId: string): Promise<Grupo[]> {
    const snapshot = await this.collection
      .where("etapaId", "==", etapaId)
      .where("arenaId", "==", arenaId)
      .where("completo", "==", false)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Grupo[];
  }

  /**
   * Adicionar dupla ao grupo
   */
  async adicionarDupla(id: string, duplaId: string): Promise<void> {
    const grupo = await this.buscarPorId(id);
    if (!grupo) {
      throw new NotFoundError("Grupo não encontrado");
    }

    const duplas = [...grupo.duplas, duplaId];

    await this.collection.doc(id).update({
      duplas,
      totalDuplas: duplas.length,
      atualizadoEm: Timestamp.now(),
    });
  }

  /**
   * Remover dupla do grupo
   */
  async removerDupla(id: string, duplaId: string): Promise<void> {
    const grupo = await this.buscarPorId(id);
    if (!grupo) {
      throw new NotFoundError("Grupo não encontrado");
    }

    const duplas = grupo.duplas.filter((d) => d !== duplaId);

    await this.collection.doc(id).update({
      duplas,
      totalDuplas: duplas.length,
      atualizadoEm: Timestamp.now(),
    });
  }

  /**
   * Adicionar partidas ao grupo em lote (funciona para 1 ou mais)
   */
  async adicionarPartidasEmLote(
    id: string,
    partidasIds: string[]
  ): Promise<void> {
    const grupo = await this.buscarPorId(id);
    if (!grupo) {
      throw new NotFoundError("Grupo não encontrado");
    }

    const partidas = [...grupo.partidas, ...partidasIds];

    await this.collection.doc(id).update({
      partidas,
      totalPartidas: partidas.length,
      atualizadoEm: Timestamp.now(),
    });
  }

  /**
   * Incrementar partidas finalizadas
   */
  async incrementarPartidasFinalizadas(id: string): Promise<void> {
    const grupo = await this.buscarPorId(id);
    if (!grupo) {
      throw new NotFoundError("Grupo não encontrado");
    }

    const partidasFinalizadas = grupo.partidasFinalizadas + 1;
    const completo = partidasFinalizadas === grupo.totalPartidas;

    await this.collection.doc(id).update({
      partidasFinalizadas,
      completo,
      atualizadoEm: Timestamp.now(),
    });
  }

  /**
   * Decrementar partidas finalizadas
   */
  async decrementarPartidasFinalizadas(id: string): Promise<void> {
    const grupo = await this.buscarPorId(id);
    if (!grupo) {
      throw new NotFoundError("Grupo não encontrado");
    }

    const partidasFinalizadas = Math.max(0, grupo.partidasFinalizadas - 1);

    await this.collection.doc(id).update({
      partidasFinalizadas,
      completo: false,
      atualizadoEm: Timestamp.now(),
    });
  }

  /**
   * Marcar grupo como completo
   */
  async marcarCompleto(id: string, completo: boolean): Promise<void> {
    await this.collection.doc(id).update({
      completo,
      atualizadoEm: Timestamp.now(),
    });
  }

  /**
   * Definir duplas classificadas
   */
  async definirClassificadas(id: string, duplasIds: string[]): Promise<void> {
    await this.collection.doc(id).update({
      classificadas: duplasIds,
      atualizadoEm: Timestamp.now(),
    });
  }

  /**
   * Atualizar contadores do grupo
   */
  async atualizarContadores(
    id: string,
    dados: {
      totalDuplas?: number;
      totalPartidas?: number;
      partidasFinalizadas?: number;
    }
  ): Promise<void> {
    const updateData: any = {
      ...dados,
      atualizadoEm: Timestamp.now(),
    };

    // Remover undefined
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    await this.collection.doc(id).update(updateData);
  }

  /**
   * Deletar todos os grupos de uma etapa
   */
  async deletarPorEtapa(etapaId: string, arenaId: string): Promise<number> {
    const snapshot = await this.collection
      .where("etapaId", "==", etapaId)
      .where("arenaId", "==", arenaId)
      .get();

    if (snapshot.empty) {
      return 0;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    logger.info("Grupos deletados", {
      etapaId,
      arenaId,
      quantidade: snapshot.size,
    });

    return snapshot.size;
  }

  /**
   * Contar grupos de uma etapa
   */
  async contar(etapaId: string, arenaId: string): Promise<number> {
    const snapshot = await this.collection
      .where("etapaId", "==", etapaId)
      .where("arenaId", "==", arenaId)
      .count()
      .get();

    return snapshot.data().count;
  }

  /**
   * Verificar se todos os grupos estão completos
   */
  async todosCompletos(etapaId: string, arenaId: string): Promise<boolean> {
    const incompletos = await this.buscarIncompletos(etapaId, arenaId);
    return incompletos.length === 0;
  }

  // ==================== BATCH OPERATIONS ====================

  /**
   * Criar múltiplos grupos em lote
   */
  async criarEmLote(items: Partial<Grupo>[]): Promise<Grupo[]> {
    const batch = db.batch();
    const agora = Timestamp.now();
    const grupos: Grupo[] = [];

    for (const item of items) {
      const docRef = this.collection.doc();
      const grupoData = {
        ...item,
        id: docRef.id,
        duplas: item.duplas || [],
        totalDuplas: item.totalDuplas || 0,
        partidas: [],
        totalPartidas: 0,
        partidasFinalizadas: 0,
        completo: false,
        classificadas: [],
        criadoEm: agora,
        atualizadoEm: agora,
      };

      batch.set(docRef, grupoData);
      grupos.push(grupoData as Grupo);
    }

    await batch.commit();

    logger.info("Grupos criados em lote", { quantidade: grupos.length });

    return grupos;
  }

  /**
   * Deletar múltiplos grupos em lote
   */
  async deletarEmLote(ids: string[]): Promise<void> {
    if (ids.length === 0) return;

    const batch = db.batch();

    for (const id of ids) {
      batch.delete(this.collection.doc(id));
    }

    await batch.commit();

    logger.info("Grupos deletados em lote", { quantidade: ids.length });
  }

  /**
   * Atualizar múltiplos grupos em lote
   */
  async atualizarEmLote(
    updates: Array<{ id: string; data: Partial<Grupo> }>
  ): Promise<void> {
    if (updates.length === 0) return;

    const batch = db.batch();
    const agora = Timestamp.now();

    for (const { id, data } of updates) {
      batch.update(this.collection.doc(id), {
        ...data,
        atualizadoEm: agora,
      });
    }

    await batch.commit();

    logger.info("Grupos atualizados em lote", { quantidade: updates.length });
  }
}

// Exportar instância única
export const grupoRepository = new GrupoRepository();
