/**
 * Testes para PartidaService
 */

import partidaService from "@/services/partidaService";
import { apiClient } from "@/services/apiClient";
import { ResultadoPartidaLoteDTO } from "@/types/chave";

// Mock do apiClient
jest.mock("@/services/apiClient", () => ({
  apiClient: {
    post: jest.fn(),
  },
}));

// Mock do logger
jest.mock("@/utils/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

// Mock do errorHandler
jest.mock("@/utils/errorHandler", () => ({
  handleError: jest.fn((error) => ({
    message: error.message || "Erro desconhecido",
    code: "UNKNOWN_ERROR",
  })),
}));

describe("PartidaService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("registrarResultadosEmLote", () => {
    const mockResultados: ResultadoPartidaLoteDTO[] = [
      {
        partidaId: "partida-1",
        placar1: 6,
        placar2: 4,
      },
      {
        partidaId: "partida-2",
        placar1: 3,
        placar2: 6,
      },
    ];

    it("deve registrar resultados em lote com sucesso", async () => {
      const mockResponse = {
        processados: 2,
        erros: [],
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const resultado = await partidaService.registrarResultadosEmLote(mockResultados);

      expect(apiClient.post).toHaveBeenCalledWith("/partidas/resultados-lote", {
        resultados: mockResultados,
      });
      expect(resultado).toEqual(mockResponse);
      expect(resultado.processados).toBe(2);
      expect(resultado.erros).toHaveLength(0);
    });

    it("deve registrar resultados com alguns erros", async () => {
      const mockResponse = {
        processados: 1,
        erros: [{ partidaId: "partida-2", mensagem: "Partida não encontrada" }],
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const resultado = await partidaService.registrarResultadosEmLote(mockResultados);

      expect(resultado.processados).toBe(1);
      expect(resultado.erros).toHaveLength(1);
    });

    it("deve lançar erro quando API falha", async () => {
      const mockError = new Error("Erro de conexão");
      (apiClient.post as jest.Mock).mockRejectedValue(mockError);

      await expect(partidaService.registrarResultadosEmLote(mockResultados)).rejects.toThrow(
        "Erro de conexão"
      );
    });

    it("deve enviar array vazio de resultados", async () => {
      const mockResponse = {
        processados: 0,
        erros: [],
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const resultado = await partidaService.registrarResultadosEmLote([]);

      expect(apiClient.post).toHaveBeenCalledWith("/partidas/resultados-lote", {
        resultados: [],
      });
      expect(resultado.processados).toBe(0);
    });
  });
});
