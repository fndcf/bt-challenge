/**
 * ConfrontoEliminatorioRepository.ts
 * Implementação Firebase do repository de ConfrontoEliminatorio
 */

import { db } from "../../config/firebase";
import { Timestamp } from "firebase-admin/firestore";
import {
  ConfrontoEliminatorio,
  TipoFase,
  StatusConfrontoEliminatorio,
} from "../../models/Eliminatoria";
import {
  IConfrontoEliminatorioRepository,
  CriarConfrontoDTO,
  RegistrarResultadoConfrontoDTO,
} from "../interfaces/IConfrontoEliminatorioRepository";
import { NotFoundError } from "../../utils/errors";
import logger from "../../utils/logger";

const COLLECTION = "confrontos_eliminatorios";

/**
 * Repository de ConfrontoEliminatorio - Implementação Firebase
 */
export class ConfrontoEliminatorioRepository implements IConfrontoEliminatorioRepository {
  private collection = db.collection(COLLECTION);

  /**
   * Criar novo confronto
   */
  async criar(data: CriarConfrontoDTO): Promise<ConfrontoEliminatorio> {
    const agora = Timestamp.now();

    const confrontoData = {
      ...data,
      status: data.status || StatusConfrontoEliminatorio.AGENDADA,
      criadoEm: agora,
      atualizadoEm: agora,
    };

    const docRef = await this.collection.add(confrontoData);

    // Atualizar com o ID
    await docRef.update({ id: docRef.id });

    return {
      id: docRef.id,
      ...confrontoData,
    } as ConfrontoEliminatorio;
  }

  /**
   * Buscar confronto por ID
   */
  async buscarPorId(id: string): Promise<ConfrontoEliminatorio | null> {
    const doc = await this.collection.doc(id).get();

    if (!doc.exists) {
      return null;
    }

    return {
      id: doc.id,
      ...doc.data(),
    } as ConfrontoEliminatorio;
  }

  /**
   * Buscar confronto por ID com validação de arena
   */
  async buscarPorIdEArena(id: string, arenaId: string): Promise<ConfrontoEliminatorio | null> {
    const confronto = await this.buscarPorId(id);

    if (!confronto || confronto.arenaId !== arenaId) {
      return null;
    }

    return confronto;
  }

  /**
   * Atualizar confronto
   */
  async atualizar(id: string, data: Partial<ConfrontoEliminatorio>): Promise<ConfrontoEliminatorio> {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundError("Confronto não encontrado");
    }

    const updateData = {
      ...data,
      atualizadoEm: Timestamp.now(),
    };

    await docRef.update(updateData);

    const updated = await this.buscarPorId(id);
    if (!updated) {
      throw new NotFoundError("Confronto não encontrado após atualização");
    }

    return updated;
  }

  /**
   * Deletar confronto
   */
  async deletar(id: string): Promise<void> {
    const doc = await this.collection.doc(id).get();

    if (!doc.exists) {
      throw new NotFoundError("Confronto não encontrado");
    }

    await this.collection.doc(id).delete();
  }

  /**
   * Verificar se confronto existe
   */
  async existe(id: string): Promise<boolean> {
    const doc = await this.collection.doc(id).get();
    return doc.exists;
  }

  /**
   * Buscar confrontos de uma etapa
   */
  async buscarPorEtapa(etapaId: string, arenaId: string): Promise<ConfrontoEliminatorio[]> {
    const snapshot = await this.collection
      .where("etapaId", "==", etapaId)
      .where("arenaId", "==", arenaId)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ConfrontoEliminatorio[];
  }

  /**
   * Buscar confrontos de uma etapa ordenados
   */
  async buscarPorEtapaOrdenado(etapaId: string, arenaId: string): Promise<ConfrontoEliminatorio[]> {
    const snapshot = await this.collection
      .where("etapaId", "==", etapaId)
      .where("arenaId", "==", arenaId)
      .orderBy("ordem", "asc")
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ConfrontoEliminatorio[];
  }

  /**
   * Buscar confrontos por fase
   */
  async buscarPorFase(
    etapaId: string,
    arenaId: string,
    fase: TipoFase
  ): Promise<ConfrontoEliminatorio[]> {
    const snapshot = await this.collection
      .where("etapaId", "==", etapaId)
      .where("arenaId", "==", arenaId)
      .where("fase", "==", fase)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ConfrontoEliminatorio[];
  }

  /**
   * Buscar confrontos por fase ordenados
   */
  async buscarPorFaseOrdenado(
    etapaId: string,
    arenaId: string,
    fase: TipoFase
  ): Promise<ConfrontoEliminatorio[]> {
    const snapshot = await this.collection
      .where("etapaId", "==", etapaId)
      .where("arenaId", "==", arenaId)
      .where("fase", "==", fase)
      .orderBy("ordem", "asc")
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ConfrontoEliminatorio[];
  }

  /**
   * Buscar confrontos por status
   */
  async buscarPorStatus(
    etapaId: string,
    arenaId: string,
    status: StatusConfrontoEliminatorio
  ): Promise<ConfrontoEliminatorio[]> {
    const snapshot = await this.collection
      .where("etapaId", "==", etapaId)
      .where("arenaId", "==", arenaId)
      .where("status", "==", status)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ConfrontoEliminatorio[];
  }

  /**
   * Buscar confrontos de uma dupla
   */
  async buscarPorDupla(etapaId: string, duplaId: string): Promise<ConfrontoEliminatorio[]> {
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

    const confrontos1 = snapshot1.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ConfrontoEliminatorio[];

    const confrontos2 = snapshot2.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ConfrontoEliminatorio[];

    // Combinar e remover duplicatas
    const todos = [...confrontos1, ...confrontos2];
    const ids = new Set<string>();
    return todos.filter((c) => {
      if (ids.has(c.id)) return false;
      ids.add(c.id);
      return true;
    });
  }

  /**
   * Buscar confrontos finalizados de uma fase
   */
  async buscarFinalizadosPorFase(
    etapaId: string,
    arenaId: string,
    fase: TipoFase
  ): Promise<ConfrontoEliminatorio[]> {
    const snapshot = await this.collection
      .where("etapaId", "==", etapaId)
      .where("arenaId", "==", arenaId)
      .where("fase", "==", fase)
      .where("status", "in", [
        StatusConfrontoEliminatorio.FINALIZADA,
        StatusConfrontoEliminatorio.BYE,
      ])
      .orderBy("ordem", "asc")
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ConfrontoEliminatorio[];
  }

  /**
   * Buscar confrontos pendentes de uma fase
   */
  async buscarPendentesPorFase(
    etapaId: string,
    arenaId: string,
    fase: TipoFase
  ): Promise<ConfrontoEliminatorio[]> {
    const snapshot = await this.collection
      .where("etapaId", "==", etapaId)
      .where("arenaId", "==", arenaId)
      .where("fase", "==", fase)
      .where("status", "==", StatusConfrontoEliminatorio.AGENDADA)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ConfrontoEliminatorio[];
  }

  /**
   * Registrar resultado do confronto
   */
  async registrarResultado(
    id: string,
    resultado: RegistrarResultadoConfrontoDTO
  ): Promise<ConfrontoEliminatorio> {
    const confronto = await this.buscarPorId(id);
    if (!confronto) {
      throw new NotFoundError("Confronto não encontrado");
    }

    await this.collection.doc(id).update({
      ...resultado,
      atualizadoEm: Timestamp.now(),
    });

    const updated = await this.buscarPorId(id);
    return updated!;
  }

  /**
   * Atualizar duplas do confronto
   */
  async atualizarDuplas(
    id: string,
    dados: {
      dupla1Id?: string;
      dupla1Nome?: string;
      dupla1Origem?: string;
      dupla2Id?: string;
      dupla2Nome?: string;
      dupla2Origem?: string;
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
   * Limpar resultado do confronto
   */
  async limparResultado(id: string): Promise<void> {
    await this.collection.doc(id).update({
      status: StatusConfrontoEliminatorio.AGENDADA,
      vencedoraId: null,
      vencedoraNome: null,
      placar: null,
      partidaId: null,
      atualizadoEm: Timestamp.now(),
    });
  }

  /**
   * Definir próximo confronto
   */
  async definirProximoConfronto(id: string, proximoConfrontoId: string): Promise<void> {
    await this.collection.doc(id).update({
      proximoConfrontoId,
      atualizadoEm: Timestamp.now(),
    });
  }

  /**
   * Deletar todos os confrontos de uma etapa
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

    logger.info("Confrontos eliminatórios deletados", {
      etapaId,
      arenaId,
      quantidade: snapshot.size,
    });

    return snapshot.size;
  }

  /**
   * Deletar confrontos de uma fase
   */
  async deletarPorFase(etapaId: string, arenaId: string, fase: TipoFase): Promise<number> {
    const snapshot = await this.collection
      .where("etapaId", "==", etapaId)
      .where("arenaId", "==", arenaId)
      .where("fase", "==", fase)
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
   * Contar confrontos de uma etapa
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
   * Contar confrontos por fase
   */
  async contarPorFase(etapaId: string, arenaId: string, fase: TipoFase): Promise<number> {
    const snapshot = await this.collection
      .where("etapaId", "==", etapaId)
      .where("arenaId", "==", arenaId)
      .where("fase", "==", fase)
      .count()
      .get();

    return snapshot.data().count;
  }

  /**
   * Verificar se fase está completa
   */
  async faseCompleta(etapaId: string, arenaId: string, fase: TipoFase): Promise<boolean> {
    const pendentes = await this.buscarPendentesPorFase(etapaId, arenaId, fase);
    return pendentes.length === 0;
  }

  /**
   * Buscar vencedores de uma fase
   */
  async buscarVencedoresPorFase(
    etapaId: string,
    arenaId: string,
    fase: TipoFase
  ): Promise<
    Array<{
      id: string;
      nome: string;
      origem: string;
      ordem: number;
      confrontoId: string;
    }>
  > {
    const finalizados = await this.buscarFinalizadosPorFase(etapaId, arenaId, fase);

    return finalizados
      .filter((c) => c.vencedoraId && c.vencedoraNome)
      .map((c) => ({
        id: c.vencedoraId!,
        nome: c.vencedoraNome!,
        origem: `Vencedor ${c.fase} ${c.ordem}`,
        ordem: c.ordem,
        confrontoId: c.id,
      }));
  }

  // ==================== BATCH OPERATIONS ====================

  /**
   * Criar múltiplos confrontos em lote
   */
  async criarEmLote(items: Partial<ConfrontoEliminatorio>[]): Promise<ConfrontoEliminatorio[]> {
    const batch = db.batch();
    const agora = Timestamp.now();
    const confrontos: ConfrontoEliminatorio[] = [];

    for (const item of items) {
      const docRef = this.collection.doc();
      const confrontoData = {
        ...item,
        id: docRef.id,
        status: item.status || StatusConfrontoEliminatorio.AGENDADA,
        criadoEm: agora,
        atualizadoEm: agora,
      };

      batch.set(docRef, confrontoData);
      confrontos.push(confrontoData as ConfrontoEliminatorio);
    }

    await batch.commit();

    logger.info("Confrontos criados em lote", { quantidade: confrontos.length });

    return confrontos;
  }

  /**
   * Deletar múltiplos confrontos em lote
   */
  async deletarEmLote(ids: string[]): Promise<void> {
    if (ids.length === 0) return;

    const batch = db.batch();

    for (const id of ids) {
      batch.delete(this.collection.doc(id));
    }

    await batch.commit();

    logger.info("Confrontos deletados em lote", { quantidade: ids.length });
  }

  /**
   * Atualizar múltiplos confrontos em lote
   */
  async atualizarEmLote(
    updates: Array<{ id: string; data: Partial<ConfrontoEliminatorio> }>
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

    logger.info("Confrontos atualizados em lote", { quantidade: updates.length });
  }
}

// Exportar instância única
export const confrontoEliminatorioRepository = new ConfrontoEliminatorioRepository();
