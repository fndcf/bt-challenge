/**
 * Testes do CabecaDeChaveService
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

import cabecaDeChaveService from "@/services/cabecaDeChaveService";

describe("CabecaDeChaveService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("criar", () => {
    it("deve criar cabeça de chave com sucesso", async () => {
      const mockCabeca = {
        id: "cabeca-123",
        etapaId: "etapa-1",
        jogadorId: "jogador-1",
        jogadorNome: "João Silva",
        ordem: 1,
      };

      mockPost.mockResolvedValue(mockCabeca);

      const dto = {
        etapaId: "etapa-1",
        jogadorId: "jogador-1",
        jogadorNome: "João Silva",
        ordem: 1,
      };

      const result = await cabecaDeChaveService.criar(dto);

      expect(mockPost).toHaveBeenCalledWith("/cabecas-de-chave", dto);
      expect(result).toEqual(mockCabeca);
    });
  });

  describe("listarAtivas", () => {
    it("deve listar cabeças de chave ativas", async () => {
      const mockCabecas = [
        { id: "1", jogadorId: "j1", jogadorNome: "Jogador 1", ordem: 1 },
        { id: "2", jogadorId: "j2", jogadorNome: "Jogador 2", ordem: 2 },
      ];

      mockGet.mockResolvedValue(mockCabecas);

      const result = await cabecaDeChaveService.listarAtivas(
        "arena-1",
        "etapa-1"
      );

      expect(mockGet).toHaveBeenCalledWith(
        "/arenas/arena-1/etapas/etapa-1/cabecas-de-chave"
      );
      expect(result).toEqual(mockCabecas);
    });

    it("deve retornar lista vazia quando não há cabeças", async () => {
      mockGet.mockResolvedValue([]);

      const result = await cabecaDeChaveService.listarAtivas(
        "arena-1",
        "etapa-1"
      );

      expect(result).toEqual([]);
    });
  });

  describe("ehCabecaDeChave", () => {
    it("deve retornar true quando jogador é cabeça de chave", async () => {
      mockGet.mockResolvedValue({ ehCabecaDeChave: true });

      const result = await cabecaDeChaveService.ehCabecaDeChave(
        "arena-1",
        "etapa-1",
        "jogador-1"
      );

      expect(mockGet).toHaveBeenCalledWith(
        "/arenas/arena-1/etapas/etapa-1/jogadores/jogador-1/eh-cabeca-de-chave"
      );
      expect(result).toBe(true);
    });

    it("deve retornar false quando jogador não é cabeça de chave", async () => {
      mockGet.mockResolvedValue({ ehCabecaDeChave: false });

      const result = await cabecaDeChaveService.ehCabecaDeChave(
        "arena-1",
        "etapa-1",
        "jogador-2"
      );

      expect(result).toBe(false);
    });
  });

  describe("remover", () => {
    it("deve remover cabeça de chave com sucesso", async () => {
      mockDelete.mockResolvedValue(undefined);

      await cabecaDeChaveService.remover("arena-1", "etapa-1", "jogador-1");

      expect(mockDelete).toHaveBeenCalledWith(
        "/arenas/arena-1/etapas/etapa-1/jogadores/jogador-1/cabeca-de-chave"
      );
    });
  });

  describe("reordenar", () => {
    it("deve reordenar cabeças de chave com sucesso", async () => {
      mockPut.mockResolvedValue(undefined);

      const ordens = [
        { jogadorId: "j1", ordem: 2 },
        { jogadorId: "j2", ordem: 1 },
      ];

      await cabecaDeChaveService.reordenar("arena-1", "etapa-1", ordens);

      expect(mockPut).toHaveBeenCalledWith(
        "/arenas/arena-1/etapas/etapa-1/cabecas-de-chave/reordenar",
        { ordens }
      );
    });

    it("deve reordenar lista vazia", async () => {
      mockPut.mockResolvedValue(undefined);

      await cabecaDeChaveService.reordenar("arena-1", "etapa-1", []);

      expect(mockPut).toHaveBeenCalledWith(
        "/arenas/arena-1/etapas/etapa-1/cabecas-de-chave/reordenar",
        { ordens: [] }
      );
    });
  });
});
