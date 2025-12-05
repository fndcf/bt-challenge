/**
 * Testes do JogadorService
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
    status: error.status,
  })),
}));

import jogadorService from "@/services/jogadorService";
import { NivelJogador, GeneroJogador } from "@/types/jogador";

describe("JogadorService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockJogador = {
    id: "jogador-123",
    nome: "João Silva",
    nivel: NivelJogador.INTERMEDIARIO,
    genero: GeneroJogador.MASCULINO,
    telefone: "11999999999",
    pontuacao: 100,
  };

  describe("criar", () => {
    it("deve criar jogador com sucesso", async () => {
      mockPost.mockResolvedValue(mockJogador);

      const dto = {
        nome: "João Silva",
        nivel: NivelJogador.INTERMEDIARIO,
        genero: GeneroJogador.MASCULINO,
        telefone: "11999999999",
      };

      const result = await jogadorService.criar(dto);

      expect(mockPost).toHaveBeenCalledWith("/jogadores", dto);
      expect(result).toEqual(mockJogador);
    });

    it("deve lançar erro quando criação falha", async () => {
      mockPost.mockRejectedValue(new Error("Jogador já existe"));

      const dto = {
        nome: "João Silva",
        nivel: NivelJogador.INTERMEDIARIO,
        genero: GeneroJogador.MASCULINO,
      };

      await expect(jogadorService.criar(dto)).rejects.toThrow(
        "Jogador já existe"
      );
    });
  });

  describe("listar", () => {
    it("deve listar jogadores sem filtros", async () => {
      const mockResponse = {
        jogadores: [mockJogador],
        total: 1,
        limite: 20,
        offset: 0,
        temMais: false,
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await jogadorService.listar();

      expect(mockGet).toHaveBeenCalledWith("/jogadores");
      expect(result).toEqual(mockResponse);
    });

    it("deve listar jogadores com filtros", async () => {
      const mockResponse = {
        jogadores: [mockJogador],
        total: 1,
        limite: 10,
        offset: 0,
        temMais: false,
      };

      mockGet.mockResolvedValue(mockResponse);

      const filtros = {
        nivel: NivelJogador.INTERMEDIARIO,
        genero: GeneroJogador.MASCULINO,
        busca: "João",
        limite: 10,
        offset: 0,
      };

      const result = await jogadorService.listar(filtros);

      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining("/jogadores?")
      );
      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining("nivel="));
      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining("genero="));
      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining("busca="));
      expect(result).toEqual(mockResponse);
    });

    it("deve retornar lista vazia quando erro ocorre (exceto auth)", async () => {
      mockGet.mockRejectedValue(new Error("Erro de conexão"));

      const result = await jogadorService.listar();

      expect(result).toEqual({
        jogadores: [],
        total: 0,
        limite: 20,
        offset: 0,
        temMais: false,
      });
    });

  });

  describe("buscarPorId", () => {
    it("deve buscar jogador por ID", async () => {
      mockGet.mockResolvedValue(mockJogador);

      const result = await jogadorService.buscarPorId("jogador-123");

      expect(mockGet).toHaveBeenCalledWith("/jogadores/jogador-123");
      expect(result).toEqual(mockJogador);
    });

    it("deve lançar erro quando busca falha", async () => {
      mockGet.mockRejectedValue(new Error("Erro na busca"));

      await expect(jogadorService.buscarPorId("inexistente")).rejects.toThrow();
    });
  });

  describe("atualizar", () => {
    it("deve atualizar jogador com sucesso", async () => {
      const updatedJogador = { ...mockJogador, nome: "João Santos" };
      mockPut.mockResolvedValue(updatedJogador);

      const result = await jogadorService.atualizar("jogador-123", {
        nome: "João Santos",
      });

      expect(mockPut).toHaveBeenCalledWith("/jogadores/jogador-123", {
        nome: "João Santos",
      });
      expect(result.nome).toBe("João Santos");
    });

    it("deve lançar erro quando atualização falha", async () => {
      mockPut.mockRejectedValue(new Error("Erro"));

      await expect(
        jogadorService.atualizar("jogador-123", { nome: "Teste" })
      ).rejects.toThrow();
    });
  });

  describe("deletar", () => {
    it("deve deletar jogador com sucesso", async () => {
      mockDelete.mockResolvedValue(undefined);

      await jogadorService.deletar("jogador-123");

      expect(mockDelete).toHaveBeenCalledWith("/jogadores/jogador-123");
    });

    it("deve lançar erro quando deleção falha", async () => {
      mockDelete.mockRejectedValue(new Error("Erro"));

      await expect(jogadorService.deletar("jogador-123")).rejects.toThrow();
    });
  });

  describe("contarTotal", () => {
    it("deve retornar total de jogadores", async () => {
      mockGet.mockResolvedValue({ total: 150 });

      const result = await jogadorService.contarTotal();

      expect(mockGet).toHaveBeenCalledWith("/jogadores/stats/total");
      expect(result).toBe(150);
    });

    it("deve retornar 0 quando erro ocorre", async () => {
      mockGet.mockRejectedValue(new Error("Erro"));

      const result = await jogadorService.contarTotal();

      expect(result).toBe(0);
    });
  });

  describe("contarPorNivel", () => {
    it("deve retornar contagem por nível", async () => {
      const mockContagem = {
        INICIANTE: 50,
        INTERMEDIARIO: 80,
        AVANCADO: 20,
      };

      mockGet.mockResolvedValue(mockContagem);

      const result = await jogadorService.contarPorNivel();

      expect(mockGet).toHaveBeenCalledWith("/jogadores/stats/por-nivel");
      expect(result).toEqual(mockContagem);
    });

    it("deve retornar objeto vazio quando erro ocorre", async () => {
      mockGet.mockRejectedValue(new Error("Erro"));

      const result = await jogadorService.contarPorNivel();

      expect(result).toEqual({});
    });
  });

  describe("buscarDisponiveis", () => {
    it("deve retornar jogadores disponíveis para etapa", async () => {
      const mockDisponiveis = [mockJogador];
      mockGet.mockResolvedValue(mockDisponiveis);

      const result = await jogadorService.buscarDisponiveis("etapa-123");

      expect(mockGet).toHaveBeenCalledWith("/jogadores/disponiveis/etapa-123");
      expect(result).toEqual(mockDisponiveis);
    });

    it("deve retornar lista vazia quando erro ocorre", async () => {
      mockGet.mockRejectedValue(new Error("Erro"));

      const result = await jogadorService.buscarDisponiveis("etapa-123");

      expect(result).toEqual([]);
    });
  });
});
