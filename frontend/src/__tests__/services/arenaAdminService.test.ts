/**
 * Testes do ArenaAdminService
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

import arenaAdminService from "@/services/arenaAdminService";

describe("ArenaAdminService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockArena = {
    id: "arena-123",
    nome: "Arena Teste",
    slug: "arena-teste",
    descricao: "Descrição da arena",
    logoUrl: null,
    corPrimaria: "#3B82F6",
  };

  describe("criar", () => {
    it("deve criar arena com sucesso", async () => {
      const mockResponse = {
        arena: mockArena,
        adminUid: "admin-123",
        url: "https://app.com/arena-teste",
      };

      mockPost.mockResolvedValue(mockResponse);

      const dto = {
        nome: "Arena Teste",
        slug: "arena-teste",
        adminEmail: "admin@teste.com",
        adminPassword: "senha123",
      };

      const result = await arenaAdminService.criar(dto);

      expect(mockPost).toHaveBeenCalledWith("/arenas", dto);
      expect(result).toEqual(mockResponse);
    });

    it("deve lançar erro quando slug já existe", async () => {
      mockPost.mockRejectedValue(new Error("Slug já está em uso"));

      const dto = {
        nome: "Arena Teste",
        slug: "arena-existente",
        adminEmail: "admin@teste.com",
        adminPassword: "senha123",
      };

      await expect(arenaAdminService.criar(dto)).rejects.toThrow(
        "Slug já está em uso"
      );
    });
  });

  describe("buscarPorSlug", () => {
    it("deve buscar arena por slug", async () => {
      mockGet.mockResolvedValue(mockArena);

      const result = await arenaAdminService.buscarPorSlug("arena-teste");

      expect(mockGet).toHaveBeenCalledWith("/arenas/slug/arena-teste");
      expect(result).toEqual(mockArena);
    });

    it("deve retornar null quando arena não encontrada", async () => {
      mockGet.mockRejectedValue(new Error("Arena não encontrada"));

      const result = await arenaAdminService.buscarPorSlug("inexistente");

      expect(result).toBeNull();
    });
  });

  describe("buscarPorId", () => {
    it("deve buscar arena por ID", async () => {
      mockGet.mockResolvedValue(mockArena);

      const result = await arenaAdminService.buscarPorId("arena-123");

      expect(mockGet).toHaveBeenCalledWith("/arenas/arena-123");
      expect(result).toEqual(mockArena);
    });

    it("deve retornar null quando arena não encontrada", async () => {
      mockGet.mockRejectedValue(new Error("Arena não encontrada"));

      const result = await arenaAdminService.buscarPorId("inexistente");

      expect(result).toBeNull();
    });
  });

  describe("obterMinhaArena", () => {
    it("deve retornar arena do admin autenticado", async () => {
      mockGet.mockResolvedValue(mockArena);

      const result = await arenaAdminService.obterMinhaArena();

      expect(mockGet).toHaveBeenCalledWith("/arenas/me");
      expect(result).toEqual(mockArena);
    });

    it("deve retornar null quando erro ocorre", async () => {
      mockGet.mockRejectedValue(new Error("Não autenticado"));

      const result = await arenaAdminService.obterMinhaArena();

      expect(result).toBeNull();
    });
  });

  describe("listar", () => {
    it("deve listar todas as arenas", async () => {
      mockGet.mockResolvedValue({ arenas: [mockArena], total: 1 });

      const result = await arenaAdminService.listar();

      expect(mockGet).toHaveBeenCalledWith("/arenas");
      expect(result).toEqual([mockArena]);
    });

    it("deve retornar lista vazia quando erro ocorre", async () => {
      mockGet.mockRejectedValue(new Error("Erro"));

      const result = await arenaAdminService.listar();

      expect(result).toEqual([]);
    });
  });

  describe("atualizar", () => {
    it("deve atualizar arena com sucesso", async () => {
      const updatedArena = { ...mockArena, nome: "Arena Atualizada" };
      mockPut.mockResolvedValue(updatedArena);

      const result = await arenaAdminService.atualizar("arena-123", {
        nome: "Arena Atualizada",
      });

      expect(mockPut).toHaveBeenCalledWith("/arenas/arena-123", {
        nome: "Arena Atualizada",
      });
      expect(result.nome).toBe("Arena Atualizada");
    });

    it("deve lançar erro quando atualização falha", async () => {
      mockPut.mockRejectedValue(new Error("Erro ao atualizar"));

      await expect(
        arenaAdminService.atualizar("arena-123", { nome: "Teste" })
      ).rejects.toThrow("Erro ao atualizar");
    });
  });

  describe("desativar", () => {
    it("deve desativar arena com sucesso", async () => {
      mockDelete.mockResolvedValue(undefined);

      await arenaAdminService.desativar("arena-123");

      expect(mockDelete).toHaveBeenCalledWith("/arenas/arena-123");
    });

    it("deve lançar erro quando desativação falha", async () => {
      mockDelete.mockRejectedValue(new Error("Arena possui etapas ativas"));

      await expect(arenaAdminService.desativar("arena-123")).rejects.toThrow(
        "Arena possui etapas ativas"
      );
    });
  });

  describe("verificarSlugDisponivel", () => {
    it("deve retornar true quando slug disponível", async () => {
      mockGet.mockResolvedValue({
        slug: "novo-slug",
        available: true,
        message: "Slug disponível",
      });

      const result =
        await arenaAdminService.verificarSlugDisponivel("novo-slug");

      expect(mockGet).toHaveBeenCalledWith("/arenas/check-slug/novo-slug");
      expect(result).toBe(true);
    });

    it("deve retornar false quando slug indisponível", async () => {
      mockGet.mockResolvedValue({
        slug: "slug-usado",
        available: false,
        message: "Slug já em uso",
      });

      const result =
        await arenaAdminService.verificarSlugDisponivel("slug-usado");

      expect(result).toBe(false);
    });

    it("deve retornar false quando erro ocorre", async () => {
      mockGet.mockRejectedValue(new Error("Erro"));

      const result =
        await arenaAdminService.verificarSlugDisponivel("qualquer");

      expect(result).toBe(false);
    });
  });
});
