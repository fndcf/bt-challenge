import { Router } from "express";
import partidaController from "../controllers/PartidaController";
import { requireAuth } from "../middlewares/auth";

const router = Router();

/**
 * Todas as rotas de partidas requerem autenticação
 */
router.use(requireAuth);

/**
 * @route   POST /api/partidas/resultados-lote
 * @desc    Registrar múltiplos resultados de partidas em lote (Dupla Fixa)
 * @access  Private
 */
router.post("/resultados-lote", (req, res) =>
  partidaController.registrarResultadosEmLote(req, res)
);

export default router;
