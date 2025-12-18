/**
 * Service especializado para fase eliminatória
 *
 * FORMATO COPA DO MUNDO:
 * - Pareamentos FIXOS por ordem de grupo (não por desempenho)
 * - BYEs distribuídos por ordem: 1A, 1B, 1C, 1D... 2A, 2B...
 * - Duplas do mesmo grupo só se encontram na FINAL
 *
 * Suporta: 2, 3, 4, 5, 6, 7 e 8 grupos
 */

import { Dupla } from "../models/Dupla";
import { Grupo } from "../models/Grupo";
import { StatusPartida } from "../models/Partida";
import { FaseEtapa } from "../models/Etapa";
import {
  ConfrontoEliminatorio,
  TipoFase,
  StatusConfrontoEliminatorio,
} from "../models/Eliminatoria";
import { IConfrontoEliminatorioRepository } from "../repositories/interfaces/IConfrontoEliminatorioRepository";
import { IDuplaRepository } from "../repositories/interfaces/IDuplaRepository";
import { IGrupoRepository } from "../repositories/interfaces/IGrupoRepository";
import { IPartidaRepository } from "../repositories/interfaces/IPartidaRepository";
import { confrontoEliminatorioRepository } from "../repositories/firebase/ConfrontoEliminatorioRepository";
import { duplaRepository } from "../repositories/firebase/DuplaRepository";
import { grupoRepository } from "../repositories/firebase/GrupoRepository";
import { partidaRepository } from "../repositories/firebase/PartidaRepository";
import estatisticasJogadorService from "./EstatisticasJogadorService";
import { obterProximaFase } from "../utils/torneioUtils";
import logger from "../utils/logger";

/**
 * Mapeamento TipoFase -> FaseEtapa
 */
const mapTipoFaseToFaseEtapa: Record<TipoFase, FaseEtapa> = {
  [TipoFase.OITAVAS]: FaseEtapa.OITAVAS,
  [TipoFase.QUARTAS]: FaseEtapa.QUARTAS,
  [TipoFase.SEMIFINAL]: FaseEtapa.SEMIFINAL,
  [TipoFase.FINAL]: FaseEtapa.FINAL,
};

/**
 * Tipo para representar uma posição no bracket
 * Exemplo: "1A" = 1º lugar do grupo A, "2B" = 2º lugar do grupo B
 */
type PosicaoBracket = string;

/**
 * Estrutura de pareamento pré-definido
 */
interface PareamentoPredefinido {
  pos1: PosicaoBracket; // Ex: "1A"
  pos2: PosicaoBracket | "BYE"; // Ex: "2B" ou "BYE"
}

/**
 * Mapeamento de quais confrontos alimentam a próxima fase
 * Exemplo: [1, 5] significa V(O1) x V(O5) na próxima fase
 */
interface MapeamentoProximaFase {
  fase: TipoFase;
  pareamentos: [number, number][]; // [ordem1, ordem2]
}

/**
 * Configuração do bracket para cada quantidade de grupos
 */
interface ConfiguracaoBracket {
  fase: TipoFase;
  pareamentos: PareamentoPredefinido[];
  proximasFases?: MapeamentoProximaFase[];
}

/**
 * BRACKETS PRÉ-DEFINIDOS POR QUANTIDADE DE GRUPOS
 *
 * Regras:
 * - Pareamento cruzado: 1º de um grupo vs 2º de outro
 * - BYEs por ordem de grupo: 1A, 1B, 1C, 1D, 1E... 2A, 2B...
 * - Estrutura garante que mesmos grupos só se encontram na final
 */
const BRACKETS_PREDEFINIDOS: Record<number, ConfiguracaoBracket> = {
  // =====================================================
  // 2 Grupos: Semifinal direto (0 BYEs)
  // S1: 1A x 2B
  // S2: 1B x 2A
  // =====================================================
  2: {
    fase: TipoFase.SEMIFINAL,
    pareamentos: [
      { pos1: "1A", pos2: "2B" },
      { pos1: "1B", pos2: "2A" },
    ],
  },

  // =====================================================
  // 3 Grupos: Quartas com 2 BYEs (1A, 1B)
  // Q1: 1A ── BYE
  // Q2: 1C x 2B
  // Q3: 1B ── BYE
  // Q4: 2A x 2C
  // =====================================================
  3: {
    fase: TipoFase.QUARTAS,
    pareamentos: [
      { pos1: "1A", pos2: "BYE" },
      { pos1: "1C", pos2: "2B" },
      { pos1: "1B", pos2: "BYE" },
      { pos1: "2A", pos2: "2C" },
    ],
  },

  // =====================================================
  // 4 Grupos: Quartas sem BYEs
  // Q1: 1A x 2B  ─┐
  //               ├─ S1
  // Q2: 1C x 2D  ─┘
  // Q3: 1B x 2A  ─┐
  //               ├─ S2
  // Q4: 1D x 2C  ─┘
  // =====================================================
  4: {
    fase: TipoFase.QUARTAS,
    pareamentos: [
      { pos1: "1A", pos2: "2B" },
      { pos1: "1C", pos2: "2D" },
      { pos1: "1B", pos2: "2A" },
      { pos1: "1D", pos2: "2C" },
    ],
  },

  // =====================================================
  // 5 Grupos: Oitavas com 6 BYEs (1A, 1B, 1C, 1D, 1E, 2A)
  //
  // OITAVAS:
  // O1: 1A ── BYE
  // O2: 1D ── BYE
  // O3: 1B ── BYE
  // O4: 1E ── BYE
  // O5: 1C ── BYE
  // O6: 2A ── BYE
  // O7: 2B x 2C
  // O8: 2D x 2E
  //
  // QUARTAS:
  // Q1: V(O1) x V(O7) = 1A x V(2B x 2C)
  // Q2: V(O4) x V(O2) = 1E x 1D
  // Q3: V(O3) x V(O8) = 1B x V(2D x 2E)
  // Q4: V(O5) x V(O6) = 1C x 2A
  // =====================================================
  5: {
    fase: TipoFase.OITAVAS,
    pareamentos: [
      { pos1: "1A", pos2: "BYE" },
      { pos1: "1D", pos2: "BYE" },
      { pos1: "1B", pos2: "BYE" },
      { pos1: "1E", pos2: "BYE" },
      { pos1: "1C", pos2: "BYE" },
      { pos1: "2A", pos2: "BYE" },
      { pos1: "2B", pos2: "2C" },
      { pos1: "2D", pos2: "2E" },
    ],
    proximasFases: [
      {
        fase: TipoFase.QUARTAS,
        pareamentos: [
          [1, 7],
          [4, 2],
          [3, 8],
          [5, 6],
        ],
      },
    ],
  },

  // =====================================================
  // 6 Grupos: Oitavas com 4 BYEs (1A, 1B, 1C, 1D)
  //
  // OITAVAS:
  // O1: 1A ── BYE
  // O2: 1C ── BYE
  // O3: 1B ── BYE
  // O4: 1D ── BYE
  // O5: 2B x 2C
  // O6: 2D x 2A
  // O7: 1E x 2F
  // O8: 1F x 2E
  //
  // QUARTAS:
  // Q1: V(O1) x V(O5) = 1A x V(2B x 2C)
  // Q2: V(O4) x V(O7) = 1D x V(1E x 2F)
  // Q3: V(O3) x V(O6) = 1B x V(2D x 2A)
  // Q4: V(O2) x V(O8) = 1C x V(1F x 2E)
  // =====================================================
  6: {
    fase: TipoFase.OITAVAS,
    pareamentos: [
      { pos1: "1A", pos2: "BYE" },
      { pos1: "1C", pos2: "BYE" },
      { pos1: "1B", pos2: "BYE" },
      { pos1: "1D", pos2: "BYE" },
      { pos1: "2B", pos2: "2C" },
      { pos1: "2D", pos2: "2A" },
      { pos1: "1E", pos2: "2F" },
      { pos1: "1F", pos2: "2E" },
    ],
    proximasFases: [
      {
        fase: TipoFase.QUARTAS,
        pareamentos: [
          [1, 5],
          [4, 7],
          [3, 6],
          [2, 8],
        ],
      },
    ],
  },

  // =====================================================
  // 7 Grupos: Oitavas com 2 BYEs (1A, 1B)
  // =====================================================
  7: {
    fase: TipoFase.OITAVAS,
    pareamentos: [
      { pos1: "1A", pos2: "BYE" },
      { pos1: "1E", pos2: "2F" },
      { pos1: "1C", pos2: "2D" },
      { pos1: "1G", pos2: "2B" },
      { pos1: "1B", pos2: "BYE" },
      { pos1: "1F", pos2: "2E" },
      { pos1: "1D", pos2: "2C" },
      { pos1: "2A", pos2: "2G" },
    ],
  },

  // =====================================================
  // 8 Grupos: Oitavas sem BYEs
  //
  // O1: 1A x 2B  ─┐
  //               ├─ Q1 ─┐
  // O2: 1C x 2D  ─┘      ├─ S1 ─┐
  //                      │      │
  // O3: 1E x 2F  ─┐      │      │
  //               ├─ Q2 ─┘      │
  // O4: 1G x 2H  ─┘             ├─ FINAL
  //                             │
  // O5: 1B x 2A  ─┐             │
  //               ├─ Q3 ─┐      │
  // O6: 1D x 2C  ─┘      ├─ S2 ─┘
  //                      │
  // O7: 1F x 2E  ─┐      │
  //               ├─ Q4 ─┘
  // O8: 1H x 2G  ─┘
  // =====================================================
  8: {
    fase: TipoFase.OITAVAS,
    pareamentos: [
      { pos1: "1A", pos2: "2B" },
      { pos1: "1C", pos2: "2D" },
      { pos1: "1E", pos2: "2F" },
      { pos1: "1G", pos2: "2H" },
      { pos1: "1B", pos2: "2A" },
      { pos1: "1D", pos2: "2C" },
      { pos1: "1F", pos2: "2E" },
      { pos1: "1H", pos2: "2G" },
    ],
  },
};

/**
 * Interface para injeção de dependência
 */
export interface IEliminatoriaService {
  gerarFaseEliminatoria(
    etapaId: string,
    arenaId: string,
    classificadosPorGrupo?: number
  ): Promise<{ confrontos: ConfrontoEliminatorio[] }>;

  registrarResultado(
    confrontoId: string,
    arenaId: string,
    placar: { numero: number; gamesDupla1: number; gamesDupla2: number }[]
  ): Promise<void>;

  buscarConfrontos(
    etapaId: string,
    arenaId: string,
    fase?: TipoFase
  ): Promise<ConfrontoEliminatorio[]>;

  cancelarFaseEliminatoria(etapaId: string, arenaId: string): Promise<void>;
}

/**
 * Estrutura de um classificado para o bracket
 */
interface ClassificadoBracket {
  dupla: Dupla;
  grupoLetra: string; // A, B, C, D...
  grupoNome: string;
  posicaoGrupo: number; // 1 ou 2
  chave: string; // "1A", "2B", etc.
}

/**
 * Service para fase eliminatória
 *
 * FORMATO COPA DO MUNDO com brackets pré-definidos
 */
export class EliminatoriaService implements IEliminatoriaService {
  constructor(
    private confrontoRepo: IConfrontoEliminatorioRepository = confrontoEliminatorioRepository,
    private duplaRepo: IDuplaRepository = duplaRepository,
    private grupoRepo: IGrupoRepository = grupoRepository,
    private partidaRepo: IPartidaRepository = partidaRepository
  ) {}

  /**
   * Gerar fase eliminatória no formato Copa do Mundo
   */
  async gerarFaseEliminatoria(
    etapaId: string,
    arenaId: string,
    classificadosPorGrupo: number = 2
  ): Promise<{ confrontos: ConfrontoEliminatorio[] }> {
    try {
      // Buscar grupos ordenados
      const grupos = await this.grupoRepo.buscarPorEtapaOrdenado(
        etapaId,
        arenaId
      );

      if (grupos.length === 0) {
        throw new Error("Nenhum grupo encontrado");
      }

      // Verificar se todos grupos estão completos
      const gruposIncompletos = grupos.filter((g) => !g.completo);
      if (gruposIncompletos.length > 0) {
        const nomesGrupos = gruposIncompletos.map((g) => g.nome).join(", ");
        throw new Error(
          `Não é possível gerar a fase eliminatória. ` +
            `Os seguintes grupos ainda possuem partidas pendentes: ${nomesGrupos}. ` +
            `Por favor, finalize todas as partidas da fase de grupos antes de gerar a eliminatória.`
        );
      }

      if (grupos.length === 1) {
        throw new Error(
          "Não é possível gerar fase eliminatória com apenas 1 grupo. " +
            "Grupo único é um campeonato completo onde todos jogam contra todos. " +
            "O 1º colocado já é o campeão!"
        );
      }

      const numGrupos = grupos.length;

      // Validar número de grupos suportado
      if (numGrupos > 8) {
        throw new Error(
          `Número máximo de grupos suportado é 8. Você tem ${numGrupos} grupos.`
        );
      }

      // Buscar configuração do bracket
      const configBracket = BRACKETS_PREDEFINIDOS[numGrupos];
      if (!configBracket) {
        throw new Error(
          `Configuração de bracket não encontrada para ${numGrupos} grupos.`
        );
      }

      // Coletar classificados de cada grupo
      const classificados = await this.coletarClassificados(
        grupos,
        classificadosPorGrupo
      );

      if (classificados.length < 2) {
        throw new Error("Mínimo de 2 classificados necessário");
      }

      // Criar mapa de classificados por chave ("1A", "2B", etc.)
      const mapaClassificados = new Map<string, ClassificadoBracket>();
      for (const c of classificados) {
        mapaClassificados.set(c.chave, c);
      }

      // Criar confrontos com base no bracket pré-definido
      const confrontos = await this.criarConfrontosPredefinidos(
        etapaId,
        arenaId,
        configBracket,
        mapaClassificados
      );

      // Marcar duplas como classificadas
      await Promise.all(
        classificados.map((c) =>
          this.duplaRepo.marcarClassificada(c.dupla.id, true)
        )
      );

      // Marcar jogadores em lote
      const jogadoresParaMarcar = classificados.flatMap((c) => [
        { jogadorId: c.dupla.jogador1Id, etapaId },
        { jogadorId: c.dupla.jogador2Id, etapaId },
      ]);
      await estatisticasJogadorService.marcarComoClassificadoEmLote(
        jogadoresParaMarcar,
        true
      );

      const byes = configBracket.pareamentos.filter(
        (p) => p.pos2 === "BYE"
      ).length;

      logger.info("Fase eliminatória gerada (formato Copa do Mundo)", {
        etapaId,
        arenaId,
        totalGrupos: grupos.length,
        classificadosPorGrupo,
        totalClassificados: classificados.length,
        fase: configBracket.fase,
        byes,
        totalConfrontos: confrontos.length,
      });

      return { confrontos };
    } catch (error: any) {
      logger.error(
        "Erro ao gerar fase eliminatória",
        { etapaId, arenaId },
        error
      );
      throw error;
    }
  }

  /**
   * Coletar classificados de todos os grupos
   */
  private async coletarClassificados(
    grupos: Grupo[],
    classificadosPorGrupo: number
  ): Promise<ClassificadoBracket[]> {
    const classificados: ClassificadoBracket[] = [];
    const letras = "ABCDEFGH";

    for (let i = 0; i < grupos.length; i++) {
      const grupo = grupos[i];
      const letra = letras[i];

      const duplasGrupo = await this.duplaRepo.buscarClassificadasPorGrupo(
        grupo.id,
        classificadosPorGrupo
      );

      for (const dupla of duplasGrupo) {
        const posicao = dupla.posicaoGrupo || 1;
        classificados.push({
          dupla,
          grupoLetra: letra,
          grupoNome: grupo.nome,
          posicaoGrupo: posicao,
          chave: `${posicao}${letra}`, // "1A", "2B", etc.
        });
      }
    }

    return classificados;
  }

  /**
   * Criar confrontos com base no bracket pré-definido
   */
  private async criarConfrontosPredefinidos(
    etapaId: string,
    arenaId: string,
    config: ConfiguracaoBracket,
    mapaClassificados: Map<string, ClassificadoBracket>
  ): Promise<ConfrontoEliminatorio[]> {
    // FASE 1: Coletar dados de todos os confrontos a criar
    type ConfrontoParaCriar = {
      tipo: "bye" | "jogo";
      ordem: number;
      classificado1: ClassificadoBracket;
      classificado2?: ClassificadoBracket;
    };

    const confrontosParaCriar: ConfrontoParaCriar[] = [];

    for (let i = 0; i < config.pareamentos.length; i++) {
      const pareamento = config.pareamentos[i];
      const ordem = i + 1;

      const classificado1 = mapaClassificados.get(pareamento.pos1);

      if (!classificado1) {
        logger.warn(`Classificado não encontrado: ${pareamento.pos1}`);
        continue;
      }

      if (pareamento.pos2 === "BYE") {
        confrontosParaCriar.push({
          tipo: "bye",
          ordem,
          classificado1,
        });
      } else {
        const classificado2 = mapaClassificados.get(pareamento.pos2);

        if (!classificado2) {
          logger.warn(`Classificado não encontrado: ${pareamento.pos2}`);
          continue;
        }

        confrontosParaCriar.push({
          tipo: "jogo",
          ordem,
          classificado1,
          classificado2,
        });
      }
    }

    // FASE 2: Criar todos os confrontos em paralelo
    const confrontosCriados = await Promise.all(
      confrontosParaCriar.map((c) => {
        if (c.tipo === "bye") {
          return this.confrontoRepo.criar({
            etapaId,
            arenaId,
            fase: config.fase,
            ordem: c.ordem,
            dupla1Id: c.classificado1.dupla.id,
            dupla1Nome: `${c.classificado1.dupla.jogador1Nome} & ${c.classificado1.dupla.jogador2Nome}`,
            dupla1Origem: `${c.classificado1.posicaoGrupo}º ${c.classificado1.grupoNome}`,
            status: StatusConfrontoEliminatorio.BYE,
          });
        } else {
          return this.confrontoRepo.criar({
            etapaId,
            arenaId,
            fase: config.fase,
            ordem: c.ordem,
            dupla1Id: c.classificado1.dupla.id,
            dupla1Nome: `${c.classificado1.dupla.jogador1Nome} & ${c.classificado1.dupla.jogador2Nome}`,
            dupla1Origem: `${c.classificado1.posicaoGrupo}º ${c.classificado1.grupoNome}`,
            dupla2Id: c.classificado2!.dupla.id,
            dupla2Nome: `${c.classificado2!.dupla.jogador1Nome} & ${
              c.classificado2!.dupla.jogador2Nome
            }`,
            dupla2Origem: `${c.classificado2!.posicaoGrupo}º ${
              c.classificado2!.grupoNome
            }`,
            status: StatusConfrontoEliminatorio.AGENDADA,
          });
        }
      })
    );

    // FASE 3: Registrar resultados dos BYEs em paralelo
    const byePromises: Promise<ConfrontoEliminatorio>[] = [];
    const confrontosFinais: ConfrontoEliminatorio[] = [];

    for (let i = 0; i < confrontosParaCriar.length; i++) {
      const config = confrontosParaCriar[i];
      const confronto = confrontosCriados[i];

      if (config.tipo === "bye") {
        byePromises.push(
          this.confrontoRepo.registrarResultado(confronto.id, {
            status: StatusConfrontoEliminatorio.BYE,
            vencedoraId: config.classificado1.dupla.id,
            vencedoraNome: `${config.classificado1.dupla.jogador1Nome} & ${config.classificado1.dupla.jogador2Nome}`,
          })
        );

        confrontosFinais.push({
          ...confronto,
          vencedoraId: config.classificado1.dupla.id,
          vencedoraNome: `${config.classificado1.dupla.jogador1Nome} & ${config.classificado1.dupla.jogador2Nome}`,
        });

        logger.debug("Confronto BYE criado", {
          ordem: config.ordem,
          dupla: `${config.classificado1.posicaoGrupo}º ${config.classificado1.grupoNome}`,
        });
      } else {
        confrontosFinais.push(confronto);

        logger.debug("Confronto criado", {
          ordem: config.ordem,
          dupla1: `${config.classificado1.posicaoGrupo}º ${config.classificado1.grupoNome}`,
          dupla2: `${config.classificado2!.posicaoGrupo}º ${
            config.classificado2!.grupoNome
          }`,
        });
      }
    }

    // Executar todos os registros de BYE em paralelo
    await Promise.all(byePromises);

    return confrontosFinais;
  }

  /**
   * Registrar resultado de confronto eliminatório
   */
  async registrarResultado(
    confrontoId: string,
    arenaId: string,
    placar: { numero: number; gamesDupla1: number; gamesDupla2: number }[]
  ): Promise<void> {
    try {
      const confronto = await this.confrontoRepo.buscarPorIdEArena(
        confrontoId,
        arenaId
      );

      if (!confronto) {
        throw new Error("Confronto não encontrado");
      }

      // Validar placar (eliminatória é melhor de 1 set)
      if (placar.length !== 1) {
        throw new Error("Placar inválido: deve ter apenas 1 set");
      }

      const set = placar[0];
      const vencedoraId =
        set.gamesDupla1 > set.gamesDupla2
          ? confronto.dupla1Id!
          : confronto.dupla2Id!;
      const vencedoraNome =
        set.gamesDupla1 > set.gamesDupla2
          ? confronto.dupla1Nome!
          : confronto.dupla2Nome!;

      // Reverter estatísticas se for edição
      if (confronto.status === StatusConfrontoEliminatorio.FINALIZADA) {
        await this.reverterEstatisticasConfronto(confronto);
      }

      // Criar ou atualizar partida
      let partidaId = confronto.partidaId;

      if (!partidaId) {
        const partida = await this.partidaRepo.criar({
          etapaId: confronto.etapaId,
          arenaId: confronto.arenaId,
          tipo: "eliminatoria",
          fase: mapTipoFaseToFaseEtapa[confronto.fase],
          dupla1Id: confronto.dupla1Id!,
          dupla1Nome: confronto.dupla1Nome!,
          dupla2Id: confronto.dupla2Id!,
          dupla2Nome: confronto.dupla2Nome!,
        });
        partidaId = partida.id;

        await this.partidaRepo.registrarResultado(partidaId, {
          status: StatusPartida.FINALIZADA,
          setsDupla1: set.gamesDupla1 > set.gamesDupla2 ? 1 : 0,
          setsDupla2: set.gamesDupla2 > set.gamesDupla1 ? 1 : 0,
          placar: [{ ...set, vencedorId: vencedoraId }],
          vencedoraId,
          vencedoraNome,
        });
      } else {
        await this.partidaRepo.atualizar(partidaId, {
          setsDupla1: set.gamesDupla1 > set.gamesDupla2 ? 1 : 0,
          setsDupla2: set.gamesDupla2 > set.gamesDupla1 ? 1 : 0,
          placar: [{ ...set, vencedorId: vencedoraId }],
          vencedoraId,
          vencedoraNome,
        });
      }

      // Atualizar estatísticas dos jogadores
      await this.atualizarEstatisticasJogadores(confronto, set, vencedoraId);

      // Atualizar confronto
      await this.confrontoRepo.registrarResultado(confrontoId, {
        partidaId,
        status: StatusConfrontoEliminatorio.FINALIZADA,
        vencedoraId,
        vencedoraNome,
        placar: `${set.gamesDupla1}-${set.gamesDupla2}`,
      });

      // Avançar vencedor para próxima fase
      await this.avancarVencedor(confronto, vencedoraId, vencedoraNome);

      logger.info("Resultado eliminatório registrado", {
        confrontoId,
        etapaId: confronto.etapaId,
        fase: confronto.fase,
        vencedoraNome,
        placar: `${set.gamesDupla1}-${set.gamesDupla2}`,
      });
    } catch (error: any) {
      logger.error(
        "Erro ao registrar resultado eliminatório",
        { confrontoId, arenaId },
        error
      );
      throw error;
    }
  }

  /**
   * Atualizar estatísticas dos jogadores
   */
  private async atualizarEstatisticasJogadores(
    confronto: ConfrontoEliminatorio,
    set: { gamesDupla1: number; gamesDupla2: number },
    vencedoraId: string
  ): Promise<void> {
    // Buscar ambas as duplas em paralelo
    const [dupla1, dupla2] = await Promise.all([
      this.duplaRepo.buscarPorId(confronto.dupla1Id!),
      this.duplaRepo.buscarPorId(confronto.dupla2Id!),
    ]);

    if (!dupla1 || !dupla2) return;

    const dupla1Venceu = vencedoraId === confronto.dupla1Id;

    // Atualizar estatísticas de todos os 4 jogadores em paralelo
    await Promise.all([
      // Jogadores da dupla 1
      estatisticasJogadorService.atualizarAposPartidaEliminatoria(
        dupla1.jogador1Id,
        confronto.etapaId,
        {
          venceu: dupla1Venceu,
          setsVencidos: dupla1Venceu ? 1 : 0,
          setsPerdidos: dupla1Venceu ? 0 : 1,
          gamesVencidos: set.gamesDupla1,
          gamesPerdidos: set.gamesDupla2,
        }
      ),
      estatisticasJogadorService.atualizarAposPartidaEliminatoria(
        dupla1.jogador2Id,
        confronto.etapaId,
        {
          venceu: dupla1Venceu,
          setsVencidos: dupla1Venceu ? 1 : 0,
          setsPerdidos: dupla1Venceu ? 0 : 1,
          gamesVencidos: set.gamesDupla1,
          gamesPerdidos: set.gamesDupla2,
        }
      ),
      // Jogadores da dupla 2
      estatisticasJogadorService.atualizarAposPartidaEliminatoria(
        dupla2.jogador1Id,
        confronto.etapaId,
        {
          venceu: !dupla1Venceu,
          setsVencidos: !dupla1Venceu ? 1 : 0,
          setsPerdidos: !dupla1Venceu ? 0 : 1,
          gamesVencidos: set.gamesDupla2,
          gamesPerdidos: set.gamesDupla1,
        }
      ),
      estatisticasJogadorService.atualizarAposPartidaEliminatoria(
        dupla2.jogador2Id,
        confronto.etapaId,
        {
          venceu: !dupla1Venceu,
          setsVencidos: !dupla1Venceu ? 1 : 0,
          setsPerdidos: !dupla1Venceu ? 0 : 1,
          gamesVencidos: set.gamesDupla2,
          gamesPerdidos: set.gamesDupla1,
        }
      ),
    ]);
  }

  /**
   * Reverter estatísticas de confronto (para edição)
   */
  private async reverterEstatisticasConfronto(
    confronto: ConfrontoEliminatorio
  ): Promise<void> {
    if (!confronto.partidaId) return;

    const partida = await this.partidaRepo.buscarPorId(confronto.partidaId);
    if (!partida || !partida.placar || partida.placar.length === 0) return;

    // Buscar ambas as duplas em paralelo
    const [dupla1, dupla2] = await Promise.all([
      this.duplaRepo.buscarPorId(confronto.dupla1Id!),
      this.duplaRepo.buscarPorId(confronto.dupla2Id!),
    ]);

    if (!dupla1 || !dupla2) return;

    const set = partida.placar[0];
    const dupla1Venceu = partida.vencedoraId === confronto.dupla1Id;

    // Reverter estatísticas de todos os 4 jogadores em paralelo
    await Promise.all([
      // Jogadores da dupla 1
      estatisticasJogadorService.reverterAposPartidaEliminatoria(
        dupla1.jogador1Id,
        confronto.etapaId,
        {
          venceu: dupla1Venceu,
          setsVencidos: dupla1Venceu ? 1 : 0,
          setsPerdidos: dupla1Venceu ? 0 : 1,
          gamesVencidos: set.gamesDupla1,
          gamesPerdidos: set.gamesDupla2,
        }
      ),
      estatisticasJogadorService.reverterAposPartidaEliminatoria(
        dupla1.jogador2Id,
        confronto.etapaId,
        {
          venceu: dupla1Venceu,
          setsVencidos: dupla1Venceu ? 1 : 0,
          setsPerdidos: dupla1Venceu ? 0 : 1,
          gamesVencidos: set.gamesDupla1,
          gamesPerdidos: set.gamesDupla2,
        }
      ),
      // Jogadores da dupla 2
      estatisticasJogadorService.reverterAposPartidaEliminatoria(
        dupla2.jogador1Id,
        confronto.etapaId,
        {
          venceu: !dupla1Venceu,
          setsVencidos: !dupla1Venceu ? 1 : 0,
          setsPerdidos: !dupla1Venceu ? 0 : 1,
          gamesVencidos: set.gamesDupla2,
          gamesPerdidos: set.gamesDupla1,
        }
      ),
      estatisticasJogadorService.reverterAposPartidaEliminatoria(
        dupla2.jogador2Id,
        confronto.etapaId,
        {
          venceu: !dupla1Venceu,
          setsVencidos: !dupla1Venceu ? 1 : 0,
          setsPerdidos: !dupla1Venceu ? 0 : 1,
          gamesVencidos: set.gamesDupla2,
          gamesPerdidos: set.gamesDupla1,
        }
      ),
    ]);
  }

  /**
   * Avançar vencedor para próxima fase
   */
  private async avancarVencedor(
    confronto: ConfrontoEliminatorio,
    _vencedoraId: string,
    _vencedoraNome: string
  ): Promise<void> {
    const proximaFase = obterProximaFase(confronto.fase);

    if (!proximaFase) {
      return; // Era a final
    }

    // Buscar todos os dados em paralelo
    const [confrontosFase, grupos, confrontosProximaFase] = await Promise.all([
      this.confrontoRepo.buscarPorFaseOrdenado(
        confronto.etapaId,
        confronto.arenaId,
        confronto.fase
      ),
      this.grupoRepo.buscarPorEtapaOrdenado(
        confronto.etapaId,
        confronto.arenaId
      ),
      this.confrontoRepo.buscarPorFase(
        confronto.etapaId,
        confronto.arenaId,
        proximaFase
      ),
    ]);

    const finalizados = confrontosFase.filter(
      (c) =>
        c.status === StatusConfrontoEliminatorio.FINALIZADA ||
        c.status === StatusConfrontoEliminatorio.BYE
    );

    if (finalizados.length === confrontosFase.length) {
      // Todos finalizados - gerar próxima fase
      const vencedores = finalizados.map((c) => ({
        id: c.vencedoraId!,
        nome: c.vencedoraNome!,
        origem: `Vencedor ${c.fase} ${c.ordem}`,
        ordem: c.ordem,
      }));

      const numGrupos = grupos.length;

      if (confrontosProximaFase.length > 0) {
        // Atualizar confrontos existentes
        await this.atualizarProximaFase(
          confronto.etapaId,
          confronto.arenaId,
          proximaFase,
          vencedores,
          numGrupos,
          confronto.fase
        );
      } else {
        // Criar novos confrontos
        await this.gerarProximaFase(
          confronto.etapaId,
          confronto.arenaId,
          proximaFase,
          vencedores,
          numGrupos,
          confronto.fase
        );
      }
    }
  }

  /**
   * Gerar confrontos da próxima fase
   *
   * IMPORTANTE: Para 5 e 6 grupos, usa mapeamentos personalizados
   * Para outros casos, pareamento sequencial (1-2, 3-4, etc.)
   */
  private async gerarProximaFase(
    etapaId: string,
    arenaId: string,
    fase: TipoFase,
    vencedores: { id: string; nome: string; origem: string; ordem: number }[],
    numGrupos: number,
    _faseAnterior: TipoFase
  ): Promise<void> {
    // Criar mapa de vencedores por ordem
    const mapaVencedores = new Map<
      number,
      { id: string; nome: string; origem: string }
    >();
    for (const v of vencedores) {
      mapaVencedores.set(v.ordem, v);
    }

    // Verificar se existe mapeamento personalizado para esta transição
    const configBracket = BRACKETS_PREDEFINIDOS[numGrupos];
    const mapeamentoPersonalizado = configBracket?.proximasFases?.find(
      (m) => m.fase === fase
    );

    let ordem = 1;

    if (mapeamentoPersonalizado) {
      // Usar mapeamento personalizado (para 5 e 6 grupos nas quartas)
      for (const [ordem1, ordem2] of mapeamentoPersonalizado.pareamentos) {
        const v1 = mapaVencedores.get(ordem1);
        const v2 = mapaVencedores.get(ordem2);

        if (v1 && v2) {
          await this.confrontoRepo.criar({
            etapaId,
            arenaId,
            fase,
            ordem: ordem++,
            dupla1Id: v1.id,
            dupla1Nome: v1.nome,
            dupla1Origem: v1.origem,
            dupla2Id: v2.id,
            dupla2Nome: v2.nome,
            dupla2Origem: v2.origem,
            status: StatusConfrontoEliminatorio.AGENDADA,
          });
        }
      }

      logger.info("Próxima fase gerada (mapeamento personalizado)", {
        etapaId,
        fase,
        numGrupos,
        totalConfrontos: ordem - 1,
      });
    } else {
      // Pareamento sequencial padrão (1-2, 3-4, 5-6, etc.)
      vencedores.sort((a, b) => a.ordem - b.ordem);

      for (let i = 0; i < vencedores.length; i += 2) {
        const v1 = vencedores[i];
        const v2 = vencedores[i + 1];

        if (v1 && v2) {
          await this.confrontoRepo.criar({
            etapaId,
            arenaId,
            fase,
            ordem: ordem++,
            dupla1Id: v1.id,
            dupla1Nome: v1.nome,
            dupla1Origem: v1.origem,
            dupla2Id: v2.id,
            dupla2Nome: v2.nome,
            dupla2Origem: v2.origem,
            status: StatusConfrontoEliminatorio.AGENDADA,
          });
        }
      }

      logger.info("Próxima fase gerada (sequencial)", {
        etapaId,
        fase,
        totalConfrontos: ordem - 1,
      });
    }
  }

  /**
   * Atualizar confrontos da próxima fase (para edições)
   */
  private async atualizarProximaFase(
    etapaId: string,
    arenaId: string,
    fase: TipoFase,
    vencedores: { id: string; nome: string; origem: string; ordem: number }[],
    numGrupos: number,
    _faseAnterior: TipoFase
  ): Promise<void> {
    const confrontos = await this.confrontoRepo.buscarPorFaseOrdenado(
      etapaId,
      arenaId,
      fase
    );

    // Criar mapa de vencedores por ordem
    const mapaVencedores = new Map<
      number,
      { id: string; nome: string; origem: string }
    >();
    for (const v of vencedores) {
      mapaVencedores.set(v.ordem, v);
    }

    // Verificar se existe mapeamento personalizado para esta transição
    const configBracket = BRACKETS_PREDEFINIDOS[numGrupos];
    const mapeamentoPersonalizado = configBracket?.proximasFases?.find(
      (m) => m.fase === fase
    );

    for (let i = 0; i < confrontos.length; i++) {
      const confronto = confrontos[i];
      let v1: { id: string; nome: string; origem: string } | undefined;
      let v2: { id: string; nome: string; origem: string } | undefined;

      if (mapeamentoPersonalizado && mapeamentoPersonalizado.pareamentos[i]) {
        // Usar mapeamento personalizado
        const [ordem1, ordem2] = mapeamentoPersonalizado.pareamentos[i];
        v1 = mapaVencedores.get(ordem1);
        v2 = mapaVencedores.get(ordem2);
      } else {
        // Pareamento sequencial
        vencedores.sort((a, b) => a.ordem - b.ordem);
        v1 = vencedores[i * 2];
        v2 = vencedores[i * 2 + 1];
      }

      if (!v1 || !v2) continue;

      const mudou =
        confronto.dupla1Id !== v1.id || confronto.dupla2Id !== v2.id;

      if (mudou) {
        // Se confronto já tinha resultado, limpar
        if (confronto.status === StatusConfrontoEliminatorio.FINALIZADA) {
          if (confronto.partidaId) {
            await this.partidaRepo.deletar(confronto.partidaId);
          }
          await this.confrontoRepo.limparResultado(confronto.id);
        }

        await this.confrontoRepo.atualizarDuplas(confronto.id, {
          dupla1Id: v1.id,
          dupla1Nome: v1.nome,
          dupla1Origem: v1.origem,
          dupla2Id: v2.id,
          dupla2Nome: v2.nome,
          dupla2Origem: v2.origem,
        });
      }
    }
  }

  /**
   * Buscar confrontos eliminatórios
   */
  async buscarConfrontos(
    etapaId: string,
    arenaId: string,
    fase?: TipoFase
  ): Promise<ConfrontoEliminatorio[]> {
    if (fase) {
      return this.confrontoRepo.buscarPorFaseOrdenado(etapaId, arenaId, fase);
    }
    return this.confrontoRepo.buscarPorEtapaOrdenado(etapaId, arenaId);
  }

  /**
   * Cancelar fase eliminatória
   */
  async cancelarFaseEliminatoria(
    etapaId: string,
    arenaId: string
  ): Promise<void> {
    try {
      //  Buscar confrontos
      const confrontos = await this.confrontoRepo.buscarPorEtapa(
        etapaId,
        arenaId
      );

      if (confrontos.length === 0) {
        throw new Error("Nenhuma fase eliminatória encontrada para esta etapa");
      }

      //  Reverter estatísticas de partidas finalizadas
      let partidasRevertidas = 0;
      for (const confronto of confrontos) {
        if (confronto.status === StatusConfrontoEliminatorio.FINALIZADA) {
          await this.reverterEstatisticasConfronto(confronto);
          partidasRevertidas++;
        }
      }

      //  Buscar e deletar partidas eliminatórias
      const partidasEliminatorias = await this.partidaRepo.buscarPorTipo(
        etapaId,
        arenaId,
        "eliminatoria"
      );

      if (partidasEliminatorias.length > 0) {
        await this.partidaRepo.deletarEmLote(
          partidasEliminatorias.map((p) => p.id)
        );
      }

      //  Deletar confrontos
      await this.confrontoRepo.deletarPorEtapa(etapaId, arenaId);

      //  Buscar duplas classificadas
      const duplasClassificadas = await this.duplaRepo.buscarClassificadas(
        etapaId,
        arenaId
      );

      // Desmarcar duplas como classificadas
      const desmarcarPromises = duplasClassificadas.flatMap((dupla) => [
        this.duplaRepo.marcarClassificada(dupla.id, false),
        estatisticasJogadorService.marcarComoClassificado(
          dupla.jogador1Id,
          etapaId,
          false
        ),
        estatisticasJogadorService.marcarComoClassificado(
          dupla.jogador2Id,
          etapaId,
          false
        ),
      ]);
      await Promise.all(desmarcarPromises);
    } catch (error: any) {
      logger.error(
        "Erro ao cancelar fase eliminatória",
        { etapaId, arenaId },
        error
      );
      throw error;
    }
  }
}

// Exportar instância padrão
export default new EliminatoriaService();
