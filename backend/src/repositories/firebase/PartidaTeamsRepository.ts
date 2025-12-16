import { db } from "../../config/firebase";
import { Timestamp } from "firebase-admin/firestore";
import {
  PartidaTeams,
  CriarPartidaTeamsDTO,
  SetPlacarTeams,
  TipoJogoTeams,
} from "../../models/Teams";
import { StatusPartida } from "../../models/Partida";
import { IPartidaTeamsRepository } from "../interfaces/IPartidaTeamsRepository";

const COLLECTION = "partidas_teams";

export class PartidaTeamsRepository implements IPartidaTeamsRepository {
  private collection = db.collection(COLLECTION);

  async criar(dto: CriarPartidaTeamsDTO): Promise<PartidaTeams> {
    const agora = Timestamp.now();
    const docRef = this.collection.doc();

    const partida: Omit<PartidaTeams, "id"> = {
      etapaId: dto.etapaId,
      arenaId: dto.arenaId,
      confrontoId: dto.confrontoId,
      ordem: dto.ordem,
      tipoJogo: dto.tipoJogo,
      dupla1: dto.dupla1,
      dupla2: dto.dupla2,
      equipe1Id: dto.equipe1Id,
      equipe1Nome: dto.equipe1Nome,
      equipe2Id: dto.equipe2Id,
      equipe2Nome: dto.equipe2Nome,
      status: StatusPartida.AGENDADA,
      setsDupla1: 0,
      setsDupla2: 0,
      placar: [],
      criadoEm: agora,
      atualizadoEm: agora,
    };

    await docRef.set(partida);

    return { id: docRef.id, ...partida };
  }

  async criarEmLote(dtos: CriarPartidaTeamsDTO[]): Promise<PartidaTeams[]> {
    const batch = db.batch();
    const agora = Timestamp.now();
    const partidas: PartidaTeams[] = [];

    for (const dto of dtos) {
      const docRef = this.collection.doc();

      const partida: Omit<PartidaTeams, "id"> = {
        etapaId: dto.etapaId,
        arenaId: dto.arenaId,
        confrontoId: dto.confrontoId,
        ordem: dto.ordem,
        tipoJogo: dto.tipoJogo,
        dupla1: dto.dupla1,
        dupla2: dto.dupla2,
        equipe1Id: dto.equipe1Id,
        equipe1Nome: dto.equipe1Nome,
        equipe2Id: dto.equipe2Id,
        equipe2Nome: dto.equipe2Nome,
        status: StatusPartida.AGENDADA,
        setsDupla1: 0,
        setsDupla2: 0,
        placar: [],
        criadoEm: agora,
        atualizadoEm: agora,
      };

      batch.set(docRef, partida);
      partidas.push({ id: docRef.id, ...partida });
    }

    await batch.commit();
    return partidas;
  }

  async buscarPorId(id: string): Promise<PartidaTeams | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as PartidaTeams;
  }

  async buscarPorEtapa(
    etapaId: string,
    arenaId: string
  ): Promise<PartidaTeams[]> {
    const snapshot = await this.collection
      .where("etapaId", "==", etapaId)
      .where("arenaId", "==", arenaId)
      .get();

    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as PartidaTeams)
    );
  }

  async atualizar(id: string, dados: Partial<PartidaTeams>): Promise<void> {
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

  async buscarPorConfronto(confrontoId: string): Promise<PartidaTeams[]> {
    const snapshot = await this.collection
      .where("confrontoId", "==", confrontoId)
      .get();

    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as PartidaTeams)
    );
  }

  async buscarPorConfrontoOrdenadas(
    confrontoId: string
  ): Promise<PartidaTeams[]> {
    const snapshot = await this.collection
      .where("confrontoId", "==", confrontoId)
      .orderBy("ordem", "asc")
      .get();

    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as PartidaTeams)
    );
  }

  async deletarPorConfronto(confrontoId: string): Promise<void> {
    const snapshot = await this.collection
      .where("confrontoId", "==", confrontoId)
      .get();

    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }

  async buscarPorTipo(
    confrontoId: string,
    tipoJogo: TipoJogoTeams
  ): Promise<PartidaTeams | null> {
    const snapshot = await this.collection
      .where("confrontoId", "==", confrontoId)
      .where("tipoJogo", "==", tipoJogo)
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as PartidaTeams;
  }

  async buscarDecider(confrontoId: string): Promise<PartidaTeams | null> {
    return this.buscarPorTipo(confrontoId, TipoJogoTeams.DECIDER);
  }

  async registrarResultado(
    id: string,
    placar: SetPlacarTeams[],
    setsDupla1: number,
    setsDupla2: number,
    vencedoraEquipeId: string,
    vencedoraEquipeNome: string
  ): Promise<void> {
    await this.collection.doc(id).update({
      placar,
      setsDupla1,
      setsDupla2,
      vencedoraEquipeId,
      vencedoraEquipeNome,
      status: StatusPartida.FINALIZADA,
      finalizadoEm: Timestamp.now(),
      atualizadoEm: Timestamp.now(),
    });
  }

  async atualizarStatus(id: string, status: StatusPartida): Promise<void> {
    await this.collection.doc(id).update({
      status,
      atualizadoEm: Timestamp.now(),
    });
  }

  async limparResultado(id: string): Promise<void> {
    await this.collection.doc(id).update({
      placar: [],
      setsDupla1: 0,
      setsDupla2: 0,
      vencedoraEquipeId: null,
      vencedoraEquipeNome: null,
      status: StatusPartida.AGENDADA,
      finalizadoEm: null,
      atualizadoEm: Timestamp.now(),
    });
  }

  async contarFinalizadasPorConfronto(confrontoId: string): Promise<number> {
    const snapshot = await this.collection
      .where("confrontoId", "==", confrontoId)
      .where("status", "==", StatusPartida.FINALIZADA)
      .count()
      .get();

    return snapshot.data().count;
  }

  async contarPorConfronto(confrontoId: string): Promise<number> {
    const snapshot = await this.collection
      .where("confrontoId", "==", confrontoId)
      .count()
      .get();

    return snapshot.data().count;
  }

  async existeDecider(confrontoId: string): Promise<boolean> {
    const decider = await this.buscarDecider(confrontoId);
    return decider !== null;
  }
}

export default new PartidaTeamsRepository();
