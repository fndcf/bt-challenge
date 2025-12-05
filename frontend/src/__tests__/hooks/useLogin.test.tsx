/**
 * Testes do hook useLogin
 */

import { renderHook, act } from "@testing-library/react";
import { useLogin } from "@/pages/Login/hooks/useLogin";

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

// Mock do useForm
const mockSetFieldValue = jest.fn();
const mockSetFieldError = jest.fn();
let mockFormValues = { email: "", password: "" };
let mockFormErrors: Record<string, string> = {};

jest.mock("@/hooks", () => ({
  useForm: () => ({
    values: mockFormValues,
    errors: mockFormErrors,
    handleChange: jest.fn((field: string, value: string) => {
      mockFormValues = { ...mockFormValues, [field]: value };
    }),
    setFieldValue: mockSetFieldValue,
    setFieldError: mockSetFieldError,
  }),
}));

describe("useLogin", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockIsAuthenticated = false;
    mockFormValues = { email: "", password: "" };
    mockFormErrors = {};
  });

  it("deve retornar estado inicial correto", () => {
    const { result } = renderHook(() => useLogin());

    expect(result.current.loading).toBe(false);
    expect(result.current.errorMessage).toBe("");
    expect(result.current.rememberMe).toBe(false);
    expect(result.current.showPassword).toBe(false);
  });

  it("deve carregar email salvo do localStorage", () => {
    localStorage.setItem("userEmail", "teste@email.com");
    localStorage.setItem("rememberMe", "true");

    renderHook(() => useLogin());

    expect(mockSetFieldValue).toHaveBeenCalledWith("email", "teste@email.com");
  });

  it("não deve carregar email quando rememberMe é false", () => {
    localStorage.setItem("userEmail", "teste@email.com");
    localStorage.setItem("rememberMe", "false");

    renderHook(() => useLogin());

    expect(mockSetFieldValue).not.toHaveBeenCalled();
  });

  it("deve redirecionar quando já autenticado", () => {
    mockIsAuthenticated = true;

    renderHook(() => useLogin());

    expect(mockNavigate).toHaveBeenCalledWith("/admin", { replace: true });
  });

  it("deve alternar visibilidade da senha", () => {
    const { result } = renderHook(() => useLogin());

    expect(result.current.showPassword).toBe(false);

    act(() => {
      result.current.toggleShowPassword();
    });

    expect(result.current.showPassword).toBe(true);

    act(() => {
      result.current.toggleShowPassword();
    });

    expect(result.current.showPassword).toBe(false);
  });

  it("deve validar email obrigatório", async () => {
    mockFormValues = { email: "", password: "123456" };

    const { result } = renderHook(() => useLogin());

    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: jest.fn(),
      } as unknown as React.FormEvent);
    });

    expect(mockSetFieldError).toHaveBeenCalledWith(
      "email",
      "Email é obrigatório"
    );
  });

  it("deve validar formato de email inválido", async () => {
    mockFormValues = { email: "email-invalido", password: "123456" };

    const { result } = renderHook(() => useLogin());

    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: jest.fn(),
      } as unknown as React.FormEvent);
    });

    expect(mockSetFieldError).toHaveBeenCalledWith("email", "Email inválido");
  });

  it("deve validar senha obrigatória", async () => {
    mockFormValues = { email: "teste@email.com", password: "" };

    const { result } = renderHook(() => useLogin());

    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: jest.fn(),
      } as unknown as React.FormEvent);
    });

    expect(mockSetFieldError).toHaveBeenCalledWith(
      "password",
      "Senha é obrigatória"
    );
  });

  it("deve validar tamanho mínimo da senha", async () => {
    mockFormValues = { email: "teste@email.com", password: "12345" };

    const { result } = renderHook(() => useLogin());

    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: jest.fn(),
      } as unknown as React.FormEvent);
    });

    expect(mockSetFieldError).toHaveBeenCalledWith(
      "password",
      "Senha deve ter no mínimo 6 caracteres"
    );
  });

  it("deve fazer login com sucesso", async () => {
    mockFormValues = { email: "teste@email.com", password: "senha123" };
    mockLogin.mockResolvedValue(undefined);

    const { result } = renderHook(() => useLogin());

    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: jest.fn(),
      } as unknown as React.FormEvent);
    });

    expect(mockLogin).toHaveBeenCalledWith(
      "teste@email.com",
      "senha123",
      false
    );
    expect(mockNavigate).toHaveBeenCalledWith("/admin", { replace: true });
  });

  it("deve tratar erro de login", async () => {
    mockFormValues = { email: "teste@email.com", password: "senha123" };
    mockLogin.mockRejectedValue(new Error("Credenciais inválidas"));

    const { result } = renderHook(() => useLogin());

    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: jest.fn(),
      } as unknown as React.FormEvent);
    });

    expect(result.current.errorMessage).toBe("Credenciais inválidas");
  });

  it("deve usar mensagem padrão quando erro não tem message", async () => {
    mockFormValues = { email: "teste@email.com", password: "senha123" };
    mockLogin.mockRejectedValue({});

    const { result } = renderHook(() => useLogin());

    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: jest.fn(),
      } as unknown as React.FormEvent);
    });

    expect(result.current.errorMessage).toBe("Erro ao fazer login");
  });

  it("deve atualizar rememberMe", () => {
    const { result } = renderHook(() => useLogin());

    expect(result.current.rememberMe).toBe(false);

    act(() => {
      result.current.setRememberMe(true);
    });

    expect(result.current.rememberMe).toBe(true);
  });

  it("deve limpar mensagem de erro", () => {
    const { result } = renderHook(() => useLogin());

    act(() => {
      result.current.setErrorMessage("Algum erro");
    });

    expect(result.current.errorMessage).toBe("Algum erro");

    act(() => {
      result.current.setErrorMessage("");
    });

    expect(result.current.errorMessage).toBe("");
  });
});
