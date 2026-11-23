/**
 * Super X: um grupo único e individual, sem eliminatória
 */

import { getPontosSuperXPorPosicao } from "../../config/SuperXSchedules";
import { Etapa } from "../../models/Etapa";
import { Jogador } from "../../models/Jogador";
import { StatusPartida } from "../../models/Partida";
import { estatisticasJogadorRepository } from "../../repositories/firebase/EstatisticasJogadorRepository";
import { grupoRepository } from "../../repositories/firebase/GrupoRepository";
import { partidaReiDaPraiaRepository } from "../../repositories/firebase/PartidaReiDaPraiaRepository";
import { IEstatisticasJogadorRepository } from "../../repositories/interfaces/IEstatisticasJogadorRepository";
import { IGrupoRepository } from "../../repositories/interfaces/IGrupoRepository";
import { IPartidaReiDaPraiaRepository } from "../../repositories/interfaces/IPartidaReiDaPraiaRepository";
import superXService from "../SuperXService";
import { Encerramento, FormatoTorneio } from "./FormatoTorneio";

const colocacaoDaPosicao = (posicao: number): string => {
  if (posicao === 1) return "campeao";
  if (posicao === 2) return "vice";
  return `${posicao}o_lugar`;
};

export class SuperXFormato implements FormatoTorneio {
  constructor(
    private partidas: IPartidaReiDaPraiaRepository = partidaReiDaPraiaRepository,
    private grupos: IGrupoRepository = grupoRepository,
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
    await superXService.substituirJogador(
      etapaId,
      arenaId,
      jogadorAntigoId,
      jogadorNovo
    );
  }

  async reaplicarClassificacao({ id }: Etapa, grupoId: string): Promise<void> {
    await superXService.recalcularClassificacaoGrupo(grupoId, id);
  }

  /**
   * Vale a posição no grupo, com tabela própria de pontos: não usa as
   * colocações dos outros formatos, e todos pontuam.
   */
  async prepararEncerramento({ id, arenaId }: Etapa): Promise<Encerramento> {
    const [grupo] = await this.grupos.buscarPorEtapa(id, arenaId);

    if (!grupo) {
      throw new Error("Nenhum grupo encontrado para esta etapa");
    }

    if (!grupo.completo) {
      throw new Error(
        "Não é possível encerrar a etapa. O grupo ainda possui partidas pendentes."
      );
    }

    const jogadores = await this.estatisticas.buscarPorGrupoOrdenado(grupo.id);

    if (jogadores.length === 0) {
      throw new Error("Nenhum jogador encontrado no grupo");
    }

    const [campeao] = jogadores;

    return {
      campeao: { id: campeao.jogadorId, nome: campeao.jogadorNome },
      calcularPontuacoes: async () =>
        jogadores.map((jogador, i) => ({
          estatisticaId: jogador.id,
          pontos: getPontosSuperXPorPosicao(i + 1),
          colocacao: colocacaoDaPosicao(i + 1),
        })),
    };
  }
}
