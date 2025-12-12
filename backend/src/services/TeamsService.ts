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
import {
  Etapa,
  StatusEtapa,
  FaseEtapa,
  FormatoEtapa,
} from "../models/Etapa";
import { StatusPartida } from "../models/Partida";
import { NivelJogador, GeneroJogador } from "../models/Jogador";
import { IEquipeRepository } from "../repositories/interfaces/IEquipeRepository";
import { IConfrontoEquipeRepository } from "../repositories/interfaces/IConfrontoEquipeRepository";
import { IPartidaTeamsRepository } from "../repositories/interfaces/IPartidaTeamsRepository";
import EquipeRepository from "../repositories/firebase/EquipeRepository";
import ConfrontoEquipeRepository from "../repositories/firebase/ConfrontoEquipeRepository";
import PartidaTeamsRepository from "../repositories/firebase/PartidaTeamsRepository";
import { EstatisticasJogadorService } from "./EstatisticasJogadorService";
import { NotFoundError, ValidationError } from "../utils/errors";
import { calcularDistribuicaoGrupos, LETRAS_GRUPOS } from "../utils/torneioUtils";
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
    private estatisticasService: EstatisticasJogadorService = new EstatisticasJogadorService()
  ) {}

  // ==================== FORMAÇÃO DE EQUIPES ====================

  /**
   * Gera equipes automaticamente baseado no tipo de formação
   */
  async gerarEquipes(
    etapa: Etapa,
    inscricoes: Inscricao[]
  ): Promise<{ equipes: Equipe[]; estatisticas: any[]; temFaseGrupos: boolean }> {
    this.validarEtapaParaGeracaoEquipes(etapa);

    const variante = etapa.varianteTeams!;
    const tipoFormacao = etapa.tipoFormacaoEquipe!;
    // Etapa é mista se: isMisto é true, OU genero é MISTO
    const isMisto = etapa.isMisto || etapa.genero === GeneroJogador.MISTO;

    // Validar número de jogadores
    if (inscricoes.length % variante !== 0) {
      throw new ValidationError(
        `Número de inscritos (${inscricoes.length}) não é múltiplo de ${variante}`
      );
    }

    const numEquipes = inscricoes.length / variante;
    if (numEquipes < 2) {
      throw new ValidationError("Mínimo de 2 equipes necessárias");
    }

    // Validar gênero para misto
    if (isMisto) {
      this.validarDistribuicaoGenero(inscricoes, variante);
    }

    // Distribuir jogadores em equipes
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

    // Com 6+ equipes, dividir em grupos
    const temFaseGrupos = numEquipes >= 6;
    const grupos = temFaseGrupos ? this.calcularGrupos(numEquipes) : null;

    // Criar equipes com atribuição de grupos
    const equipeDTOs: CriarEquipeDTO[] = jogadoresPorEquipe.map(
      (jogadores, index) => {
        const dto: CriarEquipeDTO = {
          etapaId: etapa.id,
          arenaId: etapa.arenaId,
          nome: `Equipe ${index + 1}`,
          jogadores,
        };

        // Atribuir grupo se aplicável
        if (grupos) {
          const grupoInfo = this.atribuirGrupo(index, grupos);
          dto.grupoId = grupoInfo.grupoId;
          dto.grupoNome = grupoInfo.grupoNome;
        }

        return dto;
      }
    );

    const equipes = await this.equipeRepository.criarEmLote(equipeDTOs);

    // Criar estatísticas individuais para cada jogador
    const estatisticas = [];
    for (const equipe of equipes) {
      for (const jogador of equipe.jogadores) {
        const stat = await this.estatisticasService.criar({
          etapaId: etapa.id,
          arenaId: etapa.arenaId,
          jogadorId: jogador.id,
          jogadorNome: jogador.nome,
          jogadorNivel: jogador.nivel,
          jogadorGenero: jogador.genero,
          grupoId: equipe.id,
          grupoNome: equipe.nome,
        });
        estatisticas.push(stat);
      }
    }

    logger.info("Equipes geradas com sucesso", {
      etapaId: etapa.id,
      numEquipes: equipes.length,
      tipoFormacao,
      temFaseGrupos,
      grupos: grupos ? grupos.length : 0,
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
  ): Promise<{ equipes: Equipe[]; estatisticas: any[]; temFaseGrupos: boolean }> {
    this.validarEtapaParaGeracaoEquipes(etapa);

    const variante = etapa.varianteTeams!;
    // Etapa é mista se: isMisto é true, OU genero é MISTO
    const isMisto = etapa.isMisto || etapa.genero === GeneroJogador.MISTO;

    // Criar mapa de inscrições para acesso rápido
    const inscricoesMap = new Map(
      inscricoes.map((i) => [i.jogadorId, i])
    );

    // Validar cada formação
    for (const formacao of formacoes) {
      if (formacao.jogadorIds.length !== variante) {
        throw new ValidationError(
          `Cada equipe deve ter exatamente ${variante} jogadores`
        );
      }

      // Validar proporção de gênero para etapas mistas
      if (isMisto) {
        const jogadoresDaEquipe = formacao.jogadorIds.map(id => inscricoesMap.get(id));
        const femininas = jogadoresDaEquipe.filter(j => j?.genero === GeneroJogador.FEMININO).length;
        const masculinos = jogadoresDaEquipe.filter(j => j?.genero === GeneroJogador.MASCULINO).length;

        const femininasEsperadas = variante / 2;
        const masculinosEsperados = variante / 2;

        if (femininas !== femininasEsperadas || masculinos !== masculinosEsperados) {
          const nomeEquipe = formacao.nome || `Equipe ${formacoes.indexOf(formacao) + 1}`;
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

    // Criar estatísticas
    const estatisticas = [];
    for (const equipe of equipes) {
      for (const jogador of equipe.jogadores) {
        const stat = await this.estatisticasService.criar({
          etapaId: etapa.id,
          arenaId: etapa.arenaId,
          jogadorId: jogador.id,
          jogadorNome: jogador.nome,
          jogadorNivel: jogador.nivel,
          jogadorGenero: jogador.genero,
          grupoId: equipe.id,
          grupoNome: equipe.nome,
        });
        estatisticas.push(stat);
      }
    }

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
   */
  async gerarConfrontos(
    etapa: Etapa,
    tipoFormacaoJogos: TipoFormacaoJogos = TipoFormacaoJogos.SORTEIO
  ): Promise<ConfrontoEquipe[]> {
    const equipes = await this.equipeRepository.buscarPorEtapaOrdenadas(
      etapa.id,
      etapa.arenaId
    );

    if (equipes.length < 2) {
      throw new ValidationError("Mínimo de 2 equipes para gerar confrontos");
    }

    const temFaseGrupos = equipes.length >= 6;

    let confrontos: ConfrontoEquipe[];

    if (temFaseGrupos) {
      // Gerar confrontos por grupo + fase eliminatória
      confrontos = await this.gerarConfrontosFaseGrupos(
        etapa,
        equipes,
        tipoFormacaoJogos
      );
    } else {
      // Gerar round-robin simples (todos contra todos)
      confrontos = await this.gerarConfrontosRoundRobin(
        etapa,
        equipes,
        tipoFormacaoJogos
      );
    }

    logger.info("Confrontos gerados com sucesso", {
      etapaId: etapa.id,
      numConfrontos: confrontos.length,
      temFaseGrupos,
    });

    return confrontos;
  }

  /**
   * Gera confrontos round-robin simples (todos contra todos)
   */
  private async gerarConfrontosRoundRobin(
    etapa: Etapa,
    equipes: Equipe[],
    tipoFormacaoJogos: TipoFormacaoJogos,
    grupoId?: string
  ): Promise<ConfrontoEquipe[]> {
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
    let ordem = 1;

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

    return this.confrontoRepository.criarEmLote(confrontoDTOs);
  }

  /**
   * Gera confrontos com fase de grupos + fase eliminatória
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

    const todosConfrontos: ConfrontoEquipe[] = [];

    // Gerar confrontos dentro de cada grupo
    for (const [grupoId, equipesDoGrupo] of gruposMap) {
      const confrontosGrupo = await this.gerarConfrontosRoundRobin(
        etapa,
        equipesDoGrupo,
        tipoFormacaoJogos,
        grupoId
      );
      todosConfrontos.push(...confrontosGrupo);
    }

    // Gerar fase eliminatória (semifinais e final)
    const confrontosEliminatoria = await this.gerarFaseEliminatoria(
      etapa,
      Array.from(gruposMap.keys()),
      tipoFormacaoJogos
    );
    todosConfrontos.push(...confrontosEliminatoria);

    return todosConfrontos;
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
      logger.warn(`Fase eliminatória suporta 2-8 grupos. Recebido: ${numGrupos}`);
      return [];
    }

    // Ordenar grupos por letra (A, B, C, D, ...)
    const gruposOrdenados = grupoIds.sort();

    switch (numGrupos) {
      case 2:
        return this.gerarEliminatoria2Grupos(etapa, gruposOrdenados, tipoFormacaoJogos);
      case 3:
        return this.gerarEliminatoria3Grupos(etapa, gruposOrdenados, tipoFormacaoJogos);
      case 4:
        return this.gerarEliminatoria4Grupos(etapa, gruposOrdenados, tipoFormacaoJogos);
      case 5:
        return this.gerarEliminatoria5Grupos(etapa, gruposOrdenados, tipoFormacaoJogos);
      case 6:
        return this.gerarEliminatoria6Grupos(etapa, gruposOrdenados, tipoFormacaoJogos);
      case 7:
        return this.gerarEliminatoria7Grupos(etapa, gruposOrdenados, tipoFormacaoJogos);
      case 8:
        return this.gerarEliminatoria8Grupos(etapa, gruposOrdenados, tipoFormacaoJogos);
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
    const [grupoA, grupoB, grupoC, grupoD, grupoE, grupoF, grupoG, grupoH] = grupos;

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
   * Gera partidas para um confronto (sorteio automático)
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
    // Etapa é mista se: isMisto é true, OU genero é MISTO
    const isMisto = etapa.isMisto || etapa.genero === GeneroJogador.MISTO;

    const equipe1 = await this.equipeRepository.buscarPorId(confronto.equipe1Id);
    const equipe2 = await this.equipeRepository.buscarPorId(confronto.equipe2Id);

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
            this.shuffle(femininas2),
            equipe1,
            equipe2
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
            this.shuffle(masculinos2),
            equipe1,
            equipe2
          )
        );
      } else {
        // Não misto: dividir em 2 duplas aleatórias
        // Usar o gênero da etapa para definir o tipo de jogo
        const tipoJogo = etapa.genero === GeneroJogador.FEMININO
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
            jogadores2.slice(0, 2),
            equipe1,
            equipe2
          )
        );

        partidaDTOs.push(
          this.criarPartidaDTO(
            confronto,
            etapa,
            2,
            tipoJogo,
            jogadores1.slice(2, 4),
            jogadores2.slice(2, 4),
            equipe1,
            equipe2
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
            f2.slice(0, 2),
            equipe1,
            equipe2
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
            m2.slice(0, 2),
            equipe1,
            equipe2
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
            [f2[2], m2[2]],
            equipe1,
            equipe2
          )
        );
      } else {
        // TEAMS_6 NÃO MISTO: 6M ou 6F → 3 partidas do mesmo gênero
        const tipoJogo = etapa.genero === GeneroJogador.FEMININO
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
            jogadores2.slice(0, 2),
            equipe1,
            equipe2
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
            jogadores2.slice(2, 4),
            equipe1,
            equipe2
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
            jogadores2.slice(4, 6),
            equipe1,
            equipe2
          )
        );
      }
    }

    const partidas = await this.partidaRepository.criarEmLote(partidaDTOs);

    // Atualizar confronto com partidas
    for (const partida of partidas) {
      await this.confrontoRepository.adicionarPartida(confronto.id, partida.id);
    }

    return partidas;
  }

  /**
   * Define partidas manualmente
   */
  async definirPartidasManualmente(
    confronto: ConfrontoEquipe,
    etapa: Etapa,
    definicao: DefinirPartidasManualDTO
  ): Promise<PartidaTeams[]> {
    const equipe1 = await this.equipeRepository.buscarPorId(confronto.equipe1Id);
    const equipe2 = await this.equipeRepository.buscarPorId(confronto.equipe2Id);

    if (!equipe1 || !equipe2) {
      throw new NotFoundError("Equipe não encontrada");
    }

    // Mapear jogadores por ID
    const jogadores1Map = new Map(
      equipe1.jogadores.map((j) => [j.id, j])
    );
    const jogadores2Map = new Map(
      equipe2.jogadores.map((j) => [j.id, j])
    );

    const partidaDTOs: CriarPartidaTeamsDTO[] = [];

    for (const def of definicao.partidas) {
      const dupla1Jogadores = def.dupla1JogadorIds.map((id) => {
        const j = jogadores1Map.get(id);
        if (!j) throw new ValidationError(`Jogador ${id} não pertence à equipe 1`);
        return j;
      });

      const dupla2Jogadores = def.dupla2JogadorIds.map((id) => {
        const j = jogadores2Map.get(id);
        if (!j) throw new ValidationError(`Jogador ${id} não pertence à equipe 2`);
        return j;
      });

      partidaDTOs.push(
        this.criarPartidaDTO(
          confronto,
          etapa,
          def.ordem,
          def.tipoJogo,
          dupla1Jogadores,
          dupla2Jogadores,
          equipe1,
          equipe2
        )
      );
    }

    const partidas = await this.partidaRepository.criarEmLote(partidaDTOs);

    for (const partida of partidas) {
      await this.confrontoRepository.adicionarPartida(confronto.id, partida.id);
    }

    return partidas;
  }

  // ==================== RESULTADO ====================

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
    const partida = await this.partidaRepository.buscarPorId(partidaId);
    if (!partida) {
      throw new NotFoundError("Partida não encontrada");
    }

    const confronto = await this.confrontoRepository.buscarPorId(
      partida.confrontoId
    );
    if (!confronto) {
      throw new NotFoundError("Confronto não encontrado");
    }

    // Calcular resultado
    const { setsDupla1, setsDupla2, vencedoraEquipeId, vencedoraEquipeNome } =
      this.calcularResultadoPartida(dto.placar, partida);

    // Se já tinha resultado, reverter estatísticas
    if (partida.status === StatusPartida.FINALIZADA) {
      await this.reverterEstatisticasPartida(partida);
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
    await this.atualizarEstatisticasJogadores(partida, dto.placar, vencedoraEquipeId);

    // Atualizar confronto
    const partidasConfronto =
      await this.partidaRepository.buscarPorConfrontoOrdenadas(confronto.id);

    const jogosEquipe1 = partidasConfronto.filter(
      (p) =>
        p.status === StatusPartida.FINALIZADA &&
        p.vencedoraEquipeId === confronto.equipe1Id
    ).length;

    const jogosEquipe2 = partidasConfronto.filter(
      (p) =>
        p.status === StatusPartida.FINALIZADA &&
        p.vencedoraEquipeId === confronto.equipe2Id
    ).length;

    // Contar partidas finalizadas
    const partidasFinalizadas = partidasConfronto.filter(
      (p) => p.status === StatusPartida.FINALIZADA
    ).length;

    await this.confrontoRepository.atualizarContadorJogos(
      confronto.id,
      jogosEquipe1,
      jogosEquipe2
    );

    // Atualizar contador de partidas finalizadas
    await this.confrontoRepository.atualizar(confronto.id, {
      partidasFinalizadas,
      totalPartidas: partidasConfronto.length,
    });

    // Verificar se precisa de decider (TEAMS_4 com empate 1-1)
    const partidaAtualizada = await this.partidaRepository.buscarPorId(partidaId);
    const confrontoAtualizado = await this.confrontoRepository.buscarPorId(
      confronto.id
    );

    const precisaDecider = await this.verificarPrecisaDecider(
      confrontoAtualizado!,
      partidasConfronto
    );

    // Verificar se confronto está finalizado
    const confrontoFinalizado = await this.verificarConfrontoFinalizado(
      confrontoAtualizado!,
      partidasConfronto
    );

    if (confrontoFinalizado) {
      await this.finalizarConfronto(confrontoAtualizado!);
    }

    return {
      partida: partidaAtualizada!,
      confronto: (await this.confrontoRepository.buscarPorId(confronto.id))!,
      precisaDecider,
      confrontoFinalizado,
    };
  }

  /**
   * Gera partida de decider quando empate 1-1 em TEAMS_4
   */
  async gerarDecider(
    confronto: ConfrontoEquipe,
    etapa: Etapa
  ): Promise<PartidaTeams> {
    const variante = etapa.varianteTeams!;

    if (variante !== VarianteTeams.TEAMS_4) {
      throw new ValidationError("Decider só é permitido para TEAMS_4");
    }

    const existeDecider = await this.partidaRepository.existeDecider(
      confronto.id
    );
    if (existeDecider) {
      throw new ValidationError("Decider já existe para este confronto");
    }

    const equipe1 = await this.equipeRepository.buscarPorId(confronto.equipe1Id);
    const equipe2 = await this.equipeRepository.buscarPorId(confronto.equipe2Id);

    if (!equipe1 || !equipe2) {
      throw new NotFoundError("Equipe não encontrada");
    }

    // Para TEAMS_4 misto: F+M vs F+M
    // Etapa é mista se: isMisto é true, OU genero é MISTO
    const isMisto = etapa.isMisto || etapa.genero === GeneroJogador.MISTO;

    let dupla1Jogadores: JogadorEquipe[];
    let dupla2Jogadores: JogadorEquipe[];

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

    const partidaDTO = this.criarPartidaDTO(
      confronto,
      etapa,
      3, // ordem 3 para decider
      TipoJogoTeams.DECIDER,
      dupla1Jogadores,
      dupla2Jogadores,
      equipe1,
      equipe2
    );

    const partida = await this.partidaRepository.criar(partidaDTO);
    await this.confrontoRepository.adicionarPartida(confronto.id, partida.id);
    await this.confrontoRepository.marcarTemDecider(confronto.id, true);

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

    // Atualizar posições
    for (let i = 0; i < equipesOrdenadas.length; i++) {
      await this.equipeRepository.atualizarPosicao(
        equipesOrdenadas[i].id,
        i + 1
      );
    }

    return this.equipeRepository.buscarPorEtapaOrdenadas(etapaId, arenaId);
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
    const confrontos = await this.confrontoRepository.buscarPorEtapa(etapaId, arenaId);
    for (const confronto of confrontos) {
      await this.confrontoRepository.resetarConfronto(confronto.id);
    }

    // Resetar estatísticas das equipes e recriar estatísticas dos jogadores
    const equipes = await this.equipeRepository.buscarPorEtapa(etapaId, arenaId);
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
    // Deletar partidas
    await this.partidaRepository.deletarPorEtapa(etapaId, arenaId);
    // Deletar confrontos
    await this.confrontoRepository.deletarPorEtapa(etapaId, arenaId);
    // Deletar equipes
    await this.equipeRepository.deletarPorEtapa(etapaId, arenaId);

    // Deletar estatísticas de jogadores desta etapa
    const { estatisticasJogadorRepository } = await import(
      "../repositories/firebase/EstatisticasJogadorRepository"
    );
    await estatisticasJogadorRepository.deletarPorEtapa(etapaId, arenaId);

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

  private validarDistribuicaoGenero(
    inscricoes: Inscricao[],
    variante: VarianteTeams
  ): void {
    const femininas = inscricoes.filter(
      (i) => i.genero === GeneroJogador.FEMININO
    ).length;
    const masculinos = inscricoes.filter(
      (i) => i.genero === GeneroJogador.MASCULINO
    ).length;

    const numEquipes = inscricoes.length / variante;
    const femininasPorEquipe = variante === VarianteTeams.TEAMS_4 ? 2 : 3;
    const masculinosPorEquipe = variante === VarianteTeams.TEAMS_4 ? 2 : 3;

    const femininasNecessarias = numEquipes * femininasPorEquipe;
    const masculinosNecessarios = numEquipes * masculinosPorEquipe;

    if (femininas !== femininasNecessarias) {
      throw new ValidationError(
        `Necessário exatamente ${femininasNecessarias} jogadoras femininas (tem ${femininas})`
      );
    }
    if (masculinos !== masculinosNecessarios) {
      throw new ValidationError(
        `Necessário exatamente ${masculinosNecessarios} jogadores masculinos (tem ${masculinos})`
      );
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
        // Encontrar equipe que ainda precisa de jogadores
        while (equipes[equipeIndex].length >= jogadoresPorEquipe) {
          equipeIndex = (equipeIndex + 1) % equipes.length;
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
    dupla2Jogadores: JogadorEquipe[],
    equipe1: Equipe,
    equipe2: Equipe
  ): CriarPartidaTeamsDTO {
    return {
      etapaId: etapa.id,
      arenaId: etapa.arenaId,
      confrontoId: confronto.id,
      ordem,
      tipoJogo,
      dupla1: {
        jogador1Id: dupla1Jogadores[0].id,
        jogador1Nome: dupla1Jogadores[0].nome,
        jogador2Id: dupla1Jogadores[1].id,
        jogador2Nome: dupla1Jogadores[1].nome,
        equipeId: equipe1.id,
        equipeNome: equipe1.nome,
      },
      dupla2: {
        jogador1Id: dupla2Jogadores[0].id,
        jogador1Nome: dupla2Jogadores[0].nome,
        jogador2Id: dupla2Jogadores[1].id,
        jogador2Nome: dupla2Jogadores[1].nome,
        equipeId: equipe2.id,
        equipeNome: equipe2.nome,
      },
    };
  }

  private calcularResultadoPartida(
    placar: SetPlacarTeams[],
    partida: PartidaTeams
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

    const vencedoraEquipeId =
      setsDupla1 > setsDupla2
        ? partida.dupla1.equipeId
        : partida.dupla2.equipeId;
    const vencedoraEquipeNome =
      setsDupla1 > setsDupla2
        ? partida.dupla1.equipeNome
        : partida.dupla2.equipeNome;

    return { setsDupla1, setsDupla2, vencedoraEquipeId, vencedoraEquipeNome };
  }

  private async atualizarEstatisticasJogadores(
    partida: PartidaTeams,
    placar: SetPlacarTeams[],
    vencedoraEquipeId: string
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

    const dupla1Venceu = vencedoraEquipeId === partida.dupla1.equipeId;

    // Atualizar jogadores da dupla 1
    for (const jogadorId of [
      partida.dupla1.jogador1Id,
      partida.dupla1.jogador2Id,
    ]) {
      await this.estatisticasService.atualizarAposPartida(
        jogadorId,
        partida.etapaId,
        {
          venceu: dupla1Venceu,
          setsVencidos: placar.filter((s) => s.gamesDupla1 > s.gamesDupla2)
            .length,
          setsPerdidos: placar.filter((s) => s.gamesDupla2 > s.gamesDupla1)
            .length,
          gamesVencidos: gamesVencidosDupla1,
          gamesPerdidos: gamesPerdidosDupla1,
        }
      );
    }

    // Atualizar jogadores da dupla 2
    for (const jogadorId of [
      partida.dupla2.jogador1Id,
      partida.dupla2.jogador2Id,
    ]) {
      await this.estatisticasService.atualizarAposPartida(
        jogadorId,
        partida.etapaId,
        {
          venceu: !dupla1Venceu,
          setsVencidos: placar.filter((s) => s.gamesDupla2 > s.gamesDupla1)
            .length,
          setsPerdidos: placar.filter((s) => s.gamesDupla1 > s.gamesDupla2)
            .length,
          gamesVencidos: gamesVencidosDupla2,
          gamesPerdidos: gamesPerdidosDupla2,
        }
      );
    }

    // Atualizar estatísticas das equipes
    const equipe1Id = partida.dupla1.equipeId;
    const equipe2Id = partida.dupla2.equipeId;

    await this.equipeRepository.incrementarEstatisticas(equipe1Id, {
      jogosVencidos: dupla1Venceu ? 1 : 0,
      jogosPerdidos: dupla1Venceu ? 0 : 1,
      gamesVencidos: gamesVencidosDupla1,
      gamesPerdidos: gamesPerdidosDupla1,
    });

    await this.equipeRepository.incrementarEstatisticas(equipe2Id, {
      jogosVencidos: dupla1Venceu ? 0 : 1,
      jogosPerdidos: dupla1Venceu ? 1 : 0,
      gamesVencidos: gamesVencidosDupla2,
      gamesPerdidos: gamesPerdidosDupla2,
    });

    // Recalcular saldos
    const equipe1 = await this.equipeRepository.buscarPorId(equipe1Id);
    const equipe2 = await this.equipeRepository.buscarPorId(equipe2Id);

    if (equipe1) {
      await this.equipeRepository.atualizar(equipe1Id, {
        saldoJogos: equipe1.jogosVencidos - equipe1.jogosPerdidos,
        saldoGames: equipe1.gamesVencidos - equipe1.gamesPerdidos,
      });
    }

    if (equipe2) {
      await this.equipeRepository.atualizar(equipe2Id, {
        saldoJogos: equipe2.jogosVencidos - equipe2.jogosPerdidos,
        saldoGames: equipe2.gamesVencidos - equipe2.gamesPerdidos,
      });
    }
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
    if (
      confronto.totalPartidas === 3 &&
      finalizadas.length === 3
    ) {
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

    await this.confrontoRepository.registrarResultado(
      confronto.id,
      confronto.jogosEquipe1,
      confronto.jogosEquipe2,
      vencedoraId,
      vencedoraNome
    );

    // Atualizar estatísticas de confrontos das equipes (apenas para fase de grupos)
    if (confronto.fase === FaseEtapa.GRUPOS) {
      await this.equipeRepository.incrementarEstatisticas(vencedoraId, {
        confrontos: 1,
        vitorias: 1,
        pontos: 3,
      });

      await this.equipeRepository.incrementarEstatisticas(perdedoraId, {
        confrontos: 1,
        derrotas: 1,
      });

      // Recalcular classificação
      await this.recalcularClassificacao(confronto.etapaId, confronto.arenaId);

      // Verificar se fase de grupos terminou para preencher semifinais
      await this.verificarEPreencherFaseEliminatoria(
        confronto.etapaId,
        confronto.arenaId
      );
    } else if (confronto.fase === FaseEtapa.SEMIFINAL) {
      // Se semifinal terminou, preencher a final
      await this.preencherProximoConfronto(confronto, vencedoraId, vencedoraNome);
    }
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

    logger.info("Fase de grupos finalizada, preenchendo fase eliminatória", { etapaId });

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
      logger.warn(`Fase eliminatória suporta 2-8 grupos. Recebido: ${numGrupos}`);
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
    const confrontosEliminatoria = await this.confrontoRepository.buscarPorEtapa(
      etapaId,
      arenaId
    );

    // Filtrar apenas os confrontos eliminatórios (não grupos)
    const confrontosParaPreencher = confrontosEliminatoria.filter(
      (c) => c.fase !== FaseEtapa.GRUPOS
    );

    // Preencher cada confronto baseado na origem
    for (const confronto of confrontosParaPreencher) {
      // Pular se já tem equipes definidas
      if (confronto.equipe1Id && confronto.equipe2Id && confronto.equipe2Id !== "BYE") {
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
                { ...confronto, equipe1Id: equipe.id, equipe1Nome: equipe.nome } as ConfrontoEquipe,
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
