/**
 * ResponseHelper.ts
 * Helper para padronizar respostas HTTP da API
 * REFATORADO: Fase 5.2 - Correções e melhorias
 */

import { Response } from "express";

/**
 * Interface padrão de resposta da API
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: any;
}

/**
 * Interface para resposta paginada
 */
export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

/**
 * Helper para padronizar respostas HTTP
 * Garante consistência em todas as respostas da API
 */
export class ResponseHelper {
  /**
   * Resposta de sucesso (200)
   */
  static success<T>(
    res: Response,
    data?: T,
    message?: string
  ): Response<ApiResponse<T>> {
    return res.status(200).json({
      success: true,
      data,
      ...(message && { message }),
    });
  }

  /**
   * Resposta de criação bem-sucedida (201)
   */
  static created<T>(
    res: Response,
    data?: T,
    message = "Recurso criado com sucesso"
  ): Response<ApiResponse<T>> {
    return res.status(201).json({
      success: true,
      data,
      message,
    });
  }

  /**
   * Resposta de sucesso sem conteúdo (204)
   */
  static noContent(res: Response): Response {
    return res.status(204).send();
  }

  /**
   * Resposta paginada (200)
   */
  static paginated<T>(
    res: Response,
    data: T[],
    total: number,
    limit: number,
    offset: number
  ): Response<PaginatedResponse<T>> {
    return res.status(200).json({
      success: true,
      data,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + data.length < total,
      },
    });
  }

  /**
   * Resposta de erro genérico
   * @param res - Response do Express
   * @param message - Mensagem de erro
   * @param statusCode - Código HTTP (default: 500)
   */
  static error(
    res: Response,
    message: string,
    statusCode: number = 500
  ): Response<ApiResponse> {
    return res.status(statusCode).json({
      success: false,
      error: message,
    });
  }

  /**
   * Resposta de requisição inválida (400)
   */
  static badRequest(
    res: Response,
    error: string,
    details?: any
  ): Response<ApiResponse> {
    return res.status(400).json({
      success: false,
      error,
      ...(details && { details }),
    });
  }

  /**
   * Resposta de não autorizado (401)
   */
  static unauthorized(
    res: Response,
    error = "Não autorizado"
  ): Response<ApiResponse> {
    return res.status(401).json({
      success: false,
      error,
    });
  }

  /**
   * Resposta de proibido (403)
   */
  static forbidden(
    res: Response,
    error = "Acesso negado"
  ): Response<ApiResponse> {
    return res.status(403).json({
      success: false,
      error,
    });
  }

  /**
   * Resposta de não encontrado (404)
   */
  static notFound(
    res: Response,
    error = "Recurso não encontrado"
  ): Response<ApiResponse> {
    return res.status(404).json({
      success: false,
      error,
    });
  }

  /**
   * Resposta de conflito (409)
   */
  static conflict(
    res: Response,
    error: string
  ): Response<ApiResponse> {
    return res.status(409).json({
      success: false,
      error,
    });
  }

  /**
   * Resposta de erro de validação (422)
   */
  static validationError(
    res: Response,
    error: string | any[],
    details?: any
  ): Response<ApiResponse> {
    const errorMessage = Array.isArray(error) 
      ? "Erro de validação" 
      : error;
    const errorDetails = Array.isArray(error) 
      ? error 
      : details;

    return res.status(422).json({
      success: false,
      error: errorMessage,
      ...(errorDetails && { details: errorDetails }),
    });
  }

  /**
   * Resposta de muitas requisições (429)
   */
  static tooManyRequests(
    res: Response,
    error = "Muitas requisições. Tente novamente mais tarde.",
    retryAfter?: number
  ): Response<ApiResponse> {
    if (retryAfter) {
      res.setHeader("Retry-After", retryAfter.toString());
    }
    return res.status(429).json({
      success: false,
      error,
    });
  }

  /**
   * Resposta de erro interno do servidor (500)
   */
  static internalError(
    res: Response,
    error = "Erro interno do servidor",
    details?: any
  ): Response<ApiResponse> {
    return res.status(500).json({
      success: false,
      error,
      ...(process.env.NODE_ENV === "development" && details && { details }),
    });
  }

  /**
   * Resposta de serviço indisponível (503)
   */
  static serviceUnavailable(
    res: Response,
    error = "Serviço temporariamente indisponível"
  ): Response<ApiResponse> {
    return res.status(503).json({
      success: false,
      error,
    });
  }

  /**
   * Helper para determinar o método correto baseado no código de status
   */
  static fromStatusCode(
    res: Response,
    statusCode: number,
    message: string,
    data?: any
  ): Response<ApiResponse> {
    if (statusCode >= 200 && statusCode < 300) {
      return res.status(statusCode).json({
        success: true,
        data,
        message,
      });
    }

    return res.status(statusCode).json({
      success: false,
      error: message,
    });
  }
}
