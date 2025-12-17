/**
 * TeamsService - Orquestrador (Façade Pattern)
 *
 * Este service foi refatorado seguindo SOLID principles:
 * - SRP: Cada responsabilidade foi extraída para um service especializado
 * - OCP: Strategy Pattern para fase eliminatória (extensível sem modificação)
 * - ISP: Interfaces segregadas por responsabilidade
 *
 * Services especializados:
 * - TeamsEquipeService: Formação e gerenciamento de equipes
 * - TeamsConfrontoService: Geração de confrontos (round-robin, grupos, eliminatórias)
 * - TeamsPartidaService: Geração de partidas e definição de jogadores
 * - TeamsResultadoService: Registro de resultados e estatísticas
 * - TeamsClassificacaoService: Classificação e preenchimento de eliminatórias
 */

import {
  Equipe,
  ConfrontoEquipe,
  PartidaTeams,
  FormacaoManualEquipeDTO,
  DefinirPartidasManualDTO,
  TipoFormacaoJogos,
  RegistrarResultadoTeamsDTO,
  SetPlacarTeams,
} from "../models/Teams";
import { Etapa, StatusEtapa, FaseEtapa } from "../models/Etapa";
import { NivelJogador, GeneroJogador } from "../models/Jogador";
import { IEquipeRepository } from "../repositories/interfaces/IEquipeRepository";
import { IConfrontoEquipeRepository } from "../repositories/interfaces/IConfrontoEquipeRepository";
import { IPartidaTeamsRepository } from "../repositories/interfaces/IPartidaTeamsRepository";
import EquipeRepository from "../repositories/firebase/EquipeRepository";
import ConfrontoEquipeRepository from "../repositories/firebase/ConfrontoEquipeRepository";
import PartidaTeamsRepository from "../repositories/firebase/PartidaTeamsRepository";
import { EstatisticasJogadorService } from "./EstatisticasJogadorService";
import logger from "../utils/logger";

// Import dos services especializados
import {
  TeamsEquipeService,
  ITeamsEquipeService,
} from "./teams/TeamsEquipeService";
import {
  TeamsConfrontoService,
  ITeamsConfrontoService,
} from "./teams/TeamsConfrontoService";
import { TeamsPartidaService } from "./teams/TeamsPartidaService";
import { TeamsResultadoService } from "./teams/TeamsResultadoService";
import { TeamsClassificacaoService } from "./teams/TeamsClassificacaoService";
import { IEtapaRepository } from "../repositories/interfaces/IEtapaRepository";
import { EtapaRepository } from "../repositories/firebase/EtapaRepository";

interface Inscricao {
  jogadorId: string;
  jogadorNome: string;
  nivel: NivelJogador;
  genero: GeneroJogador;
}

export class TeamsService {
  private equipeService: ITeamsEquipeService;
  private confrontoService: ITeamsConfrontoService;
  private partidaService: TeamsPartidaService;
  private resultadoService: TeamsResultadoService;
  private classificacaoService: TeamsClassificacaoService;

  constructor(
    private equipeRepository: IEquipeRepository = EquipeRepository,
    private confrontoRepository: IConfrontoEquipeRepository = ConfrontoEquipeRepository,
    private partidaRepository: IPartidaTeamsRepository = PartidaTeamsRepository,
    private estatisticasService: EstatisticasJogadorService = new EstatisticasJogadorService(),
    etapaRepository: IEtapaRepository = new EtapaRepository()
  ) {
    // Criar services especializados com os repositórios injetados
    // Isso garante que os testes que mockam repositórios funcionem corretamente
    this.equipeService = new TeamsEquipeService(
      equipeRepository,
      estatisticasService
    );

    this.confrontoService = new TeamsConfrontoService(
      confrontoRepository,
      equipeRepository
    );

    this.partidaService = new TeamsPartidaService(
      partidaRepository,
      equipeRepository,
      confrontoRepository
    );

    this.classificacaoService = new TeamsClassificacaoService(
      confrontoRepository,
      equipeRepository
    );

    this.resultadoService = new TeamsResultadoService(
      partidaRepository,
      confrontoRepository,
      equipeRepository,
      estatisticasService,
      etapaRepository
    );

    // Configurar dependências circulares
    this.resultadoService.setPartidaService(this.partidaService);
    this.resultadoService.setClassificacaoService(this.classificacaoService);
  }

  // ==================== FORMAÇÃO DE EQUIPES ====================

  /**
   * Gera equipes automaticamente baseado no tipo de formação
   */
  async gerarEquipes(
    etapa: Etapa,
    inscricoes: Inscricao[]
  ): Promise<{
    equipes: Equipe[];
    estatisticas: any[];
    temFaseGrupos: boolean;
  }> {
    return this.equipeService.gerarEquipes(etapa, inscricoes);
  }

  /**
   * Forma equipes manualmente com jogadores específicos
   */
  async formarEquipesManualmente(
    etapa: Etapa,
    inscricoes: Inscricao[],
    formacoes: FormacaoManualEquipeDTO[]
  ): Promise<{
    equipes: Equipe[];
    estatisticas: any[];
    temFaseGrupos: boolean;
  }> {
    return this.equipeService.formarEquipesManualmente(
      etapa,
      inscricoes,
      formacoes
    );
  }

  // ==================== CONFRONTOS ====================

  /**
   * Gera confrontos round-robin entre equipes
   * Também gera partidas para confrontos da fase de grupos (quando não é MANUAL)
   */
  async gerarConfrontos(
    etapa: Etapa,
    tipoFormacaoJogos: TipoFormacaoJogos = TipoFormacaoJogos.SORTEIO,
    equipesJaCriadas?: Equipe[]
  ): Promise<ConfrontoEquipe[]> {
    // 1. Gerar confrontos
    const confrontos = await this.confrontoService.gerarConfrontos(
      etapa,
      tipoFormacaoJogos,
      equipesJaCriadas
    );

    // 2. Gerar partidas para confrontos da fase de grupos (mantém comportamento original)
    const tipoFormacao = etapa.tipoFormacaoJogos || TipoFormacaoJogos.SORTEIO;
    if (tipoFormacao !== TipoFormacaoJogos.MANUAL) {
      // Buscar equipes se não foram passadas
      const equipes =
        equipesJaCriadas ||
        (await this.equipeRepository.buscarPorEtapaOrdenadas(
          etapa.id,
          etapa.arenaId
        ));

      // Criar map de equipes para lookup
      const equipesMap = new Map(equipes.map((e) => [e.id, e]));

      // Filtrar confrontos da fase de grupos com equipes definidas
      const confrontosComEquipes = confrontos.filter(
        (c) => c.equipe1Id && c.equipe2Id && c.fase === FaseEtapa.GRUPOS
      );

      // Gerar partidas em batch
      if (confrontosComEquipes.length > 0) {
        await this.partidaService.gerarPartidasParaConfrontosBatch(
          confrontosComEquipes,
          etapa,
          equipesMap
        );
      }
    }

    return confrontos;
  }

  // ==================== PARTIDAS ====================

  /**
   * Gera partidas para um confronto
   */
  async gerarPartidasConfronto(
    confronto: ConfrontoEquipe,
    etapa: Etapa
  ): Promise<PartidaTeams[]> {
    return this.partidaService.gerarPartidasConfronto(confronto, etapa);
  }

  /**
   * Define partidas manualmente para um confronto
   */
  async definirPartidasManualmente(
    confronto: ConfrontoEquipe,
    etapa: Etapa,
    definicao: DefinirPartidasManualDTO
  ): Promise<PartidaTeams[]> {
    return this.partidaService.definirPartidasManualmente(
      confronto,
      etapa,
      definicao
    );
  }

  /**
   * Define jogadores específicos para uma partida
   */
  async definirJogadoresPartida(
    partidaId: string,
    arenaId: string,
    dupla1JogadorIds: [string, string],
    dupla2JogadorIds: [string, string]
  ): Promise<PartidaTeams> {
    return this.partidaService.definirJogadoresPartida(
      partidaId,
      arenaId,
      dupla1JogadorIds,
      dupla2JogadorIds
    );
  }

  /**
   * Gera partida decider para confronto empatado
   */
  async gerarDecider(
    confronto: ConfrontoEquipe,
    etapa: Etapa
  ): Promise<PartidaTeams> {
    return this.partidaService.gerarDecider(confronto, etapa);
  }

  // ==================== RESULTADOS ====================

  /**
   * Registra resultado de uma partida
   */
  async registrarResultadoPartida(
    partidaId: string,
    arenaId: string,
    dto: RegistrarResultadoTeamsDTO
  ): Promise<{
    partida: PartidaTeams;
    confronto: ConfrontoEquipe;
    precisaDecider: boolean;
    confrontoFinalizado: boolean;
  }> {
    return this.resultadoService.registrarResultadoPartida(
      partidaId,
      arenaId,
      dto
    );
  }

  /**
   * Registra resultados de múltiplas partidas em lote
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
    return this.resultadoService.registrarResultadosEmLote(
      etapaId,
      arenaId,
      resultados
    );
  }

  // ==================== CLASSIFICAÇÃO ====================

  /**
   * Recalcula classificação das equipes
   */
  async recalcularClassificacao(
    etapaId: string,
    arenaId: string
  ): Promise<Equipe[]> {
    return this.classificacaoService.recalcularClassificacao(etapaId, arenaId);
  }

  // ==================== BUSCAR ====================

  /**
   * Busca equipes de uma etapa
   */
  async buscarEquipes(etapaId: string, arenaId: string): Promise<Equipe[]> {
    return this.equipeService.buscarEquipes(etapaId, arenaId);
  }

  /**
   * Busca confrontos de uma etapa
   */
  async buscarConfrontos(
    etapaId: string,
    arenaId: string
  ): Promise<ConfrontoEquipe[]> {
    return this.confrontoService.buscarConfrontos(etapaId, arenaId);
  }

  /**
   * Busca partidas de um confronto
   */
  async buscarPartidasConfronto(confrontoId: string): Promise<PartidaTeams[]> {
    return this.partidaService.buscarPartidasConfronto(confrontoId);
  }

  /**
   * Renomeia uma equipe
   */
  async renomearEquipe(
    equipeId: string,
    novoNome: string,
    arenaId: string
  ): Promise<void> {
    return this.equipeService.renomearEquipe(equipeId, novoNome, arenaId);
  }

  // ==================== CANCELAR / RESETAR ====================

  /**
   * Reseta todas as partidas e resultados, mantendo equipes e confrontos
   * Volta ao estado inicial após "Gerar Equipes"
   */
  async resetarPartidas(etapaId: string, arenaId: string): Promise<void> {
    // Deletar todas as partidas
    await this.partidaRepository.deletarPorEtapa(etapaId, arenaId);

    // Deletar estatísticas de jogadores desta etapa
    const { estatisticasJogadorRepository } = await import(
      "../repositories/firebase/EstatisticasJogadorRepository"
    );
    await estatisticasJogadorRepository.deletarPorEtapa(etapaId, arenaId);

    // Resetar contadores dos confrontos (usando método específico que remove vencedoraId/vencedoraNome)
    const confrontos = await this.confrontoRepository.buscarPorEtapa(
      etapaId,
      arenaId
    );
    for (const confronto of confrontos) {
      await this.confrontoRepository.resetarConfronto(confronto.id);
    }

    // Resetar estatísticas das equipes e recriar estatísticas dos jogadores
    const equipes = await this.equipeRepository.buscarPorEtapa(
      etapaId,
      arenaId
    );
    for (const equipe of equipes) {
      await this.equipeRepository.atualizar(equipe.id, {
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
      });

      // Recriar estatísticas para cada jogador da equipe
      for (const jogador of equipe.jogadores) {
        await this.estatisticasService.criar({
          etapaId,
          arenaId,
          jogadorId: jogador.id,
          jogadorNome: jogador.nome,
          jogadorNivel: jogador.nivel,
          jogadorGenero: jogador.genero,
          grupoId: equipe.id,
          grupoNome: equipe.nome,
        });
      }
    }

    logger.info("Partidas TEAMS resetadas", { etapaId, arenaId });
  }

  /**
   * Cancela chaves, deletando equipes, confrontos, partidas e estatísticas
   */
  async cancelarChaves(etapaId: string, arenaId: string): Promise<void> {
    const timings: Record<string, number> = {};
    const startTotal = Date.now();

    // Import necessário para estatísticas
    const { estatisticasJogadorRepository } = await import(
      "../repositories/firebase/EstatisticasJogadorRepository"
    );

    // Executar todas as deleções em paralelo (são independentes)
    const startParalelo = Date.now();
    const [
      partidasResult,
      confrontosResult,
      equipesResult,
      estatisticasResult,
    ] = await Promise.all([
      (async () => {
        const start = Date.now();
        await this.partidaRepository.deletarPorEtapa(etapaId, arenaId);
        return Date.now() - start;
      })(),
      (async () => {
        const start = Date.now();
        await this.confrontoRepository.deletarPorEtapa(etapaId, arenaId);
        return Date.now() - start;
      })(),
      (async () => {
        const start = Date.now();
        await this.equipeRepository.deletarPorEtapa(etapaId, arenaId);
        return Date.now() - start;
      })(),
      (async () => {
        const start = Date.now();
        await estatisticasJogadorRepository.deletarPorEtapa(etapaId, arenaId);
        return Date.now() - start;
      })(),
    ]);

    timings["deletarPartidas"] = partidasResult;
    timings["deletarConfrontos"] = confrontosResult;
    timings["deletarEquipes"] = equipesResult;
    timings["deletarEstatisticas"] = estatisticasResult;
    timings["deletarTodos_PARALELO"] = Date.now() - startParalelo;

    // Atualizar etapa para refletir que chaves foram canceladas
    const start = Date.now();
    const { db } = await import("../config/firebase");
    const { Timestamp } = await import("firebase-admin/firestore");
    await db.collection("etapas").doc(etapaId).update({
      chavesGeradas: false,
      status: StatusEtapa.INSCRICOES_ENCERRADAS,
      atualizadoEm: Timestamp.now(),
    });
    timings["atualizarEtapa"] = Date.now() - start;

    timings["TOTAL"] = Date.now() - startTotal;
    logger.info("⏱️ TIMING cancelarChaves TEAMS", {
      timings,
      etapaId,
      arenaId,
    });
    logger.info("Chaves TEAMS canceladas", { etapaId, arenaId });
  }
}

export default new TeamsService();
