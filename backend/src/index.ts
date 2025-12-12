/**
 * Express App Configuration
 */

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import * as functions from "firebase-functions";
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
    origin: true, // Permite todas as origens em produção (Firebase Hosting gerencia isso)
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
 * Exportar como Firebase Function (2nd gen)
 */
export const api = functions.https.onRequest(
  {
    timeoutSeconds: 30,
    memory: "512MiB",
  },
  app
);

/**
 * Iniciar servidor local (apenas em desenvolvimento)
 * Não inicia se estiver sendo executado pelo Firebase CLI (FIREBASE_CONFIG presente)
 */
if (
  process.env.NODE_ENV !== "production" &&
  !process.env.FIREBASE_CONFIG &&
  !process.env.GCLOUD_PROJECT
) {
  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    logger.info("Servidor iniciado com sucesso", {
      porta: PORT,
      ambiente: process.env.NODE_ENV || "development",
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
      frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
    });
  });
}

export default app;
