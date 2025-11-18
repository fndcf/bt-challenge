import { Router, Request, Response } from "express";
import arenaRoutes from "./arenaRoutes";
import jogadorRoutes from "./jogadores";
import etapaRoutes from "./etapas";
import partidaRoutes from "./partidas";

const router = Router();

/**
 * @route   GET /
 * @desc    Rota raiz da API
 * @access  Public
 */
router.get("/", (_req: Request, res: Response) => {
  // ✅ CORRIGIDO: _req
  res.json({
    message: "Challenge BT API",
    version: "1.0.0",
    status: "online",
    endpoints: {
      arenas: "/api/arenas",
      jogadores: "/api/jogadores",
      etapas: "/api/etapas",
      partidas: "/api/partidas",
    },
  });
});

/**
 * @route   GET /health
 * @desc    Health check
 * @access  Public
 */
router.get("/health", (_req: Request, res: Response) => {
  // ✅ CORRIGIDO: _req
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

/**
 * Rotas da aplicação
 */
router.use("/arenas", arenaRoutes);
router.use("/jogadores", jogadorRoutes);
router.use("/etapas", etapaRoutes);
router.use("/partidas", partidaRoutes);

/**
 * @route   * (404)
 * @desc    Rota não encontrada
 * @access  Public
 */
router.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: "Rota não encontrada",
  });
});

export default router;
