/**
 * EstatisticasJogadorService.ts
 * Service para gerenciar estatísticas individuais de jogadores
 * USADO POR: ChaveService (Dupla Fixa) + ReiDaPraiaService (Rei da Praia)
 */

import { db } from "../config/firebase";
import { Timestamp } from "firebase-admin/firestore";
import {
  EstatisticasJogador,
  CriarEstatisticasJogadorDTO,
  AtualizarEstatisticasPartidaDTO,
} from "../models/EstatisticasJogador";
import logger from "../utils/logger";

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
        // Estatísticas Rei da Praia (fase de grupos)
        jogosGrupo: 0,
        vitoriasGrupo: 0,
        derrotasGrupo: 0,
        pontosGrupo: 0,
        setsVencidosGrupo: 0,
        setsPerdidosGrupo: 0,
        saldoSetsGrupo: 0,
        gamesVencidosGrupo: 0,
        gamesPerdidosGrupo: 0,
        saldoGamesGrupo: 0,
        // Estatísticas Dupla Fixa
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

      const novaEstatistica = {
        id: docRef.id,
        ...estatisticas,
      };

      logger.info("Estatísticas de jogador criadas", {
        estatisticaId: novaEstatistica.id,
        etapaId: dto.etapaId,
        jogadorId: dto.jogadorId,
        jogadorNome: dto.jogadorNome,
        grupoId: dto.grupoId,
      });

      return novaEstatistica;
    } catch (error) {
      logger.error(
        "Erro ao criar estatísticas de jogador",
        {
          etapaId: dto.etapaId,
          jogadorId: dto.jogadorId,
        },
        error as Error
      );
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
  }

  /**
   * Atualizar estatísticas após uma partida (Dupla Fixa)
   */
  async atualizarAposPartida(
    jogadorId: string,
    etapaId: string,
    dto: AtualizarEstatisticasPartidaDTO
  ): Promise<void> {
    try {
      const estatisticas = await this.buscarPorJogadorEtapa(jogadorId, etapaId);

      if (!estatisticas) {
        logger.warn("Estatísticas não encontradas para atualizar", {
          jogadorId,
          etapaId,
        });
        return;
      }

      const novasEstatisticas = {
        jogos: estatisticas.jogos + 1,
        vitorias: estatisticas.vitorias + (dto.venceu ? 1 : 0),
        derrotas: estatisticas.derrotas + (dto.venceu ? 0 : 1),
        pontos: estatisticas.pontos,
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

      await db
        .collection(this.collection)
        .doc(estatisticas.id)
        .update(novasEstatisticas);

      logger.info("Estatísticas atualizadas após partida", {
        jogadorId,
        etapaId,
        venceu: dto.venceu,
        setsVencidos: dto.setsVencidos,
        setsPerdidos: dto.setsPerdidos,
      });
    } catch (error) {
      logger.error(
        "Erro ao atualizar estatísticas após partida",
        {
          jogadorId,
          etapaId,
        },
        error as Error
      );
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
        logger.warn("Estatísticas não encontradas para reverter", {
          jogadorId,
          etapaId,
        });
        return;
      }

      const estatisticasRevertidas = {
        jogos: estatisticas.jogos - 1,
        vitorias: estatisticas.vitorias - (dto.venceu ? 1 : 0),
        derrotas: estatisticas.derrotas - (dto.venceu ? 0 : 1),
        pontos: estatisticas.pontos,
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

      logger.info("Estatísticas revertidas após edição de resultado", {
        jogadorId,
        etapaId,
      });
    } catch (error) {
      logger.error(
        "Erro ao reverter estatísticas",
        {
          jogadorId,
          etapaId,
        },
        error as Error
      );
      throw error;
    }
  }

  /**
   * Atualizar estatísticas após partida da FASE DE GRUPOS
   */
  async atualizarAposPartidaGrupo(
    jogadorId: string,
    etapaId: string,
    dto: AtualizarEstatisticasPartidaDTO
  ): Promise<void> {
    try {
      const estatisticas = await this.buscarPorJogadorEtapa(jogadorId, etapaId);

      if (!estatisticas) {
        logger.warn("Estatísticas não encontradas para atualizar (grupo)", {
          jogadorId,
          etapaId,
        });
        return;
      }

      const novasEstatisticas = {
        // Estatísticas de GRUPO
        jogosGrupo: (estatisticas.jogosGrupo || 0) + 1,
        vitoriasGrupo: (estatisticas.vitoriasGrupo || 0) + (dto.venceu ? 1 : 0),
        derrotasGrupo: (estatisticas.derrotasGrupo || 0) + (dto.venceu ? 0 : 1),
        pontosGrupo: (estatisticas.pontosGrupo || 0) + (dto.venceu ? 3 : 0),
        setsVencidosGrupo:
          (estatisticas.setsVencidosGrupo || 0) + dto.setsVencidos,
        setsPerdidosGrupo:
          (estatisticas.setsPerdidosGrupo || 0) + dto.setsPerdidos,
        saldoSetsGrupo:
          (estatisticas.saldoSetsGrupo || 0) +
          (dto.setsVencidos - dto.setsPerdidos),
        gamesVencidosGrupo:
          (estatisticas.gamesVencidosGrupo || 0) + dto.gamesVencidos,
        gamesPerdidosGrupo:
          (estatisticas.gamesPerdidosGrupo || 0) + dto.gamesPerdidos,
        saldoGamesGrupo:
          (estatisticas.saldoGamesGrupo || 0) +
          (dto.gamesVencidos - dto.gamesPerdidos),

        // Estatísticas TOTAIS
        jogos: estatisticas.jogos + 1,
        vitorias: estatisticas.vitorias + (dto.venceu ? 1 : 0),
        derrotas: estatisticas.derrotas + (dto.venceu ? 0 : 1),
        setsVencidos: estatisticas.setsVencidos + dto.setsVencidos,
        setsPerdidos: estatisticas.setsPerdidos + dto.setsPerdidos,
        saldoSets:
          estatisticas.saldoSets + (dto.setsVencidos - dto.setsPerdidos),
        gamesVencidos: estatisticas.gamesVencidos + dto.gamesVencidos,
        gamesPerdidos: estatisticas.gamesPerdidos + dto.gamesPerdidos,
        saldoGames:
          estatisticas.saldoGames + (dto.gamesVencidos - dto.gamesPerdidos),

        atualizadoEm: Timestamp.now(),
      };

      await db
        .collection(this.collection)
        .doc(estatisticas.id)
        .update(novasEstatisticas);

      logger.info("Estatísticas atualizadas após partida de grupo", {
        jogadorId,
        etapaId,
        grupoId: estatisticas.grupoId,
        venceu: dto.venceu,
      });
    } catch (error) {
      logger.error(
        "Erro ao atualizar estatísticas após partida de grupo",
        {
          jogadorId,
          etapaId,
        },
        error as Error
      );
      throw error;
    }
  }

  /**
   * Reverter estatísticas após edição de resultado da FASE DE GRUPOS
   */
  async reverterAposPartidaGrupo(
    jogadorId: string,
    etapaId: string,
    dto: AtualizarEstatisticasPartidaDTO
  ): Promise<void> {
    try {
      const estatisticas = await this.buscarPorJogadorEtapa(jogadorId, etapaId);

      if (!estatisticas) {
        logger.warn("Estatísticas não encontradas para reverter (grupo)", {
          jogadorId,
          etapaId,
        });
        return;
      }

      const estatisticasRevertidas = {
        // Estatísticas de GRUPO
        jogosGrupo: Math.max(0, (estatisticas.jogosGrupo || 0) - 1),
        vitoriasGrupo: Math.max(
          0,
          (estatisticas.vitoriasGrupo || 0) - (dto.venceu ? 1 : 0)
        ),
        derrotasGrupo: Math.max(
          0,
          (estatisticas.derrotasGrupo || 0) - (dto.venceu ? 0 : 1)
        ),
        pontosGrupo: Math.max(
          0,
          (estatisticas.pontosGrupo || 0) - (dto.venceu ? 3 : 0)
        ),
        setsVencidosGrupo: Math.max(
          0,
          (estatisticas.setsVencidosGrupo || 0) - dto.setsVencidos
        ),
        setsPerdidosGrupo: Math.max(
          0,
          (estatisticas.setsPerdidosGrupo || 0) - dto.setsPerdidos
        ),
        saldoSetsGrupo:
          (estatisticas.saldoSetsGrupo || 0) -
          (dto.setsVencidos - dto.setsPerdidos),
        gamesVencidosGrupo: Math.max(
          0,
          (estatisticas.gamesVencidosGrupo || 0) - dto.gamesVencidos
        ),
        gamesPerdidosGrupo: Math.max(
          0,
          (estatisticas.gamesPerdidosGrupo || 0) - dto.gamesPerdidos
        ),
        saldoGamesGrupo:
          (estatisticas.saldoGamesGrupo || 0) -
          (dto.gamesVencidos - dto.gamesPerdidos),

        // Estatísticas TOTAIS
        jogos: Math.max(0, estatisticas.jogos - 1),
        vitorias: Math.max(0, estatisticas.vitorias - (dto.venceu ? 1 : 0)),
        derrotas: Math.max(0, estatisticas.derrotas - (dto.venceu ? 0 : 1)),
        setsVencidos: Math.max(0, estatisticas.setsVencidos - dto.setsVencidos),
        setsPerdidos: Math.max(0, estatisticas.setsPerdidos - dto.setsPerdidos),
        saldoSets:
          estatisticas.saldoSets - (dto.setsVencidos - dto.setsPerdidos),
        gamesVencidos: Math.max(
          0,
          estatisticas.gamesVencidos - dto.gamesVencidos
        ),
        gamesPerdidos: Math.max(
          0,
          estatisticas.gamesPerdidos - dto.gamesPerdidos
        ),
        saldoGames:
          estatisticas.saldoGames - (dto.gamesVencidos - dto.gamesPerdidos),

        atualizadoEm: Timestamp.now(),
      };

      await db
        .collection(this.collection)
        .doc(estatisticas.id)
        .update(estatisticasRevertidas);

      logger.info("Estatísticas revertidas após edição de resultado de grupo", {
        jogadorId,
        etapaId,
      });
    } catch (error) {
      logger.error(
        "Erro ao reverter estatísticas de grupo",
        {
          jogadorId,
          etapaId,
        },
        error as Error
      );
      throw error;
    }
  }

  /**
   * Atualizar estatísticas após partida da ELIMINATÓRIA
   */
  async atualizarAposPartidaEliminatoria(
    jogadorId: string,
    etapaId: string,
    dto: AtualizarEstatisticasPartidaDTO
  ): Promise<void> {
    try {
      const estatisticas = await this.buscarPorJogadorEtapa(jogadorId, etapaId);

      if (!estatisticas) {
        logger.warn(
          "Estatísticas não encontradas para atualizar (eliminatória)",
          {
            jogadorId,
            etapaId,
          }
        );
        return;
      }

      const novasEstatisticas = {
        jogos: estatisticas.jogos + 1,
        vitorias: estatisticas.vitorias + (dto.venceu ? 1 : 0),
        derrotas: estatisticas.derrotas + (dto.venceu ? 0 : 1),
        setsVencidos: estatisticas.setsVencidos + dto.setsVencidos,
        setsPerdidos: estatisticas.setsPerdidos + dto.setsPerdidos,
        saldoSets:
          estatisticas.saldoSets + (dto.setsVencidos - dto.setsPerdidos),
        gamesVencidos: estatisticas.gamesVencidos + dto.gamesVencidos,
        gamesPerdidos: estatisticas.gamesPerdidos + dto.gamesPerdidos,
        saldoGames:
          estatisticas.saldoGames + (dto.gamesVencidos - dto.gamesPerdidos),
        atualizadoEm: Timestamp.now(),
      };

      await db
        .collection(this.collection)
        .doc(estatisticas.id)
        .update(novasEstatisticas);

      logger.info("Estatísticas atualizadas após partida eliminatória", {
        jogadorId,
        etapaId,
        venceu: dto.venceu,
      });
    } catch (error) {
      logger.error(
        "Erro ao atualizar estatísticas após partida eliminatória",
        {
          jogadorId,
          etapaId,
        },
        error as Error
      );
      throw error;
    }
  }

  /**
   * Reverter estatísticas após partida da ELIMINATÓRIA
   */
  async reverterAposPartidaEliminatoria(
    jogadorId: string,
    etapaId: string,
    dto: AtualizarEstatisticasPartidaDTO
  ): Promise<void> {
    try {
      const estatisticas = await this.buscarPorJogadorEtapa(jogadorId, etapaId);

      if (!estatisticas) {
        logger.warn(
          "Estatísticas não encontradas para reverter (eliminatória)",
          {
            jogadorId,
            etapaId,
          }
        );
        return;
      }

      const estatisticasRevertidas = {
        jogos: Math.max(0, estatisticas.jogos - 1),
        vitorias: Math.max(0, estatisticas.vitorias - (dto.venceu ? 1 : 0)),
        derrotas: Math.max(0, estatisticas.derrotas - (dto.venceu ? 0 : 1)),
        setsVencidos: Math.max(0, estatisticas.setsVencidos - dto.setsVencidos),
        setsPerdidos: Math.max(0, estatisticas.setsPerdidos - dto.setsPerdidos),
        saldoSets:
          estatisticas.saldoSets - (dto.setsVencidos - dto.setsPerdidos),
        gamesVencidos: Math.max(
          0,
          estatisticas.gamesVencidos - dto.gamesVencidos
        ),
        gamesPerdidos: Math.max(
          0,
          estatisticas.gamesPerdidos - dto.gamesPerdidos
        ),
        saldoGames:
          estatisticas.saldoGames - (dto.gamesVencidos - dto.gamesPerdidos),
        atualizadoEm: Timestamp.now(),
      };

      await db
        .collection(this.collection)
        .doc(estatisticas.id)
        .update(estatisticasRevertidas);

      logger.info("Estatísticas revertidas após edição eliminatória", {
        jogadorId,
        etapaId,
      });
    } catch (error) {
      logger.error(
        "Erro ao reverter estatísticas eliminatória",
        {
          jogadorId,
          etapaId,
        },
        error as Error
      );
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
    const snapshot = await db
      .collection(this.collection)
      .where("etapaId", "==", etapaId)
      .where("arenaId", "==", arenaId)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as EstatisticasJogador[];
  }

  /**
   * Buscar estatísticas de um grupo
   */
  async buscarPorGrupo(grupoId: string): Promise<EstatisticasJogador[]> {
    const snapshot = await db
      .collection(this.collection)
      .where("grupoId", "==", grupoId)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as EstatisticasJogador[];
  }

  /**
   * Buscar jogadores classificados de um grupo
   */
  async buscarClassificados(
    grupoId: string,
    limite: number = 2
  ): Promise<EstatisticasJogador[]> {
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
        logger.warn("Estatísticas não encontradas para atualizar grupo", {
          jogadorId,
          etapaId,
        });
        return;
      }

      await db.collection(this.collection).doc(estatisticas.id).update({
        grupoId,
        grupoNome,
        atualizadoEm: Timestamp.now(),
      });

      logger.info("Grupo atualizado nas estatísticas", {
        jogadorId,
        etapaId,
        grupoId,
        grupoNome,
      });
    } catch (error) {
      logger.error(
        "Erro ao atualizar grupo",
        {
          jogadorId,
          etapaId,
          grupoId,
        },
        error as Error
      );
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
        logger.warn("Estatísticas não encontradas para atualizar posição", {
          jogadorId,
          etapaId,
        });
        return;
      }

      await db.collection(this.collection).doc(estatisticas.id).update({
        posicaoGrupo,
        atualizadoEm: Timestamp.now(),
      });

      logger.info("Posição no grupo atualizada", {
        jogadorId,
        etapaId,
        posicaoGrupo,
      });
    } catch (error) {
      logger.error(
        "Erro ao atualizar posição no grupo",
        {
          jogadorId,
          etapaId,
        },
        error as Error
      );
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
        logger.warn("Estatísticas não encontradas para marcar classificado", {
          jogadorId,
          etapaId,
        });
        return;
      }

      await db.collection(this.collection).doc(estatisticas.id).update({
        classificado,
        atualizadoEm: Timestamp.now(),
      });

      logger.info("Jogador marcado como classificado", {
        jogadorId,
        etapaId,
        classificado,
      });
    } catch (error) {
      logger.error(
        "Erro ao marcar como classificado",
        {
          jogadorId,
          etapaId,
        },
        error as Error
      );
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
  }

  /**
   * Buscar estatísticas AGREGADAS de um jogador (todas as etapas)
   */
  async buscarEstatisticasAgregadas(
    jogadorId: string,
    arenaId: string
  ): Promise<any> {
    const snapshot = await db
      .collection(this.collection)
      .where("jogadorId", "==", jogadorId)
      .where("arenaId", "==", arenaId)
      .get();

    if (snapshot.empty) {
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

    // Buscar posição no ranking
    const rankingCompleto = await this.buscarRankingGlobalAgregado(
      arenaId,
      999
    );
    const posicaoRanking =
      rankingCompleto.findIndex((j) => j.jogadorId === jogadorId) + 1;

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
      posicaoRanking,
    };
  }

  /**
   * Buscar ranking GLOBAL agregado (todas as etapas)
   */
  async buscarRankingGlobalAgregado(
    arenaId: string,
    limite: number = 50
  ): Promise<Array<any>> {
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
      if (a.pontos !== b.pontos) return b.pontos - a.pontos;
      if (a.saldoGames !== b.saldoGames) return b.saldoGames - a.saldoGames;
      if (a.gamesVencidos !== b.gamesVencidos)
        return b.gamesVencidos - a.gamesVencidos;
      if (a.vitorias !== b.vitorias) return b.vitorias - a.vitorias;
      return 0;
    });

    return ranking.slice(0, limite);
  }
}

export default new EstatisticasJogadorService();
