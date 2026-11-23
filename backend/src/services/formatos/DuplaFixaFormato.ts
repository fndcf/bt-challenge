/**
 * Dupla Fixa: duplas em grupos, com eliminatória se houver mais de um grupo
 */

import { Etapa } from "../../models/Etapa";
import { Grupo } from "../../models/Grupo";
import { Jogador } from "../../models/Jogador";
import { StatusPartida } from "../../models/Partida";
import { confrontoEliminatorioRepository } from "../../repositories/firebase/ConfrontoEliminatorioRepository";
import { duplaRepository } from "../../repositories/firebase/DuplaRepository";
import { estatisticasJogadorRepository } from "../../repositories/firebase/EstatisticasJogadorRepository";
import { grupoRepository } from "../../repositories/firebase/GrupoRepository";
import { partidaRepository } from "../../repositories/firebase/PartidaRepository";
import { PontuacaoColocacao } from "../../repositories/interfaces/IConfigRepository";
import { IConfrontoEliminatorioRepository } from "../../repositories/interfaces/IConfrontoEliminatorioRepository";
import { IDuplaRepository } from "../../repositories/interfaces/IDuplaRepository";
import { IEstatisticasJogadorRepository } from "../../repositories/interfaces/IEstatisticasJogadorRepository";
import { IGrupoRepository } from "../../repositories/interfaces/IGrupoRepository";
import { IPartidaRepository } from "../../repositories/interfaces/IPartidaRepository";
import chaveService from "../ChaveService";
import classificacaoService from "../ClassificacaoService";
import {
  buscarFinal,
  campeaoDaFinal,
  Colocacao,
  colocacaoPorPosicao,
  colocacoesDaEliminatoria,
  colocacoesDosJogadores,
} from "./colocacoes";
import { Encerramento, FormatoTorneio } from "./FormatoTorneio";
import { pontuarJogadores } from "./pontuacoes";

export class DuplaFixaFormato implements FormatoTorneio {
  constructor(
    private partidas: IPartidaRepository = partidaRepository,
    private grupos: IGrupoRepository = grupoRepository,
    private duplas: IDuplaRepository = duplaRepository,
    private confrontos: IConfrontoEliminatorioRepository = confrontoEliminatorioRepository,
    private estatisticas: IEstatisticasJogadorRepository = estatisticasJogadorRepository
  ) {}

  async temPartidasJogadas(etapaId: string, arenaId: string): Promise<boolean> {
    const partidas = await this.partidas.buscarPorEtapa(etapaId, arenaId);
    return partidas.some((p) => p.status !== StatusPartida.AGENDADA);
  }

  async substituirJogador(
    etapaId: string,
    arenaId: string,
    jogadorAntigoId: string,
    jogadorNovo: Jogador
  ): Promise<void> {
    await chaveService.substituirJogador(
      etapaId,
      arenaId,
      jogadorAntigoId,
      jogadorNovo
    );
  }

  async reaplicarClassificacao(_etapa: Etapa, grupoId: string): Promise<void> {
    await classificacaoService.recalcularClassificacaoGrupo(grupoId);
  }

  async prepararEncerramento(
    etapa: Etapa,
    pontuacao: PontuacaoColocacao
  ): Promise<Encerramento> {
    const grupos = await this.grupos.buscarPorEtapa(etapa.id, etapa.arenaId);

    if (grupos.length === 0) {
      throw new Error("Nenhum grupo encontrado para esta etapa");
    }

    return grupos.length === 1
      ? this.encerrarGrupoUnico(etapa, grupos[0], pontuacao)
      : this.encerrarEliminatoria(etapa, pontuacao);
  }

  /**
   * Sem eliminatória: vale a classificação do grupo
   */
  private async encerrarGrupoUnico(
    etapa: Etapa,
    grupo: Grupo,
    pontuacao: PontuacaoColocacao
  ): Promise<Encerramento> {
    if (!grupo.completo) {
      throw new Error(
        "Não é possível encerrar a etapa. O grupo ainda possui partidas pendentes."
      );
    }

    const duplas = await this.duplas.buscarPorGrupoOrdenado(grupo.id);

    if (duplas.length === 0) {
      throw new Error("Nenhuma dupla encontrada no grupo");
    }

    const [campea] = duplas;

    return {
      campeao: {
        id: campea.id,
        nome: `${campea.jogador1Nome} & ${campea.jogador2Nome}`,
      },
      calcularPontuacoes: () => {
        const colocacoes = new Map<string, Colocacao>();

        duplas.forEach((dupla, i) => {
          const colocacao = colocacaoPorPosicao(
            i + 1,
            ["campeao", "vice", "semifinalista", "quartas", "participacao"],
            pontuacao
          );
          colocacoes.set(dupla.jogador1Id, colocacao);
          colocacoes.set(dupla.jogador2Id, colocacao);
        });

        return pontuarJogadores(etapa.id, colocacoes, this.estatisticas);
      },
    };
  }

  /**
   * Com eliminatória: vale a fase em que a dupla parou. Quem não se
   * classificou fica com a participação.
   */
  private async encerrarEliminatoria(
    etapa: Etapa,
    pontuacao: PontuacaoColocacao
  ): Promise<Encerramento> {
    const final = await buscarFinal(etapa, this.confrontos);

    return {
      campeao: campeaoDaFinal(final),
      calcularPontuacoes: async () => {
        const [porDupla, duplas] = await Promise.all([
          colocacoesDaEliminatoria(etapa, final, pontuacao, this.confrontos),
          this.duplas.buscarPorEtapa(etapa.id, etapa.arenaId),
        ]);

        duplas
          .filter((d) => !d.classificada && !porDupla.has(d.id))
          .forEach((d) =>
            porDupla.set(d.id, {
              colocacao: "participacao",
              pontos: pontuacao.participacao,
            })
          );

        return pontuarJogadores(
          etapa.id,
          await colocacoesDosJogadores(porDupla, this.duplas),
          this.estatisticas
        );
      },
    };
  }
}
