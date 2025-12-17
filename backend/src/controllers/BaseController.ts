/**
 * Classe base para controllers com métodos utilitários
 */

import { Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/auth";
import { ResponseHelper } from "../utils/responseHelper";
import { z } from "zod";
import logger from "../utils/logger";

/**
 * Tipo para handler de controller
 */
type ControllerHandler = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => Promise<void>;

/**
 * Opções para o wrapper de handler
 */
interface HandlerOptions {
  /** Se true, requer autenticação (default: true) */
  requireAuth?: boolean;
  /** Nome da operação para logging */
  operation?: string;
  /** Contexto adicional para logs */
  logContext?: (req: AuthRequest) => Record<string, any>;
}

/**
 * Classe base para controllers
 * Fornece métodos utilitários para reduzir código repetitivo
 */
export abstract class BaseController {
  /**
   * Nome do controller para logging
   */
  protected abstract controllerName: string;

  /**
   * Verifica se o usuário está autenticado e retorna os dados
   * @throws Retorna 401 se não autenticado
   */
  protected checkAuth(
    req: AuthRequest,
    res: Response
  ): req is AuthRequest & { user: NonNullable<AuthRequest["user"]> } {
    if (!req.user?.arenaId || !req.user?.uid) {
      ResponseHelper.unauthorized(res, "Usuário não autenticado");
      return false;
    }
    return true;
  }

  /**
   * Extrai arenaId do request autenticado
   */
  protected getArenaId(req: AuthRequest): string | null {
    return req.user?.arenaId || null;
  }

  /**
   * Extrai uid do request autenticado
   */
  protected getUserId(req: AuthRequest): string | null {
    return req.user?.uid || null;
  }

  /**
   * Trata erros de validação Zod
   */
  protected handleZodError(res: Response, error: z.ZodError): void {
    logger.warn(`${this.controllerName}: Dados inválidos`, {
      errors: error.issues,
    });
    ResponseHelper.validationError(res, "Dados inválidos", error.issues);
  }

  /**
   * Trata erros de negócio (mensagens conhecidas)
   */
  protected handleBusinessError(
    res: Response,
    error: Error,
    patterns: { pattern: string | RegExp; status: number }[]
  ): boolean {
    const message = error.message.toLowerCase();

    for (const { pattern, status } of patterns) {
      const matches =
        typeof pattern === "string"
          ? message.includes(pattern.toLowerCase())
          : pattern.test(message);

      if (matches) {
        logger.warn(`${this.controllerName}: ${error.message}`);
        ResponseHelper.error(res, error.message, status);
        return true;
      }
    }

    return false;
  }

  /**
   * Trata erro genérico (500)
   */
  protected handleGenericError(
    res: Response,
    error: Error,
    operation: string,
    context?: Record<string, any>
  ): void {
    logger.error(
      `${this.controllerName}: Erro em ${operation}`,
      context,
      error
    );
    ResponseHelper.internalError(res, `Erro ao ${operation}`);
  }

  /**
   * Wrapper para handlers que automatiza verificação de auth e tratamento de erros
   */
  protected wrapHandler(
    handler: (req: AuthRequest, res: Response) => Promise<void>,
    options: HandlerOptions = {}
  ): ControllerHandler {
    const {
      requireAuth = true,
      operation = "executar operação",
      logContext,
    } = options;

    return async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        // Verificar autenticação se necessário
        if (requireAuth && !this.checkAuth(req, res)) {
          return;
        }

        // Executar handler
        await handler(req, res);
      } catch (error: any) {
        // Log com contexto
        const context = logContext ? logContext(req) : {};
        logger.error(
          `${this.controllerName}: Erro em ${operation}`,
          context,
          error
        );

        // Passar para error handler global
        next(error);
      }
    };
  }

  /**
   * Padrões comuns de erro de negócio
   */
  protected static readonly ERROR_PATTERNS = {
    NOT_FOUND: [
      { pattern: "não encontrad", status: 404 },
      { pattern: "not found", status: 404 },
    ],
    CONFLICT: [
      { pattern: "já existe", status: 409 },
      { pattern: "already exists", status: 409 },
      { pattern: "duplicad", status: 409 },
    ],
    BAD_REQUEST: [
      { pattern: "inválid", status: 400 },
      { pattern: "deve", status: 400 },
      { pattern: "não pode", status: 400 },
      { pattern: "não é possível", status: 400 },
      { pattern: "mínimo", status: 400 },
      { pattern: "máximo", status: 400 },
      { pattern: "já", status: 400 },
      { pattern: "atingiu", status: 400 },
      { pattern: "após", status: 400 },
      { pattern: "possui", status: 400 },
      { pattern: "inscrit", status: 400 },
      { pattern: "chaves", status: 400 },
    ],
  };

  /**
   * Combina padrões de erro para uso no handleBusinessError
   */
  protected getAllErrorPatterns() {
    return [
      ...BaseController.ERROR_PATTERNS.NOT_FOUND,
      ...BaseController.ERROR_PATTERNS.CONFLICT,
      ...BaseController.ERROR_PATTERNS.BAD_REQUEST,
    ];
  }
}
