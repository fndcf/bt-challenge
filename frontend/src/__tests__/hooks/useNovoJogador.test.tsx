/**
 * Testes do hook useNovoJogador
 */

import { renderHook, act } from "@testing-library/react";
import { useNovoJogador } from "@/pages/NovoJogador/hooks/useNovoJogador";
import { GeneroJogador, NivelJogador, StatusJogador } from "@/types/jogador";

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
const mockCriarJogador = jest.fn();

jest.mock("@/services", () => ({
  getJogadorService: () => ({
    criar: mockCriarJogador,
  }),
}));

describe("useNovoJogador", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("Estado inicial", () => {
    it("deve retornar estado inicial correto", () => {
      const { result } = renderHook(() => useNovoJogador());

      expect(result.current.loading).toBe(false);
      expect(result.current.errorMessage).toBe("");
      expect(result.current.successMessage).toBe("");
      expect(result.current.formData).toEqual({
        nome: "",
        email: "",
        telefone: "",
        dataNascimento: "",
        genero: GeneroJogador.MASCULINO,
        nivel: NivelJogador.INICIANTE,
        status: StatusJogador.ATIVO,
        observacoes: "",
      });
      expect(result.current.errors).toEqual({});
    });
  });

  describe("handleChange", () => {
    it("deve atualizar campo do formulário", () => {
      const { result } = renderHook(() => useNovoJogador());

      act(() => {
        result.current.handleChange({
          target: { name: "nome", value: "João Silva" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.formData.nome).toBe("João Silva");
    });

    it("deve aplicar máscara de telefone", () => {
      const { result } = renderHook(() => useNovoJogador());

      act(() => {
        result.current.handleChange({
          target: { name: "telefone", value: "11999998888" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.formData.telefone).toBe("(11) 99999-8888");
    });

    it("deve validar nome com menos de 3 caracteres", () => {
      const { result } = renderHook(() => useNovoJogador());

      act(() => {
        result.current.handleChange({
          target: { name: "nome", value: "Jo" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.errors.nome).toBe(
        "Nome deve ter no mínimo 3 caracteres"
      );
    });

    it("deve validar email inválido", () => {
      const { result } = renderHook(() => useNovoJogador());

      act(() => {
        result.current.handleChange({
          target: { name: "email", value: "email-invalido" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.errors.email).toBe("Email inválido");
    });

    it("deve validar telefone inválido", () => {
      const { result } = renderHook(() => useNovoJogador());

      act(() => {
        result.current.handleChange({
          target: { name: "telefone", value: "11999" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.errors.telefone).toBe("Telefone inválido");
    });
  });

  describe("handleSubmit", () => {
    it("deve validar formulário antes de enviar", async () => {
      const { result } = renderHook(() => useNovoJogador());

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: jest.fn(),
        } as unknown as React.FormEvent);
      });

      expect(result.current.errorMessage).toBe(
        "Por favor, corrija os erros no formulário"
      );
      expect(mockCriarJogador).not.toHaveBeenCalled();
    });

    it("deve cadastrar jogador com sucesso", async () => {
      mockCriarJogador.mockResolvedValue({ id: "1", nome: "João Silva" });

      const { result } = renderHook(() => useNovoJogador());

      // Preencher formulário
      act(() => {
        result.current.handleChange({
          target: { name: "nome", value: "João Silva" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: jest.fn(),
        } as unknown as React.FormEvent);
      });

      expect(mockCriarJogador).toHaveBeenCalled();
      expect(result.current.successMessage).toBe(
        "Jogador cadastrado com sucesso!"
      );

      // Verificar navegação após timeout
      act(() => {
        jest.advanceTimersByTime(1500);
      });

      expect(mockNavigate).toHaveBeenCalledWith("/admin/jogadores");
    });

    it("deve tratar erro ao cadastrar", async () => {
      mockCriarJogador.mockRejectedValue(new Error("Email já existe"));

      const { result } = renderHook(() => useNovoJogador());

      act(() => {
        result.current.handleChange({
          target: { name: "nome", value: "João Silva" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: jest.fn(),
        } as unknown as React.FormEvent);
      });

      expect(result.current.errorMessage).toBe("Email já existe");
    });

    it("deve usar mensagem padrão quando erro não tem message", async () => {
      mockCriarJogador.mockRejectedValue({});

      const { result } = renderHook(() => useNovoJogador());

      act(() => {
        result.current.handleChange({
          target: { name: "nome", value: "João Silva" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: jest.fn(),
        } as unknown as React.FormEvent);
      });

      expect(result.current.errorMessage).toBe("Erro ao cadastrar jogador");
    });
  });

  describe("handleCancel", () => {
    it("deve navegar para página anterior", () => {
      const { result } = renderHook(() => useNovoJogador());

      act(() => {
        result.current.handleCancel();
      });

      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
  });

  describe("Setters de mensagens", () => {
    it("deve permitir setar mensagem de erro", () => {
      const { result } = renderHook(() => useNovoJogador());

      act(() => {
        result.current.setErrorMessage("Erro customizado");
      });

      expect(result.current.errorMessage).toBe("Erro customizado");
    });

    it("deve permitir setar mensagem de sucesso", () => {
      const { result } = renderHook(() => useNovoJogador());

      act(() => {
        result.current.setSuccessMessage("Sucesso!");
      });

      expect(result.current.successMessage).toBe("Sucesso!");
    });
  });
});
