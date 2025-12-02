/**
 * EstatisticasJogadorRepository.ts
 * Implementação Firebase do repository de EstatisticasJogador
 */

import { db } from "../../config/firebase";
import { Timestamp, FieldValue } from "firebase-admin/firestore";
import {
  IEstatisticasJogadorRepository,
  EstatisticasJogador,
  CriarEstatisticasJogadorDTO,
  AtualizarEstatisticasPartidaDTO,
  AtualizarPontuacaoDTO,
} from "../interfaces/IEstatisticasJogadorRepository";
import { NotFoundError } from "../../utils/errors";
import logger from "../../utils/logger";

/**
 * Implementação Firebase do repository de EstatisticasJogador
 */
export class EstatisticasJogadorRepository implements IEstatisticasJogadorRepository {
  private collection = db.collection("estatisticas_jogador");

  /**
   * Criar estatísticas para jogador
   */
  async criar(dados: CriarEstatisticasJogadorDTO): Promise<EstatisticasJogador> {
    const now = Timestamp.now();

    const novaEstatistica: Omit<EstatisticasJogador, "id"> = {
      ...dados,
      vitorias: 0,
      derrotas: 0,
      setsVencidos: 0,
      setsPerdidos: 0,
      pontosFeitos: 0,
      pontosSofridos: 0,
      saldoSets: 0,
      saldoPontos: 0,
      criadoEm: now,
      atualizadoEm: now,
    };

    const docRef = await this.collection.add(novaEstatistica);

    logger.info("Estatísticas criadas", {
      id: docRef.id,
      jogadorId: dados.jogadorId,
      etapaId: dados.etapaId,
    });

    return {
      id: docRef.id,
      ...novaEstatistica,
    };
  }

  /**
   * Buscar por ID
   */
  async buscarPorId(id: string): Promise<EstatisticasJogador | null> {
    const doc = await this.collection.doc(id).get();

    if (!doc.exists) {
      return null;
    }

    return {
      id: doc.id,
      ...doc.data(),
    } as EstatisticasJogador;
  }

  /**
   * Verificar se existe
   */
  async existe(id: string): Promise<boolean> {
    const doc = await this.collection.doc(id).get();
    return doc.exists;
  }

  /**
   * Buscar estatísticas por etapa
   */
  async buscarPorEtapa(etapaId: string, arenaId: string): Promise<EstatisticasJogador[]> {
    const snapshot = await this.collection
      .where("etapaId", "==", etapaId)
      .where("arenaId", "==", arenaId)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as EstatisticasJogador[];
  }

  /**
   * Buscar estatísticas de um jogador em uma etapa
   */
  async buscarPorJogadorEEtapa(jogadorId: string, etapaId: string): Promise<EstatisticasJogador | null> {
    const snapshot = await this.collection
      .where("jogadorId", "==", jogadorId)
      .where("etapaId", "==", etapaId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    } as EstatisticasJogador;
  }

  /**
   * Buscar estatísticas por grupo
   */
  async buscarPorGrupo(grupoId: string): Promise<EstatisticasJogador[]> {
    const snapshot = await this.collection
      .where("grupoId", "==", grupoId)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as EstatisticasJogador[];
  }

  /**
   * Buscar estatísticas por grupo ordenadas por posição
   */
  async buscarPorGrupoOrdenado(grupoId: string): Promise<EstatisticasJogador[]> {
    const estatisticas = await this.buscarPorGrupo(grupoId);

    // Ordenar no client-side para evitar índice composto
    return estatisticas.sort((a, b) => (a.posicaoGrupo || 999) - (b.posicaoGrupo || 999));
  }

  /**
   * Atualizar estatísticas
   */
  async atualizar(id: string, dados: Partial<EstatisticasJogador>): Promise<EstatisticasJogador> {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundError("Estatísticas não encontradas");
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
   * Atualizar estatísticas após partida (valores absolutos)
   */
  async atualizarEstatisticasPartida(id: string, dados: AtualizarEstatisticasPartidaDTO): Promise<void> {
    const doc = await this.collection.doc(id).get();

    if (!doc.exists) {
      throw new NotFoundError("Estatísticas não encontradas");
    }

    const updateData: any = {
      ...dados,
      atualizadoEm: Timestamp.now(),
    };

    // Recalcular saldos se necessário
    if (dados.setsVencidos !== undefined || dados.setsPerdidos !== undefined) {
      const currentData = doc.data()!;
      const setsVencidos = dados.setsVencidos ?? currentData.setsVencidos ?? 0;
      const setsPerdidos = dados.setsPerdidos ?? currentData.setsPerdidos ?? 0;
      updateData.saldoSets = setsVencidos - setsPerdidos;
    }

    if (dados.pontosFeitos !== undefined || dados.pontosSofridos !== undefined) {
      const currentData = doc.data()!;
      const pontosFeitos = dados.pontosFeitos ?? currentData.pontosFeitos ?? 0;
      const pontosSofridos = dados.pontosSofridos ?? currentData.pontosSofridos ?? 0;
      updateData.saldoPontos = pontosFeitos - pontosSofridos;
    }

    await this.collection.doc(id).update(updateData);
  }

  /**
   * Incrementar estatísticas (soma aos valores existentes)
   */
  async incrementarEstatisticas(id: string, dados: AtualizarEstatisticasPartidaDTO): Promise<void> {
    const doc = await this.collection.doc(id).get();

    if (!doc.exists) {
      throw new NotFoundError("Estatísticas não encontradas");
    }

    const updateData: any = {
      atualizadoEm: Timestamp.now(),
    };

    if (dados.vitorias !== undefined) {
      updateData.vitorias = FieldValue.increment(dados.vitorias);
    }
    if (dados.derrotas !== undefined) {
      updateData.derrotas = FieldValue.increment(dados.derrotas);
    }
    if (dados.setsVencidos !== undefined) {
      updateData.setsVencidos = FieldValue.increment(dados.setsVencidos);
      updateData.saldoSets = FieldValue.increment(dados.setsVencidos);
    }
    if (dados.setsPerdidos !== undefined) {
      updateData.setsPerdidos = FieldValue.increment(dados.setsPerdidos);
      updateData.saldoSets = FieldValue.increment(-dados.setsPerdidos);
    }
    if (dados.pontosFeitos !== undefined) {
      updateData.pontosFeitos = FieldValue.increment(dados.pontosFeitos);
      updateData.saldoPontos = FieldValue.increment(dados.pontosFeitos);
    }
    if (dados.pontosSofridos !== undefined) {
      updateData.pontosSofridos = FieldValue.increment(dados.pontosSofridos);
      updateData.saldoPontos = FieldValue.increment(-dados.pontosSofridos);
    }

    await this.collection.doc(id).update(updateData);
  }

  /**
   * Atualizar posição no grupo
   */
  async atualizarPosicaoGrupo(id: string, posicao: number): Promise<void> {
    const doc = await this.collection.doc(id).get();

    if (!doc.exists) {
      throw new NotFoundError("Estatísticas não encontradas");
    }

    await this.collection.doc(id).update({
      posicaoGrupo: posicao,
      atualizadoEm: Timestamp.now(),
    });
  }

  /**
   * Atualizar pontuação final
   */
  async atualizarPontuacao(id: string, dados: AtualizarPontuacaoDTO): Promise<void> {
    const doc = await this.collection.doc(id).get();

    if (!doc.exists) {
      throw new NotFoundError("Estatísticas não encontradas");
    }

    await this.collection.doc(id).update({
      pontos: dados.pontos,
      colocacao: dados.colocacao,
      atualizadoEm: Timestamp.now(),
    });

    logger.info("Pontuação atualizada", { id, ...dados });
  }

  /**
   * Atribuir grupo ao jogador
   */
  async atribuirGrupo(id: string, grupoId: string, grupoNome: string): Promise<void> {
    const doc = await this.collection.doc(id).get();

    if (!doc.exists) {
      throw new NotFoundError("Estatísticas não encontradas");
    }

    await this.collection.doc(id).update({
      grupoId,
      grupoNome,
      atualizadoEm: Timestamp.now(),
    });
  }

  /**
   * Deletar estatísticas
   */
  async deletar(id: string): Promise<void> {
    const doc = await this.collection.doc(id).get();

    if (!doc.exists) {
      throw new NotFoundError("Estatísticas não encontradas");
    }

    await this.collection.doc(id).delete();

    logger.info("Estatísticas deletadas", { id });
  }

  /**
   * Deletar todas as estatísticas de uma etapa
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

    logger.info("Estatísticas deletadas por etapa", {
      etapaId,
      quantidade: snapshot.size,
    });

    return snapshot.size;
  }

  /**
   * Recalcular saldos
   */
  async recalcularSaldos(id: string): Promise<void> {
    const doc = await this.collection.doc(id).get();

    if (!doc.exists) {
      throw new NotFoundError("Estatísticas não encontradas");
    }

    const data = doc.data()!;
    const saldoSets = (data.setsVencidos || 0) - (data.setsPerdidos || 0);
    const saldoPontos = (data.pontosFeitos || 0) - (data.pontosSofridos || 0);

    await this.collection.doc(id).update({
      saldoSets,
      saldoPontos,
      atualizadoEm: Timestamp.now(),
    });
  }

  /**
   * Zerar estatísticas (para recálculo)
   */
  async zerarEstatisticas(id: string): Promise<void> {
    const doc = await this.collection.doc(id).get();

    if (!doc.exists) {
      throw new NotFoundError("Estatísticas não encontradas");
    }

    await this.collection.doc(id).update({
      vitorias: 0,
      derrotas: 0,
      setsVencidos: 0,
      setsPerdidos: 0,
      pontosFeitos: 0,
      pontosSofridos: 0,
      saldoSets: 0,
      saldoPontos: 0,
      atualizadoEm: Timestamp.now(),
    });
  }

  /**
   * Criar em lote
   */
  async criarEmLote(items: CriarEstatisticasJogadorDTO[]): Promise<EstatisticasJogador[]> {
    if (items.length === 0) {
      return [];
    }

    const batch = db.batch();
    const now = Timestamp.now();
    const resultados: EstatisticasJogador[] = [];

    for (const item of items) {
      const docRef = this.collection.doc();

      const novaEstatistica: EstatisticasJogador = {
        id: docRef.id,
        ...item,
        vitorias: 0,
        derrotas: 0,
        setsVencidos: 0,
        setsPerdidos: 0,
        pontosFeitos: 0,
        pontosSofridos: 0,
        saldoSets: 0,
        saldoPontos: 0,
        criadoEm: now,
        atualizadoEm: now,
      };

      batch.set(docRef, novaEstatistica);
      resultados.push(novaEstatistica);
    }

    await batch.commit();

    logger.info("Estatísticas criadas em lote", { quantidade: items.length });

    return resultados;
  }

  /**
   * Deletar em lote
   */
  async deletarEmLote(ids: string[]): Promise<number> {
    if (ids.length === 0) {
      return 0;
    }

    const batch = db.batch();

    for (const id of ids) {
      batch.delete(this.collection.doc(id));
    }

    await batch.commit();

    logger.info("Estatísticas deletadas em lote", { quantidade: ids.length });

    return ids.length;
  }
}

// Instância singleton
export const estatisticasJogadorRepository = new EstatisticasJogadorRepository();
