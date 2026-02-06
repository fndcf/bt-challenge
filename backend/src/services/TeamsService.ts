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
  StatusConfronto,
  JogadorEquipe,
} from "../models/Teams";
import { Jogador } from "../models/Jogador";
import { BadRequestError } from "../utils/errors";
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
    // Gerar confrontos
    const confrontos = await this.confrontoService.gerarConfrontos(
      etapa,
      tipoFormacaoJogos,
      equipesJaCriadas
    );

    // Gerar partidas para confrontos da fase de grupos (mantém comportamento original)
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

  // ==================== SUBSTITUIÇÃO ====================

  /**
   * Substitui um jogador em uma equipe
   * Só permitido se nenhum confronto foi iniciado
   */
  async substituirJogador(
    etapaId: string,
    arenaId: string,
    jogadorAntigoId: string,
    jogadorNovo: Jogador
  ): Promise<void> {
    logger.info("Iniciando substituição de jogador no formato TEAMS", {
      etapaId,
      arenaId,
      jogadorAntigoId,
      jogadorNovoId: jogadorNovo.id,
    });

    // 1. Encontrar equipe que contém o jogador antigo
    const equipes = await this.equipeRepository.buscarPorEtapa(etapaId, arenaId);
    const equipeComJogador = equipes.find((e) =>
      e.jogadores.some((j) => j.id === jogadorAntigoId)
    );

    if (!equipeComJogador) {
      throw new BadRequestError("Jogador não encontrado em nenhuma equipe desta etapa");
    }

    // 2. Verificar se nenhum confronto foi iniciado
    const confrontos = await this.confrontoRepository.buscarPorEtapa(etapaId, arenaId);
    const algumConfrontoIniciado = confrontos.some(
      (c) => c.status !== StatusConfronto.AGENDADO
    );

    if (algumConfrontoIniciado) {
      throw new BadRequestError(
        "Não é possível substituir jogador após início de algum confronto"
      );
    }

    // 3. Encontrar o jogador antigo na equipe para pegar seus dados
    const jogadorAntigo = equipeComJogador.jogadores.find(
      (j) => j.id === jogadorAntigoId
    )!;

    // 4. Criar novo JogadorEquipe
    const novoJogadorEquipe: JogadorEquipe = {
      id: jogadorNovo.id,
      nome: jogadorNovo.nome,
      nivel: jogadorNovo.nivel,
      genero: jogadorNovo.genero,
    };

    // 5. Atualizar array de jogadores na equipe
    const novosJogadores = equipeComJogador.jogadores.map((j) =>
      j.id === jogadorAntigoId ? novoJogadorEquipe : j
    );

    await this.equipeRepository.atualizarEmLote([
      { id: equipeComJogador.id, dados: { jogadores: novosJogadores } },
    ]);

    // 6. Atualizar partidas que tenham o jogador definido
    const partidas = await this.partidaRepository.buscarPorEtapa(etapaId, arenaId);

    for (const partida of partidas) {
      let atualizar = false;
      let novaDupla1 = partida.dupla1;
      let novaDupla2 = partida.dupla2;

      // Verificar dupla1
      if (partida.dupla1 && partida.dupla1.some((j) => j.id === jogadorAntigoId)) {
        novaDupla1 = partida.dupla1.map((j) =>
          j.id === jogadorAntigoId ? novoJogadorEquipe : j
        );
        atualizar = true;
      }

      // Verificar dupla2
      if (partida.dupla2 && partida.dupla2.some((j) => j.id === jogadorAntigoId)) {
        novaDupla2 = partida.dupla2.map((j) =>
          j.id === jogadorAntigoId ? novoJogadorEquipe : j
        );
        atualizar = true;
      }

      if (atualizar) {
        await this.partidaRepository.atualizar(partida.id, {
          dupla1: novaDupla1,
          dupla2: novaDupla2,
        });
      }
    }

    // 7. Criar estatísticas para o jogador novo
    await this.estatisticasService.criar({
      etapaId,
      arenaId,
      jogadorId: jogadorNovo.id,
      jogadorNome: jogadorNovo.nome,
      jogadorNivel: jogadorNovo.nivel,
      jogadorGenero: jogadorNovo.genero,
      grupoId: equipeComJogador.id,
      grupoNome: equipeComJogador.nome,
    });

    // 8. Deletar estatísticas do jogador antigo
    const { estatisticasJogadorRepository } = await import(
      "../repositories/firebase/EstatisticasJogadorRepository"
    );
    const estatisticaAntiga = await estatisticasJogadorRepository.buscarPorJogadorEEtapa(
      jogadorAntigoId,
      etapaId
    );

    if (estatisticaAntiga) {
      await estatisticasJogadorRepository.deletar(estatisticaAntiga.id);
    }

    logger.info("Substituição de jogador no formato TEAMS concluída", {
      etapaId,
      equipeId: equipeComJogador.id,
      equipeNome: equipeComJogador.nome,
      jogadorAntigoId,
      jogadorAntigoNome: jogadorAntigo.nome,
      jogadorNovoId: jogadorNovo.id,
      jogadorNovoNome: jogadorNovo.nome,
    });
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

    // Resetar estatísticas de todas as equipes em lote
    await this.equipeRepository.atualizarEmLote(
      equipes.map((equipe) => ({
        id: equipe.id,
        dados: {
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
        },
      }))
    );

    // Recriar estatísticas para cada jogador das equipes
    for (const equipe of equipes) {
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
    // Import necessário para estatísticas
    const { estatisticasJogadorRepository } = await import(
      "../repositories/firebase/EstatisticasJogadorRepository"
    );

    // Executar todas as deleções em paralelo (são independentes)
    await Promise.all([
      (async () => {
        await this.partidaRepository.deletarPorEtapa(etapaId, arenaId);
      })(),
      (async () => {
        await this.confrontoRepository.deletarPorEtapa(etapaId, arenaId);
      })(),
      (async () => {
        await this.equipeRepository.deletarPorEtapa(etapaId, arenaId);
      })(),
      (async () => {
        await estatisticasJogadorRepository.deletarPorEtapa(etapaId, arenaId);
      })(),
    ]);

    // Atualizar etapa para refletir que chaves foram canceladas
    const { db } = await import("../config/firebase");
    const { Timestamp } = await import("firebase-admin/firestore");
    await db.collection("etapas").doc(etapaId).update({
      chavesGeradas: false,
      status: StatusEtapa.INSCRICOES_ENCERRADAS,
      atualizadoEm: Timestamp.now(),
    });
    logger.info("Chaves TEAMS canceladas", { etapaId, arenaId });
  }
}

export default new TeamsService();
