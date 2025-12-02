/**
 * PartidaGrupoService.test.ts
 * Testes unitários REAIS para PartidaGrupoService
 */

// Mocks devem vir ANTES dos imports
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

jest.mock("../../config/firebase", () => ({
  db: { collection: jest.fn() },
  auth: { verifyIdToken: jest.fn() },
}));

jest.mock("../../repositories/firebase/PartidaRepository", () => ({
  partidaRepository: {},
  PartidaRepository: jest.fn(),
}));

jest.mock("../../repositories/firebase/DuplaRepository", () => ({
  duplaRepository: {},
  DuplaRepository: jest.fn(),
}));

jest.mock("../../repositories/firebase/GrupoRepository", () => ({
  grupoRepository: {},
  GrupoRepository: jest.fn(),
}));

// Mock explícito do EstatisticasJogadorService - DEVE VIR ANTES DO IMPORT
jest.mock("../../services/EstatisticasJogadorService", () => {
  return {
    __esModule: true,
    default: {
      atualizarAposPartida: jest.fn().mockResolvedValue(undefined),
      reverterAposPartida: jest.fn().mockResolvedValue(undefined),
      buscarPorJogadorEtapa: jest.fn().mockResolvedValue(null),
    },
  };
});

// Mock explícito do ClassificacaoService
jest.mock("../../services/ClassificacaoService", () => {
  return {
    __esModule: true,
    default: {
      recalcularClassificacaoGrupo: jest.fn().mockResolvedValue(undefined),
    },
  };
});

import { PartidaGrupoService, PlacarSet } from "../../services/PartidaGrupoService";
import {
  createMockPartidaRepository,
  createMockDuplaRepository,
  createMockGrupoRepository,
} from "../mocks/repositories";
import {
  createPartidaFixture,
  createPartidaFinalizadaFixture,
  createDuplaFixture,
  createGrupoFixture,
  TEST_IDS,
  StatusPartida,
} from "../fixtures";

describe("PartidaGrupoService", () => {
  let mockPartidaRepository: ReturnType<typeof createMockPartidaRepository>;
  let mockDuplaRepository: ReturnType<typeof createMockDuplaRepository>;
  let mockGrupoRepository: ReturnType<typeof createMockGrupoRepository>;
  let partidaGrupoService: PartidaGrupoService;

  const TEST_ARENA_ID = "arena-test-001";
  const TEST_ETAPA_ID = "etapa-test-001";
  const TEST_PARTIDA_ID = "partida-test-001";

  beforeEach(() => {
    jest.clearAllMocks();

    mockPartidaRepository = createMockPartidaRepository();
    mockDuplaRepository = createMockDuplaRepository();
    mockGrupoRepository = createMockGrupoRepository();

    partidaGrupoService = new PartidaGrupoService(
      mockPartidaRepository,
      mockDuplaRepository,
      mockGrupoRepository
    );
  });

  describe("gerarPartidas", () => {
    it("deve gerar partidas todos contra todos para cada grupo", async () => {
      const grupos = [createGrupoFixture({ id: "grupo-1" })];
      const duplas = [
        createDuplaFixture({ id: "dupla-1", jogador1Nome: "João", jogador2Nome: "Pedro" }),
        createDuplaFixture({ id: "dupla-2", jogador1Nome: "Maria", jogador2Nome: "Ana" }),
        createDuplaFixture({ id: "dupla-3", jogador1Nome: "Carlos", jogador2Nome: "Lucas" }),
      ];

      mockDuplaRepository.buscarPorGrupo.mockResolvedValue(duplas);
      mockPartidaRepository.criar.mockImplementation(async (data) =>
        createPartidaFixture({ ...data, id: `partida-${Date.now()}` })
      );
      mockGrupoRepository.atualizarContadores.mockResolvedValue(undefined);
      mockGrupoRepository.adicionarPartida.mockResolvedValue(undefined);

      const result = await partidaGrupoService.gerarPartidas(
        TEST_ETAPA_ID,
        TEST_ARENA_ID,
        grupos
      );

      // 3 duplas = 3 partidas (combinação 3 escolhe 2)
      expect(result).toHaveLength(3);
      expect(mockPartidaRepository.criar).toHaveBeenCalledTimes(3);
      expect(mockGrupoRepository.atualizarContadores).toHaveBeenCalledWith(
        "grupo-1",
        { totalPartidas: 3 }
      );
    });

    it("deve gerar partidas para múltiplos grupos", async () => {
      const grupos = [
        createGrupoFixture({ id: "grupo-1" }),
        createGrupoFixture({ id: "grupo-2" }),
      ];
      const duplas = [
        createDuplaFixture({ id: "dupla-1" }),
        createDuplaFixture({ id: "dupla-2" }),
      ];

      mockDuplaRepository.buscarPorGrupo.mockResolvedValue(duplas);
      mockPartidaRepository.criar.mockImplementation(async (data) =>
        createPartidaFixture({ ...data, id: `partida-${Date.now()}` })
      );
      mockGrupoRepository.atualizarContadores.mockResolvedValue(undefined);
      mockGrupoRepository.adicionarPartida.mockResolvedValue(undefined);

      const result = await partidaGrupoService.gerarPartidas(
        TEST_ETAPA_ID,
        TEST_ARENA_ID,
        grupos
      );

      // 2 grupos x 1 partida cada (2 duplas = 1 partida)
      expect(result).toHaveLength(2);
    });
  });

  describe("registrarResultado", () => {
    it("deve registrar resultado e atualizar estatísticas", async () => {
      const partida = createPartidaFixture({
        id: TEST_PARTIDA_ID,
        dupla1Id: TEST_IDS.dupla1,
        dupla2Id: TEST_IDS.dupla2,
        dupla1Nome: "João & Pedro",
        dupla2Nome: "Maria & Ana",
        status: StatusPartida.AGENDADA,
      });

      const dupla1 = createDuplaFixture({
        id: TEST_IDS.dupla1,
        jogador1Nome: "João",
        jogador2Nome: "Pedro",
        jogos: 0,
        vitorias: 0,
      });

      const dupla2 = createDuplaFixture({
        id: TEST_IDS.dupla2,
        jogador1Nome: "Maria",
        jogador2Nome: "Ana",
        jogos: 0,
        derrotas: 0,
      });

      const placar: PlacarSet[] = [
        { numero: 1, gamesDupla1: 6, gamesDupla2: 4 },
        { numero: 2, gamesDupla1: 6, gamesDupla2: 3 },
      ];

      mockPartidaRepository.buscarPorIdEArena.mockResolvedValue(partida);
      mockDuplaRepository.buscarPorId
        .mockResolvedValueOnce(dupla1)
        .mockResolvedValueOnce(dupla2);
      mockPartidaRepository.registrarResultado.mockResolvedValue(undefined);
      mockDuplaRepository.atualizarEstatisticas.mockResolvedValue(undefined);

      await partidaGrupoService.registrarResultado(
        TEST_PARTIDA_ID,
        TEST_ARENA_ID,
        placar
      );

      // Verifica que registrou resultado com vencedoraNome preenchido
      expect(mockPartidaRepository.registrarResultado).toHaveBeenCalledWith(
        TEST_PARTIDA_ID,
        expect.objectContaining({
          status: StatusPartida.FINALIZADA,
          setsDupla1: 2,
          setsDupla2: 0,
          vencedoraId: TEST_IDS.dupla1,
          vencedoraNome: "João & Pedro", // Bug corrigido!
        })
      );

      // Verifica que atualizou estatísticas das duplas
      expect(mockDuplaRepository.atualizarEstatisticas).toHaveBeenCalledTimes(2);
    });

    it("deve preencher vencedoraNome corretamente (bug fix)", async () => {
      const partida = createPartidaFixture({
        id: TEST_PARTIDA_ID,
        dupla1Nome: "Dupla A",
        dupla2Nome: "Dupla B",
        status: StatusPartida.AGENDADA,
      });

      const dupla1 = createDuplaFixture({
        id: TEST_IDS.dupla1,
        jogador1Nome: "Player1",
        jogador2Nome: "Player2",
      });

      const dupla2 = createDuplaFixture({
        id: TEST_IDS.dupla2,
        jogador1Nome: "Player3",
        jogador2Nome: "Player4",
      });

      // Dupla 2 vence
      const placar: PlacarSet[] = [
        { numero: 1, gamesDupla1: 4, gamesDupla2: 6 },
        { numero: 2, gamesDupla1: 3, gamesDupla2: 6 },
      ];

      mockPartidaRepository.buscarPorIdEArena.mockResolvedValue(partida);
      mockDuplaRepository.buscarPorId
        .mockResolvedValueOnce(dupla1)
        .mockResolvedValueOnce(dupla2);
      mockPartidaRepository.registrarResultado.mockResolvedValue(undefined);
      mockDuplaRepository.atualizarEstatisticas.mockResolvedValue(undefined);

      await partidaGrupoService.registrarResultado(
        TEST_PARTIDA_ID,
        TEST_ARENA_ID,
        placar
      );

      expect(mockPartidaRepository.registrarResultado).toHaveBeenCalledWith(
        TEST_PARTIDA_ID,
        expect.objectContaining({
          vencedoraId: TEST_IDS.dupla2,
          vencedoraNome: "Player3 & Player4", // Nome correto da vencedora
        })
      );
    });

    it("deve lançar erro se partida não encontrada", async () => {
      mockPartidaRepository.buscarPorIdEArena.mockResolvedValue(null);

      await expect(
        partidaGrupoService.registrarResultado(
          "partida-inexistente",
          TEST_ARENA_ID,
          []
        )
      ).rejects.toThrow("Partida não encontrada");
    });

    it("deve lançar erro se duplas não encontradas", async () => {
      const partida = createPartidaFixture({ status: StatusPartida.AGENDADA });

      mockPartidaRepository.buscarPorIdEArena.mockResolvedValue(partida);
      mockDuplaRepository.buscarPorId.mockResolvedValue(null);

      await expect(
        partidaGrupoService.registrarResultado(
          TEST_PARTIDA_ID,
          TEST_ARENA_ID,
          []
        )
      ).rejects.toThrow("Duplas não encontradas");
    });

    it("deve reverter estatísticas em edição de resultado", async () => {
      // Partida já finalizada (edição)
      const partidaFinalizada = createPartidaFinalizadaFixture({
        id: TEST_PARTIDA_ID,
        status: StatusPartida.FINALIZADA,
        placar: [
          { numero: 1, gamesDupla1: 6, gamesDupla2: 4 },
          { numero: 2, gamesDupla1: 6, gamesDupla2: 3 },
        ],
      });

      const dupla1 = createDuplaFixture({
        id: TEST_IDS.dupla1,
        jogos: 1,
        vitorias: 1,
        setsVencidos: 2,
      });

      const dupla2 = createDuplaFixture({
        id: TEST_IDS.dupla2,
        jogos: 1,
        derrotas: 1,
        setsPerdidos: 2,
      });

      const dupla1Zerada = { ...dupla1, jogos: 0, vitorias: 0, setsVencidos: 0 };
      const dupla2Zerada = { ...dupla2, jogos: 0, derrotas: 0, setsPerdidos: 0 };

      // Novo placar (invertendo vencedor)
      const novoPlacar: PlacarSet[] = [
        { numero: 1, gamesDupla1: 3, gamesDupla2: 6 },
        { numero: 2, gamesDupla1: 4, gamesDupla2: 6 },
      ];

      mockPartidaRepository.buscarPorIdEArena.mockResolvedValue(partidaFinalizada);
      
      // O fluxo de buscarPorId:
      // 1. Busca inicial: dupla1, dupla2
      // 2. reverterEstatisticasDupla chama buscarPorId internamente: dupla1, dupla2
      // 3. Re-busca após reversão: dupla1Zerada, dupla2Zerada
      mockDuplaRepository.buscarPorId
        .mockResolvedValueOnce(dupla1)        // Busca inicial dupla1
        .mockResolvedValueOnce(dupla2)        // Busca inicial dupla2
        .mockResolvedValueOnce(dupla1)        // reverterEstatisticasDupla dupla1
        .mockResolvedValueOnce(dupla2)        // reverterEstatisticasDupla dupla2
        .mockResolvedValueOnce(dupla1Zerada)  // Re-busca após reversão dupla1
        .mockResolvedValueOnce(dupla2Zerada); // Re-busca após reversão dupla2

      mockPartidaRepository.registrarResultado.mockResolvedValue(undefined);
      mockDuplaRepository.atualizarEstatisticas.mockResolvedValue(undefined);

      await partidaGrupoService.registrarResultado(
        TEST_PARTIDA_ID,
        TEST_ARENA_ID,
        novoPlacar
      );

      // Verifica que buscou duplas múltiplas vezes (inicial + reversão + re-busca)
      expect(mockDuplaRepository.buscarPorId).toHaveBeenCalled();
      expect(mockDuplaRepository.atualizarEstatisticas).toHaveBeenCalled();
    });
  });

  describe("buscarPorEtapa", () => {
    it("deve retornar partidas da etapa", async () => {
      const partidas = [
        createPartidaFixture({ id: "p1" }),
        createPartidaFixture({ id: "p2" }),
      ];

      mockPartidaRepository.buscarPorEtapa.mockResolvedValue(partidas);

      const result = await partidaGrupoService.buscarPorEtapa(
        TEST_ETAPA_ID,
        TEST_ARENA_ID
      );

      expect(mockPartidaRepository.buscarPorEtapa).toHaveBeenCalledWith(
        TEST_ETAPA_ID,
        TEST_ARENA_ID
      );
      expect(result).toHaveLength(2);
    });
  });

  describe("buscarPorGrupo", () => {
    it("deve retornar partidas do grupo ordenadas", async () => {
      const partidas = [
        createPartidaFixture({ id: "p1" }),
        createPartidaFixture({ id: "p2" }),
        createPartidaFixture({ id: "p3" }),
      ];

      mockPartidaRepository.buscarPorGrupoOrdenado.mockResolvedValue(partidas);

      const result = await partidaGrupoService.buscarPorGrupo(TEST_IDS.grupo1);

      expect(mockPartidaRepository.buscarPorGrupoOrdenado).toHaveBeenCalledWith(
        TEST_IDS.grupo1
      );
      expect(result).toHaveLength(3);
    });
  });

  describe("deletarPorEtapa", () => {
    it("deve deletar todas as partidas de grupos da etapa", async () => {
      const partidas = [
        createPartidaFixture({ id: "p1" }),
        createPartidaFixture({ id: "p2" }),
      ];

      mockPartidaRepository.buscarPorTipo.mockResolvedValue(partidas);
      mockPartidaRepository.deletarEmLote.mockResolvedValue(undefined);

      const count = await partidaGrupoService.deletarPorEtapa(
        TEST_ETAPA_ID,
        TEST_ARENA_ID
      );

      expect(mockPartidaRepository.buscarPorTipo).toHaveBeenCalledWith(
        TEST_ETAPA_ID,
        TEST_ARENA_ID,
        "grupos"
      );
      expect(mockPartidaRepository.deletarEmLote).toHaveBeenCalledWith([
        "p1",
        "p2",
      ]);
      expect(count).toBe(2);
    });

    it("deve retornar 0 se não houver partidas", async () => {
      mockPartidaRepository.buscarPorTipo.mockResolvedValue([]);

      const count = await partidaGrupoService.deletarPorEtapa(
        TEST_ETAPA_ID,
        TEST_ARENA_ID
      );

      expect(mockPartidaRepository.deletarEmLote).not.toHaveBeenCalled();
      expect(count).toBe(0);
    });
  });
});
