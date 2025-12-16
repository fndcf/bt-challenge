import { db } from "../../config/firebase";
import { Timestamp, FieldValue } from "firebase-admin/firestore";
import {
  Equipe,
  CriarEquipeDTO,
  AtualizarEstatisticasEquipeDTO,
} from "../../models/Teams";
import { IEquipeRepository } from "../interfaces/IEquipeRepository";

const COLLECTION = "equipes";

export class EquipeRepository implements IEquipeRepository {
  private collection = db.collection(COLLECTION);

  async criar(dto: CriarEquipeDTO): Promise<Equipe> {
    const agora = Timestamp.now();
    const docRef = this.collection.doc();

    // Calcular ordem baseado nas equipes existentes
    const existentes = await this.buscarPorEtapa(dto.etapaId, dto.arenaId);
    const ordem = existentes.length + 1;

    const equipe: Omit<Equipe, "id"> = {
      etapaId: dto.etapaId,
      arenaId: dto.arenaId,
      nome: dto.nome || `Equipe ${ordem}`,
      ordem,
      grupoId: dto.grupoId,
      grupoNome: dto.grupoNome,
      jogadores: dto.jogadores,
      // Estatísticas zeradas
      confrontos: 0,
      vitorias: 0,
      derrotas: 0,
      pontos: 0,
      jogosVencidos: 0,
      jogosPerdidos: 0,
      saldoJogos: 0,
      gamesVencidos: 0,
      gamesPerdidos: 0,
      saldoGames: 0,
      criadoEm: agora,
      atualizadoEm: agora,
    };

    await docRef.set(equipe);

    return { id: docRef.id, ...equipe };
  }

  async criarEmLote(dtos: CriarEquipeDTO[]): Promise<Equipe[]> {
    const batch = db.batch();
    const agora = Timestamp.now();
    const equipes: Equipe[] = [];

    for (let i = 0; i < dtos.length; i++) {
      const dto = dtos[i];
      const docRef = this.collection.doc();
      const ordem = i + 1;

      const equipe: Omit<Equipe, "id"> = {
        etapaId: dto.etapaId,
        arenaId: dto.arenaId,
        nome: dto.nome || `Equipe ${ordem}`,
        ordem,
        grupoId: dto.grupoId,
        grupoNome: dto.grupoNome,
        jogadores: dto.jogadores,
        confrontos: 0,
        vitorias: 0,
        derrotas: 0,
        pontos: 0,
        jogosVencidos: 0,
        jogosPerdidos: 0,
        saldoJogos: 0,
        gamesVencidos: 0,
        gamesPerdidos: 0,
        saldoGames: 0,
        criadoEm: agora,
        atualizadoEm: agora,
      };

      batch.set(docRef, equipe);
      equipes.push({ id: docRef.id, ...equipe });
    }

    await batch.commit();
    return equipes;
  }

  async buscarPorId(id: string): Promise<Equipe | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as Equipe;
  }

  async buscarPorEtapa(etapaId: string, arenaId: string): Promise<Equipe[]> {
    const snapshot = await this.collection
      .where("etapaId", "==", etapaId)
      .where("arenaId", "==", arenaId)
      .get();

    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Equipe));
  }

  async buscarPorEtapaOrdenadas(
    etapaId: string,
    arenaId: string
  ): Promise<Equipe[]> {
    const snapshot = await this.collection
      .where("etapaId", "==", etapaId)
      .where("arenaId", "==", arenaId)
      .orderBy("ordem", "asc")
      .get();

    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Equipe));
  }

  async atualizar(id: string, dados: Partial<Equipe>): Promise<void> {
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

  async atualizarEstatisticas(
    id: string,
    estatisticas: AtualizarEstatisticasEquipeDTO
  ): Promise<void> {
    await this.collection.doc(id).update({
      ...estatisticas,
      atualizadoEm: Timestamp.now(),
    });
  }

  async incrementarEstatisticas(
    id: string,
    incrementos: Partial<AtualizarEstatisticasEquipeDTO>
  ): Promise<void> {
    const updates: Record<string, any> = {
      atualizadoEm: Timestamp.now(),
    };

    if (incrementos.confrontos !== undefined) {
      updates.confrontos = FieldValue.increment(incrementos.confrontos);
    }
    if (incrementos.vitorias !== undefined) {
      updates.vitorias = FieldValue.increment(incrementos.vitorias);
    }
    if (incrementos.derrotas !== undefined) {
      updates.derrotas = FieldValue.increment(incrementos.derrotas);
    }
    if (incrementos.pontos !== undefined) {
      updates.pontos = FieldValue.increment(incrementos.pontos);
    }
    if (incrementos.jogosVencidos !== undefined) {
      updates.jogosVencidos = FieldValue.increment(incrementos.jogosVencidos);
    }
    if (incrementos.jogosPerdidos !== undefined) {
      updates.jogosPerdidos = FieldValue.increment(incrementos.jogosPerdidos);
    }
    if (incrementos.gamesVencidos !== undefined) {
      updates.gamesVencidos = FieldValue.increment(incrementos.gamesVencidos);
    }
    if (incrementos.gamesPerdidos !== undefined) {
      updates.gamesPerdidos = FieldValue.increment(incrementos.gamesPerdidos);
    }

    await this.collection.doc(id).update(updates);
  }

  /**
   * ✅ OTIMIZAÇÃO v3: Incrementar estatísticas E saldos de múltiplas equipes em batch
   * Saldos são calculados automaticamente baseado nos incrementos de jogos/games
   */
  async incrementarEstatisticasEmLote(
    atualizacoes: Array<{
      id: string;
      incrementos: Partial<AtualizarEstatisticasEquipeDTO>;
    }>
  ): Promise<void> {
    if (atualizacoes.length === 0) return;

    const batch = db.batch();
    const agora = Timestamp.now();

    for (const { id, incrementos } of atualizacoes) {
      const docRef = this.collection.doc(id);
      const updates: Record<string, any> = {
        atualizadoEm: agora,
      };

      if (incrementos.confrontos !== undefined) {
        updates.confrontos = FieldValue.increment(incrementos.confrontos);
      }
      if (incrementos.vitorias !== undefined) {
        updates.vitorias = FieldValue.increment(incrementos.vitorias);
      }
      if (incrementos.derrotas !== undefined) {
        updates.derrotas = FieldValue.increment(incrementos.derrotas);
      }
      if (incrementos.pontos !== undefined) {
        updates.pontos = FieldValue.increment(incrementos.pontos);
      }
      if (incrementos.jogosVencidos !== undefined) {
        updates.jogosVencidos = FieldValue.increment(incrementos.jogosVencidos);
      }
      if (incrementos.jogosPerdidos !== undefined) {
        updates.jogosPerdidos = FieldValue.increment(incrementos.jogosPerdidos);
      }
      if (incrementos.gamesVencidos !== undefined) {
        updates.gamesVencidos = FieldValue.increment(incrementos.gamesVencidos);
      }
      if (incrementos.gamesPerdidos !== undefined) {
        updates.gamesPerdidos = FieldValue.increment(incrementos.gamesPerdidos);
      }

      // ✅ OTIMIZAÇÃO v3: Calcular saldos automaticamente usando increment
      // saldoJogos = jogosVencidos - jogosPerdidos
      // saldoGames = gamesVencidos - gamesPerdidos
      const saldoJogosIncrement =
        (incrementos.jogosVencidos || 0) - (incrementos.jogosPerdidos || 0);
      const saldoGamesIncrement =
        (incrementos.gamesVencidos || 0) - (incrementos.gamesPerdidos || 0);

      if (saldoJogosIncrement !== 0) {
        updates.saldoJogos = FieldValue.increment(saldoJogosIncrement);
      }
      if (saldoGamesIncrement !== 0) {
        updates.saldoGames = FieldValue.increment(saldoGamesIncrement);
      }

      batch.update(docRef, updates);
    }

    await batch.commit();
  }

  /**
   * ✅ OTIMIZAÇÃO: Buscar múltiplas equipes por IDs em paralelo
   */
  async buscarPorIds(ids: string[]): Promise<Equipe[]> {
    if (ids.length === 0) return [];

    const promises = ids.map((id) => this.collection.doc(id).get());
    const docs = await Promise.all(promises);

    return docs
      .filter((doc) => doc.exists)
      .map((doc) => ({ id: doc.id, ...doc.data() } as Equipe));
  }

  /**
   * ✅ OTIMIZAÇÃO: Atualizar múltiplas equipes em batch (para saldos)
   */
  async atualizarEmLote(
    atualizacoes: Array<{ id: string; dados: Partial<Equipe> }>
  ): Promise<void> {
    if (atualizacoes.length === 0) return;

    const batch = db.batch();
    const agora = Timestamp.now();

    for (const { id, dados } of atualizacoes) {
      const docRef = this.collection.doc(id);
      batch.update(docRef, {
        ...dados,
        atualizadoEm: agora,
      });
    }

    await batch.commit();
  }

  async atualizarPosicao(id: string, posicao: number): Promise<void> {
    await this.collection.doc(id).update({
      posicao,
      atualizadoEm: Timestamp.now(),
    });
  }

  /**
   * ✅ OTIMIZAÇÃO: Atualizar posições de múltiplas equipes em um único batch
   */
  async atualizarPosicoesEmLote(
    atualizacoes: Array<{ id: string; posicao: number }>
  ): Promise<void> {
    if (atualizacoes.length === 0) return;

    const batch = db.batch();
    const agora = Timestamp.now();

    for (const { id, posicao } of atualizacoes) {
      const docRef = this.collection.doc(id);
      batch.update(docRef, {
        posicao,
        atualizadoEm: agora,
      });
    }

    await batch.commit();
  }

  async marcarClassificada(id: string, classificada: boolean): Promise<void> {
    await this.collection.doc(id).update({
      classificada,
      atualizadoEm: Timestamp.now(),
    });
  }

  async buscarClassificadas(
    etapaId: string,
    arenaId: string
  ): Promise<Equipe[]> {
    const snapshot = await this.collection
      .where("etapaId", "==", etapaId)
      .where("arenaId", "==", arenaId)
      .where("classificada", "==", true)
      .orderBy("posicao", "asc")
      .get();

    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Equipe));
  }

  /**
   * Buscar equipes ordenadas por classificação (pontos, saldo jogos, saldo games)
   * Critérios de desempate:
   * 1. Pontos (3 por vitória)
   * 2. Saldo de jogos
   * 3. Saldo de games
   * 4. Games vencidos
   */
  async buscarPorClassificacao(
    etapaId: string,
    arenaId: string
  ): Promise<Equipe[]> {
    const equipes = await this.buscarPorEtapa(etapaId, arenaId);

    // Ordenar por critérios de classificação
    return equipes.sort((a, b) => {
      // 1. Pontos (decrescente)
      if (b.pontos !== a.pontos) {
        return b.pontos - a.pontos;
      }
      // 2. Saldo de jogos (decrescente)
      if (b.saldoJogos !== a.saldoJogos) {
        return b.saldoJogos - a.saldoJogos;
      }
      // 3. Saldo de games (decrescente)
      if (b.saldoGames !== a.saldoGames) {
        return b.saldoGames - a.saldoGames;
      }
      // 4. Games vencidos (decrescente)
      return b.gamesVencidos - a.gamesVencidos;
    });
  }
}

export default new EquipeRepository();
