import { Request, Response, NextFunction } from "express";
import { AppError, ValidationError } from "../utils/errors";
import { ResponseHelper } from "../utils/responseHelper";

/**
 * Middleware global de tratamento de erros
 * Deve ser o último middleware registrado no Express
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Log do erro (em produção, usar um serviço de logging como Winston ou Sentry)
  console.error("❌ Erro capturado:", {
    name: err.name,
    message: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // Se for um erro operacional conhecido (AppError)
  if (err instanceof AppError) {
    // Se for erro de validação, incluir detalhes
    if (err instanceof ValidationError) {
      return ResponseHelper.validationError(res, err.errors);
    }

    // Outros erros operacionais
    return ResponseHelper.error(res, err.message, err.statusCode);
  }

  // Erros do Firebase
  if (err.name === "FirebaseError") {
    return ResponseHelper.error(res, "Erro no Firebase", 500);
  }

  // Erro de validação do express-validator
  if (err.name === "ValidationError") {
    return ResponseHelper.validationError(res, err.message);
  }

  // Erro de sintaxe JSON
  if (err instanceof SyntaxError && "body" in err) {
    return ResponseHelper.error(res, "JSON inválido", 400);
  }

  // Erro genérico não tratado
  const message =
    process.env.NODE_ENV === "development"
      ? err.message
      : "Erro interno do servidor";

  return ResponseHelper.internalError(res, message);
};

/**
 * Middleware para capturar erros assíncronos
 * Envolve funções async para capturar erros automaticamente
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Middleware para rotas não encontradas (404)
 */
export const notFoundHandler = (req: Request, res: Response) => {
  ResponseHelper.notFound(
    res,
    `Rota não encontrada: ${req.method} ${req.path}`
  );
};
