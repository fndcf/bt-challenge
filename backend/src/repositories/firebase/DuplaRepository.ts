/**
 * Implementação Firebase do repository de Dupla
 */

import { db } from "../../config/firebase";
import { Timestamp, FieldValue } from "firebase-admin/firestore";
import { Dupla } from "../../models/Dupla";
import {
  IDuplaRepository,
  CriarDuplaDTO,
  AtualizarEstatisticasDuplaDTO,
} from "../interfaces/IDuplaRepository";
import { NotFoundError } from "../../utils/errors";
import logger from "../../utils/logger";

const COLLECTION = "duplas";

/**
 * Repository de Dupla - Implementação Firebase
 */
export class DuplaRepository implements IDuplaRepository {
  private collection = db.collection(COLLECTION);

  /**
   * Criar nova dupla
   */
  async criar(data: CriarDuplaDTO): Promise<Dupla> {
    const agora = Timestamp.now();

    const duplaData = {
      ...data,
      grupoId: data.grupoId || "",
      grupoNome: data.grupoNome || "",
      jogos: 0,
      vitorias: 0,
      derrotas: 0,
      pontos: 0,
      setsVencidos: 0,
      setsPerdidos: 0,
      gamesVencidos: 0,
      gamesPerdidos: 0,
      saldoSets: 0,
      saldoGames: 0,
      posicaoGrupo: undefined,
      classificada: false,
      criadoEm: agora,
      atualizadoEm: agora,
    };

    const docRef = await this.collection.add(duplaData);

    return {
      id: docRef.id,
      ...duplaData,
    } as Dupla;
  }

  /**
   * Buscar dupla por ID
   */
  async buscarPorId(id: string): Promise<Dupla | null> {
    const doc = await this.collection.doc(id).get();

    if (!doc.exists) {
      return null;
    }

    return {
      id: doc.id,
      ...doc.data(),
    } as Dupla;
  }

  /**
   * Buscar dupla por ID com validação de arena
   */
  async buscarPorIdEArena(id: string, arenaId: string): Promise<Dupla | null> {
    const dupla = await this.buscarPorId(id);

    if (!dupla || dupla.arenaId !== arenaId) {
      return null;
    }

    return dupla;
  }

  /**
   * Atualizar dupla
   */
  async atualizar(id: string, data: Partial<Dupla>): Promise<Dupla> {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundError("Dupla não encontrada");
    }

    const updateData = {
      ...data,
      atualizadoEm: Timestamp.now(),
    };

    await docRef.update(updateData);

    const updated = await this.buscarPorId(id);
    if (!updated) {
      throw new NotFoundError("Dupla não encontrada após atualização");
    }

    return updated;
  }

  /**
   * Deletar dupla
   */
  async deletar(id: string): Promise<void> {
    const doc = await this.collection.doc(id).get();

    if (!doc.exists) {
      throw new NotFoundError("Dupla não encontrada");
    }

    await this.collection.doc(id).delete();
  }

  /**
   * Verificar se dupla existe
   */
  async existe(id: string): Promise<boolean> {
    const doc = await this.collection.doc(id).get();
    return doc.exists;
  }

  /**
   * Buscar duplas de uma etapa
   */
  async buscarPorEtapa(etapaId: string, arenaId: string): Promise<Dupla[]> {
    const snapshot = await this.collection
      .where("etapaId", "==", etapaId)
      .where("arenaId", "==", arenaId)
      .orderBy("grupoNome", "asc")
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Dupla[];
  }

  /**
   * Buscar duplas de um grupo
   */
  async buscarPorGrupo(grupoId: string): Promise<Dupla[]> {
    const snapshot = await this.collection
      .where("grupoId", "==", grupoId)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Dupla[];
  }

  /**
   * Buscar duplas de um grupo ordenadas por posição
   */
  async buscarPorGrupoOrdenado(grupoId: string): Promise<Dupla[]> {
    const snapshot = await this.collection
      .where("grupoId", "==", grupoId)
      .orderBy("posicaoGrupo", "asc")
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Dupla[];
  }

  /**
   * Buscar duplas classificadas de uma etapa
   */
  async buscarClassificadas(
    etapaId: string,
    arenaId: string
  ): Promise<Dupla[]> {
    const snapshot = await this.collection
      .where("etapaId", "==", etapaId)
      .where("arenaId", "==", arenaId)
      .where("classificada", "==", true)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Dupla[];
  }

  /**
   * Buscar duplas classificadas de um grupo
   */
  async buscarClassificadasPorGrupo(
    grupoId: string,
    limite?: number
  ): Promise<Dupla[]> {
    let query = this.collection
      .where("grupoId", "==", grupoId)
      .orderBy("posicaoGrupo", "asc");

    if (limite) {
      query = query.limit(limite);
    }

    const snapshot = await query.get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Dupla[];
  }

  /**
   * Buscar dupla por jogador
   */
  async buscarPorJogador(
    etapaId: string,
    jogadorId: string
  ): Promise<Dupla | null> {
    // Buscar como jogador1
    let snapshot = await this.collection
      .where("etapaId", "==", etapaId)
      .where("jogador1Id", "==", jogadorId)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Dupla;
    }

    // Buscar como jogador2
    snapshot = await this.collection
      .where("etapaId", "==", etapaId)
      .where("jogador2Id", "==", jogadorId)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Dupla;
    }

    return null;
  }

  /**
   * Atribuir dupla a um grupo
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
   * Atualizar estatísticas da dupla
   */
  async atualizarEstatisticas(
    id: string,
    stats: AtualizarEstatisticasDuplaDTO
  ): Promise<void> {
    const updateData: any = {
      ...stats,
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
   * Atualizar estatísticas usando FieldValue.increment (operações atômicas)
   */
  async atualizarEstatisticasComIncrement(
    id: string,
    stats: AtualizarEstatisticasDuplaDTO
  ): Promise<void> {
    const updateData: any = {
      atualizadoEm: Timestamp.now(),
    };

    // Usar FieldValue.increment para cada campo numérico
    if (stats.jogos !== undefined) {
      updateData.jogos = FieldValue.increment(stats.jogos);
    }
    if (stats.vitorias !== undefined) {
      updateData.vitorias = FieldValue.increment(stats.vitorias);
    }
    if (stats.derrotas !== undefined) {
      updateData.derrotas = FieldValue.increment(stats.derrotas);
    }
    if (stats.pontos !== undefined) {
      updateData.pontos = FieldValue.increment(stats.pontos);
    }
    if (stats.setsVencidos !== undefined) {
      updateData.setsVencidos = FieldValue.increment(stats.setsVencidos);
    }
    if (stats.setsPerdidos !== undefined) {
      updateData.setsPerdidos = FieldValue.increment(stats.setsPerdidos);
    }
    if (stats.gamesVencidos !== undefined) {
      updateData.gamesVencidos = FieldValue.increment(stats.gamesVencidos);
    }
    if (stats.gamesPerdidos !== undefined) {
      updateData.gamesPerdidos = FieldValue.increment(stats.gamesPerdidos);
    }
    if (stats.saldoSets !== undefined) {
      updateData.saldoSets = FieldValue.increment(stats.saldoSets);
    }
    if (stats.saldoGames !== undefined) {
      updateData.saldoGames = FieldValue.increment(stats.saldoGames);
    }
    // Para posicaoGrupo e classificada, usar valor direto (não increment)
    if (stats.posicaoGrupo !== undefined) {
      updateData.posicaoGrupo = stats.posicaoGrupo;
    }
    if (stats.classificada !== undefined) {
      updateData.classificada = stats.classificada;
    }

    await this.collection.doc(id).update(updateData);
  }

  /**
   * Registrar resultado de partida
   */
  async registrarResultadoPartida(
    id: string,
    venceu: boolean,
    setsVencidos: number,
    setsPerdidos: number,
    gamesVencidos: number,
    gamesPerdidos: number
  ): Promise<void> {
    const dupla = await this.buscarPorId(id);
    if (!dupla) {
      throw new NotFoundError("Dupla não encontrada");
    }

    await this.collection.doc(id).update({
      jogos: dupla.jogos + 1,
      vitorias: dupla.vitorias + (venceu ? 1 : 0),
      derrotas: dupla.derrotas + (venceu ? 0 : 1),
      pontos: dupla.pontos + (venceu ? 3 : 0),
      setsVencidos: dupla.setsVencidos + setsVencidos,
      setsPerdidos: dupla.setsPerdidos + setsPerdidos,
      gamesVencidos: dupla.gamesVencidos + gamesVencidos,
      gamesPerdidos: dupla.gamesPerdidos + gamesPerdidos,
      saldoSets: dupla.saldoSets + (setsVencidos - setsPerdidos),
      saldoGames: dupla.saldoGames + (gamesVencidos - gamesPerdidos),
      atualizadoEm: Timestamp.now(),
    });
  }

  /**
   * Atualizar posição no grupo
   */
  async atualizarPosicaoGrupo(id: string, posicao: number): Promise<void> {
    await this.collection.doc(id).update({
      posicaoGrupo: posicao,
      atualizadoEm: Timestamp.now(),
    });
  }

  /**
   * Marcar como classificada
   */
  async marcarClassificada(id: string, classificada: boolean): Promise<void> {
    await this.collection.doc(id).update({
      classificada,
      atualizadoEm: Timestamp.now(),
    });
  }

  /**
   * Deletar todas as duplas de uma etapa
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

    logger.info("Duplas deletadas", {
      etapaId,
      arenaId,
      quantidade: snapshot.size,
    });

    return snapshot.size;
  }

  /**
   * Contar duplas de uma etapa
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
   * Contar duplas de um grupo
   */
  async contarPorGrupo(grupoId: string): Promise<number> {
    const snapshot = await this.collection
      .where("grupoId", "==", grupoId)
      .count()
      .get();

    return snapshot.data().count;
  }

  // ==================== BATCH OPERATIONS ====================

  /**
   * Criar múltiplas duplas em lote
   */
  async criarEmLote(items: Partial<Dupla>[]): Promise<Dupla[]> {
    const batch = db.batch();
    const agora = Timestamp.now();
    const duplas: Dupla[] = [];

    for (const item of items) {
      const docRef = this.collection.doc();
      const duplaData = {
        ...item,
        id: docRef.id,
        jogos: 0,
        vitorias: 0,
        derrotas: 0,
        pontos: 0,
        setsVencidos: 0,
        setsPerdidos: 0,
        gamesVencidos: 0,
        gamesPerdidos: 0,
        saldoSets: 0,
        saldoGames: 0,
        classificada: false,
        criadoEm: agora,
        atualizadoEm: agora,
      };

      batch.set(docRef, duplaData);
      duplas.push(duplaData as Dupla);
    }

    await batch.commit();

    logger.info("Duplas criadas em lote", { quantidade: duplas.length });

    return duplas;
  }

  /**
   * Deletar múltiplas duplas em lote
   */
  async deletarEmLote(ids: string[]): Promise<void> {
    if (ids.length === 0) return;

    const batch = db.batch();

    for (const id of ids) {
      batch.delete(this.collection.doc(id));
    }

    await batch.commit();

    logger.info("Duplas deletadas em lote", { quantidade: ids.length });
  }

  /**
   * Atualizar múltiplas duplas em lote
   */
  async atualizarEmLote(
    updates: Array<{ id: string; data: Partial<Dupla> }>
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

    logger.info("Duplas atualizadas em lote", { quantidade: updates.length });
  }
}

// Exportar instância única
export const duplaRepository = new DuplaRepository();
