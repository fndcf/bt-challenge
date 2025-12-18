/**
 * Service especializado para partidas da fase de grupos
 * Responsabilidades:
 * - Gerar partidas de todos contra todos
 * - Registrar resultados de partidas
 * - Atualizar estatísticas de duplas e jogadores
 */

import { Dupla } from "../models/Dupla";
import { Grupo } from "../models/Grupo";
import {
  Partida,
  StatusPartida,
  ResultadoPartidaLoteDTO,
  RegistrarResultadosEmLoteResponse,
} from "../models/Partida";
import { FaseEtapa } from "../models/Etapa";
import { IPartidaRepository } from "../repositories/interfaces/IPartidaRepository";
import { IDuplaRepository } from "../repositories/interfaces/IDuplaRepository";
import { IGrupoRepository } from "../repositories/interfaces/IGrupoRepository";
import { IConfrontoEliminatorioRepository } from "../repositories/interfaces/IConfrontoEliminatorioRepository";
import { partidaRepository } from "../repositories/firebase/PartidaRepository";
import { duplaRepository } from "../repositories/firebase/DuplaRepository";
import { grupoRepository } from "../repositories/firebase/GrupoRepository";
import { confrontoEliminatorioRepository } from "../repositories/firebase/ConfrontoEliminatorioRepository";
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

  registrarResultadosEmLote(
    arenaId: string,
    resultados: ResultadoPartidaLoteDTO[]
  ): Promise<RegistrarResultadosEmLoteResponse>;

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
    private grupoRepo: IGrupoRepository = grupoRepository,
    private confrontoRepo: IConfrontoEliminatorioRepository = confrontoEliminatorioRepository
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
      // Buscar duplas de todos os grupos em paralelo
      const duplasPorGrupo = await Promise.all(
        grupos.map((grupo) => this.duplaRepo.buscarPorGrupo(grupo.id))
      );

      // Gerar todos os DTOs de partidas
      const todosPartidaDTOs: any[] = [];
      const partidasPorGrupo: Map<string, number> = new Map(); // grupoId -> quantidade de partidas

      for (let g = 0; g < grupos.length; g++) {
        const grupo = grupos[g];
        const duplas = duplasPorGrupo[g];
        const startIndex = todosPartidaDTOs.length;

        for (let i = 0; i < duplas.length; i++) {
          for (let j = i + 1; j < duplas.length; j++) {
            const dupla1 = duplas[i];
            const dupla2 = duplas[j];

            todosPartidaDTOs.push({
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
          }
        }

        partidasPorGrupo.set(grupo.id, todosPartidaDTOs.length - startIndex);
      }

      // Criar todas as partidas em um único batch
      const todasPartidas = await this.partidaRepo.criarEmLote(
        todosPartidaDTOs
      );

      // Atualizar grupos com IDs das partidas em paralelo
      let partidaIndex = 0;
      const atualizacoesGrupos = grupos.map((grupo) => {
        const qtdPartidas = partidasPorGrupo.get(grupo.id) || 0;
        const partidasDoGrupo = todasPartidas.slice(
          partidaIndex,
          partidaIndex + qtdPartidas
        );
        partidaIndex += qtdPartidas;

        const partidasIds = partidasDoGrupo.map((p) => p.id);
        return this.grupoRepo.adicionarPartidasEmLote(grupo.id, partidasIds);
      });

      await Promise.all(atualizacoesGrupos);

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

      // Se for edição, verificar se a eliminatória já foi gerada
      if (isEdicao) {
        const confrontos = await this.confrontoRepo.buscarPorEtapa(
          partida.etapaId,
          arenaId
        );
        if (confrontos.length > 0) {
          throw new Error(
            "Não é possível editar resultados após gerar a fase eliminatória. Cancele a eliminatória primeiro."
          );
        }
      }

      // Se for edição, reverter estatísticas anteriores
      if (isEdicao && partida.placar && partida.placar.length > 0) {
        await this.reverterEstatisticas(partida, dupla1, dupla2);

        dupla1 = await this.duplaRepo.buscarPorId(partida.dupla1Id);
        dupla2 = await this.duplaRepo.buscarPorId(partida.dupla2Id);

        if (!dupla1 || !dupla2) {
          throw new Error("Duplas não encontradas após reversão");
        }
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
   * Registrar múltiplos resultados de partidas em lote
   */
  async registrarResultadosEmLote(
    arenaId: string,
    resultados: ResultadoPartidaLoteDTO[]
  ): Promise<RegistrarResultadosEmLoteResponse> {
    const erros: Array<{ partidaId: string; erro: string }> = [];
    const gruposParaRecalcular = new Set<string>();
    let processados = 0;

    try {
      // Buscar todas as partidas em paralelo
      const partidasPromises = resultados.map((r) =>
        this.partidaRepo.buscarPorIdEArena(r.partidaId, arenaId)
      );
      const partidas = await Promise.all(partidasPromises);

      // Coletar todas as duplas e jogadores únicos e verificar eliminatória uma vez
      const duplaIdsSet = new Set<string>();
      const jogadorIdsSet = new Set<string>();
      let etapaIdParaVerificar: string | null = null;
      let temEdicao = false;

      for (const partida of partidas) {
        if (partida) {
          duplaIdsSet.add(partida.dupla1Id);
          duplaIdsSet.add(partida.dupla2Id);
          if (partida.status === StatusPartida.FINALIZADA) {
            temEdicao = true;
            etapaIdParaVerificar = partida.etapaId;
          }
        }
      }

      // Verificar eliminatória uma única vez (se houver edição)
      let eliminatoriaGerada = false;
      if (temEdicao && etapaIdParaVerificar) {
        const confrontos = await this.confrontoRepo.buscarPorEtapa(
          etapaIdParaVerificar,
          arenaId
        );
        eliminatoriaGerada = confrontos.length > 0;
      }

      // Buscar todas as duplas em paralelo
      const duplaIds = Array.from(duplaIdsSet);
      const duplasArray = await Promise.all(
        duplaIds.map((id) => this.duplaRepo.buscarPorId(id))
      );
      const duplasMap = new Map<string, Dupla>();
      duplasArray.forEach((dupla) => {
        if (dupla) {
          duplasMap.set(dupla.id, dupla);
          jogadorIdsSet.add(dupla.jogador1Id);
          jogadorIdsSet.add(dupla.jogador2Id);
        }
      });

      // Buscar etapaId da primeira partida válida
      const primeiraPartidaValida = partidas.find((p) => p !== null);
      const etapaId = primeiraPartidaValida?.etapaId || "";

      // Buscar todas as estatísticas dos jogadores de uma vez
      const jogadorIds = Array.from(jogadorIdsSet);
      const estatisticasMap = etapaId
        ? await estatisticasJogadorService.buscarPorJogadoresEtapa(
            jogadorIds,
            etapaId
          )
        : new Map();

      // Processar cada resultado

      // Preparar dados e validar
      const resultadosValidos: Array<{
        resultado: ResultadoPartidaLoteDTO;
        partida: Partida;
        dupla1: Dupla;
        dupla2: Dupla;
        isEdicao: boolean;
      }> = [];

      for (let i = 0; i < resultados.length; i++) {
        const resultado = resultados[i];
        const partida = partidas[i];

        if (!partida) {
          erros.push({
            partidaId: resultado.partidaId,
            erro: "Partida não encontrada",
          });
          continue;
        }

        const dupla1 = duplasMap.get(partida.dupla1Id);
        const dupla2 = duplasMap.get(partida.dupla2Id);

        if (!dupla1 || !dupla2) {
          erros.push({
            partidaId: resultado.partidaId,
            erro: "Duplas não encontradas",
          });
          continue;
        }

        const isEdicao = partida.status === StatusPartida.FINALIZADA;

        if (isEdicao && eliminatoriaGerada) {
          erros.push({
            partidaId: resultado.partidaId,
            erro: "Não é possível editar após gerar eliminatória",
          });
          continue;
        }

        resultadosValidos.push({
          resultado,
          partida,
          dupla1,
          dupla2,
          isEdicao,
        });

        if (partida.grupoId) {
          gruposParaRecalcular.add(partida.grupoId);
        }
      }

      // Reverter estatísticas de edições em paralelo
      const reversoes = resultadosValidos
        .filter(
          (r) => r.isEdicao && r.partida.placar && r.partida.placar.length > 0
        )
        .map((r) =>
          this.reverterEstatisticasComIncrement(
            r.partida,
            r.dupla1,
            r.dupla2,
            estatisticasMap
          )
        );

      if (reversoes.length > 0) {
        await Promise.all(reversoes);
      }

      // Aplicar novos resultados em paralelo
      const aplicacoes = resultadosValidos.map(
        async ({ resultado, partida, dupla1, dupla2 }) => {
          try {
            const stats = this.calcularEstatisticasPlacar(
              resultado.placar,
              partida.dupla1Id,
              partida.dupla2Id
            );

            const vencedoraNome = stats.dupla1Venceu
              ? `${dupla1.jogador1Nome} & ${dupla1.jogador2Nome}`
              : `${dupla2.jogador1Nome} & ${dupla2.jogador2Nome}`;

            await Promise.all([
              this.partidaRepo.registrarResultado(resultado.partidaId, {
                status: StatusPartida.FINALIZADA,
                setsDupla1: stats.setsDupla1,
                setsDupla2: stats.setsDupla2,
                placar: stats.placarComVencedor,
                vencedoraId: stats.vencedoraId,
                vencedoraNome: vencedoraNome,
              }),
              this.atualizarEstatisticasDuplaComIncrement(
                dupla1.id,
                stats,
                true
              ),
              this.atualizarEstatisticasDuplaComIncrement(
                dupla2.id,
                stats,
                false
              ),
              this.atualizarEstatisticasJogadoresComIncrement(
                dupla1,
                dupla2,
                stats,
                estatisticasMap
              ),
            ]);

            return { success: true, partidaId: resultado.partidaId };
          } catch (error: any) {
            return {
              success: false,
              partidaId: resultado.partidaId,
              erro: error.message || "Erro desconhecido",
            };
          }
        }
      );

      const resultadosAplicacao = await Promise.all(aplicacoes);

      for (const res of resultadosAplicacao) {
        if (res.success) {
          processados++;
        } else {
          erros.push({ partidaId: res.partidaId, erro: res.erro! });
        }
      }

      // Recalcular classificação de todos os grupos afetados em paralelo
      const gruposRecalculados: string[] = [];
      const recalcPromises = Array.from(gruposParaRecalcular).map(
        async (grupoId) => {
          try {
            await classificacaoService.recalcularClassificacaoGrupo(grupoId);
            gruposRecalculados.push(grupoId);
          } catch (error: any) {
            logger.error(
              "Erro ao recalcular classificação do grupo",
              { grupoId },
              error
            );
          }
        }
      );
      await Promise.all(recalcPromises);

      return {
        message:
          erros.length === 0
            ? `${processados} resultado(s) registrado(s) com sucesso`
            : `${processados} resultado(s) registrado(s), ${erros.length} erro(s)`,
        processados,
        erros,
        gruposRecalculados,
      };
    } catch (error: any) {
      logger.error(
        "Erro ao registrar resultados em lote",
        { total: resultados.length },
        error
      );
      throw error;
    }
  }

  /**
   * Reverter estatísticas usando FieldValue.increment (para operações em lote)
   */
  private async reverterEstatisticasComIncrement(
    partida: Partida,
    dupla1: Dupla,
    dupla2: Dupla,
    estatisticasMap: Map<string, any>
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

    // Obter estatisticaIds do map
    const est1A = estatisticasMap.get(dupla1.jogador1Id);
    const est1B = estatisticasMap.get(dupla1.jogador2Id);
    const est2A = estatisticasMap.get(dupla2.jogador1Id);
    const est2B = estatisticasMap.get(dupla2.jogador2Id);

    // Construir array de reversões apenas com IDs válidos
    const reversoes = [
      est1A && {
        estatisticaId: est1A.id,
        dto: {
          venceu: dupla1VenceuAntigo,
          setsVencidos: setsAntigo1,
          setsPerdidos: setsAntigo2,
          gamesVencidos: gamesAntigo1,
          gamesPerdidos: gamesPerdidosAntigo1,
        },
      },
      est1B && {
        estatisticaId: est1B.id,
        dto: {
          venceu: dupla1VenceuAntigo,
          setsVencidos: setsAntigo1,
          setsPerdidos: setsAntigo2,
          gamesVencidos: gamesAntigo1,
          gamesPerdidos: gamesPerdidosAntigo1,
        },
      },
      est2A && {
        estatisticaId: est2A.id,
        dto: {
          venceu: !dupla1VenceuAntigo,
          setsVencidos: setsAntigo2,
          setsPerdidos: setsAntigo1,
          gamesVencidos: gamesAntigo2,
          gamesPerdidos: gamesPerdidosAntigo2,
        },
      },
      est2B && {
        estatisticaId: est2B.id,
        dto: {
          venceu: !dupla1VenceuAntigo,
          setsVencidos: setsAntigo2,
          setsPerdidos: setsAntigo1,
          gamesVencidos: gamesAntigo2,
          gamesPerdidos: gamesPerdidosAntigo2,
        },
      },
    ].filter(Boolean) as Array<{ estatisticaId: string; dto: any }>;

    // Reverter em paralelo usando increment
    await Promise.all([
      // Reverter dupla 1
      this.duplaRepo.atualizarEstatisticasComIncrement(dupla1.id, {
        jogos: -1,
        vitorias: dupla1VenceuAntigo ? -1 : 0,
        derrotas: dupla1VenceuAntigo ? 0 : -1,
        pontos: dupla1VenceuAntigo ? -3 : 0,
        setsVencidos: -setsAntigo1,
        setsPerdidos: -setsAntigo2,
        gamesVencidos: -gamesAntigo1,
        gamesPerdidos: -gamesPerdidosAntigo1,
        saldoSets: -(setsAntigo1 - setsAntigo2),
        saldoGames: -(gamesAntigo1 - gamesPerdidosAntigo1),
      }),
      // Reverter dupla 2
      this.duplaRepo.atualizarEstatisticasComIncrement(dupla2.id, {
        jogos: -1,
        vitorias: !dupla1VenceuAntigo ? -1 : 0,
        derrotas: !dupla1VenceuAntigo ? 0 : -1,
        pontos: !dupla1VenceuAntigo ? -3 : 0,
        setsVencidos: -setsAntigo2,
        setsPerdidos: -setsAntigo1,
        gamesVencidos: -gamesAntigo2,
        gamesPerdidos: -gamesPerdidosAntigo2,
        saldoSets: -(setsAntigo2 - setsAntigo1),
        saldoGames: -(gamesAntigo2 - gamesPerdidosAntigo2),
      }),
      // Reverter jogadores
      estatisticasJogadorService.reverterAposPartidaComIncrement(reversoes),
    ]);
  }

  /**
   * Atualizar estatísticas da dupla usando FieldValue.increment
   */
  private async atualizarEstatisticasDuplaComIncrement(
    duplaId: string,
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

    await this.duplaRepo.atualizarEstatisticasComIncrement(duplaId, {
      jogos: 1,
      vitorias: venceu ? 1 : 0,
      derrotas: venceu ? 0 : 1,
      pontos: venceu ? 3 : 0,
      setsVencidos,
      setsPerdidos,
      gamesVencidos,
      gamesPerdidos,
      saldoSets: setsVencidos - setsPerdidos,
      saldoGames: gamesVencidos - gamesPerdidos,
    });
  }

  /**
   * Atualizar estatísticas dos jogadores usando FieldValue.increment
   */
  private async atualizarEstatisticasJogadoresComIncrement(
    dupla1: Dupla,
    dupla2: Dupla,
    stats: ReturnType<typeof this.calcularEstatisticasPlacar>,
    estatisticasMap: Map<string, any>
  ): Promise<void> {
    // Obter estatisticaIds do map
    const est1A = estatisticasMap.get(dupla1.jogador1Id);
    const est1B = estatisticasMap.get(dupla1.jogador2Id);
    const est2A = estatisticasMap.get(dupla2.jogador1Id);
    const est2B = estatisticasMap.get(dupla2.jogador2Id);

    // Construir array de atualizações apenas com IDs válidos
    const atualizacoes = [
      est1A && {
        estatisticaId: est1A.id,
        dto: {
          venceu: stats.dupla1Venceu,
          setsVencidos: stats.setsDupla1,
          setsPerdidos: stats.setsDupla2,
          gamesVencidos: stats.gamesVencidosDupla1,
          gamesPerdidos: stats.gamesPerdidosDupla1,
        },
      },
      est1B && {
        estatisticaId: est1B.id,
        dto: {
          venceu: stats.dupla1Venceu,
          setsVencidos: stats.setsDupla1,
          setsPerdidos: stats.setsDupla2,
          gamesVencidos: stats.gamesVencidosDupla1,
          gamesPerdidos: stats.gamesPerdidosDupla1,
        },
      },
      est2A && {
        estatisticaId: est2A.id,
        dto: {
          venceu: !stats.dupla1Venceu,
          setsVencidos: stats.setsDupla2,
          setsPerdidos: stats.setsDupla1,
          gamesVencidos: stats.gamesVencidosDupla2,
          gamesPerdidos: stats.gamesPerdidosDupla2,
        },
      },
      est2B && {
        estatisticaId: est2B.id,
        dto: {
          venceu: !stats.dupla1Venceu,
          setsVencidos: stats.setsDupla2,
          setsPerdidos: stats.setsDupla1,
          gamesVencidos: stats.gamesVencidosDupla2,
          gamesPerdidos: stats.gamesPerdidosDupla2,
        },
      },
    ].filter(Boolean) as Array<{ estatisticaId: string; dto: any }>;

    await estatisticasJogadorService.atualizarAposPartidaGrupoComIncrement(
      atualizacoes
    );
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
