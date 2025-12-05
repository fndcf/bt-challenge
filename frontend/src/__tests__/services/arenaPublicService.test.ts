/**
 * Testes do ArenaPublicService
 */

// Mock do apiClient
const mockGet = jest.fn();

jest.mock("@/services/apiClient", () => ({
  apiClient: {
    get: mockGet,
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

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

import arenaPublicService from "@/services/arenaPublicService";

describe("ArenaPublicService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockArena = {
    id: "arena-123",
    nome: "Arena Pública",
    slug: "arena-publica",
    descricao: "Descrição",
    logoUrl: "https://logo.png",
    corPrimaria: "#3B82F6",
  };

  describe("buscarArena", () => {
    it("deve buscar arena pública por slug", async () => {
      mockGet.mockResolvedValue(mockArena);

      const result = await arenaPublicService.buscarArena("arena-publica");

      expect(mockGet).toHaveBeenCalledWith("/public/arena-publica");
      expect(result).toEqual(mockArena);
    });

    it("deve lançar erro quando arena não encontrada", async () => {
      mockGet.mockRejectedValue(new Error("Arena não encontrada"));

      await expect(
        arenaPublicService.buscarArena("inexistente")
      ).rejects.toThrow("Arena não encontrada");
    });
  });

  describe("buscarEstatisticas", () => {
    it("deve buscar estatísticas da arena", async () => {
      const mockStats = {
        totalEtapas: 10,
        totalJogadores: 150,
        totalPartidas: 500,
      };

      mockGet.mockResolvedValue(mockStats);

      const result = await arenaPublicService.buscarEstatisticas("arena-publica");

      expect(mockGet).toHaveBeenCalledWith("/public/arena-publica/estatisticas");
      expect(result).toEqual(mockStats);
    });

    it("deve retornar null quando erro ocorre", async () => {
      mockGet.mockRejectedValue(new Error("Erro"));

      const result = await arenaPublicService.buscarEstatisticas("arena-publica");

      expect(result).toBeNull();
    });
  });

  describe("listarEtapas", () => {
    it("deve listar etapas públicas sem filtros", async () => {
      const mockEtapas = [
        { id: "e1", nome: "Etapa 1", status: "aberta" },
        { id: "e2", nome: "Etapa 2", status: "finalizada" },
      ];

      mockGet.mockResolvedValue({ etapas: mockEtapas, total: 2 });

      const result = await arenaPublicService.listarEtapas("arena-publica");

      expect(mockGet).toHaveBeenCalledWith("/public/arena-publica/etapas");
      expect(result).toEqual(mockEtapas);
    });

    it("deve listar etapas com filtros", async () => {
      const mockEtapas = [{ id: "e1", nome: "Etapa 1", status: "aberta" }];

      mockGet.mockResolvedValue({ etapas: mockEtapas, total: 1 });

      const filtros = { status: "aberta", nivel: "INTERMEDIARIO", limite: 10 };
      const result = await arenaPublicService.listarEtapas(
        "arena-publica",
        filtros
      );

      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining("/public/arena-publica/etapas?")
      );
      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining("status="));
      expect(result).toEqual(mockEtapas);
    });

    it("deve retornar lista vazia quando erro ocorre", async () => {
      mockGet.mockRejectedValue(new Error("Erro"));

      const result = await arenaPublicService.listarEtapas("arena-publica");

      expect(result).toEqual([]);
    });
  });

  describe("buscarEtapa", () => {
    it("deve buscar etapa específica", async () => {
      const mockEtapa = { id: "e1", nome: "Etapa 1", status: "aberta" };

      mockGet.mockResolvedValue(mockEtapa);

      const result = await arenaPublicService.buscarEtapa(
        "arena-publica",
        "e1"
      );

      expect(mockGet).toHaveBeenCalledWith("/public/arena-publica/etapas/e1");
      expect(result).toEqual(mockEtapa);
    });

    it("deve lançar erro quando etapa não encontrada", async () => {
      mockGet.mockRejectedValue(new Error("Etapa não encontrada"));

      await expect(
        arenaPublicService.buscarEtapa("arena-publica", "inexistente")
      ).rejects.toThrow("Etapa não encontrada");
    });
  });

  describe("buscarGruposEtapa", () => {
    it("deve buscar grupos da etapa", async () => {
      const mockGrupos = [
        { id: "g1", nome: "Grupo A" },
        { id: "g2", nome: "Grupo B" },
      ];

      mockGet.mockResolvedValue(mockGrupos);

      const result = await arenaPublicService.buscarGruposEtapa(
        "arena-publica",
        "e1"
      );

      expect(mockGet).toHaveBeenCalledWith(
        "/public/arena-publica/etapas/e1/grupos"
      );
      expect(result).toEqual(mockGrupos);
    });

    it("deve retornar null quando erro ocorre", async () => {
      mockGet.mockRejectedValue(new Error("Erro"));

      const result = await arenaPublicService.buscarGruposEtapa(
        "arena-publica",
        "e1"
      );

      expect(result).toBeNull();
    });
  });

  describe("buscarChavesEtapa", () => {
    it("deve buscar chaves da etapa", async () => {
      const mockChaves = { grupos: [], confrontos: [] };

      mockGet.mockResolvedValue(mockChaves);

      const result = await arenaPublicService.buscarChavesEtapa(
        "arena-publica",
        "e1"
      );

      expect(mockGet).toHaveBeenCalledWith(
        "/public/arena-publica/etapas/e1/chaves"
      );
      expect(result).toEqual(mockChaves);
    });

    it("deve retornar null quando erro ocorre", async () => {
      mockGet.mockRejectedValue(new Error("Erro"));

      const result = await arenaPublicService.buscarChavesEtapa(
        "arena-publica",
        "e1"
      );

      expect(result).toBeNull();
    });
  });

  describe("buscarInscritosEtapa", () => {
    it("deve buscar e mapear inscritos da etapa", async () => {
      const mockInscricoes = [
        {
          id: "i1",
          jogadorId: "j1",
          jogadorNome: "Jogador 1",
          jogadorNivel: "INTERMEDIARIO",
          jogadorGenero: "MASCULINO",
          status: "confirmado",
          seed: 1,
        },
        {
          id: "i2",
          jogadorId: "j2",
          jogadorNome: "Jogador 2",
          jogadorNivel: "AVANCADO",
          jogadorGenero: "FEMININO",
          status: "confirmado",
        },
      ];

      mockGet.mockResolvedValue(mockInscricoes);

      const result = await arenaPublicService.buscarInscritosEtapa(
        "arena-publica",
        "e1"
      );

      expect(mockGet).toHaveBeenCalledWith(
        "/public/arena-publica/etapas/e1/inscricoes"
      );
      expect(result).toHaveLength(2);
      expect(result[0].nome).toBe("Jogador 1");
      expect(result[0].nivel).toBe("INTERMEDIARIO");
      expect(result[0].seed).toBe(1);
      expect(result[1].seed).toBe(2); // Index + 1 quando seed não fornecido
    });

    it("deve retornar lista vazia quando erro ocorre", async () => {
      mockGet.mockRejectedValue(new Error("Erro"));

      const result = await arenaPublicService.buscarInscritosEtapa(
        "arena-publica",
        "e1"
      );

      expect(result).toEqual([]);
    });
  });

  describe("buscarRanking", () => {
    it("deve buscar ranking com limite padrão", async () => {
      const mockRanking = [
        { id: "j1", nome: "Top 1", pontos: 1000 },
        { id: "j2", nome: "Top 2", pontos: 900 },
      ];

      mockGet.mockResolvedValue(mockRanking);

      const result = await arenaPublicService.buscarRanking("arena-publica");

      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining("/public/arena-publica/ranking?limite=50")
      );
      expect(result).toEqual(mockRanking);
    });

    it("deve buscar ranking com filtros", async () => {
      const mockRanking = [{ id: "j1", nome: "Top 1" }];

      mockGet.mockResolvedValue(mockRanking);

      const result = await arenaPublicService.buscarRanking(
        "arena-publica",
        10,
        "MASCULINO",
        "AVANCADO"
      );

      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining("limite=10")
      );
      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining("genero=MASCULINO")
      );
      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining("nivel=AVANCADO")
      );
      expect(result).toEqual(mockRanking);
    });

    it("deve retornar lista vazia quando erro ocorre", async () => {
      mockGet.mockRejectedValue(new Error("Erro"));

      const result = await arenaPublicService.buscarRanking("arena-publica");

      expect(result).toEqual([]);
    });
  });

  describe("listarJogadores", () => {
    it("deve listar jogadores sem filtros", async () => {
      const mockResponse = {
        jogadores: [{ id: "j1", nome: "Jogador 1" }],
        total: 1,
      };

      mockGet.mockResolvedValue(mockResponse);

      const result =
        await arenaPublicService.listarJogadores("arena-publica");

      expect(mockGet).toHaveBeenCalledWith("/public/arena-publica/jogadores");
      expect(result).toEqual(mockResponse);
    });

    it("deve listar jogadores com filtros", async () => {
      const mockResponse = { jogadores: [], total: 0 };

      mockGet.mockResolvedValue(mockResponse);

      const filtros = { busca: "João", nivel: "INICIANTE", limite: 20 };
      const result = await arenaPublicService.listarJogadores(
        "arena-publica",
        filtros
      );

      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining("/public/arena-publica/jogadores?")
      );
      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining("busca="));
      expect(result).toEqual(mockResponse);
    });

    it("deve retornar objeto vazio quando erro ocorre", async () => {
      mockGet.mockRejectedValue(new Error("Erro"));

      const result =
        await arenaPublicService.listarJogadores("arena-publica");

      expect(result).toEqual({ jogadores: [], total: 0 });
    });
  });

  describe("buscarJogador", () => {
    it("deve buscar jogador específico", async () => {
      const mockJogador = { id: "j1", nome: "Jogador 1", pontos: 500 };

      mockGet.mockResolvedValue(mockJogador);

      const result = await arenaPublicService.buscarJogador(
        "arena-publica",
        "j1"
      );

      expect(mockGet).toHaveBeenCalledWith(
        "/public/arena-publica/jogadores/j1"
      );
      expect(result).toEqual(mockJogador);
    });

    it("deve retornar null quando jogador não encontrado", async () => {
      mockGet.mockRejectedValue(new Error("Jogador não encontrado"));

      const result = await arenaPublicService.buscarJogador(
        "arena-publica",
        "inexistente"
      );

      expect(result).toBeNull();
    });
  });

  describe("buscarHistoricoJogador", () => {
    it("deve buscar histórico do jogador", async () => {
      const mockHistorico = {
        etapas: [{ id: "e1", nome: "Etapa 1", posicao: 3 }],
      };

      mockGet.mockResolvedValue(mockHistorico);

      const result = await arenaPublicService.buscarHistoricoJogador(
        "arena-publica",
        "j1"
      );

      expect(mockGet).toHaveBeenCalledWith(
        "/public/arena-publica/jogadores/j1/historico"
      );
      expect(result).toEqual(mockHistorico);
    });

    it("deve retornar null quando erro ocorre", async () => {
      mockGet.mockRejectedValue(new Error("Erro"));

      const result = await arenaPublicService.buscarHistoricoJogador(
        "arena-publica",
        "j1"
      );

      expect(result).toBeNull();
    });
  });

  describe("buscarEstatisticasJogador", () => {
    it("deve buscar estatísticas do jogador", async () => {
      const mockStats = {
        jogadorId: "j1",
        jogadorNome: "Jogador 1",
        etapasParticipadas: 5,
        jogos: 20,
        vitorias: 15,
        derrotas: 5,
        pontos: 500,
        posicaoRanking: 3,
        setsVencidos: 35,
        setsPerdidos: 15,
        gamesVencidos: 200,
        gamesPerdidos: 100,
        saldoSets: 20,
        saldoGames: 100,
      };

      mockGet.mockResolvedValue(mockStats);

      const result = await arenaPublicService.buscarEstatisticasJogador(
        "arena-publica",
        "j1"
      );

      expect(mockGet).toHaveBeenCalledWith(
        "/public/arena-publica/jogadores/j1/estatisticas"
      );
      expect(result).toEqual(mockStats);
    });

    it("deve retornar valores zerados quando erro ocorre", async () => {
      mockGet.mockRejectedValue(new Error("Erro"));

      const result = await arenaPublicService.buscarEstatisticasJogador(
        "arena-publica",
        "j1"
      );

      expect(result.jogadorId).toBe("j1");
      expect(result.jogadorNome).toBe("");
      expect(result.etapasParticipadas).toBe(0);
      expect(result.vitorias).toBe(0);
      expect(result.pontos).toBe(0);
    });
  });
});
