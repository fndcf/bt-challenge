/**
 * Service para gerenciar estatísticas individuais de jogadores
 */

import {
  AtualizarEstatisticasPartidaDTO,
  CriarEstatisticasJogadorDTO,
  EstatisticasJogador,
} from "../models/EstatisticasJogador";
import { estatisticasJogadorRepository } from "../repositories/firebase/EstatisticasJogadorRepository";
import { etapaRepository } from "../repositories/firebase/EtapaRepository";
import { IEstatisticasJogadorRepository } from "../repositories/interfaces/IEstatisticasJogadorRepository";
import { IEtapaRepository } from "../repositories/interfaces/IEtapaRepository";
import {
  grupoDaPartida,
  inverter,
  JogadorRanking,
  montarRanking,
  somarEtapas,
  TotaisDaPartida,
  totaisDaPartida,
} from "../utils/estatisticas";
import logger from "../utils/logger";

/** Resultado de uma partida para uma estatística já conhecida */
interface PartidaPorEstatistica {
  estatisticaId: string;
  dto: AtualizarEstatisticasPartidaDTO;
}

export interface EstatisticasAgregadas extends JogadorRanking {
  arenaId: string;
  nivel?: string;
  /** 0 quando não está no ranking */
  posicaoRanking: number;
}

export class EstatisticasJogadorService {
  constructor(
    private estatisticas: IEstatisticasJogadorRepository = estatisticasJogadorRepository,
    private etapas: IEtapaRepository = etapaRepository
  ) {}

  /** Registra o erro com o contexto e repassa */
  private async executar<T>(
    acao: string,
    contexto: Record<string, unknown>,
    operacao: () => Promise<T>
  ): Promise<T> {
    try {
      return await operacao();
    } catch (error) {
      logger.error(`Erro ao ${acao}`, contexto, error as Error);
      throw error;
    }
  }

  /**
   * Faz a operação com a estatística do jogador na etapa. Sem estatística,
   * só avisa no log.
   */
  private async comEstatistica(
    acao: string,
    jogadorId: string,
    etapaId: string,
    operacao: (estatistica: EstatisticasJogador) => Promise<void>
  ): Promise<void> {
    const contexto = { jogadorId, etapaId };

    await this.executar(acao, contexto, async () => {
      const estatistica = await this.buscarPorJogadorEtapa(jogadorId, etapaId);

      if (!estatistica) {
        logger.warn(`Estatísticas não encontradas para ${acao}`, contexto);
        return;
      }

      await operacao(estatistica);
    });
  }

  // ==================== CRIAR ====================

  /**
   * Criar estatísticas iniciais para um jogador
   */
  async criar(dto: CriarEstatisticasJogadorDTO): Promise<EstatisticasJogador> {
    return this.executar(
      "criar estatísticas de jogador",
      { etapaId: dto.etapaId, jogadorId: dto.jogadorId },
      () => this.estatisticas.criar(dto)
    );
  }

  /**
   * Criar estatísticas em lote
   */
  async criarEmLote(
    dtos: CriarEstatisticasJogadorDTO[]
  ): Promise<EstatisticasJogador[]> {
    return this.executar(
      "criar estatísticas em lote",
      { quantidade: dtos.length },
      () => this.estatisticas.criarEmLote(dtos)
    );
  }

  // ==================== BUSCAR ====================

  /**
   * Buscar estatísticas de um jogador em uma etapa
   */
  async buscarPorJogadorEtapa(
    jogadorId: string,
    etapaId: string
  ): Promise<EstatisticasJogador | null> {
    return this.estatisticas.buscarPorJogadorEEtapa(jogadorId, etapaId);
  }

  /**
   * Buscar estatísticas de vários jogadores de uma etapa, por id do jogador
   */
  async buscarPorJogadoresEtapa(
    jogadorIds: string[],
    etapaId: string
  ): Promise<Map<string, EstatisticasJogador>> {
    const estatisticas = await this.estatisticas.buscarPorJogadoresDaEtapa(
      jogadorIds,
      etapaId
    );

    return new Map(estatisticas.map((e) => [e.jogadorId, e]));
  }

  /**
   * Buscar estatísticas de um grupo
   */
  async buscarPorGrupo(grupoId: string): Promise<EstatisticasJogador[]> {
    return this.estatisticas.buscarPorGrupo(grupoId);
  }

  /**
   * Buscar jogadores classificados de um grupo
   */
  async buscarClassificados(
    grupoId: string,
    limite: number = 2
  ): Promise<EstatisticasJogador[]> {
    return this.estatisticas.buscarClassificados(grupoId, limite);
  }

  // ==================== PARTIDAS ====================

  /**
   * Somar uma partida nos totais do jogador
   */
  async atualizarAposPartida(
    jogadorId: string,
    etapaId: string,
    dto: AtualizarEstatisticasPartidaDTO
  ): Promise<void> {
    await this.comEstatistica(
      "atualizar estatísticas após partida",
      jogadorId,
      etapaId,
      ({ id }) =>
        this.estatisticas.incrementarEmLote([
          { id, incrementos: totaisDaPartida(dto) },
        ])
    );
  }

  /**
   * Tirar uma partida dos totais do jogador
   */
  async reverterAposPartida(
    jogadorId: string,
    etapaId: string,
    dto: AtualizarEstatisticasPartidaDTO
  ): Promise<void> {
    await this.comEstatistica(
      "reverter estatísticas",
      jogadorId,
      etapaId,
      ({ id }) =>
        this.estatisticas.incrementarEmLote([
          { id, incrementos: inverter(totaisDaPartida(dto)) },
        ])
    );
  }

  /**
   * Somar uma partida da eliminatória nos totais do jogador
   */
  async atualizarAposPartidaEliminatoria(
    jogadorId: string,
    etapaId: string,
    dto: AtualizarEstatisticasPartidaDTO
  ): Promise<void> {
    await this.atualizarAposPartida(jogadorId, etapaId, dto);
  }

  /**
   * Tirar uma partida da eliminatória dos totais, sem deixar contagem negativa
   */
  async reverterAposPartidaEliminatoria(
    jogadorId: string,
    etapaId: string,
    dto: AtualizarEstatisticasPartidaDTO
  ): Promise<void> {
    await this.comEstatistica(
      "reverter estatísticas eliminatória",
      jogadorId,
      etapaId,
      async (estatistica) => {
        const partida = totaisDaPartida(dto);
        const dados = Object.fromEntries(
          (Object.keys(partida) as (keyof TotaisDaPartida)[]).map((campo) => {
            const valor = (estatistica[campo] || 0) - partida[campo];
            return [
              campo,
              campo.startsWith("saldo") ? valor : Math.max(0, valor),
            ];
          })
        );

        await this.estatisticas.atualizarEmLote([
          { id: estatistica.id, dados },
        ]);
      }
    );
  }

  /**
   * Somar partidas só nos totais (Teams, que não tem grupo individual)
   */
  async atualizarAposPartidaComIncrement(
    atualizacoes: PartidaPorEstatistica[]
  ): Promise<void> {
    await this.executar(
      "atualizar estatísticas TEAMS com increment",
      { quantidade: atualizacoes.length },
      () =>
        this.estatisticas.incrementarEmLote(
          atualizacoes.map(({ estatisticaId, dto }) => ({
            id: estatisticaId,
            incrementos: totaisDaPartida(dto),
          }))
        )
    );
  }

  /**
   * Tirar partidas só dos totais (Teams, que não tem grupo individual)
   */
  async reverterTotaisComIncrement(
    reversoes: PartidaPorEstatistica[]
  ): Promise<void> {
    await this.executar(
      "reverter estatísticas TEAMS com increment",
      { quantidade: reversoes.length },
      () =>
        this.estatisticas.incrementarEmLote(
          reversoes.map(({ estatisticaId, dto }) => ({
            id: estatisticaId,
            incrementos: inverter(totaisDaPartida(dto)),
          }))
        )
    );
  }

  /**
   * Somar partidas nos totais e na classificação do grupo
   */
  async atualizarAposPartidaGrupoComIncrement(
    atualizacoes: PartidaPorEstatistica[]
  ): Promise<void> {
    await this.executar(
      "atualizar estatísticas com increment",
      { quantidade: atualizacoes.length },
      () =>
        this.estatisticas.incrementarEmLote(
          atualizacoes.map(({ estatisticaId, dto }) => ({
            id: estatisticaId,
            incrementos: { ...grupoDaPartida(dto), ...totaisDaPartida(dto) },
          }))
        )
    );
  }

  /**
   * Tirar partidas dos totais e da classificação do grupo
   */
  async reverterAposPartidaComIncrement(
    reversoes: PartidaPorEstatistica[]
  ): Promise<void> {
    await this.executar(
      "reverter estatísticas com increment",
      { quantidade: reversoes.length },
      () =>
        this.estatisticas.incrementarEmLote(
          reversoes.map(({ estatisticaId, dto }) => ({
            id: estatisticaId,
            incrementos: inverter({
              ...grupoDaPartida(dto),
              ...totaisDaPartida(dto),
            }),
          }))
        )
    );
  }

  // ==================== GRUPO E CLASSIFICAÇÃO ====================

  /**
   * Atualizar grupo de vários jogadores, pelo id da estatística
   */
  async atualizarGrupoEmLotePorId(
    atualizacoes: Array<{
      estatisticaId: string;
      grupoId: string;
      grupoNome: string;
    }>
  ): Promise<void> {
    await this.executar(
      "atualizar grupos em lote",
      { quantidade: atualizacoes.length },
      () =>
        this.estatisticas.atualizarEmLote(
          atualizacoes.map(({ estatisticaId, grupoId, grupoNome }) => ({
            id: estatisticaId,
            dados: { grupoId, grupoNome },
          }))
        )
    );
  }

  /**
   * Atualizar grupo de vários jogadores, pelo id do jogador.
   * Tendo o id da estatística, use atualizarGrupoEmLotePorId.
   */
  async atualizarGrupoEmLote(
    atualizacoes: Array<{
      jogadorId: string;
      etapaId: string;
      grupoId: string;
      grupoNome: string;
    }>
  ): Promise<void> {
    await this.executar(
      "atualizar grupos em lote",
      { quantidade: atualizacoes.length },
      async () => {
        const ids = await this.buscarIds(atualizacoes);

        await this.estatisticas.atualizarEmLote(
          atualizacoes.flatMap(({ grupoId, grupoNome }, i) => {
            const id = ids[i];
            return id ? [{ id, dados: { grupoId, grupoNome } }] : [];
          })
        );
      }
    );
  }

  /**
   * Atualizar a posição no grupo de vários jogadores
   */
  async atualizarPosicoesGrupoEmLote(
    atualizacoes: Array<{ estatisticaId: string; posicaoGrupo: number }>
  ): Promise<void> {
    await this.executar(
      "atualizar posições em lote",
      { quantidade: atualizacoes.length },
      () =>
        this.estatisticas.atualizarEmLote(
          atualizacoes.map(({ estatisticaId, posicaoGrupo }) => ({
            id: estatisticaId,
            dados: { posicaoGrupo },
          }))
        )
    );
  }

  /**
   * Atualizar posição no grupo
   */
  async atualizarPosicaoGrupo(
    jogadorId: string,
    etapaId: string,
    posicaoGrupo: number
  ): Promise<void> {
    await this.comEstatistica(
      "atualizar posição no grupo",
      jogadorId,
      etapaId,
      ({ id }) =>
        this.estatisticas.atualizarEmLote([{ id, dados: { posicaoGrupo } }])
    );
  }

  /**
   * Marcar jogador como classificado
   */
  async marcarComoClassificado(
    jogadorId: string,
    etapaId: string,
    classificado: boolean
  ): Promise<void> {
    await this.comEstatistica(
      "marcar como classificado",
      jogadorId,
      etapaId,
      ({ id }) =>
        this.estatisticas.atualizarEmLote([{ id, dados: { classificado } }])
    );
  }

  /**
   * Marcar vários jogadores como classificados
   */
  async marcarComoClassificadoEmLote(
    jogadores: Array<{ jogadorId: string; etapaId: string }>,
    classificado: boolean
  ): Promise<void> {
    await this.executar(
      "marcar classificados em lote",
      { total: jogadores.length },
      async () => {
        const ids = (await this.buscarIds(jogadores)).filter(
          (id): id is string => id !== undefined
        );

        if (ids.length < jogadores.length) {
          logger.warn("Classificados sem estatísticas", {
            total: jogadores.length,
            encontrados: ids.length,
          });
        }

        await this.estatisticas.atualizarEmLote(
          ids.map((id) => ({ id, dados: { classificado } }))
        );
      }
    );
  }

  /** Id da estatística de cada jogador, na mesma ordem */
  private async buscarIds(
    jogadores: Array<{ jogadorId: string; etapaId: string }>
  ): Promise<(string | undefined)[]> {
    const encontradas = await Promise.all(
      jogadores.map((j) => this.buscarPorJogadorEtapa(j.jogadorId, j.etapaId))
    );

    return encontradas.map((e) => e?.id);
  }

  // ==================== RANKING ====================

  /**
   * Ranking de um nível. Os pontos ficam separados por nível: quem muda de
   * categoria começa do zero na nova. Só contam pontos as etapas com
   * contaPontosRanking.
   */
  async buscarRankingPorNivel(
    arenaId: string,
    nivel: string,
    limite: number = 50
  ): Promise<JogadorRanking[]> {
    const etapasQueContam = await this.etapas.buscarIdsQueContamPontos(arenaId);
    const ranking = await this.montarRankingDoNivel(
      arenaId,
      nivel,
      etapasQueContam
    );

    return ranking.slice(0, limite);
  }

  private async montarRankingDoNivel(
    arenaId: string,
    nivel: string,
    etapasQueContam: Set<string>
  ): Promise<JogadorRanking[]> {
    return montarRanking(
      await this.estatisticas.buscarPorArena(arenaId, nivel),
      (etapaId) => etapasQueContam.has(etapaId)
    );
  }

  /**
   * Ranking com todos os níveis somados
   *
   * @deprecated Use buscarRankingPorNivel: somar os níveis é injusto quando um
   * jogador muda de categoria.
   */
  async buscarRankingGlobalAgregado(
    arenaId: string,
    limite: number = 50
  ): Promise<JogadorRanking[]> {
    const estatisticas = await this.estatisticas.buscarPorArena(arenaId);

    return montarRanking(estatisticas).slice(0, limite);
  }

  /**
   * Totais do jogador em um nível, com a posição no ranking do nível
   */
  async buscarEstatisticasAgregadasPorNivel(
    jogadorId: string,
    arenaId: string,
    nivel: string
  ): Promise<EstatisticasAgregadas | null> {
    const todas = await this.estatisticas.buscarPorJogador(jogadorId, arenaId);
    const doNivel = todas.filter((e) => e.jogadorNivel === nivel);

    if (doNivel.length === 0) return null;

    const etapasQueContam = await this.etapas.buscarIdsQueContamPontos(arenaId);
    const ranking = await this.montarRankingDoNivel(
      arenaId,
      nivel,
      etapasQueContam
    );

    return {
      ...this.agregar(doNivel, ranking, (id) => etapasQueContam.has(id)),
      nivel,
    };
  }

  /**
   * Totais do jogador com todos os níveis somados
   *
   * @deprecated Use buscarEstatisticasAgregadasPorNivel
   */
  async buscarEstatisticasAgregadas(
    jogadorId: string,
    arenaId: string
  ): Promise<EstatisticasAgregadas | null> {
    const todas = await this.estatisticas.buscarPorJogador(jogadorId, arenaId);

    if (todas.length === 0) return null;

    return this.agregar(todas, await this.buscarRankingGlobalAgregado(arenaId, 999));
  }

  private agregar(
    estatisticas: EstatisticasJogador[],
    ranking: JogadorRanking[],
    contaPontos?: (etapaId: string) => boolean
  ): EstatisticasAgregadas {
    const { jogadorId, jogadorNome, jogadorNivel, jogadorGenero, arenaId } =
      estatisticas[estatisticas.length - 1];
    const totais = somarEtapas(estatisticas, contaPontos);

    return {
      jogadorId,
      jogadorNome,
      jogadorNivel,
      jogadorGenero,
      arenaId,
      ...totais,
      saldoSets: totais.setsVencidos - totais.setsPerdidos,
      saldoGames: totais.gamesVencidos - totais.gamesPerdidos,
      posicaoRanking: ranking.findIndex((j) => j.jogadorId === jogadorId) + 1,
    };
  }
}

export default new EstatisticasJogadorService();
