/**
 * partidaService.ts
 * Service para gerenciar partidas do formato DUPLA FIXA
 *
 * Responsabilidade única: Registrar resultados de partidas Dupla Fixa
 *
 * Para formato Rei da Praia, use reiDaPraiaService.registrarResultado()
 */

import { apiClient } from "./apiClient";
import { SetPartida } from "../types/chave";
import { handleError } from "../utils/errorHandler";
import logger from "../utils/logger";
import { IPartidaService } from "./interfaces/IPartidaService";

class PartidaService implements IPartidaService {
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
}

export default new PartidaService();
