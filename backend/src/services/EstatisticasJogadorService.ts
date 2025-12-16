/**
 * Service para gerenciar estatísticas individuais de jogadores
 */

import { db } from "../config/firebase";
import { Timestamp, FieldValue } from "firebase-admin/firestore";
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
   * Criar estatísticas em lote (batch) - OTIMIZADO para performance
   */
  async criarEmLote(dtos: CriarEstatisticasJogadorDTO[]): Promise<EstatisticasJogador[]> {
    const inicioTotal = Date.now();

    try {
      const batch = db.batch();
      const estatisticasArray: EstatisticasJogador[] = [];
      const agora = Timestamp.now();

      for (const dto of dtos) {
        const docRef = db.collection(this.collection).doc();
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
          criadoEm: agora,
          atualizadoEm: agora,
        };

        batch.set(docRef, estatisticas);
        estatisticasArray.push({
          id: docRef.id,
          ...estatisticas,
        });
      }

      const inicioCommit = Date.now();
      await batch.commit();
      const tempoCommit = Date.now() - inicioCommit;

      const tempoTotal = Date.now() - inicioTotal;

      logger.info("⏱️ TEMPOS criarEmLote (EstatisticasJogador)", {
        quantidade: estatisticasArray.length,
        etapaId: dtos[0]?.etapaId,
        tempos: {
          preparacao: tempoTotal - tempoCommit,
          commit: tempoCommit,
          TOTAL: tempoTotal,
        },
      });

      return estatisticasArray;
    } catch (error) {
      logger.error(
        "Erro ao criar estatísticas em lote",
        { quantidade: dtos.length, tempoTotal: Date.now() - inicioTotal },
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
   * ✅ OTIMIZAÇÃO: Buscar estatísticas de múltiplos jogadores de uma etapa em uma única query
   * Retorna um Map de jogadorId -> EstatisticasJogador para acesso rápido O(1)
   */
  async buscarPorJogadoresEtapa(
    jogadorIds: string[],
    etapaId: string
  ): Promise<Map<string, EstatisticasJogador>> {
    if (jogadorIds.length === 0) return new Map();

    // Firestore permite até 30 itens no 'in' - como temos max 4 jogadores por partida, está ok
    const snapshot = await db
      .collection(this.collection)
      .where("etapaId", "==", etapaId)
      .where("jogadorId", "in", jogadorIds)
      .get();

    const result = new Map<string, EstatisticasJogador>();
    snapshot.docs.forEach((doc) => {
      const data = { id: doc.id, ...doc.data() } as EstatisticasJogador;
      result.set(data.jogadorId, data);
    });

    return result;
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
   * Atualizar grupo de múltiplos jogadores em batch usando estatisticaId
   * ✅ OTIMIZAÇÃO: Usa IDs diretamente, sem busca adicional
   */
  async atualizarGrupoEmLotePorId(
    atualizacoes: Array<{
      estatisticaId: string;
      grupoId: string;
      grupoNome: string;
    }>
  ): Promise<void> {
    if (atualizacoes.length === 0) return;

    try {
      const batch = db.batch();
      const now = Timestamp.now();

      for (const { estatisticaId, grupoId, grupoNome } of atualizacoes) {
        const docRef = db.collection(this.collection).doc(estatisticaId);
        batch.update(docRef, {
          grupoId,
          grupoNome,
          atualizadoEm: now,
        });
      }

      await batch.commit();
    } catch (error) {
      logger.error("Erro ao atualizar grupos em lote", {}, error as Error);
      throw error;
    }
  }

  /**
   * Atualizar grupo de múltiplos jogadores em batch (busca por jogadorId+etapaId)
   * ⚠️ NOTA: Para melhor performance, use atualizarGrupoEmLotePorId quando tiver os IDs
   */
  async atualizarGrupoEmLote(
    atualizacoes: Array<{
      jogadorId: string;
      etapaId: string;
      grupoId: string;
      grupoNome: string;
    }>
  ): Promise<void> {
    if (atualizacoes.length === 0) return;

    try {
      // Buscar todos os IDs em paralelo primeiro
      const buscas = await Promise.all(
        atualizacoes.map(({ jogadorId, etapaId }) =>
          this.buscarPorJogadorEtapa(jogadorId, etapaId)
        )
      );

      const batch = db.batch();
      const now = Timestamp.now();

      for (let i = 0; i < atualizacoes.length; i++) {
        const estatisticas = buscas[i];
        if (estatisticas) {
          const docRef = db.collection(this.collection).doc(estatisticas.id);
          batch.update(docRef, {
            grupoId: atualizacoes[i].grupoId,
            grupoNome: atualizacoes[i].grupoNome,
            atualizadoEm: now,
          });
        }
      }

      await batch.commit();

      logger.info("Grupos atualizados em lote", {
        total: atualizacoes.length,
      });
    } catch (error) {
      logger.error("Erro ao atualizar grupos em lote", {}, error as Error);
      throw error;
    }
  }

  /**
   * ✅ OTIMIZAÇÃO: Atualizar estatísticas de múltiplos jogadores em batch após partida de GRUPO
   * Recebe array de jogadores com suas estatísticas para atualizar
   */
  async atualizarAposPartidaGrupoEmLote(
    atualizacoes: Array<{
      jogadorId: string;
      etapaId: string;
      dto: AtualizarEstatisticasPartidaDTO;
    }>
  ): Promise<void> {
    if (atualizacoes.length === 0) return;

    try {
      // 1. Buscar todas as estatísticas em paralelo
      const estatisticasList = await Promise.all(
        atualizacoes.map(({ jogadorId, etapaId }) =>
          this.buscarPorJogadorEtapa(jogadorId, etapaId)
        )
      );

      // 2. Criar batch de atualizações
      const batch = db.batch();
      const now = Timestamp.now();

      for (let i = 0; i < atualizacoes.length; i++) {
        const estatisticas = estatisticasList[i];
        const { dto } = atualizacoes[i];

        if (!estatisticas) continue;

        const novasEstatisticas = {
          // Estatísticas de GRUPO
          jogosGrupo: (estatisticas.jogosGrupo || 0) + 1,
          vitoriasGrupo: (estatisticas.vitoriasGrupo || 0) + (dto.venceu ? 1 : 0),
          derrotasGrupo: (estatisticas.derrotasGrupo || 0) + (dto.venceu ? 0 : 1),
          pontosGrupo: (estatisticas.pontosGrupo || 0) + (dto.venceu ? 3 : 0),
          setsVencidosGrupo: (estatisticas.setsVencidosGrupo || 0) + dto.setsVencidos,
          setsPerdidosGrupo: (estatisticas.setsPerdidosGrupo || 0) + dto.setsPerdidos,
          saldoSetsGrupo: (estatisticas.saldoSetsGrupo || 0) + (dto.setsVencidos - dto.setsPerdidos),
          gamesVencidosGrupo: (estatisticas.gamesVencidosGrupo || 0) + dto.gamesVencidos,
          gamesPerdidosGrupo: (estatisticas.gamesPerdidosGrupo || 0) + dto.gamesPerdidos,
          saldoGamesGrupo: (estatisticas.saldoGamesGrupo || 0) + (dto.gamesVencidos - dto.gamesPerdidos),
          // Estatísticas TOTAIS
          jogos: estatisticas.jogos + 1,
          vitorias: estatisticas.vitorias + (dto.venceu ? 1 : 0),
          derrotas: estatisticas.derrotas + (dto.venceu ? 0 : 1),
          setsVencidos: estatisticas.setsVencidos + dto.setsVencidos,
          setsPerdidos: estatisticas.setsPerdidos + dto.setsPerdidos,
          saldoSets: estatisticas.saldoSets + (dto.setsVencidos - dto.setsPerdidos),
          gamesVencidos: estatisticas.gamesVencidos + dto.gamesVencidos,
          gamesPerdidos: estatisticas.gamesPerdidos + dto.gamesPerdidos,
          saldoGames: estatisticas.saldoGames + (dto.gamesVencidos - dto.gamesPerdidos),
          atualizadoEm: now,
        };

        const docRef = db.collection(this.collection).doc(estatisticas.id);
        batch.update(docRef, novasEstatisticas);
      }

      // 3. Commit único
      await batch.commit();

      logger.info("Estatísticas de grupo atualizadas em lote", {
        quantidade: atualizacoes.length,
        etapaId: atualizacoes[0]?.etapaId,
      });
    } catch (error) {
      logger.error(
        "Erro ao atualizar estatísticas em lote",
        { quantidade: atualizacoes.length },
        error as Error
      );
      throw error;
    }
  }

  /**
   * ✅ OTIMIZAÇÃO: Reverter estatísticas de múltiplos jogadores em batch
   */
  async reverterAposPartidaEmLote(
    reversoes: Array<{
      jogadorId: string;
      etapaId: string;
      dto: AtualizarEstatisticasPartidaDTO;
    }>
  ): Promise<void> {
    if (reversoes.length === 0) return;

    try {
      // 1. Buscar todas as estatísticas em paralelo
      const estatisticasList = await Promise.all(
        reversoes.map(({ jogadorId, etapaId }) =>
          this.buscarPorJogadorEtapa(jogadorId, etapaId)
        )
      );

      // 2. Criar batch de atualizações
      const batch = db.batch();
      const now = Timestamp.now();

      for (let i = 0; i < reversoes.length; i++) {
        const estatisticas = estatisticasList[i];
        const { dto } = reversoes[i];

        if (!estatisticas) continue;

        const estatisticasRevertidas = {
          // Estatísticas de GRUPO
          jogosGrupo: Math.max(0, (estatisticas.jogosGrupo || 0) - 1),
          vitoriasGrupo: Math.max(0, (estatisticas.vitoriasGrupo || 0) - (dto.venceu ? 1 : 0)),
          derrotasGrupo: Math.max(0, (estatisticas.derrotasGrupo || 0) - (dto.venceu ? 0 : 1)),
          pontosGrupo: Math.max(0, (estatisticas.pontosGrupo || 0) - (dto.venceu ? 3 : 0)),
          setsVencidosGrupo: Math.max(0, (estatisticas.setsVencidosGrupo || 0) - dto.setsVencidos),
          setsPerdidosGrupo: Math.max(0, (estatisticas.setsPerdidosGrupo || 0) - dto.setsPerdidos),
          saldoSetsGrupo: (estatisticas.saldoSetsGrupo || 0) - (dto.setsVencidos - dto.setsPerdidos),
          gamesVencidosGrupo: Math.max(0, (estatisticas.gamesVencidosGrupo || 0) - dto.gamesVencidos),
          gamesPerdidosGrupo: Math.max(0, (estatisticas.gamesPerdidosGrupo || 0) - dto.gamesPerdidos),
          saldoGamesGrupo: (estatisticas.saldoGamesGrupo || 0) - (dto.gamesVencidos - dto.gamesPerdidos),
          // Estatísticas TOTAIS
          jogos: Math.max(0, estatisticas.jogos - 1),
          vitorias: Math.max(0, estatisticas.vitorias - (dto.venceu ? 1 : 0)),
          derrotas: Math.max(0, estatisticas.derrotas - (dto.venceu ? 0 : 1)),
          setsVencidos: Math.max(0, estatisticas.setsVencidos - dto.setsVencidos),
          setsPerdidos: Math.max(0, estatisticas.setsPerdidos - dto.setsPerdidos),
          saldoSets: estatisticas.saldoSets - (dto.setsVencidos - dto.setsPerdidos),
          gamesVencidos: Math.max(0, estatisticas.gamesVencidos - dto.gamesVencidos),
          gamesPerdidos: Math.max(0, estatisticas.gamesPerdidos - dto.gamesPerdidos),
          saldoGames: estatisticas.saldoGames - (dto.gamesVencidos - dto.gamesPerdidos),
          atualizadoEm: now,
        };

        const docRef = db.collection(this.collection).doc(estatisticas.id);
        batch.update(docRef, estatisticasRevertidas);
      }

      // 3. Commit único
      await batch.commit();

      logger.info("Estatísticas revertidas em lote", {
        quantidade: reversoes.length,
        etapaId: reversoes[0]?.etapaId,
      });
    } catch (error) {
      logger.error(
        "Erro ao reverter estatísticas em lote",
        { quantidade: reversoes.length },
        error as Error
      );
      throw error;
    }
  }

  /**
   * ✅ OTIMIZAÇÃO: Atualizar posições de múltiplos jogadores em batch
   * Recebe array de jogadores já ordenados com suas posições
   */
  async atualizarPosicoesGrupoEmLote(
    atualizacoes: Array<{
      estatisticaId: string;
      posicaoGrupo: number;
    }>
  ): Promise<void> {
    if (atualizacoes.length === 0) return;

    try {
      const batch = db.batch();
      const now = Timestamp.now();

      for (const { estatisticaId, posicaoGrupo } of atualizacoes) {
        const docRef = db.collection(this.collection).doc(estatisticaId);
        batch.update(docRef, {
          posicaoGrupo,
          atualizadoEm: now,
        });
      }

      await batch.commit();

      logger.info("Posições de grupo atualizadas em lote", {
        quantidade: atualizacoes.length,
      });
    } catch (error) {
      logger.error(
        "Erro ao atualizar posições em lote",
        { quantidade: atualizacoes.length },
        error as Error
      );
      throw error;
    }
  }

  /**
   * ✅ SUPER OTIMIZAÇÃO para TEAMS: Atualizar estatísticas usando FieldValue.increment
   * Não precisa ler os documentos antes - usa increment atômico
   * Recebe estatisticaId diretamente para evitar queries
   */
  async atualizarAposPartidaComIncrement(
    atualizacoes: Array<{
      estatisticaId: string;
      dto: AtualizarEstatisticasPartidaDTO;
    }>
  ): Promise<void> {
    if (atualizacoes.length === 0) return;

    try {
      const batch = db.batch();
      const now = Timestamp.now();

      for (const { estatisticaId, dto } of atualizacoes) {
        const docRef = db.collection(this.collection).doc(estatisticaId);

        // Usar increment para atualizar sem precisar ler primeiro
        batch.update(docRef, {
          // Apenas estatísticas TOTAIS (para TEAMS - não tem fase de grupos)
          jogos: FieldValue.increment(1),
          vitorias: FieldValue.increment(dto.venceu ? 1 : 0),
          derrotas: FieldValue.increment(dto.venceu ? 0 : 1),
          setsVencidos: FieldValue.increment(dto.setsVencidos),
          setsPerdidos: FieldValue.increment(dto.setsPerdidos),
          saldoSets: FieldValue.increment(dto.setsVencidos - dto.setsPerdidos),
          gamesVencidos: FieldValue.increment(dto.gamesVencidos),
          gamesPerdidos: FieldValue.increment(dto.gamesPerdidos),
          saldoGames: FieldValue.increment(dto.gamesVencidos - dto.gamesPerdidos),
          atualizadoEm: now,
        });
      }

      await batch.commit();

      logger.info("Estatísticas TEAMS atualizadas com increment (sem leitura)", {
        quantidade: atualizacoes.length,
      });
    } catch (error) {
      logger.error(
        "Erro ao atualizar estatísticas TEAMS com increment",
        { quantidade: atualizacoes.length },
        error as Error
      );
      throw error;
    }
  }

  /**
   * ✅ SUPER OTIMIZAÇÃO: Atualizar estatísticas usando FieldValue.increment
   * Não precisa ler os documentos antes - usa increment atômico
   * Recebe estatisticaId diretamente para evitar queries
   */
  async atualizarAposPartidaGrupoComIncrement(
    atualizacoes: Array<{
      estatisticaId: string;
      dto: AtualizarEstatisticasPartidaDTO;
    }>
  ): Promise<void> {
    if (atualizacoes.length === 0) return;

    try {
      const batch = db.batch();
      const now = Timestamp.now();

      for (const { estatisticaId, dto } of atualizacoes) {
        const docRef = db.collection(this.collection).doc(estatisticaId);

        // Usar increment para atualizar sem precisar ler primeiro
        batch.update(docRef, {
          // Estatísticas de GRUPO
          jogosGrupo: FieldValue.increment(1),
          vitoriasGrupo: FieldValue.increment(dto.venceu ? 1 : 0),
          derrotasGrupo: FieldValue.increment(dto.venceu ? 0 : 1),
          pontosGrupo: FieldValue.increment(dto.venceu ? 3 : 0),
          setsVencidosGrupo: FieldValue.increment(dto.setsVencidos),
          setsPerdidosGrupo: FieldValue.increment(dto.setsPerdidos),
          saldoSetsGrupo: FieldValue.increment(dto.setsVencidos - dto.setsPerdidos),
          gamesVencidosGrupo: FieldValue.increment(dto.gamesVencidos),
          gamesPerdidosGrupo: FieldValue.increment(dto.gamesPerdidos),
          saldoGamesGrupo: FieldValue.increment(dto.gamesVencidos - dto.gamesPerdidos),
          // Estatísticas TOTAIS
          jogos: FieldValue.increment(1),
          vitorias: FieldValue.increment(dto.venceu ? 1 : 0),
          derrotas: FieldValue.increment(dto.venceu ? 0 : 1),
          setsVencidos: FieldValue.increment(dto.setsVencidos),
          setsPerdidos: FieldValue.increment(dto.setsPerdidos),
          saldoSets: FieldValue.increment(dto.setsVencidos - dto.setsPerdidos),
          gamesVencidos: FieldValue.increment(dto.gamesVencidos),
          gamesPerdidos: FieldValue.increment(dto.gamesPerdidos),
          saldoGames: FieldValue.increment(dto.gamesVencidos - dto.gamesPerdidos),
          atualizadoEm: now,
        });
      }

      await batch.commit();
    } catch (error) {
      logger.error(
        "Erro ao atualizar estatísticas com increment",
        { quantidade: atualizacoes.length },
        error as Error
      );
      throw error;
    }
  }

  /**
   * ✅ SUPER OTIMIZAÇÃO: Reverter estatísticas usando FieldValue.increment negativo
   */
  async reverterAposPartidaComIncrement(
    reversoes: Array<{
      estatisticaId: string;
      dto: AtualizarEstatisticasPartidaDTO;
    }>
  ): Promise<void> {
    if (reversoes.length === 0) return;

    try {
      const batch = db.batch();
      const now = Timestamp.now();

      for (const { estatisticaId, dto } of reversoes) {
        const docRef = db.collection(this.collection).doc(estatisticaId);

        // Usar increment negativo para reverter
        batch.update(docRef, {
          // Estatísticas de GRUPO
          jogosGrupo: FieldValue.increment(-1),
          vitoriasGrupo: FieldValue.increment(dto.venceu ? -1 : 0),
          derrotasGrupo: FieldValue.increment(dto.venceu ? 0 : -1),
          pontosGrupo: FieldValue.increment(dto.venceu ? -3 : 0),
          setsVencidosGrupo: FieldValue.increment(-dto.setsVencidos),
          setsPerdidosGrupo: FieldValue.increment(-dto.setsPerdidos),
          saldoSetsGrupo: FieldValue.increment(-(dto.setsVencidos - dto.setsPerdidos)),
          gamesVencidosGrupo: FieldValue.increment(-dto.gamesVencidos),
          gamesPerdidosGrupo: FieldValue.increment(-dto.gamesPerdidos),
          saldoGamesGrupo: FieldValue.increment(-(dto.gamesVencidos - dto.gamesPerdidos)),
          // Estatísticas TOTAIS
          jogos: FieldValue.increment(-1),
          vitorias: FieldValue.increment(dto.venceu ? -1 : 0),
          derrotas: FieldValue.increment(dto.venceu ? 0 : -1),
          setsVencidos: FieldValue.increment(-dto.setsVencidos),
          setsPerdidos: FieldValue.increment(-dto.setsPerdidos),
          saldoSets: FieldValue.increment(-(dto.setsVencidos - dto.setsPerdidos)),
          gamesVencidos: FieldValue.increment(-dto.gamesVencidos),
          gamesPerdidos: FieldValue.increment(-dto.gamesPerdidos),
          saldoGames: FieldValue.increment(-(dto.gamesVencidos - dto.gamesPerdidos)),
          atualizadoEm: now,
        });
      }

      await batch.commit();
    } catch (error) {
      logger.error(
        "Erro ao reverter estatísticas com increment",
        { quantidade: reversoes.length },
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
   * Buscar IDs das etapas que contam pontos no ranking
   */
  private async buscarEtapasQueContamPontos(arenaId: string): Promise<Set<string>> {
    const etapasSnapshot = await db
      .collection("etapas")
      .where("arenaId", "==", arenaId)
      .where("contaPontosRanking", "==", true)
      .get();

    const etapaIds = new Set<string>();
    etapasSnapshot.docs.forEach((doc) => {
      etapaIds.add(doc.id);
    });

    // Para retrocompatibilidade: etapas sem o campo contaPontosRanking
    // são consideradas como contando pontos (comportamento antigo)
    const etapasSemCampoSnapshot = await db
      .collection("etapas")
      .where("arenaId", "==", arenaId)
      .get();

    etapasSemCampoSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      // Se não tem o campo, considera como true (retrocompatibilidade)
      if (data.contaPontosRanking === undefined) {
        etapaIds.add(doc.id);
      }
    });

    return etapaIds;
  }

  /**
   * Buscar estatísticas AGREGADAS de um jogador POR NÍVEL
   * Separa pontos por categoria (iniciante, intermediário, avançado)
   * IMPORTANTE: Só considera etapas com contaPontosRanking = true
   */
  async buscarEstatisticasAgregadasPorNivel(
    jogadorId: string,
    arenaId: string,
    nivel: string
  ): Promise<any> {
    // Buscar etapas que contam pontos
    const etapasQueContam = await this.buscarEtapasQueContamPontos(arenaId);

    const snapshot = await db
      .collection(this.collection)
      .where("jogadorId", "==", jogadorId)
      .where("arenaId", "==", arenaId)
      .where("jogadorNivel", "==", nivel)
      .get();

    if (snapshot.empty) {
      return null;
    }

    // Agregar estatísticas apenas do nível especificado E de etapas que contam pontos
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
      setsVencidos += stat.setsVencidos || 0;
      setsPerdidos += stat.setsPerdidos || 0;
      gamesVencidos += stat.gamesVencidos || 0;
      gamesPerdidos += stat.gamesPerdidos || 0;

      // Pontos só são contados se a etapa conta para o ranking
      if (etapasQueContam.has(stat.etapaId)) {
        pontos += stat.pontos || 0;
      }
    });

    const saldoSets = setsVencidos - setsPerdidos;
    const saldoGames = gamesVencidos - gamesPerdidos;

    // Buscar posição no ranking DO NÍVEL
    const rankingCompleto = await this.buscarRankingPorNivel(
      arenaId,
      nivel,
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
      nivel,
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
   * Buscar estatísticas AGREGADAS de um jogador (todas as etapas - TODOS OS NÍVEIS)
   * @deprecated Use buscarEstatisticasAgregadasPorNivel para estatísticas separadas por categoria
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
   * Buscar ranking POR NÍVEL (separado por categoria)
   *
   * IMPORTANTE: Quando jogador muda de nível (ex: iniciante → intermediário),
   * os pontos ficam separados por categoria. Isso garante que:
   * - Ranking de iniciantes só considera pontos ganhos como iniciante
   * - Ranking de intermediários só considera pontos ganhos como intermediário
   * - Jogador começa do zero ao mudar de categoria
   *
   * IMPORTANTE: Só considera etapas com contaPontosRanking = true
   *
   * @param arenaId - ID da arena
   * @param nivel - Nível do jogador ('iniciante' | 'intermediario' | 'avancado')
   * @param limite - Quantidade máxima de resultados
   */
  async buscarRankingPorNivel(
    arenaId: string,
    nivel: string,
    limite: number = 50
  ): Promise<Array<any>> {
    // Buscar etapas que contam pontos
    const etapasQueContam = await this.buscarEtapasQueContamPontos(arenaId);

    const snapshot = await db
      .collection(this.collection)
      .where("arenaId", "==", arenaId)
      .where("jogadorNivel", "==", nivel)
      .get();

    // Agregar por jogador (vitórias/derrotas de todas etapas, pontos apenas de etapas que contam)
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
      jogador.setsVencidos += stats.setsVencidos || 0;
      jogador.setsPerdidos += stats.setsPerdidos || 0;
      jogador.gamesVencidos += stats.gamesVencidos || 0;
      jogador.gamesPerdidos += stats.gamesPerdidos || 0;
      jogador.saldoSets += stats.saldoSets || 0;
      jogador.saldoGames += stats.saldoGames || 0;

      // Pontos só são contados se a etapa conta para o ranking
      if (etapasQueContam.has(stats.etapaId)) {
        jogador.pontos += stats.pontos || 0;
      }
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

    logger.info("Ranking por nível calculado", {
      arenaId,
      nivel,
      totalJogadores: ranking.length,
    });

    return ranking.slice(0, limite);
  }

  /**
   * Buscar ranking GLOBAL agregado (todas as etapas - TODOS OS NÍVEIS MISTURADOS)
   *
   * @deprecated Use buscarRankingPorNivel para rankings separados por categoria.
   * Este método soma pontos de todos os níveis, o que pode ser injusto quando
   * um jogador muda de categoria.
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
