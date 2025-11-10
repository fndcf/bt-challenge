import express, { Application } from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import "./config/firebase";
import { initializeDatabase } from "./config/initDatabase";

// Middlewares
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler";
import { sanitizeRequest } from "./middlewares/validation";
// import { generalLimiter } from "./middlewares/rateLimiter"; // ← COMENTADO
import {
  requestLogger,
  errorLogger,
  slowRequestLogger,
} from "./middlewares/logger";

// Routes
import apiRoutes from "./routes/index";
import etapasRoutes from "./routes/etapas";

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());

// CORS SIMPLIFICADO (teste)
app.use(
  cors({
    origin: true, // ← TESTE: aceita qualquer origem
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

if (process.env.NODE_ENV === "development") {
  app.use(requestLogger);
  app.use(slowRequestLogger);
}

app.use(sanitizeRequest);

// COMENTADO (teste)
// app.use("/api", generalLimiter);

// ORDEM CORRETA: específicas primeiro
app.use("/api/etapas", etapasRoutes); // ← PRIMEIRO
app.use("/api", apiRoutes); // ← DEPOIS

app.use(notFoundHandler);

if (process.env.NODE_ENV === "development") {
  app.use(errorLogger);
}

app.use(errorHandler);

const startServer = async () => {
  try {
    await initializeDatabase();

    app.listen(PORT, () => {
      console.log("🚀 ================================");
      console.log(`🎾 Challenge BT API`);
      console.log(`📡 Servidor rodando na porta ${PORT}`);
      console.log(`🌍 Ambiente: ${process.env.NODE_ENV || "development"}`);
      console.log(`🔗 http://localhost:${PORT}`);
      console.log("🚀 ================================");
    });
  } catch (error) {
    console.error("❌ Erro ao iniciar servidor:", error);
    process.exit(1);
  }
};

startServer();

export default app;
