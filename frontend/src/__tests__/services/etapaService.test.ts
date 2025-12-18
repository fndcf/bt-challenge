/**
 * Testes do EtapaService
 */

// Mock do apiClient
const mockGet = jest.fn();
const mockPost = jest.fn();
const mockPut = jest.fn();
const mockDelete = jest.fn();

jest.mock("@/services/apiClient", () => ({
  apiClient: {
    get: mockGet,
    post: mockPost,
    put: mockPut,
    patch: jest.fn(),
    delete: mockDelete,
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

// Mock do errorHandler
jest.mock("@/utils/errorHandler", () => ({
  handleError: jest.fn((error) => ({
    message: error.message || "Erro desconhecido",
    code: "unknown",
  })),
}));

import etapaService from "@/services/etapaService";
import { FormatoEtapa } from "@/types/etapa";
import { NivelJogador, GeneroJogador } from "@/types/jogador";

describe("EtapaService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockEtapa = {
    id: "etapa-123",
    nome: "Etapa Teste",
    formato: FormatoEtapa.DUPLA_FIXA,
    nivel: NivelJogador.INTERMEDIARIO,
    genero: GeneroJogador.MASCULINO,
    maxJogadores: 32,
    totalInscritos: 16,
    status: "aberta",
  };

  describe("criar", () => {
    it("deve criar etapa com sucesso", async () => {
      mockPost.mockResolvedValue(mockEtapa);

      const dto = {
        nome: "Etapa Teste",
        formato: FormatoEtapa.DUPLA_FIXA,
        nivel: NivelJogador.INTERMEDIARIO,
        genero: GeneroJogador.MASCULINO,
        maxJogadores: 32,
      };

      const result = await etapaService.criar(dto);

      expect(mockPost).toHaveBeenCalledWith("/etapas", dto);
      expect(result).toEqual(mockEtapa);
    });

    it("deve lançar erro quando criação falha", async () => {
      mockPost.mockRejectedValue(new Error("Erro ao criar etapa"));

      await expect(
        etapaService.criar({ nome: "Teste" } as any)
      ).rejects.toThrow("Erro ao criar etapa");
    });
  });

  describe("listar", () => {
    it("deve listar etapas sem filtros", async () => {
      const mockResponse = {
        etapas: [mockEtapa],
        total: 1,
        limite: 20,
        offset: 0,
        temMais: false,
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await etapaService.listar();

      expect(mockGet).toHaveBeenCalledWith("/etapas");
      expect(result).toEqual(mockResponse);
    });

    it("deve listar etapas com filtros", async () => {
      const mockResponse = {
        etapas: [mockEtapa],
        total: 1,
        limite: 10,
        offset: 0,
        temMais: false,
      };

      mockGet.mockResolvedValue(mockResponse);

      const filtros = {
        status: "aberta",
        formato: FormatoEtapa.DUPLA_FIXA,
        limite: 10,
      };

      const result = await etapaService.listar(filtros);

      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining("/etapas?"));
      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining("status="));
      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining("formato="));
      expect(result).toEqual(mockResponse);
    });

    it("deve retornar lista vazia quando erro ocorre", async () => {
      mockGet.mockRejectedValue(new Error("Erro de conexão"));

      const result = await etapaService.listar();

      expect(result).toEqual({
        etapas: [],
        total: 0,
        limite: 20,
        offset: 0,
        temMais: false,
      });
    });

    it("deve propagar erro de autenticação", async () => {
      mockGet.mockRejectedValue(new Error("Token inválido"));

      await expect(etapaService.listar()).rejects.toThrow("Token inválido");
    });
  });

  describe("buscarPorId", () => {
    it("deve buscar etapa por ID", async () => {
      mockGet.mockResolvedValue(mockEtapa);

      const result = await etapaService.buscarPorId("etapa-123");

      expect(mockGet).toHaveBeenCalledWith("/etapas/etapa-123");
      expect(result).toEqual(mockEtapa);
    });

    it("deve lançar erro quando etapa não encontrada", async () => {
      mockGet.mockRejectedValue(new Error("Etapa não encontrada"));

      await expect(etapaService.buscarPorId("inexistente")).rejects.toThrow(
        "Etapa não encontrada"
      );
    });
  });

  describe("buscarPorSlug", () => {
    it("deve buscar etapa por slug", async () => {
      mockGet.mockResolvedValue(mockEtapa);

      const result = await etapaService.buscarPorSlug("etapa-teste");

      expect(mockGet).toHaveBeenCalledWith("/etapas/slug/etapa-teste");
      expect(result).toEqual(mockEtapa);
    });

    it("deve lançar erro quando slug não encontrado", async () => {
      mockGet.mockRejectedValue(new Error("Etapa não encontrada"));

      await expect(etapaService.buscarPorSlug("inexistente")).rejects.toThrow();
    });
  });

  describe("atualizar", () => {
    it("deve atualizar etapa com sucesso", async () => {
      const updatedEtapa = { ...mockEtapa, nome: "Etapa Atualizada" };
      mockPut.mockResolvedValue(updatedEtapa);

      const result = await etapaService.atualizar("etapa-123", {
        nome: "Etapa Atualizada",
      });

      expect(mockPut).toHaveBeenCalledWith("/etapas/etapa-123", {
        nome: "Etapa Atualizada",
      });
      expect(result.nome).toBe("Etapa Atualizada");
    });

    it("deve lançar erro quando atualização falha", async () => {
      mockPut.mockRejectedValue(new Error("Erro ao atualizar"));

      await expect(
        etapaService.atualizar("etapa-123", { nome: "Teste" })
      ).rejects.toThrow();
    });
  });

  describe("deletar", () => {
    it("deve deletar etapa com sucesso", async () => {
      mockDelete.mockResolvedValue(undefined);

      await etapaService.deletar("etapa-123");

      expect(mockDelete).toHaveBeenCalledWith("/etapas/etapa-123");
    });

    it("deve lançar erro quando deleção falha", async () => {
      mockDelete.mockRejectedValue(new Error("Erro ao deletar"));

      await expect(etapaService.deletar("etapa-123")).rejects.toThrow();
    });
  });

  describe("inscreverJogadores", () => {
    it("deve inscrever jogadores em lote com sucesso", async () => {
      const mockResultado = {
        inscricoes: [
          { id: "insc-1", jogadorId: "j1" },
          { id: "insc-2", jogadorId: "j2" },
        ],
        erros: [],
        total: 2,
        sucessos: 2,
        falhas: 0,
      };

      mockPost.mockResolvedValue(mockResultado);

      const result = await etapaService.inscreverJogadores("etapa-123", [
        "j1",
        "j2",
      ]);

      expect(mockPost).toHaveBeenCalledWith("/etapas/etapa-123/inscrever-lote", {
        jogadorIds: ["j1", "j2"],
      });
      expect(result).toHaveLength(2);
    });

    it("deve lançar erro quando inscrição em lote falha", async () => {
      mockPost.mockRejectedValue(new Error("Etapa lotada"));

      await expect(
        etapaService.inscreverJogadores("etapa-123", ["j1", "j2"])
      ).rejects.toThrow();
    });
  });

  describe("listarInscricoes", () => {
    it("deve listar inscrições da etapa", async () => {
      const mockInscricoes = [
        { id: "insc-1", jogadorId: "j1", jogadorNome: "Jogador 1" },
        { id: "insc-2", jogadorId: "j2", jogadorNome: "Jogador 2" },
      ];

      mockGet.mockResolvedValue(mockInscricoes);

      const result = await etapaService.listarInscricoes("etapa-123");

      expect(mockGet).toHaveBeenCalledWith("/etapas/etapa-123/inscricoes");
      expect(result).toEqual(mockInscricoes);
    });

    it("deve retornar lista vazia quando erro ocorre", async () => {
      mockGet.mockRejectedValue(new Error("Erro"));

      const result = await etapaService.listarInscricoes("etapa-123");

      expect(result).toEqual([]);
    });
  });

  describe("cancelarInscricoesEmLote", () => {
    it("deve cancelar inscrições em lote com sucesso", async () => {
      const mockResultado = { canceladas: 2, erros: [] };
      mockDelete.mockResolvedValue(mockResultado);

      const result = await etapaService.cancelarInscricoesEmLote("etapa-123", [
        "insc-1",
        "insc-2",
      ]);

      expect(mockDelete).toHaveBeenCalledWith(
        "/etapas/etapa-123/inscricoes-lote",
        { data: { inscricaoIds: ["insc-1", "insc-2"] } }
      );
      expect(result.canceladas).toBe(2);
    });

    it("deve lançar erro quando cancelamento em lote falha", async () => {
      mockDelete.mockRejectedValue(new Error("Erro ao cancelar"));

      await expect(
        etapaService.cancelarInscricoesEmLote("etapa-123", ["insc-456"])
      ).rejects.toThrow();
    });
  });

  describe("encerrarInscricoes", () => {
    it("deve encerrar inscrições com sucesso", async () => {
      const etapaEncerrada = { ...mockEtapa, status: "em_andamento" };
      mockPost.mockResolvedValue(etapaEncerrada);

      const result = await etapaService.encerrarInscricoes("etapa-123");

      expect(mockPost).toHaveBeenCalledWith(
        "/etapas/etapa-123/encerrar-inscricoes"
      );
      expect(result.status).toBe("em_andamento");
    });

    it("deve lançar erro quando encerramento falha", async () => {
      mockPost.mockRejectedValue(new Error("Nenhum inscrito"));

      await expect(
        etapaService.encerrarInscricoes("etapa-123")
      ).rejects.toThrow();
    });
  });

  describe("reabrirInscricoes", () => {
    it("deve reabrir inscrições com sucesso", async () => {
      const etapaReaberta = { ...mockEtapa, status: "aberta" };
      mockPost.mockResolvedValue(etapaReaberta);

      const result = await etapaService.reabrirInscricoes("etapa-123");

      expect(mockPost).toHaveBeenCalledWith(
        "/etapas/etapa-123/reabrir-inscricoes"
      );
      expect(result.status).toBe("aberta");
    });

    it("deve lançar erro quando reabertura falha", async () => {
      mockPost.mockRejectedValue(new Error("Etapa já finalizada"));

      await expect(
        etapaService.reabrirInscricoes("etapa-123")
      ).rejects.toThrow();
    });
  });

  describe("gerarChaves", () => {
    it("deve gerar chaves com sucesso", async () => {
      const mockResultado = {
        duplas: [{ id: "d1" }],
        grupos: [{ id: "g1" }],
        partidas: [{ id: "p1" }],
      };

      mockPost.mockResolvedValue(mockResultado);

      const result = await etapaService.gerarChaves("etapa-123");

      expect(mockPost).toHaveBeenCalledWith("/etapas/etapa-123/gerar-chaves");
      expect(result).toEqual(mockResultado);
    });

    it("deve lançar erro quando geração de chaves falha", async () => {
      mockPost.mockRejectedValue(new Error("Número de inscritos insuficiente"));

      await expect(etapaService.gerarChaves("etapa-123")).rejects.toThrow();
    });
  });

  describe("obterEstatisticas", () => {
    it("deve retornar estatísticas", async () => {
      const mockStats = {
        totalEtapas: 10,
        inscricoesAbertas: 3,
        emAndamento: 2,
        finalizadas: 5,
        totalParticipacoes: 200,
      };

      mockGet.mockResolvedValue(mockStats);

      const result = await etapaService.obterEstatisticas();

      expect(mockGet).toHaveBeenCalledWith("/etapas/stats");
      expect(result).toEqual(mockStats);
    });

    it("deve retornar valores padrão quando erro ocorre", async () => {
      mockGet.mockRejectedValue(new Error("Erro"));

      const result = await etapaService.obterEstatisticas();

      expect(result).toEqual({
        totalEtapas: 0,
        inscricoesAbertas: 0,
        emAndamento: 0,
        finalizadas: 0,
        totalParticipacoes: 0,
      });
    });

    it("deve propagar erro de autenticação em estatísticas", async () => {
      mockGet.mockRejectedValue(new Error("Token inválido"));

      await expect(etapaService.obterEstatisticas()).rejects.toThrow(
        "Token inválido"
      );
    });
  });

  describe("encerrarEtapa", () => {
    it("deve encerrar etapa com sucesso", async () => {
      mockPost.mockResolvedValue(undefined);

      await etapaService.encerrarEtapa("etapa-123");

      expect(mockPost).toHaveBeenCalledWith("/etapas/etapa-123/encerrar");
    });

    it("deve lançar erro quando encerramento de etapa falha", async () => {
      mockPost.mockRejectedValue(new Error("Etapa possui partidas pendentes"));

      await expect(etapaService.encerrarEtapa("etapa-123")).rejects.toThrow();
    });
  });
});
