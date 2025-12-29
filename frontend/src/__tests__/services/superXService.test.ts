/**
 * Testes para SuperXService
 */

import superXService from "@/services/superXService";
import { apiClient } from "@/services/apiClient";

// Mock do apiClient
jest.mock("@/services/apiClient", () => ({
  apiClient: {
    post: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
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

describe("SuperXService", () => {
  const etapaId = "etapa-123";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // GERAÇÃO DE CHAVES
  // ============================================

  describe("gerarChaves", () => {
    it("deve gerar chaves Super X com sucesso", async () => {
      const mockResponse = {
        jogadores: [
          { id: "j1", nome: "Jogador 1" },
          { id: "j2", nome: "Jogador 2" },
        ],
        grupo: { id: "grupo-1", nome: "Grupo Único" },
        partidas: [{ id: "p1" }, { id: "p2" }],
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const resultado = await superXService.gerarChaves(etapaId);

      expect(apiClient.post).toHaveBeenCalledWith(
        `/etapas/${etapaId}/super-x/gerar-chaves`,
        {}
      );
      expect(resultado.jogadores).toHaveLength(2);
      expect(resultado.partidas).toHaveLength(2);
    });

    it("deve lançar erro quando geração falha", async () => {
      const mockError = new Error("Erro ao gerar chaves");
      (apiClient.post as jest.Mock).mockRejectedValue(mockError);

      await expect(superXService.gerarChaves(etapaId)).rejects.toThrow(
        "Erro ao gerar chaves"
      );
    });
  });

  describe("cancelarChaves", () => {
    it("deve cancelar chaves Super X com sucesso", async () => {
      (apiClient.delete as jest.Mock).mockResolvedValue(undefined);

      await superXService.cancelarChaves(etapaId);

      expect(apiClient.delete).toHaveBeenCalledWith(
        `/etapas/${etapaId}/super-x/cancelar-chaves`
      );
    });

    it("deve lançar erro quando cancelamento falha", async () => {
      const mockError = new Error("Erro ao cancelar");
      (apiClient.delete as jest.Mock).mockRejectedValue(mockError);

      await expect(superXService.cancelarChaves(etapaId)).rejects.toThrow(
        "Erro ao cancelar"
      );
    });
  });

  // ============================================
  // BUSCAR DADOS
  // ============================================

  describe("buscarJogadores", () => {
    it("deve buscar jogadores com sucesso", async () => {
      const mockJogadores = [
        { id: "j1", nome: "Jogador 1", pontos: 10 },
        { id: "j2", nome: "Jogador 2", pontos: 8 },
      ];

      (apiClient.get as jest.Mock).mockResolvedValue(mockJogadores);

      const resultado = await superXService.buscarJogadores(etapaId);

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining(`/etapas/${etapaId}/super-x/jogadores`)
      );
      expect(resultado).toHaveLength(2);
    });

    it("deve lançar erro quando busca falha", async () => {
      const mockError = new Error("Erro ao buscar jogadores");
      (apiClient.get as jest.Mock).mockRejectedValue(mockError);

      await expect(superXService.buscarJogadores(etapaId)).rejects.toThrow(
        "Erro ao buscar jogadores"
      );
    });
  });

  describe("buscarGrupo", () => {
    it("deve buscar grupo com sucesso", async () => {
      const mockGrupo = {
        id: "grupo-1",
        nome: "Grupo Único",
        etapaId,
      };

      (apiClient.get as jest.Mock).mockResolvedValue(mockGrupo);

      const resultado = await superXService.buscarGrupo(etapaId);

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining(`/etapas/${etapaId}/super-x/grupo`)
      );
      expect(resultado.id).toBe("grupo-1");
    });

    it("deve lançar erro quando busca falha", async () => {
      const mockError = new Error("Erro ao buscar grupo");
      (apiClient.get as jest.Mock).mockRejectedValue(mockError);

      await expect(superXService.buscarGrupo(etapaId)).rejects.toThrow(
        "Erro ao buscar grupo"
      );
    });
  });

  describe("buscarPartidas", () => {
    it("deve buscar partidas com sucesso", async () => {
      const mockPartidas = [
        { id: "p1", rodada: 1 },
        { id: "p2", rodada: 1 },
        { id: "p3", rodada: 2 },
      ];

      (apiClient.get as jest.Mock).mockResolvedValue(mockPartidas);

      const resultado = await superXService.buscarPartidas(etapaId);

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining(`/etapas/${etapaId}/super-x/partidas`)
      );
      expect(resultado).toHaveLength(3);
    });

    it("deve lançar erro quando busca falha", async () => {
      const mockError = new Error("Erro ao buscar partidas");
      (apiClient.get as jest.Mock).mockRejectedValue(mockError);

      await expect(superXService.buscarPartidas(etapaId)).rejects.toThrow(
        "Erro ao buscar partidas"
      );
    });
  });

  // ============================================
  // REGISTRAR RESULTADOS
  // ============================================

  describe("registrarResultadosEmLote", () => {
    const mockResultados = [
      { partidaId: "p1", placar1: 6, placar2: 4 },
      { partidaId: "p2", placar1: 3, placar2: 6 },
    ];

    it("deve registrar resultados em lote com sucesso", async () => {
      const mockResponse = {
        processados: 2,
        erros: [],
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const resultado = await superXService.registrarResultadosEmLote(
        etapaId,
        mockResultados
      );

      expect(apiClient.post).toHaveBeenCalledWith(
        `/etapas/${etapaId}/super-x/resultados-lote`,
        { resultados: mockResultados }
      );
      expect(resultado.processados).toBe(2);
    });

    it("deve registrar resultados com erros parciais", async () => {
      const mockResponse = {
        processados: 1,
        erros: [{ partidaId: "p2", mensagem: "Erro" }],
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const resultado = await superXService.registrarResultadosEmLote(
        etapaId,
        mockResultados
      );

      expect(resultado.erros).toHaveLength(1);
    });

    it("deve lançar erro quando registro falha", async () => {
      const mockError = new Error("Erro ao registrar");
      (apiClient.post as jest.Mock).mockRejectedValue(mockError);

      await expect(
        superXService.registrarResultadosEmLote(etapaId, mockResultados)
      ).rejects.toThrow("Erro ao registrar");
    });
  });

  // ============================================
  // VALIDAÇÕES
  // ============================================

  describe("validarGeracaoChaves", () => {
    it("deve retornar válido para etapa correta Super 8", () => {
      const etapa = {
        status: "inscricoes_encerradas",
        chavesGeradas: false,
        varianteSuperX: 8,
        totalInscritos: 8,
      };

      const resultado = superXService.validarGeracaoChaves(etapa);

      expect(resultado.podeGerar).toBe(true);
      expect(resultado.mensagem).toBeUndefined();
    });

    it("deve retornar válido para etapa correta Super 12", () => {
      const etapa = {
        status: "inscricoes_encerradas",
        chavesGeradas: false,
        varianteSuperX: 12,
        totalInscritos: 12,
      };

      const resultado = superXService.validarGeracaoChaves(etapa);

      expect(resultado.podeGerar).toBe(true);
    });

    it("deve retornar inválido quando inscrições não estão encerradas", () => {
      const etapa = {
        status: "inscricoes_abertas",
        chavesGeradas: false,
        varianteSuperX: 8,
        totalInscritos: 8,
      };

      const resultado = superXService.validarGeracaoChaves(etapa);

      expect(resultado.podeGerar).toBe(false);
      expect(resultado.mensagem).toContain("inscrições");
    });

    it("deve retornar inválido quando chaves já foram geradas", () => {
      const etapa = {
        status: "inscricoes_encerradas",
        chavesGeradas: true,
        varianteSuperX: 8,
        totalInscritos: 8,
      };

      const resultado = superXService.validarGeracaoChaves(etapa);

      expect(resultado.podeGerar).toBe(false);
      expect(resultado.mensagem).toContain("já foram geradas");
    });

    it("deve retornar inválido quando variante é inválida", () => {
      const etapa = {
        status: "inscricoes_encerradas",
        chavesGeradas: false,
        varianteSuperX: 10, // Variante inválida
        totalInscritos: 10,
      };

      const resultado = superXService.validarGeracaoChaves(etapa);

      expect(resultado.podeGerar).toBe(false);
      expect(resultado.mensagem).toContain("inválida");
    });

    it("deve retornar inválido quando variante não está definida", () => {
      const etapa = {
        status: "inscricoes_encerradas",
        chavesGeradas: false,
        varianteSuperX: undefined,
        totalInscritos: 8,
      };

      const resultado = superXService.validarGeracaoChaves(etapa);

      expect(resultado.podeGerar).toBe(false);
      expect(resultado.mensagem).toContain("inválida");
    });

    it("deve retornar inválido quando número de inscritos não corresponde à variante", () => {
      const etapa = {
        status: "inscricoes_encerradas",
        chavesGeradas: false,
        varianteSuperX: 8,
        totalInscritos: 6, // Deveria ser 8
      };

      const resultado = superXService.validarGeracaoChaves(etapa);

      expect(resultado.podeGerar).toBe(false);
      expect(resultado.mensagem).toContain("exatamente");
      expect(resultado.mensagem).toContain("8");
    });
  });
});
