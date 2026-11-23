/**
 * Classe base para controllers com métodos utilitários
 */

import { Response } from "express";
import { AuthRequest } from "../middlewares/auth";
import { AppError } from "../utils/errors";
import { ResponseHelper } from "../utils/responseHelper";
import { z } from "zod";
import logger from "../utils/logger";

type Autenticada = AuthRequest & { user: NonNullable<AuthRequest["user"]> };

/** O que a rota recebe: requisição já autenticada */
export interface Contexto {
  req: Autenticada;
  res: Response;
  arenaId: string;
  uid: string;
}

export type Rota = (req: AuthRequest, res: Response) => Promise<void>;

export type PadraoErro = { pattern: string | RegExp; status: number };

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
   * Monta uma rota: confere o login e transforma os erros em resposta.
   *
   * @param operacao Para o log e a mensagem genérica ("Erro ao <operacao>")
   * @param erros Mensagens de regra de negócio repassadas a quem chamou
   */
  protected rota(
    operacao: string,
    executar: (contexto: Contexto) => Promise<unknown>,
    erros: PadraoErro[] = this.getAllErrorPatterns()
  ): Rota {
    return async (req, res) => {
      try {
        if (!this.checkAuth(req, res)) return;

        const { arenaId, uid } = req.user;
        await executar({ req, res, arenaId, uid });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return this.handleZodError(res, error);
        }

        if (this.handleBusinessError(res, error as Error, erros)) {
          return;
        }

        if (error instanceof AppError && error.statusCode < 500) {
          logger.warn(`${this.controllerName}: ${error.message}`);
          ResponseHelper.error(res, error.message, error.statusCode);
          return;
        }

        this.handleGenericError(res, error as Error, operacao, {
          ...req.params,
          arenaId: req.user?.arenaId,
        });
      }
    };
  }

  /**
   * Rota de consulta: não tem regra de negócio a explicar
   */
  protected consulta(
    operacao: string,
    executar: (contexto: Contexto) => Promise<unknown>
  ): Rota {
    return this.rota(operacao, executar, []);
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
