/**
 * Implementação Firebase do repository de Cabeça de Chave
 */

import { Timestamp } from "firebase-admin/firestore";
import { db } from "../../config/firebase";
import {
  AtualizarCabecaDeChaveDTO,
  CabecaDeChave,
  CriarCabecaDeChaveDTO,
} from "../../models/CabecaDeChave";
import { ICabecaDeChaveRepository } from "../interfaces/ICabecaDeChaveRepository";

const COLLECTION = "cabecas_de_chave";

export class CabecaDeChaveRepository implements ICabecaDeChaveRepository {
  private collection = db.collection(COLLECTION);

  /**
   * Criar cabeça de chave
   */
  async criar(dto: CriarCabecaDeChaveDTO): Promise<CabecaDeChave> {
    const agora = Timestamp.now();

    const cabeca: Omit<CabecaDeChave, "id"> = {
      arenaId: dto.arenaId,
      etapaId: dto.etapaId,
      jogadorId: dto.jogadorId,
      jogadorNome: dto.jogadorNome,
      jogadorNivel: dto.jogadorNivel,
      jogadorGenero: dto.jogadorGenero,
      ordem: dto.ordem,
      ativo: true,
      criadoEm: agora,
      atualizadoEm: agora,
    };

    const docRef = await this.collection.add(cabeca);

    return { id: docRef.id, ...cabeca };
  }

  /**
   * Buscar a cabeça de chave ativa do jogador na etapa
   */
  async buscarPorJogador(
    arenaId: string,
    etapaId: string,
    jogadorId: string
  ): Promise<CabecaDeChave | null> {
    const snapshot = await this.collection
      .where("arenaId", "==", arenaId)
      .where("etapaId", "==", etapaId)
      .where("jogadorId", "==", jogadorId)
      .where("ativo", "==", true)
      .limit(1)
      .get();

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as CabecaDeChave;
  }

  /**
   * Listar as ativas da etapa, na ordem
   */
  async listarAtivas(
    arenaId: string,
    etapaId: string
  ): Promise<CabecaDeChave[]> {
    const snapshot = await this.collection
      .where("arenaId", "==", arenaId)
      .where("etapaId", "==", etapaId)
      .where("ativo", "==", true)
      .orderBy("ordem", "asc")
      .get();

    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as CabecaDeChave
    );
  }

  /**
   * Atualizar só os campos informados
   */
  async atualizar(id: string, dto: AtualizarCabecaDeChaveDTO): Promise<void> {
    await this.collection.doc(id).update({
      ...(dto.ordem !== undefined && { ordem: dto.ordem }),
      ...(dto.ativo !== undefined && { ativo: dto.ativo }),
      ...(dto.motivoDesativacao !== undefined && {
        motivoDesativacao: dto.motivoDesativacao,
      }),
      atualizadoEm: Timestamp.now(),
    });
  }

  /**
   * Deletar cabeça de chave
   */
  async deletar(id: string): Promise<void> {
    await this.collection.doc(id).delete();
  }

  /**
   * Deletar todas da etapa
   */
  async deletarPorEtapa(etapaId: string, arenaId: string): Promise<number> {
    const snapshot = await this.collection
      .where("etapaId", "==", etapaId)
      .where("arenaId", "==", arenaId)
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
export const cabecaDeChaveRepository = new CabecaDeChaveRepository();
