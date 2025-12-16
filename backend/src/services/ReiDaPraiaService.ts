/**
 * Service para gerenciar formato Rei da Praia
 */

import { StatusEtapa, FaseEtapa } from "../models/Etapa";
import { Inscricao } from "../models/Inscricao";
import { Grupo } from "../models/Grupo";
import { StatusPartida } from "../models/Partida";
import { TipoChaveamentoReiDaPraia } from "../models/TipoChaveamentoReiDaPraia";
import { Dupla } from "../models/Dupla";
import {
  StatusConfrontoEliminatorio,
  ConfrontoEliminatorio,
} from "../models/Eliminatoria";
import logger from "../utils/logger";

// Utilitários compartilhados (eliminando duplicação)
import { embaralhar } from "../utils/arrayUtils";
import { determinarTipoFase } from "../utils/torneioUtils";

// Interfaces dos repositories
import { IEtapaRepository } from "../repositories/interfaces/IEtapaRepository";
import { IInscricaoRepository } from "../repositories/interfaces/IInscricaoRepository";
import { IGrupoRepository } from "../repositories/interfaces/IGrupoRepository";
import { IDuplaRepository } from "../repositories/interfaces/IDuplaRepository";
import { IConfrontoEliminatorioRepository } from "../repositories/interfaces/IConfrontoEliminatorioRepository";
import {
  IPartidaReiDaPraiaRepository,
  PartidaReiDaPraia,
  CriarPartidaReiDaPraiaDTO,
} from "../repositories/interfaces/IPartidaReiDaPraiaRepository";
import {
  IEstatisticasJogadorRepository,
  EstatisticasJogador,
} from "../repositories/interfaces/IEstatisticasJogadorRepository";
import { IPartidaRepository } from "../repositories/interfaces/IPartidaRepository";

// Implementações Firebase (para instância default)
import { EtapaRepository } from "../repositories/firebase/EtapaRepository";
import { InscricaoRepository } from "../repositories/firebase/InscricaoRepository";
import { GrupoRepository } from "../repositories/firebase/GrupoRepository";
import { DuplaRepository } from "../repositories/firebase/DuplaRepository";
import { ConfrontoEliminatorioRepository } from "../repositories/firebase/ConfrontoEliminatorioRepository";
import { PartidaReiDaPraiaRepository } from "../repositories/firebase/PartidaReiDaPraiaRepository";
import { EstatisticasJogadorRepository } from "../repositories/firebase/EstatisticasJogadorRepository";
import { PartidaRepository } from "../repositories/firebase/PartidaRepository";

// Services auxiliares
import cabecaDeChaveService from "./CabecaDeChaveService";
import estatisticasJogadorService from "./EstatisticasJogadorService";

/**
 * Usa injeção de dependência para repositories
 */
export class ReiDaPraiaService {
  constructor(
    private etapaRepository: IEtapaRepository,
    private inscricaoRepository: IInscricaoRepository,
    private grupoRepository: IGrupoRepository,
    private duplaRepository: IDuplaRepository,
    private confrontoRepository: IConfrontoEliminatorioRepository,
    private partidaReiDaPraiaRepository: IPartidaReiDaPraiaRepository,
    private estatisticasJogadorRepository: IEstatisticasJogadorRepository,
    private partidaRepository: IPartidaRepository
  ) {}

  /**
   * Gerar chaves no formato Rei da Praia
   * ✅ OTIMIZAÇÃO v3: Adiciona logs de tempo para debug de performance
   */
  async gerarChaves(
    etapaId: string,
    arenaId: string
  ): Promise<{
    jogadores: EstatisticasJogador[];
    grupos: Grupo[];
    partidas: PartidaReiDaPraia[];
  }> {
    const tempos: Record<string, number> = {};
    const inicioTotal = Date.now();

    try {
      // 1. Buscar e validar etapa
      let inicio = Date.now();
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

      if (etapa.totalInscritos < 8) {
        throw new Error("Necessário no mínimo 8 jogadores");
      }

      if (etapa.totalInscritos % 4 !== 0) {
        throw new Error("Número de jogadores deve ser múltiplo de 4");
      }

      if (etapa.totalInscritos !== etapa.maxJogadores) {
        throw new Error(
          `Etapa configurada para ${etapa.maxJogadores} jogadores, mas possui ${etapa.totalInscritos}`
        );
      }
      tempos["1_validarEtapa"] = Date.now() - inicio;

      // 2. Buscar inscrições via repository
      inicio = Date.now();
      const inscricoes = await this.inscricaoRepository.buscarConfirmadas(
        etapaId,
        arenaId
      );
      tempos["2_buscarInscricoes"] = Date.now() - inicio;

      // 3. Distribuir jogadores em grupos
      inicio = Date.now();
      const jogadores = await this.distribuirJogadoresEmGrupos(
        etapaId,
        arenaId,
        inscricoes
      );
      tempos["3_distribuirJogadores"] = Date.now() - inicio;

      // 4. Criar grupos
      inicio = Date.now();
      const grupos = await this.criarGrupos(etapaId, arenaId, jogadores);
      tempos["4_criarGrupos"] = Date.now() - inicio;

      // 5. Gerar partidas
      inicio = Date.now();
      const partidas = await this.gerarPartidas(etapaId, arenaId, grupos);
      tempos["5_gerarPartidas"] = Date.now() - inicio;

      // 6. Marcar chaves como geradas
      inicio = Date.now();
      await this.etapaRepository.marcarChavesGeradas(etapaId, true);
      tempos["6_marcarChavesGeradas"] = Date.now() - inicio;

      tempos["TOTAL"] = Date.now() - inicioTotal;

      logger.info("⏱️ TEMPOS gerarChaves Rei da Praia", {
        etapaId,
        inscritos: inscricoes.length,
        grupos: grupos.length,
        partidas: partidas.length,
        tempos,
      });

      return { jogadores, grupos, partidas };
    } catch (error: any) {
      tempos["TOTAL_COM_ERRO"] = Date.now() - inicioTotal;
      logger.error(
        "Erro ao gerar chaves rei da praia",
        {
          etapaId,
          arenaId,
          tempos,
        },
        error
      );
      throw error;
    }
  }

  /**
   * Distribuir jogadores em grupos de 4
   */
  private async distribuirJogadoresEmGrupos(
    etapaId: string,
    arenaId: string,
    inscricoes: Inscricao[]
  ): Promise<EstatisticasJogador[]> {
    try {
      const jogadores: EstatisticasJogador[] = [];
      const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      const numGrupos = inscricoes.length / 4;

      // Separar cabeças de chave
      const cabecasIds = await cabecaDeChaveService.obterIdsCabecas(
        arenaId,
        etapaId
      );
      const inscricoesCabecas: Inscricao[] = [];
      const inscricoesNormais: Inscricao[] = [];

      for (const inscricao of inscricoes) {
        if (cabecasIds.includes(inscricao.jogadorId)) {
          inscricoesCabecas.push(inscricao);
        } else {
          inscricoesNormais.push(inscricao);
        }
      }

      if (inscricoesCabecas.length > numGrupos) {
        throw new Error(
          `Número de cabeças de chave (${inscricoesCabecas.length}) não pode ser maior que número de grupos (${numGrupos})`
        );
      }

      // Embaralhar
      const cabecasEmbaralhadas = embaralhar([...inscricoesCabecas]);
      const normaisEmbaralhados = embaralhar([...inscricoesNormais]);

      // Distribuir cabeças primeiro (1 por grupo)
      const gruposComCabecas: Inscricao[][] = [];
      for (let i = 0; i < numGrupos; i++) {
        const grupo: Inscricao[] = [];
        if (i < cabecasEmbaralhadas.length) {
          grupo.push(cabecasEmbaralhadas[i]);
        }
        gruposComCabecas.push(grupo);
      }

      // Distribuir jogadores normais
      let indexNormal = 0;
      while (indexNormal < normaisEmbaralhados.length) {
        for (let grupoIndex = 0; grupoIndex < numGrupos; grupoIndex++) {
          if (
            gruposComCabecas[grupoIndex].length < 4 &&
            indexNormal < normaisEmbaralhados.length
          ) {
            gruposComCabecas[grupoIndex].push(normaisEmbaralhados[indexNormal]);
            indexNormal++;
          }
        }
      }

      // ✅ OTIMIZAÇÃO: Criar todas as estatísticas em batch
      const estatisticasDTOs: Array<{
        etapaId: string;
        arenaId: string;
        jogadorId: string;
        jogadorNome: string;
        jogadorNivel: string;
        jogadorGenero: string;
        grupoNome: string;
      }> = [];

      for (let grupoIndex = 0; grupoIndex < numGrupos; grupoIndex++) {
        const nomeGrupo = `Grupo ${letras[grupoIndex]}`;
        const jogadoresGrupo = gruposComCabecas[grupoIndex];

        for (const inscricao of jogadoresGrupo) {
          estatisticasDTOs.push({
            etapaId,
            arenaId,
            jogadorId: inscricao.jogadorId,
            jogadorNome: inscricao.jogadorNome,
            jogadorNivel: inscricao.jogadorNivel,
            jogadorGenero: inscricao.jogadorGenero,
            grupoNome: nomeGrupo,
          });
        }
      }

      const estatisticasCriadas =
        await estatisticasJogadorService.criarEmLote(estatisticasDTOs);
      jogadores.push(
        ...(estatisticasCriadas as unknown as EstatisticasJogador[])
      );

      return jogadores;
    } catch (error) {
      logger.error(
        "Erro ao distribuir jogadores",
        {
          etapaId,
          arenaId,
        },
        error as Error
      );
      throw new Error("Falha ao distribuir jogadores");
    }
  }

  /**
   * Criar grupos via repository
   * ✅ OTIMIZAÇÃO v3: Criar todos os grupos em batch
   */
  private async criarGrupos(
    etapaId: string,
    arenaId: string,
    jogadores: EstatisticasJogador[]
  ): Promise<Grupo[]> {
    try {
      const jogadoresPorGrupo = new Map<string, EstatisticasJogador[]>();

      // Agrupar jogadores por nome do grupo
      for (const jogador of jogadores) {
        if (!jogadoresPorGrupo.has(jogador.grupoNome!)) {
          jogadoresPorGrupo.set(jogador.grupoNome!, []);
        }
        jogadoresPorGrupo.get(jogador.grupoNome!)!.push(jogador);
      }

      // ✅ OTIMIZAÇÃO v3: Preparar DTOs e criar todos os grupos em batch
      const grupoDTOs: Array<{
        etapaId: string;
        arenaId: string;
        nome: string;
        ordem: number;
        duplas: string[];
        totalDuplas: number;
      }> = [];

      let grupoIndex = 0;
      const grupoNomeToIndex = new Map<string, number>();

      for (const [nomeGrupo, jogadoresGrupo] of jogadoresPorGrupo) {
        grupoNomeToIndex.set(nomeGrupo, grupoIndex);
        grupoDTOs.push({
          etapaId,
          arenaId,
          nome: nomeGrupo,
          ordem: grupoIndex + 1,
          duplas: jogadoresGrupo.map((j) => j.id),
          totalDuplas: jogadoresGrupo.length,
        });
        grupoIndex++;
      }

      // Criar todos os grupos em um único batch
      const grupos = await this.grupoRepository.criarEmLote(grupoDTOs);

      // Preparar atualizações para estatísticas dos jogadores
      const atualizacoesGrupo: Array<{
        estatisticaId: string;
        grupoId: string;
        grupoNome: string;
      }> = [];

      for (const [nomeGrupo, jogadoresGrupo] of jogadoresPorGrupo) {
        const idx = grupoNomeToIndex.get(nomeGrupo)!;
        const grupo = grupos[idx];

        for (const jogador of jogadoresGrupo) {
          atualizacoesGrupo.push({
            estatisticaId: jogador.id,
            grupoId: grupo.id,
            grupoNome: nomeGrupo,
          });
        }
      }

      // ✅ OTIMIZAÇÃO: Atualizar grupos usando IDs diretamente (sem busca adicional)
      await estatisticasJogadorService.atualizarGrupoEmLotePorId(
        atualizacoesGrupo
      );

      return grupos;
    } catch (error) {
      logger.error(
        "Erro ao criar grupos",
        {
          etapaId,
          arenaId,
        },
        error as Error
      );
      throw new Error("Falha ao criar grupos");
    }
  }

  /**
   * Gerar partidas (todas as combinações)
   * ✅ OTIMIZAÇÃO v3: Buscar jogadores em paralelo e criar todas partidas em um único batch
   */
  private async gerarPartidas(
    etapaId: string,
    arenaId: string,
    grupos: Grupo[]
  ): Promise<PartidaReiDaPraia[]> {
    try {
      // 1. Buscar jogadores de todos os grupos em paralelo
      const jogadoresPorGrupo = await Promise.all(
        grupos.map((grupo) =>
          this.estatisticasJogadorRepository.buscarPorGrupo(grupo.id)
        )
      );

      // 2. Validar e gerar todos os DTOs de partidas
      const todosPartidaDTOs: CriarPartidaReiDaPraiaDTO[] = [];
      const partidasPorGrupo: Map<string, number> = new Map();

      for (let g = 0; g < grupos.length; g++) {
        const grupo = grupos[g];
        const jogadores = jogadoresPorGrupo[g];

        if (jogadores.length !== 4) {
          throw new Error(`Grupo ${grupo.nome} deve ter 4 jogadores`);
        }

        const startIndex = todosPartidaDTOs.length;
        const partidasDTO = this.gerarCombinacoesPartidasDTO(
          etapaId,
          arenaId,
          grupo,
          jogadores
        );
        todosPartidaDTOs.push(...partidasDTO);
        partidasPorGrupo.set(grupo.id, todosPartidaDTOs.length - startIndex);
      }

      // 3. Criar todas as partidas em um único batch
      const todasPartidas =
        await this.partidaReiDaPraiaRepository.criarEmLote(todosPartidaDTOs);

      // 4. Atualizar grupos com IDs das partidas em paralelo
      let partidaIndex = 0;
      const atualizacoesGrupos = grupos.map((grupo) => {
        const qtdPartidas = partidasPorGrupo.get(grupo.id) || 0;
        const partidasDoGrupo = todasPartidas.slice(
          partidaIndex,
          partidaIndex + qtdPartidas
        );
        partidaIndex += qtdPartidas;

        const partidasIds = partidasDoGrupo.map((p) => p.id);
        return this.grupoRepository.adicionarPartidasEmLote(
          grupo.id,
          partidasIds
        );
      });

      await Promise.all(atualizacoesGrupos);

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
   * Gerar combinações de partidas DTO (A+B vs C+D, A+C vs B+D, A+D vs B+C)
   */
  private gerarCombinacoesPartidasDTO(
    etapaId: string,
    arenaId: string,
    grupo: Grupo,
    jogadores: EstatisticasJogador[]
  ): CriarPartidaReiDaPraiaDTO[] {
    const [A, B, C, D] = jogadores;

    return [
      // Partida 1: A+B vs C+D
      {
        etapaId,
        arenaId,
        fase: FaseEtapa.GRUPOS,
        grupoId: grupo.id,
        grupoNome: grupo.nome,
        jogador1AId: A.jogadorId,
        jogador1ANome: A.jogadorNome,
        jogador1BId: B.jogadorId,
        jogador1BNome: B.jogadorNome,
        dupla1Nome: `${A.jogadorNome} & ${B.jogadorNome}`,
        jogador2AId: C.jogadorId,
        jogador2ANome: C.jogadorNome,
        jogador2BId: D.jogadorId,
        jogador2BNome: D.jogadorNome,
        dupla2Nome: `${C.jogadorNome} & ${D.jogadorNome}`,
      },
      // Partida 2: A+C vs B+D
      {
        etapaId,
        arenaId,
        fase: FaseEtapa.GRUPOS,
        grupoId: grupo.id,
        grupoNome: grupo.nome,
        jogador1AId: A.jogadorId,
        jogador1ANome: A.jogadorNome,
        jogador1BId: C.jogadorId,
        jogador1BNome: C.jogadorNome,
        dupla1Nome: `${A.jogadorNome} & ${C.jogadorNome}`,
        jogador2AId: B.jogadorId,
        jogador2ANome: B.jogadorNome,
        jogador2BId: D.jogadorId,
        jogador2BNome: D.jogadorNome,
        dupla2Nome: `${B.jogadorNome} & ${D.jogadorNome}`,
      },
      // Partida 3: A+D vs B+C
      {
        etapaId,
        arenaId,
        fase: FaseEtapa.GRUPOS,
        grupoId: grupo.id,
        grupoNome: grupo.nome,
        jogador1AId: A.jogadorId,
        jogador1ANome: A.jogadorNome,
        jogador1BId: D.jogadorId,
        jogador1BNome: D.jogadorNome,
        dupla1Nome: `${A.jogadorNome} & ${D.jogadorNome}`,
        jogador2AId: B.jogadorId,
        jogador2ANome: B.jogadorNome,
        jogador2BId: C.jogadorId,
        jogador2BNome: C.jogadorNome,
        dupla2Nome: `${B.jogadorNome} & ${C.jogadorNome}`,
      },
    ];
  }

  /**
   * Atualizar estatísticas dos 4 jogadores após resultado
   */
  private async atualizarEstatisticasJogadores(
    partida: PartidaReiDaPraia,
    vencedoresIds: string[],
    setsDupla1: number,
    setsDupla2: number,
    gamesDupla1: number,
    gamesDupla2: number
  ): Promise<void> {
    const jogadoresIds = [
      partida.jogador1AId,
      partida.jogador1BId,
      partida.jogador2AId,
      partida.jogador2BId,
    ];

    for (const jogadorId of jogadoresIds) {
      const venceu = vencedoresIds.includes(jogadorId);
      const naDupla1 = [partida.jogador1AId, partida.jogador1BId].includes(
        jogadorId
      );

      if (partida.fase === FaseEtapa.GRUPOS) {
        await estatisticasJogadorService.atualizarAposPartidaGrupo(
          jogadorId,
          partida.etapaId,
          {
            venceu,
            setsVencidos: naDupla1 ? setsDupla1 : setsDupla2,
            setsPerdidos: naDupla1 ? setsDupla2 : setsDupla1,
            gamesVencidos: naDupla1 ? gamesDupla1 : gamesDupla2,
            gamesPerdidos: naDupla1 ? gamesDupla2 : gamesDupla1,
          }
        );
      } else {
        await estatisticasJogadorService.atualizarAposPartida(
          jogadorId,
          partida.etapaId,
          {
            venceu,
            setsVencidos: naDupla1 ? setsDupla1 : setsDupla2,
            setsPerdidos: naDupla1 ? setsDupla2 : setsDupla1,
            gamesVencidos: naDupla1 ? gamesDupla1 : gamesDupla2,
            gamesPerdidos: naDupla1 ? gamesDupla2 : gamesDupla1,
          }
        );
      }
    }
  }

  /**
   * Registrar múltiplos resultados de partidas Rei da Praia em lote
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
    const tempos: Record<string, number> = {};
    const inicioTotal = Date.now();

    const erros: Array<{ partidaId: string; erro: string }> = [];
    let processados = 0;

    try {
      // 1. Buscar todas as partidas em paralelo
      let inicio = Date.now();
      const partidasPromises = resultados.map((r) =>
        this.partidaReiDaPraiaRepository.buscarPorIdEArena(r.partidaId, arenaId)
      );
      const partidas = await Promise.all(partidasPromises);
      tempos["1_buscarPartidas"] = Date.now() - inicio;

      // 2. Verificar se eliminatória já foi gerada
      inicio = Date.now();
      const confrontos = await this.confrontoRepository.buscarPorEtapa(etapaId, arenaId);
      const eliminatoriaGerada = confrontos.length > 0;
      tempos["2_verificarEliminatoria"] = Date.now() - inicio;

      // 3. Processar cada resultado - OTIMIZADO: paralelo
      inicio = Date.now();
      const gruposParaRecalcular = new Set<string>();

      // 3.1 Validar e preparar dados
      type ResultadoValido = {
        resultado: typeof resultados[0];
        partida: NonNullable<typeof partidas[0]>;
        isEdicao: boolean;
      };
      const resultadosValidos: ResultadoValido[] = [];

      for (let i = 0; i < resultados.length; i++) {
        const resultado = resultados[i];
        const partida = partidas[i];

        if (!partida) {
          erros.push({ partidaId: resultado.partidaId, erro: "Partida não encontrada" });
          continue;
        }

        if (!resultado.placar || resultado.placar.length !== 1) {
          erros.push({ partidaId: resultado.partidaId, erro: "Placar deve ter exatamente 1 set" });
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

        resultadosValidos.push({ resultado, partida, isEdicao });

        if (partida.grupoId) {
          gruposParaRecalcular.add(partida.grupoId);
        }
      }

      // 3.2 Reverter estatísticas de edições em paralelo
      const reversoes = resultadosValidos
        .filter(r => r.isEdicao && r.partida.placar && r.partida.placar.length > 0)
        .map(r => this.reverterEstatisticasJogadores(r.partida));

      if (reversoes.length > 0) {
        await Promise.all(reversoes);
      }

      // 3.3 Aplicar novos resultados em paralelo
      const aplicacoes = resultadosValidos.map(async ({ resultado, partida }) => {
        try {
          const set = resultado.placar[0];
          const setsDupla1 = set.gamesDupla1 > set.gamesDupla2 ? 1 : 0;
          const setsDupla2 = set.gamesDupla1 > set.gamesDupla2 ? 0 : 1;
          const vencedorDupla = setsDupla1 > setsDupla2 ? 1 : 2;
          const dupla1Venceu = vencedorDupla === 1;

          const vencedores = dupla1Venceu
            ? [partida.jogador1AId, partida.jogador1BId]
            : [partida.jogador2AId, partida.jogador2BId];

          const vencedoresNomes = dupla1Venceu
            ? `${partida.jogador1ANome} & ${partida.jogador1BNome}`
            : `${partida.jogador2ANome} & ${partida.jogador2BNome}`;

          await Promise.all([
            this.partidaReiDaPraiaRepository.registrarResultado(resultado.partidaId, {
              setsDupla1,
              setsDupla2,
              sets: [{ pontosDupla1: set.gamesDupla1, pontosDupla2: set.gamesDupla2 }],
              placar: resultado.placar,
              vencedores,
              vencedoresNomes,
              vencedorDupla: vencedorDupla as 1 | 2,
            }),
            this.atualizarEstatisticasJogadores(
              partida,
              vencedores,
              setsDupla1,
              setsDupla2,
              set.gamesDupla1,
              set.gamesDupla2
            ),
          ]);

          return { success: true, partidaId: resultado.partidaId };
        } catch (error: any) {
          return { success: false, partidaId: resultado.partidaId, erro: error.message || "Erro desconhecido" };
        }
      });

      const resultadosAplicacao = await Promise.all(aplicacoes);

      for (const res of resultadosAplicacao) {
        if (res.success) {
          processados++;
        } else {
          erros.push({ partidaId: res.partidaId, erro: res.erro! });
        }
      }

      tempos["3_processarResultados"] = Date.now() - inicio;

      // 4. Recalcular classificação de todos os grupos afetados - OTIMIZADO: paralelo
      inicio = Date.now();
      const recalcPromises = Array.from(gruposParaRecalcular).map(async (grupoId) => {
        try {
          await this.recalcularClassificacaoGrupo(grupoId, etapaId);
        } catch (error: any) {
          logger.error("Erro ao recalcular classificação do grupo Rei da Praia", { grupoId }, error);
        }
      });
      await Promise.all(recalcPromises);
      tempos["4_recalcularClassificacao"] = Date.now() - inicio;

      tempos["TOTAL"] = Date.now() - inicioTotal;

      logger.info("⏱️ TEMPOS registrarResultadosEmLote (Rei da Praia)", {
        etapaId,
        total: resultados.length,
        processados,
        erros: erros.length,
        tempos,
      });

      return {
        message:
          erros.length === 0
            ? `${processados} resultado(s) registrado(s) com sucesso`
            : `${processados} resultado(s) registrado(s), ${erros.length} erro(s)`,
        processados,
        erros,
      };
    } catch (error: any) {
      tempos["TOTAL_COM_ERRO"] = Date.now() - inicioTotal;
      logger.error(
        "Erro ao registrar resultados em lote Rei da Praia",
        { etapaId, total: resultados.length, tempos },
        error
      );
      throw error;
    }
  }

  /**
   * Reverter estatísticas dos 4 jogadores (usado em edição de resultado)
   */
  private async reverterEstatisticasJogadores(
    partida: PartidaReiDaPraia
  ): Promise<void> {
    if (!partida.vencedores || !partida.placar || partida.placar.length === 0) {
      return;
    }

    const set = partida.placar[0];
    const dupla1Venceu = partida.vencedores.includes(partida.jogador1AId);
    const setsDupla1 = dupla1Venceu ? 1 : 0;
    const setsDupla2 = dupla1Venceu ? 0 : 1;

    const jogadoresIds = [
      partida.jogador1AId,
      partida.jogador1BId,
      partida.jogador2AId,
      partida.jogador2BId,
    ];

    for (const jogadorId of jogadoresIds) {
      const venceu = partida.vencedores.includes(jogadorId);
      const naDupla1 = [partida.jogador1AId, partida.jogador1BId].includes(
        jogadorId
      );

      if (partida.fase === FaseEtapa.GRUPOS) {
        await estatisticasJogadorService.reverterAposPartidaGrupo(
          jogadorId,
          partida.etapaId,
          {
            venceu,
            setsVencidos: naDupla1 ? setsDupla1 : setsDupla2,
            setsPerdidos: naDupla1 ? setsDupla2 : setsDupla1,
            gamesVencidos: naDupla1 ? set.gamesDupla1 : set.gamesDupla2,
            gamesPerdidos: naDupla1 ? set.gamesDupla2 : set.gamesDupla1,
          }
        );
      } else {
        await estatisticasJogadorService.reverterAposPartida(
          jogadorId,
          partida.etapaId,
          {
            venceu,
            setsVencidos: naDupla1 ? setsDupla1 : setsDupla2,
            setsPerdidos: naDupla1 ? setsDupla2 : setsDupla1,
            gamesVencidos: naDupla1 ? set.gamesDupla1 : set.gamesDupla2,
            gamesPerdidos: naDupla1 ? set.gamesDupla2 : set.gamesDupla1,
          }
        );
      }
    }
  }

  /**
   * Recalcular classificação do grupo
   */
  private async recalcularClassificacaoGrupo(
    grupoId: string,
    etapaId: string
  ): Promise<void> {
    const jogadores = await estatisticasJogadorService.buscarPorGrupo(grupoId);

    const jogadoresOrdenados = [...jogadores].sort((a, b) => {
      if (a.pontosGrupo !== b.pontosGrupo) {
        return b.pontosGrupo - a.pontosGrupo;
      }
      if (a.vitoriasGrupo !== b.vitoriasGrupo) {
        return b.vitoriasGrupo - a.vitoriasGrupo;
      }
      if (a.saldoGamesGrupo !== b.saldoGamesGrupo) {
        return b.saldoGamesGrupo - a.saldoGamesGrupo;
      }
      if (a.gamesVencidosGrupo !== b.gamesVencidosGrupo) {
        return b.gamesVencidosGrupo - a.gamesVencidosGrupo;
      }
      if (a.saldoSetsGrupo !== b.saldoSetsGrupo) {
        return b.saldoSetsGrupo - a.saldoSetsGrupo;
      }
      return 0;
    });

    // Atualizar posição de cada jogador - OTIMIZADO: todas em paralelo
    const atualizacoesPosicao = jogadoresOrdenados.map((jogador, i) =>
      estatisticasJogadorService.atualizarPosicaoGrupo(
        jogador.jogadorId,
        etapaId,
        i + 1
      )
    );
    await Promise.all(atualizacoesPosicao);

    // Verificar se grupo está completo e atualizar em paralelo
    const partidasFinalizadas =
      await this.partidaReiDaPraiaRepository.contarFinalizadasPorGrupo(grupoId);
    const completo = partidasFinalizadas === 3;

    // Usar repository para marcar grupo como completo - em paralelo
    await Promise.all([
      this.grupoRepository.marcarCompleto(grupoId, completo),
      this.grupoRepository.atualizarContadores(grupoId, {
        partidasFinalizadas,
      }),
    ]);
  }

  /**
   * Buscar jogadores da etapa
   */
  async buscarJogadores(
    etapaId: string,
    arenaId: string
  ): Promise<EstatisticasJogador[]> {
    return await this.estatisticasJogadorRepository.buscarPorEtapa(
      etapaId,
      arenaId
    );
  }

  /**
   * Buscar partidas da etapa
   */
  async buscarPartidas(
    etapaId: string,
    arenaId: string
  ): Promise<PartidaReiDaPraia[]> {
    return await this.partidaReiDaPraiaRepository.buscarPorEtapa(
      etapaId,
      arenaId
    );
  }

  /**
   * Gerar fase eliminatória com duplas fixas
   */
  async gerarFaseEliminatoria(
    etapaId: string,
    arenaId: string,
    classificadosPorGrupo: number = 2,
    tipoChaveamento: TipoChaveamentoReiDaPraia = TipoChaveamentoReiDaPraia.MELHORES_COM_MELHORES
  ): Promise<{
    duplas: Dupla[];
    confrontos: ConfrontoEliminatorio[];
  }> {
    try {
      // Buscar grupos completos via repository
      const grupos = await this.grupoRepository.buscarCompletos(
        etapaId,
        arenaId
      );

      if (grupos.length === 0) {
        throw new Error("Nenhum grupo completo encontrado");
      }

      if (grupos.length === 1) {
        throw new Error(
          "Não é possível gerar fase eliminatória com apenas 1 grupo"
        );
      }

      const todosClassificados: EstatisticasJogador[] = [];

      for (const grupo of grupos) {
        const classificados =
          await estatisticasJogadorService.buscarClassificados(
            grupo.id,
            classificadosPorGrupo
          );

        if (classificados.length < classificadosPorGrupo) {
          throw new Error(
            `Grupo ${grupo.nome} não tem ${classificadosPorGrupo} classificados`
          );
        }

        // Cast necessário pois o service retorna o model e não a interface do repository
        todosClassificados.push(
          ...(classificados as unknown as EstatisticasJogador[])
        );
      }

      // Marcar jogadores como classificados
      for (const jogador of todosClassificados) {
        await estatisticasJogadorService.marcarComoClassificado(
          jogador.jogadorId,
          etapaId,
          true
        );
      }

      // Formar duplas fixas baseado no tipo de chaveamento
      let duplas: Dupla[];

      switch (tipoChaveamento) {
        case TipoChaveamentoReiDaPraia.MELHORES_COM_MELHORES:
          duplas = await this.formarDuplasMelhoresComMelhores(
            etapaId,
            arenaId,
            todosClassificados,
            grupos.length,
            classificadosPorGrupo
          );
          break;

        case TipoChaveamentoReiDaPraia.PAREAMENTO_POR_RANKING:
          duplas = await this.formarDuplasPareamentoPorRanking(
            etapaId,
            arenaId,
            todosClassificados,
            grupos.length,
            classificadosPorGrupo
          );
          break;

        case TipoChaveamentoReiDaPraia.SORTEIO_ALEATORIO:
          duplas = await this.formarDuplasSorteioAleatorio(
            etapaId,
            arenaId,
            todosClassificados
          );
          break;

        default:
          throw new Error(`Tipo de chaveamento inválido: ${tipoChaveamento}`);
      }

      // Gerar confrontos eliminatórios
      const confrontos = await this.gerarConfrontosEliminatorios(
        etapaId,
        arenaId,
        duplas
      );

      // Atualizar status da etapa via repository
      await this.etapaRepository.atualizarStatus(
        etapaId,
        StatusEtapa.FASE_ELIMINATORIA
      );

      logger.info("Fase eliminatória Rei da Praia gerada", {
        etapaId,
        arenaId,
        tipoChaveamento,
        totalGrupos: grupos.length,
        totalClassificados: todosClassificados.length,
        totalDuplas: duplas.length,
        totalConfrontos: confrontos.length,
      });

      return { duplas, confrontos };
    } catch (error: any) {
      logger.error(
        "Erro ao gerar fase eliminatória",
        {
          etapaId,
          arenaId,
          tipoChaveamento,
        },
        error
      );
      throw error;
    }
  }

  /**
   * OPÇÃO 1: Melhores com Melhores
   */
  private async formarDuplasMelhoresComMelhores(
    etapaId: string,
    arenaId: string,
    classificados: EstatisticasJogador[],
    totalGrupos: number,
    _classificadosPorGrupo: number
  ): Promise<Dupla[]> {
    const primeiros: EstatisticasJogador[] = [];
    const segundos: EstatisticasJogador[] = [];

    for (const jogador of classificados) {
      if (jogador.posicaoGrupo === 1) {
        primeiros.push(jogador);
      } else if (jogador.posicaoGrupo === 2) {
        segundos.push(jogador);
      }
    }

    const ordenar = (a: EstatisticasJogador, b: EstatisticasJogador) => {
      const aPontos = a.pontosGrupo ?? 0;
      const bPontos = b.pontosGrupo ?? 0;
      const aVitorias = a.vitoriasGrupo ?? 0;
      const bVitorias = b.vitoriasGrupo ?? 0;
      const aSaldoGames = a.saldoGamesGrupo ?? 0;
      const bSaldoGames = b.saldoGamesGrupo ?? 0;

      if (aPontos !== bPontos) {
        return bPontos - aPontos;
      }
      if (aVitorias !== bVitorias) {
        return bVitorias - aVitorias;
      }
      if (aSaldoGames !== bSaldoGames) {
        return bSaldoGames - aSaldoGames;
      }
      return Math.random() - 0.5;
    };

    primeiros.sort(ordenar);
    segundos.sort(ordenar);

    const duplas: Dupla[] = [];
    const primeirosUsados = new Set<number>();
    const segundosUsados = new Set<number>();

    // FASE 1: DUPLAS FORTES
    const numParesFortes = Math.floor(totalGrupos / 2);

    for (let i = 0; i < numParesFortes * 2; i += 2) {
      const jogador1 = primeiros[i];
      const jogador2 = primeiros[i + 1];

      const dupla = await this.criarDupla(
        etapaId,
        arenaId,
        jogador1,
        jogador2,
        duplas.length + 1
      );
      duplas.push(dupla);
      primeirosUsados.add(i);
      primeirosUsados.add(i + 1);
    }

    // FASE 2: DUPLAS EQUILIBRADAS
    const primeirosRestantes = primeiros.filter(
      (_, idx) => !primeirosUsados.has(idx)
    );
    const segundosRestantes = segundos.filter(
      (_, idx) => !segundosUsados.has(idx)
    );

    const numEquilibradas = totalGrupos % 2;

    for (let i = 0; i < numEquilibradas; i++) {
      const jogador1 = primeirosRestantes[i];
      const jogador2 = segundosRestantes[i];

      const dupla = await this.criarDupla(
        etapaId,
        arenaId,
        jogador1,
        jogador2,
        duplas.length + 1
      );
      duplas.push(dupla);

      const index1 = primeiros.findIndex(
        (p) => p.jogadorId === jogador1.jogadorId
      );
      const index2 = segundos.findIndex(
        (s) => s.jogadorId === jogador2.jogadorId
      );
      primeirosUsados.add(index1);
      segundosUsados.add(index2);
    }

    // FASE 3: DUPLAS FRACAS
    const segundosRestantes2 = segundos.filter(
      (_, idx) => !segundosUsados.has(idx)
    );

    for (let i = 0; i < segundosRestantes2.length; i += 2) {
      if (i + 1 < segundosRestantes2.length) {
        const jogador1 = segundosRestantes2[i];
        const jogador2 = segundosRestantes2[i + 1];

        const dupla = await this.criarDupla(
          etapaId,
          arenaId,
          jogador1,
          jogador2,
          duplas.length + 1
        );
        duplas.push(dupla);
      }
    }

    if (duplas.length !== totalGrupos) {
      throw new Error(
        `Erro: formou ${duplas.length} duplas para ${totalGrupos} grupos!`
      );
    }

    return duplas;
  }

  /**
   * OPÇÃO 2: Pareamento por Ranking (Cruzado)
   */
  private async formarDuplasPareamentoPorRanking(
    etapaId: string,
    arenaId: string,
    classificados: EstatisticasJogador[],
    totalGrupos: number,
    _classificadosPorGrupo: number
  ): Promise<Dupla[]> {
    logger.info("Formando duplas por pareamento por ranking cruzado", {
      etapaId,
      totalClassificados: classificados.length,
      totalGrupos,
    });

    const primeiros: EstatisticasJogador[] = [];
    const segundos: EstatisticasJogador[] = [];

    for (const jogador of classificados) {
      if (jogador.posicaoGrupo === 1) {
        primeiros.push(jogador);
      } else if (jogador.posicaoGrupo === 2) {
        segundos.push(jogador);
      }
    }

    const ordenar = (a: EstatisticasJogador, b: EstatisticasJogador) => {
      const aPontos = a.pontosGrupo ?? 0;
      const bPontos = b.pontosGrupo ?? 0;
      const aVitorias = a.vitoriasGrupo ?? 0;
      const bVitorias = b.vitoriasGrupo ?? 0;
      const aSaldoGames = a.saldoGamesGrupo ?? 0;
      const bSaldoGames = b.saldoGamesGrupo ?? 0;
      const aGamesVencidos = a.gamesVencidosGrupo ?? 0;
      const bGamesVencidos = b.gamesVencidosGrupo ?? 0;
      const aSaldoSets = a.saldoSetsGrupo ?? 0;
      const bSaldoSets = b.saldoSetsGrupo ?? 0;

      if (aPontos !== bPontos) {
        return bPontos - aPontos;
      }
      if (aVitorias !== bVitorias) {
        return bVitorias - aVitorias;
      }
      if (aSaldoGames !== bSaldoGames) {
        return bSaldoGames - aSaldoGames;
      }
      if (aGamesVencidos !== bGamesVencidos) {
        return bGamesVencidos - aGamesVencidos;
      }
      if (aSaldoSets !== bSaldoSets) {
        return bSaldoSets - aSaldoSets;
      }
      return Math.random() - 0.5;
    };

    primeiros.sort(ordenar);
    segundos.sort(ordenar);

    const duplas: Dupla[] = [];

    for (let i = 0; i < totalGrupos; i++) {
      const jogador1 = primeiros[i];
      const jogador2 = segundos[i];

      const dupla = await this.criarDupla(
        etapaId,
        arenaId,
        jogador1,
        jogador2,
        i + 1
      );

      duplas.push(dupla);
    }

    return duplas;
  }

  /**
   * OPÇÃO 3: Sorteio Aleatório
   */
  private async formarDuplasSorteioAleatorio(
    etapaId: string,
    arenaId: string,
    classificados: EstatisticasJogador[]
  ): Promise<Dupla[]> {
    const jogadoresDisponiveis = embaralhar([...classificados]);
    const duplas: Dupla[] = [];
    const usados = new Set<string>();

    let tentativas = 0;
    const maxTentativas = 1000;

    while (jogadoresDisponiveis.length > 0 && tentativas < maxTentativas) {
      tentativas++;

      if (jogadoresDisponiveis.length === 1) {
        throw new Error("Número ímpar de classificados");
      }

      const jogador1 = jogadoresDisponiveis[0];
      let jogador2Index = -1;

      for (let i = 1; i < jogadoresDisponiveis.length; i++) {
        const candidato = jogadoresDisponiveis[i];

        if (
          !usados.has(jogador1.jogadorId) &&
          !usados.has(candidato.jogadorId) &&
          jogador1.grupoId !== candidato.grupoId
        ) {
          jogador2Index = i;
          break;
        }
      }

      if (jogador2Index === -1) {
        const temp = jogadoresDisponiveis.shift()!;
        jogadoresDisponiveis.push(temp);
        continue;
      }

      const jogador2 = jogadoresDisponiveis[jogador2Index];

      const dupla = await this.criarDupla(
        etapaId,
        arenaId,
        jogador1,
        jogador2,
        duplas.length + 1
      );

      duplas.push(dupla);

      usados.add(jogador1.jogadorId);
      usados.add(jogador2.jogadorId);

      jogadoresDisponiveis.splice(jogador2Index, 1);
      jogadoresDisponiveis.shift();
    }

    if (tentativas >= maxTentativas) {
      throw new Error("Não foi possível formar duplas sem repetir grupos");
    }

    return duplas;
  }

  /**
   * Criar dupla fixa para fase eliminatória via repository
   */
  private async criarDupla(
    etapaId: string,
    arenaId: string,
    jogador1: EstatisticasJogador,
    jogador2: EstatisticasJogador,
    _ordem: number
  ): Promise<Dupla> {
    const dupla = await this.duplaRepository.criar({
      etapaId,
      arenaId,
      jogador1Id: jogador1.jogadorId,
      jogador1Nome: jogador1.jogadorNome,
      jogador1Nivel: jogador1.jogadorNivel ? String(jogador1.jogadorNivel) : "",
      jogador1Genero: jogador1.jogadorGenero
        ? String(jogador1.jogadorGenero)
        : "",
      jogador2Id: jogador2.jogadorId,
      jogador2Nome: jogador2.jogadorNome,
      jogador2Nivel: jogador2.jogadorNivel ? String(jogador2.jogadorNivel) : "",
      jogador2Genero: jogador2.jogadorGenero
        ? String(jogador2.jogadorGenero)
        : "",
      grupoId: "",
      grupoNome: "Eliminatória",
    });

    // Marcar como classificada
    await this.duplaRepository.marcarClassificada(dupla.id, true);

    return dupla;
  }

  /**
   * Gerar confrontos eliminatórios via repository
   */
  private async gerarConfrontosEliminatorios(
    etapaId: string,
    arenaId: string,
    duplas: Dupla[]
  ): Promise<ConfrontoEliminatorio[]> {
    const confrontos: ConfrontoEliminatorio[] = [];

    const totalDuplas = duplas.length;
    const proximaPotencia = Math.pow(2, Math.ceil(Math.log2(totalDuplas)));
    const byes = proximaPotencia - totalDuplas;
    const confrontosReais = (totalDuplas - byes) / 2;

    /**
     * NOVA LÓGICA DE DISTRIBUIÇÃO INTELIGENTE
     *
     * Objetivo: Evitar que duplas fortes (primeiras do array) se enfrentem antes da final
     *
     * Estratégia:
     * - Posições ímpares (Q1, Q3): Duplas FORTES (com BYE se houver)
     * - Posições pares (Q2, Q4): Jogos entre duplas FRACAS/MÉDIAS
     *
     * Isso garante que quando usar pareamento sequencial (1-2, 3-4):
     * - S1: Forte (Q1) vs Fraca (Q2)
     * - S2: Forte (Q3) vs Média (Q4)
     * - FINAL: Forte vs Forte ✅
     */

    let ordem = 1;
    let byeIndex = 0;
    let jogoIndex = 0;

    const totalConfrontos = proximaPotencia / 2;

    for (let i = 0; i < totalConfrontos; i++) {
      const posicaoImpar = i % 2 === 0; // Q1, Q3, Q5, Q7 (0, 2, 4, 6)

      if (posicaoImpar && byeIndex < byes) {
        // Posição ímpar + ainda tem BYE → Criar BYE para dupla forte
        const dupla = duplas[byeIndex];

        const confronto = await this.confrontoRepository.criar({
          etapaId,
          arenaId,
          fase: determinarTipoFase(totalDuplas),
          ordem: ordem++,
          dupla1Id: dupla.id,
          dupla1Nome: `${dupla.jogador1Nome} & ${dupla.jogador2Nome}`,
          dupla1Origem: `Dupla ${byeIndex + 1}`,
        });

        // Registrar como BYE (dupla passa direto)
        await this.confrontoRepository.registrarResultado(confronto.id, {
          status: StatusConfrontoEliminatorio.BYE,
          vencedoraId: dupla.id,
          vencedoraNome: `${dupla.jogador1Nome} & ${dupla.jogador2Nome}`,
        });

        confrontos.push({
          ...confronto,
          status: StatusConfrontoEliminatorio.BYE,
          vencedoraId: dupla.id,
          vencedoraNome: `${dupla.jogador1Nome} & ${dupla.jogador2Nome}`,
        });

        byeIndex++;
      } else if (jogoIndex < confrontosReais) {
        // Posição par OU não tem mais BYE → Criar jogo real

        // Estratégia de pareamento:
        // - Pegar duplas das extremidades do array restante (após os BYEs)
        // - Isso coloca duplas mais fracas jogando entre si
        const duplasRestantes = totalDuplas - byes;
        const metadeRestantes = Math.floor(duplasRestantes / 2);

        let seed1Index: number;
        let seed2Index: number;

        if (jogoIndex < metadeRestantes) {
          // Primeira metade dos jogos: pegar das extremidades (mais fracas)
          seed1Index = byes + jogoIndex;
          seed2Index = totalDuplas - 1 - jogoIndex;
        } else {
          // Segunda metade: pegar do meio (médias)
          const offsetMeio = jogoIndex - metadeRestantes;
          seed1Index = byes + metadeRestantes + offsetMeio;
          seed2Index = byes + duplasRestantes - 1 - metadeRestantes - offsetMeio;
        }

        const dupla1 = duplas[seed1Index];
        const dupla2 = duplas[seed2Index];

        const confronto = await this.confrontoRepository.criar({
          etapaId,
          arenaId,
          fase: determinarTipoFase(totalDuplas),
          ordem: ordem++,
          dupla1Id: dupla1.id,
          dupla1Nome: `${dupla1.jogador1Nome} & ${dupla1.jogador2Nome}`,
          dupla1Origem: `Dupla ${seed1Index + 1}`,
          dupla2Id: dupla2.id,
          dupla2Nome: `${dupla2.jogador1Nome} & ${dupla2.jogador2Nome}`,
          dupla2Origem: `Dupla ${seed2Index + 1}`,
        });

        confrontos.push(confronto);
        jogoIndex++;
      } else if (byeIndex < byes) {
        // Sobrou BYE para criar (casos com 3 BYEs)
        const dupla = duplas[byeIndex];

        const confronto = await this.confrontoRepository.criar({
          etapaId,
          arenaId,
          fase: determinarTipoFase(totalDuplas),
          ordem: ordem++,
          dupla1Id: dupla.id,
          dupla1Nome: `${dupla.jogador1Nome} & ${dupla.jogador2Nome}`,
          dupla1Origem: `Dupla ${byeIndex + 1}`,
        });

        // Registrar como BYE (dupla passa direto)
        await this.confrontoRepository.registrarResultado(confronto.id, {
          status: StatusConfrontoEliminatorio.BYE,
          vencedoraId: dupla.id,
          vencedoraNome: `${dupla.jogador1Nome} & ${dupla.jogador2Nome}`,
        });

        confrontos.push({
          ...confronto,
          status: StatusConfrontoEliminatorio.BYE,
          vencedoraId: dupla.id,
          vencedoraNome: `${dupla.jogador1Nome} & ${dupla.jogador2Nome}`,
        });

        byeIndex++;
      }
    }

    logger.info("Confrontos eliminatórios gerados com distribuição inteligente", {
      etapaId,
      totalDuplas,
      totalByes: byes,
      totalJogos: confrontosReais,
      totalConfrontos: confrontos.length,
    });

    return confrontos;
  }

  /**
   * Cancelar fase eliminatória
   */
  async cancelarFaseEliminatoria(
    etapaId: string,
    arenaId: string
  ): Promise<void> {
    try {
      const etapa = await this.etapaRepository.buscarPorIdEArena(
        etapaId,
        arenaId
      );
      if (!etapa) {
        throw new Error("Etapa não encontrada");
      }

      if (etapa.formato !== "rei_da_praia") {
        throw new Error("Esta etapa não é do formato Rei da Praia");
      }

      // Buscar confrontos via repository
      const confrontos = await this.confrontoRepository.buscarPorEtapa(
        etapaId,
        arenaId
      );

      if (confrontos.length === 0) {
        throw new Error("Nenhuma fase eliminatória encontrada para esta etapa");
      }

      // Buscar partidas eliminatórias via repository
      const partidasEliminatorias = await this.partidaRepository.buscarPorTipo(
        etapaId,
        arenaId,
        "eliminatoria"
      );

      let partidasRevertidas = 0;

      if (partidasEliminatorias.length > 0) {
        for (const partida of partidasEliminatorias) {
          if (
            partida.status === StatusPartida.FINALIZADA &&
            partida.placar &&
            partida.placar.length > 0
          ) {
            const dupla1 = await this.duplaRepository.buscarPorId(
              partida.dupla1Id
            );
            const dupla2 = await this.duplaRepository.buscarPorId(
              partida.dupla2Id
            );

            if (dupla1 && dupla2) {
              let setsDupla1 = 0;
              let setsDupla2 = 0;
              let gamesVencidosDupla1 = 0;
              let gamesPerdidosDupla1 = 0;
              let gamesVencidosDupla2 = 0;
              let gamesPerdidosDupla2 = 0;

              partida.placar.forEach((set: any) => {
                if (set.gamesDupla1 > set.gamesDupla2) {
                  setsDupla1++;
                } else {
                  setsDupla2++;
                }
                gamesVencidosDupla1 += set.gamesDupla1;
                gamesPerdidosDupla1 += set.gamesDupla2;
                gamesVencidosDupla2 += set.gamesDupla2;
                gamesPerdidosDupla2 += set.gamesDupla1;
              });

              const dupla1Venceu = partida.vencedoraId === dupla1.id;

              await estatisticasJogadorService.reverterAposPartida(
                dupla1.jogador1Id,
                etapaId,
                {
                  venceu: dupla1Venceu,
                  setsVencidos: setsDupla1,
                  setsPerdidos: setsDupla2,
                  gamesVencidos: gamesVencidosDupla1,
                  gamesPerdidos: gamesPerdidosDupla1,
                }
              );

              await estatisticasJogadorService.reverterAposPartida(
                dupla1.jogador2Id,
                etapaId,
                {
                  venceu: dupla1Venceu,
                  setsVencidos: setsDupla1,
                  setsPerdidos: setsDupla2,
                  gamesVencidos: gamesVencidosDupla1,
                  gamesPerdidos: gamesPerdidosDupla1,
                }
              );

              await estatisticasJogadorService.reverterAposPartida(
                dupla2.jogador1Id,
                etapaId,
                {
                  venceu: !dupla1Venceu,
                  setsVencidos: setsDupla2,
                  setsPerdidos: setsDupla1,
                  gamesVencidos: gamesVencidosDupla2,
                  gamesPerdidos: gamesPerdidosDupla2,
                }
              );

              await estatisticasJogadorService.reverterAposPartida(
                dupla2.jogador2Id,
                etapaId,
                {
                  venceu: !dupla1Venceu,
                  setsVencidos: setsDupla2,
                  setsPerdidos: setsDupla1,
                  gamesVencidos: gamesVencidosDupla2,
                  gamesPerdidos: gamesPerdidosDupla2,
                }
              );

              partidasRevertidas++;
            }
          }
        }

        // Excluir partidas eliminatórias via repository
        await this.partidaRepository.deletarEliminatoriasPorEtapa(
          etapaId,
          arenaId
        );
      }

      // Excluir confrontos via repository
      const confrontosRemovidos =
        await this.confrontoRepository.deletarPorEtapa(etapaId, arenaId);

      // Excluir duplas via repository
      const duplasRemovidas = await this.duplaRepository.deletarPorEtapa(
        etapaId,
        arenaId
      );

      // Desmarcar jogadores como classificados via repository
      const estatisticas =
        await this.estatisticasJogadorRepository.buscarPorEtapa(
          etapaId,
          arenaId
        );
      for (const est of estatisticas) {
        await this.estatisticasJogadorRepository.atualizar(est.id, {
          posicaoGrupo: undefined,
        });
      }

      // Voltar status da etapa via repository
      await this.etapaRepository.atualizarStatus(
        etapaId,
        StatusEtapa.CHAVES_GERADAS
      );

      logger.info("Fase eliminatória Rei da Praia cancelada", {
        etapaId,
        arenaId,
        confrontosRemovidos,
        partidasRemovidas: partidasEliminatorias.length,
        partidasRevertidas,
        duplasRemovidas,
        jogadoresDesmarcados: estatisticas.length,
      });
    } catch (error: any) {
      logger.error(
        "Erro ao cancelar fase eliminatória",
        {
          etapaId,
          arenaId,
        },
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
const duplaRepositoryInstance = new DuplaRepository();
const confrontoRepositoryInstance = new ConfrontoEliminatorioRepository();
const partidaReiDaPraiaRepositoryInstance = new PartidaReiDaPraiaRepository();
const estatisticasJogadorRepositoryInstance =
  new EstatisticasJogadorRepository();
const partidaRepositoryInstance = new PartidaRepository();

export default new ReiDaPraiaService(
  etapaRepositoryInstance,
  inscricaoRepositoryInstance,
  grupoRepositoryInstance,
  duplaRepositoryInstance,
  confrontoRepositoryInstance,
  partidaReiDaPraiaRepositoryInstance,
  estatisticasJogadorRepositoryInstance,
  partidaRepositoryInstance
);
