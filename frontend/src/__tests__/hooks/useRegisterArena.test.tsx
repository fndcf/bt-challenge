/**
 * Testes do hook useRegisterArena
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { useRegisterArena } from "@/pages/RegisterArena/hooks/useRegisterArena";

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

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// Mock do service
const mockCriar = jest.fn();
const mockVerificarSlugDisponivel = jest.fn();

jest.mock("@/services", () => ({
  getArenaAdminService: () => ({
    criar: mockCriar,
    verificarSlugDisponivel: mockVerificarSlugDisponivel,
  }),
}));

// Mock do useDebounce para retornar valor imediatamente
// Não usamos requireActual pois causa problemas com Firebase
jest.mock("@/hooks", () => ({
  useDebounce: (value: string) => value,
  useForm: <T extends Record<string, any>>(initialValues: T) => {
    const [values, setValues] = jest.requireActual("react").useState(initialValues);
    const [errors, setErrors] = jest.requireActual("react").useState<Record<string, string>>({});

    const handleChange = (field: keyof T, value: any) => {
      setValues((prev: T) => ({ ...prev, [field]: value }));
      // Limpar erro do campo quando alterado
      setErrors((prev: Record<string, string>) => {
        const newErrors = { ...prev };
        delete newErrors[field as string];
        return newErrors;
      });
    };

    const setFieldError = (field: string, error: string) => {
      setErrors((prev: Record<string, string>) => ({ ...prev, [field]: error }));
    };

    const reset = () => {
      setValues(initialValues);
      setErrors({});
    };

    return { values, errors, handleChange, setFieldError, reset };
  },
  useDocumentTitle: jest.fn(),
  useClickOutside: jest.fn(),
}));

describe("useRegisterArena", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockVerificarSlugDisponivel.mockResolvedValue(true);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("Estado inicial", () => {
    it("deve retornar estado inicial correto", () => {
      const { result } = renderHook(() => useRegisterArena());

      expect(result.current.loading).toBe(false);
      expect(result.current.errorMessage).toBe("");
      expect(result.current.successMessage).toBe("");
      expect(result.current.checkingSlug).toBe(false);
      expect(result.current.values.nome).toBe("");
      expect(result.current.values.slug).toBe("");
      expect(result.current.values.adminEmail).toBe("");
      expect(result.current.values.adminPassword).toBe("");
      expect(result.current.values.confirmPassword).toBe("");
    });
  });

  describe("Verificação de slug", () => {
    it("deve verificar disponibilidade do slug quando tem 3+ caracteres", async () => {
      mockVerificarSlugDisponivel.mockResolvedValue(true);

      const { result } = renderHook(() => useRegisterArena());

      act(() => {
        result.current.handleChange("slug", "minha-arena");
      });

      await waitFor(() => {
        expect(mockVerificarSlugDisponivel).toHaveBeenCalledWith("minha-arena");
      });

      await waitFor(() => {
        expect(result.current.slugAvailable).toBe(true);
      });
    });

    it("deve definir slugAvailable como false quando slug não está disponível", async () => {
      mockVerificarSlugDisponivel.mockResolvedValue(false);

      const { result } = renderHook(() => useRegisterArena());

      act(() => {
        result.current.handleChange("slug", "slug-existente");
      });

      await waitFor(() => {
        expect(result.current.slugAvailable).toBe(false);
      });
    });

    it("deve definir slugAvailable como null quando ocorre erro na verificação", async () => {
      mockVerificarSlugDisponivel.mockRejectedValue(new Error("Erro de rede"));

      const { result } = renderHook(() => useRegisterArena());

      act(() => {
        result.current.handleChange("slug", "test-slug");
      });

      await waitFor(() => {
        expect(result.current.slugAvailable).toBeNull();
      });
    });

    it("não deve verificar slug com menos de 3 caracteres", async () => {
      const { result } = renderHook(() => useRegisterArena());

      act(() => {
        result.current.handleChange("slug", "ab");
      });

      await waitFor(() => {
        expect(mockVerificarSlugDisponivel).not.toHaveBeenCalled();
      });
    });

    it("deve definir slugAvailable como true quando slug está vazio", async () => {
      const { result } = renderHook(() => useRegisterArena());

      // Primeiro, definir um slug
      act(() => {
        result.current.handleChange("slug", "test");
      });

      await waitFor(() => {
        expect(mockVerificarSlugDisponivel).toHaveBeenCalled();
      });

      // Limpar mocks
      mockVerificarSlugDisponivel.mockClear();

      // Agora, limpar o slug
      act(() => {
        result.current.handleChange("slug", "");
      });

      await waitFor(() => {
        expect(result.current.slugAvailable).toBe(true);
      });
    });

    it("deve mostrar checkingSlug durante verificação", async () => {
      let resolvePromise: (value: boolean) => void;
      mockVerificarSlugDisponivel.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvePromise = resolve;
          })
      );

      const { result } = renderHook(() => useRegisterArena());

      act(() => {
        result.current.handleChange("slug", "test-slug");
      });

      await waitFor(() => {
        expect(result.current.checkingSlug).toBe(true);
      });

      act(() => {
        resolvePromise!(true);
      });

      await waitFor(() => {
        expect(result.current.checkingSlug).toBe(false);
      });
    });
  });

  describe("handleChange", () => {
    it("deve atualizar o valor do campo nome", () => {
      const { result } = renderHook(() => useRegisterArena());

      act(() => {
        result.current.handleChange("nome", "Minha Arena");
      });

      expect(result.current.values.nome).toBe("Minha Arena");
    });

    it("deve atualizar o valor do campo email", () => {
      const { result } = renderHook(() => useRegisterArena());

      act(() => {
        result.current.handleChange("adminEmail", "admin@arena.com");
      });

      expect(result.current.values.adminEmail).toBe("admin@arena.com");
    });

    it("deve atualizar o valor do campo senha", () => {
      const { result } = renderHook(() => useRegisterArena());

      act(() => {
        result.current.handleChange("adminPassword", "senha123");
      });

      expect(result.current.values.adminPassword).toBe("senha123");
    });
  });

  describe("Validações no handleSubmit", () => {
    it("deve validar nome com menos de 3 caracteres", async () => {
      const { result } = renderHook(() => useRegisterArena());

      act(() => {
        result.current.handleChange("nome", "AB");
        result.current.handleChange("adminEmail", "admin@test.com");
        result.current.handleChange("adminPassword", "senha123");
        result.current.handleChange("confirmPassword", "senha123");
      });

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: jest.fn(),
        } as unknown as React.FormEvent);
      });

      expect(result.current.errors.nome).toBe(
        "Nome deve ter no mínimo 3 caracteres"
      );
      expect(mockCriar).not.toHaveBeenCalled();
    });

    it("deve validar slug com menos de 3 caracteres", async () => {
      const { result } = renderHook(() => useRegisterArena());

      act(() => {
        result.current.handleChange("nome", "Arena Teste");
        result.current.handleChange("slug", "ab");
        result.current.handleChange("adminEmail", "admin@test.com");
        result.current.handleChange("adminPassword", "senha123");
        result.current.handleChange("confirmPassword", "senha123");
      });

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: jest.fn(),
        } as unknown as React.FormEvent);
      });

      expect(result.current.errors.slug).toBe(
        "Slug deve ter no mínimo 3 caracteres"
      );
      expect(mockCriar).not.toHaveBeenCalled();
    });

    it("deve validar formato do slug", async () => {
      const { result } = renderHook(() => useRegisterArena());

      act(() => {
        result.current.handleChange("nome", "Arena Teste");
        result.current.handleChange("slug", "Arena Inválida!");
        result.current.handleChange("adminEmail", "admin@test.com");
        result.current.handleChange("adminPassword", "senha123");
        result.current.handleChange("confirmPassword", "senha123");
      });

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: jest.fn(),
        } as unknown as React.FormEvent);
      });

      expect(result.current.errors.slug).toBe(
        "Slug deve conter apenas letras minúsculas, números e hífens"
      );
    });

    it("deve validar slug já em uso", async () => {
      mockVerificarSlugDisponivel.mockResolvedValue(false);

      const { result } = renderHook(() => useRegisterArena());

      act(() => {
        result.current.handleChange("nome", "Arena Teste");
        result.current.handleChange("slug", "slug-existente");
        result.current.handleChange("adminEmail", "admin@test.com");
        result.current.handleChange("adminPassword", "senha123");
        result.current.handleChange("confirmPassword", "senha123");
      });

      // Aguardar verificação do slug
      await waitFor(() => {
        expect(result.current.slugAvailable).toBe(false);
      });

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: jest.fn(),
        } as unknown as React.FormEvent);
      });

      expect(result.current.errors.slug).toBe("Este slug já está em uso");
    });

    it("deve validar email obrigatório", async () => {
      const { result } = renderHook(() => useRegisterArena());

      act(() => {
        result.current.handleChange("nome", "Arena Teste");
        result.current.handleChange("adminPassword", "senha123");
        result.current.handleChange("confirmPassword", "senha123");
      });

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: jest.fn(),
        } as unknown as React.FormEvent);
      });

      expect(result.current.errors.adminEmail).toBe("Email é obrigatório");
    });

    it("deve validar formato do email", async () => {
      const { result } = renderHook(() => useRegisterArena());

      act(() => {
        result.current.handleChange("nome", "Arena Teste");
        result.current.handleChange("adminEmail", "email-invalido");
        result.current.handleChange("adminPassword", "senha123");
        result.current.handleChange("confirmPassword", "senha123");
      });

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: jest.fn(),
        } as unknown as React.FormEvent);
      });

      expect(result.current.errors.adminEmail).toBe("Email inválido");
    });

    it("deve validar senha obrigatória", async () => {
      const { result } = renderHook(() => useRegisterArena());

      act(() => {
        result.current.handleChange("nome", "Arena Teste");
        result.current.handleChange("adminEmail", "admin@test.com");
      });

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: jest.fn(),
        } as unknown as React.FormEvent);
      });

      expect(result.current.errors.adminPassword).toBe("Senha é obrigatória");
    });

    it("deve validar senha com menos de 6 caracteres", async () => {
      const { result } = renderHook(() => useRegisterArena());

      act(() => {
        result.current.handleChange("nome", "Arena Teste");
        result.current.handleChange("adminEmail", "admin@test.com");
        result.current.handleChange("adminPassword", "12345");
        result.current.handleChange("confirmPassword", "12345");
      });

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: jest.fn(),
        } as unknown as React.FormEvent);
      });

      expect(result.current.errors.adminPassword).toBe(
        "Senha deve ter no mínimo 6 caracteres"
      );
    });

    it("deve validar senhas não coincidem", async () => {
      const { result } = renderHook(() => useRegisterArena());

      act(() => {
        result.current.handleChange("nome", "Arena Teste");
        result.current.handleChange("adminEmail", "admin@test.com");
        result.current.handleChange("adminPassword", "senha123");
        result.current.handleChange("confirmPassword", "outrasenha");
      });

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: jest.fn(),
        } as unknown as React.FormEvent);
      });

      expect(result.current.errors.confirmPassword).toBe(
        "As senhas não coincidem"
      );
    });
  });

  describe("Submit com sucesso", () => {
    it("deve criar arena com sucesso", async () => {
      mockCriar.mockResolvedValue({
        arena: { nome: "Arena Teste", slug: "arena-teste" },
      });

      const { result } = renderHook(() => useRegisterArena());

      act(() => {
        result.current.handleChange("nome", "Arena Teste");
        result.current.handleChange("adminEmail", "admin@test.com");
        result.current.handleChange("adminPassword", "senha123");
        result.current.handleChange("confirmPassword", "senha123");
      });

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: jest.fn(),
        } as unknown as React.FormEvent);
      });

      expect(mockCriar).toHaveBeenCalledWith({
        nome: "Arena Teste",
        adminEmail: "admin@test.com",
        adminPassword: "senha123",
      });

      expect(result.current.successMessage).toContain("Arena Teste");
      expect(result.current.successMessage).toContain("arena-teste");
    });

    it("deve incluir slug no payload quando fornecido", async () => {
      mockCriar.mockResolvedValue({
        arena: { nome: "Arena Teste", slug: "minha-arena" },
      });
      mockVerificarSlugDisponivel.mockResolvedValue(true);

      const { result } = renderHook(() => useRegisterArena());

      act(() => {
        result.current.handleChange("nome", "Arena Teste");
        result.current.handleChange("slug", "minha-arena");
        result.current.handleChange("adminEmail", "admin@test.com");
        result.current.handleChange("adminPassword", "senha123");
        result.current.handleChange("confirmPassword", "senha123");
      });

      // Aguardar verificação do slug
      await waitFor(() => {
        expect(result.current.slugAvailable).toBe(true);
      });

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: jest.fn(),
        } as unknown as React.FormEvent);
      });

      expect(mockCriar).toHaveBeenCalledWith({
        nome: "Arena Teste",
        slug: "minha-arena",
        adminEmail: "admin@test.com",
        adminPassword: "senha123",
      });
    });

    it("deve resetar formulário após sucesso", async () => {
      mockCriar.mockResolvedValue({
        arena: { nome: "Arena Teste", slug: "arena-teste" },
      });

      const { result } = renderHook(() => useRegisterArena());

      act(() => {
        result.current.handleChange("nome", "Arena Teste");
        result.current.handleChange("adminEmail", "admin@test.com");
        result.current.handleChange("adminPassword", "senha123");
        result.current.handleChange("confirmPassword", "senha123");
      });

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: jest.fn(),
        } as unknown as React.FormEvent);
      });

      expect(result.current.values.nome).toBe("");
      expect(result.current.values.adminEmail).toBe("");
      expect(result.current.slugAvailable).toBeNull();
    });

    it("deve redirecionar para login após 3 segundos", async () => {
      mockCriar.mockResolvedValue({
        arena: { nome: "Arena Teste", slug: "arena-teste" },
      });

      const { result } = renderHook(() => useRegisterArena());

      act(() => {
        result.current.handleChange("nome", "Arena Teste");
        result.current.handleChange("adminEmail", "admin@test.com");
        result.current.handleChange("adminPassword", "senha123");
        result.current.handleChange("confirmPassword", "senha123");
      });

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: jest.fn(),
        } as unknown as React.FormEvent);
      });

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });

    it("deve mostrar loading durante submissão", async () => {
      let resolvePromise: (value: any) => void;
      mockCriar.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvePromise = resolve;
          })
      );

      const { result } = renderHook(() => useRegisterArena());

      act(() => {
        result.current.handleChange("nome", "Arena Teste");
        result.current.handleChange("adminEmail", "admin@test.com");
        result.current.handleChange("adminPassword", "senha123");
        result.current.handleChange("confirmPassword", "senha123");
      });

      let submitPromise: Promise<void>;
      act(() => {
        submitPromise = result.current.handleSubmit({
          preventDefault: jest.fn(),
        } as unknown as React.FormEvent);
      });

      expect(result.current.loading).toBe(true);

      await act(async () => {
        resolvePromise!({
          arena: { nome: "Arena Teste", slug: "arena-teste" },
        });
        await submitPromise;
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe("Submit com erro", () => {
    it("deve exibir mensagem de erro da API", async () => {
      mockCriar.mockRejectedValue(new Error("Email já cadastrado"));

      const { result } = renderHook(() => useRegisterArena());

      act(() => {
        result.current.handleChange("nome", "Arena Teste");
        result.current.handleChange("adminEmail", "admin@test.com");
        result.current.handleChange("adminPassword", "senha123");
        result.current.handleChange("confirmPassword", "senha123");
      });

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: jest.fn(),
        } as unknown as React.FormEvent);
      });

      expect(result.current.errorMessage).toBe("Email já cadastrado");
    });

    it("deve exibir mensagem genérica quando erro não tem message", async () => {
      mockCriar.mockRejectedValue({});

      const { result } = renderHook(() => useRegisterArena());

      act(() => {
        result.current.handleChange("nome", "Arena Teste");
        result.current.handleChange("adminEmail", "admin@test.com");
        result.current.handleChange("adminPassword", "senha123");
        result.current.handleChange("confirmPassword", "senha123");
      });

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: jest.fn(),
        } as unknown as React.FormEvent);
      });

      expect(result.current.errorMessage).toBe(
        "Erro ao criar arena. Tente novamente."
      );
    });

    it("deve limpar mensagens anteriores no submit", async () => {
      mockCriar.mockRejectedValue(new Error("Primeiro erro"));

      const { result } = renderHook(() => useRegisterArena());

      act(() => {
        result.current.handleChange("nome", "Arena Teste");
        result.current.handleChange("adminEmail", "admin@test.com");
        result.current.handleChange("adminPassword", "senha123");
        result.current.handleChange("confirmPassword", "senha123");
      });

      // Primeiro submit com erro
      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: jest.fn(),
        } as unknown as React.FormEvent);
      });

      expect(result.current.errorMessage).toBe("Primeiro erro");

      // Segundo submit - deve limpar mensagem anterior
      mockCriar.mockResolvedValue({
        arena: { nome: "Arena Teste", slug: "arena-teste" },
      });

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: jest.fn(),
        } as unknown as React.FormEvent);
      });

      expect(result.current.errorMessage).toBe("");
    });
  });

  describe("Interface do hook", () => {
    it("deve expor todas as propriedades necessárias", () => {
      const { result } = renderHook(() => useRegisterArena());

      // Estado do formulário
      expect(result.current.values).toBeDefined();
      expect(result.current.errors).toBeDefined();

      // Estado da UI
      expect(result.current.loading).toBeDefined();
      expect(result.current.errorMessage).toBeDefined();
      expect(result.current.successMessage).toBeDefined();

      // Estado do Slug
      expect(result.current.checkingSlug).toBeDefined();
      expect(result.current.slugAvailable).toBeDefined();

      // Funções
      expect(result.current.handleChange).toBeDefined();
      expect(result.current.handleSubmit).toBeDefined();
    });
  });
});
