/**
 * Testes do errorHandler
 */

import { getErrorMessage, handleError, logError } from "@/utils/errorHandler";

// Mock do logger
jest.mock("@/utils/logger", () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

describe("errorHandler", () => {
  describe("getErrorMessage", () => {
    it("deve traduzir código de erro do Firebase", () => {
      const error = { code: "auth/user-not-found" };
      expect(getErrorMessage(error)).toBe("Usuário não encontrado");
    });

    it("deve retornar mensagem do backend via Axios", () => {
      const error = {
        isAxiosError: true,
        response: {
          data: { error: "Mensagem do servidor" },
          status: 400,
        },
      };
      expect(getErrorMessage(error)).toBe("Mensagem do servidor");
    });

    it("deve retornar mensagem HTTP para erro Axios sem mensagem", () => {
      const error = {
        isAxiosError: true,
        response: {
          status: 401,
        },
      };
      expect(getErrorMessage(error)).toBe("Não autorizado. Faça login novamente");
    });

    it("deve retornar mensagem de erro de rede", () => {
      const error = {
        isAxiosError: true,
        message: "Network Error",
      };
      expect(getErrorMessage(error)).toBe(
        "Erro de conexão. Verifique sua internet"
      );
    });

    it("deve retornar mensagem genérica de erro", () => {
      const error = { message: "Algo deu errado" };
      expect(getErrorMessage(error)).toBe("Algo deu errado");
    });

    it("deve usar a mensagem do Error", () => {
      expect(getErrorMessage(new Error("Falhou"))).toBe("Falhou");
    });

    it("deve retornar mensagem padrão para erro desconhecido", () => {
      expect(getErrorMessage({})).toBe("Erro desconhecido. Tente novamente");
      expect(getErrorMessage(null)).toBe("Erro desconhecido. Tente novamente");
    });
  });

  describe("logError", () => {
    const logger = require("@/utils/logger").default;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("deve logar erro com contexto", () => {
      const error = new Error("Erro de teste");
      logError(error, "TestContext");

      expect(logger.error).toHaveBeenCalled();
    });

    it("deve logar erro sem contexto", () => {
      const error = new Error("Erro");
      logError(error);

      expect(logger.error).toHaveBeenCalled();
    });

    it("deve logar objeto de erro", () => {
      const error = { message: "Erro objeto" };
      logError(error, "Contexto");

      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe("handleError", () => {
    const logger = require("@/utils/logger").default;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("deve retornar AppError para erro Axios", () => {
      const error = {
        isAxiosError: true,
        response: {
          status: 404,
          data: { code: "not-found", message: "Não encontrado" },
        },
      };

      const result = handleError(error);

      expect(result.status).toBe(404);
      expect(result.code).toBe("not-found");
    });

    it("deve retornar AppError básico para erro genérico", () => {
      const error = { message: "Erro genérico" };

      const result = handleError(error);

      expect(result.message).toBe("Erro genérico");
    });

    it("deve chamar logError", () => {
      const error = new Error("Erro");
      handleError(error, "Contexto");

      expect(logger.error).toHaveBeenCalled();
    });
  });
});
