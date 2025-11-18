import { Router } from "express";
import partidaController from "../controllers/PartidaController";
import { requireAuth } from "../middlewares/auth";

const router = Router();

/**
 * Todas as rotas de partidas requerem autenticação
 */
router.use(requireAuth); // ✅ CORRETO: Middleware com assinatura completa

/**
 * @route   PUT /api/partidas/:id/resultado
 * @desc    Registrar resultado de uma partida
 * @access  Private
 */
router.put("/:id/resultado", partidaController.registrarResultado);

export default router;
