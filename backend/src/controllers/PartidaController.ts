import { Response } from "express";
import { AuthRequest } from "../middlewares/auth";
import chaveService from "../services/ChaveService";

/**
 * Controller para gerenciar partidas
 */
class PartidaController {
  /**
   * Registrar resultado de uma partida
   * PUT /api/partidas/:id/resultado
   */
  async registrarResultado(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { arenaId } = req.user!;
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

      res.json({
        success: true,
        message: "Resultado registrado com sucesso",
      });
    } catch (error: any) {
      console.error("Erro ao registrar resultado:", error);

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
