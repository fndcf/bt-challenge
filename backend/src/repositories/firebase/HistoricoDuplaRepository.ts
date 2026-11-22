/**
 * Implementação Firebase do repository de Histórico de Duplas
 */

import { Timestamp } from "firebase-admin/firestore";
import { db } from "../../config/firebase";
import { HistoricoDupla } from "../../models/HistoricoDupla";
import { IHistoricoDuplaRepository } from "../interfaces/IHistoricoDuplaRepository";

const COLLECTION = "historico_duplas";

export class HistoricoDuplaRepository implements IHistoricoDuplaRepository {
  private collection = db.collection(COLLECTION);

  /**
   * Criar vários registros de uma vez
   */
  async criarEmLote(
    itens: Omit<HistoricoDupla, "id" | "criadoEm">[]
  ): Promise<HistoricoDupla[]> {
    const batch = db.batch();
    const criadoEm = Timestamp.now();

    const historicos = itens.map((item) => {
      const docRef = this.collection.doc();
      const historico = { ...item, criadoEm };
      batch.set(docRef, historico);
      return { id: docRef.id, ...historico };
    });

    await batch.commit();

    return historicos;
  }

  /**
   * Deletar todos os registros da etapa
   */
  async deletarPorEtapa(etapaId: string, arenaId: string): Promise<number> {
    const snapshot = await this.collection
      .where("arenaId", "==", arenaId)
      .where("etapaId", "==", etapaId)
      .get();

    if (snapshot.empty) return 0;

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    return snapshot.size;
  }
}

// Exportar instância única
export const historicoDuplaRepository = new HistoricoDuplaRepository();
