/**
 * Testes de renderização da página Login
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Login from "@/pages/Login";

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

// Mock do react-router-dom
const mockNavigate = jest.fn();
const mockLocation = { state: null, pathname: "/login" };

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
}));

// Mock do AuthContext
const mockLogin = jest.fn();
let mockIsAuthenticated = false;

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    login: mockLogin,
    isAuthenticated: mockIsAuthenticated,
  }),
}));

// Mock do useDocumentTitle
jest.mock("@/hooks", () => ({
  useDocumentTitle: jest.fn(),
  useForm: () => ({
    values: { email: "", password: "" },
    errors: {},
    handleChange: jest.fn(),
    setFieldValue: jest.fn(),
    setFieldError: jest.fn(),
  }),
}));

// Mock do hook useLogin
const mockUseLogin = jest.fn();
jest.mock("@/pages/Login/hooks/useLogin", () => ({
  useLogin: () => mockUseLogin(),
}));

// Mock do componente LoginForm
jest.mock("@/pages/Login/components/LoginForm", () => ({
  LoginForm: ({
    email,
    password,
    showPassword,
    errors,
    loading,
    onEmailChange,
    onPasswordChange,
    onTogglePassword,
  }: any) => (
    <div data-testid="login-form">
      <input
        data-testid="email-input"
        value={email}
        onChange={(e) => onEmailChange(e.target.value)}
        disabled={loading}
        aria-label="email"
        placeholder="seu@email.com"
      />
      {errors.email && <span data-testid="email-error">{errors.email}</span>}
      <input
        data-testid="password-input"
        value={password}
        onChange={(e) => onPasswordChange(e.target.value)}
        disabled={loading}
        aria-label="senha"
        type={showPassword ? "text" : "password"}
        placeholder="••••••••"
      />
      {errors.password && (
        <span data-testid="password-error">{errors.password}</span>
      )}
      <button
        data-testid="toggle-password"
        type="button"
        onClick={onTogglePassword}
      >
        {showPassword ? "Ocultar" : "Mostrar"}
      </button>
    </div>
  ),
}));

describe("Login - Renderização da Página", () => {
  const defaultMockReturn = {
    values: { email: "", password: "" },
    errors: {},
    loading: false,
    errorMessage: "",
    rememberMe: false,
    showPassword: false,
    handleChange: jest.fn(),
    handleSubmit: jest.fn((e) => e.preventDefault()),
    setErrorMessage: jest.fn(),
    setRememberMe: jest.fn(),
    toggleShowPassword: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsAuthenticated = false;
    mockUseLogin.mockReturnValue(defaultMockReturn);
  });

  const renderPage = () => {
    return render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
  };

  describe("Estrutura básica", () => {
    it("deve renderizar o logo", () => {
      renderPage();

      expect(screen.getByText("Dupley")).toBeInTheDocument();
    });

    it("deve renderizar o texto do header", () => {
      renderPage();

      expect(
        screen.getByText("Faça login para acessar o painel administrativo")
      ).toBeInTheDocument();
    });

    it("deve renderizar LoginForm", () => {
      renderPage();

      expect(screen.getByTestId("login-form")).toBeInTheDocument();
    });

    it("deve renderizar link de esqueceu a senha", () => {
      renderPage();

      expect(screen.getByText("Esqueceu a senha?")).toBeInTheDocument();
    });

    it("deve renderizar botão de entrar", () => {
      renderPage();

      expect(screen.getByText("Entrar")).toBeInTheDocument();
    });

    it("deve renderizar link de criar arena", () => {
      renderPage();

      expect(screen.getByText("Criar nova arena")).toBeInTheDocument();
    });

    it("deve renderizar link de voltar", () => {
      renderPage();

      expect(screen.getByText("← Voltar para o site")).toBeInTheDocument();
    });
  });

  describe("Mensagem de erro", () => {
    it("não deve renderizar alerta quando não há erro", () => {
      renderPage();

      expect(
        screen.queryByRole("button", { name: "×" })
      ).not.toBeInTheDocument();
    });

    it("deve renderizar alerta quando há errorMessage", () => {
      mockUseLogin.mockReturnValue({
        ...defaultMockReturn,
        errorMessage: "Credenciais inválidas",
      });

      renderPage();

      expect(screen.getByText("Credenciais inválidas")).toBeInTheDocument();
    });

    it("deve ter botão para fechar alerta", () => {
      mockUseLogin.mockReturnValue({
        ...defaultMockReturn,
        errorMessage: "Erro",
      });

      renderPage();

      expect(screen.getByText("×")).toBeInTheDocument();
    });

    it("deve chamar setErrorMessage ao fechar alerta", () => {
      const mockSetErrorMessage = jest.fn();
      mockUseLogin.mockReturnValue({
        ...defaultMockReturn,
        errorMessage: "Erro",
        setErrorMessage: mockSetErrorMessage,
      });

      renderPage();

      fireEvent.click(screen.getByText("×"));

      expect(mockSetErrorMessage).toHaveBeenCalledWith("");
    });
  });

  describe("Checkbox lembrar de mim", () => {
    it("deve renderizar checkbox", () => {
      renderPage();

      expect(screen.getByText("Lembrar de mim")).toBeInTheDocument();
    });

    it("deve chamar setRememberMe ao mudar checkbox", () => {
      const mockSetRememberMe = jest.fn();
      mockUseLogin.mockReturnValue({
        ...defaultMockReturn,
        setRememberMe: mockSetRememberMe,
      });

      renderPage();

      const checkbox = screen.getByRole("checkbox");
      fireEvent.click(checkbox);

      expect(mockSetRememberMe).toHaveBeenCalled();
    });

    it("checkbox deve estar marcado quando rememberMe é true", () => {
      mockUseLogin.mockReturnValue({
        ...defaultMockReturn,
        rememberMe: true,
      });

      renderPage();

      expect(screen.getByRole("checkbox")).toBeChecked();
    });
  });

  describe("Estado de loading", () => {
    it("deve mostrar spinner quando loading", () => {
      mockUseLogin.mockReturnValue({
        ...defaultMockReturn,
        loading: true,
      });

      renderPage();

      expect(screen.queryByText("Entrar")).not.toBeInTheDocument();
    });

    it("deve desabilitar botão quando loading", () => {
      mockUseLogin.mockReturnValue({
        ...defaultMockReturn,
        loading: true,
      });

      renderPage();

      const submitButton = screen.getByRole("button", { name: "" });
      expect(submitButton).toBeDisabled();
    });

    it("deve desabilitar checkbox quando loading", () => {
      mockUseLogin.mockReturnValue({
        ...defaultMockReturn,
        loading: true,
      });

      renderPage();

      expect(screen.getByRole("checkbox")).toBeDisabled();
    });
  });

  describe("Navegação", () => {
    it("deve ter link correto para recuperar senha", () => {
      renderPage();

      const link = screen.getByText("Esqueceu a senha?");
      expect(link).toHaveAttribute("href", "/recuperar-senha");
    });

    it("deve ter link correto para registro", () => {
      renderPage();

      const link = screen.getByText("Criar nova arena");
      expect(link).toHaveAttribute("href", "/register");
    });

    it("deve ter link correto para home", () => {
      renderPage();

      const link = screen.getByText("← Voltar para o site");
      expect(link).toHaveAttribute("href", "/");
    });
  });

  describe("Submissão do formulário", () => {
    it("deve chamar handleSubmit ao submeter", () => {
      const mockHandleSubmit = jest.fn((e) => e.preventDefault());
      mockUseLogin.mockReturnValue({
        ...defaultMockReturn,
        handleSubmit: mockHandleSubmit,
      });

      renderPage();

      fireEvent.click(screen.getByText("Entrar"));

      expect(mockHandleSubmit).toHaveBeenCalled();
    });
  });

  describe("Callbacks do LoginForm", () => {
    it("deve chamar handleChange com email ao alterar email", () => {
      const mockHandleChange = jest.fn();
      mockUseLogin.mockReturnValue({
        ...defaultMockReturn,
        handleChange: mockHandleChange,
      });

      renderPage();

      fireEvent.change(screen.getByTestId("email-input"), {
        target: { value: "test@test.com" },
      });

      expect(mockHandleChange).toHaveBeenCalledWith("email", "test@test.com");
    });

    it("deve chamar handleChange com password ao alterar senha", () => {
      const mockHandleChange = jest.fn();
      mockUseLogin.mockReturnValue({
        ...defaultMockReturn,
        handleChange: mockHandleChange,
      });

      renderPage();

      fireEvent.change(screen.getByTestId("password-input"), {
        target: { value: "senha123" },
      });

      expect(mockHandleChange).toHaveBeenCalledWith("password", "senha123");
    });

    it("deve chamar toggleShowPassword ao clicar no botão", () => {
      const mockToggleShowPassword = jest.fn();
      mockUseLogin.mockReturnValue({
        ...defaultMockReturn,
        toggleShowPassword: mockToggleShowPassword,
      });

      renderPage();

      fireEvent.click(screen.getByTestId("toggle-password"));

      expect(mockToggleShowPassword).toHaveBeenCalled();
    });

    it("deve exibir Ocultar quando showPassword é true", () => {
      mockUseLogin.mockReturnValue({
        ...defaultMockReturn,
        showPassword: true,
      });

      renderPage();

      expect(screen.getByText("Ocultar")).toBeInTheDocument();
    });

    it("deve exibir Mostrar quando showPassword é false", () => {
      mockUseLogin.mockReturnValue({
        ...defaultMockReturn,
        showPassword: false,
      });

      renderPage();

      expect(screen.getByText("Mostrar")).toBeInTheDocument();
    });
  });
});
