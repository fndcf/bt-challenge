import { Response } from "express";

/**
 * Helpers para padronizar respostas da API
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export class ResponseHelper {
  /**
   * Resposta de sucesso
   */
  static success<T>(
    res: Response,
    data: T,
    message?: string,
    statusCode: number = 200
  ) {
    const response: ApiResponse<T> = {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
    };

    return res.status(statusCode).json(response);
  }

  /**
   * Resposta de erro
   */
  static error(
    res: Response,
    error: string,
    statusCode: number = 400,
    details?: any
  ) {
    const response: ApiResponse = {
      success: false,
      error,
      timestamp: new Date().toISOString(),
      ...(details && { details }),
    };

    return res.status(statusCode).json(response);
  }

  /**
   * Resposta de criação (201)
   */
  static created<T>(
    res: Response,
    data: T,
    message: string = "Criado com sucesso"
  ) {
    return this.success(res, data, message, 201);
  }

  /**
   * Resposta sem conteúdo (204)
   */
  static noContent(res: Response) {
    return res.status(204).send();
  }

  /**
   * Resposta não encontrado (404)
   */
  static notFound(res: Response, message: string = "Recurso não encontrado") {
    return this.error(res, message, 404);
  }

  /**
   * Resposta não autorizado (401)
   */
  static unauthorized(res: Response, message: string = "Não autorizado") {
    return this.error(res, message, 401);
  }

  /**
   * Resposta proibido (403)
   */
  static forbidden(res: Response, message: string = "Acesso negado") {
    return this.error(res, message, 403);
  }

  /**
   * Resposta de validação (422)
   */
  static validationError(res: Response, errors: any) {
    const response: ApiResponse = {
      success: false,
      error: "Erro de validação",
      details: errors,
      timestamp: new Date().toISOString(),
    };

    return res.status(422).json(response);
  }

  /**
   * Resposta de erro interno (500)
   */
  static internalError(
    res: Response,
    message: string = "Erro interno do servidor"
  ) {
    return this.error(res, message, 500);
  }
}
