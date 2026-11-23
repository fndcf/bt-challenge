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
  ConfrontoEquipe,
  PartidaTeams,
  SetPlacarTeams,
  RegistrarResultadoTeamsDTO,
  TipoJogoTeams,
  StatusConfronto,
} from "../../models/Teams";
import { FaseEtapa } from "../../models/Etapa";
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
import { validarEDeterminarVencedorPlacar } from "../../utils/placarSets";
import { NotFoundError } from "../../utils/errors";
import logger from "../../utils/logger";
import {
  isEliminatoriaPreenchida,
  ITeamsClassificacaoService,
  TeamsClassificacaoService,
} from "./TeamsClassificacaoService";
import { ITeamsPartidaService, TeamsPartidaService } from "./TeamsPartidaService";

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
  constructor(
    private partidaRepository: IPartidaTeamsRepository = PartidaTeamsRepository,
    private confrontoRepository: IConfrontoEquipeRepository = ConfrontoEquipeRepository,
    private equipeRepository: IEquipeRepository = EquipeRepository,
    private estatisticasService: EstatisticasJogadorService = new EstatisticasJogadorService(),
    private etapaRepository: IEtapaRepository = new EtapaRepository(),
    // Para gerar o decider no empate 1 a 1
    private partidaService: ITeamsPartidaService = new TeamsPartidaService(
      partidaRepository,
      equipeRepository,
      confrontoRepository
    ),
    // Para atualizar a tabela e levar o vencedor à fase seguinte
    private classificacaoService: ITeamsClassificacaoService = new TeamsClassificacaoService(
      confrontoRepository,
      equipeRepository
    )
  ) {}

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
    // Buscar partida
    const partida = await this.partidaRepository.buscarPorId(partidaId);
    if (!partida) {
      throw new NotFoundError("Partida não encontrada");
    }

    // Buscar confronto e partidas em paralelo
    const [confrontoAtual, partidasConfronto] = await Promise.all([
      this.confrontoRepository.buscarPorId(partida.confrontoId),
      this.partidaRepository.buscarPorConfrontoOrdenadas(partida.confrontoId),
    ]);
    if (!confrontoAtual) {
      throw new NotFoundError("Confronto não encontrado");
    }
    let confronto = confrontoAtual;

    if (confronto.fase === FaseEtapa.GRUPOS) {
      await this.garantirFaseGruposEditavel(
        confronto.etapaId,
        confronto.arenaId
      );
    }

    // Calcular resultado
    const { setsDupla1, setsDupla2, vencedoraEquipeId, vencedoraEquipeNome } =
      this.calcularResultadoPartida(dto.placar, partida, confronto);

    // Se já tinha resultado, reverter estatísticas (e a finalização do confronto)
    if (partida.status === StatusPartida.FINALIZADA) {
      await this.garantirProximoConfrontoEditavel(confronto);
      await this.reverterEstatisticasPartida(partida, confronto);
      confronto = await this.reverterFinalizacaoConfronto(confronto);
    }

    // Registrar resultado
    await this.partidaRepository.registrarResultado(
      partidaId,
      dto.placar,
      setsDupla1,
      setsDupla2,
      vencedoraEquipeId,
      vencedoraEquipeNome
    );

    // Atualizar estatísticas dos jogadores
    await this.atualizarEstatisticasJogadores(
      partida,
      dto.placar,
      vencedoraEquipeId,
      confronto
    );

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
    const status = this.statusComJogoLancado(confronto);
    await this.confrontoRepository.atualizar(confronto.id, {
      jogosEquipe1,
      jogosEquipe2,
      partidasFinalizadas,
      totalPartidas: partidasAtualizadas.length,
      status,
    });

    // Construir confronto atualizado localmente
    const confrontoAtualizado: ConfrontoEquipe = {
      ...confronto,
      jogosEquipe1,
      jogosEquipe2,
      partidasFinalizadas,
      totalPartidas: partidasAtualizadas.length,
      status,
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

    let precisaDecider = await this.verificarPrecisaDecider(
      confrontoAtualizado,
      partidasAtualizadas
    );

    // Se precisa decider e ainda não existe, gerar automaticamente
    if (
      precisaDecider &&
      !confrontoAtualizado.temDecider
    ) {
      try {
        const etapa = await this.etapaRepository.buscarPorId(partida.etapaId);
        if (etapa) {
          await this.partidaService.gerarDecider(confrontoAtualizado, etapa);
          logger.info("Decider gerado automaticamente após empate 1-1", {
            confrontoId: confronto.id,
            etapaId: etapa.id,
          });
          precisaDecider = false;
        }
      } catch (error) {
        logger.error("Erro ao gerar decider automaticamente", {
          confrontoId: confronto.id,
          error,
        });
      }
    }

    // Verificar se confronto está finalizado
    const confrontoFinalizado = await this.verificarConfrontoFinalizado(
      confrontoAtualizado,
      partidasAtualizadas
    );

    let confrontoFinal = confrontoAtualizado;
    if (confrontoFinalizado) {
      await this.finalizarConfronto(confrontoAtualizado);
      confrontoFinal = (await this.confrontoRepository.buscarPorId(
        confronto.id
      ))!;
    }

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
    if (resultados.length === 0) {
      return { processados: 0, erros: [], confrontosFinalizados: [] };
    }

    const erros: Array<{ partidaId: string; erro: string }> = [];
    const confrontosFinalizados: string[] = [];
    let processados = 0;

    // Buscar todas as partidas
    const partidaIds = resultados.map((r) => r.partidaId);
    const partidas = await Promise.all(
      partidaIds.map((id) => this.partidaRepository.buscarPorId(id))
    );

    // Mapear partidas por ID
    const partidasMap = new Map<string, PartidaTeams>();
    for (let i = 0; i < partidaIds.length; i++) {
      if (partidas[i]) {
        partidasMap.set(partidaIds[i], partidas[i]!);
      }
    }

    // Agrupar resultados por confronto
    const resultadosPorConfronto = new Map<
      string,
      Array<{ partida: PartidaTeams; placar: SetPlacarTeams[] }>
    >();

    for (const resultado of resultados) {
      const partida = partidasMap.get(resultado.partidaId);
      if (partida?.etapaId !== etapaId || partida.arenaId !== arenaId) {
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

    // Buscar todos os confrontos únicos
    const confrontoIds = Array.from(resultadosPorConfronto.keys());
    const confrontos = await Promise.all(
      confrontoIds.map((id) => this.confrontoRepository.buscarPorId(id))
    );

    const confrontosMap = new Map<string, ConfrontoEquipe>();
    for (let i = 0; i < confrontoIds.length; i++) {
      if (confrontos[i]) {
        confrontosMap.set(confrontoIds[i], confrontos[i]!);
      }
    }

    if (
      Array.from(confrontosMap.values()).some((c) => c.fase === FaseEtapa.GRUPOS)
    ) {
      await this.garantirFaseGruposEditavel(etapaId, arenaId);
    }

    // Processar cada confronto
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

    // Recalcular classificação uma única vez
    if (processados > 0) {
      await this.classificacaoService.recalcularClassificacao(etapaId, arenaId);
    }

    return { processados, erros, confrontosFinalizados };
  }

  /**
   * Desfaz as estatísticas de todas as partidas finalizadas de um confronto
   * (usado ao cancelar a fase eliminatória com resultados lançados)
   */
  async reverterResultadosConfronto(confronto: ConfrontoEquipe): Promise<void> {
    const partidas = await this.partidaRepository.buscarPorConfronto(
      confronto.id
    );
    for (const partida of partidas) {
      await this.reverterEstatisticasPartida(partida, confronto);
    }
  }

  // ==================== MÉTODOS PRIVADOS ====================

  /**
   * Resultados da fase de grupos não podem mudar depois de gerar a
   * eliminatória (as vagas já foram preenchidas com a classificação)
   */
  private async garantirFaseGruposEditavel(
    etapaId: string,
    arenaId: string
  ): Promise<void> {
    const confrontos = await this.confrontoRepository.buscarPorEtapa(
      etapaId,
      arenaId
    );
    if (isEliminatoriaPreenchida(confrontos)) {
      throw new Error(
        "Não é possível editar resultados da fase de grupos após gerar a fase eliminatória. Cancele a eliminatória primeiro."
      );
    }
  }

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
    const { setsDupla1, setsDupla2 } = validarEDeterminarVencedorPlacar(placar);

    const equipe1Id = partida.equipe1Id || confronto.equipe1Id;
    const equipe2Id = partida.equipe2Id || confronto.equipe2Id;
    const equipe1Nome = partida.equipe1Nome || confronto.equipe1Nome;
    const equipe2Nome = partida.equipe2Nome || confronto.equipe2Nome;

    const vencedoraEquipeId = setsDupla1 > setsDupla2 ? equipe1Id! : equipe2Id!;
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
    const todosJogadorIds = [
      ...partida.dupla1.map((j) => j.id),
      ...partida.dupla2.map((j) => j.id),
    ];
    const estatisticasMap =
      await this.estatisticasService.buscarPorJogadoresEtapa(
        todosJogadorIds,
        partida.etapaId
      );

    // Preparar atualizações
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
  }

  /**
   * Desfaz as estatísticas (jogadores e equipes) do resultado anterior de
   * uma partida que está sendo editada, para o novo resultado não somar
   * em cima do antigo
   */
  private async reverterEstatisticasPartida(
    partida: PartidaTeams,
    confronto: ConfrontoEquipe
  ): Promise<void> {
    if (
      partida.status !== StatusPartida.FINALIZADA ||
      !partida.placar ||
      partida.placar.length === 0 ||
      !partida.vencedoraEquipeId
    ) {
      return;
    }

    let gamesDupla1 = 0;
    let gamesDupla2 = 0;
    for (const set of partida.placar) {
      gamesDupla1 += set.gamesDupla1;
      gamesDupla2 += set.gamesDupla2;
    }
    const setsDupla1 = partida.placar.filter(
      (s) => s.gamesDupla1 > s.gamesDupla2
    ).length;
    const setsDupla2 = partida.placar.filter(
      (s) => s.gamesDupla2 > s.gamesDupla1
    ).length;

    const equipe1Id = partida.equipe1Id || confronto.equipe1Id;
    const equipe2Id = partida.equipe2Id || confronto.equipe2Id;
    const dupla1Venceu = partida.vencedoraEquipeId === equipe1Id;

    // Jogadores
    const estatisticasMap =
      await this.estatisticasService.buscarPorJogadoresEtapa(
        [...partida.dupla1, ...partida.dupla2].map((j) => j.id),
        partida.etapaId
      );
    const reversoes = [
      ...partida.dupla1.map((j) => ({
        estatisticaId: estatisticasMap.get(j.id)?.id || "",
        dto: {
          venceu: dupla1Venceu,
          setsVencidos: setsDupla1,
          setsPerdidos: setsDupla2,
          gamesVencidos: gamesDupla1,
          gamesPerdidos: gamesDupla2,
        },
      })),
      ...partida.dupla2.map((j) => ({
        estatisticaId: estatisticasMap.get(j.id)?.id || "",
        dto: {
          venceu: !dupla1Venceu,
          setsVencidos: setsDupla2,
          setsPerdidos: setsDupla1,
          gamesVencidos: gamesDupla2,
          gamesPerdidos: gamesDupla1,
        },
      })),
    ].filter((r) => r.estatisticaId);

    if (reversoes.length > 0) {
      await this.estatisticasService.reverterTotaisComIncrement(reversoes);
    }

    // Equipes (incrementos negativos)
    if (equipe1Id && equipe2Id) {
      await this.equipeRepository.incrementarEstatisticasEmLote([
        {
          id: equipe1Id,
          incrementos: {
            jogosVencidos: dupla1Venceu ? -1 : 0,
            jogosPerdidos: dupla1Venceu ? 0 : -1,
            gamesVencidos: -gamesDupla1,
            gamesPerdidos: -gamesDupla2,
          },
        },
        {
          id: equipe2Id,
          incrementos: {
            jogosVencidos: dupla1Venceu ? 0 : -1,
            jogosPerdidos: dupla1Venceu ? -1 : 0,
            gamesVencidos: -gamesDupla2,
            gamesPerdidos: -gamesDupla1,
          },
        },
      ]);
    }
  }

  /**
   * Desfaz a finalização de um confronto que está sendo editado
   * (grupos: vitória/derrota/pontos; mata-mata: vencedor que avançou).
   * Tudo é aplicado de novo se ele finalizar outra vez.
   *
   * @returns Confronto com o estado "não finalizado"
   */
  private async reverterFinalizacaoConfronto(
    confronto: ConfrontoEquipe
  ): Promise<ConfrontoEquipe> {
    if (
      confronto.status !== StatusConfronto.FINALIZADO ||
      !confronto.vencedoraId
    ) {
      return confronto;
    }

    if (confronto.fase !== FaseEtapa.GRUPOS) {
      await this.liberarVagaNoProximoConfronto(confronto);
    } else {
      const perdedoraId =
        confronto.vencedoraId === confronto.equipe1Id
          ? confronto.equipe2Id
          : confronto.equipe1Id;

      await this.equipeRepository.incrementarEstatisticasEmLote([
        {
          id: confronto.vencedoraId,
          incrementos: { confrontos: -1, vitorias: -1, pontos: -3 },
        },
        {
          id: perdedoraId,
          incrementos: { confrontos: -1, derrotas: -1 },
        },
      ]);
    }

    await this.confrontoRepository.reabrir(confronto.id);

    return {
      ...confronto,
      status: StatusConfronto.EM_ANDAMENTO,
      vencedoraId: undefined,
      vencedoraNome: undefined,
    };
  }

  /**
   * Com jogo lançado o confronto está em andamento, até ser finalizado
   */
  private statusComJogoLancado(confronto: ConfrontoEquipe): StatusConfronto {
    return confronto.status === StatusConfronto.FINALIZADO
      ? StatusConfronto.FINALIZADO
      : StatusConfronto.EM_ANDAMENTO;
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

      // A eliminatória é gerada pelo admin (TeamsClassificacaoService.gerarFaseEliminatoria)
      await this.classificacaoService.recalcularClassificacao(
        confronto.etapaId,
        confronto.arenaId
      );
    } else {
      await this.confrontoRepository.registrarResultado(
        confronto.id,
        confronto.jogosEquipe1,
        confronto.jogosEquipe2,
        vencedoraId,
        vencedoraNome
      );

      // Oitavas, quartas e semifinal levam o vencedor à fase seguinte
      // (a final não tem próximo confronto)
      await this.classificacaoService.preencherProximoConfronto(
        confronto,
        vencedoraId,
        vencedoraNome
      );
    }
  }

  /**
   * Editar um confronto do mata-mata já finalizado pode trocar o vencedor
   * que avançou; só é permitido enquanto a fase seguinte não tem resultado
   */
  private async garantirProximoConfrontoEditavel(
    confronto: ConfrontoEquipe
  ): Promise<void> {
    if (
      confronto.fase === FaseEtapa.GRUPOS ||
      confronto.status !== StatusConfronto.FINALIZADO ||
      !confronto.proximoConfrontoId
    ) {
      return;
    }

    const proximo = await this.confrontoRepository.buscarPorId(
      confronto.proximoConfrontoId
    );
    if (
      proximo &&
      (proximo.status === StatusConfronto.FINALIZADO ||
        (proximo.partidasFinalizadas || 0) > 0)
    ) {
      throw new Error(
        "Não é possível editar este confronto: a fase seguinte já tem resultado lançado. Edite primeiro o confronto seguinte."
      );
    }
  }

  /**
   * Tira do próximo confronto o vencedor que tinha avançado (edição de
   * resultado no mata-mata). As partidas já geradas lá usam os jogadores
   * dessa equipe, então são apagadas e geradas de novo depois.
   */
  private async liberarVagaNoProximoConfronto(
    confronto: ConfrontoEquipe
  ): Promise<void> {
    if (!confronto.proximoConfrontoId || !confronto.vencedoraId) return;

    const proximo = await this.confrontoRepository.buscarPorId(
      confronto.proximoConfrontoId
    );
    if (!proximo) return;

    const vaga =
      proximo.equipe1Id === confronto.vencedoraId
        ? { equipe1Id: "", equipe1Nome: "" }
        : proximo.equipe2Id === confronto.vencedoraId
          ? { equipe2Id: "", equipe2Nome: "" }
          : null;
    if (!vaga) return;

    await this.partidaRepository.deletarPorConfronto(proximo.id);
    await this.confrontoRepository.resetarConfronto(proximo.id);
    await this.confrontoRepository.atualizar(proximo.id, vaga);
  }

  private async processarResultadosConfronto(
    confronto: ConfrontoEquipe,
    partidasComPlacar: Array<{
      partida: PartidaTeams;
      placar: SetPlacarTeams[];
    }>
  ): Promise<{ confrontoFinalizado: boolean }> {
    // Edição: desfazer o resultado anterior antes de aplicar o novo
    const edicoes = partidasComPlacar.filter(
      ({ partida }) => partida.status === StatusPartida.FINALIZADA
    );
    if (edicoes.length > 0) {
      await this.garantirProximoConfrontoEditavel(confronto);
    }
    for (const { partida } of edicoes) {
      await this.reverterEstatisticasPartida(partida, confronto);
    }
    if (edicoes.length > 0) {
      confronto = await this.reverterFinalizacaoConfronto(confronto);
    }

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

    const status = this.statusComJogoLancado(confronto);
    await this.confrontoRepository.atualizar(confronto.id, {
      jogosEquipe1,
      jogosEquipe2,
      partidasFinalizadas,
      totalPartidas: partidasConfronto.length,
      status,
    });

    const confrontoAtualizado: ConfrontoEquipe = {
      ...confronto,
      jogosEquipe1,
      jogosEquipe2,
      partidasFinalizadas,
      totalPartidas: partidasConfronto.length,
      status,
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
