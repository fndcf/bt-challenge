/**
 * Partida Routes
 * backend/src/routes/partidas.ts
 * CORRIGIDO: Usando arrow functions para manter contexto 'this'
 */

import { Router } from "express";
import partidaController from "../controllers/PartidaController";
import { requireAuth } from "../middlewares/auth";

const router = Router();

/**
 * Todas as rotas de partidas requerem autenticação
 */
router.use(requireAuth);

/**
 * @route   PUT /api/partidas/:id/resultado
 * @desc    Registrar resultado de uma partida
 * @access  Private
 */
router.put("/:id/resultado", (req, res) => partidaController.registrarResultado(req, res));

export default router;
