/**
 * Express App Configuration
 * backend/src/app.ts (ou index.ts)
 */

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import routes from "./routes";
import { errorHandler } from "./middlewares/errorHandler";
import logger from "./utils/logger";

const app = express();

/**
 * Configurações de segurança
 */
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

/**
 * Parsing de requisições
 */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Health check
 */
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

/**
 * Rotas da API
 */
app.use("/api", routes);

/**
 * Middleware de erro 404
 */
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: "Rota não encontrada",
  });
});

/**
 * Middleware de tratamento de erros
 */
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  errorHandler(err, _req, res, _next);
});

/**
 * Iniciar servidor
 */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  logger.info("Servidor iniciado com sucesso", {
    porta: PORT,
    ambiente: process.env.NODE_ENV || "development",
    firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
  });
});

export default app;
