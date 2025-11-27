/**
 * Partida Controller
 * backend/src/controllers/PartidaController.ts
 */

import { Response } from "express";
import { AuthRequest } from "../middlewares/auth";
import chaveService from "../services/ChaveService";
import logger from "../utils/logger";

class PartidaController {
  /**
   * Registrar resultado de uma partida
   * PUT /api/partidas/:id/resultado
   */
  async registrarResultado(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.arenaId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      const arenaId = req.user.arenaId;
      const { id } = req.params;
      const { placar } = req.body;

      if (!placar || !Array.isArray(placar) || placar.length === 0) {
        res.status(400).json({
          success: false,
          error: "Placar inválido",
        });
        return;
      }

      await chaveService.registrarResultadoPartida(id, arenaId, placar);

      logger.info("Resultado registrado", {
        partidaId: id,
        placar,
        arenaId,
      });

      res.json({
        success: true,
        message: "Resultado registrado com sucesso",
      });
    } catch (error: any) {
      logger.error(
        "Erro ao registrar resultado",
        { partidaId: req.params.id },
        error
      );

      if (
        error.message.includes("não encontrada") ||
        error.message.includes("inválid")
      ) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: "Erro ao registrar resultado",
      });
    }
  }
}

export default new PartidaController();
