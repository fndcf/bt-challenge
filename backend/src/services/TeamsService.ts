import {
  Equipe,
  ConfrontoEquipe,
  PartidaTeams,
  JogadorEquipe,
  CriarEquipeDTO,
  CriarConfrontoDTO,
  CriarPartidaTeamsDTO,
  RegistrarResultadoTeamsDTO,
  FormacaoManualEquipeDTO,
  DefinirPartidasManualDTO,
  VarianteTeams,
  TipoFormacaoEquipe,
  TipoFormacaoJogos,
  TipoJogoTeams,
  SetPlacarTeams,
  StatusConfronto,
} from "../models/Teams";
import { Etapa, StatusEtapa, FaseEtapa, FormatoEtapa } from "../models/Etapa";
import { StatusPartida } from "../models/Partida";
import { NivelJogador, GeneroJogador } from "../models/Jogador";
import { IEquipeRepository } from "../repositories/interfaces/IEquipeRepository";
import { IConfrontoEquipeRepository } from "../repositories/interfaces/IConfrontoEquipeRepository";
import { IPartidaTeamsRepository } from "../repositories/interfaces/IPartidaTeamsRepository";
import { IEtapaRepository } from "../repositories/interfaces/IEtapaRepository";
import EquipeRepository from "../repositories/firebase/EquipeRepository";
import ConfrontoEquipeRepository from "../repositories/firebase/ConfrontoEquipeRepository";
import PartidaTeamsRepository from "../repositories/firebase/PartidaTeamsRepository";
import { EtapaRepository } from "../repositories/firebase/EtapaRepository";
import { EstatisticasJogadorService } from "./EstatisticasJogadorService";
import { NotFoundError, ValidationError } from "../utils/errors";
import {
  calcularDistribuicaoGrupos,
  LETRAS_GRUPOS,
} from "../utils/torneioUtils";
import logger from "../utils/logger";

interface Inscricao {
  jogadorId: string;
  jogadorNome: string;
  nivel: NivelJogador;
  genero: GeneroJogador;
}

export class TeamsService {
  constructor(
    private equipeRepository: IEquipeRepository = EquipeRepository,
    private confrontoRepository: IConfrontoEquipeRepository = ConfrontoEquipeRepository,
    private partidaRepository: IPartidaTeamsRepository = PartidaTeamsRepository,
    private estatisticasService: EstatisticasJogadorService = new EstatisticasJogadorService(),
    private etapaRepository: IEtapaRepository = new EtapaRepository()
  ) {}

  // ==================== FORMAÇÃO DE EQUIPES ====================

  /**
   * Gera equipes automaticamente baseado no tipo de formação
   * ✅ OTIMIZAÇÃO v4: Adiciona logs de timing completos
   */
  async gerarEquipes(
    etapa: Etapa,
    inscricoes: Inscricao[]
  ): Promise<{
    equipes: Equipe[];
    estatisticas: any[];
    temFaseGrupos: boolean;
  }> {
    const tempos: Record<string, number> = {};
    const inicioTotal = Date.now();

    // Validações básicas de etapa (rápidas e essenciais)
    this.validarEtapaParaGeracaoEquipes(etapa);

    const variante = etapa.varianteTeams!;
    const tipoFormacao = etapa.tipoFormacaoEquipe!;
    const isMisto = etapa.isMisto || etapa.genero === GeneroJogador.MISTO;
    const numEquipes = inscricoes.length / variante;

    // 1. Distribuir jogadores em equipes
    let inicio = Date.now();
    let jogadoresPorEquipe: JogadorEquipe[][];

    switch (tipoFormacao) {
      case TipoFormacaoEquipe.BALANCEADO:
        jogadoresPorEquipe = this.distribuirBalanceado(
          inscricoes,
          numEquipes,
          variante,
          isMisto
        );
        break;
      case TipoFormacaoEquipe.MESMO_NIVEL:
      default:
        jogadoresPorEquipe = this.distribuirAleatorio(
          inscricoes,
          numEquipes,
          variante,
          isMisto
        );
        break;
    }
    tempos["1_distribuirJogadores"] = Date.now() - inicio;

    // Com 6+ equipes, dividir em grupos
    const temFaseGrupos = numEquipes >= 6;
    const grupos = temFaseGrupos ? this.calcularGrupos(numEquipes) : null;

    // 2. Preparar DTOs de equipes
    inicio = Date.now();
    const equipeDTOs: CriarEquipeDTO[] = jogadoresPorEquipe.map(
      (jogadores, index) => {
        const dto: CriarEquipeDTO = {
          etapaId: etapa.id,
          arenaId: etapa.arenaId,
          nome: `Equipe ${index + 1}`,
          jogadores,
        };

        if (grupos) {
          const grupoInfo = this.atribuirGrupo(index, grupos);
          dto.grupoId = grupoInfo.grupoId;
          dto.grupoNome = grupoInfo.grupoNome;
        }

        return dto;
      }
    );
    tempos["2_prepararDTOs"] = Date.now() - inicio;

    // 3. Criar equipes no banco
    inicio = Date.now();
    const equipes = await this.equipeRepository.criarEmLote(equipeDTOs);
    tempos["3_criarEquipes"] = Date.now() - inicio;

    // 4. Criar estatísticas individuais para cada jogador EM LOTE
    inicio = Date.now();
    const estatisticasDTOs = equipes.flatMap((equipe) =>
      equipe.jogadores.map((jogador) => ({
        etapaId: etapa.id,
        arenaId: etapa.arenaId,
        jogadorId: jogador.id,
        jogadorNome: jogador.nome,
        jogadorNivel: jogador.nivel,
        jogadorGenero: jogador.genero,
        grupoId: equipe.id,
        grupoNome: equipe.nome,
      }))
    );

    const estatisticas = await this.estatisticasService.criarEmLote(
      estatisticasDTOs
    );
    tempos["4_criarEstatisticas"] = Date.now() - inicio;

    tempos["TOTAL"] = Date.now() - inicioTotal;

    logger.info("⏱️ TEMPOS gerarEquipes Teams", {
      etapaId: etapa.id,
      inscricoes: inscricoes.length,
      equipes: equipes.length,
      estatisticas: estatisticas.length,
      temFaseGrupos,
      tempos,
    });

    return { equipes, estatisticas, temFaseGrupos };
  }

  /**
   * Formação manual de equipes
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
    this.validarEtapaParaGeracaoEquipes(etapa);

    const variante = etapa.varianteTeams!;
    // Etapa é mista se: isMisto é true, OU genero é MISTO
    const isMisto = etapa.isMisto || etapa.genero === GeneroJogador.MISTO;

    // Criar mapa de inscrições para acesso rápido
    const inscricoesMap = new Map(inscricoes.map((i) => [i.jogadorId, i]));

    // Validar cada formação
    for (const formacao of formacoes) {
      if (formacao.jogadorIds.length !== variante) {
        throw new ValidationError(
          `Cada equipe deve ter exatamente ${variante} jogadores`
        );
      }

      // Validar proporção de gênero para etapas mistas
      if (isMisto) {
        const jogadoresDaEquipe = formacao.jogadorIds.map((id) =>
          inscricoesMap.get(id)
        );
        const femininas = jogadoresDaEquipe.filter(
          (j) => j?.genero === GeneroJogador.FEMININO
        ).length;
        const masculinos = jogadoresDaEquipe.filter(
          (j) => j?.genero === GeneroJogador.MASCULINO
        ).length;

        const femininasEsperadas = variante / 2;
        const masculinosEsperados = variante / 2;

        if (
          femininas !== femininasEsperadas ||
          masculinos !== masculinosEsperados
        ) {
          const nomeEquipe =
            formacao.nome || `Equipe ${formacoes.indexOf(formacao) + 1}`;
          throw new ValidationError(
            `${nomeEquipe}: Cada equipe mista deve ter ${femininasEsperadas} jogadoras femininas e ${masculinosEsperados} jogadores masculinos. ` +
              `Encontrado: ${femininas}F + ${masculinos}M`
          );
        }
      }
    }

    // Verificar se todos os jogadores estão inscritos
    const inscritosIds = new Set(inscricoes.map((i) => i.jogadorId));
    const jogadoresUsados = new Set<string>();

    for (const formacao of formacoes) {
      for (const jogadorId of formacao.jogadorIds) {
        if (!inscritosIds.has(jogadorId)) {
          throw new ValidationError(`Jogador ${jogadorId} não está inscrito`);
        }
        if (jogadoresUsados.has(jogadorId)) {
          throw new ValidationError(
            `Jogador ${jogadorId} já está em outra equipe`
          );
        }
        jogadoresUsados.add(jogadorId);
      }
    }

    // Com 6+ equipes, dividir em grupos
    const numEquipes = formacoes.length;
    const temFaseGrupos = numEquipes >= 6;
    const grupos = temFaseGrupos ? this.calcularGrupos(numEquipes) : null;

    // Criar equipes com atribuição de grupos
    const equipeDTOs: CriarEquipeDTO[] = formacoes.map((formacao, index) => {
      const dto: CriarEquipeDTO = {
        etapaId: etapa.id,
        arenaId: etapa.arenaId,
        nome: formacao.nome || `Equipe ${index + 1}`,
        jogadores: formacao.jogadorIds.map((id) => {
          const inscricao = inscricoesMap.get(id)!;
          return {
            id: inscricao.jogadorId,
            nome: inscricao.jogadorNome,
            nivel: inscricao.nivel,
            genero: inscricao.genero,
          };
        }),
      };

      // Atribuir grupo se aplicável
      if (grupos) {
        const grupoInfo = this.atribuirGrupo(index, grupos);
        dto.grupoId = grupoInfo.grupoId;
        dto.grupoNome = grupoInfo.grupoNome;
      }

      return dto;
    });

    const equipes = await this.equipeRepository.criarEmLote(equipeDTOs);

    // Criar estatísticas EM LOTE (otimizado)
    const estatisticasDTOs = equipes.flatMap((equipe) =>
      equipe.jogadores.map((jogador) => ({
        etapaId: etapa.id,
        arenaId: etapa.arenaId,
        jogadorId: jogador.id,
        jogadorNome: jogador.nome,
        jogadorNivel: jogador.nivel,
        jogadorGenero: jogador.genero,
        grupoId: equipe.id,
        grupoNome: equipe.nome,
      }))
    );

    const estatisticas = await this.estatisticasService.criarEmLote(
      estatisticasDTOs
    );

    logger.info("Equipes formadas manualmente com sucesso", {
      etapaId: etapa.id,
      numEquipes: equipes.length,
      temFaseGrupos,
      grupos: grupos ? grupos.length : 0,
    });

    return { equipes, estatisticas, temFaseGrupos };
  }

  // ==================== CONFRONTOS ====================

  /**
   * Gera confrontos round-robin entre equipes
   * Com 6+ equipes: gera fase de grupos + fase eliminatória
   * Com 2-5 equipes: gera todos contra todos
   * ✅ OTIMIZAÇÃO v3: Gerar partidas de todos os confrontos em paralelo
   */
  async gerarConfrontos(
    etapa: Etapa,
    tipoFormacaoJogos: TipoFormacaoJogos = TipoFormacaoJogos.SORTEIO,
    equipesJaCriadas?: Equipe[]
  ): Promise<ConfrontoEquipe[]> {
    const tempos: Record<string, number> = {};
    const inicioTotal = Date.now();

    try {
      // 1. Usar equipes já criadas ou buscar do banco
      let inicio = Date.now();
      const equipes = equipesJaCriadas || await this.equipeRepository.buscarPorEtapaOrdenadas(
        etapa.id,
        etapa.arenaId
      );
      tempos["1_buscarEquipes"] = Date.now() - inicio;
      tempos["1_equipesJaCriadas"] = equipesJaCriadas ? 1 : 0;

      if (equipes.length < 2) {
        throw new ValidationError("Mínimo de 2 equipes para gerar confrontos");
      }

      const temFaseGrupos = equipes.length >= 6;

      // 2. Gerar confrontos
      inicio = Date.now();
      let confrontos: ConfrontoEquipe[];
      if (temFaseGrupos) {
        confrontos = await this.gerarConfrontosFaseGrupos(
          etapa,
          equipes,
          tipoFormacaoJogos
        );
      } else {
        confrontos = await this.gerarConfrontosRoundRobin(
          etapa,
          equipes,
          tipoFormacaoJogos
        );
      }
      tempos["2_gerarConfrontos"] = Date.now() - inicio;

      // 3. Gerar partidas para confrontos com equipes definidas (fase de grupos)
      // ✅ OTIMIZAÇÃO v4: Criar Map de equipes e gerar TODAS partidas em um único batch
      inicio = Date.now();
      const confrontosComEquipes = confrontos.filter(
        (c) => c.equipe1Id && c.equipe2Id && c.fase === FaseEtapa.GRUPOS
      );

      // Criar Map de equipes para lookup O(1)
      const equipesMap = new Map(equipes.map((e) => [e.id, e]));

      // Gerar todos os DTOs de partidas de uma vez
      const todosPartidaDTOs: CriarPartidaTeamsDTO[] = [];
      const partidasPorConfronto: Map<string, number> = new Map();

      const variante = etapa.varianteTeams!;
      const tipoFormacao = etapa.tipoFormacaoJogos || TipoFormacaoJogos.SORTEIO;
      const isMisto = etapa.isMisto || etapa.genero === GeneroJogador.MISTO;

      for (const confronto of confrontosComEquipes) {
        const equipe1 = equipesMap.get(confronto.equipe1Id);
        const equipe2 = equipesMap.get(confronto.equipe2Id);

        if (!equipe1 || !equipe2) {
          logger.error("Equipe não encontrada para confronto", {
            confrontoId: confronto.id,
            equipe1Id: confronto.equipe1Id,
            equipe2Id: confronto.equipe2Id,
          });
          continue;
        }

        // Se for formação MANUAL, pular (partidas vazias serão criadas depois)
        if (tipoFormacao === TipoFormacaoJogos.MANUAL) {
          continue;
        }

        const startIndex = todosPartidaDTOs.length;
        const partidasDTO = this.montarPartidasConfrontoDTO(
          confronto,
          etapa,
          equipe1,
          equipe2,
          variante,
          isMisto
        );
        todosPartidaDTOs.push(...partidasDTO);
        partidasPorConfronto.set(confronto.id, todosPartidaDTOs.length - startIndex);
      }
      tempos["3a_prepararDTOs"] = Date.now() - inicio;

      // Criar todas as partidas em um único batch
      inicio = Date.now();
      let partidasGeradas = 0;
      if (todosPartidaDTOs.length > 0) {
        const todasPartidas = await this.partidaRepository.criarEmLote(todosPartidaDTOs);
        partidasGeradas = todasPartidas.length;

        // Atualizar confrontos com IDs das partidas em paralelo
        let partidaIndex = 0;
        const atualizacoesConfrontos = confrontosComEquipes
          .filter((c) => partidasPorConfronto.has(c.id))
          .map((confronto) => {
            const qtdPartidas = partidasPorConfronto.get(confronto.id) || 0;
            const partidasDoConfronto = todasPartidas.slice(
              partidaIndex,
              partidaIndex + qtdPartidas
            );
            partidaIndex += qtdPartidas;

            const partidasIds = partidasDoConfronto.map((p) => p.id);
            return this.confrontoRepository.adicionarPartidasEmLote(confronto.id, partidasIds);
          });

        await Promise.all(atualizacoesConfrontos);
      }
      tempos["3b_criarPartidas"] = Date.now() - inicio;
      tempos["3_gerarPartidas"] = tempos["3a_prepararDTOs"] + tempos["3b_criarPartidas"];

      tempos["TOTAL"] = Date.now() - inicioTotal;

      logger.info("⏱️ TEMPOS gerarConfrontos Teams", {
        etapaId: etapa.id,
        equipes: equipes.length,
        confrontos: confrontos.length,
        partidasGeradas,
        temFaseGrupos,
        tempos,
      });

      return confrontos;
    } catch (error: any) {
      tempos["TOTAL_COM_ERRO"] = Date.now() - inicioTotal;
      logger.error("Erro ao gerar confrontos Teams", { etapaId: etapa.id, tempos }, error);
      throw error;
    }
  }

  /**
   * ✅ OTIMIZAÇÃO v5: Gera apenas os DTOs de confrontos round-robin (sem criar no banco)
   */
  private montarConfrontosRoundRobinDTO(
    etapa: Etapa,
    equipes: Equipe[],
    tipoFormacaoJogos: TipoFormacaoJogos,
    grupoId?: string,
    ordemInicial: number = 1
  ): CriarConfrontoDTO[] {
    const confrontoDTOs: CriarConfrontoDTO[] = [];
    const n = equipes.length;

    // Algoritmo circle method para round-robin
    const numRodadas = n % 2 === 0 ? n - 1 : n;
    const equipesArray = [...equipes];

    // Se ímpar, adicionar "bye" (null)
    if (n % 2 !== 0) {
      equipesArray.push(null as any);
    }

    const numEquipesComBye = equipesArray.length;
    let ordem = ordemInicial;

    for (let rodada = 1; rodada <= numRodadas; rodada++) {
      for (let i = 0; i < numEquipesComBye / 2; i++) {
        const equipe1 = equipesArray[i];
        const equipe2 = equipesArray[numEquipesComBye - 1 - i];

        if (equipe1 && equipe2) {
          confrontoDTOs.push({
            etapaId: etapa.id,
            arenaId: etapa.arenaId,
            fase: FaseEtapa.GRUPOS,
            rodada,
            ordem: ordem++,
            grupoId,
            equipe1Id: equipe1.id,
            equipe1Nome: equipe1.nome,
            equipe2Id: equipe2.id,
            equipe2Nome: equipe2.nome,
            tipoFormacaoJogos,
          });
        }
      }

      // Rotacionar equipes
      const fixed = equipesArray[0];
      const rotating = equipesArray.slice(1);
      rotating.unshift(rotating.pop()!);
      equipesArray.splice(0, equipesArray.length, fixed, ...rotating);
    }

    return confrontoDTOs;
  }

  /**
   * Gera confrontos round-robin simples (todos contra todos)
   * Usado quando não há fase de grupos (< 6 equipes)
   */
  private async gerarConfrontosRoundRobin(
    etapa: Etapa,
    equipes: Equipe[],
    tipoFormacaoJogos: TipoFormacaoJogos,
    grupoId?: string
  ): Promise<ConfrontoEquipe[]> {
    const confrontoDTOs = this.montarConfrontosRoundRobinDTO(
      etapa,
      equipes,
      tipoFormacaoJogos,
      grupoId
    );
    return this.confrontoRepository.criarEmLote(confrontoDTOs);
  }

  /**
   * Gera confrontos com fase de grupos + fase eliminatória
   * ✅ OTIMIZAÇÃO v5: Gerar todos DTOs de grupos e criar em um ÚNICO batch
   */
  private async gerarConfrontosFaseGrupos(
    etapa: Etapa,
    equipes: Equipe[],
    tipoFormacaoJogos: TipoFormacaoJogos
  ): Promise<ConfrontoEquipe[]> {
    // Separar equipes por grupo
    const gruposMap = new Map<string, Equipe[]>();
    for (const equipe of equipes) {
      const grupoId = equipe.grupoId || "A";
      if (!gruposMap.has(grupoId)) {
        gruposMap.set(grupoId, []);
      }
      gruposMap.get(grupoId)!.push(equipe);
    }

    // ✅ OTIMIZAÇÃO v5: Gerar todos os DTOs de confrontos de grupos em memória
    const todosConfrontoDTOs: CriarConfrontoDTO[] = [];
    let ordemGlobal = 1;

    for (const [grupoId, equipesDoGrupo] of gruposMap.entries()) {
      const dtos = this.montarConfrontosRoundRobinDTO(
        etapa,
        equipesDoGrupo,
        tipoFormacaoJogos,
        grupoId,
        ordemGlobal
      );
      todosConfrontoDTOs.push(...dtos);
      ordemGlobal += dtos.length;
    }

    // ✅ Criar todos os confrontos de grupos em um ÚNICO batch
    const confrontosGrupos = await this.confrontoRepository.criarEmLote(todosConfrontoDTOs);

    // Gerar fase eliminatória (semifinais e final) - precisa de batch separado pois tem dependências de IDs
    const confrontosEliminatoria = await this.gerarFaseEliminatoria(
      etapa,
      Array.from(gruposMap.keys()),
      tipoFormacaoJogos
    );

    return [...confrontosGrupos, ...confrontosEliminatoria];
  }

  /**
   * Gera a fase eliminatória baseada no número de grupos
   *
   * 2 grupos: Semifinal direto (4 classificados)
   * 3 grupos: Quartas com 2 BYEs (6 classificados)
   * 4 grupos: Quartas sem BYEs (8 classificados)
   * 5 grupos: Oitavas com 6 BYEs (10 classificados)
   * 6 grupos: Oitavas com 4 BYEs (12 classificados)
   * 7 grupos: Oitavas com 2 BYEs (14 classificados)
   * 8 grupos: Oitavas sem BYEs (16 classificados)
   */
  private async gerarFaseEliminatoria(
    etapa: Etapa,
    grupoIds: string[],
    tipoFormacaoJogos: TipoFormacaoJogos
  ): Promise<ConfrontoEquipe[]> {
    const numGrupos = grupoIds.length;

    if (numGrupos < 2 || numGrupos > 8) {
      logger.warn(
        `Fase eliminatória suporta 2-8 grupos. Recebido: ${numGrupos}`
      );
      return [];
    }

    // Ordenar grupos por letra (A, B, C, D, ...)
    const gruposOrdenados = grupoIds.sort();

    switch (numGrupos) {
      case 2:
        return this.gerarEliminatoria2Grupos(
          etapa,
          gruposOrdenados,
          tipoFormacaoJogos
        );
      case 3:
        return this.gerarEliminatoria3Grupos(
          etapa,
          gruposOrdenados,
          tipoFormacaoJogos
        );
      case 4:
        return this.gerarEliminatoria4Grupos(
          etapa,
          gruposOrdenados,
          tipoFormacaoJogos
        );
      case 5:
        return this.gerarEliminatoria5Grupos(
          etapa,
          gruposOrdenados,
          tipoFormacaoJogos
        );
      case 6:
        return this.gerarEliminatoria6Grupos(
          etapa,
          gruposOrdenados,
          tipoFormacaoJogos
        );
      case 7:
        return this.gerarEliminatoria7Grupos(
          etapa,
          gruposOrdenados,
          tipoFormacaoJogos
        );
      case 8:
        return this.gerarEliminatoria8Grupos(
          etapa,
          gruposOrdenados,
          tipoFormacaoJogos
        );
      default:
        return [];
    }
  }

  /**
   * 2 grupos: Semifinal direto
   * S1: 1A x 2B → Final
   * S2: 1B x 2A → Final
   */
  private async gerarEliminatoria2Grupos(
    etapa: Etapa,
    grupos: string[],
    tipoFormacaoJogos: TipoFormacaoJogos
  ): Promise<ConfrontoEquipe[]> {
    const [grupoA, grupoB] = grupos;

    // Criar final primeiro
    const confrontoFinal = await this.confrontoRepository.criar({
      etapaId: etapa.id,
      arenaId: etapa.arenaId,
      fase: FaseEtapa.FINAL,
      ordem: 3,
      equipe1Id: "",
      equipe1Nome: "",
      equipe2Id: "",
      equipe2Nome: "",
      equipe1Origem: "Vencedor Semifinal 1",
      equipe2Origem: "Vencedor Semifinal 2",
      tipoFormacaoJogos,
    });

    // Criar semifinais
    const semifinais = await this.confrontoRepository.criarEmLote([
      {
        etapaId: etapa.id,
        arenaId: etapa.arenaId,
        fase: FaseEtapa.SEMIFINAL,
        ordem: 1,
        equipe1Id: "",
        equipe1Nome: "",
        equipe2Id: "",
        equipe2Nome: "",
        equipe1Origem: `1º Grupo ${grupoA}`,
        equipe2Origem: `2º Grupo ${grupoB}`,
        tipoFormacaoJogos,
        proximoConfrontoId: confrontoFinal.id,
      },
      {
        etapaId: etapa.id,
        arenaId: etapa.arenaId,
        fase: FaseEtapa.SEMIFINAL,
        ordem: 2,
        equipe1Id: "",
        equipe1Nome: "",
        equipe2Id: "",
        equipe2Nome: "",
        equipe1Origem: `1º Grupo ${grupoB}`,
        equipe2Origem: `2º Grupo ${grupoA}`,
        tipoFormacaoJogos,
        proximoConfrontoId: confrontoFinal.id,
      },
    ]);

    return [...semifinais, confrontoFinal];
  }

  /**
   * 3 grupos: Quartas com 2 BYEs
   * Q1: 1A x BYE → S1
   * Q2: 1C x 2B → S1
   * Q3: 1B x BYE → S2
   * Q4: 2A x 2C → S2
   */
  private async gerarEliminatoria3Grupos(
    etapa: Etapa,
    grupos: string[],
    tipoFormacaoJogos: TipoFormacaoJogos
  ): Promise<ConfrontoEquipe[]> {
    const [grupoA, grupoB, grupoC] = grupos;

    // Criar final
    const confrontoFinal = await this.confrontoRepository.criar({
      etapaId: etapa.id,
      arenaId: etapa.arenaId,
      fase: FaseEtapa.FINAL,
      ordem: 7,
      equipe1Id: "",
      equipe1Nome: "",
      equipe2Id: "",
      equipe2Nome: "",
      equipe1Origem: "Vencedor Semifinal 1",
      equipe2Origem: "Vencedor Semifinal 2",
      tipoFormacaoJogos,
    });

    // Criar semifinais
    const semifinais = await this.confrontoRepository.criarEmLote([
      {
        etapaId: etapa.id,
        arenaId: etapa.arenaId,
        fase: FaseEtapa.SEMIFINAL,
        ordem: 5,
        equipe1Id: "",
        equipe1Nome: "",
        equipe2Id: "",
        equipe2Nome: "",
        equipe1Origem: "Vencedor Quartas 1",
        equipe2Origem: "Vencedor Quartas 2",
        tipoFormacaoJogos,
        proximoConfrontoId: confrontoFinal.id,
      },
      {
        etapaId: etapa.id,
        arenaId: etapa.arenaId,
        fase: FaseEtapa.SEMIFINAL,
        ordem: 6,
        equipe1Id: "",
        equipe1Nome: "",
        equipe2Id: "",
        equipe2Nome: "",
        equipe1Origem: "Vencedor Quartas 3",
        equipe2Origem: "Vencedor Quartas 4",
        tipoFormacaoJogos,
        proximoConfrontoId: confrontoFinal.id,
      },
    ]);

    // Criar quartas (Q1 e Q3 são BYEs, passam direto)
    const quartas = await this.confrontoRepository.criarEmLote([
      {
        etapaId: etapa.id,
        arenaId: etapa.arenaId,
        fase: FaseEtapa.QUARTAS,
        ordem: 1,
        equipe1Id: "",
        equipe1Nome: "",
        equipe2Id: "BYE",
        equipe2Nome: "BYE",
        equipe1Origem: `1º Grupo ${grupoA}`,
        equipe2Origem: "BYE",
        tipoFormacaoJogos,
        proximoConfrontoId: semifinais[0].id,
        isBye: true,
      },
      {
        etapaId: etapa.id,
        arenaId: etapa.arenaId,
        fase: FaseEtapa.QUARTAS,
        ordem: 2,
        equipe1Id: "",
        equipe1Nome: "",
        equipe2Id: "",
        equipe2Nome: "",
        equipe1Origem: `1º Grupo ${grupoC}`,
        equipe2Origem: `2º Grupo ${grupoB}`,
        tipoFormacaoJogos,
        proximoConfrontoId: semifinais[0].id,
      },
      {
        etapaId: etapa.id,
        arenaId: etapa.arenaId,
        fase: FaseEtapa.QUARTAS,
        ordem: 3,
        equipe1Id: "",
        equipe1Nome: "",
        equipe2Id: "BYE",
        equipe2Nome: "BYE",
        equipe1Origem: `1º Grupo ${grupoB}`,
        equipe2Origem: "BYE",
        tipoFormacaoJogos,
        proximoConfrontoId: semifinais[1].id,
        isBye: true,
      },
      {
        etapaId: etapa.id,
        arenaId: etapa.arenaId,
        fase: FaseEtapa.QUARTAS,
        ordem: 4,
        equipe1Id: "",
        equipe1Nome: "",
        equipe2Id: "",
        equipe2Nome: "",
        equipe1Origem: `2º Grupo ${grupoA}`,
        equipe2Origem: `2º Grupo ${grupoC}`,
        tipoFormacaoJogos,
        proximoConfrontoId: semifinais[1].id,
      },
    ]);

    return [...quartas, ...semifinais, confrontoFinal];
  }

  /**
   * 4 grupos: Quartas sem BYEs
   * Q1: 1A x 2B → S1
   * Q2: 1C x 2D → S1
   * Q3: 1B x 2A → S2
   * Q4: 1D x 2C → S2
   */
  private async gerarEliminatoria4Grupos(
    etapa: Etapa,
    grupos: string[],
    tipoFormacaoJogos: TipoFormacaoJogos
  ): Promise<ConfrontoEquipe[]> {
    const [grupoA, grupoB, grupoC, grupoD] = grupos;

    // Criar final
    const confrontoFinal = await this.confrontoRepository.criar({
      etapaId: etapa.id,
      arenaId: etapa.arenaId,
      fase: FaseEtapa.FINAL,
      ordem: 7,
      equipe1Id: "",
      equipe1Nome: "",
      equipe2Id: "",
      equipe2Nome: "",
      equipe1Origem: "Vencedor Semifinal 1",
      equipe2Origem: "Vencedor Semifinal 2",
      tipoFormacaoJogos,
    });

    // Criar semifinais
    const semifinais = await this.confrontoRepository.criarEmLote([
      {
        etapaId: etapa.id,
        arenaId: etapa.arenaId,
        fase: FaseEtapa.SEMIFINAL,
        ordem: 5,
        equipe1Id: "",
        equipe1Nome: "",
        equipe2Id: "",
        equipe2Nome: "",
        equipe1Origem: "Vencedor Quartas 1",
        equipe2Origem: "Vencedor Quartas 2",
        tipoFormacaoJogos,
        proximoConfrontoId: confrontoFinal.id,
      },
      {
        etapaId: etapa.id,
        arenaId: etapa.arenaId,
        fase: FaseEtapa.SEMIFINAL,
        ordem: 6,
        equipe1Id: "",
        equipe1Nome: "",
        equipe2Id: "",
        equipe2Nome: "",
        equipe1Origem: "Vencedor Quartas 3",
        equipe2Origem: "Vencedor Quartas 4",
        tipoFormacaoJogos,
        proximoConfrontoId: confrontoFinal.id,
      },
    ]);

    // Criar quartas
    const quartas = await this.confrontoRepository.criarEmLote([
      {
        etapaId: etapa.id,
        arenaId: etapa.arenaId,
        fase: FaseEtapa.QUARTAS,
        ordem: 1,
        equipe1Id: "",
        equipe1Nome: "",
        equipe2Id: "",
        equipe2Nome: "",
        equipe1Origem: `1º Grupo ${grupoA}`,
        equipe2Origem: `2º Grupo ${grupoB}`,
        tipoFormacaoJogos,
        proximoConfrontoId: semifinais[0].id,
      },
      {
        etapaId: etapa.id,
        arenaId: etapa.arenaId,
        fase: FaseEtapa.QUARTAS,
        ordem: 2,
        equipe1Id: "",
        equipe1Nome: "",
        equipe2Id: "",
        equipe2Nome: "",
        equipe1Origem: `1º Grupo ${grupoC}`,
        equipe2Origem: `2º Grupo ${grupoD}`,
        tipoFormacaoJogos,
        proximoConfrontoId: semifinais[0].id,
      },
      {
        etapaId: etapa.id,
        arenaId: etapa.arenaId,
        fase: FaseEtapa.QUARTAS,
        ordem: 3,
        equipe1Id: "",
        equipe1Nome: "",
        equipe2Id: "",
        equipe2Nome: "",
        equipe1Origem: `1º Grupo ${grupoB}`,
        equipe2Origem: `2º Grupo ${grupoA}`,
        tipoFormacaoJogos,
        proximoConfrontoId: semifinais[1].id,
      },
      {
        etapaId: etapa.id,
        arenaId: etapa.arenaId,
        fase: FaseEtapa.QUARTAS,
        ordem: 4,
        equipe1Id: "",
        equipe1Nome: "",
        equipe2Id: "",
        equipe2Nome: "",
        equipe1Origem: `1º Grupo ${grupoD}`,
        equipe2Origem: `2º Grupo ${grupoC}`,
        tipoFormacaoJogos,
        proximoConfrontoId: semifinais[1].id,
      },
    ]);

    return [...quartas, ...semifinais, confrontoFinal];
  }

  /**
   * 5 grupos: Oitavas com 6 BYEs
   * O1: 1A x BYE → Q1
   * O2: 1D x BYE → Q1
   * O3: 1B x BYE → Q2
   * O4: 1E x BYE → Q2
   * O5: 1C x BYE → Q3
   * O6: 2A x BYE → Q3
   * O7: 2B x 2C → Q4
   * O8: 2D x 2E → Q4
   */
  private async gerarEliminatoria5Grupos(
    etapa: Etapa,
    grupos: string[],
    tipoFormacaoJogos: TipoFormacaoJogos
  ): Promise<ConfrontoEquipe[]> {
    const [grupoA, grupoB, grupoC, grupoD, grupoE] = grupos;

    // Criar final
    const confrontoFinal = await this.confrontoRepository.criar({
      etapaId: etapa.id,
      arenaId: etapa.arenaId,
      fase: FaseEtapa.FINAL,
      ordem: 15,
      equipe1Id: "",
      equipe1Nome: "",
      equipe2Id: "",
      equipe2Nome: "",
      equipe1Origem: "Vencedor Semifinal 1",
      equipe2Origem: "Vencedor Semifinal 2",
      tipoFormacaoJogos,
    });

    // Criar semifinais
    const semifinais = await this.confrontoRepository.criarEmLote([
      {
        etapaId: etapa.id,
        arenaId: etapa.arenaId,
        fase: FaseEtapa.SEMIFINAL,
        ordem: 13,
        equipe1Id: "",
        equipe1Nome: "",
        equipe2Id: "",
        equipe2Nome: "",
        equipe1Origem: "Vencedor Quartas 1",
        equipe2Origem: "Vencedor Quartas 2",
        tipoFormacaoJogos,
        proximoConfrontoId: confrontoFinal.id,
      },
      {
        etapaId: etapa.id,
        arenaId: etapa.arenaId,
        fase: FaseEtapa.SEMIFINAL,
        ordem: 14,
        equipe1Id: "",
        equipe1Nome: "",
        equipe2Id: "",
        equipe2Nome: "",
        equipe1Origem: "Vencedor Quartas 3",
        equipe2Origem: "Vencedor Quartas 4",
        tipoFormacaoJogos,
        proximoConfrontoId: confrontoFinal.id,
      },
    ]);

    // Criar quartas
    const quartas = await this.confrontoRepository.criarEmLote([
      {
        etapaId: etapa.id,
        arenaId: etapa.arenaId,
        fase: FaseEtapa.QUARTAS,
        ordem: 9,
        equipe1Id: "",
        equipe1Nome: "",
        equipe2Id: "",
        equipe2Nome: "",
        equipe1Origem: "Vencedor Oitavas 1",
        equipe2Origem: "Vencedor Oitavas 7",
        tipoFormacaoJogos,
        proximoConfrontoId: semifinais[0].id,
      },
      {
        etapaId: etapa.id,
        arenaId: etapa.arenaId,
        fase: FaseEtapa.QUARTAS,
        ordem: 10,
        equipe1Id: "",
        equipe1Nome: "",
        equipe2Id: "",
        equipe2Nome: "",
        equipe1Origem: "Vencedor Oitavas 4",
        equipe2Origem: "Vencedor Oitavas 2",
        tipoFormacaoJogos,
        proximoConfrontoId: semifinais[0].id,
      },
      {
        etapaId: etapa.id,
        arenaId: etapa.arenaId,
        fase: FaseEtapa.QUARTAS,
        ordem: 11,
        equipe1Id: "",
        equipe1Nome: "",
        equipe2Id: "",
        equipe2Nome: "",
        equipe1Origem: "Vencedor Oitavas 3",
        equipe2Origem: "Vencedor Oitavas 8",
        tipoFormacaoJogos,
        proximoConfrontoId: semifinais[1].id,
      },
      {
        etapaId: etapa.id,
        arenaId: etapa.arenaId,
        fase: FaseEtapa.QUARTAS,
        ordem: 12,
        equipe1Id: "",
        equipe1Nome: "",
        equipe2Id: "",
        equipe2Nome: "",
        equipe1Origem: "Vencedor Oitavas 5",
        equipe2Origem: "Vencedor Oitavas 6",
        tipoFormacaoJogos,
        proximoConfrontoId: semifinais[1].id,
      },
    ]);

    // Criar oitavas (6 BYEs)
    const oitavas = await this.confrontoRepository.criarEmLote([
      {
        etapaId: etapa.id,
        arenaId: etapa.arenaId,
        fase: FaseEtapa.OITAVAS,
        ordem: 1,
        equipe1Id: "",
        equipe1Nome: "",
        equipe2Id: "BYE",
        equipe2Nome: "BYE",
        equipe1Origem: `1º Grupo ${grupoA}`,
        equipe2Origem: "BYE",
        tipoFormacaoJogos,
        proximoConfrontoId: quartas[0].id,
        isBye: true,
      },
      {
        etapaId: etapa.id,
        arenaId: etapa.arenaId,
        fase: FaseEtapa.OITAVAS,
        ordem: 2,
        equipe1Id: "",
        equipe1Nome: "",
        equipe2Id: "BYE",
        equipe2Nome: "BYE",
        equipe1Origem: `1º Grupo ${grupoD}`,
        equipe2Origem: "BYE",
        tipoFormacaoJogos,
        proximoConfrontoId: quartas[1].id,
        isBye: true,
      },
      {
        etapaId: etapa.id,
        arenaId: etapa.arenaId,
        fase: FaseEtapa.OITAVAS,
        ordem: 3,
        equipe1Id: "",
        equipe1Nome: "",
        equipe2Id: "BYE",
        equipe2Nome: "BYE",
        equipe1Origem: `1º Grupo ${grupoB}`,
        equipe2Origem: "BYE",
        tipoFormacaoJogos,
        proximoConfrontoId: quartas[2].id,
        isBye: true,
      },
      {
        etapaId: etapa.id,
        arenaId: etapa.arenaId,
        fase: FaseEtapa.OITAVAS,
        ordem: 4,
        equipe1Id: "",
        equipe1Nome: "",
        equipe2Id: "BYE",
        equipe2Nome: "BYE",
        equipe1Origem: `1º Grupo ${grupoE}`,
        equipe2Origem: "BYE",
        tipoFormacaoJogos,
        proximoConfrontoId: quartas[1].id,
        isBye: true,
      },
      {
        etapaId: etapa.id,
        arenaId: etapa.arenaId,
        fase: FaseEtapa.OITAVAS,
        ordem: 5,
        equipe1Id: "",
        equipe1Nome: "",
        equipe2Id: "BYE",
        equipe2Nome: "BYE",
        equipe1Origem: `1º Grupo ${grupoC}`,
        equipe2Origem: "BYE",
        tipoFormacaoJogos,
        proximoConfrontoId: quartas[3].id,
        isBye: true,
      },
      {
        etapaId: etapa.id,
        arenaId: etapa.arenaId,
        fase: FaseEtapa.OITAVAS,
        ordem: 6,
        equipe1Id: "",
        equipe1Nome: "",
        equipe2Id: "BYE",
        equipe2Nome: "BYE",
        equipe1Origem: `2º Grupo ${grupoA}`,
        equipe2Origem: "BYE",
        tipoFormacaoJogos,
        proximoConfrontoId: quartas[3].id,
        isBye: true,
      },
      {
        etapaId: etapa.id,
        arenaId: etapa.arenaId,
        fase: FaseEtapa.OITAVAS,
        ordem: 7,
        equipe1Id: "",
        equipe1Nome: "",
        equipe2Id: "",
        equipe2Nome: "",
        equipe1Origem: `2º Grupo ${grupoB}`,
        equipe2Origem: `2º Grupo ${grupoC}`,
        tipoFormacaoJogos,
        proximoConfrontoId: quartas[0].id,
      },
      {
        etapaId: etapa.id,
        arenaId: etapa.arenaId,
        fase: FaseEtapa.OITAVAS,
        ordem: 8,
        equipe1Id: "",
        equipe1Nome: "",
        equipe2Id: "",
        equipe2Nome: "",
        equipe1Origem: `2º Grupo ${grupoD}`,
        equipe2Origem: `2º Grupo ${grupoE}`,
        tipoFormacaoJogos,
        proximoConfrontoId: quartas[2].id,
      },
    ]);

    return [...oitavas, ...quartas, ...semifinais, confrontoFinal];
  }

  /**
   * 6 grupos: Oitavas com 4 BYEs
   * O1: 1A x BYE
   * O2: 1C x BYE
   * O3: 1B x BYE
   * O4: 1D x BYE
   * O5: 2B x 2C
   * O6: 2D x 2A
   * O7: 1E x 2F
   * O8: 1F x 2E
   */
  private async gerarEliminatoria6Grupos(
    etapa: Etapa,
    grupos: string[],
    tipoFormacaoJogos: TipoFormacaoJogos
  ): Promise<ConfrontoEquipe[]> {
    const [grupoA, grupoB, grupoC, grupoD, grupoE, grupoF] = grupos;

    // Criar final
    const confrontoFinal = await this.confrontoRepository.criar({
      etapaId: etapa.id,
      arenaId: etapa.arenaId,
      fase: FaseEtapa.FINAL,
      ordem: 15,
      equipe1Id: "",
      equipe1Nome: "",
      equipe2Id: "",
      equipe2Nome: "",
      equipe1Origem: "Vencedor Semifinal 1",
      equipe2Origem: "Vencedor Semifinal 2",
      tipoFormacaoJogos,
    });

    // Criar semifinais
    const semifinais = await this.confrontoRepository.criarEmLote([
      {
        etapaId: etapa.id,
        arenaId: etapa.arenaId,
        fase: FaseEtapa.SEMIFINAL,
        ordem: 13,
        equipe1Id: "",
        equipe1Nome: "",
        equipe2Id: "",
        equipe2Nome: "",
        equipe1Origem: "Vencedor Quartas 1",
        equipe2Origem: "Vencedor Quartas 2",
        tipoFormacaoJogos,
        proximoConfrontoId: confrontoFinal.id,
      },
      {
        etapaId: etapa.id,
        arenaId: etapa.arenaId,
        fase: FaseEtapa.SEMIFINAL,
        ordem: 14,
        equipe1Id: "",
        equipe1Nome: "",
        equipe2Id: "",
        equipe2Nome: "",
        equipe1Origem: "Vencedor Quartas 3",
        equipe2Origem: "Vencedor Quartas 4",
        tipoFormacaoJogos,
        proximoConfrontoId: confrontoFinal.id,
      },
    ]);

    // Criar quartas
    const quartas = await this.confrontoRepository.criarEmLote([
      {
        etapaId: etapa.id,
        arenaId: etapa.arenaId,
        fase: FaseEtapa.QUARTAS,
        ordem: 9,
        equipe1Id: "",
        equipe1Nome: "",
        equipe2Id: "",
        equipe2Nome: "",
        equipe1Origem: "Vencedor Oitavas 1",
        equipe2Origem: "Vencedor Oitavas 5",
        tipoFormacaoJogos,
        proximoConfrontoId: semifinais[0].id,
      },
      {
        etapaId: etapa.id,
        arenaId: etapa.arenaId,
        fase: FaseEtapa.QUARTAS,
        ordem: 10,
        equipe1Id: "",
        equipe1Nome: "",
        equipe2Id: "",
        equipe2Nome: "",
        equipe1Origem: "Vencedor Oitavas 4",
        equipe2Origem: "Vencedor Oitavas 7",
        tipoFormacaoJogos,
        proximoConfrontoId: semifinais[0].id,
      },
      {
        etapaId: etapa.id,
        arenaId: etapa.arenaId,
        fase: FaseEtapa.QUARTAS,
        ordem: 11,
        equipe1Id: "",
        equipe1Nome: "",
        equipe2Id: "",
        equipe2Nome: "",
        equipe1Origem: "Vencedor Oitavas 3",
        equipe2Origem: "Vencedor Oitavas 6",
        tipoFormacaoJogos,
        proximoConfrontoId: semifinais[1].id,
      },
      {
        etapaId: etapa.id,
        arenaId: etapa.arenaId,
        fase: FaseEtapa.QUARTAS,
        ordem: 12,
        equipe1Id: "",
        equipe1Nome: "",
        equipe2Id: "",
        equipe2Nome: "",
        equipe1Origem: "Vencedor Oitavas 2",
        equipe2Origem: "Vencedor Oitavas 8",
        tipoFormacaoJogos,
        proximoConfrontoId: semifinais[1].id,
      },
    ]);

    // Criar oitavas (4 BYEs)
    const oitavas = await this.confrontoRepository.criarEmLote([
      {
        etapaId: etapa.id,
        arenaId: etapa.arenaId,
        fase: FaseEtapa.OITAVAS,
        ordem: 1,
        equipe1Id: "",
        equipe1Nome: "",
        equipe2Id: "BYE",
        equipe2Nome: "BYE",
        equipe1Origem: `1º Grupo ${grupoA}`,
        equipe2Origem: "BYE",
        tipoFormacaoJogos,
        proximoConfrontoId: quartas[0].id,
        isBye: true,
      },
      {
        etapaId: etapa.id,
        arenaId: etapa.arenaId,
        fase: FaseEtapa.OITAVAS,
        ordem: 2,
        equipe1Id: "",
        equipe1Nome: "",
        equipe2Id: "BYE",
        equipe2Nome: "BYE",
        equipe1Origem: `1º Grupo ${grupoC}`,
        equipe2Origem: "BYE",
        tipoFormacaoJogos,
        proximoConfrontoId: quartas[3].id,
        isBye: true,
      },
      {
        etapaId: etapa.id,
        arenaId: etapa.arenaId,
        fase: FaseEtapa.OITAVAS,
        ordem: 3,
        equipe1Id: "",
        equipe1Nome: "",
        equipe2Id: "BYE",
        equipe2Nome: "BYE",
        equipe1Origem: `1º Grupo ${grupoB}`,
        equipe2Origem: "BYE",
        tipoFormacaoJogos,
        proximoConfrontoId: quartas[2].id,
        isBye: true,
      },
      {
        etapaId: etapa.id,
        arenaId: etapa.arenaId,
        fase: FaseEtapa.OITAVAS,
        ordem: 4,
        equipe1Id: "",
        equipe1Nome: "",
        equipe2Id: "BYE",
        equipe2Nome: "BYE",
        equipe1Origem: `1º Grupo ${grupoD}`,
        equipe2Origem: "BYE",
        tipoFormacaoJogos,
        proximoConfrontoId: quartas[1].id,
        isBye: true,
      },
      {
        etapaId: etapa.id,
        arenaId: etapa.arenaId,
        fase: FaseEtapa.OITAVAS,
        ordem: 5,
        equipe1Id: "",
        equipe1Nome: "",
        equipe2Id: "",
        equipe2Nome: "",
        equipe1Origem: `2º Grupo ${grupoB}`,
        equipe2Origem: `2º Grupo ${grupoC}`,
        tipoFormacaoJogos,
        proximoConfrontoId: quartas[0].id,
      },
      {
        etapaId: etapa.id,
        arenaId: etapa.arenaId,
        fase: FaseEtapa.OITAVAS,
        ordem: 6,
        equipe1Id: "",
        equipe1Nome: "",
        equipe2Id: "",
        equipe2Nome: "",
        equipe1Origem: `2º Grupo ${grupoD}`,
        equipe2Origem: `2º Grupo ${grupoA}`,
        tipoFormacaoJogos,
        proximoConfrontoId: quartas[2].id,
      },
      {
        etapaId: etapa.id,
        arenaId: etapa.arenaId,
        fase: FaseEtapa.OITAVAS,
        ordem: 7,
        equipe1Id: "",
        equipe1Nome: "",
        equipe2Id: "",
        equipe2Nome: "",
        equipe1Origem: `1º Grupo ${grupoE}`,
        equipe2Origem: `2º Grupo ${grupoF}`,
        tipoFormacaoJogos,
        proximoConfrontoId: quartas[1].id,
      },
      {
        etapaId: etapa.id,
        arenaId: etapa.arenaId,
        fase: FaseEtapa.OITAVAS,
        ordem: 8,
        equipe1Id: "",
        equipe1Nome: "",
        equipe2Id: "",
        equipe2Nome: "",
        equipe1Origem: `1º Grupo ${grupoF}`,
        equipe2Origem: `2º Grupo ${grupoE}`,
        tipoFormacaoJogos,
        proximoConfrontoId: quartas[3].id,
      },
    ]);

    return [...oitavas, ...quartas, ...semifinais, confrontoFinal];
  }

  /**
   * 7 grupos: Oitavas com 2 BYEs
   */
  private async gerarEliminatoria7Grupos(
    etapa: Etapa,
    grupos: string[],
    tipoFormacaoJogos: TipoFormacaoJogos
  ): Promise<ConfrontoEquipe[]> {
    const [grupoA, grupoB, grupoC, grupoD, grupoE, grupoF, grupoG] = grupos;

    // Criar final
    const confrontoFinal = await this.confrontoRepository.criar({
      etapaId: etapa.id,
      arenaId: etapa.arenaId,
      fase: FaseEtapa.FINAL,
      ordem: 15,
      equipe1Id: "",
      equipe1Nome: "",
      equipe2Id: "",
      equipe2Nome: "",
      equipe1Origem: "Vencedor Semifinal 1",
      equipe2Origem: "Vencedor Semifinal 2",
      tipoFormacaoJogos,
    });

    // Criar semifinais
    const semifinais = await this.confrontoRepository.criarEmLote([
      {
        etapaId: etapa.id,
        arenaId: etapa.arenaId,
        fase: FaseEtapa.SEMIFINAL,
        ordem: 13,
        equipe1Id: "",
        equipe1Nome: "",
        equipe2Id: "",
        equipe2Nome: "",
        equipe1Origem: "Vencedor Quartas 1",
        equipe2Origem: "Vencedor Quartas 2",
        tipoFormacaoJogos,
        proximoConfrontoId: confrontoFinal.id,
      },
      {
        etapaId: etapa.id,
        arenaId: etapa.arenaId,
        fase: FaseEtapa.SEMIFINAL,
        ordem: 14,
        equipe1Id: "",
        equipe1Nome: "",
        equipe2Id: "",
        equipe2Nome: "",
        equipe1Origem: "Vencedor Quartas 3",
        equipe2Origem: "Vencedor Quartas 4",
        tipoFormacaoJogos,
        proximoConfrontoId: confrontoFinal.id,
      },
    ]);

    // Criar quartas
    const quartas = await this.confrontoRepository.criarEmLote([
      {
        etapaId: etapa.id,
        arenaId: etapa.arenaId,
        fase: FaseEtapa.QUARTAS,
        ordem: 9,
        equipe1Id: "",
        equipe1Nome: "",
        equipe2Id: "",
        equipe2Nome: "",
        equipe1Origem: "Vencedor Oitavas 1",
        equipe2Origem: "Vencedor Oitavas 2",
        tipoFormacaoJogos,
        proximoConfrontoId: semifinais[0].id,
      },
      {
        etapaId: etapa.id,
        arenaId: etapa.arenaId,
        fase: FaseEtapa.QUARTAS,
        ordem: 10,
        equipe1Id: "",
        equipe1Nome: "",
        equipe2Id: "",
        equipe2Nome: "",
        equipe1Origem: "Vencedor Oitavas 3",
        equipe2Origem: "Vencedor Oitavas 4",
        tipoFormacaoJogos,
        proximoConfrontoId: semifinais[0].id,
      },
      {
        etapaId: etapa.id,
        arenaId: etapa.arenaId,
        fase: FaseEtapa.QUARTAS,
        ordem: 11,
        equipe1Id: "",
        equipe1Nome: "",
        equipe2Id: "",
        equipe2Nome: "",
        equipe1Origem: "Vencedor Oitavas 5",
        equipe2Origem: "Vencedor Oitavas 6",
        tipoFormacaoJogos,
        proximoConfrontoId: semifinais[1].id,
      },
      {
        etapaId: etapa.id,
        arenaId: etapa.arenaId,
        fase: FaseEtapa.QUARTAS,
        ordem: 12,
        equipe1Id: "",
        equipe1Nome: "",
        equipe2Id: "",
        equipe2Nome: "",
        equipe1Origem: "Vencedor Oitavas 7",
        equipe2Origem: "Vencedor Oitavas 8",
        tipoFormacaoJogos,
        proximoConfrontoId: semifinais[1].id,
      },
    ]);

    // Criar oitavas (2 BYEs)
    const oitavas = await this.confrontoRepository.criarEmLote([
      {
        etapaId: etapa.id,
        arenaId: etapa.arenaId,
        fase: FaseEtapa.OITAVAS,
        ordem: 1,
        equipe1Id: "",
        equipe1Nome: "",
        equipe2Id: "BYE",
        equipe2Nome: "BYE",
        equipe1Origem: `1º Grupo ${grupoA}`,
        equipe2Origem: "BYE",
        tipoFormacaoJogos,
        proximoConfrontoId: quartas[0].id,
        isBye: true,
      },
      {
        etapaId: etapa.id,
        arenaId: etapa.arenaId,
        fase: FaseEtapa.OITAVAS,
        ordem: 2,
        equipe1Id: "",
        equipe1Nome: "",
        equipe2Id: "",
        equipe2Nome: "",
        equipe1Origem: `1º Grupo ${grupoE}`,
        equipe2Origem: `2º Grupo ${grupoF}`,
        tipoFormacaoJogos,
        proximoConfrontoId: quartas[0].id,
      },
      {
        etapaId: etapa.id,
        arenaId: etapa.arenaId,
        fase: FaseEtapa.OITAVAS,
        ordem: 3,
        equipe1Id: "",
        equipe1Nome: "",
        equipe2Id: "",
        equipe2Nome: "",
        equipe1Origem: `1º Grupo ${grupoC}`,
        equipe2Origem: `2º Grupo ${grupoD}`,
        tipoFormacaoJogos,
        proximoConfrontoId: quartas[1].id,
      },
      {
        etapaId: etapa.id,
        arenaId: etapa.arenaId,
        fase: FaseEtapa.OITAVAS,
        ordem: 4,
        equipe1Id: "",
        equipe1Nome: "",
        equipe2Id: "",
        equipe2Nome: "",
        equipe1Origem: `1º Grupo ${grupoG}`,
        equipe2Origem: `2º Grupo ${grupoB}`,
        tipoFormacaoJogos,
        proximoConfrontoId: quartas[1].id,
      },
      {
        etapaId: etapa.id,
        arenaId: etapa.arenaId,
        fase: FaseEtapa.OITAVAS,
        ordem: 5,
        equipe1Id: "",
        equipe1Nome: "",
        equipe2Id: "BYE",
        equipe2Nome: "BYE",
        equipe1Origem: `1º Grupo ${grupoB}`,
        equipe2Origem: "BYE",
        tipoFormacaoJogos,
        proximoConfrontoId: quartas[2].id,
        isBye: true,
      },
      {
        etapaId: etapa.id,
        arenaId: etapa.arenaId,
        fase: FaseEtapa.OITAVAS,
        ordem: 6,
        equipe1Id: "",
        equipe1Nome: "",
        equipe2Id: "",
        equipe2Nome: "",
        equipe1Origem: `1º Grupo ${grupoF}`,
        equipe2Origem: `2º Grupo ${grupoE}`,
        tipoFormacaoJogos,
        proximoConfrontoId: quartas[2].id,
      },
      {
        etapaId: etapa.id,
        arenaId: etapa.arenaId,
        fase: FaseEtapa.OITAVAS,
        ordem: 7,
        equipe1Id: "",
        equipe1Nome: "",
        equipe2Id: "",
        equipe2Nome: "",
        equipe1Origem: `1º Grupo ${grupoD}`,
        equipe2Origem: `2º Grupo ${grupoC}`,
        tipoFormacaoJogos,
        proximoConfrontoId: quartas[3].id,
      },
      {
        etapaId: etapa.id,
        arenaId: etapa.arenaId,
        fase: FaseEtapa.OITAVAS,
        ordem: 8,
        equipe1Id: "",
        equipe1Nome: "",
        equipe2Id: "",
        equipe2Nome: "",
        equipe1Origem: `2º Grupo ${grupoA}`,
        equipe2Origem: `2º Grupo ${grupoG}`,
        tipoFormacaoJogos,
        proximoConfrontoId: quartas[3].id,
      },
    ]);

    return [...oitavas, ...quartas, ...semifinais, confrontoFinal];
  }

  /**
   * 8 grupos: Oitavas sem BYEs
   * O1: 1A x 2B → Q1
   * O2: 1C x 2D → Q1
   * O3: 1E x 2F → Q2
   * O4: 1G x 2H → Q2
   * O5: 1B x 2A → Q3
   * O6: 1D x 2C → Q3
   * O7: 1F x 2E → Q4
   * O8: 1H x 2G → Q4
   */
  private async gerarEliminatoria8Grupos(
    etapa: Etapa,
    grupos: string[],
    tipoFormacaoJogos: TipoFormacaoJogos
  ): Promise<ConfrontoEquipe[]> {
    const [grupoA, grupoB, grupoC, grupoD, grupoE, grupoF, grupoG, grupoH] =
      grupos;

    // Criar final
    const confrontoFinal = await this.confrontoRepository.criar({
      etapaId: etapa.id,
      arenaId: etapa.arenaId,
      fase: FaseEtapa.FINAL,
      ordem: 15,
      equipe1Id: "",
      equipe1Nome: "",
      equipe2Id: "",
      equipe2Nome: "",
      equipe1Origem: "Vencedor Semifinal 1",
      equipe2Origem: "Vencedor Semifinal 2",
      tipoFormacaoJogos,
    });

    // Criar semifinais
    const semifinais = await this.confrontoRepository.criarEmLote([
      {
        etapaId: etapa.id,
        arenaId: etapa.arenaId,
        fase: FaseEtapa.SEMIFINAL,
        ordem: 13,
        equipe1Id: "",
        equipe1Nome: "",
        equipe2Id: "",
        equipe2Nome: "",
        equipe1Origem: "Vencedor Quartas 1",
        equipe2Origem: "Vencedor Quartas 2",
        tipoFormacaoJogos,
        proximoConfrontoId: confrontoFinal.id,
      },
      {
        etapaId: etapa.id,
        arenaId: etapa.arenaId,
        fase: FaseEtapa.SEMIFINAL,
        ordem: 14,
        equipe1Id: "",
        equipe1Nome: "",
        equipe2Id: "",
        equipe2Nome: "",
        equipe1Origem: "Vencedor Quartas 3",
        equipe2Origem: "Vencedor Quartas 4",
        tipoFormacaoJogos,
        proximoConfrontoId: confrontoFinal.id,
      },
    ]);

    // Criar quartas
    const quartas = await this.confrontoRepository.criarEmLote([
      {
        etapaId: etapa.id,
        arenaId: etapa.arenaId,
        fase: FaseEtapa.QUARTAS,
        ordem: 9,
        equipe1Id: "",
        equipe1Nome: "",
        equipe2Id: "",
        equipe2Nome: "",
        equipe1Origem: "Vencedor Oitavas 1",
        equipe2Origem: "Vencedor Oitavas 2",
        tipoFormacaoJogos,
        proximoConfrontoId: semifinais[0].id,
      },
      {
        etapaId: etapa.id,
        arenaId: etapa.arenaId,
        fase: FaseEtapa.QUARTAS,
        ordem: 10,
        equipe1Id: "",
        equipe1Nome: "",
        equipe2Id: "",
        equipe2Nome: "",
        equipe1Origem: "Vencedor Oitavas 3",
        equipe2Origem: "Vencedor Oitavas 4",
        tipoFormacaoJogos,
        proximoConfrontoId: semifinais[0].id,
      },
      {
        etapaId: etapa.id,
        arenaId: etapa.arenaId,
        fase: FaseEtapa.QUARTAS,
        ordem: 11,
        equipe1Id: "",
        equipe1Nome: "",
        equipe2Id: "",
        equipe2Nome: "",
        equipe1Origem: "Vencedor Oitavas 5",
        equipe2Origem: "Vencedor Oitavas 6",
        tipoFormacaoJogos,
        proximoConfrontoId: semifinais[1].id,
      },
      {
        etapaId: etapa.id,
        arenaId: etapa.arenaId,
        fase: FaseEtapa.QUARTAS,
        ordem: 12,
        equipe1Id: "",
        equipe1Nome: "",
        equipe2Id: "",
        equipe2Nome: "",
        equipe1Origem: "Vencedor Oitavas 7",
        equipe2Origem: "Vencedor Oitavas 8",
        tipoFormacaoJogos,
        proximoConfrontoId: semifinais[1].id,
      },
    ]);

    // Criar oitavas (sem BYEs)
    const oitavas = await this.confrontoRepository.criarEmLote([
      {
        etapaId: etapa.id,
        arenaId: etapa.arenaId,
        fase: FaseEtapa.OITAVAS,
        ordem: 1,
        equipe1Id: "",
        equipe1Nome: "",
        equipe2Id: "",
        equipe2Nome: "",
        equipe1Origem: `1º Grupo ${grupoA}`,
        equipe2Origem: `2º Grupo ${grupoB}`,
        tipoFormacaoJogos,
        proximoConfrontoId: quartas[0].id,
      },
      {
        etapaId: etapa.id,
        arenaId: etapa.arenaId,
        fase: FaseEtapa.OITAVAS,
        ordem: 2,
        equipe1Id: "",
        equipe1Nome: "",
        equipe2Id: "",
        equipe2Nome: "",
        equipe1Origem: `1º Grupo ${grupoC}`,
        equipe2Origem: `2º Grupo ${grupoD}`,
        tipoFormacaoJogos,
        proximoConfrontoId: quartas[0].id,
      },
      {
        etapaId: etapa.id,
        arenaId: etapa.arenaId,
        fase: FaseEtapa.OITAVAS,
        ordem: 3,
        equipe1Id: "",
        equipe1Nome: "",
        equipe2Id: "",
        equipe2Nome: "",
        equipe1Origem: `1º Grupo ${grupoE}`,
        equipe2Origem: `2º Grupo ${grupoF}`,
        tipoFormacaoJogos,
        proximoConfrontoId: quartas[1].id,
      },
      {
        etapaId: etapa.id,
        arenaId: etapa.arenaId,
        fase: FaseEtapa.OITAVAS,
        ordem: 4,
        equipe1Id: "",
        equipe1Nome: "",
        equipe2Id: "",
        equipe2Nome: "",
        equipe1Origem: `1º Grupo ${grupoG}`,
        equipe2Origem: `2º Grupo ${grupoH}`,
        tipoFormacaoJogos,
        proximoConfrontoId: quartas[1].id,
      },
      {
        etapaId: etapa.id,
        arenaId: etapa.arenaId,
        fase: FaseEtapa.OITAVAS,
        ordem: 5,
        equipe1Id: "",
        equipe1Nome: "",
        equipe2Id: "",
        equipe2Nome: "",
        equipe1Origem: `1º Grupo ${grupoB}`,
        equipe2Origem: `2º Grupo ${grupoA}`,
        tipoFormacaoJogos,
        proximoConfrontoId: quartas[2].id,
      },
      {
        etapaId: etapa.id,
        arenaId: etapa.arenaId,
        fase: FaseEtapa.OITAVAS,
        ordem: 6,
        equipe1Id: "",
        equipe1Nome: "",
        equipe2Id: "",
        equipe2Nome: "",
        equipe1Origem: `1º Grupo ${grupoD}`,
        equipe2Origem: `2º Grupo ${grupoC}`,
        tipoFormacaoJogos,
        proximoConfrontoId: quartas[2].id,
      },
      {
        etapaId: etapa.id,
        arenaId: etapa.arenaId,
        fase: FaseEtapa.OITAVAS,
        ordem: 7,
        equipe1Id: "",
        equipe1Nome: "",
        equipe2Id: "",
        equipe2Nome: "",
        equipe1Origem: `1º Grupo ${grupoF}`,
        equipe2Origem: `2º Grupo ${grupoE}`,
        tipoFormacaoJogos,
        proximoConfrontoId: quartas[3].id,
      },
      {
        etapaId: etapa.id,
        arenaId: etapa.arenaId,
        fase: FaseEtapa.OITAVAS,
        ordem: 8,
        equipe1Id: "",
        equipe1Nome: "",
        equipe2Id: "",
        equipe2Nome: "",
        equipe1Origem: `1º Grupo ${grupoH}`,
        equipe2Origem: `2º Grupo ${grupoG}`,
        tipoFormacaoJogos,
        proximoConfrontoId: quartas[3].id,
      },
    ]);

    return [...oitavas, ...quartas, ...semifinais, confrontoFinal];
  }

  // ==================== PARTIDAS ====================

  /**
   * Gera partidas para um confronto
   * - SORTEIO: Sistema sorteia as duplas automaticamente
   * - MANUAL: Cria partidas vazias para serem preenchidas manualmente pelas equipes
   */
  async gerarPartidasConfronto(
    confronto: ConfrontoEquipe,
    etapa: Etapa
  ): Promise<PartidaTeams[]> {
    // Verificar se as equipes já foram definidas (importante para fase eliminatória)
    if (!confronto.equipe1Id || !confronto.equipe2Id) {
      throw new ValidationError(
        "As equipes deste confronto ainda não foram definidas. " +
          "Complete a fase de grupos primeiro para definir os classificados."
      );
    }

    const variante = etapa.varianteTeams!;
    const tipoFormacao = etapa.tipoFormacaoJogos || TipoFormacaoJogos.SORTEIO;
    // Etapa é mista se: isMisto é true, OU genero é MISTO
    const isMisto = etapa.isMisto || etapa.genero === GeneroJogador.MISTO;

    // Se for formação MANUAL, criar partidas vazias para serem preenchidas depois
    if (tipoFormacao === TipoFormacaoJogos.MANUAL) {
      return this.criarPartidasVazias(confronto, etapa, variante, isMisto);
    }

    const equipe1 = await this.equipeRepository.buscarPorId(
      confronto.equipe1Id
    );
    const equipe2 = await this.equipeRepository.buscarPorId(
      confronto.equipe2Id
    );

    if (!equipe1 || !equipe2) {
      throw new NotFoundError("Equipe não encontrada");
    }

    const partidaDTOs: CriarPartidaTeamsDTO[] = [];

    if (variante === VarianteTeams.TEAMS_4) {
      // TEAMS_4: 2 jogos + decider se necessário
      if (isMisto) {
        // Separar por gênero
        const femininas1 = equipe1.jogadores.filter(
          (j) => j.genero === GeneroJogador.FEMININO
        );
        const masculinos1 = equipe1.jogadores.filter(
          (j) => j.genero === GeneroJogador.MASCULINO
        );
        const femininas2 = equipe2.jogadores.filter(
          (j) => j.genero === GeneroJogador.FEMININO
        );
        const masculinos2 = equipe2.jogadores.filter(
          (j) => j.genero === GeneroJogador.MASCULINO
        );

        // Jogo 1: Feminino
        partidaDTOs.push(
          this.criarPartidaDTO(
            confronto,
            etapa,
            1,
            TipoJogoTeams.FEMININO,
            this.shuffle(femininas1),
            this.shuffle(femininas2)
          )
        );

        // Jogo 2: Masculino
        partidaDTOs.push(
          this.criarPartidaDTO(
            confronto,
            etapa,
            2,
            TipoJogoTeams.MASCULINO,
            this.shuffle(masculinos1),
            this.shuffle(masculinos2)
          )
        );
      } else {
        // Não misto: dividir em 2 duplas aleatórias
        // Usar o gênero da etapa para definir o tipo de jogo
        const tipoJogo =
          etapa.genero === GeneroJogador.FEMININO
            ? TipoJogoTeams.FEMININO
            : TipoJogoTeams.MASCULINO;

        const jogadores1 = this.shuffle([...equipe1.jogadores]);
        const jogadores2 = this.shuffle([...equipe2.jogadores]);

        partidaDTOs.push(
          this.criarPartidaDTO(
            confronto,
            etapa,
            1,
            tipoJogo,
            jogadores1.slice(0, 2),
            jogadores2.slice(0, 2)
          )
        );

        partidaDTOs.push(
          this.criarPartidaDTO(
            confronto,
            etapa,
            2,
            tipoJogo,
            jogadores1.slice(2, 4),
            jogadores2.slice(2, 4)
          )
        );
      }
    } else {
      // TEAMS_6: 3 jogos fixos (SEM decider)
      if (isMisto) {
        // TEAMS_6 MISTO: 3M + 3F → masculino + feminino + misto
        const femininas1 = equipe1.jogadores.filter(
          (j) => j.genero === GeneroJogador.FEMININO
        );
        const masculinos1 = equipe1.jogadores.filter(
          (j) => j.genero === GeneroJogador.MASCULINO
        );
        const femininas2 = equipe2.jogadores.filter(
          (j) => j.genero === GeneroJogador.FEMININO
        );
        const masculinos2 = equipe2.jogadores.filter(
          (j) => j.genero === GeneroJogador.MASCULINO
        );

        // Shuffle para sorteio
        const f1 = this.shuffle(femininas1);
        const m1 = this.shuffle(masculinos1);
        const f2 = this.shuffle(femininas2);
        const m2 = this.shuffle(masculinos2);

        // Jogo 1: Feminino (2 vs 2)
        partidaDTOs.push(
          this.criarPartidaDTO(
            confronto,
            etapa,
            1,
            TipoJogoTeams.FEMININO,
            f1.slice(0, 2),
            f2.slice(0, 2)
          )
        );

        // Jogo 2: Masculino (2 vs 2)
        partidaDTOs.push(
          this.criarPartidaDTO(
            confronto,
            etapa,
            2,
            TipoJogoTeams.MASCULINO,
            m1.slice(0, 2),
            m2.slice(0, 2)
          )
        );

        // Jogo 3: Misto (F restante + M restante)
        partidaDTOs.push(
          this.criarPartidaDTO(
            confronto,
            etapa,
            3,
            TipoJogoTeams.MISTO,
            [f1[2], m1[2]],
            [f2[2], m2[2]]
          )
        );
      } else {
        // TEAMS_6 NÃO MISTO: 6M ou 6F → 3 partidas do mesmo gênero
        const tipoJogo =
          etapa.genero === GeneroJogador.FEMININO
            ? TipoJogoTeams.FEMININO
            : TipoJogoTeams.MASCULINO;

        const jogadores1 = this.shuffle([...equipe1.jogadores]);
        const jogadores2 = this.shuffle([...equipe2.jogadores]);

        // Jogo 1: dupla 1 vs dupla 1
        partidaDTOs.push(
          this.criarPartidaDTO(
            confronto,
            etapa,
            1,
            tipoJogo,
            jogadores1.slice(0, 2),
            jogadores2.slice(0, 2)
          )
        );

        // Jogo 2: dupla 2 vs dupla 2
        partidaDTOs.push(
          this.criarPartidaDTO(
            confronto,
            etapa,
            2,
            tipoJogo,
            jogadores1.slice(2, 4),
            jogadores2.slice(2, 4)
          )
        );

        // Jogo 3: dupla 3 vs dupla 3
        partidaDTOs.push(
          this.criarPartidaDTO(
            confronto,
            etapa,
            3,
            tipoJogo,
            jogadores1.slice(4, 6),
            jogadores2.slice(4, 6)
          )
        );
      }
    }

    const partidas = await this.partidaRepository.criarEmLote(partidaDTOs);

    // ✅ OTIMIZAÇÃO: Atualizar confronto com todas as partidas de uma vez
    const partidasIds = partidas.map((p) => p.id);
    await this.confrontoRepository.adicionarPartidasEmLote(confronto.id, partidasIds);

    return partidas;
  }

  /**
   * ✅ OTIMIZAÇÃO v4: Montar DTOs de partidas sem fazer queries
   * Recebe equipes já carregadas para evitar buscas repetidas
   */
  private montarPartidasConfrontoDTO(
    confronto: ConfrontoEquipe,
    etapa: Etapa,
    equipe1: Equipe,
    equipe2: Equipe,
    variante: VarianteTeams,
    isMisto: boolean
  ): CriarPartidaTeamsDTO[] {
    const partidaDTOs: CriarPartidaTeamsDTO[] = [];

    if (variante === VarianteTeams.TEAMS_4) {
      // TEAMS_4: 2 jogos + decider se necessário
      if (isMisto) {
        const femininas1 = equipe1.jogadores.filter(
          (j) => j.genero === GeneroJogador.FEMININO
        );
        const masculinos1 = equipe1.jogadores.filter(
          (j) => j.genero === GeneroJogador.MASCULINO
        );
        const femininas2 = equipe2.jogadores.filter(
          (j) => j.genero === GeneroJogador.FEMININO
        );
        const masculinos2 = equipe2.jogadores.filter(
          (j) => j.genero === GeneroJogador.MASCULINO
        );

        partidaDTOs.push(
          this.criarPartidaDTO(
            confronto,
            etapa,
            1,
            TipoJogoTeams.FEMININO,
            this.shuffle(femininas1),
            this.shuffle(femininas2)
          )
        );

        partidaDTOs.push(
          this.criarPartidaDTO(
            confronto,
            etapa,
            2,
            TipoJogoTeams.MASCULINO,
            this.shuffle(masculinos1),
            this.shuffle(masculinos2)
          )
        );
      } else {
        const tipoJogo =
          etapa.genero === GeneroJogador.FEMININO
            ? TipoJogoTeams.FEMININO
            : TipoJogoTeams.MASCULINO;

        const jogadores1 = this.shuffle([...equipe1.jogadores]);
        const jogadores2 = this.shuffle([...equipe2.jogadores]);

        partidaDTOs.push(
          this.criarPartidaDTO(
            confronto,
            etapa,
            1,
            tipoJogo,
            jogadores1.slice(0, 2),
            jogadores2.slice(0, 2)
          )
        );

        partidaDTOs.push(
          this.criarPartidaDTO(
            confronto,
            etapa,
            2,
            tipoJogo,
            jogadores1.slice(2, 4),
            jogadores2.slice(2, 4)
          )
        );
      }
    } else {
      // TEAMS_6: 3 jogos fixos
      if (isMisto) {
        const femininas1 = equipe1.jogadores.filter(
          (j) => j.genero === GeneroJogador.FEMININO
        );
        const masculinos1 = equipe1.jogadores.filter(
          (j) => j.genero === GeneroJogador.MASCULINO
        );
        const femininas2 = equipe2.jogadores.filter(
          (j) => j.genero === GeneroJogador.FEMININO
        );
        const masculinos2 = equipe2.jogadores.filter(
          (j) => j.genero === GeneroJogador.MASCULINO
        );

        const f1 = this.shuffle(femininas1);
        const m1 = this.shuffle(masculinos1);
        const f2 = this.shuffle(femininas2);
        const m2 = this.shuffle(masculinos2);

        partidaDTOs.push(
          this.criarPartidaDTO(confronto, etapa, 1, TipoJogoTeams.FEMININO, f1.slice(0, 2), f2.slice(0, 2))
        );
        partidaDTOs.push(
          this.criarPartidaDTO(confronto, etapa, 2, TipoJogoTeams.MASCULINO, m1.slice(0, 2), m2.slice(0, 2))
        );
        partidaDTOs.push(
          this.criarPartidaDTO(confronto, etapa, 3, TipoJogoTeams.MISTO, [f1[2], m1[2]], [f2[2], m2[2]])
        );
      } else {
        const tipoJogo =
          etapa.genero === GeneroJogador.FEMININO
            ? TipoJogoTeams.FEMININO
            : TipoJogoTeams.MASCULINO;

        const jogadores1 = this.shuffle([...equipe1.jogadores]);
        const jogadores2 = this.shuffle([...equipe2.jogadores]);

        partidaDTOs.push(
          this.criarPartidaDTO(confronto, etapa, 1, tipoJogo, jogadores1.slice(0, 2), jogadores2.slice(0, 2))
        );
        partidaDTOs.push(
          this.criarPartidaDTO(confronto, etapa, 2, tipoJogo, jogadores1.slice(2, 4), jogadores2.slice(2, 4))
        );
        partidaDTOs.push(
          this.criarPartidaDTO(confronto, etapa, 3, tipoJogo, jogadores1.slice(4, 6), jogadores2.slice(4, 6))
        );
      }
    }

    return partidaDTOs;
  }

  /**
   * Define partidas manualmente
   */
  async definirPartidasManualmente(
    confronto: ConfrontoEquipe,
    etapa: Etapa,
    definicao: DefinirPartidasManualDTO
  ): Promise<PartidaTeams[]> {
    const equipe1 = await this.equipeRepository.buscarPorId(
      confronto.equipe1Id
    );
    const equipe2 = await this.equipeRepository.buscarPorId(
      confronto.equipe2Id
    );

    if (!equipe1 || !equipe2) {
      throw new NotFoundError("Equipe não encontrada");
    }

    // Mapear jogadores por ID
    const jogadores1Map = new Map(equipe1.jogadores.map((j) => [j.id, j]));
    const jogadores2Map = new Map(equipe2.jogadores.map((j) => [j.id, j]));

    const partidaDTOs: CriarPartidaTeamsDTO[] = [];

    for (const def of definicao.partidas) {
      const dupla1Jogadores = def.dupla1JogadorIds.map((id) => {
        const j = jogadores1Map.get(id);
        if (!j)
          throw new ValidationError(`Jogador ${id} não pertence à equipe 1`);
        return j;
      });

      const dupla2Jogadores = def.dupla2JogadorIds.map((id) => {
        const j = jogadores2Map.get(id);
        if (!j)
          throw new ValidationError(`Jogador ${id} não pertence à equipe 2`);
        return j;
      });

      partidaDTOs.push(
        this.criarPartidaDTO(
          confronto,
          etapa,
          def.ordem,
          def.tipoJogo,
          dupla1Jogadores,
          dupla2Jogadores
        )
      );
    }

    const partidas = await this.partidaRepository.criarEmLote(partidaDTOs);

    // ✅ OTIMIZAÇÃO: Atualizar confronto com todas as partidas de uma vez
    const partidasIds = partidas.map((p) => p.id);
    await this.confrontoRepository.adicionarPartidasEmLote(confronto.id, partidasIds);

    return partidas;
  }

  /**
   * Define os jogadores de uma partida vazia (formação manual)
   */
  async definirJogadoresPartida(
    partidaId: string,
    arenaId: string,
    dupla1JogadorIds: [string, string],
    dupla2JogadorIds: [string, string]
  ): Promise<PartidaTeams> {
    const timings: Record<string, number> = {};
    const startTotal = Date.now();

    let start = Date.now();
    const partida = await this.partidaRepository.buscarPorId(partidaId);
    timings["1_buscarPartida"] = Date.now() - start;

    if (!partida) {
      throw new NotFoundError("Partida não encontrada");
    }

    if (partida.arenaId !== arenaId) {
      throw new ValidationError("Partida não pertence a esta arena");
    }

    // Verificar se a partida já tem jogadores definidos
    if (partida.dupla1.length > 0 || partida.dupla2.length > 0) {
      throw new ValidationError("Esta partida já tem jogadores definidos");
    }

    // Verificar se a partida tem IDs das equipes
    // Se não tiver, buscar do confronto (para partidas antigas criadas antes da atualização)
    let equipe1Id = partida.equipe1Id;
    let equipe2Id = partida.equipe2Id;

    if (!equipe1Id || !equipe2Id) {
      logger.warn("Partida sem IDs das equipes, buscando do confronto", {
        partidaId,
      });
      start = Date.now();
      const confronto = await this.confrontoRepository.buscarPorId(
        partida.confrontoId
      );
      timings["2a_buscarConfronto"] = Date.now() - start;

      if (!confronto) {
        throw new NotFoundError("Confronto não encontrado");
      }
      equipe1Id = confronto.equipe1Id;
      equipe2Id = confronto.equipe2Id;

      // Atualizar a partida com os IDs das equipes
      start = Date.now();
      await this.partidaRepository.atualizar(partidaId, {
        equipe1Id,
        equipe1Nome: confronto.equipe1Nome,
        equipe2Id,
        equipe2Nome: confronto.equipe2Nome,
      });
      timings["2b_atualizarPartidaIds"] = Date.now() - start;
    }

    // Buscar equipes em paralelo
    start = Date.now();
    const [equipe1, equipe2] = await Promise.all([
      this.equipeRepository.buscarPorId(equipe1Id),
      this.equipeRepository.buscarPorId(equipe2Id),
    ]);
    timings["3_buscarEquipes"] = Date.now() - start;

    if (!equipe1 || !equipe2) {
      throw new NotFoundError("Equipe não encontrada");
    }

    // Validar que os jogadores pertencem às equipes corretas
    const jogadores1Map = new Map(equipe1.jogadores.map((j) => [j.id, j]));
    const jogadores2Map = new Map(equipe2.jogadores.map((j) => [j.id, j]));

    const dupla1Jogadores = dupla1JogadorIds.map((id) => {
      const j = jogadores1Map.get(id);
      if (!j)
        throw new ValidationError(
          `Jogador ${id} não pertence à equipe ${equipe1.nome}`
        );
      return j;
    });

    const dupla2Jogadores = dupla2JogadorIds.map((id) => {
      const j = jogadores2Map.get(id);
      if (!j)
        throw new ValidationError(
          `Jogador ${id} não pertence à equipe ${equipe2.nome}`
        );
      return j;
    });

    // Buscar confronto e partidas UMA VEZ (usado por ambas validações)
    start = Date.now();
    const confronto = await this.confrontoRepository.buscarPorId(partida.confrontoId);
    if (!confronto) {
      throw new NotFoundError("Confronto não encontrado");
    }
    timings["4a_buscarConfronto"] = Date.now() - start;

    // Buscar todas as partidas do confronto em paralelo (exceto a atual)
    start = Date.now();
    const partidasIds = confronto.partidas.filter((id) => id !== partidaId);
    const partidasPromises = partidasIds.map((id) => this.partidaRepository.buscarPorId(id));
    const partidasDoConfronto = (await Promise.all(partidasPromises)).filter(
      (p) => p !== null
    ) as PartidaTeams[];
    timings["4b_buscarPartidasConfronto"] = Date.now() - start;

    // Executar validações em paralelo (usando dados já carregados)
    start = Date.now();
    await Promise.all([
      this.validarDuplasUnicasComDados(partidasDoConfronto, dupla1Jogadores, dupla2Jogadores),
      partida.tipoJogo !== TipoJogoTeams.DECIDER
        ? this.validarJogadoresNaoRepetidosComDados(partidasDoConfronto, dupla1Jogadores, dupla2Jogadores)
        : Promise.resolve(),
    ]);
    timings["4c_validacoes"] = Date.now() - start;

    // Atualizar partida com os jogadores
    start = Date.now();
    await this.partidaRepository.atualizar(partidaId, {
      dupla1: dupla1Jogadores.map((j) => ({
        id: j.id,
        nome: j.nome,
        nivel: j.nivel,
        genero: j.genero,
      })),
      dupla2: dupla2Jogadores.map((j) => ({
        id: j.id,
        nome: j.nome,
        nivel: j.nivel,
        genero: j.genero,
      })),
    });
    timings["6_atualizarPartidaJogadores"] = Date.now() - start;

    start = Date.now();
    const partidaAtualizada = await this.partidaRepository.buscarPorId(
      partidaId
    ) as PartidaTeams;
    timings["7_buscarPartidaFinal"] = Date.now() - start;

    timings["TOTAL"] = Date.now() - startTotal;
    logger.info("⏱️ TIMING definirJogadoresPartida", { timings, partidaId });

    return partidaAtualizada;
  }

  /**
   * Valida duplas únicas usando dados já carregados (otimizado)
   * Evita queries duplicadas quando chamado junto com validarJogadoresNaoRepetidosComDados
   */
  private validarDuplasUnicasComDados(
    partidas: PartidaTeams[],
    dupla1Jogadores: JogadorEquipe[],
    dupla2Jogadores: JogadorEquipe[]
  ): void {
    // Criar conjunto de duplas já usadas
    const duplasUsadas = new Set<string>();
    for (const p of partidas) {
      if (p.dupla1.length === 2) {
        const ids = p.dupla1.map((j) => j.id).sort();
        duplasUsadas.add(ids.join("-"));
      }
      if (p.dupla2.length === 2) {
        const ids = p.dupla2.map((j) => j.id).sort();
        duplasUsadas.add(ids.join("-"));
      }
    }

    // Validar nova dupla1
    const dupla1Ids = dupla1Jogadores.map((j) => j.id).sort();
    const dupla1Key = dupla1Ids.join("-");
    if (duplasUsadas.has(dupla1Key)) {
      throw new ValidationError(
        `A dupla ${dupla1Jogadores
          .map((j) => j.nome)
          .join(" / ")} já jogou neste confronto`
      );
    }

    // Validar nova dupla2
    const dupla2Ids = dupla2Jogadores.map((j) => j.id).sort();
    const dupla2Key = dupla2Ids.join("-");
    if (duplasUsadas.has(dupla2Key)) {
      throw new ValidationError(
        `A dupla ${dupla2Jogadores
          .map((j) => j.nome)
          .join(" / ")} já jogou neste confronto`
      );
    }
  }

  /**
   * Valida jogadores não repetidos usando dados já carregados (otimizado)
   * Evita queries duplicadas quando chamado junto com validarDuplasUnicasComDados
   */
  private validarJogadoresNaoRepetidosComDados(
    partidas: PartidaTeams[],
    dupla1Jogadores: JogadorEquipe[],
    dupla2Jogadores: JogadorEquipe[]
  ): void {
    // Criar conjunto de jogadores já usados (excluindo deciders)
    const jogadoresUsados = new Set<string>();
    for (const p of partidas) {
      // Ignorar deciders ao validar jogadores repetidos
      if (p.tipoJogo === TipoJogoTeams.DECIDER) continue;

      if (p.dupla1.length === 2) {
        p.dupla1.forEach((j) => jogadoresUsados.add(j.id));
      }
      if (p.dupla2.length === 2) {
        p.dupla2.forEach((j) => jogadoresUsados.add(j.id));
      }
    }

    // Validar se algum jogador da dupla1 já participou
    for (const jogador of dupla1Jogadores) {
      if (jogadoresUsados.has(jogador.id)) {
        throw new ValidationError(
          `O jogador ${jogador.nome} já participou de uma partida neste confronto`
        );
      }
    }

    // Validar se algum jogador da dupla2 já participou
    for (const jogador of dupla2Jogadores) {
      if (jogadoresUsados.has(jogador.id)) {
        throw new ValidationError(
          `O jogador ${jogador.nome} já participou de uma partida neste confronto`
        );
      }
    }
  }

  /**
   * Cria partidas vazias (sem jogadores definidos) para formação manual
   * As equipes devem definir os jogadores posteriormente
   */
  private async criarPartidasVazias(
    confronto: ConfrontoEquipe,
    etapa: Etapa,
    variante: VarianteTeams,
    isMisto: boolean
  ): Promise<PartidaTeams[]> {
    const equipe1 = await this.equipeRepository.buscarPorId(
      confronto.equipe1Id!
    );
    const equipe2 = await this.equipeRepository.buscarPorId(
      confronto.equipe2Id!
    );

    if (!equipe1 || !equipe2) {
      throw new NotFoundError("Equipe não encontrada");
    }

    const partidaDTOs: CriarPartidaTeamsDTO[] = [];

    if (variante === VarianteTeams.TEAMS_4) {
      // TEAMS_4: 2 jogos (+ decider se empatar 1-1)
      if (isMisto) {
        // Jogo 1: Feminino
        partidaDTOs.push(
          this.criarPartidaDTOVazia(
            confronto,
            etapa,
            1,
            TipoJogoTeams.FEMININO,
            equipe1,
            equipe2
          )
        );
        // Jogo 2: Masculino
        partidaDTOs.push(
          this.criarPartidaDTOVazia(
            confronto,
            etapa,
            2,
            TipoJogoTeams.MASCULINO,
            equipe1,
            equipe2
          )
        );
      } else {
        // TEAMS_4 não misto: 2 jogos do mesmo gênero
        const tipoJogo =
          etapa.genero === GeneroJogador.FEMININO
            ? TipoJogoTeams.FEMININO
            : TipoJogoTeams.MASCULINO;
        partidaDTOs.push(
          this.criarPartidaDTOVazia(
            confronto,
            etapa,
            1,
            tipoJogo,
            equipe1,
            equipe2
          )
        );
        partidaDTOs.push(
          this.criarPartidaDTOVazia(
            confronto,
            etapa,
            2,
            tipoJogo,
            equipe1,
            equipe2
          )
        );
      }
    } else {
      // TEAMS_6: 3 jogos fixos (SEM decider)
      if (isMisto) {
        // TEAMS_6 MISTO: 3 jogos (feminino, masculino, misto)
        partidaDTOs.push(
          this.criarPartidaDTOVazia(
            confronto,
            etapa,
            1,
            TipoJogoTeams.FEMININO,
            equipe1,
            equipe2
          )
        );
        partidaDTOs.push(
          this.criarPartidaDTOVazia(
            confronto,
            etapa,
            2,
            TipoJogoTeams.MASCULINO,
            equipe1,
            equipe2
          )
        );
        partidaDTOs.push(
          this.criarPartidaDTOVazia(
            confronto,
            etapa,
            3,
            TipoJogoTeams.MISTO,
            equipe1,
            equipe2
          )
        );
      } else {
        // TEAMS_6 NÃO MISTO: 3 jogos do mesmo gênero
        const tipoJogo =
          etapa.genero === GeneroJogador.FEMININO
            ? TipoJogoTeams.FEMININO
            : TipoJogoTeams.MASCULINO;
        partidaDTOs.push(
          this.criarPartidaDTOVazia(
            confronto,
            etapa,
            1,
            tipoJogo,
            equipe1,
            equipe2
          )
        );
        partidaDTOs.push(
          this.criarPartidaDTOVazia(
            confronto,
            etapa,
            2,
            tipoJogo,
            equipe1,
            equipe2
          )
        );
        partidaDTOs.push(
          this.criarPartidaDTOVazia(
            confronto,
            etapa,
            3,
            tipoJogo,
            equipe1,
            equipe2
          )
        );
      }
    }

    const partidas = await this.partidaRepository.criarEmLote(partidaDTOs);

    for (const partida of partidas) {
      await this.confrontoRepository.adicionarPartida(confronto.id, partida.id);
    }

    return partidas;
  }

  /**
   * Cria um DTO de partida vazia (sem jogadores definidos)
   */
  private criarPartidaDTOVazia(
    confronto: ConfrontoEquipe,
    etapa: Etapa,
    ordem: number,
    tipoJogo: TipoJogoTeams,
    equipe1: Equipe,
    equipe2: Equipe
  ): CriarPartidaTeamsDTO {
    return {
      confrontoId: confronto.id,
      etapaId: etapa.id,
      arenaId: etapa.arenaId,
      ordem,
      tipoJogo,
      equipe1Id: equipe1.id,
      equipe1Nome: equipe1.nome,
      equipe2Id: equipe2.id,
      equipe2Nome: equipe2.nome,
      // Campos vazios - serão preenchidos manualmente
      dupla1: [],
      dupla2: [],
      isDecider: false,
    };
  }

  // ==================== RESULTADO ====================

  /**
   * Registra resultado de uma partida
   * ✅ DEBUG: Logs de timing para identificar gargalos
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

    // ✅ OTIMIZAÇÃO v3: Buscar partida primeiro (necessário para obter confrontoId)
    const partida = await this.partidaRepository.buscarPorId(partidaId);
    tempos["1_buscarPartida"] = Date.now() - inicio;
    if (!partida) {
      throw new NotFoundError("Partida não encontrada");
    }

    // ✅ OTIMIZAÇÃO v3: Buscar confronto e partidas do confronto em paralelo
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

    // ✅ OTIMIZAÇÃO v3: partidasConfronto já foi buscado no início em paralelo
    // Precisamos atualizar a lista com o resultado recém-registrado
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

    // Contar partidas finalizadas
    const partidasFinalizadas = partidasAtualizadas.filter(
      (p) => p.status === StatusPartida.FINALIZADA
    ).length;

    // ✅ OTIMIZAÇÃO v3: Combinar atualizações do confronto
    inicio = Date.now();
    await this.confrontoRepository.atualizar(confronto.id, {
      jogosEquipe1,
      jogosEquipe2,
      partidasFinalizadas,
      totalPartidas: partidasAtualizadas.length,
    });
    tempos["6_atualizarConfronto"] = Date.now() - inicio;

    // ✅ OTIMIZAÇÃO v3: Construir confronto atualizado localmente em vez de buscar novamente
    const confrontoAtualizado: ConfrontoEquipe = {
      ...confronto,
      jogosEquipe1,
      jogosEquipe2,
      partidasFinalizadas,
      totalPartidas: partidasAtualizadas.length,
    };

    // ✅ OTIMIZAÇÃO v3: Construir partida atualizada localmente
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
    if (precisaDecider && !confrontoAtualizado.temDecider) {
      try {
        inicio = Date.now();
        const etapa = await this.etapaRepository.buscarPorId(partida.etapaId);
        if (etapa) {
          await this.gerarDecider(confrontoAtualizado, etapa);
          logger.info("Decider gerado automaticamente após empate 1-1", {
            confrontoId: confronto.id,
            etapaId: etapa.id,
          });
          // Após gerar o decider, não precisa mais (já foi gerado)
          precisaDecider = false;
        }
        tempos["8_gerarDecider"] = Date.now() - inicio;
      } catch (error) {
        // Se falhar ao gerar decider, apenas logar e continuar
        // O frontend ainda pode gerar manualmente
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

    // ✅ OTIMIZAÇÃO v3: Se confronto finalizado, buscar versão final; caso contrário usar local
    let confrontoFinal = confrontoAtualizado;
    if (confrontoFinalizado) {
      inicio = Date.now();
      await this.finalizarConfronto(confrontoAtualizado);
      // Só busca se finalizou (para pegar vencedorId etc)
      confrontoFinal = (await this.confrontoRepository.buscarPorId(confronto.id))!;
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
   * ✅ OTIMIZAÇÃO v5: Registrar múltiplos resultados em lote
   * Agrupa por confronto para otimizar buscas e operações
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

    // 1. Buscar todas as partidas de uma vez
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
        // Processar todas as partidas deste confronto
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

    // 5. Recalcular classificação uma única vez se houve mudanças
    if (processados > 0) {
      inicio = Date.now();
      await this.recalcularClassificacao(etapaId, arenaId);
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

  /**
   * Processa resultados de múltiplas partidas de um mesmo confronto
   */
  private async processarResultadosConfronto(
    confronto: ConfrontoEquipe,
    partidasComPlacar: Array<{ partida: PartidaTeams; placar: SetPlacarTeams[] }>
  ): Promise<{ confrontoFinalizado: boolean }> {
    // Coletar todas as atualizações de estatísticas de jogadores
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

    // Coletar incrementos de equipes
    const incrementosEquipes = new Map<
      string,
      { jogosVencidos: number; jogosPerdidos: number; gamesVencidos: number; gamesPerdidos: number }
    >();

    // Usar IDs das equipes do confronto
    const equipe1Id = confronto.equipe1Id;
    const equipe2Id = confronto.equipe2Id;

    // Inicializar incrementos
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

    // Buscar estatísticas de todos os jogadores envolvidos
    const todosJogadorIds = new Set<string>();
    for (const { partida } of partidasComPlacar) {
      partida.dupla1.forEach((j) => todosJogadorIds.add(j.id));
      partida.dupla2.forEach((j) => todosJogadorIds.add(j.id));
    }

    const estatisticasMap = await this.estatisticasService.buscarPorJogadoresEtapa(
      Array.from(todosJogadorIds),
      confronto.etapaId
    );

    // Processar cada partida
    for (const { partida, placar } of partidasComPlacar) {
      // Calcular resultado
      const { setsDupla1, setsDupla2, vencedoraEquipeId, vencedoraEquipeNome } =
        this.calcularResultadoPartida(placar, partida, confronto);

      // Registrar resultado da partida
      await this.partidaRepository.registrarResultado(
        partida.id,
        placar,
        setsDupla1,
        setsDupla2,
        vencedoraEquipeId,
        vencedoraEquipeNome
      );

      // Calcular games
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

      // Coletar atualizações de estatísticas de jogadores
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

      // Acumular incrementos das equipes
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

    // Aplicar todas as atualizações em batch
    await Promise.all([
      // Atualizar estatísticas de jogadores
      this.estatisticasService.atualizarAposPartidaComIncrement(
        atualizacoesJogadores
      ),
      // Atualizar estatísticas das equipes
      this.equipeRepository.incrementarEstatisticasEmLote([
        { id: equipe1Id, incrementos: incrementosEquipes.get(equipe1Id)! },
        { id: equipe2Id, incrementos: incrementosEquipes.get(equipe2Id)! },
      ]),
    ]);

    // Buscar partidas atualizadas do confronto para verificar finalização
    const partidasConfronto =
      await this.partidaRepository.buscarPorConfrontoOrdenadas(confronto.id);

    // Calcular contadores do confronto
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

    // Atualizar confronto
    await this.confrontoRepository.atualizar(confronto.id, {
      jogosEquipe1,
      jogosEquipe2,
      partidasFinalizadas,
      totalPartidas: partidasConfronto.length,
    });

    // Construir confronto atualizado
    const confrontoAtualizado: ConfrontoEquipe = {
      ...confronto,
      jogosEquipe1,
      jogosEquipe2,
      partidasFinalizadas,
      totalPartidas: partidasConfronto.length,
    };

    // Verificar se confronto finalizou
    const confrontoFinalizado = await this.verificarConfrontoFinalizado(
      confrontoAtualizado,
      partidasConfronto
    );

    if (confrontoFinalizado) {
      await this.finalizarConfronto(confrontoAtualizado);
    }

    return { confrontoFinalizado };
  }

  /**
   * Gera partida de decider quando empate 1-1 em TEAMS_4
   */
  async gerarDecider(
    confronto: ConfrontoEquipe,
    etapa: Etapa
  ): Promise<PartidaTeams> {
    const timings: Record<string, number> = {};
    const startTotal = Date.now();

    const variante = etapa.varianteTeams!;

    if (variante !== VarianteTeams.TEAMS_4) {
      throw new ValidationError("Decider só é permitido para TEAMS_4");
    }

    let start = Date.now();
    const existeDecider = await this.partidaRepository.existeDecider(
      confronto.id
    );
    timings["1_verificarExisteDecider"] = Date.now() - start;

    if (existeDecider) {
      throw new ValidationError("Decider já existe para este confronto");
    }

    // Buscar equipes em paralelo
    start = Date.now();
    const [equipe1, equipe2] = await Promise.all([
      this.equipeRepository.buscarPorId(confronto.equipe1Id),
      this.equipeRepository.buscarPorId(confronto.equipe2Id),
    ]);
    timings["2_buscarEquipes"] = Date.now() - start;

    if (!equipe1 || !equipe2) {
      throw new NotFoundError("Equipe não encontrada");
    }

    // Verificar se a formação dos JOGOS (não equipes) foi manual
    const tipoFormacaoJogos = etapa.tipoFormacaoJogos;
    const isFormacaoManual = tipoFormacaoJogos === TipoFormacaoJogos.MANUAL;

    let dupla1Jogadores: JogadorEquipe[];
    let dupla2Jogadores: JogadorEquipe[];

    // Se formação manual, criar decider vazio para definir jogadores depois
    if (isFormacaoManual) {
      dupla1Jogadores = [];
      dupla2Jogadores = [];
    } else {
      // Formação automática: gerar duplas automaticamente
      // Para TEAMS_4 misto: F+M vs F+M
      // Etapa é mista se: isMisto é true, OU genero é MISTO
      const isMisto = etapa.isMisto || etapa.genero === GeneroJogador.MISTO;

      if (isMisto) {
        const f1 = equipe1.jogadores.filter(
          (j) => j.genero === GeneroJogador.FEMININO
        );
        const m1 = equipe1.jogadores.filter(
          (j) => j.genero === GeneroJogador.MASCULINO
        );
        const f2 = equipe2.jogadores.filter(
          (j) => j.genero === GeneroJogador.FEMININO
        );
        const m2 = equipe2.jogadores.filter(
          (j) => j.genero === GeneroJogador.MASCULINO
        );

        dupla1Jogadores = [this.shuffle(f1)[0], this.shuffle(m1)[0]];
        dupla2Jogadores = [this.shuffle(f2)[0], this.shuffle(m2)[0]];
      } else {
        const jogadores1 = this.shuffle([...equipe1.jogadores]);
        const jogadores2 = this.shuffle([...equipe2.jogadores]);
        dupla1Jogadores = jogadores1.slice(0, 2);
        dupla2Jogadores = jogadores2.slice(0, 2);
      }
    }

    const partidaDTO = this.criarPartidaDTO(
      confronto,
      etapa,
      3, // ordem 3 para decider
      TipoJogoTeams.DECIDER,
      dupla1Jogadores,
      dupla2Jogadores
    );

    start = Date.now();
    const partida = await this.partidaRepository.criar(partidaDTO);
    timings["3_criarPartida"] = Date.now() - start;

    start = Date.now();
    await this.confrontoRepository.adicionarPartida(confronto.id, partida.id);
    timings["4_adicionarPartidaConfronto"] = Date.now() - start;

    start = Date.now();
    await this.confrontoRepository.marcarTemDecider(confronto.id, true);
    timings["5_marcarTemDecider"] = Date.now() - start;

    timings["TOTAL"] = Date.now() - startTotal;
    logger.info("⏱️ TIMING gerarDecider", { timings, confrontoId: confronto.id });

    return partida;
  }

  // ==================== CLASSIFICAÇÃO ====================

  /**
   * Recalcula classificação das equipes
   */
  async recalcularClassificacao(
    etapaId: string,
    arenaId: string
  ): Promise<Equipe[]> {
    const equipes = await this.equipeRepository.buscarPorEtapa(
      etapaId,
      arenaId
    );

    // Ordenar por critérios de desempate
    const equipesOrdenadas = [...equipes].sort((a, b) => {
      // 1. Pontos (desc)
      if (b.pontos !== a.pontos) return b.pontos - a.pontos;
      // 2. Saldo de jogos (desc)
      if (b.saldoJogos !== a.saldoJogos) return b.saldoJogos - a.saldoJogos;
      // 3. Saldo de games (desc)
      if (b.saldoGames !== a.saldoGames) return b.saldoGames - a.saldoGames;
      // 4. Games vencidos (desc)
      if (b.gamesVencidos !== a.gamesVencidos)
        return b.gamesVencidos - a.gamesVencidos;
      // 5. Nome (asc) como último critério
      return a.nome.localeCompare(b.nome);
    });

    // ✅ OTIMIZAÇÃO: Atualizar todas as posições em um único batch
    const atualizacoes = equipesOrdenadas.map((equipe, index) => ({
      id: equipe.id,
      posicao: index + 1,
    }));
    await this.equipeRepository.atualizarPosicoesEmLote(atualizacoes);

    // ✅ OTIMIZAÇÃO v4: Retornar equipes com posições atualizadas localmente
    // em vez de buscar novamente do banco
    return equipesOrdenadas.map((equipe, index) => ({
      ...equipe,
      posicao: index + 1,
    }));
  }

  // ==================== BUSCAR ====================

  async buscarEquipes(etapaId: string, arenaId: string): Promise<Equipe[]> {
    return this.equipeRepository.buscarPorEtapaOrdenadas(etapaId, arenaId);
  }

  async buscarConfrontos(
    etapaId: string,
    arenaId: string
  ): Promise<ConfrontoEquipe[]> {
    return this.confrontoRepository.buscarPorEtapaOrdenados(etapaId, arenaId);
  }

  async buscarPartidasConfronto(confrontoId: string): Promise<PartidaTeams[]> {
    return this.partidaRepository.buscarPorConfrontoOrdenadas(confrontoId);
  }

  /**
   * Renomear uma equipe
   */
  async renomearEquipe(
    equipeId: string,
    novoNome: string,
    arenaId: string
  ): Promise<void> {
    // Buscar equipe
    const equipe = await this.equipeRepository.buscarPorId(equipeId);
    if (!equipe) {
      throw new NotFoundError("Equipe não encontrada");
    }

    // Verificar permissão de arena
    if (equipe.arenaId !== arenaId) {
      throw new Error("Você não tem permissão para editar esta equipe");
    }

    // Validar nome
    if (!novoNome || novoNome.trim().length === 0) {
      throw new Error("Nome da equipe não pode ser vazio");
    }

    if (novoNome.trim().length > 100) {
      throw new Error("Nome da equipe não pode ter mais de 100 caracteres");
    }

    // Atualizar nome
    await this.equipeRepository.atualizar(equipeId, {
      nome: novoNome.trim(),
    });

    logger.info("Equipe renomeada", {
      equipeId,
      nomeAntigo: equipe.nome,
      nomeNovo: novoNome.trim(),
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

  async cancelarChaves(etapaId: string, arenaId: string): Promise<void> {
    const timings: Record<string, number> = {};
    const startTotal = Date.now();

    // Import necessário para estatísticas
    const { estatisticasJogadorRepository } = await import(
      "../repositories/firebase/EstatisticasJogadorRepository"
    );

    // Executar todas as deleções em paralelo (são independentes)
    const startParalelo = Date.now();
    const [partidasResult, confrontosResult, equipesResult, estatisticasResult] = await Promise.all([
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
    logger.info("⏱️ TIMING cancelarChaves TEAMS", { timings, etapaId, arenaId });
    logger.info("Chaves TEAMS canceladas", { etapaId, arenaId });
  }

  // ==================== MÉTODOS PRIVADOS ====================

  private validarEtapaParaGeracaoEquipes(etapa: Etapa): void {
    if (etapa.formato !== FormatoEtapa.TEAMS) {
      throw new ValidationError("Etapa não é do formato TEAMS");
    }

    if (etapa.status !== StatusEtapa.INSCRICOES_ENCERRADAS) {
      throw new ValidationError(
        "Inscrições devem estar encerradas para gerar equipes"
      );
    }

    if (!etapa.varianteTeams) {
      throw new ValidationError("Variante TEAMS não definida");
    }

    if (!etapa.tipoFormacaoEquipe) {
      throw new ValidationError("Tipo de formação de equipe não definido");
    }
  }

  private distribuirBalanceado(
    inscricoes: Inscricao[],
    numEquipes: number,
    variante: VarianteTeams,
    isMisto: boolean
  ): JogadorEquipe[][] {
    const equipes: JogadorEquipe[][] = Array.from(
      { length: numEquipes },
      () => []
    );

    if (isMisto) {
      // Separar por gênero primeiro
      const femininas = inscricoes.filter(
        (i) => i.genero === GeneroJogador.FEMININO
      );
      const masculinos = inscricoes.filter(
        (i) => i.genero === GeneroJogador.MASCULINO
      );

      // Distribuir femininas balanceado por nível
      this.distribuirPorNivel(femininas, equipes, variante / 2);
      // Distribuir masculinos balanceado por nível
      this.distribuirPorNivel(masculinos, equipes, variante / 2);
    } else {
      // Distribuir todos balanceado por nível
      this.distribuirPorNivel(inscricoes, equipes, variante);
    }

    return equipes;
  }

  private distribuirPorNivel(
    inscricoes: Inscricao[],
    equipes: JogadorEquipe[][],
    jogadoresPorEquipe: number
  ): void {
    // Agrupar por nível
    const porNivel: Record<string, Inscricao[]> = {
      [NivelJogador.AVANCADO]: [],
      [NivelJogador.INTERMEDIARIO]: [],
      [NivelJogador.INICIANTE]: [],
    };

    for (const inscricao of inscricoes) {
      porNivel[inscricao.nivel].push(inscricao);
    }

    // Shuffle cada pote
    for (const nivel of Object.keys(porNivel)) {
      porNivel[nivel] = this.shuffle(porNivel[nivel]);
    }

    // Distribuir round-robin por nível
    let equipeIndex = 0;
    const niveis = [
      NivelJogador.AVANCADO,
      NivelJogador.INTERMEDIARIO,
      NivelJogador.INICIANTE,
    ];

    for (const nivel of niveis) {
      for (const inscricao of porNivel[nivel]) {
        // Encontrar equipe que ainda precisa de jogadores deste gênero
        let tentativas = 0;
        let jogadoresMesmoGenero = equipes[equipeIndex].filter(
          (j) => j.genero === inscricao.genero
        ).length;

        while (
          jogadoresMesmoGenero >= jogadoresPorEquipe &&
          tentativas < equipes.length
        ) {
          equipeIndex = (equipeIndex + 1) % equipes.length;
          tentativas++;

          // Recalcular para a nova equipe
          jogadoresMesmoGenero = equipes[equipeIndex].filter(
            (j) => j.genero === inscricao.genero
          ).length;

          if (jogadoresMesmoGenero < jogadoresPorEquipe) {
            break;
          }
        }

        if (tentativas >= equipes.length) {
          logger.error(
            `Todas as equipes estão cheias para gênero ${inscricao.genero}`,
            {
              jogador: inscricao.jogadorNome,
              jogadoresPorEquipe,
            }
          );
        }

        equipes[equipeIndex].push({
          id: inscricao.jogadorId,
          nome: inscricao.jogadorNome,
          nivel: inscricao.nivel,
          genero: inscricao.genero,
        });

        equipeIndex = (equipeIndex + 1) % equipes.length;
      }
    }
  }

  private distribuirAleatorio(
    inscricoes: Inscricao[],
    numEquipes: number,
    variante: VarianteTeams,
    isMisto: boolean
  ): JogadorEquipe[][] {
    const equipes: JogadorEquipe[][] = Array.from(
      { length: numEquipes },
      () => []
    );

    if (isMisto) {
      const femininas = this.shuffle(
        inscricoes.filter((i) => i.genero === GeneroJogador.FEMININO)
      );
      const masculinos = this.shuffle(
        inscricoes.filter((i) => i.genero === GeneroJogador.MASCULINO)
      );

      const femPorEquipe = variante / 2;
      const mascPorEquipe = variante / 2;

      for (let i = 0; i < numEquipes; i++) {
        for (let j = 0; j < femPorEquipe; j++) {
          const inscricao = femininas[i * femPorEquipe + j];
          equipes[i].push({
            id: inscricao.jogadorId,
            nome: inscricao.jogadorNome,
            nivel: inscricao.nivel,
            genero: inscricao.genero,
          });
        }
        for (let j = 0; j < mascPorEquipe; j++) {
          const inscricao = masculinos[i * mascPorEquipe + j];
          equipes[i].push({
            id: inscricao.jogadorId,
            nome: inscricao.jogadorNome,
            nivel: inscricao.nivel,
            genero: inscricao.genero,
          });
        }
      }
    } else {
      const shuffled = this.shuffle(inscricoes);
      for (let i = 0; i < shuffled.length; i++) {
        const equipeIndex = Math.floor(i / variante);
        const inscricao = shuffled[i];
        equipes[equipeIndex].push({
          id: inscricao.jogadorId,
          nome: inscricao.jogadorNome,
          nivel: inscricao.nivel,
          genero: inscricao.genero,
        });
      }
    }

    return equipes;
  }

  private criarPartidaDTO(
    confronto: ConfrontoEquipe,
    etapa: Etapa,
    ordem: number,
    tipoJogo: TipoJogoTeams,
    dupla1Jogadores: JogadorEquipe[],
    dupla2Jogadores: JogadorEquipe[]
  ): CriarPartidaTeamsDTO {
    return {
      etapaId: etapa.id,
      arenaId: etapa.arenaId,
      confrontoId: confronto.id,
      ordem,
      tipoJogo,
      dupla1: dupla1Jogadores.map((j) => ({
        id: j.id,
        nome: j.nome,
        nivel: j.nivel,
        genero: j.genero,
      })),
      dupla2: dupla2Jogadores.map((j) => ({
        id: j.id,
        nome: j.nome,
        nivel: j.nivel,
        genero: j.genero,
      })),
    };
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
    let setsDupla1 = 0;
    let setsDupla2 = 0;

    for (const set of placar) {
      if (set.gamesDupla1 > set.gamesDupla2) {
        setsDupla1++;
      } else if (set.gamesDupla2 > set.gamesDupla1) {
        setsDupla2++;
      }
    }

    // Usar IDs da partida, ou fallback para confronto (compatibilidade com partidas antigas)
    const equipe1Id = partida.equipe1Id || confronto.equipe1Id;
    const equipe2Id = partida.equipe2Id || confronto.equipe2Id;
    const equipe1Nome = partida.equipe1Nome || confronto.equipe1Nome;
    const equipe2Nome = partida.equipe2Nome || confronto.equipe2Nome;

    const vencedoraEquipeId = setsDupla1 > setsDupla2 ? equipe1Id! : equipe2Id!;
    const vencedoraEquipeNome = setsDupla1 > setsDupla2 ? equipe1Nome! : equipe2Nome!;

    return { setsDupla1, setsDupla2, vencedoraEquipeId, vencedoraEquipeNome };
  }

  /**
   * ✅ OTIMIZAÇÃO v2: Atualiza estatísticas de jogadores e equipes em batch
   * - Busca todas as estatísticas de jogadores em uma única query
   * - Atualiza jogadores e equipes em batch único
   * - Reduz de ~2.4s para ~500ms
   */
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

    // Usar IDs da partida, ou fallback para confronto (compatibilidade com partidas antigas)
    const equipe1Id = partida.equipe1Id || confronto.equipe1Id;
    const equipe2Id = partida.equipe2Id || confronto.equipe2Id;

    const dupla1Venceu = vencedoraEquipeId === equipe1Id;
    const setsVencidosDupla1 = placar.filter((s) => s.gamesDupla1 > s.gamesDupla2).length;
    const setsPerdidosDupla1 = placar.filter((s) => s.gamesDupla2 > s.gamesDupla1).length;

    // ✅ 1. Buscar todas as estatísticas de jogadores em uma única query
    inicio = Date.now();
    const todosJogadorIds = [
      ...partida.dupla1.map((j) => j.id),
      ...partida.dupla2.map((j) => j.id),
    ];
    const estatisticasMap = await this.estatisticasService.buscarPorJogadoresEtapa(
      todosJogadorIds,
      partida.etapaId
    );
    tempos["1_buscarEstatisticas"] = Date.now() - inicio;

    // ✅ 2. Preparar atualizações de jogadores e atualizar em batch
    inicio = Date.now();
    const atualizacoesJogadores: Array<{
      estatisticaId: string;
      dto: { venceu: boolean; setsVencidos: number; setsPerdidos: number; gamesVencidos: number; gamesPerdidos: number };
    }> = [];

    // Jogadores da dupla 1
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

    // Jogadores da dupla 2
    for (const jogador of partida.dupla2) {
      const estatistica = estatisticasMap.get(jogador.id);
      if (estatistica) {
        atualizacoesJogadores.push({
          estatisticaId: estatistica.id,
          dto: {
            venceu: !dupla1Venceu,
            setsVencidos: setsPerdidosDupla1, // Invertido para dupla 2
            setsPerdidos: setsVencidosDupla1, // Invertido para dupla 2
            gamesVencidos: gamesVencidosDupla2,
            gamesPerdidos: gamesPerdidosDupla2,
          },
        });
      }
    }

    // Atualizar todos os jogadores em um único batch com increment
    if (atualizacoesJogadores.length > 0) {
      await this.estatisticasService.atualizarAposPartidaComIncrement(atualizacoesJogadores);
    }
    tempos["2_atualizarJogadores"] = Date.now() - inicio;

    // ✅ 3. Atualizar estatísticas das equipes em batch
    // Só atualizar se ambos os IDs existem
    if (!equipe1Id || !equipe2Id) {
      logger.warn("Partida e confronto sem equipe1Id ou equipe2Id, pulando atualização de estatísticas de equipes", {
        partidaId: partida.id,
        equipe1Id,
        equipe2Id,
      });
      tempos["3_incrementarEquipes"] = 0;
      tempos["4_buscarEquipes"] = 0;
      tempos["5_atualizarSaldos"] = 0;
      tempos["TOTAL"] = Date.now() - inicioTotal;
      logger.info("⏱️ TEMPOS atualizarEstatisticasJogadores Teams v3", {
        partidaId: partida.id,
        jogadoresDupla1: partida.dupla1.length,
        jogadoresDupla2: partida.dupla2.length,
        tempos,
      });
      return;
    }

    // ✅ OTIMIZAÇÃO v3: Incrementar estatísticas E saldos em uma única operação
    // Saldos são calculados automaticamente no repositório
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
    // Similar ao que é feito em outros serviços
  }

  private async verificarPrecisaDecider(
    confronto: ConfrontoEquipe,
    partidas: PartidaTeams[]
  ): Promise<boolean> {
    // Só TEAMS_4 tem decider, TEAMS_6 NUNCA tem decider
    // Verificar pela quantidade de partidas totais: TEAMS_4 tem 2, TEAMS_6 tem 3
    if (confronto.totalPartidas === 3) {
      return false; // TEAMS_6 não usa decider
    }

    const partidasRegulares = partidas.filter(
      (p) => p.tipoJogo !== TipoJogoTeams.DECIDER
    );
    const finalizadas = partidasRegulares.filter(
      (p) => p.status === StatusPartida.FINALIZADA
    );

    // Se não terminou as 2 partidas regulares, não precisa de decider ainda
    if (finalizadas.length < 2) return false;

    // Verificar se está 1-1
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

    // TEAMS_6: 3 jogos, vence quem ganhar 2
    // TEAMS_4: 2 jogos + decider se 1-1, vence quem ganhar 2

    // Alguém ganhou 2?
    if (confronto.jogosEquipe1 >= 2 || confronto.jogosEquipe2 >= 2) {
      return true;
    }

    // TEAMS_6: Se todas as 3 partidas finalizadas
    if (confronto.totalPartidas === 3 && finalizadas.length === 3) {
      return true;
    }

    // TEAMS_4 com decider: Se decider finalizado
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

    // Atualizar estatísticas de confrontos das equipes (apenas para fase de grupos)
    if (confronto.fase === FaseEtapa.GRUPOS) {
      // ✅ OTIMIZAÇÃO v4: Paralelizar registrarResultado + incrementarEquipes
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

      // Recalcular classificação
      inicio = Date.now();
      await this.recalcularClassificacao(confronto.etapaId, confronto.arenaId);
      tempos["2_recalcularClassificacao"] = Date.now() - inicio;

      // Verificar se fase de grupos terminou para preencher semifinais
      inicio = Date.now();
      await this.verificarEPreencherFaseEliminatoria(
        confronto.etapaId,
        confronto.arenaId
      );
      tempos["3_verificarEliminatoria"] = Date.now() - inicio;
    } else if (confronto.fase === FaseEtapa.SEMIFINAL) {
      // Para semifinal, registrar resultado primeiro
      inicio = Date.now();
      await this.confrontoRepository.registrarResultado(
        confronto.id,
        confronto.jogosEquipe1,
        confronto.jogosEquipe2,
        vencedoraId,
        vencedoraNome
      );
      tempos["1_registrarResultado"] = Date.now() - inicio;

      // Se semifinal terminou, preencher a final
      inicio = Date.now();
      await this.preencherProximoConfronto(
        confronto,
        vencedoraId,
        vencedoraNome
      );
      tempos["2_preencherProximo"] = Date.now() - inicio;
    } else {
      // Para outras fases (FINAL, etc), apenas registrar resultado
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

  /**
   * Verifica se a fase de grupos terminou e preenche a fase eliminatória
   * Suporta de 2 a 8 grupos
   */
  private async verificarEPreencherFaseEliminatoria(
    etapaId: string,
    arenaId: string
  ): Promise<void> {
    // Verificar se todos os confrontos de grupos terminaram
    const todosGruposFinalizados =
      await this.confrontoRepository.todosFinalizadosPorFase(
        etapaId,
        arenaId,
        FaseEtapa.GRUPOS
      );

    if (!todosGruposFinalizados) {
      return;
    }

    logger.info("Fase de grupos finalizada, preenchendo fase eliminatória", {
      etapaId,
    });

    // Buscar equipes classificadas por grupo
    const equipes = await this.equipeRepository.buscarPorEtapaOrdenadas(
      etapaId,
      arenaId
    );

    // Verificar se tem fase de grupos
    const temFaseGrupos = equipes.some((e) => e.grupoId);
    if (!temFaseGrupos) {
      return;
    }

    // Agrupar equipes por grupo e ordenar por classificação
    const equipesPorGrupo = new Map<string, Equipe[]>();
    for (const equipe of equipes) {
      const grupoId = equipe.grupoId || "A";
      if (!equipesPorGrupo.has(grupoId)) {
        equipesPorGrupo.set(grupoId, []);
      }
      equipesPorGrupo.get(grupoId)!.push(equipe);
    }

    // Ordenar equipes dentro de cada grupo
    for (const [, equipesDoGrupo] of equipesPorGrupo) {
      equipesDoGrupo.sort((a, b) => {
        if (b.pontos !== a.pontos) return b.pontos - a.pontos;
        if (b.saldoJogos !== a.saldoJogos) return b.saldoJogos - a.saldoJogos;
        if (b.saldoGames !== a.saldoGames) return b.saldoGames - a.saldoGames;
        return b.gamesVencidos - a.gamesVencidos;
      });
    }

    const grupoIds = Array.from(equipesPorGrupo.keys()).sort();
    const numGrupos = grupoIds.length;

    if (numGrupos < 2 || numGrupos > 8) {
      logger.warn(
        `Fase eliminatória suporta 2-8 grupos. Recebido: ${numGrupos}`
      );
      return;
    }

    // Criar mapa de classificados: "1A" -> equipe, "2B" -> equipe, etc
    const classificados = new Map<string, Equipe>();
    for (const grupoId of grupoIds) {
      const equipesDoGrupo = equipesPorGrupo.get(grupoId)!;
      if (equipesDoGrupo.length >= 1) {
        classificados.set(`1${grupoId}`, equipesDoGrupo[0]);
      }
      if (equipesDoGrupo.length >= 2) {
        classificados.set(`2${grupoId}`, equipesDoGrupo[1]);
      }
    }

    // Buscar todos os confrontos da fase eliminatória
    const confrontosEliminatoria =
      await this.confrontoRepository.buscarPorEtapa(etapaId, arenaId);

    // Filtrar apenas os confrontos eliminatórios (não grupos)
    const confrontosParaPreencher = confrontosEliminatoria.filter(
      (c) => c.fase !== FaseEtapa.GRUPOS
    );

    // Preencher cada confronto baseado na origem
    for (const confronto of confrontosParaPreencher) {
      // Pular se já tem equipes definidas
      if (
        confronto.equipe1Id &&
        confronto.equipe2Id &&
        confronto.equipe2Id !== "BYE"
      ) {
        continue;
      }

      // Verificar se é BYE
      if (confronto.isBye) {
        // Extrair a posição da origem (ex: "1º Grupo A" -> "1A")
        const posicao1 = this.extrairPosicaoDaOrigem(confronto.equipe1Origem);
        if (posicao1) {
          const equipe = classificados.get(posicao1);
          if (equipe) {
            // Atualizar o confronto com a equipe
            await this.confrontoRepository.atualizar(confronto.id, {
              equipe1Id: equipe.id,
              equipe1Nome: equipe.nome,
            });

            // Marcar como finalizado e passar equipe direto para o próximo confronto
            await this.confrontoRepository.atualizar(confronto.id, {
              status: StatusConfronto.FINALIZADO,
              vencedoraId: equipe.id,
              vencedoraNome: equipe.nome,
            });

            // Preencher o próximo confronto
            if (confronto.proximoConfrontoId) {
              await this.preencherProximoConfronto(
                {
                  ...confronto,
                  equipe1Id: equipe.id,
                  equipe1Nome: equipe.nome,
                } as ConfrontoEquipe,
                equipe.id,
                equipe.nome
              );
            }

            logger.info("BYE processado", {
              confrontoId: confronto.id,
              equipe: equipe.nome,
              fase: confronto.fase,
            });
          }
        }
        continue;
      }

      // Preencher equipe1 se origem definida e ainda não preenchida
      if (confronto.equipe1Origem && !confronto.equipe1Id) {
        const posicao1 = this.extrairPosicaoDaOrigem(confronto.equipe1Origem);
        if (posicao1) {
          const equipe = classificados.get(posicao1);
          if (equipe) {
            await this.confrontoRepository.atualizar(confronto.id, {
              equipe1Id: equipe.id,
              equipe1Nome: equipe.nome,
            });
          }
        }
      }

      // Preencher equipe2 se origem definida e ainda não preenchida
      if (confronto.equipe2Origem && !confronto.equipe2Id) {
        const posicao2 = this.extrairPosicaoDaOrigem(confronto.equipe2Origem);
        if (posicao2) {
          const equipe = classificados.get(posicao2);
          if (equipe) {
            await this.confrontoRepository.atualizar(confronto.id, {
              equipe2Id: equipe.id,
              equipe2Nome: equipe.nome,
            });
          }
        }
      }
    }

    logger.info("Fase eliminatória preenchida", {
      etapaId,
      numGrupos,
      totalClassificados: classificados.size,
    });
  }

  /**
   * Extrai a posição do classificado a partir da string de origem
   * Ex: "1º Grupo A" -> "1A", "2º Grupo B" -> "2B"
   * Retorna null se não for uma origem de grupo
   */
  private extrairPosicaoDaOrigem(origem?: string): string | null {
    if (!origem) return null;

    // Match para "1º Grupo A" ou "2º Grupo B", etc
    const match = origem.match(/^(\d)º Grupo ([A-H])$/);
    if (match) {
      return `${match[1]}${match[2]}`;
    }

    return null;
  }

  /**
   * Preenche o próximo confronto após uma semifinal
   */
  private async preencherProximoConfronto(
    confronto: ConfrontoEquipe,
    vencedoraId: string,
    vencedoraNome: string
  ): Promise<void> {
    if (!confronto.proximoConfrontoId) {
      return;
    }

    const proximoConfronto = await this.confrontoRepository.buscarPorId(
      confronto.proximoConfrontoId
    );

    if (!proximoConfronto) {
      return;
    }

    // Determinar qual posição preencher (equipe1 ou equipe2)
    if (!proximoConfronto.equipe1Id) {
      await this.confrontoRepository.atualizar(proximoConfronto.id, {
        equipe1Id: vencedoraId,
        equipe1Nome: vencedoraNome,
      });
    } else if (!proximoConfronto.equipe2Id) {
      await this.confrontoRepository.atualizar(proximoConfronto.id, {
        equipe2Id: vencedoraId,
        equipe2Nome: vencedoraNome,
      });
    }

    logger.info("Próximo confronto preenchido", {
      confrontoId: confronto.id,
      proximoConfrontoId: proximoConfronto.id,
      vencedora: vencedoraNome,
    });
  }

  private shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  /**
   * Calcula a estrutura de grupos baseado no número de equipes
   * Usa a mesma lógica de dupla fixa:
   * - Prioriza grupos de 3 equipes
   * - Usa grupos de 4 quando necessário
   * - Máximo 4 equipes por grupo
   *
   * Ex: 6 equipes -> [3, 3] (2 grupos de 3)
   * Ex: 7 equipes -> [3, 4] (1 grupo de 3 + 1 de 4)
   * Ex: 8 equipes -> [4, 4] (2 grupos de 4)
   * Ex: 9 equipes -> [3, 3, 3] (3 grupos de 3)
   * Ex: 10 equipes -> [3, 3, 4] (2 grupos de 3 + 1 de 4)
   */
  private calcularGrupos(numEquipes: number): number[] {
    if (numEquipes < 6) return []; // Sem grupos para menos de 6 equipes (2-5 = todos contra todos)

    // Usar a mesma função de cálculo de distribuição de grupos de dupla fixa
    return calcularDistribuicaoGrupos(numEquipes);
  }

  /**
   * Atribui grupo para uma equipe baseado no índice
   * Distribui em snake draft para balancear os grupos
   * Ex com 3 grupos: 0->A, 1->B, 2->C, 3->C, 4->B, 5->A, 6->A, 7->B, 8->C
   */
  private atribuirGrupo(
    index: number,
    grupos: number[]
  ): { grupoId: string; grupoNome: string } {
    const numGrupos = grupos.length;

    // Distribuição snake para balancear
    const round = Math.floor(index / numGrupos);
    const posicaoNoRound = index % numGrupos;

    // Snake: rounds pares vão normal (A,B,C), rounds ímpares invertem (C,B,A)
    let grupoIndex: number;
    if (round % 2 === 0) {
      grupoIndex = posicaoNoRound;
    } else {
      grupoIndex = numGrupos - 1 - posicaoNoRound;
    }

    const grupoId = LETRAS_GRUPOS[grupoIndex];
    return {
      grupoId,
      grupoNome: `Grupo ${grupoId}`,
    };
  }
}

export default new TeamsService();
