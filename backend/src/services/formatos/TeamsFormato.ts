/**
 * Teams: equipes, com eliminatória a partir de 6
 */

import { Etapa, FaseEtapa } from "../../models/Etapa";
import { Jogador } from "../../models/Jogador";
import { ConfrontoEquipe, Equipe, StatusConfronto } from "../../models/Teams";
import confrontoEquipeRepository from "../../repositories/firebase/ConfrontoEquipeRepository";
import equipeRepository from "../../repositories/firebase/EquipeRepository";
import { estatisticasJogadorRepository } from "../../repositories/firebase/EstatisticasJogadorRepository";
import { PontuacaoColocacao } from "../../repositories/interfaces/IConfigRepository";
import { IConfrontoEquipeRepository } from "../../repositories/interfaces/IConfrontoEquipeRepository";
import { IEquipeRepository } from "../../repositories/interfaces/IEquipeRepository";
import { IEstatisticasJogadorRepository } from "../../repositories/interfaces/IEstatisticasJogadorRepository";
import { teamsClassificacaoService } from "../teams";
import teamsService from "../TeamsService";
import {
  Colocacao,
  colocacaoPorPosicao,
  colocarPorFase,
  ConfrontoEncerrado,
} from "./colocacoes";
import { Encerramento, FormatoTorneio } from "./FormatoTorneio";
import { pontuarJogadores } from "./pontuacoes";

const entreEquipes = (confronto: ConfrontoEquipe): ConfrontoEncerrado => ({
  lados: [confronto.equipe1Id, confronto.equipe2Id],
  vencedoraId: confronto.vencedoraId,
});

export class TeamsFormato implements FormatoTorneio {
  constructor(
    private confrontos: IConfrontoEquipeRepository = confrontoEquipeRepository,
    private equipes: IEquipeRepository = equipeRepository,
    private estatisticas: IEstatisticasJogadorRepository = estatisticasJogadorRepository
  ) {}

  async temPartidasJogadas(etapaId: string, arenaId: string): Promise<boolean> {
    const confrontos = await this.confrontos.buscarPorEtapa(etapaId, arenaId);
    return confrontos.some((c) => c.status !== StatusConfronto.AGENDADO);
  }

  async substituirJogador(
    etapaId: string,
    arenaId: string,
    jogadorAntigoId: string,
    jogadorNovo: Jogador
  ): Promise<void> {
    await teamsService.substituirJogador(
      etapaId,
      arenaId,
      jogadorAntigoId,
      jogadorNovo
    );
  }

  async reaplicarClassificacao({ id, arenaId }: Etapa): Promise<void> {
    await teamsClassificacaoService.recalcularClassificacao(id, arenaId);
  }

  /**
   * Com eliminatória vale a fase em que a equipe parou (o mata-mata não dá
   * pontos na tabela); sem eliminatória, a ordem da tabela.
   */
  async prepararEncerramento(
    { id, arenaId }: Etapa,
    pontuacao: PontuacaoColocacao
  ): Promise<Encerramento> {
    const confrontos = await this.confrontos.buscarPorEtapa(id, arenaId);

    if (confrontos.length === 0) {
      throw new Error("Nenhum confronto encontrado para esta etapa");
    }

    const pendentes = confrontos.filter(
      (c) => c.status !== StatusConfronto.FINALIZADO
    ).length;

    if (pendentes > 0) {
      throw new Error(
        `Ainda há ${pendentes} confronto(s) pendente(s). Finalize todos os confrontos antes de encerrar a etapa.`
      );
    }

    const equipes = await this.equipes.buscarPorClassificacao(id, arenaId);

    if (equipes.length === 0) {
      throw new Error("Nenhuma equipe encontrada para esta etapa");
    }

    const final = confrontos.find((c) => c.fase === FaseEtapa.FINAL);

    return final
      ? this.encerrarEliminatoria(id, equipes, confrontos, final, pontuacao)
      : this.encerrarTabela(id, equipes, pontuacao);
  }

  private encerrarEliminatoria(
    etapaId: string,
    equipes: Equipe[],
    confrontos: ConfrontoEquipe[],
    final: ConfrontoEquipe,
    pontuacao: PontuacaoColocacao
  ): Encerramento {
    const campea = equipes.find((e) => e.id === final.vencedoraId);

    if (!campea) {
      throw new Error("A final ainda não foi finalizada");
    }

    const daFase = (fase: FaseEtapa) =>
      confrontos.filter((c) => c.fase === fase).map(entreEquipes);

    const porEquipe = colocarPorFase(
      {
        final: entreEquipes(final),
        semifinais: daFase(FaseEtapa.SEMIFINAL),
        quartas: daFase(FaseEtapa.QUARTAS),
        oitavas: daFase(FaseEtapa.OITAVAS),
      },
      pontuacao
    );

    return this.montarEncerramento(
      etapaId,
      campea,
      equipes,
      (equipe) =>
        porEquipe.get(equipe.id) ?? {
          colocacao: "participacao",
          pontos: pontuacao.participacao,
        }
    );
  }

  private encerrarTabela(
    etapaId: string,
    equipes: Equipe[],
    pontuacao: PontuacaoColocacao
  ): Encerramento {
    return this.montarEncerramento(etapaId, equipes[0], equipes, (_, i) =>
      colocacaoPorPosicao(
        i + 1,
        [
          "campeao",
          "vice",
          "semifinalista",
          "quartas",
          "oitavas",
          "participacao",
        ],
        pontuacao
      )
    );
  }

  private montarEncerramento(
    etapaId: string,
    campea: Equipe,
    equipes: Equipe[],
    colocacaoDa: (equipe: Equipe, indice: number) => Colocacao
  ): Encerramento {
    return {
      campeao: { id: campea.id, nome: campea.nome },
      calcularPontuacoes: () => {
        const colocacoes = new Map<string, Colocacao>();

        equipes.forEach((equipe, i) =>
          equipe.jogadores.forEach((j) =>
            colocacoes.set(j.id, colocacaoDa(equipe, i))
          )
        );

        return pontuarJogadores(etapaId, colocacoes, this.estatisticas);
      },
    };
  }
}
