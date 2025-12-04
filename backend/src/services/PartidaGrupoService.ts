/**
 * PartidaGrupoService.ts
 * Service especializado para partidas da fase de grupos
 *
 * Responsabilidades:
 * - Gerar partidas de todos contra todos
 * - Registrar resultados de partidas
 * - Atualizar estatísticas de duplas e jogadores
 *
 * CORREÇÕES v2:
 * - Bug 1: vencedoraNome estava vazio - agora preenchemos corretamente
 * - Bug 2: Edição somava valores - agora re-buscamos duplas após reverter
 */

import { Dupla } from "../models/Dupla";
import { Grupo } from "../models/Grupo";
import { Partida, StatusPartida } from "../models/Partida";
import { FaseEtapa } from "../models/Etapa";
import { IPartidaRepository } from "../repositories/interfaces/IPartidaRepository";
import { IDuplaRepository } from "../repositories/interfaces/IDuplaRepository";
import { IGrupoRepository } from "../repositories/interfaces/IGrupoRepository";
import { partidaRepository } from "../repositories/firebase/PartidaRepository";
import { duplaRepository } from "../repositories/firebase/DuplaRepository";
import { grupoRepository } from "../repositories/firebase/GrupoRepository";
import estatisticasJogadorService from "./EstatisticasJogadorService";
import classificacaoService from "./ClassificacaoService";
import logger from "../utils/logger";

/**
 * Placar de um set
 */
export interface PlacarSet {
  numero: number;
  gamesDupla1: number;
  gamesDupla2: number;
  vencedorId?: string;
}

/**
 * Interface para injeção de dependência
 */
export interface IPartidaGrupoService {
  gerarPartidas(
    etapaId: string,
    arenaId: string,
    grupos: Grupo[]
  ): Promise<Partida[]>;

  registrarResultado(
    partidaId: string,
    arenaId: string,
    placar: PlacarSet[]
  ): Promise<void>;

  buscarPorEtapa(etapaId: string, arenaId: string): Promise<Partida[]>;
  buscarPorGrupo(grupoId: string): Promise<Partida[]>;
}

/**
 * Service para partidas da fase de grupos
 */
export class PartidaGrupoService implements IPartidaGrupoService {
  constructor(
    private partidaRepo: IPartidaRepository = partidaRepository,
    private duplaRepo: IDuplaRepository = duplaRepository,
    private grupoRepo: IGrupoRepository = grupoRepository
  ) {}

  /**
   * Gerar partidas de todos contra todos para cada grupo
   */
  async gerarPartidas(
    etapaId: string,
    arenaId: string,
    grupos: Grupo[]
  ): Promise<Partida[]> {
    try {
      const todasPartidas: Partida[] = [];

      for (const grupo of grupos) {
        // Buscar duplas do grupo
        const duplas = await this.duplaRepo.buscarPorGrupo(grupo.id);

        // Gerar combinações (todos contra todos)
        const partidas: Partida[] = [];
        for (let i = 0; i < duplas.length; i++) {
          for (let j = i + 1; j < duplas.length; j++) {
            const dupla1 = duplas[i];
            const dupla2 = duplas[j];

            const partida = await this.partidaRepo.criar({
              etapaId,
              arenaId,
              fase: FaseEtapa.GRUPOS,
              tipo: "grupos",
              grupoId: grupo.id,
              grupoNome: grupo.nome,
              dupla1Id: dupla1.id,
              dupla1Nome: `${dupla1.jogador1Nome} & ${dupla1.jogador2Nome}`,
              dupla2Id: dupla2.id,
              dupla2Nome: `${dupla2.jogador1Nome} & ${dupla2.jogador2Nome}`,
            });

            partidas.push(partida);
            todasPartidas.push(partida);
          }
        }

        // Atualizar grupo com IDs das partidas
        await this.grupoRepo.atualizarContadores(grupo.id, {
          totalPartidas: partidas.length,
        });

        // Adicionar partidas ao grupo
        for (const partida of partidas) {
          await this.grupoRepo.adicionarPartida(grupo.id, partida.id);
        }
      }

      logger.info("Partidas de grupos geradas", {
        etapaId,
        arenaId,
        totalGrupos: grupos.length,
        totalPartidas: todasPartidas.length,
      });

      return todasPartidas;
    } catch (error) {
      logger.error(
        "Erro ao gerar partidas",
        { etapaId, arenaId },
        error as Error
      );
      throw new Error("Falha ao gerar partidas");
    }
  }

  /**
   * Registrar resultado de partida
   *
   * CORREÇÃO: Re-busca duplas após reverter estatísticas para evitar
   * somar valores antigos com novos
   */
  async registrarResultado(
    partidaId: string,
    arenaId: string,
    placar: PlacarSet[]
  ): Promise<void> {
    try {
      // Buscar partida
      const partida = await this.partidaRepo.buscarPorIdEArena(
        partidaId,
        arenaId
      );
      if (!partida) {
        throw new Error("Partida não encontrada");
      }

      // Buscar duplas inicialmente (para nomes e IDs dos jogadores)
      let dupla1 = await this.duplaRepo.buscarPorId(partida.dupla1Id);
      let dupla2 = await this.duplaRepo.buscarPorId(partida.dupla2Id);

      if (!dupla1 || !dupla2) {
        throw new Error("Duplas não encontradas");
      }

      const isEdicao = partida.status === StatusPartida.FINALIZADA;

      // Se for edição, reverter estatísticas anteriores
      if (isEdicao && partida.placar && partida.placar.length > 0) {
        await this.reverterEstatisticas(partida, dupla1, dupla2);

        dupla1 = await this.duplaRepo.buscarPorId(partida.dupla1Id);
        dupla2 = await this.duplaRepo.buscarPorId(partida.dupla2Id);

        if (!dupla1 || !dupla2) {
          throw new Error("Duplas não encontradas após reversão");
        }

        logger.info("Estatísticas revertidas e duplas re-buscadas", {
          partidaId,
          dupla1Jogos: dupla1.jogos,
          dupla2Jogos: dupla2.jogos,
        });
      }

      // Calcular estatísticas do novo placar
      const stats = this.calcularEstatisticasPlacar(
        placar,
        partida.dupla1Id,
        partida.dupla2Id
      );

      const vencedoraNome = stats.dupla1Venceu
        ? `${dupla1.jogador1Nome} & ${dupla1.jogador2Nome}`
        : `${dupla2.jogador1Nome} & ${dupla2.jogador2Nome}`;

      // Atualizar partida com resultado
      await this.partidaRepo.registrarResultado(partidaId, {
        status: StatusPartida.FINALIZADA,
        setsDupla1: stats.setsDupla1,
        setsDupla2: stats.setsDupla2,
        placar: stats.placarComVencedor,
        vencedoraId: stats.vencedoraId,
        vencedoraNome: vencedoraNome,
      });

      // Atualizar estatísticas das duplas
      await this.atualizarEstatisticasDupla(dupla1, stats, true);
      await this.atualizarEstatisticasDupla(dupla2, stats, false);

      // Atualizar estatísticas dos jogadores
      await this.atualizarEstatisticasJogadores(
        dupla1,
        dupla2,
        stats,
        partida.etapaId
      );

      // Recalcular classificação do grupo
      if (partida.grupoId) {
        await classificacaoService.recalcularClassificacaoGrupo(
          partida.grupoId
        );
      }

      logger.info("Resultado partida registrado", {
        partidaId,
        etapaId: partida.etapaId,
        grupoNome: partida.grupoNome,
        vencedoraNome: vencedoraNome,
        placar: `${stats.setsDupla1}-${stats.setsDupla2}`,
        isEdicao,
      });
    } catch (error: any) {
      logger.error(
        "Erro ao registrar resultado",
        { partidaId, arenaId },
        error
      );
      throw error;
    }
  }

  /**
   * Calcular estatísticas do placar
   */
  private calcularEstatisticasPlacar(
    placar: PlacarSet[],
    dupla1Id: string,
    dupla2Id: string
  ): {
    setsDupla1: number;
    setsDupla2: number;
    gamesVencidosDupla1: number;
    gamesPerdidosDupla1: number;
    gamesVencidosDupla2: number;
    gamesPerdidosDupla2: number;
    dupla1Venceu: boolean;
    vencedoraId: string;
    placarComVencedor: PlacarSet[];
  } {
    let setsDupla1 = 0;
    let setsDupla2 = 0;
    let gamesVencidosDupla1 = 0;
    let gamesPerdidosDupla1 = 0;
    let gamesVencidosDupla2 = 0;
    let gamesPerdidosDupla2 = 0;

    const placarComVencedor = placar.map((set) => {
      if (set.gamesDupla1 > set.gamesDupla2) {
        setsDupla1++;
      } else {
        setsDupla2++;
      }

      gamesVencidosDupla1 += set.gamesDupla1;
      gamesPerdidosDupla1 += set.gamesDupla2;
      gamesVencidosDupla2 += set.gamesDupla2;
      gamesPerdidosDupla2 += set.gamesDupla1;

      return {
        ...set,
        vencedorId: set.gamesDupla1 > set.gamesDupla2 ? dupla1Id : dupla2Id,
      };
    });

    const dupla1Venceu = setsDupla1 > setsDupla2;
    const vencedoraId = dupla1Venceu ? dupla1Id : dupla2Id;

    return {
      setsDupla1,
      setsDupla2,
      gamesVencidosDupla1,
      gamesPerdidosDupla1,
      gamesVencidosDupla2,
      gamesPerdidosDupla2,
      dupla1Venceu,
      vencedoraId,
      placarComVencedor,
    };
  }

  /**
   * Atualizar estatísticas da dupla
   */
  private async atualizarEstatisticasDupla(
    dupla: Dupla,
    stats: ReturnType<typeof this.calcularEstatisticasPlacar>,
    isDupla1: boolean
  ): Promise<void> {
    const venceu = isDupla1 ? stats.dupla1Venceu : !stats.dupla1Venceu;
    const setsVencidos = isDupla1 ? stats.setsDupla1 : stats.setsDupla2;
    const setsPerdidos = isDupla1 ? stats.setsDupla2 : stats.setsDupla1;
    const gamesVencidos = isDupla1
      ? stats.gamesVencidosDupla1
      : stats.gamesVencidosDupla2;
    const gamesPerdidos = isDupla1
      ? stats.gamesPerdidosDupla1
      : stats.gamesPerdidosDupla2;

    await this.duplaRepo.atualizarEstatisticas(dupla.id, {
      jogos: dupla.jogos + 1,
      vitorias: dupla.vitorias + (venceu ? 1 : 0),
      derrotas: dupla.derrotas + (venceu ? 0 : 1),
      pontos: dupla.pontos + (venceu ? 3 : 0),
      setsVencidos: dupla.setsVencidos + setsVencidos,
      setsPerdidos: dupla.setsPerdidos + setsPerdidos,
      gamesVencidos: dupla.gamesVencidos + gamesVencidos,
      gamesPerdidos: dupla.gamesPerdidos + gamesPerdidos,
      saldoSets: dupla.saldoSets + (setsVencidos - setsPerdidos),
      saldoGames: dupla.saldoGames + (gamesVencidos - gamesPerdidos),
    });
  }

  /**
   * Atualizar estatísticas dos jogadores
   */
  private async atualizarEstatisticasJogadores(
    dupla1: Dupla,
    dupla2: Dupla,
    stats: ReturnType<typeof this.calcularEstatisticasPlacar>,
    etapaId: string
  ): Promise<void> {
    // Jogadores da dupla 1
    await estatisticasJogadorService.atualizarAposPartida(
      dupla1.jogador1Id,
      etapaId,
      {
        venceu: stats.dupla1Venceu,
        setsVencidos: stats.setsDupla1,
        setsPerdidos: stats.setsDupla2,
        gamesVencidos: stats.gamesVencidosDupla1,
        gamesPerdidos: stats.gamesPerdidosDupla1,
      }
    );

    await estatisticasJogadorService.atualizarAposPartida(
      dupla1.jogador2Id,
      etapaId,
      {
        venceu: stats.dupla1Venceu,
        setsVencidos: stats.setsDupla1,
        setsPerdidos: stats.setsDupla2,
        gamesVencidos: stats.gamesVencidosDupla1,
        gamesPerdidos: stats.gamesPerdidosDupla1,
      }
    );

    // Jogadores da dupla 2
    await estatisticasJogadorService.atualizarAposPartida(
      dupla2.jogador1Id,
      etapaId,
      {
        venceu: !stats.dupla1Venceu,
        setsVencidos: stats.setsDupla2,
        setsPerdidos: stats.setsDupla1,
        gamesVencidos: stats.gamesVencidosDupla2,
        gamesPerdidos: stats.gamesPerdidosDupla2,
      }
    );

    await estatisticasJogadorService.atualizarAposPartida(
      dupla2.jogador2Id,
      etapaId,
      {
        venceu: !stats.dupla1Venceu,
        setsVencidos: stats.setsDupla2,
        setsPerdidos: stats.setsDupla1,
        gamesVencidos: stats.gamesVencidosDupla2,
        gamesPerdidos: stats.gamesPerdidosDupla2,
      }
    );
  }

  /**
   * Reverter estatísticas (para edição de resultado)
   */
  private async reverterEstatisticas(
    partida: Partida,
    dupla1: Dupla,
    dupla2: Dupla
  ): Promise<void> {
    if (!partida.placar || partida.placar.length === 0) return;

    // Calcular estatísticas antigas
    let setsAntigo1 = 0;
    let setsAntigo2 = 0;
    let gamesAntigo1 = 0;
    let gamesPerdidosAntigo1 = 0;
    let gamesAntigo2 = 0;
    let gamesPerdidosAntigo2 = 0;

    partida.placar.forEach((set: any) => {
      if (set.gamesDupla1 > set.gamesDupla2) setsAntigo1++;
      else setsAntigo2++;
      gamesAntigo1 += set.gamesDupla1;
      gamesPerdidosAntigo1 += set.gamesDupla2;
      gamesAntigo2 += set.gamesDupla2;
      gamesPerdidosAntigo2 += set.gamesDupla1;
    });

    const dupla1VenceuAntigo = setsAntigo1 > setsAntigo2;

    // Reverter estatísticas dos jogadores
    await estatisticasJogadorService.reverterAposPartida(
      dupla1.jogador1Id,
      partida.etapaId,
      {
        venceu: dupla1VenceuAntigo,
        setsVencidos: setsAntigo1,
        setsPerdidos: setsAntigo2,
        gamesVencidos: gamesAntigo1,
        gamesPerdidos: gamesPerdidosAntigo1,
      }
    );

    await estatisticasJogadorService.reverterAposPartida(
      dupla1.jogador2Id,
      partida.etapaId,
      {
        venceu: dupla1VenceuAntigo,
        setsVencidos: setsAntigo1,
        setsPerdidos: setsAntigo2,
        gamesVencidos: gamesAntigo1,
        gamesPerdidos: gamesPerdidosAntigo1,
      }
    );

    await estatisticasJogadorService.reverterAposPartida(
      dupla2.jogador1Id,
      partida.etapaId,
      {
        venceu: !dupla1VenceuAntigo,
        setsVencidos: setsAntigo2,
        setsPerdidos: setsAntigo1,
        gamesVencidos: gamesAntigo2,
        gamesPerdidos: gamesPerdidosAntigo2,
      }
    );

    await estatisticasJogadorService.reverterAposPartida(
      dupla2.jogador2Id,
      partida.etapaId,
      {
        venceu: !dupla1VenceuAntigo,
        setsVencidos: setsAntigo2,
        setsPerdidos: setsAntigo1,
        gamesVencidos: gamesAntigo2,
        gamesPerdidos: gamesPerdidosAntigo2,
      }
    );

    // Reverter estatísticas das duplas
    await this.reverterEstatisticasDupla(
      dupla1.id,
      dupla1VenceuAntigo,
      setsAntigo1,
      setsAntigo2,
      gamesAntigo1,
      gamesPerdidosAntigo1
    );

    await this.reverterEstatisticasDupla(
      dupla2.id,
      !dupla1VenceuAntigo,
      setsAntigo2,
      setsAntigo1,
      gamesAntigo2,
      gamesPerdidosAntigo2
    );
  }

  /**
   * Reverter estatísticas de uma dupla
   * Adicionado Math.max(0, ...) para evitar valores negativos
   */
  private async reverterEstatisticasDupla(
    duplaId: string,
    venceu: boolean,
    setsVencidos: number,
    setsPerdidos: number,
    gamesVencidos: number,
    gamesPerdidos: number
  ): Promise<void> {
    const dupla = await this.duplaRepo.buscarPorId(duplaId);
    if (!dupla) return;

    await this.duplaRepo.atualizarEstatisticas(duplaId, {
      jogos: Math.max(0, dupla.jogos - 1),
      vitorias: Math.max(0, dupla.vitorias - (venceu ? 1 : 0)),
      derrotas: Math.max(0, dupla.derrotas - (venceu ? 0 : 1)),
      pontos: Math.max(0, dupla.pontos - (venceu ? 3 : 0)),
      setsVencidos: Math.max(0, dupla.setsVencidos - setsVencidos),
      setsPerdidos: Math.max(0, dupla.setsPerdidos - setsPerdidos),
      gamesVencidos: Math.max(0, dupla.gamesVencidos - gamesVencidos),
      gamesPerdidos: Math.max(0, dupla.gamesPerdidos - gamesPerdidos),
      saldoSets: dupla.saldoSets - (setsVencidos - setsPerdidos),
      saldoGames: dupla.saldoGames - (gamesVencidos - gamesPerdidos),
    });
  }

  /**
   * Buscar partidas de uma etapa
   */
  async buscarPorEtapa(etapaId: string, arenaId: string): Promise<Partida[]> {
    return this.partidaRepo.buscarPorEtapa(etapaId, arenaId);
  }

  /**
   * Buscar partidas de um grupo
   */
  async buscarPorGrupo(grupoId: string): Promise<Partida[]> {
    return this.partidaRepo.buscarPorGrupoOrdenado(grupoId);
  }

  /**
   * Deletar partidas da fase de grupos
   */
  async deletarPorEtapa(etapaId: string, arenaId: string): Promise<number> {
    const partidas = await this.partidaRepo.buscarPorTipo(
      etapaId,
      arenaId,
      "grupos"
    );
    if (partidas.length === 0) return 0;

    await this.partidaRepo.deletarEmLote(partidas.map((p) => p.id));
    return partidas.length;
  }
}

// Exportar instância padrão
export default new PartidaGrupoService();
