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
        jogadorGenero: dto.jogadorGenero,
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
        console.warn(`Estatísticas não encontradas...`);
        return;
      }

      const novasEstatisticas = {
        jogos: estatisticas.jogos + 1,
        vitorias: estatisticas.vitorias + (dto.venceu ? 1 : 0),
        derrotas: estatisticas.derrotas + (dto.venceu ? 0 : 1),
        pontos: estatisticas.pontos, // ← NÃO MEXE (sempre 0 até finalizar etapa)
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
        console.warn(`Estatísticas não encontradas...`);
        return;
      }

      const estatisticasRevertidas = {
        jogos: estatisticas.jogos - 1,
        vitorias: estatisticas.vitorias - (dto.venceu ? 1 : 0),
        derrotas: estatisticas.derrotas - (dto.venceu ? 0 : 1),
        pontos: estatisticas.pontos, // ← NÃO MEXE
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

  /**
   * Buscar estatísticas AGREGADAS de um jogador (todas as etapas)
   *
   * AGREGA:
   * - Total de etapas participadas
   * - Total de jogos, vitórias, derrotas
   * - Total de sets, games, pontos
   * - Saldos acumulados
   */
  async buscarEstatisticasAgregadas(
    jogadorId: string,
    arenaId: string
  ): Promise<any> {
    try {
      console.log(`📊 Buscando estatísticas agregadas: jogador ${jogadorId}`);

      const snapshot = await db
        .collection(this.collection)
        .where("jogadorId", "==", jogadorId)
        .where("arenaId", "==", arenaId)
        .get();

      if (snapshot.empty) {
        console.log("⚠️ Nenhuma estatística encontrada");
        return null;
      }

      // Agregar estatísticas
      let jogadorNome = "";
      let jogadorNivel: string | undefined = undefined;
      let jogadorGenero: string | undefined = undefined;
      let etapasParticipadas = 0;
      let jogos = 0;
      let vitorias = 0;
      let derrotas = 0;
      let pontos = 0;
      let setsVencidos = 0;
      let setsPerdidos = 0;
      let gamesVencidos = 0;
      let gamesPerdidos = 0;

      snapshot.docs.forEach((doc) => {
        const stat = doc.data() as EstatisticasJogador;
        jogadorNome = stat.jogadorNome;
        jogadorNivel = stat.jogadorNivel;
        jogadorGenero = stat.jogadorGenero;
        etapasParticipadas++;
        jogos += stat.jogos || 0;
        vitorias += stat.vitorias || 0;
        derrotas += stat.derrotas || 0;
        pontos += stat.pontos || 0;
        setsVencidos += stat.setsVencidos || 0;
        setsPerdidos += stat.setsPerdidos || 0;
        gamesVencidos += stat.gamesVencidos || 0;
        gamesPerdidos += stat.gamesPerdidos || 0;
      });

      const saldoSets = setsVencidos - setsPerdidos;
      const saldoGames = gamesVencidos - gamesPerdidos;

      // ✅ NOVO: Buscar posição no ranking
      const rankingCompleto = await this.buscarRankingGlobalAgregado(
        arenaId,
        999
      );
      const posicaoRanking =
        rankingCompleto.findIndex((j) => j.jogadorId === jogadorId) + 1;

      console.log(
        `✅ Estatísticas agregadas calculadas (Posição: ${posicaoRanking}º)`
      );

      return {
        jogadorId,
        jogadorNome,
        jogadorNivel,
        jogadorGenero,
        arenaId,
        etapasParticipadas,
        jogos,
        vitorias,
        derrotas,
        pontos,
        setsVencidos,
        setsPerdidos,
        gamesVencidos,
        gamesPerdidos,
        saldoSets,
        saldoGames,
        posicaoRanking, // ✅ NOVO
      };
    } catch (error) {
      console.error("Erro ao buscar estatísticas agregadas:", error);
      throw error;
    }
  }

  /**
   * Buscar ranking GLOBAL agregado (todas as etapas de todos os jogadores)
   */
  async buscarRankingGlobalAgregado(
    arenaId: string,
    limite: number = 50
  ): Promise<
    Array<{
      jogadorId: string;
      jogadorNome: string;
      jogadorNivel?: string;
      jogadorGenero?: string;
      etapasParticipadas: number;
      jogos: number;
      vitorias: number;
      derrotas: number;
      pontos: number;
      setsVencidos: number;
      setsPerdidos: number;
      gamesVencidos: number;
      gamesPerdidos: number;
      saldoSets: number;
      saldoGames: number;
    }>
  > {
    try {
      // Buscar TODAS as estatísticas da arena
      const snapshot = await db
        .collection(this.collection)
        .where("arenaId", "==", arenaId)
        .get();

      // Agregar por jogador
      const jogadoresMap = new Map<string, any>();

      snapshot.docs.forEach((doc) => {
        const stats = doc.data() as EstatisticasJogador;

        if (!jogadoresMap.has(stats.jogadorId)) {
          jogadoresMap.set(stats.jogadorId, {
            jogadorId: stats.jogadorId,
            jogadorNome: stats.jogadorNome,
            jogadorNivel: stats.jogadorNivel,
            jogadorGenero: stats.jogadorGenero,
            etapasParticipadas: 0,
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
          });
        }

        const jogador = jogadoresMap.get(stats.jogadorId);
        jogador.etapasParticipadas += 1;
        jogador.jogos += stats.jogos || 0;
        jogador.vitorias += stats.vitorias || 0;
        jogador.derrotas += stats.derrotas || 0;
        jogador.pontos += stats.pontos || 0;
        jogador.setsVencidos += stats.setsVencidos || 0;
        jogador.setsPerdidos += stats.setsPerdidos || 0;
        jogador.gamesVencidos += stats.gamesVencidos || 0;
        jogador.gamesPerdidos += stats.gamesPerdidos || 0;
        jogador.saldoSets += stats.saldoSets || 0;
        jogador.saldoGames += stats.saldoGames || 0;
      });

      // Converter para array e ordenar
      const ranking = Array.from(jogadoresMap.values());

      ranking.sort((a, b) => {
        // 1. Pontos
        if (a.pontos !== b.pontos) return b.pontos - a.pontos;
        // 2. Saldo de games
        if (a.saldoGames !== b.saldoGames) return b.saldoGames - a.saldoGames;
        // 3. Games vencidos
        if (a.gamesVencidos !== b.gamesVencidos)
          return b.gamesVencidos - a.gamesVencidos;
        // 4. Vitórias
        if (a.vitorias !== b.vitorias) return b.vitorias - a.vitorias;
        return 0;
      });

      return ranking.slice(0, limite);
    } catch (error) {
      console.error("Erro ao buscar ranking global agregado:", error);
      throw error;
    }
  }
}

export default new EstatisticasJogadorService();
