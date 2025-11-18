import { Request, Response, NextFunction } from "express";

/**
 * Cores para o console (apenas em desenvolvimento)
 */
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",

  // Métodos HTTP
  get: "\x1b[32m", // Verde
  post: "\x1b[33m", // Amarelo
  put: "\x1b[34m", // Azul
  delete: "\x1b[31m", // Vermelho
  patch: "\x1b[35m", // Magenta

  // Status codes
  success: "\x1b[32m", // 2xx - Verde
  redirect: "\x1b[36m", // 3xx - Cyan
  clientError: "\x1b[33m", // 4xx - Amarelo
  serverError: "\x1b[31m", // 5xx - Vermelho
};

/**
 * Obter cor baseada no método HTTP
 */
const getMethodColor = (method: string): string => {
  const methodColors: { [key: string]: string } = {
    GET: colors.get,
    POST: colors.post,
    PUT: colors.put,
    DELETE: colors.delete,
    PATCH: colors.patch,
  };
  return methodColors[method] || colors.reset;
};

/**
 * Obter cor baseada no status code
 */
const getStatusColor = (status: number): string => {
  if (status >= 500) return colors.serverError;
  if (status >= 400) return colors.clientError;
  if (status >= 300) return colors.redirect;
  if (status >= 200) return colors.success;
  return colors.reset;
};

/**
 * Formatar duração
 */
const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};

/**
 * Middleware de logging de requisições
 */
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Apenas em desenvolvimento
  if (process.env.NODE_ENV !== "development") {
    return next();
  }

  const startTime = Date.now();
  const { method, url, ip } = req;

  // Capturar quando a resposta terminar
  res.on("finish", () => {
    const duration = Date.now() - startTime;
    const { statusCode } = res;

    const methodColor = getMethodColor(method);
    const statusColor = getStatusColor(statusCode);

    // Formato: [GET] /api/jogadores - 200 - 45ms - ::1
    console.log(
      `${colors.dim}[${new Date().toISOString()}]${colors.reset} ` +
        `${methodColor}${colors.bright}${method.padEnd(7)}${colors.reset} ` +
        `${url.padEnd(40)} ` +
        `${statusColor}${statusCode}${colors.reset} ` +
        `${colors.dim}${formatDuration(duration).padStart(8)} - ${ip}${
          colors.reset
        }`
    );
  });

  next();
};

/**
 * Middleware de logging de erros detalhado
 */
export const errorLogger = (err: Error, req: Request, next: NextFunction) => {
  // Log detalhado do erro
  console.error("\n" + "=".repeat(80));
  console.error(
    `${colors.serverError}${colors.bright}❌ ERRO CAPTURADO${colors.reset}`
  );
  console.error("=".repeat(80));
  console.error(
    `${colors.bright}Timestamp:${colors.reset}`,
    new Date().toISOString()
  );
  console.error(`${colors.bright}Método:${colors.reset}`, req.method);
  console.error(`${colors.bright}URL:${colors.reset}`, req.url);
  console.error(`${colors.bright}IP:${colors.reset}`, req.ip);
  console.error(
    `${colors.bright}User Agent:${colors.reset}`,
    req.get("user-agent")
  );
  console.error(`${colors.bright}Nome do Erro:${colors.reset}`, err.name);
  console.error(`${colors.bright}Mensagem:${colors.reset}`, err.message);

  if (process.env.NODE_ENV === "development") {
    console.error(`${colors.bright}Stack:${colors.reset}`);
    console.error(err.stack);
  }

  if (req.body && Object.keys(req.body).length > 0) {
    console.error(
      `${colors.bright}Body:${colors.reset}`,
      JSON.stringify(req.body, null, 2)
    );
  }

  console.error("=".repeat(80) + "\n");

  // Passar para o próximo middleware de erro
  next(err);
};

/**
 * Middleware para logar requisições lentas (> 1 segundo)
 */
export const slowRequestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const startTime = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - startTime;

    if (duration > 1000) {
      console.warn(
        `${colors.clientError}⚠️  REQUISIÇÃO LENTA:${colors.reset} ` +
          `${req.method} ${req.url} - ${formatDuration(duration)}`
      );
    }
  });

  next();
};
