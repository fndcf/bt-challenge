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

jest.mock("../../repositories/firebase/ConfrontoEliminatorioRepository", () => ({
  confrontoEliminatorioRepository: {},
  ConfrontoEliminatorioRepository: jest.fn(),
}));

// Mock explícito do EstatisticasJogadorService
jest.mock("../../services/EstatisticasJogadorService", () => {
  return {
    __esModule: true,
    default: {
      atualizarAposPartida: jest.fn().mockResolvedValue(undefined),
      reverterAposPartida: jest.fn().mockResolvedValue(undefined),
      buscarPorJogadorEtapa: jest.fn().mockResolvedValue(null),
      buscarPorJogadoresEtapa: jest.fn().mockResolvedValue(new Map()),
      reverterAposPartidaComIncrement: jest.fn().mockResolvedValue(undefined),
      atualizarAposPartidaGrupoComIncrement: jest.fn().mockResolvedValue(undefined),
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

import {
  PartidaGrupoService,
  PlacarSet,
} from "../../services/PartidaGrupoService";
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
  let mockConfrontoRepository: {
    buscarPorEtapa: jest.Mock;
    criar: jest.Mock;
    deletarPorEtapa: jest.Mock;
  };
  let partidaGrupoService: PartidaGrupoService;

  const TEST_ARENA_ID = "arena-test-001";
  const TEST_ETAPA_ID = "etapa-test-001";
  const TEST_PARTIDA_ID = "partida-test-001";

  beforeEach(() => {
    jest.clearAllMocks();

    mockPartidaRepository = createMockPartidaRepository();
    mockDuplaRepository = createMockDuplaRepository();
    mockGrupoRepository = createMockGrupoRepository();
    mockConfrontoRepository = {
      buscarPorEtapa: jest.fn().mockResolvedValue([]),
      criar: jest.fn(),
      deletarPorEtapa: jest.fn(),
    };

    partidaGrupoService = new PartidaGrupoService(
      mockPartidaRepository,
      mockDuplaRepository,
      mockGrupoRepository,
      mockConfrontoRepository as any
    );
  });

  describe("gerarPartidas", () => {
    it("deve gerar partidas todos contra todos para cada grupo", async () => {
      const grupos = [createGrupoFixture({ id: "grupo-1" })];
      const duplas = [
        createDuplaFixture({
          id: "dupla-1",
          jogador1Nome: "João",
          jogador2Nome: "Pedro",
        }),
        createDuplaFixture({
          id: "dupla-2",
          jogador1Nome: "Maria",
          jogador2Nome: "Ana",
        }),
        createDuplaFixture({
          id: "dupla-3",
          jogador1Nome: "Carlos",
          jogador2Nome: "Lucas",
        }),
      ];

      mockDuplaRepository.buscarPorGrupo.mockResolvedValue(duplas);
      mockPartidaRepository.criarEmLote.mockImplementation(async (dtos: any[]) =>
        dtos.map((data, idx) => createPartidaFixture({ ...data, id: `partida-${idx}` }))
      );
      mockGrupoRepository.adicionarPartidasEmLote.mockResolvedValue(undefined);

      const result = await partidaGrupoService.gerarPartidas(
        TEST_ETAPA_ID,
        TEST_ARENA_ID,
        grupos
      );

      // 3 duplas = 3 partidas (combinação 3 escolhe 2)
      expect(result).toHaveLength(3);
      expect(mockPartidaRepository.criarEmLote).toHaveBeenCalledTimes(1);
      // Verifica que adicionou partidas ao grupo
      expect(mockGrupoRepository.adicionarPartidasEmLote).toHaveBeenCalledWith(
        "grupo-1",
        expect.any(Array)
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
      mockPartidaRepository.criarEmLote.mockImplementation(async (dtos: any[]) =>
        dtos.map((data, idx) => createPartidaFixture({ ...data, id: `partida-${idx}` }))
      );
      mockGrupoRepository.adicionarPartidasEmLote.mockResolvedValue(undefined);

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
      expect(mockDuplaRepository.atualizarEstatisticas).toHaveBeenCalledTimes(
        2
      );
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

      const dupla1Zerada = {
        ...dupla1,
        jogos: 0,
        vitorias: 0,
        setsVencidos: 0,
      };
      const dupla2Zerada = {
        ...dupla2,
        jogos: 0,
        derrotas: 0,
        setsPerdidos: 0,
      };

      // Novo placar (invertendo vencedor)
      const novoPlacar: PlacarSet[] = [
        { numero: 1, gamesDupla1: 3, gamesDupla2: 6 },
        { numero: 2, gamesDupla1: 4, gamesDupla2: 6 },
      ];

      mockPartidaRepository.buscarPorIdEArena.mockResolvedValue(
        partidaFinalizada
      );

      // O fluxo de buscarPorId:
      // 1. Busca inicial: dupla1, dupla2
      // 2. reverterEstatisticasDupla chama buscarPorId internamente: dupla1, dupla2
      // 3. Re-busca após reversão: dupla1Zerada, dupla2Zerada
      mockDuplaRepository.buscarPorId
        .mockResolvedValueOnce(dupla1) // Busca inicial dupla1
        .mockResolvedValueOnce(dupla2) // Busca inicial dupla2
        .mockResolvedValueOnce(dupla1) // reverterEstatisticasDupla dupla1
        .mockResolvedValueOnce(dupla2) // reverterEstatisticasDupla dupla2
        .mockResolvedValueOnce(dupla1Zerada) // Re-busca após reversão dupla1
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

  describe("gerarPartidas - cenários de erro", () => {
    it("deve lançar erro quando busca de duplas falha", async () => {
      const grupos = [createGrupoFixture({ id: "grupo-1" })];

      mockDuplaRepository.buscarPorGrupo.mockRejectedValue(new Error("Erro de banco"));

      await expect(
        partidaGrupoService.gerarPartidas(TEST_ETAPA_ID, TEST_ARENA_ID, grupos)
      ).rejects.toThrow("Falha ao gerar partidas");
    });

    it("deve lançar erro quando criação de partidas falha", async () => {
      const grupos = [createGrupoFixture({ id: "grupo-1" })];
      const duplas = [
        createDuplaFixture({ id: "dupla-1" }),
        createDuplaFixture({ id: "dupla-2" }),
      ];

      mockDuplaRepository.buscarPorGrupo.mockResolvedValue(duplas);
      mockPartidaRepository.criarEmLote.mockRejectedValue(new Error("Erro ao criar"));

      await expect(
        partidaGrupoService.gerarPartidas(TEST_ETAPA_ID, TEST_ARENA_ID, grupos)
      ).rejects.toThrow("Falha ao gerar partidas");
    });
  });

  describe("registrarResultado - cenários adicionais", () => {
    it("deve lançar erro ao editar resultado quando eliminatória já foi gerada", async () => {
      const partidaFinalizada = createPartidaFinalizadaFixture({
        id: TEST_PARTIDA_ID,
        status: StatusPartida.FINALIZADA,
      });

      const dupla1 = createDuplaFixture({ id: TEST_IDS.dupla1 });
      const dupla2 = createDuplaFixture({ id: TEST_IDS.dupla2 });

      mockPartidaRepository.buscarPorIdEArena.mockResolvedValue(partidaFinalizada);
      mockDuplaRepository.buscarPorId
        .mockResolvedValueOnce(dupla1)
        .mockResolvedValueOnce(dupla2);
      // Retorna confrontos - eliminatória já gerada
      mockConfrontoRepository.buscarPorEtapa.mockResolvedValue([
        { id: "confronto-1" },
      ]);

      await expect(
        partidaGrupoService.registrarResultado(
          TEST_PARTIDA_ID,
          TEST_ARENA_ID,
          [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }]
        )
      ).rejects.toThrow(
        "Não é possível editar resultados após gerar a fase eliminatória"
      );
    });

    it("deve lançar erro quando duplas não encontradas após reversão", async () => {
      const partidaFinalizada = createPartidaFinalizadaFixture({
        id: TEST_PARTIDA_ID,
        status: StatusPartida.FINALIZADA,
        placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }],
      });

      const dupla1 = createDuplaFixture({ id: TEST_IDS.dupla1 });
      const dupla2 = createDuplaFixture({ id: TEST_IDS.dupla2 });

      mockPartidaRepository.buscarPorIdEArena.mockResolvedValue(partidaFinalizada);
      mockConfrontoRepository.buscarPorEtapa.mockResolvedValue([]);
      mockDuplaRepository.buscarPorId
        .mockResolvedValueOnce(dupla1) // Busca inicial
        .mockResolvedValueOnce(dupla2) // Busca inicial
        .mockResolvedValueOnce(dupla1) // reverterEstatisticasDupla
        .mockResolvedValueOnce(dupla2) // reverterEstatisticasDupla
        .mockResolvedValueOnce(null); // Re-busca após reversão - retorna null

      mockDuplaRepository.atualizarEstatisticas.mockResolvedValue(undefined);

      await expect(
        partidaGrupoService.registrarResultado(
          TEST_PARTIDA_ID,
          TEST_ARENA_ID,
          [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }]
        )
      ).rejects.toThrow("Duplas não encontradas após reversão");
    });

    it("deve processar placar onde dupla2 vence o set", async () => {
      const partida = createPartidaFixture({
        id: TEST_PARTIDA_ID,
        status: StatusPartida.AGENDADA,
      });

      const dupla1 = createDuplaFixture({ id: TEST_IDS.dupla1 });
      const dupla2 = createDuplaFixture({ id: TEST_IDS.dupla2 });

      // Dupla 2 vence todos os sets
      const placar = [
        { numero: 1, gamesDupla1: 2, gamesDupla2: 6 },
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
          setsDupla1: 0,
          setsDupla2: 2,
        })
      );
    });

    it("deve recalcular classificação do grupo após registrar resultado", async () => {
      const partida = createPartidaFixture({
        id: TEST_PARTIDA_ID,
        grupoId: "grupo-com-classificacao",
        status: StatusPartida.AGENDADA,
      });

      const dupla1 = createDuplaFixture({ id: TEST_IDS.dupla1 });
      const dupla2 = createDuplaFixture({ id: TEST_IDS.dupla2 });

      mockPartidaRepository.buscarPorIdEArena.mockResolvedValue(partida);
      mockDuplaRepository.buscarPorId
        .mockResolvedValueOnce(dupla1)
        .mockResolvedValueOnce(dupla2);
      mockPartidaRepository.registrarResultado.mockResolvedValue(undefined);
      mockDuplaRepository.atualizarEstatisticas.mockResolvedValue(undefined);

      const classificacaoService = require("../../services/ClassificacaoService").default;

      await partidaGrupoService.registrarResultado(
        TEST_PARTIDA_ID,
        TEST_ARENA_ID,
        [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }]
      );

      expect(classificacaoService.recalcularClassificacaoGrupo).toHaveBeenCalledWith(
        "grupo-com-classificacao"
      );
    });
  });

  describe("registrarResultadosEmLote", () => {
    beforeEach(() => {
      mockDuplaRepository.atualizarEstatisticasComIncrement = jest.fn().mockResolvedValue(undefined);
    });

    it("deve registrar múltiplos resultados em lote com sucesso", async () => {
      const partida1 = createPartidaFixture({
        id: "partida-1",
        dupla1Id: "dupla-1",
        dupla2Id: "dupla-2",
        grupoId: "grupo-1",
        status: StatusPartida.AGENDADA,
      });
      const partida2 = createPartidaFixture({
        id: "partida-2",
        dupla1Id: "dupla-3",
        dupla2Id: "dupla-4",
        grupoId: "grupo-1",
        status: StatusPartida.AGENDADA,
      });

      const dupla1 = createDuplaFixture({ id: "dupla-1", jogador1Id: "j1", jogador2Id: "j2" });
      const dupla2 = createDuplaFixture({ id: "dupla-2", jogador1Id: "j3", jogador2Id: "j4" });
      const dupla3 = createDuplaFixture({ id: "dupla-3", jogador1Id: "j5", jogador2Id: "j6" });
      const dupla4 = createDuplaFixture({ id: "dupla-4", jogador1Id: "j7", jogador2Id: "j8" });

      mockPartidaRepository.buscarPorIdEArena
        .mockResolvedValueOnce(partida1)
        .mockResolvedValueOnce(partida2);

      mockDuplaRepository.buscarPorId
        .mockResolvedValueOnce(dupla1)
        .mockResolvedValueOnce(dupla2)
        .mockResolvedValueOnce(dupla3)
        .mockResolvedValueOnce(dupla4);

      mockPartidaRepository.registrarResultado.mockResolvedValue(undefined);

      const resultados = [
        {
          partidaId: "partida-1",
          placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }],
        },
        {
          partidaId: "partida-2",
          placar: [{ numero: 1, gamesDupla1: 4, gamesDupla2: 6 }],
        },
      ];

      const response = await partidaGrupoService.registrarResultadosEmLote(
        TEST_ARENA_ID,
        resultados
      );

      expect(response.processados).toBe(2);
      expect(response.erros).toHaveLength(0);
      expect(response.gruposRecalculados).toContain("grupo-1");
    });

    it("deve retornar erro quando partida não encontrada", async () => {
      mockPartidaRepository.buscarPorIdEArena.mockResolvedValue(null);

      const resultados = [
        {
          partidaId: "partida-inexistente",
          placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }],
        },
      ];

      const response = await partidaGrupoService.registrarResultadosEmLote(
        TEST_ARENA_ID,
        resultados
      );

      expect(response.processados).toBe(0);
      expect(response.erros).toHaveLength(1);
      expect(response.erros[0].erro).toBe("Partida não encontrada");
    });

    it("deve retornar erro quando duplas não encontradas", async () => {
      const partida = createPartidaFixture({
        id: "partida-1",
        status: StatusPartida.AGENDADA,
      });

      mockPartidaRepository.buscarPorIdEArena.mockResolvedValue(partida);
      mockDuplaRepository.buscarPorId.mockResolvedValue(null);

      const resultados = [
        {
          partidaId: "partida-1",
          placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }],
        },
      ];

      const response = await partidaGrupoService.registrarResultadosEmLote(
        TEST_ARENA_ID,
        resultados
      );

      expect(response.processados).toBe(0);
      expect(response.erros).toHaveLength(1);
      expect(response.erros[0].erro).toBe("Duplas não encontradas");
    });

    it("deve impedir edição em lote quando eliminatória já gerada", async () => {
      const partidaFinalizada = createPartidaFinalizadaFixture({
        id: "partida-1",
        status: StatusPartida.FINALIZADA,
      });

      const dupla1 = createDuplaFixture({ id: TEST_IDS.dupla1 });
      const dupla2 = createDuplaFixture({ id: TEST_IDS.dupla2 });

      mockPartidaRepository.buscarPorIdEArena.mockResolvedValue(partidaFinalizada);
      mockDuplaRepository.buscarPorId
        .mockResolvedValueOnce(dupla1)
        .mockResolvedValueOnce(dupla2);
      mockConfrontoRepository.buscarPorEtapa.mockResolvedValue([{ id: "conf-1" }]);

      const resultados = [
        {
          partidaId: "partida-1",
          placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }],
        },
      ];

      const response = await partidaGrupoService.registrarResultadosEmLote(
        TEST_ARENA_ID,
        resultados
      );

      expect(response.processados).toBe(0);
      expect(response.erros).toHaveLength(1);
      expect(response.erros[0].erro).toBe("Não é possível editar após gerar eliminatória");
    });

    it("deve reverter estatísticas ao editar resultados em lote", async () => {
      const partidaFinalizada = createPartidaFinalizadaFixture({
        id: "partida-1",
        status: StatusPartida.FINALIZADA,
        placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }],
        grupoId: "grupo-1",
      });

      const dupla1 = createDuplaFixture({ id: TEST_IDS.dupla1, jogador1Id: "j1", jogador2Id: "j2" });
      const dupla2 = createDuplaFixture({ id: TEST_IDS.dupla2, jogador1Id: "j3", jogador2Id: "j4" });

      const estatisticasMap = new Map([
        ["j1", { id: "est-j1" }],
        ["j2", { id: "est-j2" }],
        ["j3", { id: "est-j3" }],
        ["j4", { id: "est-j4" }],
      ]);

      mockPartidaRepository.buscarPorIdEArena.mockResolvedValue(partidaFinalizada);
      mockDuplaRepository.buscarPorId
        .mockResolvedValueOnce(dupla1)
        .mockResolvedValueOnce(dupla2);
      mockConfrontoRepository.buscarPorEtapa.mockResolvedValue([]);
      mockPartidaRepository.registrarResultado.mockResolvedValue(undefined);

      const estatisticasService = require("../../services/EstatisticasJogadorService").default;
      estatisticasService.buscarPorJogadoresEtapa.mockResolvedValue(estatisticasMap);

      const resultados = [
        {
          partidaId: "partida-1",
          placar: [{ numero: 1, gamesDupla1: 4, gamesDupla2: 6 }],
        },
      ];

      const response = await partidaGrupoService.registrarResultadosEmLote(
        TEST_ARENA_ID,
        resultados
      );

      expect(response.processados).toBe(1);
      expect(estatisticasService.reverterAposPartidaComIncrement).toHaveBeenCalled();
      expect(estatisticasService.atualizarAposPartidaGrupoComIncrement).toHaveBeenCalled();
    });

    it("deve processar alguns resultados e retornar erros de outros", async () => {
      const partida1 = createPartidaFixture({
        id: "partida-1",
        dupla1Id: "dupla-1",
        dupla2Id: "dupla-2",
        grupoId: "grupo-1",
        status: StatusPartida.AGENDADA,
      });

      const dupla1 = createDuplaFixture({ id: "dupla-1", jogador1Id: "j1", jogador2Id: "j2" });
      const dupla2 = createDuplaFixture({ id: "dupla-2", jogador1Id: "j3", jogador2Id: "j4" });

      mockPartidaRepository.buscarPorIdEArena
        .mockResolvedValueOnce(partida1)
        .mockResolvedValueOnce(null); // Segunda partida não existe

      mockDuplaRepository.buscarPorId
        .mockResolvedValueOnce(dupla1)
        .mockResolvedValueOnce(dupla2);

      mockPartidaRepository.registrarResultado.mockResolvedValue(undefined);

      const resultados = [
        {
          partidaId: "partida-1",
          placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }],
        },
        {
          partidaId: "partida-inexistente",
          placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }],
        },
      ];

      const response = await partidaGrupoService.registrarResultadosEmLote(
        TEST_ARENA_ID,
        resultados
      );

      expect(response.processados).toBe(1);
      expect(response.erros).toHaveLength(1);
      expect(response.erros[0].partidaId).toBe("partida-inexistente");
    });

    it("deve lidar com erro ao registrar resultado individual em lote", async () => {
      const partida1 = createPartidaFixture({
        id: "partida-1",
        dupla1Id: "dupla-1",
        dupla2Id: "dupla-2",
        grupoId: "grupo-1",
        status: StatusPartida.AGENDADA,
      });

      const dupla1 = createDuplaFixture({ id: "dupla-1", jogador1Id: "j1", jogador2Id: "j2" });
      const dupla2 = createDuplaFixture({ id: "dupla-2", jogador1Id: "j3", jogador2Id: "j4" });

      mockPartidaRepository.buscarPorIdEArena.mockResolvedValue(partida1);
      mockDuplaRepository.buscarPorId
        .mockResolvedValueOnce(dupla1)
        .mockResolvedValueOnce(dupla2);
      mockPartidaRepository.registrarResultado.mockRejectedValue(
        new Error("Erro ao salvar")
      );

      const resultados = [
        {
          partidaId: "partida-1",
          placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }],
        },
      ];

      const response = await partidaGrupoService.registrarResultadosEmLote(
        TEST_ARENA_ID,
        resultados
      );

      expect(response.processados).toBe(0);
      expect(response.erros).toHaveLength(1);
      expect(response.erros[0].erro).toContain("Erro ao salvar");
    });

    it("deve continuar processando mesmo com erro ao recalcular classificação", async () => {
      const partida1 = createPartidaFixture({
        id: "partida-1",
        dupla1Id: "dupla-1",
        dupla2Id: "dupla-2",
        grupoId: "grupo-1",
        status: StatusPartida.AGENDADA,
      });

      const dupla1 = createDuplaFixture({ id: "dupla-1", jogador1Id: "j1", jogador2Id: "j2" });
      const dupla2 = createDuplaFixture({ id: "dupla-2", jogador1Id: "j3", jogador2Id: "j4" });

      mockPartidaRepository.buscarPorIdEArena.mockResolvedValue(partida1);
      mockDuplaRepository.buscarPorId
        .mockResolvedValueOnce(dupla1)
        .mockResolvedValueOnce(dupla2);
      mockPartidaRepository.registrarResultado.mockResolvedValue(undefined);

      const classificacaoService = require("../../services/ClassificacaoService").default;
      classificacaoService.recalcularClassificacaoGrupo.mockRejectedValueOnce(
        new Error("Erro ao recalcular")
      );

      const resultados = [
        {
          partidaId: "partida-1",
          placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }],
        },
      ];

      const response = await partidaGrupoService.registrarResultadosEmLote(
        TEST_ARENA_ID,
        resultados
      );

      // Resultado foi processado, mesmo com erro na classificação
      expect(response.processados).toBe(1);
    });
  });
});
