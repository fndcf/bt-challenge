import { Router } from "express";
import { ResponseHelper } from "../utils/responseHelper";

// Importar routers específicos
import arenaRoutes from "./arenaRoutes";
import jogadoresRoutes from "./jogadores";
import etapasRoutes from "./etapas";
import partidasRoutes from "./partidas";
// import authRoutes from './authRoutes';

const router = Router();

/**
 * Rota raiz da API
 */
router.get("/", (req, res) => {
  ResponseHelper.success(res, {
    message: "Challenge BT API v1.0",
    version: "1.0.0",
    endpoints: {
      arenas: "/api/arenas",
      jogadores: "/api/jogadores",
      etapas: "/api/etapas",
      auth: "/api/auth",
      public: "/api/public",
    },
    documentation: "https://docs.challengebt.com.br",
  });
});

/**
 * Health check detalhado
 */
router.get("/health", (req, res) => {
  ResponseHelper.success(res, {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    version: "1.0.0",
  });
});

/**
 * Registrar rotas específicas
 */
router.use("/arenas", arenaRoutes);
router.use("/jogadores", jogadoresRoutes);
router.use("/etapas", etapasRoutes);
router.use("/partidas", partidasRoutes);
// router.use('/auth', authRoutes);

/**
 * Rota de teste (apenas desenvolvimento)
 */
if (process.env.NODE_ENV === "development") {
  router.get("/test", (req, res) => {
    ResponseHelper.success(res, {
      message: "Rota de teste funcionando!",
      headers: req.headers,
      query: req.query,
      params: req.params,
    });
  });
}

export default router;
