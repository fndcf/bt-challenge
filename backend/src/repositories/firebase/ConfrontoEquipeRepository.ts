import { db } from "../../config/firebase";
import { Timestamp, FieldValue } from "firebase-admin/firestore";
import {
  ConfrontoEquipe,
  CriarConfrontoDTO,
  StatusConfronto,
} from "../../models/Teams";
import { FaseEtapa } from "../../models/Etapa";
import { IConfrontoEquipeRepository } from "../interfaces/IConfrontoEquipeRepository";

const COLLECTION = "confrontos_equipe";

export class ConfrontoEquipeRepository implements IConfrontoEquipeRepository {
  private collection = db.collection(COLLECTION);

  async criar(dto: CriarConfrontoDTO): Promise<ConfrontoEquipe> {
    const agora = Timestamp.now();
    const docRef = this.collection.doc();

    const confronto: Omit<ConfrontoEquipe, "id"> = {
      etapaId: dto.etapaId,
      arenaId: dto.arenaId,
      fase: dto.fase,
      rodada: dto.rodada,
      ordem: dto.ordem,
      grupoId: dto.grupoId,
      equipe1Id: dto.equipe1Id,
      equipe1Nome: dto.equipe1Nome,
      equipe2Id: dto.equipe2Id,
      equipe2Nome: dto.equipe2Nome,
      equipe1Origem: dto.equipe1Origem,
      equipe2Origem: dto.equipe2Origem,
      proximoConfrontoId: dto.proximoConfrontoId,
      isBye: dto.isBye,
      status: StatusConfronto.AGENDADO,
      jogosEquipe1: 0,
      jogosEquipe2: 0,
      partidas: [],
      totalPartidas: 0,
      partidasFinalizadas: 0,
      temDecider: false,
      tipoFormacaoJogos: dto.tipoFormacaoJogos,
      criadoEm: agora,
      atualizadoEm: agora,
    };

    await docRef.set(confronto);

    return { id: docRef.id, ...confronto };
  }

  async criarEmLote(dtos: CriarConfrontoDTO[]): Promise<ConfrontoEquipe[]> {
    const batch = db.batch();
    const agora = Timestamp.now();
    const confrontos: ConfrontoEquipe[] = [];

    for (const dto of dtos) {
      const docRef = this.collection.doc();

      const confronto: Omit<ConfrontoEquipe, "id"> = {
        etapaId: dto.etapaId,
        arenaId: dto.arenaId,
        fase: dto.fase,
        rodada: dto.rodada,
        ordem: dto.ordem,
        grupoId: dto.grupoId,
        equipe1Id: dto.equipe1Id,
        equipe1Nome: dto.equipe1Nome,
        equipe2Id: dto.equipe2Id,
        equipe2Nome: dto.equipe2Nome,
        equipe1Origem: dto.equipe1Origem,
        equipe2Origem: dto.equipe2Origem,
        proximoConfrontoId: dto.proximoConfrontoId,
        isBye: dto.isBye,
        status: StatusConfronto.AGENDADO,
        jogosEquipe1: 0,
        jogosEquipe2: 0,
        partidas: [],
        totalPartidas: 0,
        partidasFinalizadas: 0,
        temDecider: false,
        tipoFormacaoJogos: dto.tipoFormacaoJogos,
        criadoEm: agora,
        atualizadoEm: agora,
      };

      batch.set(docRef, confronto);
      confrontos.push({ id: docRef.id, ...confronto });
    }

    await batch.commit();
    return confrontos;
  }

  async buscarPorId(id: string): Promise<ConfrontoEquipe | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as ConfrontoEquipe;
  }

  async buscarPorEtapa(
    etapaId: string,
    arenaId: string
  ): Promise<ConfrontoEquipe[]> {
    const snapshot = await this.collection
      .where("etapaId", "==", etapaId)
      .where("arenaId", "==", arenaId)
      .get();

    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as ConfrontoEquipe)
    );
  }

  async buscarPorEtapaOrdenados(
    etapaId: string,
    arenaId: string
  ): Promise<ConfrontoEquipe[]> {
    const snapshot = await this.collection
      .where("etapaId", "==", etapaId)
      .where("arenaId", "==", arenaId)
      .orderBy("ordem", "asc")
      .get();

    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as ConfrontoEquipe)
    );
  }

  async atualizar(id: string, dados: Partial<ConfrontoEquipe>): Promise<void> {
    await this.collection.doc(id).update({
      ...dados,
      atualizadoEm: Timestamp.now(),
    });
  }

  async deletar(id: string): Promise<void> {
    await this.collection.doc(id).delete();
  }

  async deletarPorEtapa(etapaId: string, arenaId: string): Promise<void> {
    const snapshot = await this.collection
      .where("etapaId", "==", etapaId)
      .where("arenaId", "==", arenaId)
      .get();

    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }

  async buscarPorFase(
    etapaId: string,
    arenaId: string,
    fase: FaseEtapa
  ): Promise<ConfrontoEquipe[]> {
    const snapshot = await this.collection
      .where("etapaId", "==", etapaId)
      .where("arenaId", "==", arenaId)
      .where("fase", "==", fase)
      .orderBy("ordem", "asc")
      .get();

    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as ConfrontoEquipe)
    );
  }

  async buscarPorRodada(
    etapaId: string,
    arenaId: string,
    rodada: number
  ): Promise<ConfrontoEquipe[]> {
    const snapshot = await this.collection
      .where("etapaId", "==", etapaId)
      .where("arenaId", "==", arenaId)
      .where("rodada", "==", rodada)
      .orderBy("ordem", "asc")
      .get();

    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as ConfrontoEquipe)
    );
  }

  async buscarPorEquipe(
    etapaId: string,
    arenaId: string,
    equipeId: string
  ): Promise<ConfrontoEquipe[]> {
    // Buscar confrontos onde a equipe é equipe1 ou equipe2
    const [asEquipe1, asEquipe2] = await Promise.all([
      this.collection
        .where("etapaId", "==", etapaId)
        .where("arenaId", "==", arenaId)
        .where("equipe1Id", "==", equipeId)
        .get(),
      this.collection
        .where("etapaId", "==", etapaId)
        .where("arenaId", "==", arenaId)
        .where("equipe2Id", "==", equipeId)
        .get(),
    ]);

    const confrontos = [
      ...asEquipe1.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as ConfrontoEquipe)
      ),
      ...asEquipe2.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as ConfrontoEquipe)
      ),
    ];

    // Ordenar por ordem
    return confrontos.sort((a, b) => a.ordem - b.ordem);
  }

  async registrarResultado(
    id: string,
    jogosEquipe1: number,
    jogosEquipe2: number,
    vencedoraId: string,
    vencedoraNome: string
  ): Promise<void> {
    await this.collection.doc(id).update({
      jogosEquipe1,
      jogosEquipe2,
      vencedoraId,
      vencedoraNome,
      status: StatusConfronto.FINALIZADO,
      atualizadoEm: Timestamp.now(),
    });
  }

  async atualizarStatus(id: string, status: StatusConfronto): Promise<void> {
    await this.collection.doc(id).update({
      status,
      atualizadoEm: Timestamp.now(),
    });
  }

  async adicionarPartida(confrontoId: string, partidaId: string): Promise<void> {
    await this.collection.doc(confrontoId).update({
      partidas: FieldValue.arrayUnion(partidaId),
      totalPartidas: FieldValue.increment(1),
      atualizadoEm: Timestamp.now(),
    });
  }

  /**
   * ✅ OTIMIZAÇÃO: Adicionar múltiplas partidas de uma vez
   */
  async adicionarPartidasEmLote(confrontoId: string, partidaIds: string[]): Promise<void> {
    if (partidaIds.length === 0) return;

    await this.collection.doc(confrontoId).update({
      partidas: FieldValue.arrayUnion(...partidaIds),
      totalPartidas: FieldValue.increment(partidaIds.length),
      atualizadoEm: Timestamp.now(),
    });
  }

  async incrementarPartidasFinalizadas(confrontoId: string): Promise<void> {
    await this.collection.doc(confrontoId).update({
      partidasFinalizadas: FieldValue.increment(1),
      atualizadoEm: Timestamp.now(),
    });
  }

  async atualizarContadorJogos(
    confrontoId: string,
    jogosEquipe1: number,
    jogosEquipe2: number
  ): Promise<void> {
    await this.collection.doc(confrontoId).update({
      jogosEquipe1,
      jogosEquipe2,
      atualizadoEm: Timestamp.now(),
    });
  }

  async marcarTemDecider(
    confrontoId: string,
    temDecider: boolean
  ): Promise<void> {
    await this.collection.doc(confrontoId).update({
      temDecider,
      atualizadoEm: Timestamp.now(),
    });
  }

  async contarFinalizados(etapaId: string, arenaId: string): Promise<number> {
    const snapshot = await this.collection
      .where("etapaId", "==", etapaId)
      .where("arenaId", "==", arenaId)
      .where("status", "==", StatusConfronto.FINALIZADO)
      .count()
      .get();

    return snapshot.data().count;
  }

  async contarPorFase(
    etapaId: string,
    arenaId: string,
    fase: FaseEtapa
  ): Promise<number> {
    const snapshot = await this.collection
      .where("etapaId", "==", etapaId)
      .where("arenaId", "==", arenaId)
      .where("fase", "==", fase)
      .count()
      .get();

    return snapshot.data().count;
  }

  async todosFinalizadosPorFase(
    etapaId: string,
    arenaId: string,
    fase: FaseEtapa
  ): Promise<boolean> {
    const confrontos = await this.buscarPorFase(etapaId, arenaId, fase);
    return confrontos.every((c) => c.status === StatusConfronto.FINALIZADO);
  }

  async resetarConfronto(confrontoId: string): Promise<void> {
    await this.collection.doc(confrontoId).update({
      jogosEquipe1: 0,
      jogosEquipe2: 0,
      partidas: [],
      totalPartidas: 0,
      partidasFinalizadas: 0,
      temDecider: false,
      vencedoraId: FieldValue.delete(),
      vencedoraNome: FieldValue.delete(),
      status: StatusConfronto.AGENDADO,
      atualizadoEm: Timestamp.now(),
    });
  }
}

export default new ConfrontoEquipeRepository();
