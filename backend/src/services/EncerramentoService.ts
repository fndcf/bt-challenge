/**
 * Service para encerrar etapas: define o campeão e os pontos do ranking
 */

import { FormatoEtapa, StatusEtapa } from "../models/Etapa";
import { configRepository } from "../repositories/firebase/ConfigRepository";
import { estatisticasJogadorRepository } from "../repositories/firebase/EstatisticasJogadorRepository";
import { etapaRepository } from "../repositories/firebase/EtapaRepository";
import { IConfigRepository } from "../repositories/interfaces/IConfigRepository";
import { IEstatisticasJogadorRepository } from "../repositories/interfaces/IEstatisticasJogadorRepository";
import { IEtapaRepository } from "../repositories/interfaces/IEtapaRepository";
import { garantirSemEmpatesPendentes } from "../utils/desempate";
import logger from "../utils/logger";
import { FormatoTorneio, getFormato } from "./formatos";

export class EncerramentoService {
  constructor(
    private etapas: IEtapaRepository = etapaRepository,
    private config: IConfigRepository = configRepository,
    private estatisticas: IEstatisticasJogadorRepository = estatisticasJogadorRepository,
    private formatoDe: (formato?: FormatoEtapa) => FormatoTorneio = getFormato
  ) {}

  /**
   * Encerrar etapa e atribuir pontos
   */
  async encerrarEtapa(id: string, arenaId: string): Promise<void> {
    try {
      const etapa = await this.etapas.buscarPorIdEArena(id, arenaId);

      if (!etapa) {
        throw new Error("Etapa não encontrada");
      }

      if (etapa.status === StatusEtapa.FINALIZADA) {
        throw new Error("Etapa já está finalizada");
      }

      // Posição define pontuação: não encerrar com empate sem decisão do admin
      garantirSemEmpatesPendentes(etapa, "encerrar a etapa");

      const pontuacao = await this.config.buscarPontuacao();
      const { campeao, calcularPontuacoes } = await this.formatoDe(
        etapa.formato
      ).prepararEncerramento(etapa, {
        ...pontuacao,
        // Sem a opção gravada, dá os pontos
        participacao:
          etapa.darPontosParticipacao === false ? 0 : pontuacao.participacao,
      });

      const contaPontosRanking = etapa.contaPontosRanking ?? true;

      if (contaPontosRanking) {
        const pontuacoes = await calcularPontuacoes();

        if (pontuacoes.length > 0) {
          await this.estatisticas.atualizarPontuacaoEmLote(pontuacoes);
        }
      }

      if (campeao) {
        await this.etapas.definirCampeao(id, campeao.id, campeao.nome);
      }

      logger.info("Etapa encerrada", {
        etapaId: id,
        nome: etapa.nome,
        formato: etapa.formato,
        campeaoNome: campeao?.nome,
        contaPontosRanking,
        arenaId,
      });
    } catch (error) {
      logger.error(
        "Erro ao encerrar etapa",
        { etapaId: id, arenaId },
        error as Error
      );
      throw error;
    }
  }
}

export default new EncerramentoService();
