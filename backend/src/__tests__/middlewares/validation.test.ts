/**
 * Testes dos Middlewares de Validação
 */

import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import {
  validate,
  isEvenNumber,
  meetsMinimumPlayers,
  isValidSlug,
  isInEnum,
  sanitizeData,
  sanitizeRequest,
} from "../../middlewares/validation";
import { ValidationError } from "../../utils/errors";

// Mock do express-validator
jest.mock("express-validator", () => ({
  validationResult: jest.fn(),
}));

describe("Validation Middlewares", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      body: {},
      query: {},
      params: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe("validate", () => {
    it("deve chamar next se não houver erros", () => {
      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: () => true,
        array: () => [],
      });

      validate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it("deve lançar ValidationError se houver erros", () => {
      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: () => false,
        array: () => [
          { type: "field", path: "email", msg: "Email inválido" },
          { type: "field", path: "nome", msg: "Nome é obrigatório" },
        ],
      });

      expect(() =>
        validate(mockRequest as Request, mockResponse as Response, mockNext)
      ).toThrow(ValidationError);
    });

    it("deve formatar erros corretamente", () => {
      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: () => false,
        array: () => [
          { type: "field", path: "email", msg: "Email inválido" },
        ],
      });

      try {
        validate(mockRequest as Request, mockResponse as Response, mockNext);
      } catch (error: any) {
        expect(error.errors).toEqual([
          { field: "email", message: "Email inválido" },
        ]);
      }
    });

    it("deve usar 'unknown' para campos sem path", () => {
      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: () => false,
        array: () => [{ type: "alternative", msg: "Erro genérico" }],
      });

      try {
        validate(mockRequest as Request, mockResponse as Response, mockNext);
      } catch (error: any) {
        expect(error.errors).toEqual([
          { field: "unknown", message: "Erro genérico" },
        ]);
      }
    });
  });

  describe("isEvenNumber", () => {
    it("deve aceitar número par", () => {
      expect(isEvenNumber(4)).toBe(true);
      expect(isEvenNumber(12)).toBe(true);
      expect(isEvenNumber(100)).toBe(true);
      expect(isEvenNumber("8")).toBe(true);
    });

    it("deve rejeitar número ímpar", () => {
      expect(() => isEvenNumber(3)).toThrow("Deve ser um número par");
      expect(() => isEvenNumber(7)).toThrow("Deve ser um número par");
      expect(() => isEvenNumber("9")).toThrow("Deve ser um número par");
    });

    it("deve rejeitar valores não numéricos", () => {
      expect(() => isEvenNumber("abc")).toThrow("Deve ser um número");
      expect(() => isEvenNumber("")).toThrow("Deve ser um número");
      expect(() => isEvenNumber(undefined)).toThrow("Deve ser um número");
    });
  });

  describe("meetsMinimumPlayers", () => {
    it("deve aceitar 12 ou mais jogadores", () => {
      expect(meetsMinimumPlayers(12, {})).toBe(true);
      expect(meetsMinimumPlayers(16, {})).toBe(true);
      expect(meetsMinimumPlayers(24, {})).toBe(true);
      expect(meetsMinimumPlayers("20", {})).toBe(true);
    });

    it("deve rejeitar menos de 12 jogadores", () => {
      expect(() => meetsMinimumPlayers(11, {})).toThrow(
        "Mínimo de 12 jogadores necessários"
      );
      expect(() => meetsMinimumPlayers(8, {})).toThrow(
        "Mínimo de 12 jogadores necessários"
      );
      expect(() => meetsMinimumPlayers(4, {})).toThrow(
        "Mínimo de 12 jogadores necessários"
      );
    });

    it("deve rejeitar valores não numéricos", () => {
      expect(() => meetsMinimumPlayers("abc", {})).toThrow("Deve ser um número");
    });
  });

  describe("isValidSlug", () => {
    it("deve aceitar slugs válidos", () => {
      expect(isValidSlug("arena-beach")).toBe(true);
      expect(isValidSlug("minha-arena-123")).toBe(true);
      expect(isValidSlug("arena")).toBe(true);
      expect(isValidSlug("a1b2c3")).toBe(true);
    });

    it("deve rejeitar slugs com maiúsculas", () => {
      expect(() => isValidSlug("Arena-Beach")).toThrow(
        "Slug deve conter apenas letras minúsculas, números e hífens"
      );
    });

    it("deve rejeitar slugs com caracteres especiais", () => {
      expect(() => isValidSlug("arena_beach")).toThrow(
        "Slug deve conter apenas letras minúsculas, números e hífens"
      );
      expect(() => isValidSlug("arena@beach")).toThrow(
        "Slug deve conter apenas letras minúsculas, números e hífens"
      );
      expect(() => isValidSlug("arena beach")).toThrow(
        "Slug deve conter apenas letras minúsculas, números e hífens"
      );
    });

    it("deve rejeitar slugs com hífens consecutivos", () => {
      expect(() => isValidSlug("arena--beach")).toThrow(
        "Slug deve conter apenas letras minúsculas, números e hífens"
      );
    });

    it("deve rejeitar slugs começando ou terminando com hífen", () => {
      expect(() => isValidSlug("-arena")).toThrow(
        "Slug deve conter apenas letras minúsculas, números e hífens"
      );
      expect(() => isValidSlug("arena-")).toThrow(
        "Slug deve conter apenas letras minúsculas, números e hífens"
      );
    });
  });

  describe("isInEnum", () => {
    const TestEnum = {
      OPCAO_A: "opcao_a",
      OPCAO_B: "opcao_b",
      OPCAO_C: "opcao_c",
    };

    it("deve aceitar valores do enum", () => {
      const validator = isInEnum(TestEnum);

      expect(validator("opcao_a")).toBe(true);
      expect(validator("opcao_b")).toBe(true);
      expect(validator("opcao_c")).toBe(true);
    });

    it("deve rejeitar valores fora do enum", () => {
      const validator = isInEnum(TestEnum);

      expect(() => validator("opcao_d")).toThrow(
        "Deve ser um dos valores: opcao_a, opcao_b, opcao_c"
      );
      expect(() => validator("invalido")).toThrow("Deve ser um dos valores:");
    });
  });

  describe("sanitizeData", () => {
    it("deve fazer trim em strings", () => {
      expect(sanitizeData("  texto  ")).toBe("texto");
      expect(sanitizeData("  espaços no início")).toBe("espaços no início");
      expect(sanitizeData("espaços no fim  ")).toBe("espaços no fim");
    });

    it("deve sanitizar arrays recursivamente", () => {
      const input = ["  a  ", "  b  ", "  c  "];
      const result = sanitizeData(input);

      expect(result).toEqual(["a", "b", "c"]);
    });

    it("deve sanitizar objetos recursivamente", () => {
      const input = {
        nome: "  João  ",
        email: "  joao@email.com  ",
        dados: {
          cidade: "  São Paulo  ",
        },
      };

      const result = sanitizeData(input);

      expect(result).toEqual({
        nome: "João",
        email: "joao@email.com",
        dados: {
          cidade: "São Paulo",
        },
      });
    });

    it("deve retornar valores não string/array/object como estão", () => {
      expect(sanitizeData(123)).toBe(123);
      expect(sanitizeData(true)).toBe(true);
      expect(sanitizeData(null)).toBe(null);
      expect(sanitizeData(undefined)).toBe(undefined);
    });

    it("deve lidar com arrays aninhados", () => {
      const input = [["  a  ", "  b  "], ["  c  "]];
      const result = sanitizeData(input);

      expect(result).toEqual([["a", "b"], ["c"]]);
    });

    it("deve lidar com objetos contendo arrays", () => {
      const input = {
        lista: ["  item1  ", "  item2  "],
      };

      const result = sanitizeData(input);

      expect(result).toEqual({
        lista: ["item1", "item2"],
      });
    });
  });

  describe("sanitizeRequest", () => {
    it("deve sanitizar body", () => {
      mockRequest.body = { nome: "  João  " };

      sanitizeRequest(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.body).toEqual({ nome: "João" });
      expect(mockNext).toHaveBeenCalledWith();
    });

    it("deve sanitizar query", () => {
      mockRequest.query = { busca: "  termo  " };

      sanitizeRequest(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.query).toEqual({ busca: "termo" });
    });

    it("deve sanitizar params", () => {
      mockRequest.params = { id: "  123  " };

      sanitizeRequest(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.params).toEqual({ id: "123" });
    });

    it("deve sanitizar body, query e params simultaneamente", () => {
      mockRequest.body = { nome: "  João  " };
      mockRequest.query = { busca: "  termo  " };
      mockRequest.params = { id: "  123  " };

      sanitizeRequest(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.body).toEqual({ nome: "João" });
      expect(mockRequest.query).toEqual({ busca: "termo" });
      expect(mockRequest.params).toEqual({ id: "123" });
      expect(mockNext).toHaveBeenCalledWith();
    });

    it("deve lidar com body/query/params vazios ou undefined", () => {
      mockRequest.body = undefined;
      mockRequest.query = undefined;
      mockRequest.params = undefined;

      sanitizeRequest(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith();
    });
  });
});
