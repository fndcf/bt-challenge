/**
 * CabecaDeChaveRepository.ts
 * Implementação Firebase do repository de CabecaDeChave
 */

import { db } from "../../config/firebase";
import { Timestamp } from "firebase-admin/firestore";
import {
  ICabecaDeChaveRepository,
  CabecaDeChave,
  CriarCabecaDeChaveDTO,
} from "../interfaces/ICabecaDeChaveRepository";
import { NotFoundError } from "../../utils/errors";
import logger from "../../utils/logger";

/**
 * Implementação Firebase do repository de CabecaDeChave
 */
export class CabecaDeChaveRepository implements ICabecaDeChaveRepository {
  private collection = db.collection("cabecas_de_chave");

  /**
   * Criar cabeça de chave
   */
  async criar(dados: CriarCabecaDeChaveDTO): Promise<CabecaDeChave> {
    const now = Timestamp.now();

    const novaCabeca: Omit<CabecaDeChave, "id"> = {
      ...dados,
      criadoEm: now,
      atualizadoEm: now,
    };

    const docRef = await this.collection.add(novaCabeca);

    logger.info("Cabeça de chave criada", {
      id: docRef.id,
      jogadorId: dados.jogadorId,
      etapaId: dados.etapaId,
      posicao: dados.posicao,
    });

    return {
      id: docRef.id,
      ...novaCabeca,
    };
  }

  /**
   * Buscar por ID
   */
  async buscarPorId(id: string): Promise<CabecaDeChave | null> {
    const doc = await this.collection.doc(id).get();

    if (!doc.exists) {
      return null;
    }

    return {
      id: doc.id,
      ...doc.data(),
    } as CabecaDeChave;
  }

  /**
   * Buscar cabeças de chave de uma etapa
   */
  async buscarPorEtapa(etapaId: string, arenaId: string): Promise<CabecaDeChave[]> {
    const snapshot = await this.collection
      .where("etapaId", "==", etapaId)
      .where("arenaId", "==", arenaId)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as CabecaDeChave[];
  }

  /**
   * Buscar cabeças de chave de uma etapa ordenadas por posição
   */
  async buscarPorEtapaOrdenado(etapaId: string, arenaId: string): Promise<CabecaDeChave[]> {
    const cabecas = await this.buscarPorEtapa(etapaId, arenaId);

    // Ordenar no client-side para evitar índice composto
    return cabecas.sort((a, b) => a.posicao - b.posicao);
  }

  /**
   * Buscar cabeça de chave de um jogador em uma etapa
   */
  async buscarPorJogadorEEtapa(jogadorId: string, etapaId: string): Promise<CabecaDeChave | null> {
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
    } as CabecaDeChave;
  }

  /**
   * Verificar se jogador é cabeça de chave na etapa
   */
  async ehCabecaDeChave(jogadorId: string, etapaId: string): Promise<boolean> {
    const cabeca = await this.buscarPorJogadorEEtapa(jogadorId, etapaId);
    return cabeca !== null;
  }

  /**
   * Atualizar cabeça de chave
   */
  async atualizar(id: string, dados: Partial<CabecaDeChave>): Promise<CabecaDeChave> {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundError("Cabeça de chave não encontrada");
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
   * Atualizar posição
   */
  async atualizarPosicao(id: string, posicao: number): Promise<void> {
    const doc = await this.collection.doc(id).get();

    if (!doc.exists) {
      throw new NotFoundError("Cabeça de chave não encontrada");
    }

    await this.collection.doc(id).update({
      posicao,
      atualizadoEm: Timestamp.now(),
    });

    logger.info("Posição da cabeça de chave atualizada", { id, posicao });
  }

  /**
   * Deletar cabeça de chave
   */
  async deletar(id: string): Promise<void> {
    const doc = await this.collection.doc(id).get();

    if (!doc.exists) {
      throw new NotFoundError("Cabeça de chave não encontrada");
    }

    await this.collection.doc(id).delete();

    logger.info("Cabeça de chave deletada", { id });
  }

  /**
   * Contar cabeças de chave de uma etapa
   */
  async contar(etapaId: string, arenaId: string): Promise<number> {
    const snapshot = await this.collection
      .where("etapaId", "==", etapaId)
      .where("arenaId", "==", arenaId)
      .get();

    return snapshot.size;
  }

  /**
   * Deletar todas as cabeças de chave de uma etapa
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

    logger.info("Cabeças de chave deletadas por etapa", {
      etapaId,
      quantidade: snapshot.size,
    });

    return snapshot.size;
  }

  /**
   * Remover jogador como cabeça de chave
   */
  async removerPorJogador(jogadorId: string, etapaId: string): Promise<void> {
    const cabeca = await this.buscarPorJogadorEEtapa(jogadorId, etapaId);

    if (cabeca) {
      await this.deletar(cabeca.id);
    }
  }

  /**
   * Criar em lote
   */
  async criarEmLote(cabecas: CriarCabecaDeChaveDTO[]): Promise<CabecaDeChave[]> {
    if (cabecas.length === 0) {
      return [];
    }

    const batch = db.batch();
    const now = Timestamp.now();
    const resultados: CabecaDeChave[] = [];

    for (const item of cabecas) {
      const docRef = this.collection.doc();

      const novaCabeca: CabecaDeChave = {
        id: docRef.id,
        ...item,
        criadoEm: now,
        atualizadoEm: now,
      };

      batch.set(docRef, novaCabeca);
      resultados.push(novaCabeca);
    }

    await batch.commit();

    logger.info("Cabeças de chave criadas em lote", { quantidade: cabecas.length });

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
  async atualizarEmLote(updates: Array<{ id: string; data: Partial<CabecaDeChave> }>): Promise<void> {
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

    logger.info("Cabeças de chave atualizadas em lote", { quantidade: updates.length });
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

    logger.info("Cabeças de chave deletadas em lote", { quantidade: ids.length });
  }
}

// Instância singleton
export const cabecaDeChaveRepository = new CabecaDeChaveRepository();
