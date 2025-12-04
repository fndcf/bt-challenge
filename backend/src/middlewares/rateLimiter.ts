import { Request, Response, NextFunction } from "express";
import { ResponseHelper } from "../utils/responseHelper";
import logger from "../utils/logger";

/**
 * Rate Limiter simples baseado em memória
 */

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

/**
 * Limpar registros expirados a cada 1 minuto
 */
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 60000);

export interface RateLimitOptions {
  windowMs: number; // Janela de tempo em milissegundos
  max: number; // Máximo de requisições
  message?: string; // Mensagem customizada
  keyGenerator?: (req: Request) => string; // Função para gerar chave única
}

/**
 * Middleware de rate limiting
 */
export const rateLimit = (options: RateLimitOptions) => {
  const {
    windowMs,
    max,
    message = "Muitas requisições. Tente novamente mais tarde.",
    keyGenerator = (req: Request) => req.ip || "unknown",
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req);
    const now = Date.now();

    // Inicializar ou resetar se expirou
    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 1,
        resetTime: now + windowMs,
      };
      return next();
    }

    // Incrementar contador
    store[key].count++;

    // Verificar se excedeu o limite
    if (store[key].count > max) {
      const retryAfter = Math.ceil((store[key].resetTime - now) / 1000);

      logger.warn("Rate limit atingido", {
        key,
        ip: req.ip,
        method: req.method,
        url: req.url,
        count: store[key].count,
        limit: max,
        retryAfter: `${retryAfter}s`,
        userAgent: req.get("user-agent"),
      });

      res.setHeader("Retry-After", retryAfter.toString());
      res.setHeader("X-RateLimit-Limit", max.toString());
      res.setHeader("X-RateLimit-Remaining", "0");
      res.setHeader("X-RateLimit-Reset", store[key].resetTime.toString());

      return ResponseHelper.error(res, message, 429);
    }

    // Adicionar headers informativos
    res.setHeader("X-RateLimit-Limit", max.toString());
    res.setHeader("X-RateLimit-Remaining", (max - store[key].count).toString());
    res.setHeader("X-RateLimit-Reset", store[key].resetTime.toString());

    next();
  };
};

/**
 * Rate limiters pré-configurados
 */

// Rate limiter geral (100 requisições por 15 minutos)
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,
});

// Rate limiter estrito para operações críticas (5 por hora)
export const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5,
  message: "Limite de operações excedido. Aguarde 1 hora.",
});

// Rate limiter para criação (20 por hora)
export const createLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 20,
  message: "Limite de criações excedido. Aguarde 1 hora.",
});

// Rate limiter para autenticação (5 tentativas por 15 minutos)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5,
  message: "Muitas tentativas de login. Aguarde 15 minutos.",
  keyGenerator: (req: Request) => {
    // Usar email se disponível, senão IP
    return req.body?.email || req.ip || "unknown";
  },
});
