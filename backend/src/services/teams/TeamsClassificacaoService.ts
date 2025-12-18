/**
 * TeamsClassificacaoService - Responsabilidade: Classificação e preenchimento de eliminatórias
 *
 * Seguindo SRP:
 * - Cálculo de classificação de equipes
 * - Preenchimento automático da fase eliminatória
 * - Propagação de vencedores para próximos confrontos
 */

import { Equipe, ConfrontoEquipe, StatusConfronto } from "../../models/Teams";
import { FaseEtapa } from "../../models/Etapa";
import { IConfrontoEquipeRepository } from "../../repositories/interfaces/IConfrontoEquipeRepository";
import { IEquipeRepository } from "../../repositories/interfaces/IEquipeRepository";
import ConfrontoEquipeRepository from "../../repositories/firebase/ConfrontoEquipeRepository";
import EquipeRepository from "../../repositories/firebase/EquipeRepository";
import logger from "../../utils/logger";

export interface ITeamsClassificacaoService {
  recalcularClassificacao(etapaId: string, arenaId: string): Promise<Equipe[]>;

  verificarEPreencherFaseEliminatoria(
    etapaId: string,
    arenaId: string
  ): Promise<void>;

  preencherProximoConfronto(
    confronto: ConfrontoEquipe,
    vencedoraId: string,
    vencedoraNome: string
  ): Promise<void>;
}

export class TeamsClassificacaoService implements ITeamsClassificacaoService {
  constructor(
    private confrontoRepository: IConfrontoEquipeRepository = ConfrontoEquipeRepository,
    private equipeRepository: IEquipeRepository = EquipeRepository
  ) {}

  /**
   * Recalcula a classificação de todas as equipes da etapa
   * Ordenando por critérios de desempate
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
      // Pontos (desc)
      if (b.pontos !== a.pontos) return b.pontos - a.pontos;
      // Saldo de jogos (desc)
      if (b.saldoJogos !== a.saldoJogos) return b.saldoJogos - a.saldoJogos;
      // Saldo de games (desc)
      if (b.saldoGames !== a.saldoGames) return b.saldoGames - a.saldoGames;
      // Games vencidos (desc)
      if (b.gamesVencidos !== a.gamesVencidos)
        return b.gamesVencidos - a.gamesVencidos;
      // Nome (asc) como último critério
      return a.nome.localeCompare(b.nome);
    });

    // Atualizar todas as posições em um único batch
    const atualizacoes = equipesOrdenadas.map((equipe, index) => ({
      id: equipe.id,
      posicao: index + 1,
    }));
    await this.equipeRepository.atualizarPosicoesEmLote(atualizacoes);

    // Retornar equipes com posições atualizadas localmente
    return equipesOrdenadas.map((equipe, index) => ({
      ...equipe,
      posicao: index + 1,
    }));
  }

  /**
   * Verifica se a fase de grupos terminou e preenche a fase eliminatória
   */
  async verificarEPreencherFaseEliminatoria(
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
      await this.preencherConfrontoEliminatorio(confronto, classificados);
    }

    logger.info("Fase eliminatória preenchida", {
      etapaId,
      numGrupos,
      totalClassificados: classificados.size,
    });
  }

  /**
   * Preenche o próximo confronto após uma semifinal/quartas
   */
  async preencherProximoConfronto(
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

  // ==================== MÉTODOS PRIVADOS ====================

  /**
   * Preenche um confronto eliminatório com as equipes classificadas
   */
  private async preencherConfrontoEliminatorio(
    confronto: ConfrontoEquipe,
    classificados: Map<string, Equipe>
  ): Promise<void> {
    // Pular se já tem equipes definidas
    if (
      confronto.equipe1Id &&
      confronto.equipe2Id &&
      confronto.equipe2Id !== "BYE"
    ) {
      return;
    }

    // Verificar se é BYE
    if (confronto.isBye) {
      await this.processarBye(confronto, classificados);
      return;
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

  /**
   * Processa um confronto BYE (equipe passa direto)
   */
  private async processarBye(
    confronto: ConfrontoEquipe,
    classificados: Map<string, Equipe>
  ): Promise<void> {
    // Extrair a posição da origem (ex: "1º Grupo A" -> "1A")
    const posicao1 = this.extrairPosicaoDaOrigem(confronto.equipe1Origem);
    if (!posicao1) {
      return;
    }

    const equipe = classificados.get(posicao1);
    if (!equipe) {
      return;
    }

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
}

export default new TeamsClassificacaoService();
