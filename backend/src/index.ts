import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import routes from "./routes";
import { errorHandler } from "./middlewares/errorHandler";

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
 * ✅ CORRIGIDO: Assinatura completa com 4 parâmetros
 */
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  // ✅ 4 parâmetros
  errorHandler(err, _req, res, _next);
});

/**
 * Iniciar servidor
 */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔥 Firebase projeto: ${process.env.FIREBASE_PROJECT_ID}`);
});

export default app;
