/**
 * Testes do hook useEditarJogador
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { useEditarJogador } from "@/pages/EditarJogador/hooks/useEditarJogador";
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
let mockParamsId: string | undefined = "1";

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  useParams: () => ({ id: mockParamsId }),
}));

// Mock do service
const mockBuscarPorId = jest.fn();
const mockAtualizar = jest.fn();

jest.mock("@/services", () => ({
  getJogadorService: () => ({
    buscarPorId: mockBuscarPorId,
    atualizar: mockAtualizar,
  }),
}));

const mockJogador = {
  id: "1",
  nome: "João Silva",
  email: "joao@email.com",
  telefone: "(11) 99999-8888",
  dataNascimento: "1990-05-15",
  genero: GeneroJogador.MASCULINO,
  nivel: NivelJogador.INTERMEDIARIO,
  status: StatusJogador.ATIVO,
  observacoes: "Jogador experiente",
};

describe("useEditarJogador", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockParamsId = "1";
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("Estado inicial e carregamento", () => {
    it("deve iniciar com loading true", () => {
      mockBuscarPorId.mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useEditarJogador());

      expect(result.current.loading).toBe(true);
    });

    it("deve carregar jogador com sucesso", async () => {
      mockBuscarPorId.mockResolvedValue(mockJogador);

      const { result } = renderHook(() => useEditarJogador());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.jogador).toEqual(mockJogador);
      expect(result.current.formData.nome).toBe("João Silva");
      expect(result.current.formData.email).toBe("joao@email.com");
      expect(result.current.errorMessage).toBe("");
    });

    it("deve definir erro quando ID não é fornecido", async () => {
      mockParamsId = undefined;

      const { result } = renderHook(() => useEditarJogador());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.errorMessage).toBe("ID do jogador não fornecido");
    });

    it("deve tratar erro ao carregar jogador", async () => {
      mockBuscarPorId.mockRejectedValue(new Error("Jogador não encontrado"));

      const { result } = renderHook(() => useEditarJogador());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.errorMessage).toBe("Jogador não encontrado");
    });
  });

  describe("handleChange", () => {
    it("deve atualizar campo do formulário", async () => {
      mockBuscarPorId.mockResolvedValue(mockJogador);

      const { result } = renderHook(() => useEditarJogador());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.handleChange({
          target: { name: "nome", value: "Maria Silva" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.formData.nome).toBe("Maria Silva");
    });

    it("deve aplicar máscara de telefone", async () => {
      mockBuscarPorId.mockResolvedValue(mockJogador);

      const { result } = renderHook(() => useEditarJogador());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.handleChange({
          target: { name: "telefone", value: "21988887777" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.formData.telefone).toBe("(21) 98888-7777");
    });

    it("deve validar nome curto", async () => {
      mockBuscarPorId.mockResolvedValue(mockJogador);

      const { result } = renderHook(() => useEditarJogador());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.handleChange({
          target: { name: "nome", value: "Jo" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.errors.nome).toBe("Nome deve ter no mínimo 3 caracteres");
    });

    it("deve validar nome longo", async () => {
      mockBuscarPorId.mockResolvedValue(mockJogador);

      const { result } = renderHook(() => useEditarJogador());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.handleChange({
          target: { name: "nome", value: "A".repeat(101) },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.errors.nome).toBe("Nome deve ter no máximo 100 caracteres");
    });

    it("deve validar email inválido", async () => {
      mockBuscarPorId.mockResolvedValue(mockJogador);

      const { result } = renderHook(() => useEditarJogador());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.handleChange({
          target: { name: "email", value: "email-invalido" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.errors.email).toBe("Email inválido");
    });

    it("deve validar telefone inválido", async () => {
      mockBuscarPorId.mockResolvedValue(mockJogador);

      const { result } = renderHook(() => useEditarJogador());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.handleChange({
          target: { name: "telefone", value: "11999" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.errors.telefone).toBe("Telefone inválido");
    });

    it("deve validar data de nascimento inválida (muito jovem)", async () => {
      mockBuscarPorId.mockResolvedValue(mockJogador);

      const { result } = renderHook(() => useEditarJogador());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.handleChange({
          target: { name: "dataNascimento", value: "2023-01-01" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.errors.dataNascimento).toBe("Data de nascimento inválida");
    });
  });

  describe("handleSubmit", () => {
    it("deve validar formulário antes de enviar", async () => {
      mockBuscarPorId.mockResolvedValue(mockJogador);

      const { result } = renderHook(() => useEditarJogador());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Definir nome inválido
      act(() => {
        result.current.handleChange({
          target: { name: "nome", value: "Jo" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: jest.fn(),
        } as unknown as React.FormEvent);
      });

      expect(result.current.errorMessage).toBe(
        "Por favor, corrija os erros no formulário"
      );
      expect(mockAtualizar).not.toHaveBeenCalled();
    });

    it("deve detectar quando não há alterações", async () => {
      mockBuscarPorId.mockResolvedValue(mockJogador);

      const { result } = renderHook(() => useEditarJogador());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: jest.fn(),
        } as unknown as React.FormEvent);
      });

      expect(result.current.errorMessage).toBe("Nenhuma alteração foi feita");
    });

    it("deve atualizar jogador com sucesso", async () => {
      mockBuscarPorId.mockResolvedValue(mockJogador);
      mockAtualizar.mockResolvedValue({ id: "1" });

      const { result } = renderHook(() => useEditarJogador());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.handleChange({
          target: { name: "nome", value: "João Santos" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: jest.fn(),
        } as unknown as React.FormEvent);
      });

      expect(mockAtualizar).toHaveBeenCalled();
      expect(result.current.successMessage).toBe("Jogador atualizado com sucesso!");

      // Verificar navegação após timeout
      act(() => {
        jest.advanceTimersByTime(1500);
      });

      expect(mockNavigate).toHaveBeenCalledWith("/admin/jogadores");
    });

    it("deve tratar erro ao atualizar", async () => {
      mockBuscarPorId.mockResolvedValue(mockJogador);
      mockAtualizar.mockRejectedValue(new Error("Email já existe"));

      const { result } = renderHook(() => useEditarJogador());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.handleChange({
          target: { name: "nome", value: "João Santos" },
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
      mockBuscarPorId.mockResolvedValue(mockJogador);
      mockAtualizar.mockRejectedValue({});

      const { result } = renderHook(() => useEditarJogador());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.handleChange({
          target: { name: "nome", value: "João Santos" },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: jest.fn(),
        } as unknown as React.FormEvent);
      });

      expect(result.current.errorMessage).toBe("Erro ao atualizar jogador");
    });
  });

  describe("handleCancel", () => {
    it("deve navegar para lista de jogadores", async () => {
      mockBuscarPorId.mockResolvedValue(mockJogador);

      const { result } = renderHook(() => useEditarJogador());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.handleCancel();
      });

      expect(mockNavigate).toHaveBeenCalledWith("/admin/jogadores");
    });
  });

  describe("Setters de mensagens", () => {
    it("deve permitir setar mensagem de erro", async () => {
      mockBuscarPorId.mockResolvedValue(mockJogador);

      const { result } = renderHook(() => useEditarJogador());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setErrorMessage("Erro customizado");
      });

      expect(result.current.errorMessage).toBe("Erro customizado");
    });

    it("deve permitir setar mensagem de sucesso", async () => {
      mockBuscarPorId.mockResolvedValue(mockJogador);

      const { result } = renderHook(() => useEditarJogador());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setSuccessMessage("Sucesso!");
      });

      expect(result.current.successMessage).toBe("Sucesso!");
    });
  });
});
