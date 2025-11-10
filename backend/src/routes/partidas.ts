import express from "express";
import { authenticate as auth } from "../middlewares/auth";
import partidaController from "../controllers/PartidaController";

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(auth);

/**
 * @route   PUT /api/partidas/:id/resultado
 * @desc    Registrar resultado de uma partida
 * @access  Private (Admin da arena)
 */
router.put("/:id/resultado", (req, res) =>
  partidaController.registrarResultado(req, res)
);

export default router;
