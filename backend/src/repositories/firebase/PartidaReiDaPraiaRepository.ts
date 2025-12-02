/**
 * PartidaReiDaPraiaRepository.ts
 * Implementação Firebase do repository de PartidaReiDaPraia
 */

import { db } from "../../config/firebase";
import { Timestamp } from "firebase-admin/firestore";
import { StatusPartida } from "../../models/Partida";
import { FaseEtapa } from "../../models/Etapa";
import {
  IPartidaReiDaPraiaRepository,
  PartidaReiDaPraia,
  CriarPartidaReiDaPraiaDTO,
  RegistrarResultadoReiDaPraiaDTO,
} from "../interfaces/IPartidaReiDaPraiaRepository";
import { NotFoundError } from "../../utils/errors";
import logger from "../../utils/logger";

/**
 * Implementação Firebase do repository de PartidaReiDaPraia
 */
export class PartidaReiDaPraiaRepository implements IPartidaReiDaPraiaRepository {
  private collection = db.collection("partidas_rei_da_praia");

  /**
   * Criar partida
   */
  async criar(dados: CriarPartidaReiDaPraiaDTO): Promise<PartidaReiDaPraia> {
    const now = Timestamp.now();

    const novaPartida: Omit<PartidaReiDaPraia, "id"> = {
      ...dados,
      status: StatusPartida.AGENDADA,
      setsDupla1: 0,
      setsDupla2: 0,
      criadoEm: now,
      atualizadoEm: now,
    };

    const docRef = await this.collection.add(novaPartida);

    // Atualizar com o ID
    await docRef.update({ id: docRef.id });

    logger.info("Partida Rei da Praia criada", {
      id: docRef.id,
      etapaId: dados.etapaId,
      grupoId: dados.grupoId,
    });

    return {
      id: docRef.id,
      ...novaPartida,
    };
  }

  /**
   * Buscar por ID
   */
  async buscarPorId(id: string): Promise<PartidaReiDaPraia | null> {
    const doc = await this.collection.doc(id).get();

    if (!doc.exists) {
      return null;
    }

    return {
      id: doc.id,
      ...doc.data(),
    } as PartidaReiDaPraia;
  }

  /**
   * Buscar partida por ID e arena
   */
  async buscarPorIdEArena(id: string, arenaId: string): Promise<PartidaReiDaPraia | null> {
    const partida = await this.buscarPorId(id);

    if (!partida || partida.arenaId !== arenaId) {
      return null;
    }

    return partida;
  }

  /**
   * Listar partidas (com filtros básicos)
   */
  async listar(filtros?: { arenaId?: string; etapaId?: string }): Promise<PartidaReiDaPraia[]> {
    let query: FirebaseFirestore.Query = this.collection;

    if (filtros?.arenaId) {
      query = query.where("arenaId", "==", filtros.arenaId);
    }

    if (filtros?.etapaId) {
      query = query.where("etapaId", "==", filtros.etapaId);
    }

    const snapshot = await query.get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as PartidaReiDaPraia[];
  }

  /**
   * Buscar partidas de uma etapa
   */
  async buscarPorEtapa(etapaId: string, arenaId: string): Promise<PartidaReiDaPraia[]> {
    const snapshot = await this.collection
      .where("etapaId", "==", etapaId)
      .where("arenaId", "==", arenaId)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as PartidaReiDaPraia[];
  }

  /**
   * Buscar partidas de um grupo
   */
  async buscarPorGrupo(grupoId: string): Promise<PartidaReiDaPraia[]> {
    const snapshot = await this.collection
      .where("grupoId", "==", grupoId)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as PartidaReiDaPraia[];
  }

  /**
   * Buscar partidas por fase
   */
  async buscarPorFase(etapaId: string, arenaId: string, fase: FaseEtapa): Promise<PartidaReiDaPraia[]> {
    const snapshot = await this.collection
      .where("etapaId", "==", etapaId)
      .where("arenaId", "==", arenaId)
      .where("fase", "==", fase)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as PartidaReiDaPraia[];
  }

  /**
   * Buscar partidas por status
   */
  async buscarPorStatus(etapaId: string, arenaId: string, status: StatusPartida): Promise<PartidaReiDaPraia[]> {
    const snapshot = await this.collection
      .where("etapaId", "==", etapaId)
      .where("arenaId", "==", arenaId)
      .where("status", "==", status)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as PartidaReiDaPraia[];
  }

  /**
   * Buscar partidas de um jogador
   */
  async buscarPorJogador(etapaId: string, jogadorId: string): Promise<PartidaReiDaPraia[]> {
    // Buscar todas as partidas da etapa e filtrar no client
    // (Firebase não suporta OR em queries compostas)
    const partidas = await this.listar({ etapaId });

    return partidas.filter(
      (p) =>
        p.jogador1AId === jogadorId ||
        p.jogador1BId === jogadorId ||
        p.jogador2AId === jogadorId ||
        p.jogador2BId === jogadorId
    );
  }

  /**
   * Buscar partidas finalizadas de um grupo
   */
  async buscarFinalizadasPorGrupo(grupoId: string): Promise<PartidaReiDaPraia[]> {
    const snapshot = await this.collection
      .where("grupoId", "==", grupoId)
      .where("status", "==", StatusPartida.FINALIZADA)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as PartidaReiDaPraia[];
  }

  /**
   * Buscar partidas pendentes de uma etapa
   */
  async buscarPendentes(etapaId: string, arenaId: string): Promise<PartidaReiDaPraia[]> {
    const snapshot = await this.collection
      .where("etapaId", "==", etapaId)
      .where("arenaId", "==", arenaId)
      .where("status", "==", StatusPartida.AGENDADA)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as PartidaReiDaPraia[];
  }

  /**
   * Atualizar partida
   */
  async atualizar(id: string, dados: Partial<PartidaReiDaPraia>): Promise<PartidaReiDaPraia> {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundError("Partida não encontrada");
    }

    const updateData = {
      ...dados,
      atualizadoEm: Timestamp.now(),
    };

    // Remover campos undefined
    Object.keys(updateData).forEach((key) => {
      if (updateData[key as keyof typeof updateData] === undefined) {
        delete updateData[key as keyof typeof updateData];
      }
    });

    await docRef.update(updateData);

    const updated = await this.buscarPorId(id);
    return updated!;
  }

  /**
   * Registrar resultado da partida
   */
  /**
   * Registrar resultado da partida
   * CORREÇÃO v2: Agora salva placar, vencedores e vencedoresNomes
   */
  async registrarResultado(id: string, resultado: RegistrarResultadoReiDaPraiaDTO): Promise<PartidaReiDaPraia> {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundError("Partida não encontrada");
    }

    const now = Timestamp.now();

    await docRef.update({
      setsDupla1: resultado.setsDupla1,
      setsDupla2: resultado.setsDupla2,
      sets: resultado.sets,
      // ⚠️ CORREÇÃO: Campos adicionados
      placar: resultado.placar,
      vencedores: resultado.vencedores,
      vencedoresNomes: resultado.vencedoresNomes,
      vencedorDupla: resultado.vencedorDupla,
      status: StatusPartida.FINALIZADA,
      finalizadoEm: now,
      atualizadoEm: now,
    });

    logger.info("Resultado da partida Rei da Praia registrado", {
      partidaId: id,
      setsDupla1: resultado.setsDupla1,
      setsDupla2: resultado.setsDupla2,
      vencedorDupla: resultado.vencedorDupla,
      vencedoresNomes: resultado.vencedoresNomes,
    });

    const updated = await this.buscarPorId(id);
    return updated!;
  }

  /**
   * Limpar resultado (reverter para agendada)
   */
  async limparResultado(id: string): Promise<void> {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundError("Partida não encontrada");
    }

    await docRef.update({
      setsDupla1: 0,
      setsDupla2: 0,
      sets: [],
      vencedorDupla: null,
      status: StatusPartida.AGENDADA,
      finalizadoEm: null,
      atualizadoEm: Timestamp.now(),
    });

    logger.info("Resultado da partida limpo", { partidaId: id });
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

    logger.info("Partida Rei da Praia deletada", { partidaId: id });
  }

  /**
   * Contar partidas por grupo
   */
  async contarPorGrupo(grupoId: string): Promise<number> {
    const snapshot = await this.collection
      .where("grupoId", "==", grupoId)
      .get();

    return snapshot.size;
  }

  /**
   * Contar partidas finalizadas por grupo
   */
  async contarFinalizadasPorGrupo(grupoId: string): Promise<number> {
    const snapshot = await this.collection
      .where("grupoId", "==", grupoId)
      .where("status", "==", StatusPartida.FINALIZADA)
      .get();

    return snapshot.size;
  }

  /**
   * Verificar se todas as partidas do grupo estão finalizadas
   */
  async grupoCompleto(grupoId: string): Promise<boolean> {
    const total = await this.contarPorGrupo(grupoId);
    const finalizadas = await this.contarFinalizadasPorGrupo(grupoId);

    return total > 0 && total === finalizadas;
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

    logger.info("Partidas Rei da Praia deletadas por etapa", {
      etapaId,
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

    logger.info("Partidas Rei da Praia deletadas por grupo", {
      grupoId,
      quantidade: snapshot.size,
    });

    return snapshot.size;
  }

  /**
   * Criar em lote
   */
  async criarEmLote(items: CriarPartidaReiDaPraiaDTO[]): Promise<PartidaReiDaPraia[]> {
    if (items.length === 0) {
      return [];
    }

    const batch = db.batch();
    const now = Timestamp.now();
    const resultados: PartidaReiDaPraia[] = [];

    for (const item of items) {
      const docRef = this.collection.doc();

      const novaPartida: PartidaReiDaPraia = {
        id: docRef.id,
        ...item,
        status: StatusPartida.AGENDADA,
        setsDupla1: 0,
        setsDupla2: 0,
        criadoEm: now,
        atualizadoEm: now,
      };

      batch.set(docRef, novaPartida);
      resultados.push(novaPartida);
    }

    await batch.commit();

    logger.info("Partidas Rei da Praia criadas em lote", { quantidade: items.length });

    return resultados;
  }

  /**
   * Verificar se existe
   */
  async existe(id: string): Promise<boolean> {
    const doc = await this.collection.doc(id).get();
    return doc.exists;
  }

  /**
   * Atualizar em lote
   */
  async atualizarEmLote(updates: Array<{ id: string; data: Partial<PartidaReiDaPraia> }>): Promise<void> {
    if (updates.length === 0) {
      return;
    }

    const batch = db.batch();

    for (const { id, data } of updates) {
      batch.update(this.collection.doc(id), {
        ...data,
        atualizadoEm: Timestamp.now(),
      });
    }

    await batch.commit();

    logger.info("Partidas Rei da Praia atualizadas em lote", { quantidade: updates.length });
  }

  /**
   * Deletar em lote
   */
  async deletarEmLote(ids: string[]): Promise<void> {
    if (ids.length === 0) {
      return;
    }

    const batch = db.batch();

    for (const id of ids) {
      batch.delete(this.collection.doc(id));
    }

    await batch.commit();

    logger.info("Partidas Rei da Praia deletadas em lote", { quantidade: ids.length });
  }

  // ========================================
  // MÉTODOS ADICIONAIS (Interface completa)
  // ========================================

  /**
   * Buscar partidas da fase de grupos
   */
  async buscarPartidasGrupos(etapaId: string, arenaId: string): Promise<PartidaReiDaPraia[]> {
    return this.buscarPorFase(etapaId, arenaId, FaseEtapa.GRUPOS);
  }

  /**
   * Buscar partidas da fase eliminatória
   */
  async buscarPartidasEliminatorias(etapaId: string, arenaId: string): Promise<PartidaReiDaPraia[]> {
    const snapshot = await this.collection
      .where("etapaId", "==", etapaId)
      .where("arenaId", "==", arenaId)
      .where("fase", "in", [
        FaseEtapa.OITAVAS,
        FaseEtapa.QUARTAS,
        FaseEtapa.SEMIFINAL,
        FaseEtapa.FINAL,
      ])
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as PartidaReiDaPraia[];
  }

  /**
   * Buscar partidas finalizadas
   */
  async buscarFinalizadas(etapaId: string, arenaId: string): Promise<PartidaReiDaPraia[]> {
    return this.buscarPorStatus(etapaId, arenaId, StatusPartida.FINALIZADA);
  }

  /**
   * Buscar partidas por confronto (fase eliminatória)
   */
  async buscarPorConfronto(confrontoId: string): Promise<PartidaReiDaPraia[]> {
    const snapshot = await this.collection
      .where("confrontoId", "==", confrontoId)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as PartidaReiDaPraia[];
  }

  /**
   * Deletar partidas de grupos
   */
  async deletarPartidasGrupos(etapaId: string, arenaId: string): Promise<number> {
    const partidas = await this.buscarPartidasGrupos(etapaId, arenaId);
    
    if (partidas.length === 0) {
      return 0;
    }

    await this.deletarEmLote(partidas.map((p) => p.id));
    
    logger.info("Partidas de grupos deletadas", {
      etapaId,
      quantidade: partidas.length,
    });

    return partidas.length;
  }

  /**
   * Deletar partidas eliminatórias
   */
  async deletarPartidasEliminatorias(etapaId: string, arenaId: string): Promise<number> {
    const partidas = await this.buscarPartidasEliminatorias(etapaId, arenaId);
    
    if (partidas.length === 0) {
      return 0;
    }

    await this.deletarEmLote(partidas.map((p) => p.id));
    
    logger.info("Partidas eliminatórias deletadas", {
      etapaId,
      quantidade: partidas.length,
    });

    return partidas.length;
  }
}

// Instância singleton
export const partidaReiDaPraiaRepository = new PartidaReiDaPraiaRepository();
