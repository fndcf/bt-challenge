/**
 * TeamsResultadoService - Responsabilidade: Registrar resultados e atualizar estatísticas
 *
 * Seguindo SRP (Single Responsibility Principle):
 * - Registro de resultado de partidas
 * - Processamento de resultados em lote
 * - Atualização de estatísticas de jogadores e equipes
 * - Verificação de finalização de confrontos
 * - Geração automática de decider
 */

import {
  Equipe,
  ConfrontoEquipe,
  PartidaTeams,
  SetPlacarTeams,
  RegistrarResultadoTeamsDTO,
  TipoJogoTeams,
} from "../../models/Teams";
import { Etapa, FaseEtapa } from "../../models/Etapa";
import { StatusPartida } from "../../models/Partida";
import { IPartidaTeamsRepository } from "../../repositories/interfaces/IPartidaTeamsRepository";
import { IConfrontoEquipeRepository } from "../../repositories/interfaces/IConfrontoEquipeRepository";
import { IEquipeRepository } from "../../repositories/interfaces/IEquipeRepository";
import { IEtapaRepository } from "../../repositories/interfaces/IEtapaRepository";
import PartidaTeamsRepository from "../../repositories/firebase/PartidaTeamsRepository";
import ConfrontoEquipeRepository from "../../repositories/firebase/ConfrontoEquipeRepository";
import EquipeRepository from "../../repositories/firebase/EquipeRepository";
import { EtapaRepository } from "../../repositories/firebase/EtapaRepository";
import { EstatisticasJogadorService } from "../EstatisticasJogadorService";
import { NotFoundError } from "../../utils/errors";
import logger from "../../utils/logger";

// Forward declaration - will be injected
interface ITeamsPartidaService {
  gerarDecider(confronto: ConfrontoEquipe, etapa: Etapa): Promise<PartidaTeams>;
}

// Forward declaration - will be injected
interface ITeamsClassificacaoService {
  recalcularClassificacao(etapaId: string, arenaId: string): Promise<Equipe[]>;
  verificarEPreencherFaseEliminatoria(
    etapaId: string,
    arenaId: string
  ): Promise<void>;
  preencherProximoConfronto(
    confronto: ConfrontoEquipe,
    vencedoraId: string,
    vencedoraNome: string
  ): Promise<void>;
}

export interface ITeamsResultadoService {
  registrarResultadoPartida(
    partidaId: string,
    arenaId: string,
    dto: RegistrarResultadoTeamsDTO
  ): Promise<{
    partida: PartidaTeams;
    confronto: ConfrontoEquipe;
    precisaDecider: boolean;
    confrontoFinalizado: boolean;
  }>;

  registrarResultadosEmLote(
    etapaId: string,
    arenaId: string,
    resultados: Array<{ partidaId: string; placar: SetPlacarTeams[] }>
  ): Promise<{
    processados: number;
    erros: Array<{ partidaId: string; erro: string }>;
    confrontosFinalizados: string[];
  }>;
}

export class TeamsResultadoService implements ITeamsResultadoService {
  private partidaService: ITeamsPartidaService | null = null;
  private classificacaoService: ITeamsClassificacaoService | null = null;

  constructor(
    private partidaRepository: IPartidaTeamsRepository = PartidaTeamsRepository,
    private confrontoRepository: IConfrontoEquipeRepository = ConfrontoEquipeRepository,
    private equipeRepository: IEquipeRepository = EquipeRepository,
    private estatisticasService: EstatisticasJogadorService = new EstatisticasJogadorService(),
    private etapaRepository: IEtapaRepository = new EtapaRepository()
  ) {}

  /**
   * Injeta dependências circulares após construção
   */
  setPartidaService(service: ITeamsPartidaService): void {
    this.partidaService = service;
  }

  setClassificacaoService(service: ITeamsClassificacaoService): void {
    this.classificacaoService = service;
  }

  /**
   * Registra resultado de uma partida
   */
  async registrarResultadoPartida(
    partidaId: string,
    _arenaId: string,
    dto: RegistrarResultadoTeamsDTO
  ): Promise<{
    partida: PartidaTeams;
    confronto: ConfrontoEquipe;
    precisaDecider: boolean;
    confrontoFinalizado: boolean;
  }> {
    const tempos: Record<string, number> = {};
    const inicioTotal = Date.now();
    let inicio = Date.now();

    // Buscar partida
    const partida = await this.partidaRepository.buscarPorId(partidaId);
    tempos["1_buscarPartida"] = Date.now() - inicio;
    if (!partida) {
      throw new NotFoundError("Partida não encontrada");
    }

    // Buscar confronto e partidas em paralelo
    inicio = Date.now();
    const [confronto, partidasConfronto] = await Promise.all([
      this.confrontoRepository.buscarPorId(partida.confrontoId),
      this.partidaRepository.buscarPorConfrontoOrdenadas(partida.confrontoId),
    ]);
    tempos["2_buscarConfrontoEPartidas"] = Date.now() - inicio;
    if (!confronto) {
      throw new NotFoundError("Confronto não encontrado");
    }

    // Calcular resultado
    const { setsDupla1, setsDupla2, vencedoraEquipeId, vencedoraEquipeNome } =
      this.calcularResultadoPartida(dto.placar, partida, confronto);

    // Se já tinha resultado, reverter estatísticas
    if (partida.status === StatusPartida.FINALIZADA) {
      inicio = Date.now();
      await this.reverterEstatisticasPartida(partida);
      tempos["3_reverterEstatisticas"] = Date.now() - inicio;
    }

    // Registrar resultado
    inicio = Date.now();
    await this.partidaRepository.registrarResultado(
      partidaId,
      dto.placar,
      setsDupla1,
      setsDupla2,
      vencedoraEquipeId,
      vencedoraEquipeNome
    );
    tempos["4_registrarResultado"] = Date.now() - inicio;

    // Atualizar estatísticas dos jogadores
    inicio = Date.now();
    await this.atualizarEstatisticasJogadores(
      partida,
      dto.placar,
      vencedoraEquipeId,
      confronto
    );
    tempos["5_atualizarEstatisticas"] = Date.now() - inicio;

    // Atualizar lista com resultado recém-registrado
    const partidasAtualizadas = partidasConfronto.map((p) =>
      p.id === partidaId
        ? {
            ...p,
            placar: dto.placar,
            setsDupla1,
            setsDupla2,
            vencedoraEquipeId,
            vencedoraEquipeNome,
            status: StatusPartida.FINALIZADA,
          }
        : p
    );

    const jogosEquipe1 = partidasAtualizadas.filter(
      (p) =>
        p.status === StatusPartida.FINALIZADA &&
        p.vencedoraEquipeId === confronto.equipe1Id
    ).length;

    const jogosEquipe2 = partidasAtualizadas.filter(
      (p) =>
        p.status === StatusPartida.FINALIZADA &&
        p.vencedoraEquipeId === confronto.equipe2Id
    ).length;

    const partidasFinalizadas = partidasAtualizadas.filter(
      (p) => p.status === StatusPartida.FINALIZADA
    ).length;

    // Atualizar confronto
    inicio = Date.now();
    await this.confrontoRepository.atualizar(confronto.id, {
      jogosEquipe1,
      jogosEquipe2,
      partidasFinalizadas,
      totalPartidas: partidasAtualizadas.length,
    });
    tempos["6_atualizarConfronto"] = Date.now() - inicio;

    // Construir confronto atualizado localmente
    const confrontoAtualizado: ConfrontoEquipe = {
      ...confronto,
      jogosEquipe1,
      jogosEquipe2,
      partidasFinalizadas,
      totalPartidas: partidasAtualizadas.length,
    };

    // Construir partida atualizada localmente
    const partidaAtualizada: PartidaTeams = {
      ...partida,
      placar: dto.placar,
      setsDupla1,
      setsDupla2,
      vencedoraEquipeId,
      vencedoraEquipeNome,
      status: StatusPartida.FINALIZADA,
    };

    inicio = Date.now();
    let precisaDecider = await this.verificarPrecisaDecider(
      confrontoAtualizado,
      partidasAtualizadas
    );
    tempos["7_verificarDecider"] = Date.now() - inicio;

    // Se precisa decider e ainda não existe, gerar automaticamente
    if (precisaDecider && !confrontoAtualizado.temDecider && this.partidaService) {
      try {
        inicio = Date.now();
        const etapa = await this.etapaRepository.buscarPorId(partida.etapaId);
        if (etapa) {
          await this.partidaService.gerarDecider(confrontoAtualizado, etapa);
          logger.info("Decider gerado automaticamente após empate 1-1", {
            confrontoId: confronto.id,
            etapaId: etapa.id,
          });
          precisaDecider = false;
        }
        tempos["8_gerarDecider"] = Date.now() - inicio;
      } catch (error) {
        logger.error("Erro ao gerar decider automaticamente", {
          confrontoId: confronto.id,
          error,
        });
      }
    }

    // Verificar se confronto está finalizado
    inicio = Date.now();
    const confrontoFinalizado = await this.verificarConfrontoFinalizado(
      confrontoAtualizado,
      partidasAtualizadas
    );
    tempos["9_verificarFinalizado"] = Date.now() - inicio;

    let confrontoFinal = confrontoAtualizado;
    if (confrontoFinalizado) {
      inicio = Date.now();
      await this.finalizarConfronto(confrontoAtualizado);
      confrontoFinal =
        (await this.confrontoRepository.buscarPorId(confronto.id))!;
      tempos["10_finalizarConfronto"] = Date.now() - inicio;
    }

    tempos["TOTAL"] = Date.now() - inicioTotal;

    logger.info("⏱️ TEMPOS registrarResultadoPartida Teams v3", {
      partidaId,
      confrontoId: confronto.id,
      confrontoFinalizado,
      tempos,
    });

    return {
      partida: partidaAtualizada,
      confronto: confrontoFinal,
      precisaDecider,
      confrontoFinalizado,
    };
  }

  /**
   * Registrar múltiplos resultados em lote
   */
  async registrarResultadosEmLote(
    etapaId: string,
    arenaId: string,
    resultados: Array<{ partidaId: string; placar: SetPlacarTeams[] }>
  ): Promise<{
    processados: number;
    erros: Array<{ partidaId: string; erro: string }>;
    confrontosFinalizados: string[];
  }> {
    const tempos: Record<string, number> = {};
    const inicioTotal = Date.now();
    let inicio = Date.now();

    if (resultados.length === 0) {
      return { processados: 0, erros: [], confrontosFinalizados: [] };
    }

    const erros: Array<{ partidaId: string; erro: string }> = [];
    const confrontosFinalizados: string[] = [];
    let processados = 0;

    // 1. Buscar todas as partidas
    inicio = Date.now();
    const partidaIds = resultados.map((r) => r.partidaId);
    const partidas = await Promise.all(
      partidaIds.map((id) => this.partidaRepository.buscarPorId(id))
    );
    tempos["1_buscarPartidas"] = Date.now() - inicio;

    // Mapear partidas por ID
    const partidasMap = new Map<string, PartidaTeams>();
    for (let i = 0; i < partidaIds.length; i++) {
      if (partidas[i]) {
        partidasMap.set(partidaIds[i], partidas[i]!);
      }
    }

    // 2. Agrupar resultados por confronto
    const resultadosPorConfronto = new Map<
      string,
      Array<{ partida: PartidaTeams; placar: SetPlacarTeams[] }>
    >();

    for (const resultado of resultados) {
      const partida = partidasMap.get(resultado.partidaId);
      if (!partida) {
        erros.push({
          partidaId: resultado.partidaId,
          erro: "Partida não encontrada",
        });
        continue;
      }

      const confrontoId = partida.confrontoId;
      if (!resultadosPorConfronto.has(confrontoId)) {
        resultadosPorConfronto.set(confrontoId, []);
      }
      resultadosPorConfronto.get(confrontoId)!.push({
        partida,
        placar: resultado.placar,
      });
    }

    // 3. Buscar todos os confrontos únicos
    inicio = Date.now();
    const confrontoIds = Array.from(resultadosPorConfronto.keys());
    const confrontos = await Promise.all(
      confrontoIds.map((id) => this.confrontoRepository.buscarPorId(id))
    );
    tempos["2_buscarConfrontos"] = Date.now() - inicio;

    const confrontosMap = new Map<string, ConfrontoEquipe>();
    for (let i = 0; i < confrontoIds.length; i++) {
      if (confrontos[i]) {
        confrontosMap.set(confrontoIds[i], confrontos[i]!);
      }
    }

    // 4. Processar cada confronto
    inicio = Date.now();
    for (const [confrontoId, partidasDoConfronto] of resultadosPorConfronto) {
      const confronto = confrontosMap.get(confrontoId);
      if (!confronto) {
        for (const { partida } of partidasDoConfronto) {
          erros.push({
            partidaId: partida.id,
            erro: "Confronto não encontrado",
          });
        }
        continue;
      }

      try {
        const resultado = await this.processarResultadosConfronto(
          confronto,
          partidasDoConfronto
        );

        processados += partidasDoConfronto.length;

        if (resultado.confrontoFinalizado) {
          confrontosFinalizados.push(confrontoId);
        }
      } catch (error: any) {
        for (const { partida } of partidasDoConfronto) {
          erros.push({
            partidaId: partida.id,
            erro: error.message || "Erro ao processar resultado",
          });
        }
      }
    }
    tempos["3_processarConfrontos"] = Date.now() - inicio;

    // 5. Recalcular classificação uma única vez
    if (processados > 0 && this.classificacaoService) {
      inicio = Date.now();
      await this.classificacaoService.recalcularClassificacao(etapaId, arenaId);
      tempos["4_recalcularClassificacao"] = Date.now() - inicio;
    }

    tempos["TOTAL"] = Date.now() - inicioTotal;

    logger.info("⏱️ TEMPOS registrarResultadosEmLote Teams v5", {
      totalResultados: resultados.length,
      processados,
      erros: erros.length,
      confrontosProcessados: resultadosPorConfronto.size,
      confrontosFinalizados: confrontosFinalizados.length,
      tempos,
    });

    return { processados, erros, confrontosFinalizados };
  }

  // ==================== MÉTODOS PRIVADOS ====================

  private calcularResultadoPartida(
    placar: SetPlacarTeams[],
    partida: PartidaTeams,
    confronto: ConfrontoEquipe
  ): {
    setsDupla1: number;
    setsDupla2: number;
    vencedoraEquipeId: string;
    vencedoraEquipeNome: string;
  } {
    let setsDupla1 = 0;
    let setsDupla2 = 0;

    for (const set of placar) {
      if (set.gamesDupla1 > set.gamesDupla2) {
        setsDupla1++;
      } else if (set.gamesDupla2 > set.gamesDupla1) {
        setsDupla2++;
      }
    }

    const equipe1Id = partida.equipe1Id || confronto.equipe1Id;
    const equipe2Id = partida.equipe2Id || confronto.equipe2Id;
    const equipe1Nome = partida.equipe1Nome || confronto.equipe1Nome;
    const equipe2Nome = partida.equipe2Nome || confronto.equipe2Nome;

    const vencedoraEquipeId =
      setsDupla1 > setsDupla2 ? equipe1Id! : equipe2Id!;
    const vencedoraEquipeNome =
      setsDupla1 > setsDupla2 ? equipe1Nome! : equipe2Nome!;

    return { setsDupla1, setsDupla2, vencedoraEquipeId, vencedoraEquipeNome };
  }

  private async atualizarEstatisticasJogadores(
    partida: PartidaTeams,
    placar: SetPlacarTeams[],
    vencedoraEquipeId: string,
    confronto: ConfrontoEquipe
  ): Promise<void> {
    const tempos: Record<string, number> = {};
    const inicioTotal = Date.now();
    let inicio = Date.now();

    // Calcular totais
    let gamesVencidosDupla1 = 0;
    let gamesPerdidosDupla1 = 0;
    let gamesVencidosDupla2 = 0;
    let gamesPerdidosDupla2 = 0;

    for (const set of placar) {
      gamesVencidosDupla1 += set.gamesDupla1;
      gamesPerdidosDupla1 += set.gamesDupla2;
      gamesVencidosDupla2 += set.gamesDupla2;
      gamesPerdidosDupla2 += set.gamesDupla1;
    }

    const equipe1Id = partida.equipe1Id || confronto.equipe1Id;
    const equipe2Id = partida.equipe2Id || confronto.equipe2Id;

    const dupla1Venceu = vencedoraEquipeId === equipe1Id;
    const setsVencidosDupla1 = placar.filter(
      (s) => s.gamesDupla1 > s.gamesDupla2
    ).length;
    const setsPerdidosDupla1 = placar.filter(
      (s) => s.gamesDupla2 > s.gamesDupla1
    ).length;

    // Buscar estatísticas de jogadores
    inicio = Date.now();
    const todosJogadorIds = [
      ...partida.dupla1.map((j) => j.id),
      ...partida.dupla2.map((j) => j.id),
    ];
    const estatisticasMap =
      await this.estatisticasService.buscarPorJogadoresEtapa(
        todosJogadorIds,
        partida.etapaId
      );
    tempos["1_buscarEstatisticas"] = Date.now() - inicio;

    // Preparar atualizações
    inicio = Date.now();
    const atualizacoesJogadores: Array<{
      estatisticaId: string;
      dto: {
        venceu: boolean;
        setsVencidos: number;
        setsPerdidos: number;
        gamesVencidos: number;
        gamesPerdidos: number;
      };
    }> = [];

    for (const jogador of partida.dupla1) {
      const estatistica = estatisticasMap.get(jogador.id);
      if (estatistica) {
        atualizacoesJogadores.push({
          estatisticaId: estatistica.id,
          dto: {
            venceu: dupla1Venceu,
            setsVencidos: setsVencidosDupla1,
            setsPerdidos: setsPerdidosDupla1,
            gamesVencidos: gamesVencidosDupla1,
            gamesPerdidos: gamesPerdidosDupla1,
          },
        });
      }
    }

    for (const jogador of partida.dupla2) {
      const estatistica = estatisticasMap.get(jogador.id);
      if (estatistica) {
        atualizacoesJogadores.push({
          estatisticaId: estatistica.id,
          dto: {
            venceu: !dupla1Venceu,
            setsVencidos: setsPerdidosDupla1,
            setsPerdidos: setsVencidosDupla1,
            gamesVencidos: gamesVencidosDupla2,
            gamesPerdidos: gamesPerdidosDupla2,
          },
        });
      }
    }

    if (atualizacoesJogadores.length > 0) {
      await this.estatisticasService.atualizarAposPartidaComIncrement(
        atualizacoesJogadores
      );
    }
    tempos["2_atualizarJogadores"] = Date.now() - inicio;

    // Atualizar equipes
    if (!equipe1Id || !equipe2Id) {
      logger.warn(
        "Partida e confronto sem equipe1Id ou equipe2Id, pulando atualização de estatísticas de equipes",
        {
          partidaId: partida.id,
          equipe1Id,
          equipe2Id,
        }
      );
      return;
    }

    inicio = Date.now();
    await this.equipeRepository.incrementarEstatisticasEmLote([
      {
        id: equipe1Id,
        incrementos: {
          jogosVencidos: dupla1Venceu ? 1 : 0,
          jogosPerdidos: dupla1Venceu ? 0 : 1,
          gamesVencidos: gamesVencidosDupla1,
          gamesPerdidos: gamesPerdidosDupla1,
        },
      },
      {
        id: equipe2Id,
        incrementos: {
          jogosVencidos: dupla1Venceu ? 0 : 1,
          jogosPerdidos: dupla1Venceu ? 1 : 0,
          gamesVencidos: gamesVencidosDupla2,
          gamesPerdidos: gamesPerdidosDupla2,
        },
      },
    ]);
    tempos["3_incrementarEquipes"] = Date.now() - inicio;

    tempos["TOTAL"] = Date.now() - inicioTotal;

    logger.info("⏱️ TEMPOS atualizarEstatisticasJogadores Teams v3", {
      partidaId: partida.id,
      jogadoresDupla1: partida.dupla1.length,
      jogadoresDupla2: partida.dupla2.length,
      tempos,
    });
  }

  private async reverterEstatisticasPartida(
    _partida: PartidaTeams
  ): Promise<void> {
    // Implementar reversão se necessário para edição de resultado
  }

  private async verificarPrecisaDecider(
    confronto: ConfrontoEquipe,
    partidas: PartidaTeams[]
  ): Promise<boolean> {
    // TEAMS_6 não tem decider
    if (confronto.totalPartidas === 3) {
      return false;
    }

    const partidasRegulares = partidas.filter(
      (p) => p.tipoJogo !== TipoJogoTeams.DECIDER
    );
    const finalizadas = partidasRegulares.filter(
      (p) => p.status === StatusPartida.FINALIZADA
    );

    if (finalizadas.length < 2) return false;

    return (
      confronto.jogosEquipe1 === 1 &&
      confronto.jogosEquipe2 === 1 &&
      !confronto.temDecider
    );
  }

  private async verificarConfrontoFinalizado(
    confronto: ConfrontoEquipe,
    partidas: PartidaTeams[]
  ): Promise<boolean> {
    const finalizadas = partidas.filter(
      (p) => p.status === StatusPartida.FINALIZADA
    );

    if (confronto.jogosEquipe1 >= 2 || confronto.jogosEquipe2 >= 2) {
      return true;
    }

    if (confronto.totalPartidas === 3 && finalizadas.length === 3) {
      return true;
    }

    if (confronto.temDecider) {
      const decider = partidas.find(
        (p) => p.tipoJogo === TipoJogoTeams.DECIDER
      );
      if (decider && decider.status === StatusPartida.FINALIZADA) {
        return true;
      }
    }

    return false;
  }

  private async finalizarConfronto(confronto: ConfrontoEquipe): Promise<void> {
    const tempos: Record<string, number> = {};
    const inicioTotal = Date.now();
    let inicio = Date.now();

    const vencedoraId =
      confronto.jogosEquipe1 > confronto.jogosEquipe2
        ? confronto.equipe1Id
        : confronto.equipe2Id;
    const vencedoraNome =
      confronto.jogosEquipe1 > confronto.jogosEquipe2
        ? confronto.equipe1Nome
        : confronto.equipe2Nome;
    const perdedoraId =
      confronto.jogosEquipe1 > confronto.jogosEquipe2
        ? confronto.equipe2Id
        : confronto.equipe1Id;

    if (confronto.fase === FaseEtapa.GRUPOS) {
      inicio = Date.now();
      await Promise.all([
        this.confrontoRepository.registrarResultado(
          confronto.id,
          confronto.jogosEquipe1,
          confronto.jogosEquipe2,
          vencedoraId,
          vencedoraNome
        ),
        this.equipeRepository.incrementarEstatisticasEmLote([
          {
            id: vencedoraId,
            incrementos: { confrontos: 1, vitorias: 1, pontos: 3 },
          },
          {
            id: perdedoraId,
            incrementos: { confrontos: 1, derrotas: 1 },
          },
        ]),
      ]);
      tempos["1_registrarEIncrementar"] = Date.now() - inicio;

      if (this.classificacaoService) {
        inicio = Date.now();
        await this.classificacaoService.recalcularClassificacao(
          confronto.etapaId,
          confronto.arenaId
        );
        tempos["2_recalcularClassificacao"] = Date.now() - inicio;

        inicio = Date.now();
        await this.classificacaoService.verificarEPreencherFaseEliminatoria(
          confronto.etapaId,
          confronto.arenaId
        );
        tempos["3_verificarEliminatoria"] = Date.now() - inicio;
      }
    } else if (confronto.fase === FaseEtapa.SEMIFINAL) {
      inicio = Date.now();
      await this.confrontoRepository.registrarResultado(
        confronto.id,
        confronto.jogosEquipe1,
        confronto.jogosEquipe2,
        vencedoraId,
        vencedoraNome
      );
      tempos["1_registrarResultado"] = Date.now() - inicio;

      if (this.classificacaoService) {
        inicio = Date.now();
        await this.classificacaoService.preencherProximoConfronto(
          confronto,
          vencedoraId,
          vencedoraNome
        );
        tempos["2_preencherProximo"] = Date.now() - inicio;
      }
    } else {
      inicio = Date.now();
      await this.confrontoRepository.registrarResultado(
        confronto.id,
        confronto.jogosEquipe1,
        confronto.jogosEquipe2,
        vencedoraId,
        vencedoraNome
      );
      tempos["1_registrarResultado"] = Date.now() - inicio;
    }

    tempos["TOTAL"] = Date.now() - inicioTotal;

    logger.info("⏱️ TEMPOS finalizarConfronto Teams v4", {
      confrontoId: confronto.id,
      fase: confronto.fase,
      tempos,
    });
  }

  private async processarResultadosConfronto(
    confronto: ConfrontoEquipe,
    partidasComPlacar: Array<{ partida: PartidaTeams; placar: SetPlacarTeams[] }>
  ): Promise<{ confrontoFinalizado: boolean }> {
    const atualizacoesJogadores: Array<{
      estatisticaId: string;
      dto: {
        venceu: boolean;
        setsVencidos: number;
        setsPerdidos: number;
        gamesVencidos: number;
        gamesPerdidos: number;
      };
    }> = [];

    const incrementosEquipes = new Map<
      string,
      {
        jogosVencidos: number;
        jogosPerdidos: number;
        gamesVencidos: number;
        gamesPerdidos: number;
      }
    >();

    const equipe1Id = confronto.equipe1Id;
    const equipe2Id = confronto.equipe2Id;

    incrementosEquipes.set(equipe1Id, {
      jogosVencidos: 0,
      jogosPerdidos: 0,
      gamesVencidos: 0,
      gamesPerdidos: 0,
    });
    incrementosEquipes.set(equipe2Id, {
      jogosVencidos: 0,
      jogosPerdidos: 0,
      gamesVencidos: 0,
      gamesPerdidos: 0,
    });

    // Buscar estatísticas de todos os jogadores
    const todosJogadorIds = new Set<string>();
    for (const { partida } of partidasComPlacar) {
      partida.dupla1.forEach((j) => todosJogadorIds.add(j.id));
      partida.dupla2.forEach((j) => todosJogadorIds.add(j.id));
    }

    const estatisticasMap =
      await this.estatisticasService.buscarPorJogadoresEtapa(
        Array.from(todosJogadorIds),
        confronto.etapaId
      );

    // Processar cada partida
    for (const { partida, placar } of partidasComPlacar) {
      const { setsDupla1, setsDupla2, vencedoraEquipeId, vencedoraEquipeNome } =
        this.calcularResultadoPartida(placar, partida, confronto);

      await this.partidaRepository.registrarResultado(
        partida.id,
        placar,
        setsDupla1,
        setsDupla2,
        vencedoraEquipeId,
        vencedoraEquipeNome
      );

      let gamesVencidosDupla1 = 0;
      let gamesPerdidosDupla1 = 0;
      let gamesVencidosDupla2 = 0;
      let gamesPerdidosDupla2 = 0;

      for (const set of placar) {
        gamesVencidosDupla1 += set.gamesDupla1;
        gamesPerdidosDupla1 += set.gamesDupla2;
        gamesVencidosDupla2 += set.gamesDupla2;
        gamesPerdidosDupla2 += set.gamesDupla1;
      }

      const dupla1Venceu = vencedoraEquipeId === equipe1Id;
      const setsVencidosDupla1 = placar.filter(
        (s) => s.gamesDupla1 > s.gamesDupla2
      ).length;
      const setsPerdidosDupla1 = placar.filter(
        (s) => s.gamesDupla2 > s.gamesDupla1
      ).length;

      for (const jogador of partida.dupla1) {
        const estatistica = estatisticasMap.get(jogador.id);
        if (estatistica) {
          atualizacoesJogadores.push({
            estatisticaId: estatistica.id,
            dto: {
              venceu: dupla1Venceu,
              setsVencidos: setsVencidosDupla1,
              setsPerdidos: setsPerdidosDupla1,
              gamesVencidos: gamesVencidosDupla1,
              gamesPerdidos: gamesPerdidosDupla1,
            },
          });
        }
      }

      for (const jogador of partida.dupla2) {
        const estatistica = estatisticasMap.get(jogador.id);
        if (estatistica) {
          atualizacoesJogadores.push({
            estatisticaId: estatistica.id,
            dto: {
              venceu: !dupla1Venceu,
              setsVencidos: setsPerdidosDupla1,
              setsPerdidos: setsVencidosDupla1,
              gamesVencidos: gamesVencidosDupla2,
              gamesPerdidos: gamesPerdidosDupla2,
            },
          });
        }
      }

      const inc1 = incrementosEquipes.get(equipe1Id)!;
      inc1.jogosVencidos += dupla1Venceu ? 1 : 0;
      inc1.jogosPerdidos += dupla1Venceu ? 0 : 1;
      inc1.gamesVencidos += gamesVencidosDupla1;
      inc1.gamesPerdidos += gamesPerdidosDupla1;

      const inc2 = incrementosEquipes.get(equipe2Id)!;
      inc2.jogosVencidos += dupla1Venceu ? 0 : 1;
      inc2.jogosPerdidos += dupla1Venceu ? 1 : 0;
      inc2.gamesVencidos += gamesVencidosDupla2;
      inc2.gamesPerdidos += gamesPerdidosDupla2;
    }

    // Aplicar atualizações em batch
    await Promise.all([
      this.estatisticasService.atualizarAposPartidaComIncrement(
        atualizacoesJogadores
      ),
      this.equipeRepository.incrementarEstatisticasEmLote([
        { id: equipe1Id, incrementos: incrementosEquipes.get(equipe1Id)! },
        { id: equipe2Id, incrementos: incrementosEquipes.get(equipe2Id)! },
      ]),
    ]);

    // Buscar partidas atualizadas
    const partidasConfronto =
      await this.partidaRepository.buscarPorConfrontoOrdenadas(confronto.id);

    const jogosEquipe1 = partidasConfronto.filter(
      (p) =>
        p.status === StatusPartida.FINALIZADA &&
        p.vencedoraEquipeId === equipe1Id
    ).length;

    const jogosEquipe2 = partidasConfronto.filter(
      (p) =>
        p.status === StatusPartida.FINALIZADA &&
        p.vencedoraEquipeId === equipe2Id
    ).length;

    const partidasFinalizadas = partidasConfronto.filter(
      (p) => p.status === StatusPartida.FINALIZADA
    ).length;

    await this.confrontoRepository.atualizar(confronto.id, {
      jogosEquipe1,
      jogosEquipe2,
      partidasFinalizadas,
      totalPartidas: partidasConfronto.length,
    });

    const confrontoAtualizado: ConfrontoEquipe = {
      ...confronto,
      jogosEquipe1,
      jogosEquipe2,
      partidasFinalizadas,
      totalPartidas: partidasConfronto.length,
    };

    const confrontoFinalizado = await this.verificarConfrontoFinalizado(
      confrontoAtualizado,
      partidasConfronto
    );

    if (confrontoFinalizado) {
      await this.finalizarConfronto(confrontoAtualizado);
    }

    return { confrontoFinalizado };
  }
}

export default new TeamsResultadoService();
