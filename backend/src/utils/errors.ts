/**
 * Classes de erro customizadas para melhor tratamento de erros
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  public readonly errors: any;

  constructor(message: string, errors?: any) {
    super(message, 422);
    this.errors = errors;
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Recurso não encontrado") {
    super(message, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Não autorizado") {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Acesso negado") {
    super(message, 403);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = "Conflito de dados") {
    super(message, 409);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = "Requisição inválida") {
    super(message, 400);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = "Erro interno do servidor") {
    super(message, 500, false);
  }
}
