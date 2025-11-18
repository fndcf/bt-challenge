import { Response } from "express";

/**
 * Interface padrão de resposta da API
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: any; // ✅ ADICIONADO: Para erros de validação detalhados
}

/**
 * Helper para padronizar respostas HTTP
 */
export class ResponseHelper {
  static error(
    _res: Response<any, Record<string, any>>,
    _message: string,
    _statusCode: number
  ) {
    throw new Error("Method not implemented.");
  }
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
   * Resposta de requisição inválida (400)
   */
  static badRequest(
    res: Response,
    error: string,
    details?: any // ✅ ADICIONADO: Detalhes opcionais
  ): Response<ApiResponse> {
    return res.status(400).json({
      success: false,
      error,
      ...(details && { details }), // ✅ Só inclui se houver
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
  static conflict(res: Response, error: string): Response<ApiResponse> {
    return res.status(409).json({
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
    details?: any // ✅ ADICIONADO: Detalhes opcionais (apenas em dev)
  ): Response<ApiResponse> {
    return res.status(500).json({
      success: false,
      error,
      ...(process.env.NODE_ENV === "development" && details && { details }), // ✅ Só mostra em dev
    });
  }

  /**
   * Resposta de erro de validação (422)
   */
  static validationError(
    res: Response,
    error: string,
    details?: any // ✅ Campo para detalhes da validação
  ): Response<ApiResponse> {
    return res.status(422).json({
      success: false,
      error,
      details, // ✅ CORRIGIDO: Agora existe na interface
    });
  }
}
