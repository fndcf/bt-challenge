/**
 * Testes do ChaveService
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

import chaveService from "@/services/chaveService";
import { TipoFase } from "@/types/chave";

describe("ChaveService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("gerarChaves", () => {
    it("deve gerar chaves com sucesso", async () => {
      const mockResultado = {
        duplas: [{ id: "d1", nome: "Dupla 1" }],
        grupos: [{ id: "g1", nome: "Grupo A" }],
        partidas: [{ id: "p1" }],
      };

      mockPost.mockResolvedValue(mockResultado);

      const result = await chaveService.gerarChaves("etapa-123");

      expect(mockPost).toHaveBeenCalledWith(
        "/etapas/etapa-123/gerar-chaves",
        {}
      );
      expect(result).toEqual(mockResultado);
    });

    it("deve lançar erro quando geração falha", async () => {
      mockPost.mockRejectedValue(new Error("Número insuficiente de inscritos"));

      await expect(chaveService.gerarChaves("etapa-123")).rejects.toThrow(
        "Número insuficiente de inscritos"
      );
    });
  });

  describe("excluirChaves", () => {
    it("deve excluir chaves com sucesso", async () => {
      mockDelete.mockResolvedValue(undefined);

      await chaveService.excluirChaves("etapa-123");

      expect(mockDelete).toHaveBeenCalledWith("/etapas/etapa-123/chaves");
    });

    it("deve lançar erro quando exclusão falha", async () => {
      mockDelete.mockRejectedValue(new Error("Etapa já finalizada"));

      await expect(chaveService.excluirChaves("etapa-123")).rejects.toThrow(
        "Etapa já finalizada"
      );
    });
  });

  describe("buscarDuplas", () => {
    it("deve buscar duplas da etapa", async () => {
      const mockDuplas = [
        { id: "d1", nome: "Dupla 1", jogador1: "J1", jogador2: "J2" },
        { id: "d2", nome: "Dupla 2", jogador1: "J3", jogador2: "J4" },
      ];

      mockGet.mockResolvedValue(mockDuplas);

      const result = await chaveService.buscarDuplas("etapa-123");

      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining("/etapas/etapa-123/duplas")
      );
      expect(result).toEqual(mockDuplas);
    });

    it("deve lançar erro quando busca falha", async () => {
      mockGet.mockRejectedValue(new Error("Etapa não encontrada"));

      await expect(chaveService.buscarDuplas("etapa-123")).rejects.toThrow(
        "Etapa não encontrada"
      );
    });
  });

  describe("buscarDuplasDoGrupo", () => {
    it("deve buscar duplas de um grupo específico", async () => {
      const mockDuplas = [{ id: "d1" }, { id: "d2" }];

      mockGet.mockResolvedValue(mockDuplas);

      const result = await chaveService.buscarDuplasDoGrupo(
        "etapa-123",
        "grupo-1"
      );

      expect(mockGet).toHaveBeenCalledWith(
        "/etapas/etapa-123/grupos/grupo-1/duplas"
      );
      expect(result).toEqual(mockDuplas);
    });

    it("deve lançar erro quando busca de duplas do grupo falha", async () => {
      mockGet.mockRejectedValue(new Error("Grupo não encontrado"));

      await expect(
        chaveService.buscarDuplasDoGrupo("etapa-123", "grupo-1")
      ).rejects.toThrow();
    });
  });

  describe("buscarGrupos", () => {
    it("deve buscar grupos da etapa", async () => {
      const mockGrupos = [
        { id: "g1", nome: "Grupo A" },
        { id: "g2", nome: "Grupo B" },
      ];

      mockGet.mockResolvedValue(mockGrupos);

      const result = await chaveService.buscarGrupos("etapa-123");

      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining("/etapas/etapa-123/grupos")
      );
      expect(result).toEqual(mockGrupos);
    });

    it("deve lançar erro quando busca de grupos falha", async () => {
      mockGet.mockRejectedValue(new Error("Erro ao buscar grupos"));

      await expect(chaveService.buscarGrupos("etapa-123")).rejects.toThrow();
    });
  });

  describe("buscarPartidas", () => {
    it("deve buscar partidas da etapa", async () => {
      const mockPartidas = [
        { id: "p1", dupla1Id: "d1", dupla2Id: "d2" },
        { id: "p2", dupla1Id: "d3", dupla2Id: "d4" },
      ];

      mockGet.mockResolvedValue(mockPartidas);

      const result = await chaveService.buscarPartidas("etapa-123");

      expect(mockGet).toHaveBeenCalledWith("/etapas/etapa-123/partidas");
      expect(result).toEqual(mockPartidas);
    });

    it("deve lançar erro quando busca de partidas falha", async () => {
      mockGet.mockRejectedValue(new Error("Erro ao buscar partidas"));

      await expect(chaveService.buscarPartidas("etapa-123")).rejects.toThrow();
    });
  });

  describe("registrarResultadoPartida", () => {
    it("deve registrar resultado de partida", async () => {
      mockPut.mockResolvedValue(undefined);

      const placar = [
        { numero: 1, gamesDupla1: 6, gamesDupla2: 4 },
        { numero: 2, gamesDupla1: 6, gamesDupla2: 3 },
      ];

      await chaveService.registrarResultadoPartida("partida-123", placar);

      expect(mockPut).toHaveBeenCalledWith("/partidas/partida-123/resultado", {
        placar,
      });
    });

    it("deve lançar erro quando registro de resultado falha", async () => {
      mockPut.mockRejectedValue(new Error("Partida não encontrada"));

      const placar = [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }];

      await expect(
        chaveService.registrarResultadoPartida("partida-123", placar)
      ).rejects.toThrow();
    });
  });

  describe("gerarFaseEliminatoria", () => {
    it("deve gerar fase eliminatória com classificados padrão", async () => {
      mockPost.mockResolvedValue(undefined);

      await chaveService.gerarFaseEliminatoria("etapa-123");

      expect(mockPost).toHaveBeenCalledWith(
        "/etapas/etapa-123/gerar-eliminatoria",
        { classificadosPorGrupo: 2 }
      );
    });

    it("deve gerar fase eliminatória com classificados customizado", async () => {
      mockPost.mockResolvedValue(undefined);

      await chaveService.gerarFaseEliminatoria("etapa-123", 4);

      expect(mockPost).toHaveBeenCalledWith(
        "/etapas/etapa-123/gerar-eliminatoria",
        { classificadosPorGrupo: 4 }
      );
    });

    it("deve lançar erro quando geração de eliminatória falha", async () => {
      mockPost.mockRejectedValue(new Error("Grupos incompletos"));

      await expect(
        chaveService.gerarFaseEliminatoria("etapa-123")
      ).rejects.toThrow();
    });
  });

  describe("buscarConfrontosEliminatorios", () => {
    it("deve buscar todos os confrontos eliminatórios", async () => {
      const mockConfrontos = [
        { id: "c1", fase: "QUARTAS" },
        { id: "c2", fase: "QUARTAS" },
      ];

      mockGet.mockResolvedValue(mockConfrontos);

      const result =
        await chaveService.buscarConfrontosEliminatorios("etapa-123");

      expect(mockGet).toHaveBeenCalledWith(
        "/etapas/etapa-123/confrontos-eliminatorios"
      );
      expect(result).toEqual(mockConfrontos);
    });

    it("deve buscar confrontos de uma fase específica", async () => {
      const mockConfrontos = [{ id: "c1", fase: "semifinal" }];

      mockGet.mockResolvedValue(mockConfrontos);

      const result = await chaveService.buscarConfrontosEliminatorios(
        "etapa-123",
        TipoFase.SEMIFINAL
      );

      // O enum TipoFase usa lowercase
      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining("/etapas/etapa-123/confrontos-eliminatorios?fase=")
      );
      expect(result).toEqual(mockConfrontos);
    });

    it("deve lançar erro quando busca de confrontos falha", async () => {
      mockGet.mockRejectedValue(new Error("Erro ao buscar confrontos"));

      await expect(
        chaveService.buscarConfrontosEliminatorios("etapa-123")
      ).rejects.toThrow();
    });
  });

  describe("registrarResultadoEliminatorio", () => {
    it("deve registrar resultado de confronto eliminatório", async () => {
      mockPost.mockResolvedValue(undefined);

      const placar = [
        { numero: 1, gamesDupla1: 6, gamesDupla2: 4 },
        { numero: 2, gamesDupla1: 6, gamesDupla2: 2 },
      ];

      await chaveService.registrarResultadoEliminatorio("confronto-123", placar);

      expect(mockPost).toHaveBeenCalledWith(
        "/etapas/confrontos-eliminatorios/confronto-123/resultado",
        { placar }
      );
    });

    it("deve lançar erro quando registro de resultado eliminatório falha", async () => {
      mockPost.mockRejectedValue(new Error("Confronto não encontrado"));

      const placar = [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }];

      await expect(
        chaveService.registrarResultadoEliminatorio("confronto-123", placar)
      ).rejects.toThrow();
    });
  });

  describe("cancelarFaseEliminatoria", () => {
    it("deve cancelar fase eliminatória com sucesso", async () => {
      mockDelete.mockResolvedValue(undefined);

      await chaveService.cancelarFaseEliminatoria("etapa-123");

      expect(mockDelete).toHaveBeenCalledWith(
        "/etapas/etapa-123/cancelar-eliminatoria"
      );
    });

    it("deve lançar erro quando cancelamento falha", async () => {
      mockDelete.mockRejectedValue(
        new Error("Fase eliminatória já possui resultados")
      );

      await expect(
        chaveService.cancelarFaseEliminatoria("etapa-123")
      ).rejects.toThrow("Fase eliminatória já possui resultados");
    });
  });
});
