/**
 * PartidaController.ts
 * Controller para gerenciar partidas
 * REFATORADO: Fase 5.2 - Usando ResponseHelper e BaseController
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
   * Registrar resultado de uma partida
   * PUT /api/partidas/:id/resultado
   */
  async registrarResultado(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!this.checkAuth(req, res)) return;

      const { arenaId } = req.user;
      const { id } = req.params;
      const { placar } = req.body;

      // Validação do placar
      if (!placar || !Array.isArray(placar) || placar.length === 0) {
        ResponseHelper.badRequest(res, "Placar inválido"); return;
      }

      await chaveService.registrarResultadoPartida(id, arenaId, placar);

      logger.info("Resultado registrado", {
        partidaId: id,
        placar,
        arenaId,
      });

      ResponseHelper.success(res, null, "Resultado registrado com sucesso");
    } catch (error: any) {
      if (this.handleBusinessError(res, error, this.getAllErrorPatterns())) {
        return;
      }

      logger.error("Erro ao registrar resultado", { partidaId: req.params.id }, error);
      this.handleGenericError(res, error, "registrar resultado");
    }
  }
}

export default new PartidaController();
