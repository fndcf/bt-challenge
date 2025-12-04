/**
 * Testes das classes de erro
 */

import {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  BadRequestError,
  InternalServerError,
} from "../../utils/errors";

describe("errors", () => {
  describe("AppError", () => {
    it("deve criar erro com valores padrão", () => {
      const error = new AppError("Erro genérico");

      expect(error.message).toBe("Erro genérico");
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
      expect(error).toBeInstanceOf(Error);
    });

    it("deve criar erro com statusCode personalizado", () => {
      const error = new AppError("Erro customizado", 418);

      expect(error.statusCode).toBe(418);
    });

    it("deve criar erro não operacional", () => {
      const error = new AppError("Erro crítico", 500, false);

      expect(error.isOperational).toBe(false);
    });

    it("deve ter stack trace", () => {
      const error = new AppError("Teste");

      expect(error.stack).toBeDefined();
    });
  });

  describe("ValidationError", () => {
    it("deve ter statusCode 422", () => {
      const error = new ValidationError("Dados inválidos");

      expect(error.statusCode).toBe(422);
      expect(error.isOperational).toBe(true);
    });

    it("deve armazenar errors detalhados", () => {
      const errors = { nome: "Nome é obrigatório", email: "Email inválido" };
      const error = new ValidationError("Validação falhou", errors);

      expect(error.errors).toEqual(errors);
    });

    it("deve funcionar sem errors", () => {
      const error = new ValidationError("Erro simples");

      expect(error.errors).toBeUndefined();
    });
  });

  describe("NotFoundError", () => {
    it("deve ter statusCode 404", () => {
      const error = new NotFoundError();

      expect(error.statusCode).toBe(404);
      expect(error.message).toBe("Recurso não encontrado");
    });

    it("deve aceitar mensagem personalizada", () => {
      const error = new NotFoundError("Jogador não encontrado");

      expect(error.message).toBe("Jogador não encontrado");
    });
  });

  describe("UnauthorizedError", () => {
    it("deve ter statusCode 401", () => {
      const error = new UnauthorizedError();

      expect(error.statusCode).toBe(401);
      expect(error.message).toBe("Não autorizado");
    });

    it("deve aceitar mensagem personalizada", () => {
      const error = new UnauthorizedError("Token expirado");

      expect(error.message).toBe("Token expirado");
    });
  });

  describe("ForbiddenError", () => {
    it("deve ter statusCode 403", () => {
      const error = new ForbiddenError();

      expect(error.statusCode).toBe(403);
      expect(error.message).toBe("Acesso negado");
    });

    it("deve aceitar mensagem personalizada", () => {
      const error = new ForbiddenError("Sem permissão para esta ação");

      expect(error.message).toBe("Sem permissão para esta ação");
    });
  });

  describe("ConflictError", () => {
    it("deve ter statusCode 409", () => {
      const error = new ConflictError();

      expect(error.statusCode).toBe(409);
      expect(error.message).toBe("Conflito de dados");
    });

    it("deve aceitar mensagem personalizada", () => {
      const error = new ConflictError("Email já cadastrado");

      expect(error.message).toBe("Email já cadastrado");
    });
  });

  describe("BadRequestError", () => {
    it("deve ter statusCode 400", () => {
      const error = new BadRequestError();

      expect(error.statusCode).toBe(400);
      expect(error.message).toBe("Requisição inválida");
    });

    it("deve aceitar mensagem personalizada", () => {
      const error = new BadRequestError("Parâmetro ausente");

      expect(error.message).toBe("Parâmetro ausente");
    });
  });

  describe("InternalServerError", () => {
    it("deve ter statusCode 500 e ser não operacional", () => {
      const error = new InternalServerError();

      expect(error.statusCode).toBe(500);
      expect(error.message).toBe("Erro interno do servidor");
      expect(error.isOperational).toBe(false);
    });

    it("deve aceitar mensagem personalizada", () => {
      const error = new InternalServerError("Falha no banco de dados");

      expect(error.message).toBe("Falha no banco de dados");
      expect(error.isOperational).toBe(false);
    });
  });

  describe("Hierarquia de erros", () => {
    it("todos os erros devem herdar de AppError", () => {
      expect(new ValidationError("")).toBeInstanceOf(AppError);
      expect(new NotFoundError()).toBeInstanceOf(AppError);
      expect(new UnauthorizedError()).toBeInstanceOf(AppError);
      expect(new ForbiddenError()).toBeInstanceOf(AppError);
      expect(new ConflictError()).toBeInstanceOf(AppError);
      expect(new BadRequestError()).toBeInstanceOf(AppError);
      expect(new InternalServerError()).toBeInstanceOf(AppError);
    });

    it("todos os erros devem herdar de Error nativo", () => {
      expect(new ValidationError("")).toBeInstanceOf(Error);
      expect(new NotFoundError()).toBeInstanceOf(Error);
      expect(new UnauthorizedError()).toBeInstanceOf(Error);
      expect(new ForbiddenError()).toBeInstanceOf(Error);
      expect(new ConflictError()).toBeInstanceOf(Error);
      expect(new BadRequestError()).toBeInstanceOf(Error);
      expect(new InternalServerError()).toBeInstanceOf(Error);
    });
  });
});
