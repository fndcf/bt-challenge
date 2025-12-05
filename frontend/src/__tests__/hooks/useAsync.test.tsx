/**
 * Testes do hook useAsync
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { useAsync } from "@/hooks/useAsync";

describe("useAsync", () => {
  describe("inicialização", () => {
    it("deve iniciar com status idle quando immediate=false", () => {
      const asyncFn = jest.fn().mockResolvedValue("dados");

      const { result } = renderHook(() => useAsync(asyncFn, false));

      expect(result.current.status).toBe("idle");
      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    it("deve executar imediatamente quando immediate=true", async () => {
      const asyncFn = jest.fn().mockResolvedValue("dados");

      const { result } = renderHook(() => useAsync(asyncFn, true));

      await waitFor(() => {
        expect(result.current.status).toBe("success");
      });

      expect(asyncFn).toHaveBeenCalledTimes(1);
      expect(result.current.data).toBe("dados");
    });

    it("deve executar imediatamente por padrão", async () => {
      const asyncFn = jest.fn().mockResolvedValue("dados");

      const { result } = renderHook(() => useAsync(asyncFn));

      await waitFor(() => {
        expect(result.current.status).toBe("success");
      });

      expect(asyncFn).toHaveBeenCalledTimes(1);
    });
  });

  describe("execute", () => {
    it("deve executar a função assíncrona", async () => {
      const asyncFn = jest.fn().mockResolvedValue("resultado");

      const { result } = renderHook(() => useAsync(asyncFn, false));

      await act(async () => {
        await result.current.execute();
      });

      expect(asyncFn).toHaveBeenCalled();
      expect(result.current.data).toBe("resultado");
      expect(result.current.status).toBe("success");
    });

    it("deve retornar os dados ao executar", async () => {
      const asyncFn = jest.fn().mockResolvedValue("resultado");

      const { result } = renderHook(() => useAsync(asyncFn, false));

      let returnValue: string;
      await act(async () => {
        returnValue = await result.current.execute();
      });

      expect(returnValue!).toBe("resultado");
    });

    it("deve setar loading durante a execução", async () => {
      let resolveFn: (value: string) => void;
      const asyncFn = jest.fn(
        () =>
          new Promise<string>((resolve) => {
            resolveFn = resolve;
          })
      );

      const { result } = renderHook(() => useAsync(asyncFn, false));

      act(() => {
        result.current.execute();
      });

      expect(result.current.loading).toBe(true);
      expect(result.current.status).toBe("pending");

      await act(async () => {
        resolveFn("dados");
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.status).toBe("success");
    });
  });

  describe("erro", () => {
    it("deve capturar erro quando a função falha", async () => {
      const asyncFn = jest.fn().mockRejectedValue(new Error("Erro de teste"));

      const { result } = renderHook(() => useAsync(asyncFn, false));

      await act(async () => {
        try {
          await result.current.execute();
        } catch {
          // Esperado
        }
      });

      expect(result.current.status).toBe("error");
      expect(result.current.error).toBe("Erro de teste");
      expect(result.current.data).toBeNull();
    });

    it("deve usar mensagem padrão quando erro não tem message", async () => {
      const asyncFn = jest.fn().mockRejectedValue({});

      const { result } = renderHook(() => useAsync(asyncFn, false));

      await act(async () => {
        try {
          await result.current.execute();
        } catch {
          // Esperado
        }
      });

      expect(result.current.error).toBe("Erro desconhecido");
    });

    it("deve propagar o erro", async () => {
      const error = new Error("Erro de teste");
      const asyncFn = jest.fn().mockRejectedValue(error);

      const { result } = renderHook(() => useAsync(asyncFn, false));

      await expect(
        act(async () => {
          await result.current.execute();
        })
      ).rejects.toThrow("Erro de teste");
    });
  });

  describe("reset de estado", () => {
    it("deve limpar data e error antes de nova execução", async () => {
      const asyncFn = jest
        .fn()
        .mockResolvedValueOnce("primeiro")
        .mockResolvedValueOnce("segundo");

      const { result } = renderHook(() => useAsync(asyncFn, false));

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.data).toBe("primeiro");

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.data).toBe("segundo");
    });

    it("deve limpar erro após sucesso", async () => {
      const asyncFn = jest
        .fn()
        .mockRejectedValueOnce(new Error("Erro"))
        .mockResolvedValueOnce("sucesso");

      const { result } = renderHook(() => useAsync(asyncFn, false));

      await act(async () => {
        try {
          await result.current.execute();
        } catch {
          // Esperado
        }
      });

      expect(result.current.error).toBe("Erro");

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.error).toBeNull();
      expect(result.current.data).toBe("sucesso");
    });
  });

  describe("com diferentes tipos de dados", () => {
    it("deve funcionar com objetos", async () => {
      const data = { id: 1, name: "teste" };
      const asyncFn = jest.fn().mockResolvedValue(data);

      const { result } = renderHook(() => useAsync(asyncFn, false));

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.data).toEqual(data);
    });

    it("deve funcionar com arrays", async () => {
      const data = [1, 2, 3];
      const asyncFn = jest.fn().mockResolvedValue(data);

      const { result } = renderHook(() => useAsync(asyncFn, false));

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.data).toEqual(data);
    });

    it("deve funcionar com null", async () => {
      const asyncFn = jest.fn().mockResolvedValue(null);

      const { result } = renderHook(() => useAsync(asyncFn, false));

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.data).toBeNull();
      expect(result.current.status).toBe("success");
    });
  });
});
