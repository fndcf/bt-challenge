/**
 * Testes do errorHandler
 */

import {
  ApplicationError,
  getErrorMessage,
  getErrorMessageByCode,
  handleError,
  isAuthError,
  isValidationError,
  isNetworkError,
  logError,
} from "@/utils/errorHandler";

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
  describe("ApplicationError", () => {
    it("deve criar erro com todas as propriedades", () => {
      const error = new ApplicationError({
        message: "Erro de teste",
        code: "test/error",
        status: 400,
        field: "email",
        details: { extra: "info" },
      });

      expect(error.message).toBe("Erro de teste");
      expect(error.code).toBe("test/error");
      expect(error.status).toBe(400);
      expect(error.field).toBe("email");
      expect(error.details).toEqual({ extra: "info" });
      expect(error.name).toBe("ApplicationError");
    });

    it("deve criar erro apenas com mensagem", () => {
      const error = new ApplicationError({ message: "Erro simples" });

      expect(error.message).toBe("Erro simples");
      expect(error.code).toBeUndefined();
      expect(error.status).toBeUndefined();
    });

    it("deve ser instância de Error", () => {
      const error = new ApplicationError({ message: "Erro" });
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe("getErrorMessageByCode", () => {
    it("deve retornar mensagem para código de autenticação", () => {
      expect(getErrorMessageByCode("auth/user-not-found")).toBe(
        "Usuário não encontrado"
      );
      expect(getErrorMessageByCode("auth/wrong-password")).toBe(
        "Senha incorreta"
      );
      expect(getErrorMessageByCode("auth/invalid-credential")).toBe(
        "Email ou senha incorretos"
      );
    });

    it("deve retornar mensagem para código de validação", () => {
      expect(getErrorMessageByCode("validation/required-field")).toBe(
        "Campo obrigatório"
      );
      expect(getErrorMessageByCode("validation/invalid-email")).toBe(
        "Email inválido"
      );
    });

    it("deve retornar mensagem para código de negócio", () => {
      expect(getErrorMessageByCode("business/inscricoes-encerradas")).toBe(
        "Inscrições encerradas"
      );
      expect(getErrorMessageByCode("business/vagas-esgotadas")).toBe(
        "Vagas esgotadas"
      );
    });

    it("deve retornar mensagem para código HTTP", () => {
      expect(getErrorMessageByCode("401")).toBe(
        "Não autorizado. Faça login novamente"
      );
      expect(getErrorMessageByCode("404")).toBe("Recurso não encontrado");
      expect(getErrorMessageByCode("500")).toBe("Erro interno do servidor");
    });

    it("deve retornar undefined para código desconhecido", () => {
      expect(getErrorMessageByCode("unknown/code")).toBeUndefined();
    });
  });

  describe("getErrorMessage", () => {
    it("deve retornar mensagem de ApplicationError", () => {
      const error = new ApplicationError({ message: "Erro customizado" });
      expect(getErrorMessage(error)).toBe("Erro customizado");
    });

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

    it("deve retornar mensagem padrão para erro desconhecido", () => {
      expect(getErrorMessage({})).toBe("Erro desconhecido. Tente novamente");
      expect(getErrorMessage(null)).toBe("Erro desconhecido. Tente novamente");
    });
  });

  describe("isAuthError", () => {
    it("deve retornar true para código de autenticação", () => {
      expect(isAuthError({ code: "auth/user-not-found" })).toBe(true);
      expect(isAuthError({ code: "auth/wrong-password" })).toBe(true);
    });

    it("deve retornar true para status 401", () => {
      expect(isAuthError({ status: 401 })).toBe(true);
    });

    it("deve retornar true para erro Axios com status 401", () => {
      expect(
        isAuthError({ isAxiosError: true, response: { status: 401 } })
      ).toBe(true);
    });

    it("deve retornar false para outros erros", () => {
      expect(isAuthError({ code: "validation/error" })).toBe(false);
      expect(isAuthError({ status: 400 })).toBe(false);
      expect(isAuthError({})).toBe(false);
    });
  });

  describe("isValidationError", () => {
    it("deve retornar true para código de validação", () => {
      expect(isValidationError({ code: "validation/required-field" })).toBe(
        true
      );
      expect(isValidationError({ code: "validation/invalid-email" })).toBe(
        true
      );
    });

    it("deve retornar true para status 422", () => {
      expect(isValidationError({ status: 422 })).toBe(true);
    });

    it("deve retornar false para outros erros", () => {
      expect(isValidationError({ code: "auth/error" })).toBe(false);
      expect(isValidationError({ status: 400 })).toBe(false);
      expect(isValidationError({})).toBe(false);
    });
  });

  describe("isNetworkError", () => {
    it("deve retornar true para Network Error", () => {
      expect(isNetworkError({ message: "Network Error" })).toBe(true);
    });

    it("deve retornar true para ECONNABORTED", () => {
      expect(isNetworkError({ code: "ECONNABORTED" })).toBe(true);
    });

    it("deve retornar false para outros erros", () => {
      expect(isNetworkError({ message: "Outro erro" })).toBe(false);
      expect(isNetworkError({ code: "OTHER_CODE" })).toBe(false);
      expect(isNetworkError({})).toBe(false);
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

    it("deve retornar AppError para ApplicationError", () => {
      const error = new ApplicationError({
        message: "Erro app",
        code: "app/error",
        status: 400,
        field: "campo",
        details: { info: "extra" },
      });

      const result = handleError(error, "Contexto");

      expect(result.message).toBe("Erro app");
      expect(result.code).toBe("app/error");
      expect(result.status).toBe(400);
      expect(result.field).toBe("campo");
      expect(result.details).toEqual({ info: "extra" });
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
