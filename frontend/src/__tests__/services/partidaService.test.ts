/**
 * Testes do PartidaService
 */

// Mock do apiClient
const mockPut = jest.fn();

jest.mock("@/services/apiClient", () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: mockPut,
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

// Mock do errorHandler
jest.mock("@/utils/errorHandler", () => ({
  handleError: jest.fn((error) => ({
    message: error.message || "Erro desconhecido",
    code: "unknown",
  })),
}));

import partidaService from "@/services/partidaService";

describe("PartidaService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("registrarResultado", () => {
    it("deve registrar resultado de partida com sucesso", async () => {
      mockPut.mockResolvedValue(undefined);

      const placar = [
        { numero: 1, gamesDupla1: 6, gamesDupla2: 4 },
        { numero: 2, gamesDupla1: 6, gamesDupla2: 3 },
      ];

      await partidaService.registrarResultado("partida-123", placar);

      expect(mockPut).toHaveBeenCalledWith("/partidas/partida-123/resultado", {
        placar,
      });
    });

    it("deve registrar resultado com 3 sets", async () => {
      mockPut.mockResolvedValue(undefined);

      const placar = [
        { numero: 1, gamesDupla1: 6, gamesDupla2: 4 },
        { numero: 2, gamesDupla1: 4, gamesDupla2: 6 },
        { numero: 3, gamesDupla1: 6, gamesDupla2: 2 },
      ];

      await partidaService.registrarResultado("partida-456", placar);

      expect(mockPut).toHaveBeenCalledWith("/partidas/partida-456/resultado", {
        placar,
      });
    });

    it("deve lançar erro quando API falha", async () => {
      mockPut.mockRejectedValue(new Error("Erro ao registrar resultado"));

      const placar = [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }];

      await expect(
        partidaService.registrarResultado("partida-123", placar)
      ).rejects.toThrow("Erro ao registrar resultado");
    });

    it("deve lançar erro genérico quando API retorna erro sem mensagem", async () => {
      mockPut.mockRejectedValue(new Error());

      const placar = [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }];

      await expect(
        partidaService.registrarResultado("partida-123", placar)
      ).rejects.toThrow();
    });
  });
});
