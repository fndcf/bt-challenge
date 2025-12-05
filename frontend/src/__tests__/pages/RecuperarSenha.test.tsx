/**
 * Testes de renderização da página RecuperarSenha
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { useRecuperarSenha } from "@/pages/RecuperarSenha/hooks/useRecuperarSenha";
import RecuperarSenha from "@/pages/RecuperarSenha";

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

// Mock do useDocumentTitle
jest.mock("@/hooks", () => ({
  useDocumentTitle: jest.fn(),
}));

// Mock do hook useRecuperarSenha
jest.mock("@/pages/RecuperarSenha/hooks/useRecuperarSenha", () => ({
  useRecuperarSenha: jest.fn(),
}));

// Mock dos componentes filhos
jest.mock("@/pages/RecuperarSenha/components/RecoveryForm", () => ({
  RecoveryForm: ({ email, emailError, loading, onEmailChange, onSubmit }: any) => (
    <form data-testid="recovery-form" onSubmit={onSubmit}>
      <input
        data-testid="email-input"
        value={email}
        onChange={(e) => onEmailChange(e.target.value)}
        disabled={loading}
      />
      {emailError && <span data-testid="email-error">{emailError}</span>}
      <button type="submit" disabled={loading} data-testid="submit-btn">
        {loading ? "Enviando..." : "Enviar"}
      </button>
    </form>
  ),
}));

jest.mock("@/pages/RecuperarSenha/components/SuccessView", () => ({
  SuccessView: ({ email, loading, onResend }: any) => (
    <div data-testid="success-view">
      <span data-testid="email-sent">Email enviado para: {email}</span>
      <button onClick={onResend} disabled={loading} data-testid="resend-btn">
        {loading ? "Reenviando..." : "Reenviar"}
      </button>
    </div>
  ),
}));

// ============================================
// TESTES DE RENDERIZAÇÃO DO COMPONENTE
// ============================================

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe("RecuperarSenha - Renderização", () => {
  const mockUseRecuperarSenha = useRecuperarSenha as jest.Mock;

  const defaultMockReturn = {
    email: "",
    emailError: "",
    loading: false,
    errorMessage: "",
    successMessage: "",
    emailEnviado: false,
    handleEmailChange: jest.fn(),
    handleSubmit: jest.fn((e) => e.preventDefault()),
    handleResend: jest.fn(),
    setErrorMessage: jest.fn(),
    setSuccessMessage: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRecuperarSenha.mockReturnValue(defaultMockReturn);
  });

  describe("Estrutura básica", () => {
    it("deve renderizar o logo", () => {
      renderWithRouter(<RecuperarSenha />);

      expect(screen.getByText("Challenge BT")).toBeInTheDocument();
    });

    it("deve renderizar o título de recuperação quando email não enviado", () => {
      renderWithRouter(<RecuperarSenha />);

      expect(screen.getByText("Recuperação de senha")).toBeInTheDocument();
    });

    it("deve renderizar o título de verificação quando email enviado", () => {
      mockUseRecuperarSenha.mockReturnValue({
        ...defaultMockReturn,
        emailEnviado: true,
      });

      renderWithRouter(<RecuperarSenha />);

      expect(screen.getByText("Verifique seu email")).toBeInTheDocument();
    });

    it("deve renderizar link de voltar ao login quando email não enviado", () => {
      renderWithRouter(<RecuperarSenha />);

      expect(screen.getByText("← Voltar para o login")).toBeInTheDocument();
    });

    it("não deve renderizar link de voltar quando email enviado", () => {
      mockUseRecuperarSenha.mockReturnValue({
        ...defaultMockReturn,
        emailEnviado: true,
      });

      renderWithRouter(<RecuperarSenha />);

      expect(screen.queryByText("← Voltar para o login")).not.toBeInTheDocument();
    });
  });

  describe("Formulário de recuperação", () => {
    it("deve renderizar RecoveryForm quando email não enviado", () => {
      renderWithRouter(<RecuperarSenha />);

      expect(screen.getByTestId("recovery-form")).toBeInTheDocument();
    });

    it("não deve renderizar RecoveryForm quando email enviado", () => {
      mockUseRecuperarSenha.mockReturnValue({
        ...defaultMockReturn,
        emailEnviado: true,
      });

      renderWithRouter(<RecuperarSenha />);

      expect(screen.queryByTestId("recovery-form")).not.toBeInTheDocument();
    });
  });

  describe("Tela de sucesso", () => {
    it("não deve renderizar SuccessView quando email não enviado", () => {
      renderWithRouter(<RecuperarSenha />);

      expect(screen.queryByTestId("success-view")).not.toBeInTheDocument();
    });

    it("deve renderizar SuccessView quando email enviado", () => {
      mockUseRecuperarSenha.mockReturnValue({
        ...defaultMockReturn,
        emailEnviado: true,
        email: "teste@email.com",
      });

      renderWithRouter(<RecuperarSenha />);

      expect(screen.getByTestId("success-view")).toBeInTheDocument();
      expect(screen.getByText("Email enviado para: teste@email.com")).toBeInTheDocument();
    });
  });

  describe("Mensagens de alerta", () => {
    it("não deve renderizar alerta de erro quando não há erro", () => {
      renderWithRouter(<RecuperarSenha />);

      // Não deve haver alerta visível
      expect(screen.queryByText("Erro de rede")).not.toBeInTheDocument();
    });

    it("deve renderizar alerta de erro quando há errorMessage", () => {
      mockUseRecuperarSenha.mockReturnValue({
        ...defaultMockReturn,
        errorMessage: "Erro de rede",
      });

      renderWithRouter(<RecuperarSenha />);

      expect(screen.getByText("Erro de rede")).toBeInTheDocument();
    });

    it("deve renderizar botão de fechar no alerta de erro", () => {
      mockUseRecuperarSenha.mockReturnValue({
        ...defaultMockReturn,
        errorMessage: "Erro de rede",
      });

      renderWithRouter(<RecuperarSenha />);

      expect(screen.getByText("×")).toBeInTheDocument();
    });

    it("deve chamar setErrorMessage ao fechar alerta de erro", () => {
      const mockSetErrorMessage = jest.fn();
      mockUseRecuperarSenha.mockReturnValue({
        ...defaultMockReturn,
        errorMessage: "Erro de rede",
        setErrorMessage: mockSetErrorMessage,
      });

      renderWithRouter(<RecuperarSenha />);

      fireEvent.click(screen.getByText("×"));

      expect(mockSetErrorMessage).toHaveBeenCalledWith("");
    });

    it("deve renderizar alerta de sucesso quando há successMessage e email não enviado", () => {
      mockUseRecuperarSenha.mockReturnValue({
        ...defaultMockReturn,
        successMessage: "Operação realizada!",
        emailEnviado: false,
      });

      renderWithRouter(<RecuperarSenha />);

      expect(screen.getByText("Operação realizada!")).toBeInTheDocument();
    });

    it("não deve renderizar alerta de sucesso quando email já foi enviado", () => {
      mockUseRecuperarSenha.mockReturnValue({
        ...defaultMockReturn,
        successMessage: "Email enviado!",
        emailEnviado: true,
      });

      renderWithRouter(<RecuperarSenha />);

      // O successMessage não deve aparecer como alerta quando emailEnviado é true
      // Porque a SuccessView já mostra a confirmação
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  describe("Interações", () => {
    it("deve chamar handleEmailChange ao digitar no input", () => {
      const mockHandleEmailChange = jest.fn();
      mockUseRecuperarSenha.mockReturnValue({
        ...defaultMockReturn,
        handleEmailChange: mockHandleEmailChange,
      });

      renderWithRouter(<RecuperarSenha />);

      fireEvent.change(screen.getByTestId("email-input"), {
        target: { value: "novo@email.com" },
      });

      expect(mockHandleEmailChange).toHaveBeenCalledWith("novo@email.com");
    });

    it("deve chamar handleSubmit ao submeter formulário", () => {
      const mockHandleSubmit = jest.fn((e) => e.preventDefault());
      mockUseRecuperarSenha.mockReturnValue({
        ...defaultMockReturn,
        handleSubmit: mockHandleSubmit,
      });

      renderWithRouter(<RecuperarSenha />);

      fireEvent.submit(screen.getByTestId("recovery-form"));

      expect(mockHandleSubmit).toHaveBeenCalled();
    });

    it("deve chamar handleResend ao clicar em reenviar", () => {
      const mockHandleResend = jest.fn();
      mockUseRecuperarSenha.mockReturnValue({
        ...defaultMockReturn,
        emailEnviado: true,
        handleResend: mockHandleResend,
      });

      renderWithRouter(<RecuperarSenha />);

      fireEvent.click(screen.getByTestId("resend-btn"));

      expect(mockHandleResend).toHaveBeenCalled();
    });
  });

  describe("Estados de loading", () => {
    it("deve desabilitar input durante loading", () => {
      mockUseRecuperarSenha.mockReturnValue({
        ...defaultMockReturn,
        loading: true,
      });

      renderWithRouter(<RecuperarSenha />);

      expect(screen.getByTestId("email-input")).toBeDisabled();
    });

    it("deve mostrar texto de enviando durante loading", () => {
      mockUseRecuperarSenha.mockReturnValue({
        ...defaultMockReturn,
        loading: true,
      });

      renderWithRouter(<RecuperarSenha />);

      expect(screen.getByText("Enviando...")).toBeInTheDocument();
    });

    it("deve desabilitar botão de reenviar durante loading", () => {
      mockUseRecuperarSenha.mockReturnValue({
        ...defaultMockReturn,
        emailEnviado: true,
        loading: true,
      });

      renderWithRouter(<RecuperarSenha />);

      expect(screen.getByTestId("resend-btn")).toBeDisabled();
    });
  });

  describe("Erros de validação", () => {
    it("deve exibir erro de email quando presente", () => {
      mockUseRecuperarSenha.mockReturnValue({
        ...defaultMockReturn,
        emailError: "Email inválido",
      });

      renderWithRouter(<RecuperarSenha />);

      expect(screen.getByTestId("email-error")).toHaveTextContent("Email inválido");
    });
  });
});
