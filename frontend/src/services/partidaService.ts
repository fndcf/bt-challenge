import { apiClient } from "./apiClient";
import { SetPartida } from "../types/chave";
import { handleError } from "../utils/errorHandler";
import logger from "../utils/logger"; // ← IMPORTAR LOGGER

/**
 * Service para gerenciar partidas
 *  Suporta Dupla Fixa e Rei da Praia
 */
class PartidaService {
  private baseURL = "/partidas";

  /**
   * Registrar resultado de uma partida DUPLA FIXA
   * (Múltiplos sets - melhor de 3 ou 5)
   */
  async registrarResultado(
    partidaId: string,
    placar: SetPartida[]
  ): Promise<void> {
    try {
      await apiClient.put(`${this.baseURL}/${partidaId}/resultado`, { placar });

      logger.info("Resultado Dupla Fixa registrado", {
        partidaId,
        totalSets: placar.length,
        placar: placar
          .map((s) => `${s.gamesDupla1}-${s.gamesDupla2}`)
          .join(", "),
      });
    } catch (error) {
      const appError = handleError(error, "PartidaService.registrarResultado");
      throw new Error(appError.message);
    }
  }

  /**
   *  Registrar resultado de partida REI DA PRAIA
   * (1 SET APENAS - formato específico)
   */
  async registrarResultadoReiDaPraia(
    partidaId: string,
    placar: Array<{
      numero: number;
      gamesDupla1: number;
      gamesDupla2: number;
    }>
  ): Promise<void> {
    try {
      // Validar placar (deve ter apenas 1 set)
      if (placar.length !== 1) {
        throw new Error("Partida Rei da Praia deve ter apenas 1 set");
      }

      await apiClient.put(`/partidas/rei-da-praia/${partidaId}/resultado`, {
        placar,
      });

      logger.info("Resultado Rei da Praia registrado", {
        partidaId,
        placar: `${placar[0].gamesDupla1}-${placar[0].gamesDupla2}`,
      });
    } catch (error) {
      const appError = handleError(
        error,
        "PartidaService.registrarResultadoReiDaPraia"
      );
      throw new Error(appError.message);
    }
  }
}

export default new PartidaService();
