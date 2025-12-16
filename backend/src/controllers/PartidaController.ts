/**
 * Controller para gerenciar partidas
 */

import { Response } from "express";
import { AuthRequest } from "../middlewares/auth";
import { BaseController } from "./BaseController";
import { ResponseHelper } from "../utils/responseHelper";
import chaveService from "../services/ChaveService";
import logger from "../utils/logger";

class PartidaController extends BaseController {
  protected controllerName = "PartidaController";

  /**
   * Registrar múltiplos resultados de partidas em lote
   * POST /api/partidas/resultados-lote
   */
  async registrarResultadosEmLote(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const { resultados } = req.body;

      // Validação
      if (!resultados || !Array.isArray(resultados) || resultados.length === 0) {
        ResponseHelper.badRequest(res, "Lista de resultados inválida");
        return;
      }

      // Validar cada resultado
      for (const resultado of resultados) {
        if (!resultado.partidaId) {
          ResponseHelper.badRequest(res, "partidaId é obrigatório em cada resultado");
          return;
        }
        if (!resultado.placar || !Array.isArray(resultado.placar) || resultado.placar.length === 0) {
          ResponseHelper.badRequest(res, `Placar inválido para partida ${resultado.partidaId}`);
          return;
        }
      }

      const response = await chaveService.registrarResultadosEmLote(
        arenaId,
        resultados
      );

      logger.info("Resultados em lote registrados (Dupla Fixa)", {
        total: resultados.length,
        processados: response.processados,
        erros: response.erros.length,
        arenaId,
      });

      ResponseHelper.success(res, response, response.message);
    } catch (error: any) {
      if (this.handleBusinessError(res, error, this.getAllErrorPatterns())) {
        return;
      }

      logger.error("Erro ao registrar resultados em lote", {}, error);
      this.handleGenericError(res, error, "registrar resultados em lote");
    }
  }
}

export default new PartidaController();
