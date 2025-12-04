/**
 * Testes do CabecaDeChaveService
 */

jest.mock("../../utils/logger", () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    critical: jest.fn(),
  },
}));

// Mock do Firebase
const mockAdd = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockGet = jest.fn();
const mockDoc = jest.fn(() => ({
  update: mockUpdate,
  delete: mockDelete,
}));
const mockLimit = jest.fn(() => ({ get: mockGet }));
const mockOrderBy = jest.fn(() => ({ get: mockGet }));

interface MockWhereResult {
  where: jest.Mock<MockWhereResult>;
  limit: jest.Mock;
  orderBy: jest.Mock;
  get: jest.Mock;
}

const mockWhere: jest.Mock<MockWhereResult> = jest.fn(() => ({
  where: mockWhere,
  limit: mockLimit,
  orderBy: mockOrderBy,
  get: mockGet,
}));

const mockCollection = jest.fn(() => ({
  add: mockAdd,
  doc: mockDoc,
  where: mockWhere,
}));

jest.mock("../../config/firebase", () => ({
  db: {
    collection: mockCollection,
  },
}));

import { CabecaDeChaveService } from "../../services/CabecaDeChaveService";
import { TEST_IDS, NivelJogador, GeneroJogador } from "../fixtures";

describe("CabecaDeChaveService", () => {
  let cabecaDeChaveService: CabecaDeChaveService;

  const TEST_ARENA_ID = TEST_IDS.arena;
  const TEST_ETAPA_ID = TEST_IDS.etapa;
  const TEST_JOGADOR_ID = TEST_IDS.jogador1;

  beforeEach(() => {
    jest.clearAllMocks();
    cabecaDeChaveService = new CabecaDeChaveService();
  });

  describe("criar", () => {
    it("deve criar cabeça de chave com sucesso", async () => {
      // Mock buscarPorJogador retorna null (não existe)
      mockGet.mockResolvedValueOnce({ empty: true });

      // Mock add
      mockAdd.mockResolvedValue({ id: "cabeca-123" });

      const dto = {
        arenaId: TEST_ARENA_ID,
        etapaId: TEST_ETAPA_ID,
        jogadorId: TEST_JOGADOR_ID,
        jogadorNome: "João Silva",
        jogadorNivel: NivelJogador.AVANCADO,
        jogadorGenero: GeneroJogador.MASCULINO,
        ordem: 1,
      };

      const result = await cabecaDeChaveService.criar(dto);

      expect(result.id).toBe("cabeca-123");
      expect(result.jogadorNome).toBe("João Silva");
      expect(result.ordem).toBe(1);
      expect(result.ativo).toBe(true);
      expect(mockAdd).toHaveBeenCalled();
    });

    it("deve lançar erro se jogador já é cabeça de chave", async () => {
      // Mock buscarPorJogador retorna resultado existente
      mockGet.mockResolvedValueOnce({
        empty: false,
        docs: [
          {
            id: "cabeca-existente",
            data: () => ({
              arenaId: TEST_ARENA_ID,
              etapaId: TEST_ETAPA_ID,
              jogadorId: TEST_JOGADOR_ID,
              ativo: true,
            }),
          },
        ],
      });

      const dto = {
        arenaId: TEST_ARENA_ID,
        etapaId: TEST_ETAPA_ID,
        jogadorId: TEST_JOGADOR_ID,
        jogadorNome: "João Silva",
        jogadorNivel: NivelJogador.AVANCADO,
        jogadorGenero: GeneroJogador.MASCULINO,
        ordem: 1,
      };

      await expect(cabecaDeChaveService.criar(dto)).rejects.toThrow(
        "Jogador já é cabeça de chave"
      );

      expect(mockAdd).not.toHaveBeenCalled();
    });
  });

  describe("buscarPorJogador", () => {
    it("deve retornar cabeça de chave quando encontrada", async () => {
      mockGet.mockResolvedValue({
        empty: false,
        docs: [
          {
            id: "cabeca-123",
            data: () => ({
              arenaId: TEST_ARENA_ID,
              etapaId: TEST_ETAPA_ID,
              jogadorId: TEST_JOGADOR_ID,
              jogadorNome: "João Silva",
              ativo: true,
            }),
          },
        ],
      });

      const result = await cabecaDeChaveService.buscarPorJogador(
        TEST_ARENA_ID,
        TEST_ETAPA_ID,
        TEST_JOGADOR_ID
      );

      expect(result).not.toBeNull();
      expect(result?.id).toBe("cabeca-123");
      expect(result?.jogadorNome).toBe("João Silva");
    });

    it("deve retornar null quando não encontrada", async () => {
      mockGet.mockResolvedValue({ empty: true });

      const result = await cabecaDeChaveService.buscarPorJogador(
        TEST_ARENA_ID,
        TEST_ETAPA_ID,
        "jogador-inexistente"
      );

      expect(result).toBeNull();
    });
  });

  describe("listarAtivas", () => {
    it("deve retornar lista de cabeças ativas ordenadas", async () => {
      mockGet.mockResolvedValue({
        docs: [
          {
            id: "cabeca-1",
            data: () => ({
              jogadorId: "j1",
              jogadorNome: "Jogador 1",
              ordem: 1,
              ativo: true,
            }),
          },
          {
            id: "cabeca-2",
            data: () => ({
              jogadorId: "j2",
              jogadorNome: "Jogador 2",
              ordem: 2,
              ativo: true,
            }),
          },
        ],
      });

      const result = await cabecaDeChaveService.listarAtivas(
        TEST_ARENA_ID,
        TEST_ETAPA_ID
      );

      expect(result).toHaveLength(2);
      expect(result[0].jogadorNome).toBe("Jogador 1");
      expect(result[1].jogadorNome).toBe("Jogador 2");
    });

    it("deve retornar lista vazia se não houver cabeças", async () => {
      mockGet.mockResolvedValue({ docs: [] });

      const result = await cabecaDeChaveService.listarAtivas(
        TEST_ARENA_ID,
        TEST_ETAPA_ID
      );

      expect(result).toHaveLength(0);
    });
  });

  describe("ehCabecaDeChave", () => {
    it("deve retornar true se jogador é cabeça de chave ativa", async () => {
      mockGet.mockResolvedValue({
        empty: false,
        docs: [
          {
            id: "cabeca-123",
            data: () => ({
              jogadorId: TEST_JOGADOR_ID,
              ativo: true,
            }),
          },
        ],
      });

      const result = await cabecaDeChaveService.ehCabecaDeChave(
        TEST_ARENA_ID,
        TEST_ETAPA_ID,
        TEST_JOGADOR_ID
      );

      expect(result).toBe(true);
    });

    it("deve retornar false se jogador não é cabeça de chave", async () => {
      mockGet.mockResolvedValue({ empty: true });

      const result = await cabecaDeChaveService.ehCabecaDeChave(
        TEST_ARENA_ID,
        TEST_ETAPA_ID,
        "jogador-normal"
      );

      expect(result).toBe(false);
    });

    it("deve retornar false em caso de erro", async () => {
      mockGet.mockRejectedValue(new Error("Erro de conexão"));

      const result = await cabecaDeChaveService.ehCabecaDeChave(
        TEST_ARENA_ID,
        TEST_ETAPA_ID,
        TEST_JOGADOR_ID
      );

      expect(result).toBe(false);
    });
  });

  describe("atualizar", () => {
    it("deve atualizar ordem da cabeça de chave", async () => {
      mockUpdate.mockResolvedValue(undefined);

      await cabecaDeChaveService.atualizar("cabeca-123", { ordem: 2 });

      expect(mockDoc).toHaveBeenCalledWith("cabeca-123");
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ ordem: 2 })
      );
    });

    it("deve atualizar status ativo", async () => {
      mockUpdate.mockResolvedValue(undefined);

      await cabecaDeChaveService.atualizar("cabeca-123", {
        ativo: false,
        motivoDesativacao: "Cancelou participação",
      });

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          ativo: false,
          motivoDesativacao: "Cancelou participação",
        })
      );
    });
  });

  describe("desativar", () => {
    it("deve desativar cabeça de chave existente", async () => {
      mockGet.mockResolvedValue({
        empty: false,
        docs: [
          {
            id: "cabeca-123",
            data: () => ({
              jogadorId: TEST_JOGADOR_ID,
              ativo: true,
            }),
          },
        ],
      });
      mockUpdate.mockResolvedValue(undefined);

      await cabecaDeChaveService.desativar(
        TEST_ARENA_ID,
        TEST_ETAPA_ID,
        TEST_JOGADOR_ID,
        "Lesão"
      );

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          ativo: false,
          motivoDesativacao: "Lesão",
        })
      );
    });

    it("deve lançar erro se cabeça de chave não encontrada", async () => {
      mockGet.mockResolvedValue({ empty: true });

      await expect(
        cabecaDeChaveService.desativar(
          TEST_ARENA_ID,
          TEST_ETAPA_ID,
          "jogador-inexistente"
        )
      ).rejects.toThrow("Cabeça de chave não encontrada");
    });
  });

  describe("reativar", () => {
    it("deve reativar cabeça de chave desativada", async () => {
      mockGet.mockResolvedValue({
        empty: false,
        docs: [
          {
            id: "cabeca-123",
            data: () => ({
              jogadorId: TEST_JOGADOR_ID,
              ativo: false,
            }),
          },
        ],
      });
      mockUpdate.mockResolvedValue(undefined);

      await cabecaDeChaveService.reativar(
        TEST_ARENA_ID,
        TEST_ETAPA_ID,
        TEST_JOGADOR_ID
      );

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          ativo: true,
        })
      );
    });

    it("deve lançar erro se cabeça de chave não encontrada", async () => {
      mockGet.mockResolvedValue({ empty: true });

      await expect(
        cabecaDeChaveService.reativar(
          TEST_ARENA_ID,
          TEST_ETAPA_ID,
          "jogador-inexistente"
        )
      ).rejects.toThrow("Cabeça de chave não encontrada");
    });
  });

  describe("remover", () => {
    it("deve remover cabeça de chave permanentemente", async () => {
      mockGet.mockResolvedValue({
        empty: false,
        docs: [
          {
            id: "cabeca-123",
            data: () => ({
              jogadorId: TEST_JOGADOR_ID,
              jogadorNome: "João Silva",
            }),
          },
        ],
      });
      mockDelete.mockResolvedValue(undefined);

      await cabecaDeChaveService.remover(
        TEST_ARENA_ID,
        TEST_ETAPA_ID,
        TEST_JOGADOR_ID
      );

      expect(mockDoc).toHaveBeenCalledWith("cabeca-123");
      expect(mockDelete).toHaveBeenCalled();
    });

    it("deve lançar erro se cabeça de chave não encontrada", async () => {
      mockGet.mockResolvedValue({ empty: true });

      await expect(
        cabecaDeChaveService.remover(
          TEST_ARENA_ID,
          TEST_ETAPA_ID,
          "jogador-inexistente"
        )
      ).rejects.toThrow("Cabeça de chave não encontrada");
    });
  });

  describe("filtrarCabecas", () => {
    it("deve retornar apenas IDs que são cabeças de chave", async () => {
      mockGet.mockResolvedValue({
        docs: [
          {
            id: "cabeca-1",
            data: () => ({ jogadorId: "j1", ativo: true }),
          },
          {
            id: "cabeca-2",
            data: () => ({ jogadorId: "j3", ativo: true }),
          },
        ],
      });

      const result = await cabecaDeChaveService.filtrarCabecas(
        TEST_ARENA_ID,
        TEST_ETAPA_ID,
        ["j1", "j2", "j3", "j4"]
      );

      expect(result).toEqual(["j1", "j3"]);
    });

    it("deve retornar array vazio se nenhum ID for cabeça", async () => {
      mockGet.mockResolvedValue({ docs: [] });

      const result = await cabecaDeChaveService.filtrarCabecas(
        TEST_ARENA_ID,
        TEST_ETAPA_ID,
        ["j1", "j2"]
      );

      expect(result).toEqual([]);
    });

    it("deve retornar array vazio em caso de erro", async () => {
      mockGet.mockRejectedValue(new Error("Erro"));

      const result = await cabecaDeChaveService.filtrarCabecas(
        TEST_ARENA_ID,
        TEST_ETAPA_ID,
        ["j1", "j2"]
      );

      expect(result).toEqual([]);
    });
  });

  describe("obterIdsCabecas", () => {
    it("deve retornar IDs das cabeças de chave ativas", async () => {
      mockGet.mockResolvedValue({
        docs: [
          {
            id: "cabeca-1",
            data: () => ({ jogadorId: "j1", ativo: true }),
          },
          {
            id: "cabeca-2",
            data: () => ({ jogadorId: "j2", ativo: true }),
          },
        ],
      });

      const result = await cabecaDeChaveService.obterIdsCabecas(
        TEST_ARENA_ID,
        TEST_ETAPA_ID
      );

      expect(result).toEqual(["j1", "j2"]);
    });

    it("deve retornar array vazio se não houver cabeças", async () => {
      mockGet.mockResolvedValue({ docs: [] });

      const result = await cabecaDeChaveService.obterIdsCabecas(
        TEST_ARENA_ID,
        TEST_ETAPA_ID
      );

      expect(result).toEqual([]);
    });

    it("deve retornar array vazio em caso de erro", async () => {
      mockGet.mockRejectedValue(new Error("Erro"));

      const result = await cabecaDeChaveService.obterIdsCabecas(
        TEST_ARENA_ID,
        TEST_ETAPA_ID
      );

      expect(result).toEqual([]);
    });
  });
});
