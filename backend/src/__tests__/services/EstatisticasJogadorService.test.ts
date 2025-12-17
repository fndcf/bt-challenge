/**
 * Testes do EstatisticasJogadorService
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
const mockGet = jest.fn();
const mockBatchSet = jest.fn();
const mockBatchUpdate = jest.fn();
const mockBatchCommit = jest.fn();
const mockBatch = jest.fn(() => ({
  set: mockBatchSet,
  update: mockBatchUpdate,
  commit: mockBatchCommit,
}));
const mockDoc = jest.fn(() => ({
  update: mockUpdate,
  id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
}));
const mockLimit = jest.fn(() => ({ get: mockGet }));
const mockOrderBy = jest.fn(() => ({ get: mockGet, limit: mockLimit }));

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
    batch: mockBatch,
  },
}));

import { EstatisticasJogadorService } from "../../services/EstatisticasJogadorService";
import { TEST_IDS, NivelJogador, GeneroJogador } from "../fixtures";

describe("EstatisticasJogadorService", () => {
  let service: EstatisticasJogadorService;

  const TEST_ARENA_ID = TEST_IDS.arena;
  const TEST_ETAPA_ID = TEST_IDS.etapa;
  const TEST_JOGADOR_ID = TEST_IDS.jogador1;
  const TEST_GRUPO_ID = "grupo-123";

  beforeEach(() => {
    jest.clearAllMocks();
    mockBatchCommit.mockResolvedValue(undefined);
    service = new EstatisticasJogadorService();
  });

  describe("criar", () => {
    it("deve criar estatísticas iniciais para um jogador", async () => {
      mockAdd.mockResolvedValue({ id: "estatistica-123" });

      const dto = {
        etapaId: TEST_ETAPA_ID,
        arenaId: TEST_ARENA_ID,
        jogadorId: TEST_JOGADOR_ID,
        jogadorNome: "João Silva",
        jogadorNivel: NivelJogador.AVANCADO,
        jogadorGenero: GeneroJogador.MASCULINO,
        grupoId: TEST_GRUPO_ID,
        grupoNome: "Grupo A",
      };

      const result = await service.criar(dto);

      expect(result.id).toBe("estatistica-123");
      expect(result.jogadorNome).toBe("João Silva");
      expect(result.jogos).toBe(0);
      expect(result.vitorias).toBe(0);
      expect(result.derrotas).toBe(0);
      expect(result.pontos).toBe(0);
      expect(result.classificado).toBe(false);
      expect(mockAdd).toHaveBeenCalled();
    });

    it("deve inicializar todas as estatísticas de grupo zeradas", async () => {
      mockAdd.mockResolvedValue({ id: "estatistica-123" });

      const dto = {
        etapaId: TEST_ETAPA_ID,
        arenaId: TEST_ARENA_ID,
        jogadorId: TEST_JOGADOR_ID,
        jogadorNome: "João Silva",
        jogadorNivel: NivelJogador.INTERMEDIARIO,
        jogadorGenero: GeneroJogador.MASCULINO,
        grupoId: TEST_GRUPO_ID,
        grupoNome: "Grupo A",
      };

      const result = await service.criar(dto);

      expect(result.jogosGrupo).toBe(0);
      expect(result.vitoriasGrupo).toBe(0);
      expect(result.derrotasGrupo).toBe(0);
      expect(result.pontosGrupo).toBe(0);
      expect(result.setsVencidosGrupo).toBe(0);
      expect(result.setsPerdidosGrupo).toBe(0);
      expect(result.saldoSetsGrupo).toBe(0);
      expect(result.gamesVencidosGrupo).toBe(0);
      expect(result.gamesPerdidosGrupo).toBe(0);
      expect(result.saldoGamesGrupo).toBe(0);
    });

    it("deve propagar erro em caso de falha", async () => {
      mockAdd.mockRejectedValue(new Error("Erro de conexão"));

      const dto = {
        etapaId: TEST_ETAPA_ID,
        arenaId: TEST_ARENA_ID,
        jogadorId: TEST_JOGADOR_ID,
        jogadorNome: "João Silva",
        jogadorNivel: NivelJogador.INICIANTE,
        jogadorGenero: GeneroJogador.MASCULINO,
        grupoId: TEST_GRUPO_ID,
        grupoNome: "Grupo A",
      };

      await expect(service.criar(dto)).rejects.toThrow("Erro de conexão");
    });
  });

  describe("buscarPorJogadorEtapa", () => {
    it("deve retornar estatísticas quando encontradas", async () => {
      const estatisticaData = {
        jogadorId: TEST_JOGADOR_ID,
        etapaId: TEST_ETAPA_ID,
        jogadorNome: "João Silva",
        jogos: 5,
        vitorias: 3,
      };

      mockGet.mockResolvedValue({
        empty: false,
        docs: [{ id: "estatistica-123", data: () => estatisticaData }],
      });

      const result = await service.buscarPorJogadorEtapa(
        TEST_JOGADOR_ID,
        TEST_ETAPA_ID
      );

      expect(result).not.toBeNull();
      expect(result?.id).toBe("estatistica-123");
      expect(result?.jogadorNome).toBe("João Silva");
      expect(result?.jogos).toBe(5);
    });

    it("deve retornar null quando não encontradas", async () => {
      mockGet.mockResolvedValue({ empty: true, docs: [] });

      const result = await service.buscarPorJogadorEtapa(
        "jogador-inexistente",
        TEST_ETAPA_ID
      );

      expect(result).toBeNull();
    });
  });

  describe("atualizarAposPartida", () => {
    it("deve atualizar estatísticas após vitória", async () => {
      const estatisticaExistente = {
        id: "estatistica-123",
        jogadorId: TEST_JOGADOR_ID,
        etapaId: TEST_ETAPA_ID,
        jogos: 2,
        vitorias: 1,
        derrotas: 1,
        pontos: 3,
        setsVencidos: 3,
        setsPerdidos: 2,
        gamesVencidos: 15,
        gamesPerdidos: 12,
        saldoSets: 1,
        saldoGames: 3,
      };

      mockGet.mockResolvedValue({
        empty: false,
        docs: [{ id: estatisticaExistente.id, data: () => estatisticaExistente }],
      });
      mockUpdate.mockResolvedValue(undefined);

      const dto = {
        venceu: true,
        setsVencidos: 2,
        setsPerdidos: 0,
        gamesVencidos: 12,
        gamesPerdidos: 6,
      };

      await service.atualizarAposPartida(TEST_JOGADOR_ID, TEST_ETAPA_ID, dto);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          jogos: 3,
          vitorias: 2,
          derrotas: 1,
          setsVencidos: 5,
          setsPerdidos: 2,
          gamesVencidos: 27,
          gamesPerdidos: 18,
          saldoSets: 3,
          saldoGames: 9,
        })
      );
    });

    it("deve atualizar estatísticas após derrota", async () => {
      const estatisticaExistente = {
        id: "estatistica-123",
        jogadorId: TEST_JOGADOR_ID,
        etapaId: TEST_ETAPA_ID,
        jogos: 1,
        vitorias: 1,
        derrotas: 0,
        pontos: 3,
        setsVencidos: 2,
        setsPerdidos: 0,
        gamesVencidos: 12,
        gamesPerdidos: 6,
        saldoSets: 2,
        saldoGames: 6,
      };

      mockGet.mockResolvedValue({
        empty: false,
        docs: [{ id: estatisticaExistente.id, data: () => estatisticaExistente }],
      });
      mockUpdate.mockResolvedValue(undefined);

      const dto = {
        venceu: false,
        setsVencidos: 0,
        setsPerdidos: 2,
        gamesVencidos: 8,
        gamesPerdidos: 12,
      };

      await service.atualizarAposPartida(TEST_JOGADOR_ID, TEST_ETAPA_ID, dto);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          jogos: 2,
          vitorias: 1,
          derrotas: 1,
          setsVencidos: 2,
          setsPerdidos: 2,
          saldoSets: 0,
        })
      );
    });

    it("não deve atualizar se estatísticas não encontradas", async () => {
      mockGet.mockResolvedValue({ empty: true, docs: [] });

      const dto = {
        venceu: true,
        setsVencidos: 2,
        setsPerdidos: 0,
        gamesVencidos: 12,
        gamesPerdidos: 6,
      };

      await service.atualizarAposPartida(TEST_JOGADOR_ID, TEST_ETAPA_ID, dto);

      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });

  describe("reverterAposPartida", () => {
    it("deve reverter estatísticas corretamente", async () => {
      const estatisticaExistente = {
        id: "estatistica-123",
        jogadorId: TEST_JOGADOR_ID,
        etapaId: TEST_ETAPA_ID,
        jogos: 3,
        vitorias: 2,
        derrotas: 1,
        pontos: 6,
        setsVencidos: 5,
        setsPerdidos: 2,
        gamesVencidos: 27,
        gamesPerdidos: 18,
        saldoSets: 3,
        saldoGames: 9,
      };

      mockGet.mockResolvedValue({
        empty: false,
        docs: [{ id: estatisticaExistente.id, data: () => estatisticaExistente }],
      });
      mockUpdate.mockResolvedValue(undefined);

      const dto = {
        venceu: true,
        setsVencidos: 2,
        setsPerdidos: 0,
        gamesVencidos: 12,
        gamesPerdidos: 6,
      };

      await service.reverterAposPartida(TEST_JOGADOR_ID, TEST_ETAPA_ID, dto);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          jogos: 2,
          vitorias: 1,
          derrotas: 1,
          setsVencidos: 3,
          setsPerdidos: 2,
          saldoSets: 1,
          saldoGames: 3,
        })
      );
    });

    it("não deve reverter se estatísticas não encontradas", async () => {
      mockGet.mockResolvedValue({ empty: true, docs: [] });

      const dto = {
        venceu: true,
        setsVencidos: 2,
        setsPerdidos: 0,
        gamesVencidos: 12,
        gamesPerdidos: 6,
      };

      await service.reverterAposPartida(TEST_JOGADOR_ID, TEST_ETAPA_ID, dto);

      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });

  describe("atualizarAposPartidaGrupo", () => {
    it("deve atualizar estatísticas de grupo e totais após vitória", async () => {
      const estatisticaExistente = {
        id: "estatistica-123",
        jogadorId: TEST_JOGADOR_ID,
        etapaId: TEST_ETAPA_ID,
        grupoId: TEST_GRUPO_ID,
        jogosGrupo: 1,
        vitoriasGrupo: 1,
        derrotasGrupo: 0,
        pontosGrupo: 3,
        setsVencidosGrupo: 2,
        setsPerdidosGrupo: 0,
        saldoSetsGrupo: 2,
        gamesVencidosGrupo: 12,
        gamesPerdidosGrupo: 6,
        saldoGamesGrupo: 6,
        jogos: 1,
        vitorias: 1,
        derrotas: 0,
        setsVencidos: 2,
        setsPerdidos: 0,
        saldoSets: 2,
        gamesVencidos: 12,
        gamesPerdidos: 6,
        saldoGames: 6,
      };

      mockGet.mockResolvedValue({
        empty: false,
        docs: [{ id: estatisticaExistente.id, data: () => estatisticaExistente }],
      });
      mockUpdate.mockResolvedValue(undefined);

      const dto = {
        venceu: true,
        setsVencidos: 2,
        setsPerdidos: 1,
        gamesVencidos: 13,
        gamesPerdidos: 10,
      };

      await service.atualizarAposPartidaGrupo(TEST_JOGADOR_ID, TEST_ETAPA_ID, dto);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          jogosGrupo: 2,
          vitoriasGrupo: 2,
          pontosGrupo: 6, // 3 pontos por vitória
          setsVencidosGrupo: 4,
          setsPerdidosGrupo: 1,
          jogos: 2,
          vitorias: 2,
        })
      );
    });

    it("deve atualizar estatísticas de grupo após derrota (0 pontos)", async () => {
      const estatisticaExistente = {
        id: "estatistica-123",
        jogadorId: TEST_JOGADOR_ID,
        etapaId: TEST_ETAPA_ID,
        jogosGrupo: 0,
        vitoriasGrupo: 0,
        derrotasGrupo: 0,
        pontosGrupo: 0,
        setsVencidosGrupo: 0,
        setsPerdidosGrupo: 0,
        saldoSetsGrupo: 0,
        gamesVencidosGrupo: 0,
        gamesPerdidosGrupo: 0,
        saldoGamesGrupo: 0,
        jogos: 0,
        vitorias: 0,
        derrotas: 0,
        setsVencidos: 0,
        setsPerdidos: 0,
        saldoSets: 0,
        gamesVencidos: 0,
        gamesPerdidos: 0,
        saldoGames: 0,
      };

      mockGet.mockResolvedValue({
        empty: false,
        docs: [{ id: estatisticaExistente.id, data: () => estatisticaExistente }],
      });
      mockUpdate.mockResolvedValue(undefined);

      const dto = {
        venceu: false,
        setsVencidos: 0,
        setsPerdidos: 2,
        gamesVencidos: 6,
        gamesPerdidos: 12,
      };

      await service.atualizarAposPartidaGrupo(TEST_JOGADOR_ID, TEST_ETAPA_ID, dto);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          jogosGrupo: 1,
          vitoriasGrupo: 0,
          derrotasGrupo: 1,
          pontosGrupo: 0, // 0 pontos por derrota
        })
      );
    });
  });

  describe("reverterAposPartidaGrupo", () => {
    it("deve reverter estatísticas de grupo com Math.max para evitar negativos", async () => {
      const estatisticaExistente = {
        id: "estatistica-123",
        jogadorId: TEST_JOGADOR_ID,
        etapaId: TEST_ETAPA_ID,
        jogosGrupo: 1,
        vitoriasGrupo: 1,
        derrotasGrupo: 0,
        pontosGrupo: 3,
        setsVencidosGrupo: 2,
        setsPerdidosGrupo: 1,
        saldoSetsGrupo: 1,
        gamesVencidosGrupo: 12,
        gamesPerdidosGrupo: 8,
        saldoGamesGrupo: 4,
        jogos: 1,
        vitorias: 1,
        derrotas: 0,
        setsVencidos: 2,
        setsPerdidos: 1,
        saldoSets: 1,
        gamesVencidos: 12,
        gamesPerdidos: 8,
        saldoGames: 4,
      };

      mockGet.mockResolvedValue({
        empty: false,
        docs: [{ id: estatisticaExistente.id, data: () => estatisticaExistente }],
      });
      mockUpdate.mockResolvedValue(undefined);

      const dto = {
        venceu: true,
        setsVencidos: 2,
        setsPerdidos: 1,
        gamesVencidos: 12,
        gamesPerdidos: 8,
      };

      await service.reverterAposPartidaGrupo(TEST_JOGADOR_ID, TEST_ETAPA_ID, dto);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          jogosGrupo: 0,
          vitoriasGrupo: 0,
          pontosGrupo: 0,
          setsVencidosGrupo: 0,
          setsPerdidosGrupo: 0,
          jogos: 0,
          vitorias: 0,
        })
      );
    });
  });

  describe("atualizarAposPartidaEliminatoria", () => {
    it("deve atualizar estatísticas totais após partida eliminatória", async () => {
      const estatisticaExistente = {
        id: "estatistica-123",
        jogadorId: TEST_JOGADOR_ID,
        etapaId: TEST_ETAPA_ID,
        jogos: 3,
        vitorias: 2,
        derrotas: 1,
        setsVencidos: 5,
        setsPerdidos: 3,
        saldoSets: 2,
        gamesVencidos: 30,
        gamesPerdidos: 22,
        saldoGames: 8,
      };

      mockGet.mockResolvedValue({
        empty: false,
        docs: [{ id: estatisticaExistente.id, data: () => estatisticaExistente }],
      });
      mockUpdate.mockResolvedValue(undefined);

      const dto = {
        venceu: true,
        setsVencidos: 2,
        setsPerdidos: 0,
        gamesVencidos: 12,
        gamesPerdidos: 4,
      };

      await service.atualizarAposPartidaEliminatoria(
        TEST_JOGADOR_ID,
        TEST_ETAPA_ID,
        dto
      );

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          jogos: 4,
          vitorias: 3,
          derrotas: 1,
          setsVencidos: 7,
          setsPerdidos: 3,
        })
      );
    });
  });

  describe("reverterAposPartidaEliminatoria", () => {
    it("deve reverter estatísticas de eliminatória", async () => {
      const estatisticaExistente = {
        id: "estatistica-123",
        jogadorId: TEST_JOGADOR_ID,
        etapaId: TEST_ETAPA_ID,
        jogos: 4,
        vitorias: 3,
        derrotas: 1,
        setsVencidos: 7,
        setsPerdidos: 3,
        saldoSets: 4,
        gamesVencidos: 42,
        gamesPerdidos: 26,
        saldoGames: 16,
      };

      mockGet.mockResolvedValue({
        empty: false,
        docs: [{ id: estatisticaExistente.id, data: () => estatisticaExistente }],
      });
      mockUpdate.mockResolvedValue(undefined);

      const dto = {
        venceu: true,
        setsVencidos: 2,
        setsPerdidos: 0,
        gamesVencidos: 12,
        gamesPerdidos: 4,
      };

      await service.reverterAposPartidaEliminatoria(
        TEST_JOGADOR_ID,
        TEST_ETAPA_ID,
        dto
      );

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          jogos: 3,
          vitorias: 2,
          setsVencidos: 5,
          setsPerdidos: 3,
        })
      );
    });
  });

  describe("buscarPorEtapa", () => {
    it("deve retornar todas as estatísticas de uma etapa", async () => {
      const estatisticas = [
        { jogadorId: "j1", jogadorNome: "Jogador 1", jogos: 3 },
        { jogadorId: "j2", jogadorNome: "Jogador 2", jogos: 3 },
        { jogadorId: "j3", jogadorNome: "Jogador 3", jogos: 3 },
      ];

      mockGet.mockResolvedValue({
        docs: estatisticas.map((e, i) => ({
          id: `estat-${i}`,
          data: () => e,
        })),
      });

      const result = await service.buscarPorEtapa(TEST_ETAPA_ID, TEST_ARENA_ID);

      expect(result).toHaveLength(3);
      expect(result[0].jogadorNome).toBe("Jogador 1");
    });
  });

  describe("buscarPorGrupo", () => {
    it("deve retornar estatísticas de um grupo específico", async () => {
      const estatisticas = [
        { jogadorId: "j1", jogadorNome: "Jogador 1", grupoId: TEST_GRUPO_ID },
        { jogadorId: "j2", jogadorNome: "Jogador 2", grupoId: TEST_GRUPO_ID },
      ];

      mockGet.mockResolvedValue({
        docs: estatisticas.map((e, i) => ({
          id: `estat-${i}`,
          data: () => e,
        })),
      });

      const result = await service.buscarPorGrupo(TEST_GRUPO_ID);

      expect(result).toHaveLength(2);
    });
  });

  describe("buscarClassificados", () => {
    it("deve retornar os classificados de um grupo ordenados por posição", async () => {
      const estatisticas = [
        { jogadorId: "j1", jogadorNome: "Jogador 1", posicaoGrupo: 1 },
        { jogadorId: "j2", jogadorNome: "Jogador 2", posicaoGrupo: 2 },
      ];

      mockGet.mockResolvedValue({
        docs: estatisticas.map((e, i) => ({
          id: `estat-${i}`,
          data: () => e,
        })),
      });

      const result = await service.buscarClassificados(TEST_GRUPO_ID, 2);

      expect(result).toHaveLength(2);
      expect(result[0].posicaoGrupo).toBe(1);
    });
  });

  describe("atualizarGrupo", () => {
    it("deve atualizar o grupo do jogador", async () => {
      const estatisticaExistente = {
        id: "estatistica-123",
        jogadorId: TEST_JOGADOR_ID,
        etapaId: TEST_ETAPA_ID,
        grupoId: "grupo-antigo",
        grupoNome: "Grupo Antigo",
      };

      mockGet.mockResolvedValue({
        empty: false,
        docs: [{ id: estatisticaExistente.id, data: () => estatisticaExistente }],
      });
      mockUpdate.mockResolvedValue(undefined);

      await service.atualizarGrupo(
        TEST_JOGADOR_ID,
        TEST_ETAPA_ID,
        "grupo-novo",
        "Grupo Novo"
      );

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          grupoId: "grupo-novo",
          grupoNome: "Grupo Novo",
        })
      );
    });

    it("não deve atualizar se estatísticas não encontradas", async () => {
      mockGet.mockResolvedValue({ empty: true, docs: [] });

      await service.atualizarGrupo(
        TEST_JOGADOR_ID,
        TEST_ETAPA_ID,
        "grupo-novo",
        "Grupo Novo"
      );

      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });

  describe("atualizarPosicaoGrupo", () => {
    it("deve atualizar a posição no grupo", async () => {
      const estatisticaExistente = {
        id: "estatistica-123",
        jogadorId: TEST_JOGADOR_ID,
        etapaId: TEST_ETAPA_ID,
      };

      mockGet.mockResolvedValue({
        empty: false,
        docs: [{ id: estatisticaExistente.id, data: () => estatisticaExistente }],
      });
      mockUpdate.mockResolvedValue(undefined);

      await service.atualizarPosicaoGrupo(TEST_JOGADOR_ID, TEST_ETAPA_ID, 1);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          posicaoGrupo: 1,
        })
      );
    });
  });

  describe("marcarComoClassificado", () => {
    it("deve marcar jogador como classificado", async () => {
      const estatisticaExistente = {
        id: "estatistica-123",
        jogadorId: TEST_JOGADOR_ID,
        etapaId: TEST_ETAPA_ID,
        classificado: false,
      };

      mockGet.mockResolvedValue({
        empty: false,
        docs: [{ id: estatisticaExistente.id, data: () => estatisticaExistente }],
      });
      mockUpdate.mockResolvedValue(undefined);

      await service.marcarComoClassificado(TEST_JOGADOR_ID, TEST_ETAPA_ID, true);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          classificado: true,
        })
      );
    });

    it("deve desmarcar jogador como classificado", async () => {
      const estatisticaExistente = {
        id: "estatistica-123",
        jogadorId: TEST_JOGADOR_ID,
        etapaId: TEST_ETAPA_ID,
        classificado: true,
      };

      mockGet.mockResolvedValue({
        empty: false,
        docs: [{ id: estatisticaExistente.id, data: () => estatisticaExistente }],
      });
      mockUpdate.mockResolvedValue(undefined);

      await service.marcarComoClassificado(TEST_JOGADOR_ID, TEST_ETAPA_ID, false);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          classificado: false,
        })
      );
    });
  });

  describe("buscarHistoricoJogador", () => {
    it("deve retornar histórico do jogador em todas as etapas", async () => {
      const historico = [
        { jogadorId: TEST_JOGADOR_ID, etapaId: "etapa-1", jogos: 5 },
        { jogadorId: TEST_JOGADOR_ID, etapaId: "etapa-2", jogos: 4 },
        { jogadorId: TEST_JOGADOR_ID, etapaId: "etapa-3", jogos: 6 },
      ];

      mockGet.mockResolvedValue({
        docs: historico.map((e, i) => ({
          id: `estat-${i}`,
          data: () => e,
        })),
      });

      const result = await service.buscarHistoricoJogador(
        TEST_JOGADOR_ID,
        TEST_ARENA_ID
      );

      expect(result).toHaveLength(3);
    });
  });

  describe("buscarEstatisticasAgregadasPorNivel", () => {
    it("deve agregar estatísticas por nível específico", async () => {
      const estatisticas = [
        {
          etapaId: "etapa-1",
          jogadorId: TEST_JOGADOR_ID,
          jogadorNome: "João",
          jogadorNivel: NivelJogador.INTERMEDIARIO,
          jogadorGenero: GeneroJogador.MASCULINO,
          jogos: 3,
          vitorias: 2,
          derrotas: 1,
          pontos: 6,
          setsVencidos: 5,
          setsPerdidos: 2,
          gamesVencidos: 30,
          gamesPerdidos: 18,
        },
        {
          etapaId: "etapa-2",
          jogadorId: TEST_JOGADOR_ID,
          jogadorNome: "João",
          jogadorNivel: NivelJogador.INTERMEDIARIO,
          jogadorGenero: GeneroJogador.MASCULINO,
          jogos: 4,
          vitorias: 3,
          derrotas: 1,
          pontos: 9,
          setsVencidos: 7,
          setsPerdidos: 3,
          gamesVencidos: 40,
          gamesPerdidos: 25,
        },
      ];

      // Mock para buscarEtapasQueContamPontos
      mockGet
        .mockResolvedValueOnce({
          docs: [
            { id: "etapa-1", data: () => ({ contaPontosRanking: true }) },
            { id: "etapa-2", data: () => ({ contaPontosRanking: true }) },
          ],
        })
        .mockResolvedValueOnce({
          docs: [],
        })
        // Mock para buscarEstatisticasAgregadasPorNivel
        .mockResolvedValueOnce({
          empty: false,
          docs: estatisticas.map((e, i) => ({
            id: `estat-${i}`,
            data: () => e,
          })),
        })
        // Mock para buscarRankingPorNivel - etapas query
        .mockResolvedValueOnce({
          docs: [
            { id: "etapa-1", data: () => ({ contaPontosRanking: true }) },
            { id: "etapa-2", data: () => ({ contaPontosRanking: true }) },
          ],
        })
        .mockResolvedValueOnce({
          docs: [],
        })
        // Mock para buscarRankingPorNivel - estatísticas query
        .mockResolvedValueOnce({
          docs: estatisticas.map((e, i) => ({
            id: `estat-${i}`,
            data: () => e,
          })),
        });

      const result = await service.buscarEstatisticasAgregadasPorNivel(
        TEST_JOGADOR_ID,
        TEST_ARENA_ID,
        NivelJogador.INTERMEDIARIO
      );

      expect(result).not.toBeNull();
      expect(result.jogadorNome).toBe("João");
      expect(result.etapasParticipadas).toBe(2);
      expect(result.jogos).toBe(7);
      expect(result.vitorias).toBe(5);
      expect(result.pontos).toBe(15);
    });

    it("deve retornar null se não houver estatísticas", async () => {
      mockGet.mockResolvedValue({ empty: true, docs: [] });

      const result = await service.buscarEstatisticasAgregadasPorNivel(
        "jogador-inexistente",
        TEST_ARENA_ID,
        NivelJogador.AVANCADO
      );

      expect(result).toBeNull();
    });
  });

  describe("buscarRankingPorNivel", () => {
    it("deve retornar ranking ordenado por pontos", async () => {
      const estatisticas = [
        {
          etapaId: "etapa-1",
          jogadorId: "j1",
          jogadorNome: "Jogador 1",
          jogadorNivel: NivelJogador.AVANCADO,
          jogos: 5,
          vitorias: 4,
          derrotas: 1,
          pontos: 12,
          setsVencidos: 8,
          setsPerdidos: 3,
          gamesVencidos: 50,
          gamesPerdidos: 30,
          saldoSets: 5,
          saldoGames: 20,
        },
        {
          etapaId: "etapa-1",
          jogadorId: "j2",
          jogadorNome: "Jogador 2",
          jogadorNivel: NivelJogador.AVANCADO,
          jogos: 5,
          vitorias: 3,
          derrotas: 2,
          pontos: 9,
          setsVencidos: 7,
          setsPerdidos: 4,
          gamesVencidos: 45,
          gamesPerdidos: 35,
          saldoSets: 3,
          saldoGames: 10,
        },
        {
          etapaId: "etapa-1",
          jogadorId: "j3",
          jogadorNome: "Jogador 3",
          jogadorNivel: NivelJogador.AVANCADO,
          jogos: 5,
          vitorias: 5,
          derrotas: 0,
          pontos: 15,
          setsVencidos: 10,
          setsPerdidos: 1,
          gamesVencidos: 60,
          gamesPerdidos: 20,
          saldoSets: 9,
          saldoGames: 40,
        },
      ];

      // Mock para buscarEtapasQueContamPontos - primeira chamada para contaPontosRanking
      // segunda chamada para etapas sem o campo
      mockGet
        .mockResolvedValueOnce({
          docs: [{ id: "etapa-1", data: () => ({ contaPontosRanking: true }) }],
        }) // etapas com contaPontosRanking = true
        .mockResolvedValueOnce({
          docs: [],
        }) // etapas sem o campo
        .mockResolvedValueOnce({
          docs: estatisticas.map((e, i) => ({
            id: `estat-${i}`,
            data: () => e,
          })),
        }); // estatísticas

      const result = await service.buscarRankingPorNivel(
        TEST_ARENA_ID,
        NivelJogador.AVANCADO,
        10
      );

      expect(result).toHaveLength(3);
      // Deve estar ordenado por pontos desc
      expect(result[0].jogadorNome).toBe("Jogador 3"); // 15 pontos
      expect(result[1].jogadorNome).toBe("Jogador 1"); // 12 pontos
      expect(result[2].jogadorNome).toBe("Jogador 2"); // 9 pontos
    });

    it("deve agregar estatísticas de múltiplas etapas por jogador", async () => {
      const estatisticas = [
        {
          etapaId: "etapa-1",
          jogadorId: "j1",
          jogadorNome: "Jogador 1",
          jogadorNivel: NivelJogador.INICIANTE,
          jogos: 3,
          vitorias: 2,
          derrotas: 1,
          pontos: 6,
          setsVencidos: 5,
          setsPerdidos: 2,
          gamesVencidos: 30,
          gamesPerdidos: 18,
          saldoSets: 3,
          saldoGames: 12,
        },
        {
          etapaId: "etapa-2",
          jogadorId: "j1", // Mesmo jogador, outra etapa
          jogadorNome: "Jogador 1",
          jogadorNivel: NivelJogador.INICIANTE,
          jogos: 4,
          vitorias: 3,
          derrotas: 1,
          pontos: 9,
          setsVencidos: 7,
          setsPerdidos: 3,
          gamesVencidos: 40,
          gamesPerdidos: 25,
          saldoSets: 4,
          saldoGames: 15,
        },
      ];

      mockGet
        .mockResolvedValueOnce({
          docs: [
            { id: "etapa-1", data: () => ({ contaPontosRanking: true }) },
            { id: "etapa-2", data: () => ({ contaPontosRanking: true }) },
          ],
        })
        .mockResolvedValueOnce({ docs: [] })
        .mockResolvedValueOnce({
          docs: estatisticas.map((e, i) => ({
            id: `estat-${i}`,
            data: () => e,
          })),
        });

      const result = await service.buscarRankingPorNivel(
        TEST_ARENA_ID,
        NivelJogador.INICIANTE,
        10
      );

      expect(result).toHaveLength(1); // Apenas 1 jogador agregado
      expect(result[0].jogadorNome).toBe("Jogador 1");
      expect(result[0].etapasParticipadas).toBe(2);
      expect(result[0].jogos).toBe(7);
      expect(result[0].vitorias).toBe(5);
      expect(result[0].pontos).toBe(15);
    });

    it("deve respeitar o limite de resultados", async () => {
      const estatisticas = Array.from({ length: 20 }, (_, i) => ({
        etapaId: "etapa-1",
        jogadorId: `j${i}`,
        jogadorNome: `Jogador ${i}`,
        jogadorNivel: NivelJogador.INTERMEDIARIO,
        jogos: 5,
        vitorias: 5 - (i % 5),
        derrotas: i % 5,
        pontos: (5 - (i % 5)) * 3,
        setsVencidos: 10,
        setsPerdidos: 5,
        gamesVencidos: 50,
        gamesPerdidos: 30,
        saldoSets: 5,
        saldoGames: 20,
      }));

      mockGet
        .mockResolvedValueOnce({
          docs: [{ id: "etapa-1", data: () => ({ contaPontosRanking: true }) }],
        })
        .mockResolvedValueOnce({ docs: [] })
        .mockResolvedValueOnce({
          docs: estatisticas.map((e, i) => ({
            id: `estat-${i}`,
            data: () => e,
          })),
        });

      const result = await service.buscarRankingPorNivel(
        TEST_ARENA_ID,
        NivelJogador.INTERMEDIARIO,
        5
      );

      expect(result).toHaveLength(5);
    });
  });

  describe("buscarRankingGlobalAgregado", () => {
    it("deve retornar ranking global de todos os níveis", async () => {
      const estatisticas = [
        {
          jogadorId: "j1",
          jogadorNome: "Jogador 1",
          jogadorNivel: NivelJogador.INICIANTE,
          pontos: 10,
          setsVencidos: 5,
          setsPerdidos: 2,
          gamesVencidos: 30,
          gamesPerdidos: 18,
          saldoSets: 3,
          saldoGames: 12,
          jogos: 3,
          vitorias: 2,
          derrotas: 1,
        },
        {
          jogadorId: "j2",
          jogadorNome: "Jogador 2",
          jogadorNivel: NivelJogador.AVANCADO,
          pontos: 15,
          setsVencidos: 8,
          setsPerdidos: 3,
          gamesVencidos: 45,
          gamesPerdidos: 25,
          saldoSets: 5,
          saldoGames: 20,
          jogos: 5,
          vitorias: 4,
          derrotas: 1,
        },
      ];

      mockGet.mockResolvedValue({
        docs: estatisticas.map((e, i) => ({
          id: `estat-${i}`,
          data: () => e,
        })),
      });

      const result = await service.buscarRankingGlobalAgregado(TEST_ARENA_ID, 10);

      expect(result).toHaveLength(2);
      expect(result[0].jogadorNome).toBe("Jogador 2"); // Mais pontos
      expect(result[1].jogadorNome).toBe("Jogador 1");
    });

    it("deve ordenar por critérios de desempate", async () => {
      const estatisticas = [
        {
          jogadorId: "j1",
          jogadorNome: "Jogador 1",
          jogadorNivel: NivelJogador.INICIANTE,
          pontos: 10,
          setsVencidos: 5,
          setsPerdidos: 2,
          gamesVencidos: 30,
          gamesPerdidos: 18,
          saldoSets: 3,
          saldoGames: 12, // Menor saldo
          jogos: 3,
          vitorias: 2,
          derrotas: 1,
        },
        {
          jogadorId: "j2",
          jogadorNome: "Jogador 2",
          jogadorNivel: NivelJogador.AVANCADO,
          pontos: 10, // Mesmo pontos
          setsVencidos: 8,
          setsPerdidos: 3,
          gamesVencidos: 45,
          gamesPerdidos: 25,
          saldoSets: 5,
          saldoGames: 20, // Maior saldo
          jogos: 5,
          vitorias: 4,
          derrotas: 1,
        },
      ];

      mockGet.mockResolvedValue({
        docs: estatisticas.map((e, i) => ({
          id: `estat-${i}`,
          data: () => e,
        })),
      });

      const result = await service.buscarRankingGlobalAgregado(TEST_ARENA_ID, 10);

      expect(result).toHaveLength(2);
      // Mesmo pontos, ordenar por saldoGames
      expect(result[0].jogadorNome).toBe("Jogador 2"); // Maior saldo games
      expect(result[1].jogadorNome).toBe("Jogador 1");
    });
  });

  describe("atualizarAposPartida - erros", () => {
    it("deve propagar erro em caso de falha", async () => {
      const estatisticaExistente = {
        id: "estatistica-123",
        jogadorId: TEST_JOGADOR_ID,
        etapaId: TEST_ETAPA_ID,
        jogos: 2,
        vitorias: 1,
        derrotas: 1,
        pontos: 3,
        setsVencidos: 3,
        setsPerdidos: 2,
        gamesVencidos: 15,
        gamesPerdidos: 12,
        saldoSets: 1,
        saldoGames: 3,
      };

      mockGet.mockResolvedValue({
        empty: false,
        docs: [{ id: estatisticaExistente.id, data: () => estatisticaExistente }],
      });
      mockUpdate.mockRejectedValue(new Error("Erro de conexão"));

      const dto = {
        venceu: true,
        setsVencidos: 2,
        setsPerdidos: 0,
        gamesVencidos: 12,
        gamesPerdidos: 6,
      };

      await expect(
        service.atualizarAposPartida(TEST_JOGADOR_ID, TEST_ETAPA_ID, dto)
      ).rejects.toThrow("Erro de conexão");
    });
  });

  describe("reverterAposPartida - erros", () => {
    it("deve propagar erro em caso de falha", async () => {
      const estatisticaExistente = {
        id: "estatistica-123",
        jogadorId: TEST_JOGADOR_ID,
        etapaId: TEST_ETAPA_ID,
        jogos: 3,
        vitorias: 2,
        derrotas: 1,
        pontos: 6,
        setsVencidos: 5,
        setsPerdidos: 2,
        gamesVencidos: 27,
        gamesPerdidos: 18,
        saldoSets: 3,
        saldoGames: 9,
      };

      mockGet.mockResolvedValue({
        empty: false,
        docs: [{ id: estatisticaExistente.id, data: () => estatisticaExistente }],
      });
      mockUpdate.mockRejectedValue(new Error("Erro de conexão"));

      const dto = {
        venceu: true,
        setsVencidos: 2,
        setsPerdidos: 0,
        gamesVencidos: 12,
        gamesPerdidos: 6,
      };

      await expect(
        service.reverterAposPartida(TEST_JOGADOR_ID, TEST_ETAPA_ID, dto)
      ).rejects.toThrow("Erro de conexão");
    });
  });

  describe("atualizarAposPartidaGrupo - cenários adicionais", () => {
    it("não deve atualizar se estatísticas não encontradas", async () => {
      mockGet.mockResolvedValue({ empty: true, docs: [] });

      const dto = {
        venceu: true,
        setsVencidos: 2,
        setsPerdidos: 0,
        gamesVencidos: 12,
        gamesPerdidos: 6,
      };

      await service.atualizarAposPartidaGrupo(TEST_JOGADOR_ID, TEST_ETAPA_ID, dto);

      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it("deve propagar erro em caso de falha", async () => {
      const estatisticaExistente = {
        id: "estatistica-123",
        jogadorId: TEST_JOGADOR_ID,
        etapaId: TEST_ETAPA_ID,
        grupoId: TEST_GRUPO_ID,
        jogosGrupo: 1,
        vitoriasGrupo: 1,
        derrotasGrupo: 0,
        pontosGrupo: 3,
        setsVencidosGrupo: 2,
        setsPerdidosGrupo: 0,
        saldoSetsGrupo: 2,
        gamesVencidosGrupo: 12,
        gamesPerdidosGrupo: 6,
        saldoGamesGrupo: 6,
        jogos: 1,
        vitorias: 1,
        derrotas: 0,
        setsVencidos: 2,
        setsPerdidos: 0,
        saldoSets: 2,
        gamesVencidos: 12,
        gamesPerdidos: 6,
        saldoGames: 6,
      };

      mockGet.mockResolvedValue({
        empty: false,
        docs: [{ id: estatisticaExistente.id, data: () => estatisticaExistente }],
      });
      mockUpdate.mockRejectedValue(new Error("Erro de conexão"));

      const dto = {
        venceu: true,
        setsVencidos: 2,
        setsPerdidos: 1,
        gamesVencidos: 13,
        gamesPerdidos: 10,
      };

      await expect(
        service.atualizarAposPartidaGrupo(TEST_JOGADOR_ID, TEST_ETAPA_ID, dto)
      ).rejects.toThrow("Erro de conexão");
    });
  });

  describe("reverterAposPartidaGrupo - cenários adicionais", () => {
    it("não deve reverter se estatísticas não encontradas", async () => {
      mockGet.mockResolvedValue({ empty: true, docs: [] });

      const dto = {
        venceu: true,
        setsVencidos: 2,
        setsPerdidos: 1,
        gamesVencidos: 12,
        gamesPerdidos: 8,
      };

      await service.reverterAposPartidaGrupo(TEST_JOGADOR_ID, TEST_ETAPA_ID, dto);

      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it("deve propagar erro em caso de falha", async () => {
      const estatisticaExistente = {
        id: "estatistica-123",
        jogadorId: TEST_JOGADOR_ID,
        etapaId: TEST_ETAPA_ID,
        jogosGrupo: 1,
        vitoriasGrupo: 1,
        derrotasGrupo: 0,
        pontosGrupo: 3,
        setsVencidosGrupo: 2,
        setsPerdidosGrupo: 1,
        saldoSetsGrupo: 1,
        gamesVencidosGrupo: 12,
        gamesPerdidosGrupo: 8,
        saldoGamesGrupo: 4,
        jogos: 1,
        vitorias: 1,
        derrotas: 0,
        setsVencidos: 2,
        setsPerdidos: 1,
        saldoSets: 1,
        gamesVencidos: 12,
        gamesPerdidos: 8,
        saldoGames: 4,
      };

      mockGet.mockResolvedValue({
        empty: false,
        docs: [{ id: estatisticaExistente.id, data: () => estatisticaExistente }],
      });
      mockUpdate.mockRejectedValue(new Error("Erro de conexão"));

      const dto = {
        venceu: true,
        setsVencidos: 2,
        setsPerdidos: 1,
        gamesVencidos: 12,
        gamesPerdidos: 8,
      };

      await expect(
        service.reverterAposPartidaGrupo(TEST_JOGADOR_ID, TEST_ETAPA_ID, dto)
      ).rejects.toThrow("Erro de conexão");
    });
  });

  describe("atualizarAposPartidaEliminatoria - cenários adicionais", () => {
    it("não deve atualizar se estatísticas não encontradas", async () => {
      mockGet.mockResolvedValue({ empty: true, docs: [] });

      const dto = {
        venceu: true,
        setsVencidos: 2,
        setsPerdidos: 0,
        gamesVencidos: 12,
        gamesPerdidos: 4,
      };

      await service.atualizarAposPartidaEliminatoria(
        TEST_JOGADOR_ID,
        TEST_ETAPA_ID,
        dto
      );

      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it("deve propagar erro em caso de falha", async () => {
      const estatisticaExistente = {
        id: "estatistica-123",
        jogadorId: TEST_JOGADOR_ID,
        etapaId: TEST_ETAPA_ID,
        jogos: 3,
        vitorias: 2,
        derrotas: 1,
        setsVencidos: 5,
        setsPerdidos: 3,
        saldoSets: 2,
        gamesVencidos: 30,
        gamesPerdidos: 22,
        saldoGames: 8,
      };

      mockGet.mockResolvedValue({
        empty: false,
        docs: [{ id: estatisticaExistente.id, data: () => estatisticaExistente }],
      });
      mockUpdate.mockRejectedValue(new Error("Erro de conexão"));

      const dto = {
        venceu: true,
        setsVencidos: 2,
        setsPerdidos: 0,
        gamesVencidos: 12,
        gamesPerdidos: 4,
      };

      await expect(
        service.atualizarAposPartidaEliminatoria(
          TEST_JOGADOR_ID,
          TEST_ETAPA_ID,
          dto
        )
      ).rejects.toThrow("Erro de conexão");
    });
  });

  describe("reverterAposPartidaEliminatoria - cenários adicionais", () => {
    it("não deve reverter se estatísticas não encontradas", async () => {
      mockGet.mockResolvedValue({ empty: true, docs: [] });

      const dto = {
        venceu: true,
        setsVencidos: 2,
        setsPerdidos: 0,
        gamesVencidos: 12,
        gamesPerdidos: 4,
      };

      await service.reverterAposPartidaEliminatoria(
        TEST_JOGADOR_ID,
        TEST_ETAPA_ID,
        dto
      );

      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it("deve propagar erro em caso de falha", async () => {
      const estatisticaExistente = {
        id: "estatistica-123",
        jogadorId: TEST_JOGADOR_ID,
        etapaId: TEST_ETAPA_ID,
        jogos: 4,
        vitorias: 3,
        derrotas: 1,
        setsVencidos: 7,
        setsPerdidos: 3,
        saldoSets: 4,
        gamesVencidos: 42,
        gamesPerdidos: 26,
        saldoGames: 16,
      };

      mockGet.mockResolvedValue({
        empty: false,
        docs: [{ id: estatisticaExistente.id, data: () => estatisticaExistente }],
      });
      mockUpdate.mockRejectedValue(new Error("Erro de conexão"));

      const dto = {
        venceu: true,
        setsVencidos: 2,
        setsPerdidos: 0,
        gamesVencidos: 12,
        gamesPerdidos: 4,
      };

      await expect(
        service.reverterAposPartidaEliminatoria(
          TEST_JOGADOR_ID,
          TEST_ETAPA_ID,
          dto
        )
      ).rejects.toThrow("Erro de conexão");
    });
  });

  describe("atualizarGrupo - erros", () => {
    it("deve propagar erro em caso de falha", async () => {
      const estatisticaExistente = {
        id: "estatistica-123",
        jogadorId: TEST_JOGADOR_ID,
        etapaId: TEST_ETAPA_ID,
        grupoId: "grupo-antigo",
        grupoNome: "Grupo Antigo",
      };

      mockGet.mockResolvedValue({
        empty: false,
        docs: [{ id: estatisticaExistente.id, data: () => estatisticaExistente }],
      });
      mockUpdate.mockRejectedValue(new Error("Erro de conexão"));

      await expect(
        service.atualizarGrupo(
          TEST_JOGADOR_ID,
          TEST_ETAPA_ID,
          "grupo-novo",
          "Grupo Novo"
        )
      ).rejects.toThrow("Erro de conexão");
    });
  });

  describe("atualizarPosicaoGrupo - cenários adicionais", () => {
    it("não deve atualizar se estatísticas não encontradas", async () => {
      mockGet.mockResolvedValue({ empty: true, docs: [] });

      await service.atualizarPosicaoGrupo(TEST_JOGADOR_ID, TEST_ETAPA_ID, 1);

      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it("deve propagar erro em caso de falha", async () => {
      const estatisticaExistente = {
        id: "estatistica-123",
        jogadorId: TEST_JOGADOR_ID,
        etapaId: TEST_ETAPA_ID,
      };

      mockGet.mockResolvedValue({
        empty: false,
        docs: [{ id: estatisticaExistente.id, data: () => estatisticaExistente }],
      });
      mockUpdate.mockRejectedValue(new Error("Erro de conexão"));

      await expect(
        service.atualizarPosicaoGrupo(TEST_JOGADOR_ID, TEST_ETAPA_ID, 1)
      ).rejects.toThrow("Erro de conexão");
    });
  });

  describe("marcarComoClassificado - cenários adicionais", () => {
    it("não deve atualizar se estatísticas não encontradas", async () => {
      mockGet.mockResolvedValue({ empty: true, docs: [] });

      await service.marcarComoClassificado(TEST_JOGADOR_ID, TEST_ETAPA_ID, true);

      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it("deve propagar erro em caso de falha", async () => {
      const estatisticaExistente = {
        id: "estatistica-123",
        jogadorId: TEST_JOGADOR_ID,
        etapaId: TEST_ETAPA_ID,
        classificado: false,
      };

      mockGet.mockResolvedValue({
        empty: false,
        docs: [{ id: estatisticaExistente.id, data: () => estatisticaExistente }],
      });
      mockUpdate.mockRejectedValue(new Error("Erro de conexão"));

      await expect(
        service.marcarComoClassificado(TEST_JOGADOR_ID, TEST_ETAPA_ID, true)
      ).rejects.toThrow("Erro de conexão");
    });
  });

  describe("buscarEstatisticasAgregadas (deprecated)", () => {
    it("deve agregar estatísticas de todas as etapas", async () => {
      const estatisticas = [
        {
          jogadorId: TEST_JOGADOR_ID,
          jogadorNome: "João",
          jogadorNivel: NivelJogador.INICIANTE,
          jogadorGenero: GeneroJogador.MASCULINO,
          jogos: 3,
          vitorias: 2,
          derrotas: 1,
          pontos: 6,
          setsVencidos: 5,
          setsPerdidos: 2,
          gamesVencidos: 30,
          gamesPerdidos: 18,
        },
        {
          jogadorId: TEST_JOGADOR_ID,
          jogadorNome: "João",
          jogadorNivel: NivelJogador.INTERMEDIARIO, // Mudou de nível
          jogadorGenero: GeneroJogador.MASCULINO,
          jogos: 4,
          vitorias: 3,
          derrotas: 1,
          pontos: 9,
          setsVencidos: 7,
          setsPerdidos: 3,
          gamesVencidos: 40,
          gamesPerdidos: 25,
        },
      ];

      // Mock para buscarEstatisticasAgregadas
      mockGet.mockResolvedValueOnce({
        empty: false,
        docs: estatisticas.map((e, i) => ({
          id: `estat-${i}`,
          data: () => e,
        })),
      });

      // Mock para buscarRankingGlobalAgregado (chamado internamente)
      mockGet.mockResolvedValueOnce({
        docs: [
          {
            id: "estat-1",
            data: () => ({
              jogadorId: TEST_JOGADOR_ID,
              jogadorNome: "João",
              pontos: 15,
              saldoGames: 27,
              gamesVencidos: 70,
              vitorias: 5,
              jogos: 7,
              derrotas: 2,
              setsVencidos: 12,
              setsPerdidos: 5,
            }),
          },
        ],
      });

      const result = await service.buscarEstatisticasAgregadas(
        TEST_JOGADOR_ID,
        TEST_ARENA_ID
      );

      expect(result).not.toBeNull();
      expect(result.jogadorNome).toBe("João");
      expect(result.etapasParticipadas).toBe(2);
      expect(result.jogos).toBe(7);
      expect(result.vitorias).toBe(5);
      expect(result.pontos).toBe(15);
    });

    it("deve retornar null se não houver estatísticas", async () => {
      mockGet.mockResolvedValue({ empty: true, docs: [] });

      const result = await service.buscarEstatisticasAgregadas(
        "jogador-inexistente",
        TEST_ARENA_ID
      );

      expect(result).toBeNull();
    });
  });

  describe("buscarRankingPorNivel - desempates", () => {
    it("deve desempatar por games vencidos quando saldo de games igual", async () => {
      const estatisticas = [
        {
          etapaId: "etapa-1",
          jogadorId: "j1",
          jogadorNome: "Jogador 1",
          jogadorNivel: NivelJogador.AVANCADO,
          pontos: 10,
          saldoGames: 20,
          gamesVencidos: 50, // Menor
          vitorias: 4,
          jogos: 5,
          derrotas: 1,
          setsVencidos: 8,
          setsPerdidos: 3,
          saldoSets: 5,
          gamesPerdidos: 30,
        },
        {
          etapaId: "etapa-1",
          jogadorId: "j2",
          jogadorNome: "Jogador 2",
          jogadorNivel: NivelJogador.AVANCADO,
          pontos: 10, // Mesmo
          saldoGames: 20, // Mesmo
          gamesVencidos: 60, // Maior
          vitorias: 4,
          jogos: 5,
          derrotas: 1,
          setsVencidos: 8,
          setsPerdidos: 3,
          saldoSets: 5,
          gamesPerdidos: 40,
        },
      ];

      // Mock para buscarEtapasQueContamPontos
      mockGet
        .mockResolvedValueOnce({
          docs: [{ id: "etapa-1", data: () => ({ contaPontosRanking: true }) }],
        })
        .mockResolvedValueOnce({
          docs: [],
        })
        .mockResolvedValueOnce({
          docs: estatisticas.map((e, i) => ({
            id: `estat-${i}`,
            data: () => e,
          })),
        });

      const result = await service.buscarRankingPorNivel(
        TEST_ARENA_ID,
        NivelJogador.AVANCADO,
        10
      );

      expect(result).toHaveLength(2);
      expect(result[0].jogadorNome).toBe("Jogador 2"); // Mais games vencidos
      expect(result[1].jogadorNome).toBe("Jogador 1");
    });

    it("deve desempatar por vitórias quando games vencidos igual", async () => {
      const estatisticas = [
        {
          etapaId: "etapa-1",
          jogadorId: "j1",
          jogadorNome: "Jogador 1",
          jogadorNivel: NivelJogador.AVANCADO,
          pontos: 10,
          saldoGames: 20,
          gamesVencidos: 50,
          vitorias: 3, // Menor
          jogos: 5,
          derrotas: 2,
          setsVencidos: 8,
          setsPerdidos: 3,
          saldoSets: 5,
          gamesPerdidos: 30,
        },
        {
          etapaId: "etapa-1",
          jogadorId: "j2",
          jogadorNome: "Jogador 2",
          jogadorNivel: NivelJogador.AVANCADO,
          pontos: 10, // Mesmo
          saldoGames: 20, // Mesmo
          gamesVencidos: 50, // Mesmo
          vitorias: 4, // Maior
          jogos: 5,
          derrotas: 1,
          setsVencidos: 8,
          setsPerdidos: 3,
          saldoSets: 5,
          gamesPerdidos: 30,
        },
      ];

      // Mock para buscarEtapasQueContamPontos
      mockGet
        .mockResolvedValueOnce({
          docs: [{ id: "etapa-1", data: () => ({ contaPontosRanking: true }) }],
        })
        .mockResolvedValueOnce({
          docs: [],
        })
        .mockResolvedValueOnce({
          docs: estatisticas.map((e, i) => ({
            id: `estat-${i}`,
            data: () => e,
          })),
        });

      const result = await service.buscarRankingPorNivel(
        TEST_ARENA_ID,
        NivelJogador.AVANCADO,
        10
      );

      expect(result).toHaveLength(2);
      expect(result[0].jogadorNome).toBe("Jogador 2"); // Mais vitórias
      expect(result[1].jogadorNome).toBe("Jogador 1");
    });
  });

  describe("criarEmLote", () => {
    it("deve criar múltiplas estatísticas em lote", async () => {
      const dtos = [
        {
          etapaId: TEST_ETAPA_ID,
          arenaId: TEST_ARENA_ID,
          jogadorId: "j1",
          jogadorNome: "Jogador 1",
          jogadorNivel: NivelJogador.INTERMEDIARIO,
          jogadorGenero: GeneroJogador.MASCULINO,
          grupoId: TEST_GRUPO_ID,
          grupoNome: "Grupo A",
        },
        {
          etapaId: TEST_ETAPA_ID,
          arenaId: TEST_ARENA_ID,
          jogadorId: "j2",
          jogadorNome: "Jogador 2",
          jogadorNivel: NivelJogador.INTERMEDIARIO,
          jogadorGenero: GeneroJogador.FEMININO,
          grupoId: TEST_GRUPO_ID,
          grupoNome: "Grupo A",
        },
      ];

      const result = await service.criarEmLote(dtos);

      expect(result).toHaveLength(2);
      expect(mockBatchSet).toHaveBeenCalledTimes(2);
      expect(mockBatchCommit).toHaveBeenCalled();
      expect(result[0].jogadorNome).toBe("Jogador 1");
      expect(result[1].jogadorNome).toBe("Jogador 2");
      expect(result[0].jogos).toBe(0);
      expect(result[0].vitorias).toBe(0);
    });

    it("deve propagar erro ao criar em lote", async () => {
      mockBatchCommit.mockRejectedValue(new Error("Erro de batch"));

      const dtos = [
        {
          etapaId: TEST_ETAPA_ID,
          arenaId: TEST_ARENA_ID,
          jogadorId: "j1",
          jogadorNome: "Jogador 1",
          jogadorNivel: NivelJogador.INICIANTE,
          jogadorGenero: GeneroJogador.MASCULINO,
          grupoId: TEST_GRUPO_ID,
          grupoNome: "Grupo A",
        },
      ];

      await expect(service.criarEmLote(dtos)).rejects.toThrow("Erro de batch");
    });
  });

  describe("buscarPorJogadoresEtapa", () => {
    it("deve retornar Map vazio para lista vazia de jogadores", async () => {
      const result = await service.buscarPorJogadoresEtapa([], TEST_ETAPA_ID);
      expect(result.size).toBe(0);
    });

    it("deve retornar Map com estatísticas por jogadorId", async () => {
      const estatisticas = [
        { jogadorId: "j1", jogadorNome: "Jogador 1", jogos: 3 },
        { jogadorId: "j2", jogadorNome: "Jogador 2", jogos: 4 },
      ];

      mockGet.mockResolvedValue({
        docs: estatisticas.map((e, i) => ({
          id: `estat-${i}`,
          data: () => e,
        })),
      });

      const result = await service.buscarPorJogadoresEtapa(["j1", "j2"], TEST_ETAPA_ID);

      expect(result.size).toBe(2);
      expect(result.get("j1")?.jogadorNome).toBe("Jogador 1");
      expect(result.get("j2")?.jogadorNome).toBe("Jogador 2");
    });
  });

  describe("atualizarGrupoEmLotePorId", () => {
    it("deve atualizar grupos em lote por ID", async () => {
      const atualizacoes = [
        { estatisticaId: "est-1", grupoId: "grupo-novo-1", grupoNome: "Grupo 1" },
        { estatisticaId: "est-2", grupoId: "grupo-novo-2", grupoNome: "Grupo 2" },
      ];

      await service.atualizarGrupoEmLotePorId(atualizacoes);

      expect(mockBatchUpdate).toHaveBeenCalledTimes(2);
      expect(mockBatchCommit).toHaveBeenCalled();
    });

    it("deve retornar imediatamente para lista vazia", async () => {
      await service.atualizarGrupoEmLotePorId([]);
      expect(mockBatchUpdate).not.toHaveBeenCalled();
    });

    it("deve propagar erro ao atualizar grupos em lote", async () => {
      mockBatchCommit.mockRejectedValue(new Error("Erro de batch"));

      const atualizacoes = [
        { estatisticaId: "est-1", grupoId: "grupo-novo", grupoNome: "Grupo Novo" },
      ];

      await expect(service.atualizarGrupoEmLotePorId(atualizacoes)).rejects.toThrow("Erro de batch");
    });
  });

  describe("atualizarGrupoEmLote", () => {
    it("deve atualizar grupos em lote buscando por jogadorId", async () => {
      const estatistica1 = { id: "est-1", jogadorId: "j1", etapaId: TEST_ETAPA_ID };
      const estatistica2 = { id: "est-2", jogadorId: "j2", etapaId: TEST_ETAPA_ID };

      mockGet
        .mockResolvedValueOnce({
          empty: false,
          docs: [{ id: estatistica1.id, data: () => estatistica1 }],
        })
        .mockResolvedValueOnce({
          empty: false,
          docs: [{ id: estatistica2.id, data: () => estatistica2 }],
        });

      const atualizacoes = [
        { jogadorId: "j1", etapaId: TEST_ETAPA_ID, grupoId: "g1", grupoNome: "Grupo 1" },
        { jogadorId: "j2", etapaId: TEST_ETAPA_ID, grupoId: "g2", grupoNome: "Grupo 2" },
      ];

      await service.atualizarGrupoEmLote(atualizacoes);

      expect(mockBatchUpdate).toHaveBeenCalledTimes(2);
      expect(mockBatchCommit).toHaveBeenCalled();
    });

    it("deve retornar imediatamente para lista vazia", async () => {
      await service.atualizarGrupoEmLote([]);
      expect(mockBatchUpdate).not.toHaveBeenCalled();
    });

    it("deve pular jogadores sem estatísticas", async () => {
      mockGet.mockResolvedValue({ empty: true, docs: [] });

      const atualizacoes = [
        { jogadorId: "j-inexistente", etapaId: TEST_ETAPA_ID, grupoId: "g1", grupoNome: "Grupo 1" },
      ];

      await service.atualizarGrupoEmLote(atualizacoes);

      expect(mockBatchUpdate).not.toHaveBeenCalled();
    });

    it("deve propagar erro ao atualizar em lote", async () => {
      const estatistica = { id: "est-1", jogadorId: "j1", etapaId: TEST_ETAPA_ID };
      mockGet.mockResolvedValue({
        empty: false,
        docs: [{ id: estatistica.id, data: () => estatistica }],
      });
      mockBatchCommit.mockRejectedValue(new Error("Erro de batch"));

      const atualizacoes = [
        { jogadorId: "j1", etapaId: TEST_ETAPA_ID, grupoId: "g1", grupoNome: "Grupo 1" },
      ];

      await expect(service.atualizarGrupoEmLote(atualizacoes)).rejects.toThrow("Erro de batch");
    });
  });

  describe("atualizarAposPartidaGrupoEmLote", () => {
    it("deve atualizar estatísticas de grupo em lote", async () => {
      const estatistica1 = {
        id: "est-1",
        jogadorId: "j1",
        etapaId: TEST_ETAPA_ID,
        jogosGrupo: 0,
        vitoriasGrupo: 0,
        derrotasGrupo: 0,
        pontosGrupo: 0,
        setsVencidosGrupo: 0,
        setsPerdidosGrupo: 0,
        saldoSetsGrupo: 0,
        gamesVencidosGrupo: 0,
        gamesPerdidosGrupo: 0,
        saldoGamesGrupo: 0,
        jogos: 0,
        vitorias: 0,
        derrotas: 0,
        setsVencidos: 0,
        setsPerdidos: 0,
        saldoSets: 0,
        gamesVencidos: 0,
        gamesPerdidos: 0,
        saldoGames: 0,
      };

      mockGet.mockResolvedValue({
        empty: false,
        docs: [{ id: estatistica1.id, data: () => estatistica1 }],
      });

      const atualizacoes = [
        {
          jogadorId: "j1",
          etapaId: TEST_ETAPA_ID,
          dto: { venceu: true, setsVencidos: 2, setsPerdidos: 0, gamesVencidos: 12, gamesPerdidos: 6 },
        },
      ];

      await service.atualizarAposPartidaGrupoEmLote(atualizacoes);

      expect(mockBatchUpdate).toHaveBeenCalled();
      expect(mockBatchCommit).toHaveBeenCalled();
    });

    it("deve retornar imediatamente para lista vazia", async () => {
      await service.atualizarAposPartidaGrupoEmLote([]);
      expect(mockBatchUpdate).not.toHaveBeenCalled();
    });

    it("deve propagar erro ao atualizar em lote", async () => {
      const estatistica = {
        id: "est-1",
        jogadorId: "j1",
        etapaId: TEST_ETAPA_ID,
        jogosGrupo: 0,
        vitoriasGrupo: 0,
        derrotasGrupo: 0,
        pontosGrupo: 0,
        setsVencidosGrupo: 0,
        setsPerdidosGrupo: 0,
        saldoSetsGrupo: 0,
        gamesVencidosGrupo: 0,
        gamesPerdidosGrupo: 0,
        saldoGamesGrupo: 0,
        jogos: 0,
        vitorias: 0,
        derrotas: 0,
        setsVencidos: 0,
        setsPerdidos: 0,
        saldoSets: 0,
        gamesVencidos: 0,
        gamesPerdidos: 0,
        saldoGames: 0,
      };

      mockGet.mockResolvedValue({
        empty: false,
        docs: [{ id: estatistica.id, data: () => estatistica }],
      });
      mockBatchCommit.mockRejectedValue(new Error("Erro de batch"));

      const atualizacoes = [
        {
          jogadorId: "j1",
          etapaId: TEST_ETAPA_ID,
          dto: { venceu: true, setsVencidos: 2, setsPerdidos: 0, gamesVencidos: 12, gamesPerdidos: 6 },
        },
      ];

      await expect(service.atualizarAposPartidaGrupoEmLote(atualizacoes)).rejects.toThrow("Erro de batch");
    });
  });

  describe("reverterAposPartidaEmLote", () => {
    it("deve reverter estatísticas em lote", async () => {
      const estatistica = {
        id: "est-1",
        jogadorId: "j1",
        etapaId: TEST_ETAPA_ID,
        jogosGrupo: 1,
        vitoriasGrupo: 1,
        derrotasGrupo: 0,
        pontosGrupo: 3,
        setsVencidosGrupo: 2,
        setsPerdidosGrupo: 0,
        saldoSetsGrupo: 2,
        gamesVencidosGrupo: 12,
        gamesPerdidosGrupo: 6,
        saldoGamesGrupo: 6,
        jogos: 1,
        vitorias: 1,
        derrotas: 0,
        setsVencidos: 2,
        setsPerdidos: 0,
        saldoSets: 2,
        gamesVencidos: 12,
        gamesPerdidos: 6,
        saldoGames: 6,
      };

      mockGet.mockResolvedValue({
        empty: false,
        docs: [{ id: estatistica.id, data: () => estatistica }],
      });

      const reversoes = [
        {
          jogadorId: "j1",
          etapaId: TEST_ETAPA_ID,
          dto: { venceu: true, setsVencidos: 2, setsPerdidos: 0, gamesVencidos: 12, gamesPerdidos: 6 },
        },
      ];

      await service.reverterAposPartidaEmLote(reversoes);

      expect(mockBatchUpdate).toHaveBeenCalled();
      expect(mockBatchCommit).toHaveBeenCalled();
    });

    it("deve retornar imediatamente para lista vazia", async () => {
      await service.reverterAposPartidaEmLote([]);
      expect(mockBatchUpdate).not.toHaveBeenCalled();
    });

    it("deve propagar erro ao reverter em lote", async () => {
      const estatistica = {
        id: "est-1",
        jogadorId: "j1",
        etapaId: TEST_ETAPA_ID,
        jogosGrupo: 1,
        vitoriasGrupo: 1,
        derrotasGrupo: 0,
        pontosGrupo: 3,
        setsVencidosGrupo: 2,
        setsPerdidosGrupo: 0,
        saldoSetsGrupo: 2,
        gamesVencidosGrupo: 12,
        gamesPerdidosGrupo: 6,
        saldoGamesGrupo: 6,
        jogos: 1,
        vitorias: 1,
        derrotas: 0,
        setsVencidos: 2,
        setsPerdidos: 0,
        saldoSets: 2,
        gamesVencidos: 12,
        gamesPerdidos: 6,
        saldoGames: 6,
      };

      mockGet.mockResolvedValue({
        empty: false,
        docs: [{ id: estatistica.id, data: () => estatistica }],
      });
      mockBatchCommit.mockRejectedValue(new Error("Erro de batch"));

      const reversoes = [
        {
          jogadorId: "j1",
          etapaId: TEST_ETAPA_ID,
          dto: { venceu: true, setsVencidos: 2, setsPerdidos: 0, gamesVencidos: 12, gamesPerdidos: 6 },
        },
      ];

      await expect(service.reverterAposPartidaEmLote(reversoes)).rejects.toThrow("Erro de batch");
    });
  });

  describe("atualizarPosicoesGrupoEmLote", () => {
    it("deve atualizar posições em lote", async () => {
      const atualizacoes = [
        { estatisticaId: "est-1", posicaoGrupo: 1 },
        { estatisticaId: "est-2", posicaoGrupo: 2 },
      ];

      await service.atualizarPosicoesGrupoEmLote(atualizacoes);

      expect(mockBatchUpdate).toHaveBeenCalledTimes(2);
      expect(mockBatchCommit).toHaveBeenCalled();
    });

    it("deve retornar imediatamente para lista vazia", async () => {
      await service.atualizarPosicoesGrupoEmLote([]);
      expect(mockBatchUpdate).not.toHaveBeenCalled();
    });

    it("deve propagar erro ao atualizar posições em lote", async () => {
      mockBatchCommit.mockRejectedValue(new Error("Erro de batch"));

      const atualizacoes = [{ estatisticaId: "est-1", posicaoGrupo: 1 }];

      await expect(service.atualizarPosicoesGrupoEmLote(atualizacoes)).rejects.toThrow("Erro de batch");
    });
  });

  describe("atualizarAposPartidaComIncrement", () => {
    it("deve atualizar com increment atômico (TEAMS)", async () => {
      const atualizacoes = [
        {
          estatisticaId: "est-1",
          dto: { venceu: true, setsVencidos: 2, setsPerdidos: 0, gamesVencidos: 12, gamesPerdidos: 6 },
        },
        {
          estatisticaId: "est-2",
          dto: { venceu: false, setsVencidos: 0, setsPerdidos: 2, gamesVencidos: 6, gamesPerdidos: 12 },
        },
      ];

      await service.atualizarAposPartidaComIncrement(atualizacoes);

      expect(mockBatchUpdate).toHaveBeenCalledTimes(2);
      expect(mockBatchCommit).toHaveBeenCalled();
    });

    it("deve retornar imediatamente para lista vazia", async () => {
      await service.atualizarAposPartidaComIncrement([]);
      expect(mockBatchUpdate).not.toHaveBeenCalled();
    });

    it("deve propagar erro ao atualizar com increment", async () => {
      mockBatchCommit.mockRejectedValue(new Error("Erro de batch"));

      const atualizacoes = [
        {
          estatisticaId: "est-1",
          dto: { venceu: true, setsVencidos: 2, setsPerdidos: 0, gamesVencidos: 12, gamesPerdidos: 6 },
        },
      ];

      await expect(service.atualizarAposPartidaComIncrement(atualizacoes)).rejects.toThrow("Erro de batch");
    });
  });

  describe("atualizarAposPartidaGrupoComIncrement", () => {
    it("deve atualizar grupo com increment atômico", async () => {
      const atualizacoes = [
        {
          estatisticaId: "est-1",
          dto: { venceu: true, setsVencidos: 2, setsPerdidos: 1, gamesVencidos: 13, gamesPerdidos: 10 },
        },
      ];

      await service.atualizarAposPartidaGrupoComIncrement(atualizacoes);

      expect(mockBatchUpdate).toHaveBeenCalled();
      expect(mockBatchCommit).toHaveBeenCalled();
    });

    it("deve retornar imediatamente para lista vazia", async () => {
      await service.atualizarAposPartidaGrupoComIncrement([]);
      expect(mockBatchUpdate).not.toHaveBeenCalled();
    });

    it("deve propagar erro ao atualizar grupo com increment", async () => {
      mockBatchCommit.mockRejectedValue(new Error("Erro de batch"));

      const atualizacoes = [
        {
          estatisticaId: "est-1",
          dto: { venceu: true, setsVencidos: 2, setsPerdidos: 1, gamesVencidos: 13, gamesPerdidos: 10 },
        },
      ];

      await expect(service.atualizarAposPartidaGrupoComIncrement(atualizacoes)).rejects.toThrow("Erro de batch");
    });
  });

  describe("reverterAposPartidaComIncrement", () => {
    it("deve reverter com increment negativo", async () => {
      const reversoes = [
        {
          estatisticaId: "est-1",
          dto: { venceu: true, setsVencidos: 2, setsPerdidos: 1, gamesVencidos: 13, gamesPerdidos: 10 },
        },
      ];

      await service.reverterAposPartidaComIncrement(reversoes);

      expect(mockBatchUpdate).toHaveBeenCalled();
      expect(mockBatchCommit).toHaveBeenCalled();
    });

    it("deve retornar imediatamente para lista vazia", async () => {
      await service.reverterAposPartidaComIncrement([]);
      expect(mockBatchUpdate).not.toHaveBeenCalled();
    });

    it("deve propagar erro ao reverter com increment", async () => {
      mockBatchCommit.mockRejectedValue(new Error("Erro de batch"));

      const reversoes = [
        {
          estatisticaId: "est-1",
          dto: { venceu: true, setsVencidos: 2, setsPerdidos: 1, gamesVencidos: 13, gamesPerdidos: 10 },
        },
      ];

      await expect(service.reverterAposPartidaComIncrement(reversoes)).rejects.toThrow("Erro de batch");
    });
  });

  describe("marcarComoClassificadoEmLote", () => {
    it("deve marcar múltiplos jogadores como classificados", async () => {
      const estatisticas = [
        { id: "est-1", jogadorId: "j1", etapaId: TEST_ETAPA_ID, classificado: false },
        { id: "est-2", jogadorId: "j2", etapaId: TEST_ETAPA_ID, classificado: false },
      ];

      mockGet
        .mockResolvedValueOnce({
          empty: false,
          docs: [{ id: estatisticas[0].id, data: () => estatisticas[0] }],
        })
        .mockResolvedValueOnce({
          empty: false,
          docs: [{ id: estatisticas[1].id, data: () => estatisticas[1] }],
        });

      mockUpdate.mockResolvedValue(undefined);

      const jogadores = [
        { jogadorId: "j1", etapaId: TEST_ETAPA_ID },
        { jogadorId: "j2", etapaId: TEST_ETAPA_ID },
      ];

      await service.marcarComoClassificadoEmLote(jogadores, true);

      expect(mockUpdate).toHaveBeenCalledTimes(2);
    });

    it("deve retornar imediatamente para lista vazia", async () => {
      await service.marcarComoClassificadoEmLote([], true);
      expect(mockGet).not.toHaveBeenCalled();
    });

    it("deve pular jogadores sem estatísticas encontradas", async () => {
      mockGet.mockResolvedValue({ empty: true, docs: [] });

      const jogadores = [
        { jogadorId: "j-inexistente", etapaId: TEST_ETAPA_ID },
      ];

      await service.marcarComoClassificadoEmLote(jogadores, true);

      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it("deve propagar erro ao marcar classificados em lote", async () => {
      const estatistica = { id: "est-1", jogadorId: "j1", etapaId: TEST_ETAPA_ID, classificado: false };

      mockGet.mockResolvedValue({
        empty: false,
        docs: [{ id: estatistica.id, data: () => estatistica }],
      });
      mockUpdate.mockRejectedValue(new Error("Erro ao atualizar"));

      const jogadores = [{ jogadorId: "j1", etapaId: TEST_ETAPA_ID }];

      await expect(service.marcarComoClassificadoEmLote(jogadores, true)).rejects.toThrow("Erro ao atualizar");
    });
  });

  describe("buscarEtapasQueContamPontos - retrocompatibilidade", () => {
    it("deve considerar etapas sem campo contaPontosRanking como contando pontos", async () => {
      // Primeira query: etapas com contaPontosRanking = true
      mockGet.mockResolvedValueOnce({
        docs: [{ id: "etapa-nova", data: () => ({ contaPontosRanking: true }) }],
      });

      // Segunda query: todas as etapas (para verificar retrocompatibilidade)
      mockGet.mockResolvedValueOnce({
        docs: [
          { id: "etapa-nova", data: () => ({ contaPontosRanking: true }) },
          { id: "etapa-antiga", data: () => ({}) }, // Sem o campo - retrocompatibilidade
        ],
      });

      // Query final para buscar estatísticas
      mockGet.mockResolvedValueOnce({
        docs: [
          {
            id: "est-1",
            data: () => ({
              etapaId: "etapa-antiga",
              jogadorId: "j1",
              jogadorNome: "Jogador 1",
              jogadorNivel: NivelJogador.INICIANTE,
              jogos: 3,
              vitorias: 2,
              derrotas: 1,
              pontos: 6,
              setsVencidos: 5,
              setsPerdidos: 2,
              gamesVencidos: 30,
              gamesPerdidos: 18,
              saldoSets: 3,
              saldoGames: 12,
            }),
          },
        ],
      });

      const result = await service.buscarRankingPorNivel(
        TEST_ARENA_ID,
        NivelJogador.INICIANTE,
        10
      );

      expect(result).toHaveLength(1);
      // Os pontos devem ser contados porque a etapa antiga (sem o campo) conta para o ranking
      expect(result[0].pontos).toBe(6);
    });
  });

  describe("buscarRankingGlobalAgregado - desempates avançados", () => {
    it("deve ordenar corretamente todos critérios de desempate", async () => {
      const estatisticas = [
        {
          jogadorId: "j1",
          jogadorNome: "Jogador 1",
          jogadorNivel: NivelJogador.AVANCADO,
          pontos: 10,
          saldoGames: 20,
          gamesVencidos: 50,
          vitorias: 4,
          jogos: 5,
          derrotas: 1,
          setsVencidos: 8,
          setsPerdidos: 3,
          saldoSets: 5,
          gamesPerdidos: 30,
        },
        {
          jogadorId: "j2",
          jogadorNome: "Jogador 2",
          jogadorNivel: NivelJogador.AVANCADO,
          pontos: 10, // Mesmo pontos
          saldoGames: 20, // Mesmo saldoGames
          gamesVencidos: 50, // Mesmo gamesVencidos
          vitorias: 4, // Mesmo vitorias - desempate final
          jogos: 5,
          derrotas: 1,
          setsVencidos: 8,
          setsPerdidos: 3,
          saldoSets: 5,
          gamesPerdidos: 30,
        },
      ];

      mockGet.mockResolvedValue({
        docs: estatisticas.map((e, i) => ({
          id: `estat-${i}`,
          data: () => e,
        })),
      });

      const result = await service.buscarRankingGlobalAgregado(TEST_ARENA_ID, 10);

      // Com todos critérios iguais, a ordem é preservada
      expect(result).toHaveLength(2);
    });
  });
});
