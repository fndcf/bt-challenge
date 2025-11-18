import { db } from "../config/firebase";
import { Timestamp } from "firebase-admin/firestore";
import {
  EstatisticasJogador,
  CriarEstatisticasJogadorDTO,
  AtualizarEstatisticasPartidaDTO,
} from "../models/EstatisticasJogador";

/**
 * Service para gerenciar estatísticas individuais de jogadores
 *
 * USADO POR AMBOS OS FORMATOS:
 * - ChaveService (Dupla Fixa)
 * - ReiDaPraiaService (Rei da Praia)
 */
export class EstatisticasJogadorService {
  private collection = "estatisticas_jogador";

  /**
   * Criar estatísticas iniciais para um jogador
   */
  async criar(dto: CriarEstatisticasJogadorDTO): Promise<EstatisticasJogador> {
    try {
      const estatisticas: Omit<EstatisticasJogador, "id"> = {
        etapaId: dto.etapaId,
        arenaId: dto.arenaId,
        jogadorId: dto.jogadorId,
        jogadorNome: dto.jogadorNome,
        jogadorNivel: dto.jogadorNivel,
        grupoId: dto.grupoId,
        grupoNome: dto.grupoNome,
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
        classificado: false,
        criadoEm: Timestamp.now(),
        atualizadoEm: Timestamp.now(),
      };

      const docRef = await db.collection(this.collection).add(estatisticas);

      return {
        id: docRef.id,
        ...estatisticas,
      };
    } catch (error) {
      console.error("Erro ao criar estatísticas do jogador:", error);
      throw error;
    }
  }

  /**
   * Buscar estatísticas de um jogador em uma etapa
   */
  async buscarPorJogadorEtapa(
    jogadorId: string,
    etapaId: string
  ): Promise<EstatisticasJogador | null> {
    try {
      const snapshot = await db
        .collection(this.collection)
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
    } catch (error) {
      console.error("Erro ao buscar estatísticas do jogador:", error);
      throw error;
    }
  }

  /**
   * Atualizar estatísticas após uma partida
   */
  async atualizarAposPartida(
    jogadorId: string,
    etapaId: string,
    dto: AtualizarEstatisticasPartidaDTO
  ): Promise<void> {
    try {
      // Buscar estatísticas existentes
      let estatisticas = await this.buscarPorJogadorEtapa(jogadorId, etapaId);

      if (!estatisticas) {
        console.warn(
          `Estatísticas não encontradas para jogador ${jogadorId} na etapa ${etapaId}`
        );
        return;
      }

      // Calcular novos valores
      const novasEstatisticas = {
        jogos: estatisticas.jogos + 1,
        vitorias: estatisticas.vitorias + (dto.venceu ? 1 : 0),
        derrotas: estatisticas.derrotas + (dto.venceu ? 0 : 1),
        pontos: estatisticas.pontos + (dto.venceu ? 3 : 0),
        setsVencidos: estatisticas.setsVencidos + dto.setsVencidos,
        setsPerdidos: estatisticas.setsPerdidos + dto.setsPerdidos,
        gamesVencidos: estatisticas.gamesVencidos + dto.gamesVencidos,
        gamesPerdidos: estatisticas.gamesPerdidos + dto.gamesPerdidos,
        saldoSets:
          estatisticas.saldoSets + (dto.setsVencidos - dto.setsPerdidos),
        saldoGames:
          estatisticas.saldoGames + (dto.gamesVencidos - dto.gamesPerdidos),
        atualizadoEm: Timestamp.now(),
      };

      // Atualizar no banco
      await db
        .collection(this.collection)
        .doc(estatisticas.id)
        .update(novasEstatisticas);
    } catch (error) {
      console.error("Erro ao atualizar estatísticas após partida:", error);
      throw error;
    }
  }

  /**
   * Reverter estatísticas após edição de resultado
   */
  async reverterAposPartida(
    jogadorId: string,
    etapaId: string,
    dto: AtualizarEstatisticasPartidaDTO
  ): Promise<void> {
    try {
      const estatisticas = await this.buscarPorJogadorEtapa(jogadorId, etapaId);

      if (!estatisticas) {
        console.warn(
          `Estatísticas não encontradas para reverter: jogador ${jogadorId}`
        );
        return;
      }

      // Reverter valores
      const estatisticasRevertidas = {
        jogos: estatisticas.jogos - 1,
        vitorias: estatisticas.vitorias - (dto.venceu ? 1 : 0),
        derrotas: estatisticas.derrotas - (dto.venceu ? 0 : 1),
        pontos: estatisticas.pontos - (dto.venceu ? 3 : 0),
        setsVencidos: estatisticas.setsVencidos - dto.setsVencidos,
        setsPerdidos: estatisticas.setsPerdidos - dto.setsPerdidos,
        gamesVencidos: estatisticas.gamesVencidos - dto.gamesVencidos,
        gamesPerdidos: estatisticas.gamesPerdidos - dto.gamesPerdidos,
        saldoSets:
          estatisticas.saldoSets - (dto.setsVencidos - dto.setsPerdidos),
        saldoGames:
          estatisticas.saldoGames - (dto.gamesVencidos - dto.gamesPerdidos),
        atualizadoEm: Timestamp.now(),
      };

      await db
        .collection(this.collection)
        .doc(estatisticas.id)
        .update(estatisticasRevertidas);
    } catch (error) {
      console.error("Erro ao reverter estatísticas:", error);
      throw error;
    }
  }

  /**
   * Buscar todas as estatísticas de uma etapa
   */
  async buscarPorEtapa(
    etapaId: string,
    arenaId: string
  ): Promise<EstatisticasJogador[]> {
    try {
      const snapshot = await db
        .collection(this.collection)
        .where("etapaId", "==", etapaId)
        .where("arenaId", "==", arenaId)
        .get();

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as EstatisticasJogador[];
    } catch (error) {
      console.error("Erro ao buscar estatísticas da etapa:", error);
      throw error;
    }
  }

  /**
   * Buscar estatísticas de um grupo
   */
  async buscarPorGrupo(grupoId: string): Promise<EstatisticasJogador[]> {
    try {
      const snapshot = await db
        .collection(this.collection)
        .where("grupoId", "==", grupoId)
        .get();

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as EstatisticasJogador[];
    } catch (error) {
      console.error("Erro ao buscar estatísticas do grupo:", error);
      throw error;
    }
  }

  /**
   * Buscar jogadores classificados de um grupo
   * Ordenados por posição no grupo
   */
  async buscarClassificados(
    grupoId: string,
    limite: number = 2
  ): Promise<EstatisticasJogador[]> {
    try {
      const snapshot = await db
        .collection(this.collection)
        .where("grupoId", "==", grupoId)
        .orderBy("posicaoGrupo", "asc")
        .limit(limite)
        .get();

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as EstatisticasJogador[];
    } catch (error) {
      console.error("Erro ao buscar classificados:", error);
      throw error;
    }
  }

  /**
   * Atualizar grupo do jogador
   */
  async atualizarGrupo(
    jogadorId: string,
    etapaId: string,
    grupoId: string,
    grupoNome: string
  ): Promise<void> {
    try {
      const estatisticas = await this.buscarPorJogadorEtapa(jogadorId, etapaId);

      if (!estatisticas) {
        console.warn(
          `Estatísticas não encontradas para atualizar grupo: jogador ${jogadorId}`
        );
        return;
      }

      await db.collection(this.collection).doc(estatisticas.id).update({
        grupoId,
        grupoNome,
        atualizadoEm: Timestamp.now(),
      });
    } catch (error) {
      console.error("Erro ao atualizar grupo:", error);
      throw error;
    }
  }

  /**
   * Atualizar posição no grupo
   */
  async atualizarPosicaoGrupo(
    jogadorId: string,
    etapaId: string,
    posicaoGrupo: number
  ): Promise<void> {
    try {
      const estatisticas = await this.buscarPorJogadorEtapa(jogadorId, etapaId);

      if (!estatisticas) {
        console.warn(
          `Estatísticas não encontradas para atualizar posição: jogador ${jogadorId}`
        );
        return;
      }

      await db.collection(this.collection).doc(estatisticas.id).update({
        posicaoGrupo,
        atualizadoEm: Timestamp.now(),
      });
    } catch (error) {
      console.error("Erro ao atualizar posição no grupo:", error);
      throw error;
    }
  }

  /**
   * Marcar jogador como classificado
   */
  async marcarComoClassificado(
    jogadorId: string,
    etapaId: string,
    classificado: boolean
  ): Promise<void> {
    try {
      const estatisticas = await this.buscarPorJogadorEtapa(jogadorId, etapaId);

      if (!estatisticas) {
        console.warn(
          `Estatísticas não encontradas para marcar classificado: jogador ${jogadorId}`
        );
        return;
      }

      await db.collection(this.collection).doc(estatisticas.id).update({
        classificado,
        atualizadoEm: Timestamp.now(),
      });
    } catch (error) {
      console.error("Erro ao marcar como classificado:", error);
      throw error;
    }
  }

  /**
   * Buscar ranking global da arena (todos os jogadores, todas as etapas)
   */
  async buscarRankingGlobal(
    arenaId: string,
    limite: number = 50
  ): Promise<EstatisticasJogador[]> {
    try {
      const snapshot = await db
        .collection(this.collection)
        .where("arenaId", "==", arenaId)
        .orderBy("pontos", "desc")
        .orderBy("saldoGames", "desc")
        .limit(limite)
        .get();

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as EstatisticasJogador[];
    } catch (error) {
      console.error("Erro ao buscar ranking global:", error);
      throw error;
    }
  }

  /**
   * Buscar histórico de um jogador (todas as etapas)
   */
  async buscarHistoricoJogador(
    jogadorId: string,
    arenaId: string
  ): Promise<EstatisticasJogador[]> {
    try {
      const snapshot = await db
        .collection(this.collection)
        .where("jogadorId", "==", jogadorId)
        .where("arenaId", "==", arenaId)
        .orderBy("criadoEm", "desc")
        .get();

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as EstatisticasJogador[];
    } catch (error) {
      console.error("Erro ao buscar histórico do jogador:", error);
      throw error;
    }
  }
}

export default new EstatisticasJogadorService();
