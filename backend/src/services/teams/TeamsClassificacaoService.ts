/**
 * TeamsClassificacaoService - Responsabilidade: Classificação e preenchimento de eliminatórias
 *
 * Seguindo SRP:
 * - Cálculo de classificação de equipes
 * - Preenchimento da fase eliminatória (acionado pelo admin)
 * - Propagação de vencedores para próximos confrontos
 */

import { Equipe, ConfrontoEquipe, StatusConfronto } from "../../models/Teams";
import { FaseEtapa } from "../../models/Etapa";
import { IConfrontoEquipeRepository } from "../../repositories/interfaces/IConfrontoEquipeRepository";
import { IEquipeRepository } from "../../repositories/interfaces/IEquipeRepository";
import ConfrontoEquipeRepository from "../../repositories/firebase/ConfrontoEquipeRepository";
import EquipeRepository from "../../repositories/firebase/EquipeRepository";
import desempateService, { DesempateService } from "../DesempateService";
import logger from "../../utils/logger";

// Chave usada quando a etapa não tem fase de grupos (todas as equipes juntas)
const GRUPO_GERAL = "geral";

/**
 * Eliminatória já recebeu equipes (os confrontos existem desde a geração das
 * chaves, com vagas "1º Grupo A" etc. vazias até a fase de grupos terminar)
 */
export function isEliminatoriaPreenchida(confrontos: ConfrontoEquipe[]): boolean {
  return confrontos.some((c) => c.fase !== FaseEtapa.GRUPOS && !!c.equipe1Id);
}

export interface ITeamsClassificacaoService {
  recalcularClassificacao(etapaId: string, arenaId: string): Promise<Equipe[]>;

  gerarFaseEliminatoria(etapaId: string, arenaId: string): Promise<void>;

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
    private equipeRepository: IEquipeRepository = EquipeRepository,
    private desempate: DesempateService = desempateService
  ) {}

  /**
   * Recalcula a classificação de todas as equipes da etapa
   *
   * CRITÉRIOS DE DESEMPATE (em ordem, dentro de cada grupo):
   * Pontos
   * Saldo de jogos
   * Saldo de games
   * Confronto direto (apenas quando 2 equipes empatadas)
   * Games vencidos
   * Decisão do admin (sorteio ou manual) — ver DesempateService
   */
  async recalcularClassificacao(
    etapaId: string,
    arenaId: string
  ): Promise<Equipe[]> {
    // Buscar equipes e todos os confrontos da etapa
    const [equipes, confrontos] = await Promise.all([
      this.equipeRepository.buscarPorEtapa(etapaId, arenaId),
      this.confrontoRepository.buscarPorEtapa(etapaId, arenaId),
    ]);
    const todosConfrontosGrupos = confrontos.filter(
      (c) => c.fase === FaseEtapa.GRUPOS
    );
    // Filtrar apenas confrontos finalizados para confronto direto
    const confrontosGrupos = todosConfrontosGrupos.filter(
      (c) => c.status === StatusConfronto.FINALIZADO
    );

    // Jogos do mata-mata também somam games/jogos nas equipes. Depois que a
    // eliminatória é preenchida, as posições de grupo já foram usadas e
    // não devem mais gerar empates pendentes.
    const eliminatoriaPreenchida = isEliminatoriaPreenchida(confrontos);

    // Classificar cada grupo (sem fase de grupos = grupo único "geral")
    const chaveGrupo = (e: { grupoId?: string }) => e.grupoId || GRUPO_GERAL;
    const equipesPorGrupo = new Map<string, Equipe[]>();
    for (const equipe of equipes) {
      const grupoId = chaveGrupo(equipe);
      if (!equipesPorGrupo.has(grupoId)) {
        equipesPorGrupo.set(grupoId, []);
      }
      equipesPorGrupo.get(grupoId)!.push(equipe);
    }

    const rankNoGrupo = new Map<string, number>();
    await Promise.all(
      Array.from(equipesPorGrupo.entries()).map(
        async ([grupoId, equipesDoGrupo]) => {
          const confrontosDoGrupo = todosConfrontosGrupos.filter(
            (c) => chaveGrupo(c) === grupoId
          );
          const grupoCompleto =
            confrontosDoGrupo.length > 0 &&
            confrontosDoGrupo.every(
              (c) => c.status === StatusConfronto.FINALIZADO
            );

          const ordenadas = await this.desempate.classificarGrupo({
            etapaId,
            grupoId,
            grupoNome: equipesDoGrupo[0].grupoNome || "Classificação geral",
            itens: equipesDoGrupo,
            comparar: this.criarComparadorEquipes(
              equipesDoGrupo,
              confrontosGrupos
            ),
            getId: (e) => e.id,
            getNome: (e) => e.nome,
            grupoCompleto,
            atualizarPendencias: !eliminatoriaPreenchida,
          });
          ordenadas.forEach((e, i) => rankNoGrupo.set(e.id, i));
        }
      )
    );

    // Ordem geral: dentro do mesmo grupo segue a classificação do grupo;
    // entre grupos diferentes, compara os números
    const rank = (e: Equipe) => rankNoGrupo.get(e.id) ?? 0;
    const equipesOrdenadas = [...equipes].sort((a, b) => {
      if (chaveGrupo(a) === chaveGrupo(b)) return rank(a) - rank(b);
      if (b.pontos !== a.pontos) return b.pontos - a.pontos;
      if (b.saldoJogos !== a.saldoJogos) return b.saldoJogos - a.saldoJogos;
      if (b.saldoGames !== a.saldoGames) return b.saldoGames - a.saldoGames;
      if (b.gamesVencidos !== a.gamesVencidos)
        return b.gamesVencidos - a.gamesVencidos;
      return rank(a) - rank(b) || a.nome.localeCompare(b.nome);
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
   * Gera (preenche) a fase eliminatória a partir da classificação dos grupos
   *
   * Acionado pelo admin, como nos outros formatos: assim a classificação
   * final dos grupos (inclusive desempates) é a que vale para o mata-mata.
   */
  async gerarFaseEliminatoria(etapaId: string, arenaId: string): Promise<void> {
    const confrontos = await this.confrontoRepository.buscarPorEtapa(
      etapaId,
      arenaId
    );

    if (!confrontos.some((c) => c.fase !== FaseEtapa.GRUPOS)) {
      throw new Error("Esta etapa não possui fase eliminatória");
    }

    const gruposPendentes = confrontos.filter(
      (c) =>
        c.fase === FaseEtapa.GRUPOS && c.status !== StatusConfronto.FINALIZADO
    );
    if (gruposPendentes.length > 0) {
      throw new Error(
        `Não é possível gerar a fase eliminatória: ainda há ${gruposPendentes.length} confronto(s) pendente(s) na fase de grupos`
      );
    }

    if (isEliminatoriaPreenchida(confrontos)) {
      throw new Error("A fase eliminatória já foi gerada");
    }

    await this.desempate.garantirSemEmpatesPendentes(
      etapaId,
      "gerar a fase eliminatória"
    );

    await this.verificarEPreencherFaseEliminatoria(etapaId, arenaId);
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

    // Só preencher depois que o admin resolver os empates dos grupos
    const empatesPendentes = await this.desempate.listarPendentes(etapaId);
    if (empatesPendentes.length > 0) {
      logger.info("Fase de grupos finalizada, aguardando desempate do admin", {
        etapaId,
        empates: empatesPendentes.length,
      });
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

    // Ordenar equipes dentro de cada grupo pela posição calculada em
    // recalcularClassificacao (mesma ordem exibida na tabela)
    for (const [, equipesDoGrupo] of equipesPorGrupo) {
      equipesDoGrupo.sort((a, b) => (a.posicao ?? 0) - (b.posicao ?? 0));
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
   * Preenche o próximo confronto com o vencedor (oitavas/quartas/semifinal)
   *
   * A vaga vem da origem do próximo confronto ("Vencedor Quartas 3" = 3º
   * confronto das quartas, pela ordem), e não da primeira vaga vazia, que
   * dependeria de qual jogo terminou antes.
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

    const vaga =
      (await this.vagaNoProximoConfronto(confronto, proximoConfronto)) ??
      // Origem não reconhecida: primeira vaga livre (comportamento antigo)
      (!proximoConfronto.equipe1Id ? 1 : !proximoConfronto.equipe2Id ? 2 : null);

    if (vaga === 1) {
      await this.confrontoRepository.atualizar(proximoConfronto.id, {
        equipe1Id: vencedoraId,
        equipe1Nome: vencedoraNome,
      });
    } else if (vaga === 2) {
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
   * Vaga (1 ou 2) do próximo confronto alimentada por este confronto,
   * pela origem "Vencedor <Fase> N" (null se a origem não for reconhecida)
   */
  private async vagaNoProximoConfronto(
    confronto: ConfrontoEquipe,
    proximoConfronto: ConfrontoEquipe
  ): Promise<1 | 2 | null> {
    const nomesFase: Partial<Record<FaseEtapa, string>> = {
      [FaseEtapa.OITAVAS]: "Oitavas",
      [FaseEtapa.QUARTAS]: "Quartas",
      [FaseEtapa.SEMIFINAL]: "Semifinal",
    };
    const nomeFase = nomesFase[confronto.fase];
    if (!nomeFase) return null;

    const confrontosDaFase = (
      await this.confrontoRepository.buscarPorFase(
        confronto.etapaId,
        confronto.arenaId,
        confronto.fase
      )
    ).sort((a, b) => a.ordem - b.ordem);
    const numero =
      confrontosDaFase.findIndex((c) => c.id === confronto.id) + 1;
    if (numero === 0) return null;

    const origem = `Vencedor ${nomeFase} ${numero}`;
    if (proximoConfronto.equipe1Origem === origem) return 1;
    if (proximoConfronto.equipe2Origem === origem) return 2;
    return null;
  }

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

  /**
   * Comparador dos critérios de classificação de um grupo (0 = empate em todos)
   */
  private criarComparadorEquipes(
    equipesDoGrupo: Equipe[],
    confrontosGrupos: ConfrontoEquipe[]
  ): (a: Equipe, b: Equipe) => number {
    return (a, b) => {
      // Pontos (desc)
      if (b.pontos !== a.pontos) return b.pontos - a.pontos;
      // Saldo de jogos (desc)
      if (b.saldoJogos !== a.saldoJogos) return b.saldoJogos - a.saldoJogos;
      // Saldo de games (desc)
      if (b.saldoGames !== a.saldoGames) return b.saldoGames - a.saldoGames;

      // Verificar quantas equipes estão empatadas nestes critérios
      const equipesEmpatadas = equipesDoGrupo.filter(
        (e) =>
          e.pontos === a.pontos &&
          e.saldoJogos === a.saldoJogos &&
          e.saldoGames === a.saldoGames
      );

      // Confronto direto (apenas se 2 equipes empatadas)
      if (equipesEmpatadas.length === 2) {
        const confrontoDireto = this.verificarConfrontoDireto(
          confrontosGrupos,
          a.id,
          b.id
        );
        if (confrontoDireto === a.id) return -1;
        if (confrontoDireto === b.id) return 1;
      }

      // Games vencidos (desc)
      if (b.gamesVencidos !== a.gamesVencidos)
        return b.gamesVencidos - a.gamesVencidos;

      return 0;
    };
  }

  /**
   * Verifica confronto direto entre duas equipes
   * Retorna o ID da equipe vencedora ou null se não houve confronto
   */
  private verificarConfrontoDireto(
    confrontos: ConfrontoEquipe[],
    equipe1Id: string,
    equipe2Id: string
  ): string | null {
    const confronto = confrontos.find(
      (c) =>
        (c.equipe1Id === equipe1Id && c.equipe2Id === equipe2Id) ||
        (c.equipe1Id === equipe2Id && c.equipe2Id === equipe1Id)
    );

    // Só vale vencedor de confronto encerrado
    if (confronto?.status !== StatusConfronto.FINALIZADO) {
      return null;
    }

    return confronto.vencedoraId ?? null;
  }
}

export default new TeamsClassificacaoService();
