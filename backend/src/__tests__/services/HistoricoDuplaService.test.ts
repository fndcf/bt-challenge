/**
 * Testes do HistoricoDuplaService
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
const mockGet = jest.fn();
const mockBatchDelete = jest.fn();
const mockBatchCommit = jest.fn();
const mockOrderBy = jest.fn(() => ({ get: mockGet }));
const mockLimit = jest.fn(() => ({ get: mockGet }));

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

const mockDoc = jest.fn(() => ({ id: `doc-${Date.now()}` }));
const mockBatchSet = jest.fn();

const mockCollection = jest.fn(() => ({
  add: mockAdd,
  where: mockWhere,
  doc: mockDoc,
}));

jest.mock("../../config/firebase", () => ({
  db: {
    collection: mockCollection,
    batch: () => ({
      delete: mockBatchDelete,
      commit: mockBatchCommit,
      set: mockBatchSet,
    }),
  },
}));

jest.mock("../../services/CabecaDeChaveService", () => ({
  __esModule: true,
  default: {
    listarAtivas: jest.fn(),
  },
}));

import { HistoricoDuplaService } from "../../services/HistoricoDuplaService";
import cabecaDeChaveService from "../../services/CabecaDeChaveService";
import { TEST_IDS } from "../fixtures";

describe("HistoricoDuplaService", () => {
  let historicoDuplaService: HistoricoDuplaService;

  const TEST_ARENA_ID = TEST_IDS.arena;
  const TEST_ETAPA_ID = TEST_IDS.etapa;

  beforeEach(() => {
    jest.clearAllMocks();
    historicoDuplaService = new HistoricoDuplaService();
  });

  describe("registrar", () => {
    it("deve registrar nova dupla no histórico", async () => {
      // Mock buscarPorChave - não existe
      mockGet.mockResolvedValueOnce({ empty: true });

      // Mock add
      mockAdd.mockResolvedValue({ id: "historico-123" });

      const dto = {
        arenaId: TEST_ARENA_ID,
        etapaId: TEST_ETAPA_ID,
        etapaNome: "Etapa Teste",
        jogador1Id: "jogador-a",
        jogador1Nome: "Jogador A",
        jogador2Id: "jogador-b",
        jogador2Nome: "Jogador B",
        ambosForamCabecas: true,
      };

      const result = await historicoDuplaService.registrar(dto);

      expect(result.id).toBe("historico-123");
      expect(result.jogador1Nome).toBe("Jogador A");
      expect(result.jogador2Nome).toBe("Jogador B");
      expect(result.ambosForamCabecas).toBe(true);
      expect(result.chaveNormalizada).toBe("jogador-a_jogador-b");
      expect(mockAdd).toHaveBeenCalled();
    });

    it("deve retornar registro existente se dupla já existe", async () => {
      const existente = {
        id: "historico-existente",
        arenaId: TEST_ARENA_ID,
        etapaId: TEST_ETAPA_ID,
        jogador1Id: "jogador-a",
        jogador2Id: "jogador-b",
        chaveNormalizada: "jogador-a_jogador-b",
      };

      mockGet.mockResolvedValueOnce({
        empty: false,
        docs: [{ id: existente.id, data: () => existente }],
      });

      const dto = {
        arenaId: TEST_ARENA_ID,
        etapaId: TEST_ETAPA_ID,
        etapaNome: "Etapa Teste",
        jogador1Id: "jogador-a",
        jogador1Nome: "Jogador A",
        jogador2Id: "jogador-b",
        jogador2Nome: "Jogador B",
        ambosForamCabecas: true,
      };

      const result = await historicoDuplaService.registrar(dto);

      expect(result.id).toBe("historico-existente");
      expect(mockAdd).not.toHaveBeenCalled();
    });

    it("deve normalizar chave independente da ordem dos jogadores", async () => {
      mockGet.mockResolvedValueOnce({ empty: true });
      mockAdd.mockResolvedValue({ id: "historico-123" });

      const dto = {
        arenaId: TEST_ARENA_ID,
        etapaId: TEST_ETAPA_ID,
        etapaNome: "Etapa Teste",
        jogador1Id: "jogador-z", // Jogador Z primeiro
        jogador1Nome: "Jogador Z",
        jogador2Id: "jogador-a", // Jogador A segundo
        jogador2Nome: "Jogador A",
        ambosForamCabecas: false,
      };

      const result = await historicoDuplaService.registrar(dto);

      // Chave deve ser ordenada alfabeticamente
      expect(result.chaveNormalizada).toBe("jogador-a_jogador-z");
    });
  });

  describe("duplaJaFormada", () => {
    it("deve retornar true se dupla de cabeças já foi formada", async () => {
      mockGet.mockResolvedValue({
        empty: false,
        docs: [{ id: "historico-1" }],
      });

      const result = await historicoDuplaService.duplaJaFormada(
        TEST_ARENA_ID,
        "jogador-a",
        "jogador-b"
      );

      expect(result).toBe(true);
    });

    it("deve retornar false se dupla nunca foi formada", async () => {
      mockGet.mockResolvedValue({ empty: true });

      const result = await historicoDuplaService.duplaJaFormada(
        TEST_ARENA_ID,
        "jogador-x",
        "jogador-y"
      );

      expect(result).toBe(false);
    });

    it("deve retornar false em caso de erro", async () => {
      mockGet.mockRejectedValue(new Error("Erro"));

      const result = await historicoDuplaService.duplaJaFormada(
        TEST_ARENA_ID,
        "jogador-a",
        "jogador-b"
      );

      expect(result).toBe(false);
    });
  });

  describe("obterCombinacoesRealizadas", () => {
    it("deve retornar set de combinações realizadas", async () => {
      mockGet.mockResolvedValue({
        docs: [
          { data: () => ({ chaveNormalizada: "a_b" }) },
          { data: () => ({ chaveNormalizada: "c_d" }) },
        ],
      });

      const result = await historicoDuplaService.obterCombinacoesRealizadas(
        TEST_ARENA_ID
      );

      expect(result.size).toBe(2);
      expect(result.has("a_b")).toBe(true);
      expect(result.has("c_d")).toBe(true);
    });

    it("deve retornar set vazio se não houver combinações", async () => {
      mockGet.mockResolvedValue({ docs: [] });

      const result = await historicoDuplaService.obterCombinacoesRealizadas(
        TEST_ARENA_ID
      );

      expect(result.size).toBe(0);
    });

    it("deve retornar set vazio em caso de erro", async () => {
      mockGet.mockRejectedValue(new Error("Erro"));

      const result = await historicoDuplaService.obterCombinacoesRealizadas(
        TEST_ARENA_ID
      );

      expect(result.size).toBe(0);
    });
  });

  describe("calcularEstatisticas", () => {
    it("deve calcular estatísticas corretamente com 4 cabeças", async () => {
      // 4 cabeças de chave
      (cabecaDeChaveService.listarAtivas as jest.Mock).mockResolvedValue([
        { jogadorId: "c1" },
        { jogadorId: "c2" },
        { jogadorId: "c3" },
        { jogadorId: "c4" },
      ]);

      // 2 combinações já realizadas
      mockGet.mockResolvedValue({
        docs: [
          { data: () => ({ chaveNormalizada: "c1_c2" }) },
          { data: () => ({ chaveNormalizada: "c3_c4" }) },
        ],
      });

      const result = await historicoDuplaService.calcularEstatisticas(
        TEST_ARENA_ID,
        TEST_ETAPA_ID
      );

      // C(4,2) = 6 combinações possíveis
      expect(result.totalCabecas).toBe(4);
      expect(result.combinacoesPossiveis).toBe(6);
      expect(result.combinacoesRealizadas).toBe(2);
      expect(result.combinacoesRestantes).toBe(4);
      expect(result.todasCombinacoesFeitas).toBe(false);
      expect(result.combinacoesDisponiveis.length).toBe(4);
    });

    it("deve indicar todas combinações feitas quando não restam", async () => {
      // 3 cabeças de chave
      (cabecaDeChaveService.listarAtivas as jest.Mock).mockResolvedValue([
        { jogadorId: "c1" },
        { jogadorId: "c2" },
        { jogadorId: "c3" },
      ]);

      // C(3,2) = 3 combinações - todas já realizadas
      mockGet.mockResolvedValue({
        docs: [
          { data: () => ({ chaveNormalizada: "c1_c2" }) },
          { data: () => ({ chaveNormalizada: "c1_c3" }) },
          { data: () => ({ chaveNormalizada: "c2_c3" }) },
        ],
      });

      const result = await historicoDuplaService.calcularEstatisticas(
        TEST_ARENA_ID,
        TEST_ETAPA_ID
      );

      expect(result.combinacoesPossiveis).toBe(3);
      expect(result.combinacoesRealizadas).toBe(3);
      expect(result.combinacoesRestantes).toBe(0);
      expect(result.todasCombinacoesFeitas).toBe(true);
      expect(result.combinacoesDisponiveis.length).toBe(0);
    });

    it("deve retornar zeros com menos de 2 cabeças", async () => {
      (cabecaDeChaveService.listarAtivas as jest.Mock).mockResolvedValue([
        { jogadorId: "c1" },
      ]);

      mockGet.mockResolvedValue({ docs: [] });

      const result = await historicoDuplaService.calcularEstatisticas(
        TEST_ARENA_ID,
        TEST_ETAPA_ID
      );

      expect(result.totalCabecas).toBe(1);
      expect(result.combinacoesPossiveis).toBe(0);
      expect(result.combinacoesRealizadas).toBe(0);
      expect(result.todasCombinacoesFeitas).toBe(true);
    });
  });

  describe("listarHistoricoJogador", () => {
    it("deve listar histórico do jogador em ambas posições", async () => {
      const historico1 = {
        id: "h1",
        jogador1Nome: "Jogador A",
        jogador2Nome: "Jogador B",
        criadoEm: { toMillis: () => 1000 },
      };
      const historico2 = {
        id: "h2",
        jogador1Nome: "Jogador C",
        jogador2Nome: "Jogador A",
        criadoEm: { toMillis: () => 2000 },
      };

      // Primeira query (jogador1Id)
      mockGet
        .mockResolvedValueOnce({
          docs: [{ id: historico1.id, data: () => historico1 }],
        })
        // Segunda query (jogador2Id)
        .mockResolvedValueOnce({
          docs: [{ id: historico2.id, data: () => historico2 }],
        });

      const result = await historicoDuplaService.listarHistoricoJogador(
        TEST_ARENA_ID,
        "jogador-a"
      );

      expect(result).toHaveLength(2);
      // Ordenado por criadoEm desc
      expect(result[0].id).toBe("h2");
      expect(result[1].id).toBe("h1");
    });

    it("deve retornar array vazio em caso de erro", async () => {
      mockGet.mockRejectedValue(new Error("Erro"));

      const result = await historicoDuplaService.listarHistoricoJogador(
        TEST_ARENA_ID,
        "jogador-a"
      );

      expect(result).toEqual([]);
    });
  });

  describe("limparDaEtapa", () => {
    it("deve limpar histórico da etapa", async () => {
      mockGet.mockResolvedValue({
        empty: false,
        size: 3,
        docs: [
          { ref: { id: "h1" } },
          { ref: { id: "h2" } },
          { ref: { id: "h3" } },
        ],
      });

      mockBatchCommit.mockResolvedValue(undefined);

      await historicoDuplaService.limparDaEtapa(TEST_ARENA_ID, TEST_ETAPA_ID);

      expect(mockBatchDelete).toHaveBeenCalledTimes(3);
      expect(mockBatchCommit).toHaveBeenCalled();
    });

    it("deve retornar silenciosamente se não houver histórico", async () => {
      mockGet.mockResolvedValue({ empty: true });

      await historicoDuplaService.limparDaEtapa(TEST_ARENA_ID, TEST_ETAPA_ID);

      expect(mockBatchDelete).not.toHaveBeenCalled();
    });
  });

  describe("limparEtapa", () => {
    it("deve limpar todos os registros da etapa", async () => {
      mockGet.mockResolvedValue({
        size: 2,
        docs: [{ ref: { id: "h1" } }, { ref: { id: "h2" } }],
      });

      mockBatchCommit.mockResolvedValue(undefined);

      await historicoDuplaService.limparEtapa(TEST_ARENA_ID, TEST_ETAPA_ID);

      expect(mockBatchDelete).toHaveBeenCalledTimes(2);
      expect(mockBatchCommit).toHaveBeenCalled();
    });

    it("deve propagar erro em caso de falha", async () => {
      mockGet.mockRejectedValue(new Error("Erro de conexão"));

      await expect(
        historicoDuplaService.limparEtapa(TEST_ARENA_ID, TEST_ETAPA_ID)
      ).rejects.toThrow("Erro de conexão");
    });
  });

  describe("registrar - erros", () => {
    it("deve propagar erro em caso de falha ao adicionar", async () => {
      mockGet.mockResolvedValueOnce({ empty: true });
      mockAdd.mockRejectedValue(new Error("Erro de conexão"));

      const dto = {
        arenaId: TEST_ARENA_ID,
        etapaId: TEST_ETAPA_ID,
        etapaNome: "Etapa Teste",
        jogador1Id: "jogador-a",
        jogador1Nome: "Jogador A",
        jogador2Id: "jogador-b",
        jogador2Nome: "Jogador B",
        ambosForamCabecas: true,
      };

      await expect(historicoDuplaService.registrar(dto)).rejects.toThrow(
        "Erro de conexão"
      );
    });
  });

  describe("registrarEmLote", () => {
    it("deve registrar múltiplas duplas em lote", async () => {
      mockBatchCommit.mockResolvedValue(undefined);

      const dtos = [
        {
          arenaId: TEST_ARENA_ID,
          etapaId: TEST_ETAPA_ID,
          etapaNome: "Etapa Teste",
          jogador1Id: "jogador-a",
          jogador1Nome: "Jogador A",
          jogador2Id: "jogador-b",
          jogador2Nome: "Jogador B",
          ambosForamCabecas: true,
        },
        {
          arenaId: TEST_ARENA_ID,
          etapaId: TEST_ETAPA_ID,
          etapaNome: "Etapa Teste",
          jogador1Id: "jogador-c",
          jogador1Nome: "Jogador C",
          jogador2Id: "jogador-d",
          jogador2Nome: "Jogador D",
          ambosForamCabecas: false,
        },
      ];

      const result = await historicoDuplaService.registrarEmLote(dtos);

      expect(result).toHaveLength(2);
      expect(mockBatchSet).toHaveBeenCalledTimes(2);
      expect(mockBatchCommit).toHaveBeenCalled();
    });

    it("deve retornar array vazio se lista vazia", async () => {
      const result = await historicoDuplaService.registrarEmLote([]);

      expect(result).toHaveLength(0);
      expect(mockBatchSet).not.toHaveBeenCalled();
    });

    it("deve propagar erro em caso de falha no batch commit", async () => {
      mockBatchCommit.mockRejectedValue(new Error("Erro de batch"));

      const dtos = [
        {
          arenaId: TEST_ARENA_ID,
          etapaId: TEST_ETAPA_ID,
          etapaNome: "Etapa Teste",
          jogador1Id: "jogador-a",
          jogador1Nome: "Jogador A",
          jogador2Id: "jogador-b",
          jogador2Nome: "Jogador B",
          ambosForamCabecas: true,
        },
      ];

      await expect(historicoDuplaService.registrarEmLote(dtos)).rejects.toThrow(
        "Erro de batch"
      );
    });
  });

  describe("limparDaEtapa - erros", () => {
    it("deve propagar erro em caso de falha", async () => {
      mockGet.mockResolvedValue({
        empty: false,
        size: 1,
        docs: [{ ref: { id: "h1" } }],
      });
      mockBatchCommit.mockRejectedValue(new Error("Erro ao limpar"));

      await expect(
        historicoDuplaService.limparDaEtapa(TEST_ARENA_ID, TEST_ETAPA_ID)
      ).rejects.toThrow("Erro ao limpar");
    });
  });
});
