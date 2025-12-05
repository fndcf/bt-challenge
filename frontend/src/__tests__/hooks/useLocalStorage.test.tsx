/**
 * Testes do hook useLocalStorage
 */

import { renderHook, act } from "@testing-library/react";
import { useLocalStorage } from "@/hooks/useLocalStorage";

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

describe("useLocalStorage", () => {
  beforeEach(() => {
    // Limpar localStorage antes de cada teste
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe("inicialização", () => {
    it("deve retornar valor inicial quando localStorage está vazio", () => {
      const { result } = renderHook(() => useLocalStorage("testKey", "inicial"));

      expect(result.current[0]).toBe("inicial");
    });

    it("deve retornar valor do localStorage quando existe", () => {
      localStorage.setItem("testKey", JSON.stringify("valorSalvo"));

      const { result } = renderHook(() => useLocalStorage("testKey", "inicial"));

      expect(result.current[0]).toBe("valorSalvo");
    });

    it("deve funcionar com objetos", () => {
      const obj = { name: "teste", age: 25 };
      localStorage.setItem("objKey", JSON.stringify(obj));

      const { result } = renderHook(() =>
        useLocalStorage("objKey", { name: "", age: 0 })
      );

      expect(result.current[0]).toEqual(obj);
    });

    it("deve funcionar com arrays", () => {
      const arr = [1, 2, 3];
      localStorage.setItem("arrKey", JSON.stringify(arr));

      const { result } = renderHook(() => useLocalStorage("arrKey", []));

      expect(result.current[0]).toEqual(arr);
    });

    it("deve retornar valor inicial quando localStorage tem JSON inválido", () => {
      localStorage.setItem("invalidKey", "not-valid-json{");

      const { result } = renderHook(() =>
        useLocalStorage("invalidKey", "inicial")
      );

      expect(result.current[0]).toBe("inicial");
    });
  });

  describe("setValue", () => {
    it("deve atualizar o estado e localStorage", () => {
      const { result } = renderHook(() => useLocalStorage("testKey", "inicial"));

      act(() => {
        result.current[1]("novoValor");
      });

      expect(result.current[0]).toBe("novoValor");
      expect(localStorage.getItem("testKey")).toBe(JSON.stringify("novoValor"));
    });

    it("deve aceitar função para atualização baseada no valor anterior", () => {
      const { result } = renderHook(() => useLocalStorage("counter", 0));

      act(() => {
        result.current[1]((prev: number) => prev + 1);
      });

      expect(result.current[0]).toBe(1);

      act(() => {
        result.current[1]((prev: number) => prev + 1);
      });

      expect(result.current[0]).toBe(2);
    });

    it("deve funcionar com objetos", () => {
      const { result } = renderHook(() =>
        useLocalStorage("objKey", { name: "", count: 0 })
      );

      act(() => {
        result.current[1]({ name: "teste", count: 5 });
      });

      expect(result.current[0]).toEqual({ name: "teste", count: 5 });
    });
  });

  describe("removeValue", () => {
    it("deve remover do localStorage e resetar para valor inicial", () => {
      localStorage.setItem("testKey", JSON.stringify("valorSalvo"));

      const { result } = renderHook(() => useLocalStorage("testKey", "inicial"));

      expect(result.current[0]).toBe("valorSalvo");

      act(() => {
        result.current[2]();
      });

      expect(result.current[0]).toBe("inicial");
      expect(localStorage.getItem("testKey")).toBeNull();
    });
  });

  describe("diferentes chaves", () => {
    it("deve manter valores separados para diferentes chaves", () => {
      const { result: result1 } = renderHook(() =>
        useLocalStorage("key1", "valor1")
      );
      const { result: result2 } = renderHook(() =>
        useLocalStorage("key2", "valor2")
      );

      act(() => {
        result1.current[1]("novoValor1");
      });

      expect(result1.current[0]).toBe("novoValor1");
      expect(result2.current[0]).toBe("valor2");
    });
  });
});
