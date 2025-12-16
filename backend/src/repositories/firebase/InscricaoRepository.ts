/**
 * Implementação Firebase do repository de Inscricao
 */

import { db } from "../../config/firebase";
import { Timestamp } from "firebase-admin/firestore";
import { Inscricao, StatusInscricao } from "../../models/Inscricao";
import {
  IInscricaoRepository,
  CriarInscricaoDTO,
} from "../interfaces/IInscricaoRepository";
import { NotFoundError } from "../../utils/errors";
import logger from "../../utils/logger";

const COLLECTION = "inscricoes";

/**
 * Repository de Inscricao - Implementação Firebase
 */
export class InscricaoRepository implements IInscricaoRepository {
  private collection = db.collection(COLLECTION);

  /**
   * Criar nova inscrição
   */
  async criar(data: CriarInscricaoDTO): Promise<Inscricao> {
    const agora = Timestamp.now();

    const inscricaoData = {
      ...data,
      status: data.status || StatusInscricao.CONFIRMADA,
      criadoEm: agora,
      atualizadoEm: agora,
    };

    const docRef = await this.collection.add(inscricaoData);

    return {
      id: docRef.id,
      ...inscricaoData,
    } as Inscricao;
  }

  /**
   * Buscar inscrição por ID
   */
  async buscarPorId(id: string): Promise<Inscricao | null> {
    const doc = await this.collection.doc(id).get();

    if (!doc.exists) {
      return null;
    }

    return {
      id: doc.id,
      ...doc.data(),
    } as Inscricao;
  }

  /**
   * Buscar inscrição por ID com validação de arena
   */
  async buscarPorIdEArena(
    id: string,
    arenaId: string
  ): Promise<Inscricao | null> {
    const inscricao = await this.buscarPorId(id);

    if (!inscricao || inscricao.arenaId !== arenaId) {
      return null;
    }

    return inscricao;
  }

  /**
   * Buscar inscrição por ID, etapa e arena
   */
  async buscarPorIdEtapaArena(
    id: string,
    etapaId: string,
    arenaId: string
  ): Promise<Inscricao | null> {
    const inscricao = await this.buscarPorId(id);

    if (
      !inscricao ||
      inscricao.etapaId !== etapaId ||
      inscricao.arenaId !== arenaId
    ) {
      return null;
    }

    return inscricao;
  }

  /**
   * Atualizar inscrição
   */
  async atualizar(id: string, data: Partial<Inscricao>): Promise<Inscricao> {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundError("Inscrição não encontrada");
    }

    const updateData = {
      ...data,
      atualizadoEm: Timestamp.now(),
    };

    await docRef.update(updateData);

    const updated = await this.buscarPorId(id);
    if (!updated) {
      throw new NotFoundError("Inscrição não encontrada após atualização");
    }

    return updated;
  }

  /**
   * Deletar inscrição
   */
  async deletar(id: string): Promise<void> {
    const doc = await this.collection.doc(id).get();

    if (!doc.exists) {
      throw new NotFoundError("Inscrição não encontrada");
    }

    await this.collection.doc(id).delete();
  }

  /**
   * Verificar se inscrição existe
   */
  async existe(id: string): Promise<boolean> {
    const doc = await this.collection.doc(id).get();
    return doc.exists;
  }

  /**
   * Buscar inscrições de uma etapa
   */
  async buscarPorEtapa(etapaId: string, arenaId: string): Promise<Inscricao[]> {
    const snapshot = await this.collection
      .where("etapaId", "==", etapaId)
      .where("arenaId", "==", arenaId)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Inscricao[];
  }

  /**
   * Buscar inscrições confirmadas de uma etapa
   */
  async buscarConfirmadas(
    etapaId: string,
    arenaId: string
  ): Promise<Inscricao[]> {
    const snapshot = await this.collection
      .where("etapaId", "==", etapaId)
      .where("arenaId", "==", arenaId)
      .where("status", "==", StatusInscricao.CONFIRMADA)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Inscricao[];
  }

  /**
   * Buscar inscrição de um jogador em uma etapa
   */
  async buscarPorJogadorEEtapa(
    etapaId: string,
    jogadorId: string
  ): Promise<Inscricao | null> {
    const snapshot = await this.collection
      .where("etapaId", "==", etapaId)
      .where("jogadorId", "==", jogadorId)
      .where("status", "==", StatusInscricao.CONFIRMADA)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    } as Inscricao;
  }

  /**
   * Buscar inscrições de um jogador
   */
  async buscarPorJogador(
    arenaId: string,
    jogadorId: string
  ): Promise<Inscricao[]> {
    const snapshot = await this.collection
      .where("arenaId", "==", arenaId)
      .where("jogadorId", "==", jogadorId)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Inscricao[];
  }

  /**
   * Buscar inscrições ativas de um jogador
   */
  async buscarAtivasPorJogador(
    arenaId: string,
    jogadorId: string
  ): Promise<Inscricao[]> {
    const snapshot = await this.collection
      .where("arenaId", "==", arenaId)
      .where("jogadorId", "==", jogadorId)
      .where("status", "==", StatusInscricao.CONFIRMADA)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Inscricao[];
  }

  /**
   * Verificar se jogador está inscrito
   */
  async jogadorInscrito(etapaId: string, jogadorId: string): Promise<boolean> {
    const inscricao = await this.buscarPorJogadorEEtapa(etapaId, jogadorId);
    return inscricao !== null;
  }

  /**
   * Atualizar status da inscrição
   */
  async atualizarStatus(id: string, status: StatusInscricao): Promise<void> {
    const updateData: any = {
      status,
      atualizadoEm: Timestamp.now(),
    };

    if (status === StatusInscricao.CANCELADA) {
      updateData.canceladoEm = Timestamp.now();
    }

    await this.collection.doc(id).update(updateData);
  }

  /**
   * Buscar múltiplas inscrições por IDs em uma única query
   * ✅ OTIMIZAÇÃO: Usa getAll() do Firestore para buscar múltiplos docs de uma vez
   */
  async buscarPorIds(
    ids: string[],
    etapaId: string,
    arenaId: string
  ): Promise<Inscricao[]> {
    if (ids.length === 0) return [];

    // Firestore getAll permite buscar até 500 docs de uma vez
    const docRefs = ids.map((id) => this.collection.doc(id));
    const docs = await db.getAll(...docRefs);

    return docs
      .filter((doc) => {
        if (!doc.exists) return false;
        const data = doc.data();
        // Validar etapa e arena
        return data?.etapaId === etapaId && data?.arenaId === arenaId;
      })
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Inscricao[];
  }

  /**
   * Cancelar inscrição
   */
  async cancelar(id: string): Promise<void> {
    await this.atualizarStatus(id, StatusInscricao.CANCELADA);
  }

  /**
   * Cancelar múltiplas inscrições em lote
   */
  async cancelarEmLote(ids: string[]): Promise<void> {
    if (ids.length === 0) return;

    const batch = db.batch();
    const agora = Timestamp.now();

    for (const id of ids) {
      batch.update(this.collection.doc(id), {
        status: StatusInscricao.CANCELADA,
        canceladoEm: agora,
        atualizadoEm: agora,
      });
    }

    await batch.commit();

    logger.info("Inscrições canceladas em lote", { quantidade: ids.length });
  }

  /**
   * Atribuir dupla à inscrição
   */
  async atribuirDupla(
    id: string,
    duplaId: string,
    parceiroId: string,
    parceiroNome: string
  ): Promise<void> {
    await this.collection.doc(id).update({
      duplaId,
      parceiroId,
      parceiroNome,
      atualizadoEm: Timestamp.now(),
    });
  }

  /**
   * Atribuir grupo à inscrição
   */
  async atribuirGrupo(
    id: string,
    grupoId: string,
    grupoNome: string
  ): Promise<void> {
    await this.collection.doc(id).update({
      grupoId,
      grupoNome,
      atualizadoEm: Timestamp.now(),
    });
  }

  /**
   * Limpar atribuição de dupla/grupo
   */
  async limparAtribuicoes(id: string): Promise<void> {
    await this.collection.doc(id).update({
      duplaId: null,
      parceiroId: null,
      parceiroNome: null,
      grupoId: null,
      grupoNome: null,
      atualizadoEm: Timestamp.now(),
    });
  }

  /**
   * Deletar todas as inscrições de uma etapa
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

    logger.info("Inscrições deletadas", {
      etapaId,
      arenaId,
      quantidade: snapshot.size,
    });

    return snapshot.size;
  }

  /**
   * Contar inscrições de uma etapa
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
   * Contar inscrições confirmadas de uma etapa
   */
  async contarConfirmadas(etapaId: string, arenaId: string): Promise<number> {
    const snapshot = await this.collection
      .where("etapaId", "==", etapaId)
      .where("arenaId", "==", arenaId)
      .where("status", "==", StatusInscricao.CONFIRMADA)
      .count()
      .get();

    return snapshot.data().count;
  }

  // ==================== BATCH OPERATIONS ====================

  /**
   * Criar múltiplas inscrições em lote
   */
  async criarEmLote(items: Partial<Inscricao>[]): Promise<Inscricao[]> {
    const batch = db.batch();
    const agora = Timestamp.now();
    const inscricoes: Inscricao[] = [];

    for (const item of items) {
      const docRef = this.collection.doc();
      const inscricaoData = {
        ...item,
        id: docRef.id,
        status: StatusInscricao.CONFIRMADA,
        criadoEm: agora,
        atualizadoEm: agora,
      };

      batch.set(docRef, inscricaoData);
      inscricoes.push(inscricaoData as Inscricao);
    }

    await batch.commit();

    logger.info("Inscrições criadas em lote", {
      quantidade: inscricoes.length,
    });

    return inscricoes;
  }

  /**
   * Deletar múltiplas inscrições em lote
   */
  async deletarEmLote(ids: string[]): Promise<void> {
    if (ids.length === 0) return;

    const batch = db.batch();

    for (const id of ids) {
      batch.delete(this.collection.doc(id));
    }

    await batch.commit();

    logger.info("Inscrições deletadas em lote", { quantidade: ids.length });
  }

  /**
   * Atualizar múltiplas inscrições em lote
   */
  async atualizarEmLote(
    updates: Array<{ id: string; data: Partial<Inscricao> }>
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

    logger.info("Inscrições atualizadas em lote", {
      quantidade: updates.length,
    });
  }
}

// Exportar instância única
export const inscricaoRepository = new InscricaoRepository();
