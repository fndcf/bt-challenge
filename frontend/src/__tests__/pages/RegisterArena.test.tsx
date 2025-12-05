/**
 * Testes de renderização da página RegisterArena
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { useRegisterArena } from "@/pages/RegisterArena/hooks/useRegisterArena";
import RegisterArena from "@/pages/RegisterArena";

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

// Mock do hook useRegisterArena
jest.mock("@/pages/RegisterArena/hooks/useRegisterArena", () => ({
  useRegisterArena: jest.fn(),
}));

// Mock dos componentes filhos
jest.mock("@/pages/RegisterArena/components/SlugField", () => ({
  SlugField: ({ value, error, checkingSlug, slugAvailable, disabled, onChange }: any) => (
    <div data-testid="slug-field">
      <input
        data-testid="slug-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
      {checkingSlug && <span data-testid="checking-slug">Verificando...</span>}
      {slugAvailable === true && <span data-testid="slug-available">Disponível</span>}
      {slugAvailable === false && <span data-testid="slug-unavailable">Indisponível</span>}
      {error && <span data-testid="slug-error">{error}</span>}
    </div>
  ),
}));

jest.mock("@/pages/RegisterArena/components/PasswordFields", () => ({
  PasswordFields: ({
    password,
    confirmPassword,
    passwordError,
    confirmPasswordError,
    disabled,
    onPasswordChange,
    onConfirmPasswordChange,
  }: any) => (
    <div data-testid="password-fields">
      <input
        data-testid="password-input"
        type="password"
        value={password}
        onChange={(e) => onPasswordChange(e.target.value)}
        disabled={disabled}
      />
      {passwordError && <span data-testid="password-error">{passwordError}</span>}
      <input
        data-testid="confirm-password-input"
        type="password"
        value={confirmPassword}
        onChange={(e) => onConfirmPasswordChange(e.target.value)}
        disabled={disabled}
      />
      {confirmPasswordError && <span data-testid="confirm-password-error">{confirmPasswordError}</span>}
    </div>
  ),
}));

// ============================================
// TESTES DE RENDERIZAÇÃO DO COMPONENTE
// ============================================

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe("RegisterArena - Renderização", () => {
  const mockUseRegisterArena = useRegisterArena as jest.Mock;

  const defaultMockReturn = {
    values: {
      nome: "",
      slug: "",
      adminEmail: "",
      adminPassword: "",
      confirmPassword: "",
    },
    errors: {},
    loading: false,
    errorMessage: "",
    successMessage: "",
    checkingSlug: false,
    slugAvailable: null,
    handleChange: jest.fn(),
    handleSubmit: jest.fn((e) => e.preventDefault()),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRegisterArena.mockReturnValue(defaultMockReturn);
  });

  describe("Estrutura básica", () => {
    it("deve renderizar o título", () => {
      renderWithRouter(<RegisterArena />);

      expect(screen.getByText("Registrar Nova Arena")).toBeInTheDocument();
    });

    it("deve renderizar o subtítulo", () => {
      renderWithRouter(<RegisterArena />);

      expect(screen.getByText("Crie sua arena e comece a organizar torneios")).toBeInTheDocument();
    });

    it("deve renderizar link de voltar ao site", () => {
      renderWithRouter(<RegisterArena />);

      expect(screen.getByText("← Voltar para o site")).toBeInTheDocument();
    });

    it("deve renderizar link de login", () => {
      renderWithRouter(<RegisterArena />);

      expect(screen.getByText("Fazer login")).toBeInTheDocument();
    });
  });

  describe("Campos do formulário", () => {
    it("deve renderizar campo de nome", () => {
      renderWithRouter(<RegisterArena />);

      expect(screen.getByLabelText(/Nome da Arena/)).toBeInTheDocument();
    });

    it("deve renderizar campo de email", () => {
      renderWithRouter(<RegisterArena />);

      expect(screen.getByLabelText(/Seu Email/)).toBeInTheDocument();
    });

    it("deve renderizar SlugField", () => {
      renderWithRouter(<RegisterArena />);

      expect(screen.getByTestId("slug-field")).toBeInTheDocument();
    });

    it("deve renderizar PasswordFields", () => {
      renderWithRouter(<RegisterArena />);

      expect(screen.getByTestId("password-fields")).toBeInTheDocument();
    });

    it("deve renderizar botão de criar arena", () => {
      renderWithRouter(<RegisterArena />);

      expect(screen.getByText("Criar Arena")).toBeInTheDocument();
    });
  });

  describe("Alertas", () => {
    it("não deve renderizar alerta quando não há mensagens", () => {
      renderWithRouter(<RegisterArena />);

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("deve renderizar alerta de erro quando há errorMessage", () => {
      mockUseRegisterArena.mockReturnValue({
        ...defaultMockReturn,
        errorMessage: "Nome é obrigatório",
      });

      renderWithRouter(<RegisterArena />);

      expect(screen.getByText("Nome é obrigatório")).toBeInTheDocument();
    });

    it("deve renderizar alerta de sucesso quando há successMessage", () => {
      mockUseRegisterArena.mockReturnValue({
        ...defaultMockReturn,
        successMessage: "Arena criada com sucesso!",
      });

      renderWithRouter(<RegisterArena />);

      expect(screen.getByText("Arena criada com sucesso!")).toBeInTheDocument();
    });
  });

  describe("Erros de validação", () => {
    it("deve exibir erro do campo nome", () => {
      mockUseRegisterArena.mockReturnValue({
        ...defaultMockReturn,
        errors: { nome: "Nome é obrigatório" },
      });

      renderWithRouter(<RegisterArena />);

      expect(screen.getByText("Nome é obrigatório")).toBeInTheDocument();
    });

    it("deve exibir erro do campo email", () => {
      mockUseRegisterArena.mockReturnValue({
        ...defaultMockReturn,
        errors: { adminEmail: "Email inválido" },
      });

      renderWithRouter(<RegisterArena />);

      expect(screen.getByText("Email inválido")).toBeInTheDocument();
    });

    it("deve exibir erro do campo slug", () => {
      mockUseRegisterArena.mockReturnValue({
        ...defaultMockReturn,
        errors: { slug: "Slug indisponível" },
      });

      renderWithRouter(<RegisterArena />);

      expect(screen.getByTestId("slug-error")).toHaveTextContent("Slug indisponível");
    });
  });

  describe("Estados de loading", () => {
    it("deve desabilitar campos durante loading", () => {
      mockUseRegisterArena.mockReturnValue({
        ...defaultMockReturn,
        loading: true,
      });

      renderWithRouter(<RegisterArena />);

      expect(screen.getByLabelText(/Nome da Arena/)).toBeDisabled();
      expect(screen.getByLabelText(/Seu Email/)).toBeDisabled();
    });

    it("deve desabilitar botão durante loading", () => {
      mockUseRegisterArena.mockReturnValue({
        ...defaultMockReturn,
        loading: true,
      });

      renderWithRouter(<RegisterArena />);

      // Durante loading, o botão mostra um Spinner em vez de texto
      const submitButton = screen.getByRole("button");
      expect(submitButton).toBeDisabled();
    });

    it("deve mostrar texto normal no botão quando não está em loading", () => {
      renderWithRouter(<RegisterArena />);

      expect(screen.getByRole("button", { name: /Criar Arena/i })).toBeInTheDocument();
    });
  });

  describe("Verificação de slug", () => {
    it("deve mostrar indicador de verificação quando checkingSlug é true", () => {
      mockUseRegisterArena.mockReturnValue({
        ...defaultMockReturn,
        checkingSlug: true,
      });

      renderWithRouter(<RegisterArena />);

      expect(screen.getByTestId("checking-slug")).toBeInTheDocument();
    });

    it("deve mostrar indicador de disponível quando slugAvailable é true", () => {
      mockUseRegisterArena.mockReturnValue({
        ...defaultMockReturn,
        slugAvailable: true,
      });

      renderWithRouter(<RegisterArena />);

      expect(screen.getByTestId("slug-available")).toBeInTheDocument();
    });

    it("deve mostrar indicador de indisponível quando slugAvailable é false", () => {
      mockUseRegisterArena.mockReturnValue({
        ...defaultMockReturn,
        slugAvailable: false,
      });

      renderWithRouter(<RegisterArena />);

      expect(screen.getByTestId("slug-unavailable")).toBeInTheDocument();
    });
  });

  describe("Interações", () => {
    it("deve chamar handleChange ao digitar no nome", () => {
      const mockHandleChange = jest.fn();
      mockUseRegisterArena.mockReturnValue({
        ...defaultMockReturn,
        handleChange: mockHandleChange,
      });

      renderWithRouter(<RegisterArena />);

      fireEvent.change(screen.getByLabelText(/Nome da Arena/), {
        target: { value: "Minha Arena" },
      });

      expect(mockHandleChange).toHaveBeenCalledWith("nome", "Minha Arena");
    });

    it("deve chamar handleChange ao digitar no email", () => {
      const mockHandleChange = jest.fn();
      mockUseRegisterArena.mockReturnValue({
        ...defaultMockReturn,
        handleChange: mockHandleChange,
      });

      renderWithRouter(<RegisterArena />);

      fireEvent.change(screen.getByLabelText(/Seu Email/), {
        target: { value: "admin@arena.com" },
      });

      expect(mockHandleChange).toHaveBeenCalledWith("adminEmail", "admin@arena.com");
    });

    it("deve chamar handleSubmit ao submeter formulário", () => {
      const mockHandleSubmit = jest.fn((e) => e.preventDefault());
      mockUseRegisterArena.mockReturnValue({
        ...defaultMockReturn,
        handleSubmit: mockHandleSubmit,
      });

      renderWithRouter(<RegisterArena />);

      fireEvent.click(screen.getByText("Criar Arena"));

      expect(mockHandleSubmit).toHaveBeenCalled();
    });
  });

  describe("Valores do formulário", () => {
    it("deve exibir valor do nome", () => {
      mockUseRegisterArena.mockReturnValue({
        ...defaultMockReturn,
        values: {
          ...defaultMockReturn.values,
          nome: "Arena Teste",
        },
      });

      renderWithRouter(<RegisterArena />);

      expect(screen.getByLabelText(/Nome da Arena/)).toHaveValue("Arena Teste");
    });

    it("deve exibir valor do email", () => {
      mockUseRegisterArena.mockReturnValue({
        ...defaultMockReturn,
        values: {
          ...defaultMockReturn.values,
          adminEmail: "admin@teste.com",
        },
      });

      renderWithRouter(<RegisterArena />);

      expect(screen.getByLabelText(/Seu Email/)).toHaveValue("admin@teste.com");
    });
  });

  describe("Callbacks dos componentes filhos", () => {
    it("deve chamar handleChange ao digitar no slug", () => {
      const mockHandleChange = jest.fn();
      mockUseRegisterArena.mockReturnValue({
        ...defaultMockReturn,
        handleChange: mockHandleChange,
      });

      renderWithRouter(<RegisterArena />);

      fireEvent.change(screen.getByTestId("slug-input"), {
        target: { value: "minha-arena" },
      });

      expect(mockHandleChange).toHaveBeenCalledWith("slug", "minha-arena");
    });

    it("deve chamar handleChange ao digitar a senha", () => {
      const mockHandleChange = jest.fn();
      mockUseRegisterArena.mockReturnValue({
        ...defaultMockReturn,
        handleChange: mockHandleChange,
      });

      renderWithRouter(<RegisterArena />);

      fireEvent.change(screen.getByTestId("password-input"), {
        target: { value: "senha123" },
      });

      expect(mockHandleChange).toHaveBeenCalledWith("adminPassword", "senha123");
    });

    it("deve chamar handleChange ao digitar a confirmação de senha", () => {
      const mockHandleChange = jest.fn();
      mockUseRegisterArena.mockReturnValue({
        ...defaultMockReturn,
        handleChange: mockHandleChange,
      });

      renderWithRouter(<RegisterArena />);

      fireEvent.change(screen.getByTestId("confirm-password-input"), {
        target: { value: "senha123" },
      });

      expect(mockHandleChange).toHaveBeenCalledWith("confirmPassword", "senha123");
    });
  });

  describe("Exibição de erros nos componentes filhos", () => {
    it("deve exibir erro de senha", () => {
      mockUseRegisterArena.mockReturnValue({
        ...defaultMockReturn,
        errors: { adminPassword: "Senha muito curta" },
      });

      renderWithRouter(<RegisterArena />);

      expect(screen.getByTestId("password-error")).toHaveTextContent("Senha muito curta");
    });

    it("deve exibir erro de confirmação de senha", () => {
      mockUseRegisterArena.mockReturnValue({
        ...defaultMockReturn,
        errors: { confirmPassword: "Senhas não coincidem" },
      });

      renderWithRouter(<RegisterArena />);

      expect(screen.getByTestId("confirm-password-error")).toHaveTextContent("Senhas não coincidem");
    });
  });
});
