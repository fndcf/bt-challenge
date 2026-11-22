/**
 * Service para rastrear histórico de duplas formadas
 */

import { CriarHistoricoDuplaDTO, HistoricoDupla } from "../models/HistoricoDupla";
import { historicoDuplaRepository } from "../repositories/firebase/HistoricoDuplaRepository";
import { IHistoricoDuplaRepository } from "../repositories/interfaces/IHistoricoDuplaRepository";
import logger from "../utils/logger";

export class HistoricoDuplaService {
  constructor(
    private historicos: IHistoricoDuplaRepository = historicoDuplaRepository
  ) {}

  /**
   * Normalizar chave da dupla (sempre ordem alfabética)
   */
  private normalizarChave(jogador1Id: string, jogador2Id: string): string {
    return [jogador1Id, jogador2Id].sort().join("_");
  }

  /**
   * Registrar múltiplas duplas em lote
   */
  async registrarEmLote(
    dtos: CriarHistoricoDuplaDTO[]
  ): Promise<HistoricoDupla[]> {
    if (dtos.length === 0) return [];

    try {
      const historicos = await this.historicos.criarEmLote(
        dtos.map((dto) => ({
          arenaId: dto.arenaId,
          etapaId: dto.etapaId,
          etapaNome: dto.etapaNome,
          jogador1Id: dto.jogador1Id,
          jogador1Nome: dto.jogador1Nome,
          jogador2Id: dto.jogador2Id,
          jogador2Nome: dto.jogador2Nome,
          chaveNormalizada: this.normalizarChave(
            dto.jogador1Id,
            dto.jogador2Id
          ),
          ambosForamCabecas: dto.ambosForamCabecas,
        }))
      );

      logger.info("Histórico de duplas registrado em lote", {
        quantidade: historicos.length,
        etapaId: dtos[0].etapaId,
      });

      return historicos;
    } catch (error) {
      logger.error(
        "Erro ao registrar histórico de duplas em lote",
        { quantidade: dtos.length },
        error as Error
      );
      throw error;
    }
  }

  /**
   * Limpar histórico de uma etapa específica
   */
  async limparDaEtapa(arenaId: string, etapaId: string): Promise<void> {
    try {
      const quantidadeRemovida = await this.historicos.deletarPorEtapa(
        etapaId,
        arenaId
      );

      logger.info("Histórico de duplas removido", {
        arenaId,
        etapaId,
        quantidadeRemovida,
      });
    } catch (error) {
      logger.error(
        "Erro ao limpar histórico de duplas da etapa",
        {
          arenaId,
          etapaId,
        },
        error as Error
      );
      throw error;
    }
  }
}

export default new HistoricoDuplaService();
