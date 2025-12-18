/**
 * TeamsEquipeService - Responsabilidade: Formação e gerenciamento de equipes
 *
 * Seguindo SRP (Single Responsibility Principle):
 * - Geração automática de equipes
 * - Formação manual de equipes
 * - Distribuição balanceada/aleatória de jogadores
 * - Atribuição de grupos
 */

import {
  Equipe,
  JogadorEquipe,
  CriarEquipeDTO,
  FormacaoManualEquipeDTO,
  TipoFormacaoEquipe,
  VarianteTeams,
} from "../../models/Teams";
import { Etapa, StatusEtapa, FormatoEtapa } from "../../models/Etapa";
import { NivelJogador, GeneroJogador } from "../../models/Jogador";
import { IEquipeRepository } from "../../repositories/interfaces/IEquipeRepository";
import EquipeRepository from "../../repositories/firebase/EquipeRepository";
import { EstatisticasJogadorService } from "../EstatisticasJogadorService";
import { ValidationError, NotFoundError } from "../../utils/errors";
import {
  calcularDistribuicaoGrupos,
  LETRAS_GRUPOS,
} from "../../utils/torneioUtils";
import logger from "../../utils/logger";

interface Inscricao {
  jogadorId: string;
  jogadorNome: string;
  nivel: NivelJogador;
  genero: GeneroJogador;
}

export interface ITeamsEquipeService {
  gerarEquipes(
    etapa: Etapa,
    inscricoes: Inscricao[]
  ): Promise<{
    equipes: Equipe[];
    estatisticas: any[];
    temFaseGrupos: boolean;
  }>;

  formarEquipesManualmente(
    etapa: Etapa,
    inscricoes: Inscricao[],
    formacoes: FormacaoManualEquipeDTO[]
  ): Promise<{
    equipes: Equipe[];
    estatisticas: any[];
    temFaseGrupos: boolean;
  }>;

  buscarEquipes(etapaId: string, arenaId: string): Promise<Equipe[]>;

  renomearEquipe(
    equipeId: string,
    novoNome: string,
    arenaId: string
  ): Promise<void>;
}

export class TeamsEquipeService implements ITeamsEquipeService {
  constructor(
    private equipeRepository: IEquipeRepository = EquipeRepository,
    private estatisticasService: EstatisticasJogadorService = new EstatisticasJogadorService()
  ) {}

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
    this.validarEtapaParaGeracaoEquipes(etapa);

    const variante = etapa.varianteTeams!;
    const tipoFormacao = etapa.tipoFormacaoEquipe!;
    const isMisto = etapa.isMisto || etapa.genero === GeneroJogador.MISTO;
    const numEquipes = inscricoes.length / variante;

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

    // Preparar DTOs de equipes
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

    // Criar equipes no banco
    const equipes = await this.equipeRepository.criarEmLote(equipeDTOs);

    // Criar estatísticas individuais para cada jogador EM LOTE
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

      if (grupos) {
        const grupoInfo = this.atribuirGrupo(index, grupos);
        dto.grupoId = grupoInfo.grupoId;
        dto.grupoNome = grupoInfo.grupoNome;
      }

      return dto;
    });

    const equipes = await this.equipeRepository.criarEmLote(equipeDTOs);

    // Criar estatísticas
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

  /**
   * Busca equipes de uma etapa
   */
  async buscarEquipes(etapaId: string, arenaId: string): Promise<Equipe[]> {
    return this.equipeRepository.buscarPorEtapaOrdenadas(etapaId, arenaId);
  }

  /**
   * Renomear uma equipe
   */
  async renomearEquipe(
    equipeId: string,
    novoNome: string,
    arenaId: string
  ): Promise<void> {
    const equipe = await this.equipeRepository.buscarPorId(equipeId);
    if (!equipe) {
      throw new NotFoundError("Equipe não encontrada");
    }

    if (equipe.arenaId !== arenaId) {
      throw new ValidationError(
        "Você não tem permissão para editar esta equipe"
      );
    }

    if (!novoNome || novoNome.trim().length === 0) {
      throw new ValidationError("Nome da equipe não pode ser vazio");
    }

    if (novoNome.trim().length > 100) {
      throw new ValidationError(
        "Nome da equipe não pode ter mais de 100 caracteres"
      );
    }

    await this.equipeRepository.atualizarEmLote([
      { id: equipeId, dados: { nome: novoNome.trim() } },
    ]);

    logger.info("Equipe renomeada", {
      equipeId,
      nomeAntigo: equipe.nome,
      nomeNovo: novoNome.trim(),
    });
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
      const femininas = inscricoes.filter(
        (i) => i.genero === GeneroJogador.FEMININO
      );
      const masculinos = inscricoes.filter(
        (i) => i.genero === GeneroJogador.MASCULINO
      );

      this.distribuirPorNivel(femininas, equipes, variante / 2);
      this.distribuirPorNivel(masculinos, equipes, variante / 2);
    } else {
      this.distribuirPorNivel(inscricoes, equipes, variante);
    }

    return equipes;
  }

  private distribuirPorNivel(
    inscricoes: Inscricao[],
    equipes: JogadorEquipe[][],
    jogadoresPorEquipe: number
  ): void {
    const porNivel: Record<string, Inscricao[]> = {
      [NivelJogador.AVANCADO]: [],
      [NivelJogador.INTERMEDIARIO]: [],
      [NivelJogador.INICIANTE]: [],
    };

    for (const inscricao of inscricoes) {
      porNivel[inscricao.nivel].push(inscricao);
    }

    for (const nivel of Object.keys(porNivel)) {
      porNivel[nivel] = this.shuffle(porNivel[nivel]);
    }

    let equipeIndex = 0;
    const niveis = [
      NivelJogador.AVANCADO,
      NivelJogador.INTERMEDIARIO,
      NivelJogador.INICIANTE,
    ];

    for (const nivel of niveis) {
      for (const inscricao of porNivel[nivel]) {
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

  private calcularGrupos(numEquipes: number): number[] {
    if (numEquipes < 6) return [];
    return calcularDistribuicaoGrupos(numEquipes);
  }

  private atribuirGrupo(
    index: number,
    grupos: number[]
  ): { grupoId: string; grupoNome: string } {
    const numGrupos = grupos.length;

    const round = Math.floor(index / numGrupos);
    const posicaoNoRound = index % numGrupos;

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

  private shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}

export default new TeamsEquipeService();
