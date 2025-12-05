/**
 * Testes do hook useListagemJogadores
 */

import { renderHook, waitFor, act } from "@testing-library/react";
import { useListagemJogadores } from "@/pages/Jogadores/hooks/useListagemJogadores";
import { NivelJogador, StatusJogador, GeneroJogador } from "@/types/jogador";

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

// Mocks dos services
const mockListarJogadores = jest.fn();
const mockDeletarJogador = jest.fn();
const mockObterMinhaArena = jest.fn();

jest.mock("@/services", () => ({
  getJogadorService: () => ({
    listar: mockListarJogadores,
    deletar: mockDeletarJogador,
  }),
  getArenaAdminService: () => ({
    obterMinhaArena: mockObterMinhaArena,
  }),
}));

describe("useListagemJogadores", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();

    // Setup padrão dos mocks
    mockObterMinhaArena.mockResolvedValue({
      id: "arena-1",
      nome: "Arena Teste",
      slug: "arena-teste",
    });
    mockListarJogadores.mockResolvedValue({
      jogadores: [],
      total: 0,
      temMais: false,
    });
  });

  describe("Estado inicial", () => {
    it("deve retornar estado inicial correto", async () => {
      const { result } = renderHook(() => useListagemJogadores());

      expect(result.current.loading).toBe(true);
      expect(result.current.jogadores).toEqual([]);
      expect(result.current.errorMessage).toBe("");
      expect(result.current.successMessage).toBe("");
      expect(result.current.busca).toBe("");
      expect(result.current.nivelFiltro).toBe("");
      expect(result.current.statusFiltro).toBe("");
      expect(result.current.generoFiltro).toBe("");

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it("deve carregar arena ao montar", async () => {
      const { result } = renderHook(() => useListagemJogadores());

      await waitFor(() => {
        expect(result.current.arena).not.toBeNull();
      });

      expect(result.current.arena?.nome).toBe("Arena Teste");
    });

    it("deve usar localStorage como fallback para arena", async () => {
      mockObterMinhaArena.mockRejectedValue(new Error("Erro API"));
      localStorage.setItem(
        "arena",
        JSON.stringify({ id: "arena-local", nome: "Arena Local" })
      );

      const { result } = renderHook(() => useListagemJogadores());

      await waitFor(() => {
        expect(result.current.arena?.nome).toBe("Arena Local");
      });
    });

    it("deve tratar erro ao parsear arena do localStorage", async () => {
      mockObterMinhaArena.mockRejectedValue(new Error("Erro API"));
      localStorage.setItem("arena", "invalid-json");

      const { result } = renderHook(() => useListagemJogadores());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Arena deve continuar null pois não conseguiu parsear
      expect(result.current.arena).toBeNull();
    });
  });

  describe("Carregamento de jogadores", () => {
    it("deve carregar jogadores com sucesso", async () => {
      const jogadoresMock = [
        { id: "1", nome: "João", nivel: "A", status: "ativo", genero: "M" },
        { id: "2", nome: "Maria", nivel: "B", status: "ativo", genero: "F" },
      ];
      mockListarJogadores.mockResolvedValue({
        jogadores: jogadoresMock,
        total: 2,
        temMais: false,
      });

      const { result } = renderHook(() => useListagemJogadores());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.jogadores).toHaveLength(2);
      expect(result.current.total).toBe(2);
      expect(result.current.temMais).toBe(false);
    });

    it("deve tratar erro ao carregar jogadores", async () => {
      mockListarJogadores.mockRejectedValue(new Error("Erro ao buscar"));

      const { result } = renderHook(() => useListagemJogadores());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.errorMessage).toBe("Erro ao buscar");
    });

    it("deve usar mensagem padrão quando erro não tem mensagem", async () => {
      mockListarJogadores.mockRejectedValue({});

      const { result } = renderHook(() => useListagemJogadores());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.errorMessage).toBe("Erro ao carregar jogadores");
    });
  });

  describe("Filtros", () => {
    it("deve atualizar busca e resetar offset", async () => {
      const { result } = renderHook(() => useListagemJogadores());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setBusca("João");
      });

      expect(result.current.busca).toBe("João");
      expect(result.current.offset).toBe(0);
    });

    it("deve atualizar filtro de nível", async () => {
      const { result } = renderHook(() => useListagemJogadores());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setNivelFiltro(NivelJogador.A);
      });

      expect(result.current.nivelFiltro).toBe(NivelJogador.A);
    });

    it("deve atualizar filtro de status", async () => {
      const { result } = renderHook(() => useListagemJogadores());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setStatusFiltro(StatusJogador.ATIVO);
      });

      expect(result.current.statusFiltro).toBe(StatusJogador.ATIVO);
    });

    it("deve atualizar filtro de gênero", async () => {
      const { result } = renderHook(() => useListagemJogadores());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setGeneroFiltro(GeneroJogador.MASCULINO);
      });

      expect(result.current.generoFiltro).toBe(GeneroJogador.MASCULINO);
    });

    it("deve detectar filtros ativos", async () => {
      const { result } = renderHook(() => useListagemJogadores());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.temFiltrosAtivos).toBe(false);

      act(() => {
        result.current.setBusca("teste");
      });

      expect(result.current.temFiltrosAtivos).toBe(true);
    });

    it("deve limpar todos os filtros", async () => {
      const { result } = renderHook(() => useListagemJogadores());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setBusca("teste");
        result.current.setNivelFiltro(NivelJogador.A);
        result.current.setStatusFiltro(StatusJogador.ATIVO);
        result.current.setGeneroFiltro(GeneroJogador.MASCULINO);
      });

      expect(result.current.temFiltrosAtivos).toBe(true);

      act(() => {
        result.current.limparFiltros();
      });

      expect(result.current.busca).toBe("");
      expect(result.current.nivelFiltro).toBe("");
      expect(result.current.statusFiltro).toBe("");
      expect(result.current.generoFiltro).toBe("");
      expect(result.current.temFiltrosAtivos).toBe(false);
    });
  });

  describe("Paginação", () => {
    it("deve calcular página atual corretamente", async () => {
      const { result } = renderHook(() => useListagemJogadores());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.paginaAtual).toBe(1);
    });

    it("deve calcular total de páginas corretamente", async () => {
      mockListarJogadores.mockResolvedValue({
        jogadores: Array(12).fill({ id: "1", nome: "Teste" }),
        total: 50,
        temMais: true,
      });

      const { result } = renderHook(() => useListagemJogadores());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.totalPaginas).toBe(5); // 50/12 arredondado para cima
    });

    it("deve navegar para próxima página", async () => {
      mockListarJogadores.mockResolvedValue({
        jogadores: Array(12).fill({ id: "1", nome: "Teste" }),
        total: 24,
        temMais: true,
      });

      const { result } = renderHook(() => useListagemJogadores());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.handleProximaPagina();
      });

      expect(result.current.offset).toBe(12);
    });

    it("não deve navegar para próxima página se não tiver mais", async () => {
      mockListarJogadores.mockResolvedValue({
        jogadores: Array(5).fill({ id: "1", nome: "Teste" }),
        total: 5,
        temMais: false,
      });

      const { result } = renderHook(() => useListagemJogadores());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const offsetInicial = result.current.offset;

      act(() => {
        result.current.handleProximaPagina();
      });

      expect(result.current.offset).toBe(offsetInicial);
    });

    it("deve navegar para página anterior", async () => {
      mockListarJogadores.mockResolvedValue({
        jogadores: Array(12).fill({ id: "1", nome: "Teste" }),
        total: 24,
        temMais: true,
      });

      const { result } = renderHook(() => useListagemJogadores());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Primeiro vai para próxima página
      act(() => {
        result.current.handleProximaPagina();
      });

      expect(result.current.offset).toBe(12);

      // Depois volta
      act(() => {
        result.current.handlePaginaAnterior();
      });

      expect(result.current.offset).toBe(0);
    });

    it("não deve navegar para página anterior se já está na primeira", async () => {
      const { result } = renderHook(() => useListagemJogadores());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.handlePaginaAnterior();
      });

      expect(result.current.offset).toBe(0);
    });
  });

  describe("Ações", () => {
    it("deve deletar jogador com sucesso", async () => {
      mockListarJogadores.mockResolvedValue({
        jogadores: [{ id: "1", nome: "João" }],
        total: 1,
        temMais: false,
      });
      mockDeletarJogador.mockResolvedValue(undefined);

      const { result } = renderHook(() => useListagemJogadores());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.handleDeletarJogador({
          id: "1",
          nome: "João",
        } as any);
      });

      expect(mockDeletarJogador).toHaveBeenCalledWith("1");
      expect(result.current.successMessage).toBe(
        "João foi deletado com sucesso"
      );
    });

    it("deve tratar erro ao deletar jogador", async () => {
      mockListarJogadores.mockResolvedValue({
        jogadores: [{ id: "1", nome: "João" }],
        total: 1,
        temMais: false,
      });
      mockDeletarJogador.mockRejectedValue(new Error("Erro ao deletar"));

      const { result } = renderHook(() => useListagemJogadores());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.handleDeletarJogador({
          id: "1",
          nome: "João",
        } as any);
      });

      expect(result.current.errorMessage).toBe("Erro ao deletar");
    });

    it("deve usar mensagem padrão quando erro de deletar não tem mensagem", async () => {
      mockListarJogadores.mockResolvedValue({
        jogadores: [{ id: "1", nome: "João" }],
        total: 1,
        temMais: false,
      });
      mockDeletarJogador.mockRejectedValue({});

      const { result } = renderHook(() => useListagemJogadores());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.handleDeletarJogador({
          id: "1",
          nome: "João",
        } as any);
      });

      expect(result.current.errorMessage).toBe("Erro ao deletar jogador");
    });

    it("deve permitir setar mensagem de erro manualmente", async () => {
      const { result } = renderHook(() => useListagemJogadores());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setErrorMessage("Erro customizado");
      });

      expect(result.current.errorMessage).toBe("Erro customizado");
    });

    it("deve permitir setar mensagem de sucesso manualmente", async () => {
      const { result } = renderHook(() => useListagemJogadores());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setSuccessMessage("Sucesso!");
      });

      expect(result.current.successMessage).toBe("Sucesso!");
    });

    it("deve expor função carregarJogadores", async () => {
      const { result } = renderHook(() => useListagemJogadores());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(typeof result.current.carregarJogadores).toBe("function");
    });
  });

  describe("Interface do hook", () => {
    it("deve expor todas as propriedades necessárias", async () => {
      const { result } = renderHook(() => useListagemJogadores());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Estados principais
      expect(result.current.jogadores).toBeDefined();
      expect(result.current.loading).toBeDefined();
      expect(result.current.arena).toBeDefined();

      // Mensagens
      expect(result.current.errorMessage).toBeDefined();
      expect(result.current.successMessage).toBeDefined();
      expect(result.current.setErrorMessage).toBeDefined();
      expect(result.current.setSuccessMessage).toBeDefined();

      // Filtros
      expect(result.current.busca).toBeDefined();
      expect(result.current.setBusca).toBeDefined();
      expect(result.current.nivelFiltro).toBeDefined();
      expect(result.current.setNivelFiltro).toBeDefined();
      expect(result.current.statusFiltro).toBeDefined();
      expect(result.current.setStatusFiltro).toBeDefined();
      expect(result.current.generoFiltro).toBeDefined();
      expect(result.current.setGeneroFiltro).toBeDefined();
      expect(result.current.limparFiltros).toBeDefined();
      expect(result.current.temFiltrosAtivos).toBeDefined();

      // Paginação
      expect(result.current.total).toBeDefined();
      expect(result.current.offset).toBeDefined();
      expect(result.current.limite).toBeDefined();
      expect(result.current.temMais).toBeDefined();
      expect(result.current.paginaAtual).toBeDefined();
      expect(result.current.totalPaginas).toBeDefined();
      expect(result.current.handlePaginaAnterior).toBeDefined();
      expect(result.current.handleProximaPagina).toBeDefined();

      // Ações
      expect(result.current.carregarJogadores).toBeDefined();
      expect(result.current.handleDeletarJogador).toBeDefined();
    });
  });
});
