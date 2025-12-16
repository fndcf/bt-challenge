/**
 * Service para gerenciar partidas do formato DUPLA FIXA
 */

import { apiClient } from "./apiClient";
import {
  ResultadoPartidaLoteDTO,
  RegistrarResultadosEmLoteResponse,
} from "../types/chave";
import { handleError } from "../utils/errorHandler";
import logger from "../utils/logger";
import { IPartidaService } from "./interfaces/IPartidaService";

class PartidaService implements IPartidaService {
  private baseURL = "/partidas";

  /**
   * Registrar múltiplos resultados de partidas em lote
   */
  async registrarResultadosEmLote(
    resultados: ResultadoPartidaLoteDTO[]
  ): Promise<RegistrarResultadosEmLoteResponse> {
    try {
      const response = await apiClient.post<RegistrarResultadosEmLoteResponse>(
        `${this.baseURL}/resultados-lote`,
        { resultados }
      );

      logger.info("Resultados Dupla Fixa registrados em lote", {
        total: resultados.length,
        processados: response.processados,
        erros: response.erros?.length || 0,
      });

      return response;
    } catch (error) {
      const appError = handleError(
        error,
        "PartidaService.registrarResultadosEmLote"
      );
      throw new Error(appError.message);
    }
  }
}

export default new PartidaService();
