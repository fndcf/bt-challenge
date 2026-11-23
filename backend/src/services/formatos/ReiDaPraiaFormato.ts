/**
 * Rei da Praia: grupos individuais (parceiros rotativos) e eliminatória em
 * duplas
 */

import { Etapa } from "../../models/Etapa";
import { Jogador } from "../../models/Jogador";
import { StatusPartida } from "../../models/Partida";
import { confrontoEliminatorioRepository } from "../../repositories/firebase/ConfrontoEliminatorioRepository";
import { duplaRepository } from "../../repositories/firebase/DuplaRepository";
import { estatisticasJogadorRepository } from "../../repositories/firebase/EstatisticasJogadorRepository";
import { grupoRepository } from "../../repositories/firebase/GrupoRepository";
import { partidaReiDaPraiaRepository } from "../../repositories/firebase/PartidaReiDaPraiaRepository";
import { PontuacaoColocacao } from "../../repositories/interfaces/IConfigRepository";
import { IConfrontoEliminatorioRepository } from "../../repositories/interfaces/IConfrontoEliminatorioRepository";
import { IDuplaRepository } from "../../repositories/interfaces/IDuplaRepository";
import { IEstatisticasJogadorRepository } from "../../repositories/interfaces/IEstatisticasJogadorRepository";
import { IGrupoRepository } from "../../repositories/interfaces/IGrupoRepository";
import { IPartidaReiDaPraiaRepository } from "../../repositories/interfaces/IPartidaReiDaPraiaRepository";
import { isRankingEliminatoria } from "../../utils/desempate";
import reiDaPraiaService from "../ReiDaPraiaService";
import {
  buscarFinal,
  campeaoDaFinal,
  colocacoesDaEliminatoria,
  colocacoesDosJogadores,
} from "./colocacoes";
import { Encerramento, FormatoTorneio } from "./FormatoTorneio";

export class ReiDaPraiaFormato implements FormatoTorneio {
  constructor(
    private partidas: IPartidaReiDaPraiaRepository = partidaReiDaPraiaRepository,
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
    await reiDaPraiaService.substituirJogador(
      etapaId,
      arenaId,
      jogadorAntigoId,
      jogadorNovo
    );
  }

  async reaplicarClassificacao(
    { id, arenaId }: Etapa,
    grupoId: string
  ): Promise<void> {
    // Ranking entre grupos (duplas da eliminatória): a decisão é aplicada na
    // próxima geração, não há grupo para recalcular
    if (isRankingEliminatoria(grupoId)) return;

    await reiDaPraiaService.recalcularClassificacaoGrupo(grupoId, id);
    // Sem empate no grupo, o ranking entre grupos pode ter empate a decidir
    await reiDaPraiaService.atualizarEmpatesEntreGrupos(id, arenaId);
  }

  /**
   * As duplas só existem para quem chegou na eliminatória: a participação vai
   * para todo jogador da etapa que não está nelas.
   */
  async prepararEncerramento(
    etapa: Etapa,
    pontuacao: PontuacaoColocacao
  ): Promise<Encerramento> {
    const grupos = await this.grupos.buscarPorEtapa(etapa.id, etapa.arenaId);

    if (grupos.length === 0) {
      throw new Error("Nenhum grupo encontrado para esta etapa");
    }

    const final = await buscarFinal(etapa, this.confrontos);

    return {
      campeao: campeaoDaFinal(final),
      calcularPontuacoes: async () => {
        const [porDupla, jogadores] = await Promise.all([
          colocacoesDaEliminatoria(etapa, final, pontuacao, this.confrontos),
          this.estatisticas.buscarPorEtapa(etapa.id, etapa.arenaId),
        ]);
        const porJogador = await colocacoesDosJogadores(porDupla, this.duplas);

        return jogadores.map(({ id, jogadorId }) => ({
          estatisticaId: id,
          pontos: pontuacao.participacao,
          colocacao: "participacao",
          ...porJogador.get(jogadorId),
        }));
      },
    };
  }
}
