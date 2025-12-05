/**
 * Testes do ArenaContext
 */

import { render, screen, waitFor, act } from "@testing-library/react";
import { ArenaProvider, useArena } from "@/contexts/ArenaContext";

// Mock do hook useArenaLoader
const mockOnPublicArena = jest.fn();
const mockOnAdminArena = jest.fn();
const mockOnNoArena = jest.fn();

jest.mock("@/hooks/useArenaLoader", () => ({
  useArenaLoader: (callbacks: {
    onPublicArena: (slug: string) => void;
    onAdminArena: () => void;
    onNoArena: () => void;
  }) => {
    mockOnPublicArena.mockImplementation(callbacks.onPublicArena);
    mockOnAdminArena.mockImplementation(callbacks.onAdminArena);
    mockOnNoArena.mockImplementation(callbacks.onNoArena);
  },
}));

// Mock do serviço de arena
const mockBuscarPorSlug = jest.fn();
const mockObterMinhaArena = jest.fn();

jest.mock("@/services", () => ({
  getArenaAdminService: () => ({
    buscarPorSlug: mockBuscarPorSlug,
    obterMinhaArena: mockObterMinhaArena,
  }),
}));

// Mock do logger
jest.mock("@/utils/logger", () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Componente de teste para usar o hook useArena
const TestComponent: React.FC<{
  onArena?: (arena: ReturnType<typeof useArena>) => void;
}> = ({ onArena }) => {
  const arena = useArena();

  if (onArena) {
    onArena(arena);
  }

  return (
    <div>
      <span data-testid="loading">{arena.loading.toString()}</span>
      <span data-testid="arena">{arena.arena?.nome || "null"}</span>
      <span data-testid="error">{arena.error || "null"}</span>
    </div>
  );
};

const mockArena = {
  id: "arena-1",
  nome: "Arena Teste",
  slug: "arena-teste",
  endereco: "Rua Teste, 123",
  cidade: "São Paulo",
  estado: "SP",
};

describe("ArenaContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("ArenaProvider", () => {
    it("deve renderizar children", () => {
      render(
        <ArenaProvider>
          <div data-testid="child">Child</div>
        </ArenaProvider>
      );

      expect(screen.getByTestId("child")).toBeInTheDocument();
    });

    it("deve iniciar com arena null", () => {
      render(
        <ArenaProvider>
          <TestComponent />
        </ArenaProvider>
      );

      expect(screen.getByTestId("arena")).toHaveTextContent("null");
    });
  });

  describe("useArena", () => {
    it("deve lançar erro quando usado fora do ArenaProvider", () => {
      // Suprimir console.error do React para este teste
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow("useArena deve ser usado dentro de um ArenaProvider");

      consoleSpy.mockRestore();
    });
  });

  describe("fetchArenaBySlug", () => {
    it("deve carregar arena por slug com sucesso", async () => {
      mockBuscarPorSlug.mockResolvedValue(mockArena);

      render(
        <ArenaProvider>
          <TestComponent />
        </ArenaProvider>
      );

      // Simular chamada do hook useArenaLoader
      await act(async () => {
        await mockOnPublicArena("arena-teste");
      });

      await waitFor(() => {
        expect(screen.getByTestId("arena")).toHaveTextContent("Arena Teste");
      });

      expect(mockBuscarPorSlug).toHaveBeenCalledWith("arena-teste");
    });

    it("deve setar erro quando arena não é encontrada", async () => {
      mockBuscarPorSlug.mockResolvedValue(null);

      render(
        <ArenaProvider>
          <TestComponent />
        </ArenaProvider>
      );

      await act(async () => {
        await mockOnPublicArena("arena-inexistente");
      });

      await waitFor(() => {
        expect(screen.getByTestId("error")).toHaveTextContent(
          "Arena não encontrada"
        );
        expect(screen.getByTestId("arena")).toHaveTextContent("null");
      });
    });

    it("deve setar erro quando busca falha", async () => {
      mockBuscarPorSlug.mockRejectedValue(new Error("Erro de conexão"));

      render(
        <ArenaProvider>
          <TestComponent />
        </ArenaProvider>
      );

      await act(async () => {
        await mockOnPublicArena("arena-teste");
      });

      await waitFor(() => {
        expect(screen.getByTestId("error")).toHaveTextContent("Erro de conexão");
      });
    });
  });

  describe("fetchMyArena", () => {
    it("deve carregar arena do admin com sucesso", async () => {
      mockObterMinhaArena.mockResolvedValue(mockArena);

      render(
        <ArenaProvider>
          <TestComponent />
        </ArenaProvider>
      );

      await act(async () => {
        await mockOnAdminArena();
      });

      await waitFor(() => {
        expect(screen.getByTestId("arena")).toHaveTextContent("Arena Teste");
      });

      expect(mockObterMinhaArena).toHaveBeenCalled();
    });

    it("deve setar erro quando arena do admin não é encontrada", async () => {
      mockObterMinhaArena.mockResolvedValue(null);

      render(
        <ArenaProvider>
          <TestComponent />
        </ArenaProvider>
      );

      await act(async () => {
        await mockOnAdminArena();
      });

      await waitFor(() => {
        expect(screen.getByTestId("error")).toHaveTextContent(
          "Arena não encontrada"
        );
      });
    });

    it("deve setar erro quando busca da arena do admin falha", async () => {
      mockObterMinhaArena.mockRejectedValue(new Error("Não autorizado"));

      render(
        <ArenaProvider>
          <TestComponent />
        </ArenaProvider>
      );

      await act(async () => {
        await mockOnAdminArena();
      });

      await waitFor(() => {
        expect(screen.getByTestId("error")).toHaveTextContent("Não autorizado");
      });
    });
  });

  describe("clearArena", () => {
    it("deve limpar arena", async () => {
      mockBuscarPorSlug.mockResolvedValue(mockArena);

      render(
        <ArenaProvider>
          <TestComponent />
        </ArenaProvider>
      );

      // Primeiro carregar uma arena
      await act(async () => {
        await mockOnPublicArena("arena-teste");
      });

      await waitFor(() => {
        expect(screen.getByTestId("arena")).toHaveTextContent("Arena Teste");
      });

      // Depois limpar
      act(() => {
        mockOnNoArena();
      });

      await waitFor(() => {
        expect(screen.getByTestId("arena")).toHaveTextContent("null");
        expect(screen.getByTestId("loading")).toHaveTextContent("false");
      });
    });
  });

  describe("setArena", () => {
    it("deve permitir setar arena diretamente", async () => {
      let arenaRef: ReturnType<typeof useArena>;

      render(
        <ArenaProvider>
          <TestComponent
            onArena={(arena) => {
              arenaRef = arena;
            }}
          />
        </ArenaProvider>
      );

      act(() => {
        arenaRef!.setArena(mockArena);
      });

      await waitFor(() => {
        expect(screen.getByTestId("arena")).toHaveTextContent("Arena Teste");
      });
    });

    it("deve permitir setar arena como null", async () => {
      mockBuscarPorSlug.mockResolvedValue(mockArena);

      let arenaRef: ReturnType<typeof useArena>;

      render(
        <ArenaProvider>
          <TestComponent
            onArena={(arena) => {
              arenaRef = arena;
            }}
          />
        </ArenaProvider>
      );

      // Primeiro carregar uma arena
      await act(async () => {
        await mockOnPublicArena("arena-teste");
      });

      await waitFor(() => {
        expect(screen.getByTestId("arena")).toHaveTextContent("Arena Teste");
      });

      // Depois setar como null
      act(() => {
        arenaRef!.setArena(null);
      });

      await waitFor(() => {
        expect(screen.getByTestId("arena")).toHaveTextContent("null");
      });
    });
  });

  describe("estados de loading", () => {
    it("deve setar loading true durante busca por slug", async () => {
      let resolvePromise: (value: any) => void;
      mockBuscarPorSlug.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvePromise = resolve;
          })
      );

      render(
        <ArenaProvider>
          <TestComponent />
        </ArenaProvider>
      );

      // Iniciar busca
      act(() => {
        mockOnPublicArena("arena-teste");
      });

      // Loading deve estar true durante a busca
      expect(screen.getByTestId("loading")).toHaveTextContent("true");

      // Resolver a promise
      await act(async () => {
        resolvePromise!(mockArena);
      });

      // Loading deve estar false após a busca
      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("false");
      });
    });

    it("deve setar loading false mesmo quando busca falha", async () => {
      mockBuscarPorSlug.mockRejectedValue(new Error("Erro"));

      render(
        <ArenaProvider>
          <TestComponent />
        </ArenaProvider>
      );

      await act(async () => {
        await mockOnPublicArena("arena-teste");
      });

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("false");
      });
    });
  });
});
