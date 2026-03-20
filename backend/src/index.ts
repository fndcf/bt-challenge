/**
 * Express App Configuration
 * Version: 2025-12-13-v2
 */

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import * as functions from "firebase-functions";
/**
import * as functionsV1 from "firebase-functions/v1";
import { auth as adminAuth } from "./config/firebase";
*/
import routes from "./routes";
import { errorHandler } from "./middlewares/errorHandler";
import logger from "./utils/logger";

const app = express();

/**
 * Configurações de segurança
 */
app.use(helmet());

/**
 * CORS - Em produção, restringe às origens permitidas
 * Em desenvolvimento, aceita localhost
 */
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : ["http://localhost:3000"];

app.use(
  cors({
    origin: (origin, callback) => {
      // Permitir requests sem origin (ex: mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error(`Origin ${origin} não permitida pelo CORS`));
    },
    credentials: true,
  }),
);

/**
 * Parsing de requisições
 * Pular json/urlencoded para multipart (busboy lida com upload)
 */
app.use((req: Request, res: Response, next: NextFunction) => {
  if ((req.headers["content-type"] || "").includes("multipart/form-data")) {
    return next();
  }
  express.json()(req, res, next);
});
app.use((req: Request, res: Response, next: NextFunction) => {
  if ((req.headers["content-type"] || "").includes("multipart/form-data")) {
    return next();
  }
  express.urlencoded({ extended: true })(req, res, next);
});

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
  app,
);

/**
 * Trigger: desabilitar novos usuários automaticamente.
 * O administrador habilita manualmente pelo Firebase Console.
 
export const onUserCreated = functionsV1.auth.user().onCreate(async (user) => {
  try {
    await adminAuth.updateUser(user.uid, { disabled: true });
    logger.info("Novo usuário criado e desabilitado automaticamente", {
      uid: user.uid,
      email: user.email,
    });
  } catch (error: any) {
    logger.error(
      "Erro ao desabilitar novo usuário",
      { uid: user.uid, email: user.email },
      error
    );
  }
});

*/

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
