/**
 * Testes do ReiDaPraiaService
 */

// Mock do apiClient
const mockGet = jest.fn();
const mockPost = jest.fn();

jest.mock("@/services/apiClient", () => ({
  apiClient: {
    get: mockGet,
    post: mockPost,
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

// Mock do errorHandler
jest.mock("@/utils/errorHandler", () => ({
  handleError: jest.fn((error) => ({
    message: error.message || "Erro desconhecido",
    code: "unknown",
  })),
}));

import reiDaPraiaService from "@/services/reiDaPraiaService";
import { TipoChaveamentoReiDaPraia } from "@/types/reiDaPraia";

describe("ReiDaPraiaService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("gerarChaves", () => {
    it("deve gerar chaves Rei da Praia com sucesso", async () => {
      const mockResultado = {
        jogadores: [{ id: "j1" }, { id: "j2" }],
        grupos: [{ id: "g1", nome: "Grupo A" }],
        partidas: [{ id: "p1" }],
      };

      mockPost.mockResolvedValue(mockResultado);

      const result = await reiDaPraiaService.gerarChaves("etapa-123");

      expect(mockPost).toHaveBeenCalledWith(
        "/etapas/etapa-123/rei-da-praia/gerar-chaves",
        {}
      );
      expect(result).toEqual(mockResultado);
    });

    it("deve lançar erro quando geração falha", async () => {
      mockPost.mockRejectedValue(
        new Error("Número de jogadores deve ser múltiplo de 4")
      );

      await expect(reiDaPraiaService.gerarChaves("etapa-123")).rejects.toThrow(
        "Número de jogadores deve ser múltiplo de 4"
      );
    });
  });

  describe("buscarJogadores", () => {
    it("deve buscar jogadores com estatísticas", async () => {
      const mockJogadores = [
        { id: "j1", nome: "Jogador 1", vitorias: 3, derrotas: 0 },
        { id: "j2", nome: "Jogador 2", vitorias: 2, derrotas: 1 },
      ];

      mockGet.mockResolvedValue(mockJogadores);

      const result = await reiDaPraiaService.buscarJogadores("etapa-123");

      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining("/etapas/etapa-123/rei-da-praia/jogadores")
      );
      expect(result).toEqual(mockJogadores);
    });

    it("deve lançar erro quando busca falha", async () => {
      mockGet.mockRejectedValue(new Error("Erro ao buscar jogadores"));

      await expect(
        reiDaPraiaService.buscarJogadores("etapa-123")
      ).rejects.toThrow();
    });
  });

  describe("buscarGrupos", () => {
    it("deve buscar grupos da etapa", async () => {
      const mockGrupos = [
        { id: "g1", nome: "Grupo A", completo: false },
        { id: "g2", nome: "Grupo B", completo: true },
      ];

      mockGet.mockResolvedValue(mockGrupos);

      const result = await reiDaPraiaService.buscarGrupos("etapa-123");

      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining("/etapas/etapa-123/rei-da-praia/grupos")
      );
      expect(result).toEqual(mockGrupos);
    });

    it("deve lançar erro quando busca de grupos falha", async () => {
      mockGet.mockRejectedValue(new Error("Erro ao buscar grupos"));

      await expect(
        reiDaPraiaService.buscarGrupos("etapa-123")
      ).rejects.toThrow();
    });
  });

  describe("buscarPartidas", () => {
    it("deve buscar partidas da etapa", async () => {
      const mockPartidas = [
        { id: "p1", jogador1Id: "j1", jogador2Id: "j2", status: "pendente" },
        { id: "p2", jogador1Id: "j3", jogador2Id: "j4", status: "finalizada" },
      ];

      mockGet.mockResolvedValue(mockPartidas);

      const result = await reiDaPraiaService.buscarPartidas("etapa-123");

      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining("/etapas/etapa-123/rei-da-praia/partidas")
      );
      expect(result).toEqual(mockPartidas);
    });

    it("deve lançar erro quando busca de partidas falha", async () => {
      mockGet.mockRejectedValue(new Error("Erro ao buscar partidas"));

      await expect(
        reiDaPraiaService.buscarPartidas("etapa-123")
      ).rejects.toThrow();
    });
  });

  describe("buscarJogadoresDoGrupo", () => {
    it("deve buscar jogadores de um grupo específico", async () => {
      const mockJogadores = [
        { id: "j1", nome: "Jogador 1" },
        { id: "j2", nome: "Jogador 2" },
      ];

      mockGet.mockResolvedValue(mockJogadores);

      const result = await reiDaPraiaService.buscarJogadoresDoGrupo(
        "etapa-123",
        "grupo-1"
      );

      expect(mockGet).toHaveBeenCalledWith(
        "/etapas/etapa-123/rei-da-praia/grupos/grupo-1/jogadores"
      );
      expect(result).toEqual(mockJogadores);
    });

    it("deve lançar erro quando busca de jogadores do grupo falha", async () => {
      mockGet.mockRejectedValue(new Error("Grupo não encontrado"));

      await expect(
        reiDaPraiaService.buscarJogadoresDoGrupo("etapa-123", "grupo-1")
      ).rejects.toThrow();
    });
  });

  describe("gerarEliminatoria", () => {
    it("deve gerar fase eliminatória com sucesso", async () => {
      const mockResultado = {
        duplas: [{ id: "d1", jogador1Id: "j1", jogador2Id: "j2" }],
        confrontos: [{ id: "c1", dupla1Id: "d1", dupla2Id: "d2" }],
      };

      mockPost.mockResolvedValue(mockResultado);

      const result = await reiDaPraiaService.gerarEliminatoria("etapa-123", {
        classificadosPorGrupo: 2,
        tipoChaveamento: TipoChaveamentoReiDaPraia.MELHORES_COM_MELHORES,
      });

      expect(mockPost).toHaveBeenCalledWith(
        "/etapas/etapa-123/rei-da-praia/gerar-eliminatoria",
        {
          classificadosPorGrupo: 2,
          tipoChaveamento: TipoChaveamentoReiDaPraia.MELHORES_COM_MELHORES,
        }
      );
      expect(result).toEqual(mockResultado);
    });

    it("deve lançar erro quando geração de eliminatória falha", async () => {
      mockPost.mockRejectedValue(new Error("Grupos incompletos"));

      await expect(
        reiDaPraiaService.gerarEliminatoria("etapa-123", {
          classificadosPorGrupo: 2,
          tipoChaveamento: TipoChaveamentoReiDaPraia.MELHORES_COM_MELHORES,
        })
      ).rejects.toThrow();
    });
  });

  describe("buscarDuplasEliminatoria", () => {
    it("deve buscar duplas da fase eliminatória", async () => {
      const mockDuplas = [
        { id: "d1", jogador1: "J1", jogador2: "J2" },
        { id: "d2", jogador1: "J3", jogador2: "J4" },
      ];

      mockGet.mockResolvedValue(mockDuplas);

      const result =
        await reiDaPraiaService.buscarDuplasEliminatoria("etapa-123");

      expect(mockGet).toHaveBeenCalledWith(
        "/etapas/etapa-123/rei-da-praia/duplas-eliminatoria"
      );
      expect(result).toEqual(mockDuplas);
    });

    it("deve lançar erro quando busca de duplas falha", async () => {
      mockGet.mockRejectedValue(new Error("Fase eliminatória não gerada"));

      await expect(
        reiDaPraiaService.buscarDuplasEliminatoria("etapa-123")
      ).rejects.toThrow();
    });
  });

  describe("buscarConfrontosEliminatorios", () => {
    it("deve buscar confrontos eliminatórios", async () => {
      const mockConfrontos = [
        { id: "c1", fase: "QUARTAS", dupla1Id: "d1", dupla2Id: "d2" },
      ];

      mockGet.mockResolvedValue(mockConfrontos);

      const result =
        await reiDaPraiaService.buscarConfrontosEliminatorios("etapa-123");

      expect(mockGet).toHaveBeenCalledWith(
        "/etapas/etapa-123/rei-da-praia/confrontos"
      );
      expect(result).toEqual(mockConfrontos);
    });

    it("deve lançar erro quando busca de confrontos falha", async () => {
      mockGet.mockRejectedValue(new Error("Erro ao buscar confrontos"));

      await expect(
        reiDaPraiaService.buscarConfrontosEliminatorios("etapa-123")
      ).rejects.toThrow();
    });
  });

  describe("cancelarEliminatoria", () => {
    it("deve cancelar fase eliminatória com sucesso", async () => {
      mockPost.mockResolvedValue(undefined);

      await reiDaPraiaService.cancelarEliminatoria("etapa-123");

      expect(mockPost).toHaveBeenCalledWith(
        "/etapas/etapa-123/rei-da-praia/cancelar-eliminatoria"
      );
    });

    it("deve lançar erro quando cancelamento falha", async () => {
      mockPost.mockRejectedValue(
        new Error("Eliminatória possui resultados registrados")
      );

      await expect(
        reiDaPraiaService.cancelarEliminatoria("etapa-123")
      ).rejects.toThrow();
    });
  });

  describe("validarGeracaoChaves", () => {
    it("deve retornar false quando inscrições não encerradas", () => {
      const etapa = { status: "aberta", totalInscritos: 8, maxJogadores: 8 };

      const result = reiDaPraiaService.validarGeracaoChaves(etapa);

      expect(result.podeGerar).toBe(false);
      expect(result.mensagem).toContain("inscrições devem estar encerradas");
    });

    it("deve retornar false quando chaves já geradas", () => {
      const etapa = {
        status: "inscricoes_encerradas",
        chavesGeradas: true,
        totalInscritos: 8,
        maxJogadores: 8,
      };

      const result = reiDaPraiaService.validarGeracaoChaves(etapa);

      expect(result.podeGerar).toBe(false);
      expect(result.mensagem).toContain("já foram geradas");
    });

    it("deve retornar false quando menos de 8 inscritos", () => {
      const etapa = {
        status: "inscricoes_encerradas",
        chavesGeradas: false,
        totalInscritos: 4,
        maxJogadores: 4,
      };

      const result = reiDaPraiaService.validarGeracaoChaves(etapa);

      expect(result.podeGerar).toBe(false);
      expect(result.mensagem).toContain("mínimo 8 jogadores");
    });

    it("deve retornar false quando não é múltiplo de 4", () => {
      const etapa = {
        status: "inscricoes_encerradas",
        chavesGeradas: false,
        totalInscritos: 10,
        maxJogadores: 10,
      };

      const result = reiDaPraiaService.validarGeracaoChaves(etapa);

      expect(result.podeGerar).toBe(false);
      expect(result.mensagem).toContain("múltiplo de 4");
    });

    it("deve retornar false quando inscritos != maxJogadores", () => {
      const etapa = {
        status: "inscricoes_encerradas",
        chavesGeradas: false,
        totalInscritos: 8,
        maxJogadores: 16,
      };

      const result = reiDaPraiaService.validarGeracaoChaves(etapa);

      expect(result.podeGerar).toBe(false);
      expect(result.mensagem).toContain("configurada para 16 jogadores");
    });

    it("deve retornar true quando todas as validações passam", () => {
      const etapa = {
        status: "inscricoes_encerradas",
        chavesGeradas: false,
        totalInscritos: 8,
        maxJogadores: 8,
      };

      const result = reiDaPraiaService.validarGeracaoChaves(etapa);

      expect(result.podeGerar).toBe(true);
      expect(result.mensagem).toBeUndefined();
    });
  });

  describe("validarGeracaoEliminatoria", () => {
    it("deve retornar false quando chaves não geradas", () => {
      const etapa = { chavesGeradas: false };
      const grupos: any[] = [];

      const result = reiDaPraiaService.validarGeracaoEliminatoria(etapa, grupos);

      expect(result.podeGerar).toBe(false);
      expect(result.mensagem).toContain("devem ser geradas");
    });

    it("deve retornar false quando grupos incompletos", () => {
      const etapa = { chavesGeradas: true };
      const grupos = [
        { id: "g1", nome: "Grupo A", completo: true },
        { id: "g2", nome: "Grupo B", completo: false },
      ];

      const result = reiDaPraiaService.validarGeracaoEliminatoria(
        etapa,
        grupos as any
      );

      expect(result.podeGerar).toBe(false);
      expect(result.mensagem).toContain("Grupo B");
    });

    it("deve retornar false quando só tem 1 grupo", () => {
      const etapa = { chavesGeradas: true };
      const grupos = [{ id: "g1", nome: "Grupo A", completo: true }];

      const result = reiDaPraiaService.validarGeracaoEliminatoria(
        etapa,
        grupos as any
      );

      expect(result.podeGerar).toBe(false);
      expect(result.mensagem).toContain("apenas 1 grupo");
    });

    it("deve retornar true quando todas as validações passam", () => {
      const etapa = { chavesGeradas: true };
      const grupos = [
        { id: "g1", nome: "Grupo A", completo: true },
        { id: "g2", nome: "Grupo B", completo: true },
      ];

      const result = reiDaPraiaService.validarGeracaoEliminatoria(
        etapa,
        grupos as any
      );

      expect(result.podeGerar).toBe(true);
      expect(result.mensagem).toBeUndefined();
    });
  });
});
