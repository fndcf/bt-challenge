/**
 * Testes dos Middlewares de Tratamento de Erros
 */

jest.mock("../../utils/logger", () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    critical: jest.fn(),
  },
}));

jest.mock("../../utils/responseHelper", () => ({
  ResponseHelper: {
    error: jest.fn(),
    validationError: jest.fn(),
    notFound: jest.fn(),
    internalError: jest.fn(),
  },
}));

import { Request, Response, NextFunction } from "express";
import {
  errorHandler,
  asyncHandler,
  notFoundHandler,
} from "../../middlewares/errorHandler";
import {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
} from "../../utils/errors";
import { ResponseHelper } from "../../utils/responseHelper";

describe("Error Handler Middlewares", () => {
  let mockRequest: Record<string, any>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      path: "/api/test",
      method: "GET",
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe("errorHandler", () => {
    it("deve tratar AppError com statusCode correto", () => {
      const error = new AppError("Erro de aplicação", 400);

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.error).toHaveBeenCalledWith(
        mockResponse,
        "Erro de aplicação",
        400
      );
    });

    it("deve tratar ValidationError com detalhes", () => {
      const errors = [
        { field: "email", message: "Email inválido" },
        { field: "nome", message: "Nome é obrigatório" },
      ];
      const error = new ValidationError("Erro de validação", errors);

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.validationError).toHaveBeenCalledWith(
        mockResponse,
        errors
      );
    });

    it("deve tratar NotFoundError", () => {
      const error = new NotFoundError("Recurso não encontrado");

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.error).toHaveBeenCalledWith(
        mockResponse,
        "Recurso não encontrado",
        404
      );
    });

    it("deve tratar UnauthorizedError", () => {
      const error = new UnauthorizedError("Não autorizado");

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.error).toHaveBeenCalledWith(
        mockResponse,
        "Não autorizado",
        401
      );
    });

    it("deve tratar erros do Firebase", () => {
      const error = new Error("Firebase error");
      error.name = "FirebaseError";

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.error).toHaveBeenCalledWith(
        mockResponse,
        "Erro no Firebase",
        500
      );
    });

    it("deve tratar ValidationError do express-validator", () => {
      const error = new Error("Validation failed");
      error.name = "ValidationError";

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.validationError).toHaveBeenCalledWith(
        mockResponse,
        "Validation failed"
      );
    });

    it("deve tratar erros de sintaxe JSON", () => {
      const error = new SyntaxError("Unexpected token");
      (error as any).body = true;

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.error).toHaveBeenCalledWith(
        mockResponse,
        "JSON inválido",
        400
      );
    });

    it("deve tratar erro genérico em produção", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      const error = new Error("Erro interno detalhado");

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.internalError).toHaveBeenCalledWith(
        mockResponse,
        "Erro interno do servidor"
      );

      process.env.NODE_ENV = originalEnv;
    });

    it("deve mostrar mensagem de erro em desenvolvimento", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      const error = new Error("Erro interno detalhado");

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(ResponseHelper.internalError).toHaveBeenCalledWith(
        mockResponse,
        "Erro interno detalhado"
      );

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe("asyncHandler", () => {
    it("deve executar função async com sucesso", async () => {
      const mockAsyncFn = jest.fn().mockResolvedValue("success");

      const wrappedFn = asyncHandler(mockAsyncFn);
      await wrappedFn(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockAsyncFn).toHaveBeenCalledWith(
        mockRequest,
        mockResponse,
        mockNext
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("deve capturar erro e passar para next", async () => {
      const error = new Error("Async error");
      const mockAsyncFn = jest.fn().mockRejectedValue(error);

      const wrappedFn = asyncHandler(mockAsyncFn);
      await wrappedFn(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it("deve funcionar com funções síncronas", async () => {
      const mockSyncFn = jest.fn().mockReturnValue("sync result");

      const wrappedFn = asyncHandler(mockSyncFn);
      await wrappedFn(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockSyncFn).toHaveBeenCalled();
    });

    it("deve capturar erros síncronos", async () => {
      const error = new Error("Sync error");
      const mockSyncFn = jest.fn().mockRejectedValue(error);

      const wrappedFn = asyncHandler(mockSyncFn);
      await wrappedFn(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("notFoundHandler", () => {
    it("deve retornar 404 com método e path corretos", () => {
      mockRequest.method = "POST";
      mockRequest.path = "/api/users";

      notFoundHandler(mockRequest as Request, mockResponse as Response);

      expect(ResponseHelper.notFound).toHaveBeenCalledWith(
        mockResponse,
        "Rota não encontrada: POST /api/users"
      );
    });

    it("deve funcionar com diferentes métodos HTTP", () => {
      const methods = ["GET", "POST", "PUT", "DELETE", "PATCH"];

      methods.forEach((method) => {
        jest.clearAllMocks();
        mockRequest.method = method;
        mockRequest.path = "/test";

        notFoundHandler(mockRequest as Request, mockResponse as Response);

        expect(ResponseHelper.notFound).toHaveBeenCalledWith(
          mockResponse,
          `Rota não encontrada: ${method} /test`
        );
      });
    });
  });
});
