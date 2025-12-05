/**
 * Testes do hook useRecuperarSenha
 */

import { renderHook, act } from "@testing-library/react";
import { useRecuperarSenha } from "@/pages/RecuperarSenha/hooks/useRecuperarSenha";

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

// Mock do AuthContext
const mockResetPassword = jest.fn();

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    resetPassword: mockResetPassword,
  }),
}));

describe("useRecuperarSenha", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Estado inicial", () => {
    it("deve retornar estado inicial correto", () => {
      const { result } = renderHook(() => useRecuperarSenha());

      expect(result.current.email).toBe("");
      expect(result.current.emailError).toBe("");
      expect(result.current.loading).toBe(false);
      expect(result.current.errorMessage).toBe("");
      expect(result.current.successMessage).toBe("");
      expect(result.current.emailEnviado).toBe(false);
    });
  });

  describe("handleEmailChange", () => {
    it("deve atualizar email", () => {
      const { result } = renderHook(() => useRecuperarSenha());

      act(() => {
        result.current.handleEmailChange("teste@email.com");
      });

      expect(result.current.email).toBe("teste@email.com");
    });

    it("deve limpar erro ao digitar email válido após erro", () => {
      const { result } = renderHook(() => useRecuperarSenha());

      // Primeiro, causar um erro
      act(() => {
        result.current.handleEmailChange("email-invalido");
      });

      // Submeter para validar
      act(() => {
        result.current.handleSubmit({
          preventDefault: jest.fn(),
        } as unknown as React.FormEvent);
      });

      // Digitar email válido
      act(() => {
        result.current.handleEmailChange("teste@email.com");
      });

      expect(result.current.emailError).toBe("");
    });
  });

  describe("Validação de email", () => {
    it("deve validar email obrigatório", async () => {
      const { result } = renderHook(() => useRecuperarSenha());

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: jest.fn(),
        } as unknown as React.FormEvent);
      });

      expect(result.current.emailError).toBe("Email é obrigatório");
    });

    it("deve validar formato de email inválido", async () => {
      const { result } = renderHook(() => useRecuperarSenha());

      act(() => {
        result.current.handleEmailChange("email-invalido");
      });

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: jest.fn(),
        } as unknown as React.FormEvent);
      });

      expect(result.current.emailError).toBe("Email inválido");
    });

    it("deve aceitar email válido", async () => {
      mockResetPassword.mockResolvedValue(undefined);

      const { result } = renderHook(() => useRecuperarSenha());

      act(() => {
        result.current.handleEmailChange("teste@email.com");
      });

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: jest.fn(),
        } as unknown as React.FormEvent);
      });

      expect(result.current.emailError).toBe("");
    });
  });

  describe("handleSubmit", () => {
    it("deve enviar email de recuperação com sucesso", async () => {
      mockResetPassword.mockResolvedValue(undefined);

      const { result } = renderHook(() => useRecuperarSenha());

      act(() => {
        result.current.handleEmailChange("teste@email.com");
      });

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: jest.fn(),
        } as unknown as React.FormEvent);
      });

      expect(mockResetPassword).toHaveBeenCalledWith("teste@email.com");
      expect(result.current.emailEnviado).toBe(true);
      expect(result.current.successMessage).toBe(
        "Link de recuperação enviado! Verifique seu email."
      );
    });

    it("deve mostrar loading durante envio", async () => {
      let resolvePromise: () => void;
      mockResetPassword.mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            resolvePromise = resolve;
          })
      );

      const { result } = renderHook(() => useRecuperarSenha());

      act(() => {
        result.current.handleEmailChange("teste@email.com");
      });

      let submitPromise: Promise<void>;
      act(() => {
        submitPromise = result.current.handleSubmit({
          preventDefault: jest.fn(),
        } as unknown as React.FormEvent);
      });

      // Durante o envio, loading deve ser true
      expect(result.current.loading).toBe(true);

      // Resolver a promise
      await act(async () => {
        resolvePromise!();
        await submitPromise;
      });

      expect(result.current.loading).toBe(false);
    });

    it("deve tratar erro ao enviar email", async () => {
      mockResetPassword.mockRejectedValue(new Error("Erro de rede"));

      const { result } = renderHook(() => useRecuperarSenha());

      act(() => {
        result.current.handleEmailChange("teste@email.com");
      });

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: jest.fn(),
        } as unknown as React.FormEvent);
      });

      expect(result.current.errorMessage).toBe("Erro de rede");
      expect(result.current.emailEnviado).toBe(false);
    });

    it("deve usar mensagem padrão quando erro não tem message", async () => {
      mockResetPassword.mockRejectedValue({});

      const { result } = renderHook(() => useRecuperarSenha());

      act(() => {
        result.current.handleEmailChange("teste@email.com");
      });

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: jest.fn(),
        } as unknown as React.FormEvent);
      });

      expect(result.current.errorMessage).toBe(
        "Erro ao enviar email de recuperação"
      );
    });

    it("não deve enviar quando validação falha", async () => {
      const { result } = renderHook(() => useRecuperarSenha());

      act(() => {
        result.current.handleEmailChange("email-invalido");
      });

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: jest.fn(),
        } as unknown as React.FormEvent);
      });

      expect(mockResetPassword).not.toHaveBeenCalled();
    });
  });

  describe("handleResend", () => {
    it("deve reenviar email de recuperação", async () => {
      mockResetPassword.mockResolvedValue(undefined);

      const { result } = renderHook(() => useRecuperarSenha());

      act(() => {
        result.current.handleEmailChange("teste@email.com");
      });

      // Primeiro envio
      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: jest.fn(),
        } as unknown as React.FormEvent);
      });

      expect(result.current.emailEnviado).toBe(true);

      // Limpar mock
      mockResetPassword.mockClear();

      // Reenviar
      await act(async () => {
        await result.current.handleResend();
      });

      expect(mockResetPassword).toHaveBeenCalledWith("teste@email.com");
    });

    it("deve tratar erro ao reenviar", async () => {
      mockResetPassword
        .mockResolvedValueOnce(undefined) // Primeiro envio sucesso
        .mockRejectedValueOnce(new Error("Limite de envios excedido")); // Reenvio falha

      const { result } = renderHook(() => useRecuperarSenha());

      act(() => {
        result.current.handleEmailChange("teste@email.com");
      });

      // Primeiro envio
      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: jest.fn(),
        } as unknown as React.FormEvent);
      });

      // Reenviar
      await act(async () => {
        await result.current.handleResend();
      });

      expect(result.current.errorMessage).toBe("Limite de envios excedido");
    });
  });

  describe("Setters de mensagens", () => {
    it("deve permitir setar mensagem de erro", () => {
      const { result } = renderHook(() => useRecuperarSenha());

      act(() => {
        result.current.setErrorMessage("Erro customizado");
      });

      expect(result.current.errorMessage).toBe("Erro customizado");
    });

    it("deve permitir limpar mensagem de erro", () => {
      const { result } = renderHook(() => useRecuperarSenha());

      act(() => {
        result.current.setErrorMessage("Erro");
      });

      act(() => {
        result.current.setErrorMessage("");
      });

      expect(result.current.errorMessage).toBe("");
    });

    it("deve permitir setar mensagem de sucesso", () => {
      const { result } = renderHook(() => useRecuperarSenha());

      act(() => {
        result.current.setSuccessMessage("Operação realizada!");
      });

      expect(result.current.successMessage).toBe("Operação realizada!");
    });

    it("deve permitir limpar mensagem de sucesso", () => {
      const { result } = renderHook(() => useRecuperarSenha());

      act(() => {
        result.current.setSuccessMessage("Sucesso");
      });

      act(() => {
        result.current.setSuccessMessage("");
      });

      expect(result.current.successMessage).toBe("");
    });
  });
});
