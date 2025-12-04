/**
 * Implementação Firebase do repository de Partida
 */

import { db } from "../../config/firebase";
import { Timestamp } from "firebase-admin/firestore";
import { Partida, StatusPartida } from "../../models/Partida";
import { FaseEtapa } from "../../models/Etapa";
import {
  IPartidaRepository,
  CriarPartidaDTO,
  RegistrarResultadoDTO,
} from "../interfaces/IPartidaRepository";
import { NotFoundError } from "../../utils/errors";
import logger from "../../utils/logger";

const COLLECTION = "partidas";

/**
 * Repository de Partida - Implementação Firebase
 */
export class PartidaRepository implements IPartidaRepository {
  private collection = db.collection(COLLECTION);

  /**
   * Criar nova partida
   */
  async criar(data: CriarPartidaDTO): Promise<Partida> {
    const agora = Timestamp.now();

    const partidaData = {
      ...data,
      status: StatusPartida.AGENDADA,
      setsDupla1: 0,
      setsDupla2: 0,
      placar: [],
      criadoEm: agora,
      atualizadoEm: agora,
    };

    const docRef = await this.collection.add(partidaData);

    return {
      id: docRef.id,
      ...partidaData,
    } as Partida;
  }

  /**
   * Buscar partida por ID
   */
  async buscarPorId(id: string): Promise<Partida | null> {
    const doc = await this.collection.doc(id).get();

    if (!doc.exists) {
      return null;
    }

    return {
      id: doc.id,
      ...doc.data(),
    } as Partida;
  }

  /**
   * Buscar partida por ID com validação de arena
   */
  async buscarPorIdEArena(
    id: string,
    arenaId: string
  ): Promise<Partida | null> {
    const partida = await this.buscarPorId(id);

    if (!partida || partida.arenaId !== arenaId) {
      return null;
    }

    return partida;
  }

  /**
   * Atualizar partida
   */
  async atualizar(id: string, data: Partial<Partida>): Promise<Partida> {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundError("Partida não encontrada");
    }

    const updateData = {
      ...data,
      atualizadoEm: Timestamp.now(),
    };

    await docRef.update(updateData);

    const updated = await this.buscarPorId(id);
    if (!updated) {
      throw new NotFoundError("Partida não encontrada após atualização");
    }

    return updated;
  }

  /**
   * Deletar partida
   */
  async deletar(id: string): Promise<void> {
    const doc = await this.collection.doc(id).get();

    if (!doc.exists) {
      throw new NotFoundError("Partida não encontrada");
    }

    await this.collection.doc(id).delete();
  }

  /**
   * Verificar se partida existe
   */
  async existe(id: string): Promise<boolean> {
    const doc = await this.collection.doc(id).get();
    return doc.exists;
  }

  /**
   * Buscar partidas de uma etapa
   */
  async buscarPorEtapa(etapaId: string, arenaId: string): Promise<Partida[]> {
    const snapshot = await this.collection
      .where("etapaId", "==", etapaId)
      .where("arenaId", "==", arenaId)
      .orderBy("criadoEm", "asc")
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Partida[];
  }

  /**
   * Buscar partidas de um grupo
   */
  async buscarPorGrupo(grupoId: string): Promise<Partida[]> {
    const snapshot = await this.collection
      .where("grupoId", "==", grupoId)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Partida[];
  }

  /**
   * Buscar partidas de um grupo ordenadas
   */
  async buscarPorGrupoOrdenado(grupoId: string): Promise<Partida[]> {
    const snapshot = await this.collection
      .where("grupoId", "==", grupoId)
      .orderBy("criadoEm", "asc")
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Partida[];
  }

  /**
   * Buscar partidas por fase
   */
  async buscarPorFase(
    etapaId: string,
    arenaId: string,
    fase: FaseEtapa
  ): Promise<Partida[]> {
    const snapshot = await this.collection
      .where("etapaId", "==", etapaId)
      .where("arenaId", "==", arenaId)
      .where("fase", "==", fase)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Partida[];
  }

  /**
   * Buscar partidas por tipo
   */
  async buscarPorTipo(
    etapaId: string,
    arenaId: string,
    tipo: "grupos" | "eliminatoria"
  ): Promise<Partida[]> {
    const snapshot = await this.collection
      .where("etapaId", "==", etapaId)
      .where("arenaId", "==", arenaId)
      .where("tipo", "==", tipo)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Partida[];
  }

  /**
   * Buscar partidas por status
   */
  async buscarPorStatus(
    etapaId: string,
    arenaId: string,
    status: StatusPartida
  ): Promise<Partida[]> {
    const snapshot = await this.collection
      .where("etapaId", "==", etapaId)
      .where("arenaId", "==", arenaId)
      .where("status", "==", status)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Partida[];
  }

  /**
   * Buscar partidas de uma dupla
   */
  async buscarPorDupla(etapaId: string, duplaId: string): Promise<Partida[]> {
    // Buscar como dupla1
    const snapshot1 = await this.collection
      .where("etapaId", "==", etapaId)
      .where("dupla1Id", "==", duplaId)
      .get();

    // Buscar como dupla2
    const snapshot2 = await this.collection
      .where("etapaId", "==", etapaId)
      .where("dupla2Id", "==", duplaId)
      .get();

    const partidas1 = snapshot1.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Partida[];

    const partidas2 = snapshot2.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Partida[];

    // Combinar e remover duplicatas
    const todas = [...partidas1, ...partidas2];
    const ids = new Set<string>();
    return todas.filter((p) => {
      if (ids.has(p.id)) return false;
      ids.add(p.id);
      return true;
    });
  }

  /**
   * Buscar partidas finalizadas de um grupo
   */
  async buscarFinalizadasPorGrupo(grupoId: string): Promise<Partida[]> {
    const snapshot = await this.collection
      .where("grupoId", "==", grupoId)
      .where("status", "==", StatusPartida.FINALIZADA)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Partida[];
  }

  /**
   * Buscar partidas pendentes de um grupo
   */
  async buscarPendentesPorGrupo(grupoId: string): Promise<Partida[]> {
    const snapshot = await this.collection
      .where("grupoId", "==", grupoId)
      .where("status", "==", StatusPartida.AGENDADA)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Partida[];
  }

  /**
   * Buscar confronto direto entre duas duplas
   */
  async buscarConfrontoDireto(
    grupoId: string,
    dupla1Id: string,
    dupla2Id: string
  ): Promise<Partida | null> {
    // Buscar dupla1 vs dupla2
    let snapshot = await this.collection
      .where("grupoId", "==", grupoId)
      .where("dupla1Id", "==", dupla1Id)
      .where("dupla2Id", "==", dupla2Id)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Partida;
    }

    // Buscar dupla2 vs dupla1
    snapshot = await this.collection
      .where("grupoId", "==", grupoId)
      .where("dupla1Id", "==", dupla2Id)
      .where("dupla2Id", "==", dupla1Id)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Partida;
    }

    return null;
  }

  /**
   * Registrar resultado da partida
   */
  async registrarResultado(
    id: string,
    resultado: RegistrarResultadoDTO
  ): Promise<Partida> {
    const partida = await this.buscarPorId(id);
    if (!partida) {
      throw new NotFoundError("Partida não encontrada");
    }

    await this.collection.doc(id).update({
      ...resultado,
      finalizadoEm: Timestamp.now(),
      atualizadoEm: Timestamp.now(),
    });

    const updated = await this.buscarPorId(id);
    return updated!;
  }

  /**
   * Agendar partida
   */
  async agendar(
    id: string,
    dataHora: Date | string,
    quadra?: string
  ): Promise<void> {
    const updateData: any = {
      dataHora:
        typeof dataHora === "string" ? dataHora : Timestamp.fromDate(dataHora),
      atualizadoEm: Timestamp.now(),
    };

    if (quadra) {
      updateData.quadra = quadra;
    }

    await this.collection.doc(id).update(updateData);
  }

  /**
   * Cancelar partida
   */
  async cancelar(id: string): Promise<void> {
    await this.collection.doc(id).update({
      status: StatusPartida.CANCELADA,
      atualizadoEm: Timestamp.now(),
    });
  }

  /**
   * Deletar todas as partidas de uma etapa
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

    logger.info("Partidas deletadas", {
      etapaId,
      arenaId,
      quantidade: snapshot.size,
    });

    return snapshot.size;
  }

  /**
   * Deletar partidas de um grupo
   */
  async deletarPorGrupo(grupoId: string): Promise<number> {
    const snapshot = await this.collection
      .where("grupoId", "==", grupoId)
      .get();

    if (snapshot.empty) {
      return 0;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    return snapshot.size;
  }

  /**
   * Deletar partidas eliminatórias de uma etapa
   */
  async deletarEliminatoriasPorEtapa(
    etapaId: string,
    arenaId: string
  ): Promise<number> {
    const snapshot = await this.collection
      .where("etapaId", "==", etapaId)
      .where("arenaId", "==", arenaId)
      .where("tipo", "==", "eliminatoria")
      .get();

    if (snapshot.empty) {
      return 0;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    logger.info("Partidas eliminatórias deletadas", {
      etapaId,
      arenaId,
      quantidade: snapshot.size,
    });

    return snapshot.size;
  }

  /**
   * Contar partidas de uma etapa
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
   * Contar partidas finalizadas de um grupo
   */
  async contarFinalizadasPorGrupo(grupoId: string): Promise<number> {
    const snapshot = await this.collection
      .where("grupoId", "==", grupoId)
      .where("status", "==", StatusPartida.FINALIZADA)
      .count()
      .get();

    return snapshot.data().count;
  }

  /**
   * Contar partidas pendentes de uma etapa
   */
  async contarPendentes(etapaId: string, arenaId: string): Promise<number> {
    const snapshot = await this.collection
      .where("etapaId", "==", etapaId)
      .where("arenaId", "==", arenaId)
      .where("status", "==", StatusPartida.AGENDADA)
      .count()
      .get();

    return snapshot.data().count;
  }

  // ==================== BATCH OPERATIONS ====================

  /**
   * Criar múltiplas partidas em lote
   */
  async criarEmLote(items: Partial<Partida>[]): Promise<Partida[]> {
    const batch = db.batch();
    const agora = Timestamp.now();
    const partidas: Partida[] = [];

    for (const item of items) {
      const docRef = this.collection.doc();
      const partidaData = {
        ...item,
        id: docRef.id,
        status: StatusPartida.AGENDADA,
        setsDupla1: 0,
        setsDupla2: 0,
        placar: [],
        criadoEm: agora,
        atualizadoEm: agora,
      };

      batch.set(docRef, partidaData);
      partidas.push(partidaData as Partida);
    }

    await batch.commit();

    logger.info("Partidas criadas em lote", { quantidade: partidas.length });

    return partidas;
  }

  /**
   * Deletar múltiplas partidas em lote
   */
  async deletarEmLote(ids: string[]): Promise<void> {
    if (ids.length === 0) return;

    const batch = db.batch();

    for (const id of ids) {
      batch.delete(this.collection.doc(id));
    }

    await batch.commit();

    logger.info("Partidas deletadas em lote", { quantidade: ids.length });
  }

  /**
   * Atualizar múltiplas partidas em lote
   */
  async atualizarEmLote(
    updates: Array<{ id: string; data: Partial<Partida> }>
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

    logger.info("Partidas atualizadas em lote", { quantidade: updates.length });
  }
}

// Exportar instância única
export const partidaRepository = new PartidaRepository();
