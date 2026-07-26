/**
 * Service para gerenciar formato Super X (Super 8, Super 10, Super 12)
 *
 * Super X é similar ao Rei da Praia, mas:
 * - Grupo único (sem múltiplos grupos)
 * - Número fixo de jogadores: 8, 10 ou 12
 * - Sem fase eliminatória
 * - Estatísticas individuais por jogador
 * - Tabela de rodadas hardcoded com duplas rotativas
 */

import { StatusEtapa, FaseEtapa } from "../models/Etapa";
import { Inscricao } from "../models/Inscricao";
import { Grupo } from "../models/Grupo";
import { StatusPartida } from "../models/Partida";
import { Jogador } from "../models/Jogador";
import { BadRequestError } from "../utils/errors";
import { validarEDeterminarVencedorPlacar } from "../utils/placarSets";
import logger from "../utils/logger";

// Utilitários compartilhados
import { embaralhar } from "../utils/arrayUtils";

// Config de schedules
import { getSuperXSchedule, getTotalRodadas } from "../config/SuperXSchedules";

// Interfaces dos repositories
import { IEtapaRepository } from "../repositories/interfaces/IEtapaRepository";
import { IInscricaoRepository } from "../repositories/interfaces/IInscricaoRepository";
import { IGrupoRepository } from "../repositories/interfaces/IGrupoRepository";
import {
  IPartidaReiDaPraiaRepository,
  PartidaReiDaPraia,
  CriarPartidaReiDaPraiaDTO,
} from "../repositories/interfaces/IPartidaReiDaPraiaRepository";
import {
  IEstatisticasJogadorRepository,
  EstatisticasJogador,
} from "../repositories/interfaces/IEstatisticasJogadorRepository";

// Implementações Firebase (para instância default)
import { EtapaRepository } from "../repositories/firebase/EtapaRepository";
import { InscricaoRepository } from "../repositories/firebase/InscricaoRepository";
import { GrupoRepository } from "../repositories/firebase/GrupoRepository";
import { PartidaReiDaPraiaRepository } from "../repositories/firebase/PartidaReiDaPraiaRepository";
import { EstatisticasJogadorRepository } from "../repositories/firebase/EstatisticasJogadorRepository";

// Services auxiliares
import estatisticasJogadorService from "./EstatisticasJogadorService";

/**
 * Usa injeção de dependência para repositories
 */
export class SuperXService {
  constructor(
    private etapaRepository: IEtapaRepository,
    private inscricaoRepository: IInscricaoRepository,
    private grupoRepository: IGrupoRepository,
    private partidaReiDaPraiaRepository: IPartidaReiDaPraiaRepository,
    private estatisticasJogadorRepository: IEstatisticasJogadorRepository
  ) {}

  /**
   * Gerar chaves no formato Super X
   */
  async gerarChaves(
    etapaId: string,
    arenaId: string
  ): Promise<{
    jogadores: EstatisticasJogador[];
    grupo: Grupo;
    partidas: PartidaReiDaPraia[];
  }> {
    try {
      const etapa = await this.etapaRepository.buscarPorIdEArena(
        etapaId,
        arenaId
      );
      if (!etapa) throw new Error("Etapa não encontrada");

      if (etapa.status !== StatusEtapa.INSCRICOES_ENCERRADAS) {
        throw new Error("Inscrições devem estar encerradas");
      }

      if (etapa.chavesGeradas) {
        throw new Error("Chaves já foram geradas");
      }

      // Validar variante (apenas 8 e 12 - Super 10 removido por impossibilidade matemática)
      const variant = etapa.varianteSuperX as 8 | 12;
      if (![8, 12].includes(variant)) {
        throw new Error("Variante Super X inválida. Deve ser 8 ou 12.");
      }

      // Validar número de jogadores
      if (etapa.totalInscritos !== variant) {
        throw new Error(
          `Super ${variant} requer exatamente ${variant} jogadores. Atualmente há ${etapa.totalInscritos} inscritos.`
        );
      }

      if (etapa.totalInscritos !== etapa.maxJogadores) {
        throw new Error(
          `Etapa configurada para ${etapa.maxJogadores} jogadores, mas possui ${etapa.totalInscritos}`
        );
      }

      // Buscar inscrições via repository
      const inscricoes = await this.inscricaoRepository.buscarConfirmadas(
        etapaId,
        arenaId
      );

      // Criar estatísticas para cada jogador
      const jogadores = await this.criarEstatisticasJogadores(
        etapaId,
        arenaId,
        inscricoes,
        variant
      );

      // Criar grupo único
      const grupo = await this.criarGrupoUnico(
        etapaId,
        arenaId,
        jogadores,
        variant
      );

      //  Atualizar grupoId em todos os jogadores em batch
      const atualizacoesGrupo = jogadores.map((jogador) => ({
        jogadorId: jogador.jogadorId,
        etapaId,
        grupoId: grupo.id,
        grupoNome: grupo.nome,
      }));
      await estatisticasJogadorService.atualizarGrupoEmLote(atualizacoesGrupo);

      // Gerar partidas usando o schedule
      const partidas = await this.gerarPartidas(
        etapaId,
        arenaId,
        grupo,
        jogadores,
        variant
      );

      // Marcar chaves como geradas
      await this.etapaRepository.marcarChavesGeradas(etapaId, true);

      logger.info("Chaves Super X geradas", {
        etapaId,
        arenaId,
        variant,
        totalJogadores: jogadores.length,
        totalRodadas: getTotalRodadas(variant),
        totalPartidas: partidas.length,
      });

      return { jogadores, grupo, partidas };
    } catch (error: any) {
      logger.error(
        "Erro ao gerar chaves Super X",
        {
          etapaId,
          arenaId,
        },
        error
      );
      throw error;
    }
  }

  /**
   * Criar estatísticas para cada jogador
   */
  private async criarEstatisticasJogadores(
    etapaId: string,
    arenaId: string,
    inscricoes: Inscricao[],
    variant: 8 | 10 | 12
  ): Promise<EstatisticasJogador[]> {
    try {
      const grupoNome = `Super ${variant}`;

      // Embaralhar para distribuição aleatória
      const inscricoesEmbaralhadas = embaralhar([...inscricoes]);

      //  Criar todas as estatísticas em batch
      const estatisticasDTOs = inscricoesEmbaralhadas.map((inscricao) => ({
        etapaId,
        arenaId,
        jogadorId: inscricao.jogadorId,
        jogadorNome: inscricao.jogadorNome,
        jogadorNivel: inscricao.jogadorNivel,
        jogadorGenero: inscricao.jogadorGenero,
        grupoNome,
      }));

      const jogadores = await estatisticasJogadorService.criarEmLote(
        estatisticasDTOs
      );

      return jogadores as unknown as EstatisticasJogador[];
    } catch (error) {
      logger.error(
        "Erro ao criar estatísticas dos jogadores",
        {
          etapaId,
          arenaId,
        },
        error as Error
      );
      throw new Error("Falha ao criar estatísticas dos jogadores");
    }
  }

  /**
   * Criar grupo único para Super X
   */
  private async criarGrupoUnico(
    etapaId: string,
    arenaId: string,
    jogadores: EstatisticasJogador[],
    variant: 8 | 10 | 12
  ): Promise<Grupo> {
    try {
      const grupo = await this.grupoRepository.criar({
        etapaId,
        arenaId,
        nome: `Super ${variant}`,
        ordem: 1,
        duplas: jogadores.map((j) => j.id),
        totalDuplas: jogadores.length,
      });

      return grupo;
    } catch (error) {
      logger.error(
        "Erro ao criar grupo",
        {
          etapaId,
          arenaId,
        },
        error as Error
      );
      throw new Error("Falha ao criar grupo");
    }
  }

  /**
   * Gerar partidas usando o schedule hardcoded
   */
  private async gerarPartidas(
    etapaId: string,
    arenaId: string,
    grupo: Grupo,
    jogadores: EstatisticasJogador[],
    variant: 8 | 12
  ): Promise<PartidaReiDaPraia[]> {
    try {
      const schedule = getSuperXSchedule(variant);

      //  Construir todos os DTOs primeiro, depois criar em batch
      const partidaDTOs: CriarPartidaReiDaPraiaDTO[] = [];

      for (const rodada of schedule) {
        for (const partida of rodada.partidas) {
          const jogador1A = jogadores[partida.dupla1[0]];
          const jogador1B = jogadores[partida.dupla1[1]];
          const jogador2A = jogadores[partida.dupla2[0]];
          const jogador2B = jogadores[partida.dupla2[1]];

          partidaDTOs.push({
            etapaId,
            arenaId,
            fase: FaseEtapa.GRUPOS,
            grupoId: grupo.id,
            grupoNome: grupo.nome,
            rodada: rodada.rodada,
            jogador1AId: jogador1A.jogadorId,
            jogador1ANome: jogador1A.jogadorNome,
            jogador1BId: jogador1B.jogadorId,
            jogador1BNome: jogador1B.jogadorNome,
            dupla1Nome: `${jogador1A.jogadorNome} & ${jogador1B.jogadorNome}`,
            jogador2AId: jogador2A.jogadorId,
            jogador2ANome: jogador2A.jogadorNome,
            jogador2BId: jogador2B.jogadorId,
            jogador2BNome: jogador2B.jogadorNome,
            dupla2Nome: `${jogador2A.jogadorNome} & ${jogador2B.jogadorNome}`,
          });
        }
      }

      //  Criar todas as partidas em batch
      const todasPartidas = await this.partidaReiDaPraiaRepository.criarEmLote(
        partidaDTOs
      );
      const partidasIds = todasPartidas.map((p) => p.id);

      //  Adicionar todas as partidas ao grupo em uma única operação
      await this.grupoRepository.adicionarPartidasEmLote(grupo.id, partidasIds);

      return todasPartidas;
    } catch (error) {
      logger.error(
        "Erro ao gerar partidas",
        {
          etapaId,
          arenaId,
        },
        error as Error
      );
      throw new Error("Falha ao gerar partidas");
    }
  }

  /**
   * Registrar resultado de partida
   */
  async registrarResultadoPartida(
    partidaId: string,
    arenaId: string,
    placar: { numero: number; gamesDupla1: number; gamesDupla2: number }[]
  ): Promise<void> {
    try {
      // Validar placar (1 set, ou 2-3 sets quando a etapa usa "melhor de 3")
      const { setsDupla1, setsDupla2, dupla1Venceu } = validarEDeterminarVencedorPlacar(placar);

      // Buscar partida via repository
      const partida = await this.partidaReiDaPraiaRepository.buscarPorIdEArena(
        partidaId,
        arenaId
      );

      if (!partida) {
        throw new Error("Partida não encontrada");
      }

      const isEdicao = partida.status === StatusPartida.FINALIZADA;
      const jogadorIds = [
        partida.jogador1AId,
        partida.jogador1BId,
        partida.jogador2AId,
        partida.jogador2BId,
      ];

      //  Buscar estatísticas UMA VEZ no início (reutilizada para reversão e atualização)
      const estatisticasMap =
        await estatisticasJogadorService.buscarPorJogadoresEtapa(
          jogadorIds,
          partida.etapaId
        );

      // Se for edição, reverter estatísticas anteriores (sem re-buscar partida)
      if (isEdicao && partida.placar && partida.placar.length > 0) {
        await this.reverterEstatisticasComMap(partida, estatisticasMap);
      }

      const vencedorDupla = dupla1Venceu ? 1 : 2;
      const gamesDupla1 = placar.reduce((soma, s) => soma + s.gamesDupla1, 0);
      const gamesDupla2 = placar.reduce((soma, s) => soma + s.gamesDupla2, 0);

      //  Executar atualização da partida e estatísticas em PARALELO
      const atualizacoes = [
        {
          estatisticaId: estatisticasMap.get(partida.jogador1AId)?.id || "",
          dto: {
            venceu: dupla1Venceu,
            setsVencidos: setsDupla1,
            setsPerdidos: setsDupla2,
            gamesVencidos: gamesDupla1,
            gamesPerdidos: gamesDupla2,
          },
        },
        {
          estatisticaId: estatisticasMap.get(partida.jogador1BId)?.id || "",
          dto: {
            venceu: dupla1Venceu,
            setsVencidos: setsDupla1,
            setsPerdidos: setsDupla2,
            gamesVencidos: gamesDupla1,
            gamesPerdidos: gamesDupla2,
          },
        },
        {
          estatisticaId: estatisticasMap.get(partida.jogador2AId)?.id || "",
          dto: {
            venceu: !dupla1Venceu,
            setsVencidos: setsDupla2,
            setsPerdidos: setsDupla1,
            gamesVencidos: gamesDupla2,
            gamesPerdidos: gamesDupla1,
          },
        },
        {
          estatisticaId: estatisticasMap.get(partida.jogador2BId)?.id || "",
          dto: {
            venceu: !dupla1Venceu,
            setsVencidos: setsDupla2,
            setsPerdidos: setsDupla1,
            gamesVencidos: gamesDupla2,
            gamesPerdidos: gamesDupla1,
          },
        },
      ].filter((a) => a.estatisticaId);

      // Executar em paralelo: atualizar partida + atualizar estatísticas
      await Promise.all([
        this.partidaReiDaPraiaRepository.atualizar(partidaId, {
          placar,
          setsDupla1,
          setsDupla2,
          vencedorDupla,
          status: StatusPartida.FINALIZADA,
        }),
        estatisticasJogadorService.atualizarAposPartidaGrupoComIncrement(
          atualizacoes
        ),
      ]);

      // Recalcular classificação e verificar grupo completo
      if (partida.grupoId) {
        // Buscar dados para classificação e verificação em PARALELO
        const [jogadoresGrupo, partidasGrupo] = await Promise.all([
          this.estatisticasJogadorRepository.buscarPorGrupo(partida.grupoId),
          this.partidaReiDaPraiaRepository.buscarPorGrupo(partida.grupoId),
        ]);

        // Ordenar e atualizar posições
        // Critérios: Pontos → Saldo Games → Games vencidos → Sorteio
        const jogadoresOrdenados = [...jogadoresGrupo].sort((a, b) => {
          if (a.pontosGrupo !== b.pontosGrupo)
            return (b.pontosGrupo || 0) - (a.pontosGrupo || 0);
          if (a.saldoGamesGrupo !== b.saldoGamesGrupo)
            return (b.saldoGamesGrupo || 0) - (a.saldoGamesGrupo || 0);
          if (a.gamesVencidosGrupo !== b.gamesVencidosGrupo)
            return (b.gamesVencidosGrupo || 0) - (a.gamesVencidosGrupo || 0);
          // Sorteio como último critério
          return Math.random() - 0.5;
        });

        const atualizacoesPosicao = jogadoresOrdenados.map((j, i) => ({
          estatisticaId: j.id,
          posicaoGrupo: i + 1,
        }));

        // Verificar se grupo está completo (contando a partida atual como finalizada)
        const partidasFinalizadas = partidasGrupo.filter(
          (p) => p.status === StatusPartida.FINALIZADA || p.id === partidaId
        ).length;
        const grupoCompleto =
          partidasFinalizadas === partidasGrupo.length &&
          partidasGrupo.length > 0;

        //  Atualizar posições e status do grupo em PARALELO
        await Promise.all([
          estatisticasJogadorService.atualizarPosicoesGrupoEmLote(
            atualizacoesPosicao
          ),
          this.grupoRepository.atualizar(partida.grupoId, {
            completo: grupoCompleto,
            partidasFinalizadas,
          }),
        ]);
      }

      logger.info("Resultado Super X registrado", {
        partidaId,
        vencedorDupla,
        placar,
      });
    } catch (error: any) {
      logger.error(
        "Erro ao registrar resultado Super X",
        { partidaId, arenaId },
        error
      );
      throw error;
    }
  }

  /**
   * Reverter estatísticas usando Map já carregado (evita query adicional)
   */
  private async reverterEstatisticasComMap(
    partida: PartidaReiDaPraia,
    estatisticasMap: Map<
      string,
      import("../models/EstatisticasJogador").EstatisticasJogador
    >
  ): Promise<void> {
    if (!partida.placar || partida.placar.length === 0) return;

    const dupla1Venceu = partida.vencedorDupla === 1;
    const setsDupla1 = partida.setsDupla1 || 0;
    const setsDupla2 = partida.setsDupla2 || 0;
    const gamesDupla1 = partida.placar.reduce((soma, s) => soma + s.gamesDupla1, 0);
    const gamesDupla2 = partida.placar.reduce((soma, s) => soma + s.gamesDupla2, 0);

    const reversoes = [
      {
        estatisticaId: estatisticasMap.get(partida.jogador1AId)?.id || "",
        dto: {
          venceu: dupla1Venceu,
          setsVencidos: setsDupla1,
          setsPerdidos: setsDupla2,
          gamesVencidos: gamesDupla1,
          gamesPerdidos: gamesDupla2,
        },
      },
      {
        estatisticaId: estatisticasMap.get(partida.jogador1BId)?.id || "",
        dto: {
          venceu: dupla1Venceu,
          setsVencidos: setsDupla1,
          setsPerdidos: setsDupla2,
          gamesVencidos: gamesDupla1,
          gamesPerdidos: gamesDupla2,
        },
      },
      {
        estatisticaId: estatisticasMap.get(partida.jogador2AId)?.id || "",
        dto: {
          venceu: !dupla1Venceu,
          setsVencidos: setsDupla2,
          setsPerdidos: setsDupla1,
          gamesVencidos: gamesDupla2,
          gamesPerdidos: gamesDupla1,
        },
      },
      {
        estatisticaId: estatisticasMap.get(partida.jogador2BId)?.id || "",
        dto: {
          venceu: !dupla1Venceu,
          setsVencidos: setsDupla2,
          setsPerdidos: setsDupla1,
          gamesVencidos: gamesDupla2,
          gamesPerdidos: gamesDupla1,
        },
      },
    ].filter((r) => r.estatisticaId);

    await estatisticasJogadorService.reverterAposPartidaComIncrement(reversoes);
  }

  /**
   * Registrar múltiplos resultados de partidas Super X em lote
   */
  async registrarResultadosEmLote(
    etapaId: string,
    arenaId: string,
    resultados: Array<{
      partidaId: string;
      placar: { numero: number; gamesDupla1: number; gamesDupla2: number }[];
    }>
  ): Promise<{
    message: string;
    processados: number;
    erros: Array<{ partidaId: string; erro: string }>;
  }> {
    const erros: Array<{ partidaId: string; erro: string }> = [];
    let processados = 0;

    try {
      // Buscar todas as partidas em paralelo
      const partidasPromises = resultados.map((r) =>
        this.partidaReiDaPraiaRepository.buscarPorIdEArena(r.partidaId, arenaId)
      );
      const partidas = await Promise.all(partidasPromises);

      // Coletar todos os jogadorIds únicos
      const jogadorIdsSet = new Set<string>();
      for (const partida of partidas) {
        if (partida) {
          jogadorIdsSet.add(partida.jogador1AId);
          jogadorIdsSet.add(partida.jogador1BId);
          jogadorIdsSet.add(partida.jogador2AId);
          jogadorIdsSet.add(partida.jogador2BId);
        }
      }
      const jogadorIds = Array.from(jogadorIdsSet);

      // Buscar todas as estatísticas de uma vez
      const estatisticasMap =
        await estatisticasJogadorService.buscarPorJogadoresEtapa(
          jogadorIds,
          etapaId
        );

      // Processar cada resultado
      const gruposParaRecalcular = new Set<string>();

      // Validar e preparar dados
      type ResultadoValido = {
        resultado: (typeof resultados)[0];
        partida: NonNullable<(typeof partidas)[0]>;
        isEdicao: boolean;
      };
      const resultadosValidos: ResultadoValido[] = [];

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

        if (!resultado.placar || resultado.placar.length === 0) {
          erros.push({
            partidaId: resultado.partidaId,
            erro: "Placar não informado",
          });
          continue;
        }

        const isEdicao = partida.status === StatusPartida.FINALIZADA;
        resultadosValidos.push({ resultado, partida, isEdicao });

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
          this.reverterEstatisticasComMap(r.partida, estatisticasMap)
        );

      if (reversoes.length > 0) {
        await Promise.all(reversoes);
      }

      // Aplicar novos resultados em paralelo
      const aplicacoes = resultadosValidos.map(
        async ({ resultado, partida }) => {
          try {
            const { setsDupla1, setsDupla2, dupla1Venceu } =
              validarEDeterminarVencedorPlacar(resultado.placar);
            const vencedorDupla = dupla1Venceu ? 1 : 2;
            const gamesDupla1 = resultado.placar.reduce((soma, s) => soma + s.gamesDupla1, 0);
            const gamesDupla2 = resultado.placar.reduce((soma, s) => soma + s.gamesDupla2, 0);

            const atualizacoes = [
              {
                estatisticaId:
                  estatisticasMap.get(partida.jogador1AId)?.id || "",
                dto: {
                  venceu: dupla1Venceu,
                  setsVencidos: setsDupla1,
                  setsPerdidos: setsDupla2,
                  gamesVencidos: gamesDupla1,
                  gamesPerdidos: gamesDupla2,
                },
              },
              {
                estatisticaId:
                  estatisticasMap.get(partida.jogador1BId)?.id || "",
                dto: {
                  venceu: dupla1Venceu,
                  setsVencidos: setsDupla1,
                  setsPerdidos: setsDupla2,
                  gamesVencidos: gamesDupla1,
                  gamesPerdidos: gamesDupla2,
                },
              },
              {
                estatisticaId:
                  estatisticasMap.get(partida.jogador2AId)?.id || "",
                dto: {
                  venceu: !dupla1Venceu,
                  setsVencidos: setsDupla2,
                  setsPerdidos: setsDupla1,
                  gamesVencidos: gamesDupla2,
                  gamesPerdidos: gamesDupla1,
                },
              },
              {
                estatisticaId:
                  estatisticasMap.get(partida.jogador2BId)?.id || "",
                dto: {
                  venceu: !dupla1Venceu,
                  setsVencidos: setsDupla2,
                  setsPerdidos: setsDupla1,
                  gamesVencidos: gamesDupla2,
                  gamesPerdidos: gamesDupla1,
                },
              },
            ].filter((a) => a.estatisticaId);

            await Promise.all([
              this.partidaReiDaPraiaRepository.atualizar(resultado.partidaId, {
                placar: resultado.placar,
                setsDupla1,
                setsDupla2,
                vencedorDupla,
                status: StatusPartida.FINALIZADA,
              }),
              estatisticasJogadorService.atualizarAposPartidaGrupoComIncrement(
                atualizacoes
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

      // Recalcular classificação de todos os grupos afetados
      const recalcPromises = Array.from(gruposParaRecalcular).map(
        async (grupoId) => {
          try {
            const [jogadoresGrupo, partidasGrupo] = await Promise.all([
              this.estatisticasJogadorRepository.buscarPorGrupo(grupoId),
              this.partidaReiDaPraiaRepository.buscarPorGrupo(grupoId),
            ]);

            // Critérios: Pontos → Saldo Games → Games vencidos → Sorteio
            const jogadoresOrdenados = [...jogadoresGrupo].sort((a, b) => {
              if (a.pontosGrupo !== b.pontosGrupo)
                return (b.pontosGrupo || 0) - (a.pontosGrupo || 0);
              if (a.saldoGamesGrupo !== b.saldoGamesGrupo)
                return (b.saldoGamesGrupo || 0) - (a.saldoGamesGrupo || 0);
              if (a.gamesVencidosGrupo !== b.gamesVencidosGrupo)
                return (
                  (b.gamesVencidosGrupo || 0) - (a.gamesVencidosGrupo || 0)
                );
              // Sorteio como último critério
              return Math.random() - 0.5;
            });

            const atualizacoesPosicao = jogadoresOrdenados.map((j, i) => ({
              estatisticaId: j.id,
              posicaoGrupo: i + 1,
            }));

            const partidasFinalizadas = partidasGrupo.filter(
              (p) => p.status === StatusPartida.FINALIZADA
            ).length;
            const grupoCompleto =
              partidasFinalizadas === partidasGrupo.length &&
              partidasGrupo.length > 0;

            await Promise.all([
              estatisticasJogadorService.atualizarPosicoesGrupoEmLote(
                atualizacoesPosicao
              ),
              this.grupoRepository.atualizar(grupoId, {
                completo: grupoCompleto,
                partidasFinalizadas,
              }),
            ]);
          } catch (error: any) {
            logger.error(
              "Erro ao recalcular classificação do grupo Super X",
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
      };
    } catch (error: any) {
      logger.error(
        "Erro ao registrar resultados em lote Super X",
        { etapaId, total: resultados.length },
        error
      );
      throw error;
    }
  }

  /**
   * Buscar jogadores da etapa Super X
   */
  async buscarJogadores(
    etapaId: string,
    arenaId: string
  ): Promise<EstatisticasJogador[]> {
    return this.estatisticasJogadorRepository.buscarPorEtapa(etapaId, arenaId);
  }

  /**
   * Buscar partidas da etapa Super X
   */
  async buscarPartidas(
    etapaId: string,
    arenaId: string
  ): Promise<PartidaReiDaPraia[]> {
    return this.partidaReiDaPraiaRepository.buscarPorEtapa(etapaId, arenaId);
  }

  /**
   * Buscar partidas por rodada
   */
  async buscarPartidasPorRodada(
    etapaId: string,
    arenaId: string,
    rodada: number
  ): Promise<PartidaReiDaPraia[]> {
    const partidas = await this.partidaReiDaPraiaRepository.buscarPorEtapa(
      etapaId,
      arenaId
    );
    return partidas.filter((p) => p.rodada === rodada);
  }

  /**
   * Buscar grupo da etapa Super X
   */
  async buscarGrupo(etapaId: string, arenaId: string): Promise<Grupo | null> {
    const grupos = await this.grupoRepository.buscarPorEtapa(etapaId, arenaId);
    return grupos.length > 0 ? grupos[0] : null;
  }

  /**
   * Cancelar chaves Super X (resetar tudo)
   */
  async cancelarChaves(etapaId: string, arenaId: string): Promise<void> {
    try {
      const etapa = await this.etapaRepository.buscarPorIdEArena(
        etapaId,
        arenaId
      );

      if (!etapa) throw new Error("Etapa não encontrada");

      if (!etapa.chavesGeradas) {
        throw new Error("Chaves ainda não foram geradas");
      }

      // Executar todas as deleções em paralelo usando deletarPorEtapa (batch writes)
      await Promise.all([
        (async () => {
          await this.grupoRepository.deletarPorEtapa(etapaId, arenaId);
        })(),
        (async () => {
          await this.partidaReiDaPraiaRepository.deletarPorEtapa(
            etapaId,
            arenaId
          );
        })(),
        (async () => {
          await this.estatisticasJogadorRepository.deletarPorEtapa(
            etapaId,
            arenaId
          );
        })(),
      ]);

      // Atualizar etapa (sequencial pois depende das deleções)
      await Promise.all([
        this.etapaRepository.marcarChavesGeradas(etapaId, false),
        this.etapaRepository.atualizarStatus(
          etapaId,
          StatusEtapa.INSCRICOES_ENCERRADAS
        ),
      ]);

      logger.info("Chaves Super X canceladas", {
        etapaId,
        arenaId,
      });
    } catch (error: any) {
      logger.error(
        "Erro ao cancelar chaves Super X",
        {
          etapaId,
          arenaId,
        },
        error
      );
      throw error;
    }
  }

  /**
   * Substituir jogador em uma etapa Super X
   * Só permite se nenhuma partida foi jogada
   */
  async substituirJogador(
    etapaId: string,
    arenaId: string,
    jogadorAntigoId: string,
    jogadorNovo: Jogador
  ): Promise<void> {
    try {
      logger.info("Iniciando substituição de jogador no Super X", {
        etapaId,
        jogadorAntigoId,
        jogadorNovoId: jogadorNovo.id,
      });

      // 1. Buscar estatísticas do jogador antigo
      const estatisticaAntigo =
        await this.estatisticasJogadorRepository.buscarPorJogadorEEtapa(
          jogadorAntigoId,
          etapaId
        );

      if (!estatisticaAntigo) {
        throw new BadRequestError("Jogador antigo não encontrado na etapa");
      }

      if (!estatisticaAntigo.grupoId) {
        throw new BadRequestError("Jogador antigo não está em nenhum grupo");
      }

      const grupoId = estatisticaAntigo.grupoId;

      // 2. Verificar se alguma partida já foi jogada (Super X tem apenas 1 grupo)
      const partidasDoGrupo =
        await this.partidaReiDaPraiaRepository.buscarPorGrupo(grupoId);

      const partidasJogadas = partidasDoGrupo.filter(
        (p) => p.status !== StatusPartida.AGENDADA
      );

      if (partidasJogadas.length > 0) {
        throw new BadRequestError(
          "Não é possível substituir jogador pois já existem partidas jogadas"
        );
      }

      // 3. Criar estatísticas para o jogador novo
      await estatisticasJogadorService.criar({
        etapaId,
        arenaId,
        jogadorId: jogadorNovo.id,
        jogadorNome: jogadorNovo.nome,
        jogadorNivel: jogadorNovo.nivel,
        jogadorGenero: jogadorNovo.genero,
        grupoId: estatisticaAntigo.grupoId,
        grupoNome: estatisticaAntigo.grupoNome,
      });

      // 4. Atualizar o array duplas do Grupo
      const grupo = await this.grupoRepository.buscarPorId(grupoId);
      if (grupo) {
        const novasDuplas = grupo.duplas.map((id) =>
          id === jogadorAntigoId ? jogadorNovo.id : id
        );
        await this.grupoRepository.atualizar(grupoId, { duplas: novasDuplas });
      }

      // 5. Atualizar as partidas
      for (const partida of partidasDoGrupo) {
        const atualizacao: Partial<PartidaReiDaPraia> = {};

        if (partida.jogador1AId === jogadorAntigoId) {
          atualizacao.jogador1AId = jogadorNovo.id;
          atualizacao.jogador1ANome = jogadorNovo.nome;
        }
        if (partida.jogador1BId === jogadorAntigoId) {
          atualizacao.jogador1BId = jogadorNovo.id;
          atualizacao.jogador1BNome = jogadorNovo.nome;
        }
        if (partida.jogador2AId === jogadorAntigoId) {
          atualizacao.jogador2AId = jogadorNovo.id;
          atualizacao.jogador2ANome = jogadorNovo.nome;
        }
        if (partida.jogador2BId === jogadorAntigoId) {
          atualizacao.jogador2BId = jogadorNovo.id;
          atualizacao.jogador2BNome = jogadorNovo.nome;
        }

        if (Object.keys(atualizacao).length > 0) {
          const j1aNome = atualizacao.jogador1ANome || partida.jogador1ANome;
          const j1bNome = atualizacao.jogador1BNome || partida.jogador1BNome;
          const j2aNome = atualizacao.jogador2ANome || partida.jogador2ANome;
          const j2bNome = atualizacao.jogador2BNome || partida.jogador2BNome;

          atualizacao.dupla1Nome = `${j1aNome} / ${j1bNome}`;
          atualizacao.dupla2Nome = `${j2aNome} / ${j2bNome}`;

          await this.partidaReiDaPraiaRepository.atualizar(
            partida.id,
            atualizacao
          );
        }
      }

      // 6. Deletar estatísticas do jogador antigo
      await this.estatisticasJogadorRepository.deletar(estatisticaAntigo.id);

      logger.info("Substituição de jogador concluída no Super X", {
        etapaId,
        grupoId,
        jogadorAntigoId,
        jogadorNovoId: jogadorNovo.id,
        partidasAtualizadas: partidasDoGrupo.length,
      });
    } catch (error: any) {
      logger.error(
        "Erro ao substituir jogador no Super X",
        { etapaId, jogadorAntigoId, jogadorNovoId: jogadorNovo.id },
        error
      );
      throw error;
    }
  }
}

// Instância default com repositories Firebase
const etapaRepositoryInstance = new EtapaRepository();
const inscricaoRepositoryInstance = new InscricaoRepository();
const grupoRepositoryInstance = new GrupoRepository();
const partidaReiDaPraiaRepositoryInstance = new PartidaReiDaPraiaRepository();
const estatisticasJogadorRepositoryInstance =
  new EstatisticasJogadorRepository();

export default new SuperXService(
  etapaRepositoryInstance,
  inscricaoRepositoryInstance,
  grupoRepositoryInstance,
  partidaReiDaPraiaRepositoryInstance,
  estatisticasJogadorRepositoryInstance
);
