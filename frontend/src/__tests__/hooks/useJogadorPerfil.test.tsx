/**
 * Testes do hook useJogadorPerfil
 */

import { renderHook, waitFor } from "@testing-library/react";
import { useJogadorPerfil } from "@/pages/JogadorPerfil/hooks/useJogadorPerfil";

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

// Mock do service
const mockBuscarArena = jest.fn();
const mockBuscarJogador = jest.fn();
const mockBuscarEstatisticasJogador = jest.fn();
const mockBuscarHistoricoJogador = jest.fn();

jest.mock("@/services", () => ({
  getArenaPublicService: () => ({
    buscarArena: mockBuscarArena,
    buscarJogador: mockBuscarJogador,
    buscarEstatisticasJogador: mockBuscarEstatisticasJogador,
    buscarHistoricoJogador: mockBuscarHistoricoJogador,
  }),
}));

describe("useJogadorPerfil", () => {
  const mockArena = {
    id: "arena-1",
    nome: "Arena Teste",
    slug: "arena-teste",
  };

  const mockJogador = {
    id: "jogador-1",
    nome: "João Silva",
    nivel: "A",
    genero: "M",
  };

  const mockEstatisticas = {
    vitorias: 25,
    derrotas: 5,
    etapasParticipadas: 10,
    posicaoRanking: 3,
  };

  const mockHistorico = [
    { etapa: "Etapa 1", posicao: 1 },
    { etapa: "Etapa 2", posicao: 2 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup padrão dos mocks
    mockBuscarArena.mockResolvedValue(mockArena);
    mockBuscarJogador.mockResolvedValue(mockJogador);
    mockBuscarEstatisticasJogador.mockResolvedValue(mockEstatisticas);
    mockBuscarHistoricoJogador.mockResolvedValue(mockHistorico);
  });

  describe("Estado inicial", () => {
    it("deve retornar estado inicial correto", () => {
      const { result } = renderHook(() =>
        useJogadorPerfil("arena-teste", "jogador-1")
      );

      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBe("");
      expect(result.current.arena).toBeNull();
      expect(result.current.jogador).toBeNull();
      expect(result.current.historico).toEqual([]);
    });
  });

  describe("Carregamento de dados", () => {
    it("deve carregar todos os dados com sucesso", async () => {
      const { result } = renderHook(() =>
        useJogadorPerfil("arena-teste", "jogador-1")
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.arena).toEqual(mockArena);
      expect(result.current.jogador).toEqual(mockJogador);
      expect(result.current.estatisticas).toEqual(mockEstatisticas);
      expect(result.current.historico).toEqual(mockHistorico);
      expect(result.current.error).toBe("");
    });

    it("deve tratar erro quando parâmetros são inválidos", async () => {
      const { result } = renderHook(() =>
        useJogadorPerfil(undefined, undefined)
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe("Parâmetros inválidos");
    });

    it("deve tratar erro quando slug é undefined", async () => {
      const { result } = renderHook(() =>
        useJogadorPerfil(undefined, "jogador-1")
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe("Parâmetros inválidos");
    });

    it("deve tratar erro quando jogadorId é undefined", async () => {
      const { result } = renderHook(() =>
        useJogadorPerfil("arena-teste", undefined)
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe("Parâmetros inválidos");
    });

    it("deve tratar erro ao buscar arena", async () => {
      mockBuscarArena.mockRejectedValue(new Error("Arena não encontrada"));

      const { result } = renderHook(() =>
        useJogadorPerfil("arena-teste", "jogador-1")
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe("Arena não encontrada");
    });

    it("deve tratar erro quando jogador não é encontrado", async () => {
      mockBuscarJogador.mockResolvedValue(null);

      const { result } = renderHook(() =>
        useJogadorPerfil("arena-teste", "jogador-1")
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe("Jogador não encontrado");
    });

    it("deve tratar erro ao buscar jogador", async () => {
      mockBuscarJogador.mockRejectedValue(new Error("Erro de conexão"));

      const { result } = renderHook(() =>
        useJogadorPerfil("arena-teste", "jogador-1")
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe("Erro de conexão");
    });

    it("deve usar mensagem padrão quando erro não tem mensagem", async () => {
      mockBuscarArena.mockRejectedValue({});

      const { result } = renderHook(() =>
        useJogadorPerfil("arena-teste", "jogador-1")
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe("Erro ao carregar perfil do jogador");
    });

    it("deve tratar histórico nulo", async () => {
      mockBuscarHistoricoJogador.mockResolvedValue(null);

      const { result } = renderHook(() =>
        useJogadorPerfil("arena-teste", "jogador-1")
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.historico).toEqual([]);
    });
  });

  describe("Dados processados", () => {
    it("deve processar estatísticas corretamente", async () => {
      const { result } = renderHook(() =>
        useJogadorPerfil("arena-teste", "jogador-1")
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.totalVitorias).toBe(25);
      expect(result.current.totalDerrotas).toBe(5);
      expect(result.current.totalEtapas).toBe(10);
      expect(result.current.posicaoAtual).toBe(3);
    });

    it("deve processar nome do jogador", async () => {
      const { result } = renderHook(() =>
        useJogadorPerfil("arena-teste", "jogador-1")
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.nomeJogador).toBe("João Silva");
    });

    it("deve processar nível do jogador", async () => {
      const { result } = renderHook(() =>
        useJogadorPerfil("arena-teste", "jogador-1")
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.nivelJogador).toBe("A");
    });

    it("deve processar gênero do jogador", async () => {
      const { result } = renderHook(() =>
        useJogadorPerfil("arena-teste", "jogador-1")
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.generoJogador).toBe("M");
    });

    it("deve retornar valores padrão quando estatísticas são nulas", async () => {
      mockBuscarEstatisticasJogador.mockResolvedValue(null);

      const { result } = renderHook(() =>
        useJogadorPerfil("arena-teste", "jogador-1")
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.totalVitorias).toBe(0);
      expect(result.current.totalDerrotas).toBe(0);
      expect(result.current.totalEtapas).toBe(0);
      expect(result.current.posicaoAtual).toBe(0);
    });

    it("deve usar jogadorNome quando nome não existe", async () => {
      mockBuscarJogador.mockResolvedValue({
        id: "jogador-1",
        jogadorNome: "Maria Santos",
        jogadorNivel: "B",
        jogadorGenero: "F",
      });

      const { result } = renderHook(() =>
        useJogadorPerfil("arena-teste", "jogador-1")
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.nomeJogador).toBe("Maria Santos");
      expect(result.current.nivelJogador).toBe("B");
      expect(result.current.generoJogador).toBe("F");
    });

    it("deve retornar 'Jogador' quando não tem nome", async () => {
      mockBuscarJogador.mockResolvedValue({
        id: "jogador-1",
      });

      const { result } = renderHook(() =>
        useJogadorPerfil("arena-teste", "jogador-1")
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.nomeJogador).toBe("Jogador");
    });
  });

  describe("Função getInitials", () => {
    it("deve gerar iniciais para nome composto", async () => {
      const { result } = renderHook(() =>
        useJogadorPerfil("arena-teste", "jogador-1")
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.getInitials("João Silva")).toBe("JS");
    });

    it("deve gerar iniciais para nome com múltiplas partes", async () => {
      const { result } = renderHook(() =>
        useJogadorPerfil("arena-teste", "jogador-1")
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.getInitials("João Carlos da Silva")).toBe("JS");
    });

    it("deve gerar iniciais para nome simples", async () => {
      const { result } = renderHook(() =>
        useJogadorPerfil("arena-teste", "jogador-1")
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.getInitials("João")).toBe("JO");
    });

    it("deve gerar iniciais com espaços extras", async () => {
      const { result } = renderHook(() =>
        useJogadorPerfil("arena-teste", "jogador-1")
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.getInitials("  João Silva  ")).toBe("JS");
    });
  });

  describe("Chamadas ao service", () => {
    it("deve chamar todos os services na ordem correta", async () => {
      const { result } = renderHook(() =>
        useJogadorPerfil("arena-teste", "jogador-1")
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockBuscarArena).toHaveBeenCalledWith("arena-teste");
      expect(mockBuscarJogador).toHaveBeenCalledWith("arena-teste", "jogador-1");
      expect(mockBuscarEstatisticasJogador).toHaveBeenCalledWith(
        "arena-teste",
        "jogador-1"
      );
      expect(mockBuscarHistoricoJogador).toHaveBeenCalledWith(
        "arena-teste",
        "jogador-1"
      );
    });

    it("não deve chamar services quando parâmetros são inválidos", async () => {
      const { result } = renderHook(() =>
        useJogadorPerfil(undefined, undefined)
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockBuscarArena).not.toHaveBeenCalled();
      expect(mockBuscarJogador).not.toHaveBeenCalled();
    });
  });

  describe("Interface do hook", () => {
    it("deve expor todas as propriedades necessárias", async () => {
      const { result } = renderHook(() =>
        useJogadorPerfil("arena-teste", "jogador-1")
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Estados principais
      expect(result.current.loading).toBeDefined();
      expect(result.current.error).toBeDefined();
      expect(result.current.arena).toBeDefined();
      expect(result.current.jogador).toBeDefined();
      expect(result.current.historico).toBeDefined();
      expect(result.current.estatisticas).toBeDefined();

      // Dados processados
      expect(result.current.nomeJogador).toBeDefined();
      expect(result.current.nivelJogador).toBeDefined();
      expect(result.current.generoJogador).toBeDefined();
      expect(result.current.totalEtapas).toBeDefined();
      expect(result.current.totalVitorias).toBeDefined();
      expect(result.current.totalDerrotas).toBeDefined();
      expect(result.current.posicaoAtual).toBeDefined();

      // Funções
      expect(result.current.getInitials).toBeDefined();
      expect(typeof result.current.getInitials).toBe("function");
    });
  });
});
