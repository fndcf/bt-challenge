/**
 * Testes do ClassificacaoService
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

jest.mock("../../config/firebase", () => ({
  db: { collection: jest.fn() },
  auth: { verifyIdToken: jest.fn() },
}));

jest.mock("../../repositories/firebase/DuplaRepository", () => ({
  DuplaRepository: jest.fn(),
  duplaRepository: {},
}));

jest.mock("../../repositories/firebase/PartidaRepository", () => ({
  PartidaRepository: jest.fn(),
  partidaRepository: {},
}));

jest.mock("../../repositories/firebase/GrupoRepository", () => ({
  GrupoRepository: jest.fn(),
  grupoRepository: {},
}));

jest.mock("../../services/EstatisticasJogadorService", () => ({
  __esModule: true,
  default: {
    atualizarPosicaoGrupo: jest.fn(),
  },
}));

import { ClassificacaoService } from "../../services/ClassificacaoService";
import {
  createMockDuplaRepository,
  createMockPartidaRepository,
  createMockGrupoRepository,
} from "../mocks/repositories";
import estatisticasJogadorService from "../../services/EstatisticasJogadorService";
import {
  createDuplaFixture,
  createPartidaFinalizadaFixture,
  TEST_IDS,
  StatusPartida,
} from "../fixtures";

describe("ClassificacaoService", () => {
  let mockDuplaRepository: ReturnType<typeof createMockDuplaRepository>;
  let mockPartidaRepository: ReturnType<typeof createMockPartidaRepository>;
  let mockGrupoRepository: ReturnType<typeof createMockGrupoRepository>;
  let classificacaoService: ClassificacaoService;

  beforeEach(() => {
    jest.clearAllMocks();

    mockDuplaRepository = createMockDuplaRepository();
    mockPartidaRepository = createMockPartidaRepository();
    mockGrupoRepository = createMockGrupoRepository();

    classificacaoService = new ClassificacaoService(
      mockDuplaRepository,
      mockPartidaRepository,
      mockGrupoRepository
    );
  });

  describe("verificarConfrontoDireto", () => {
    it("deve retornar vencedora do confronto direto", () => {
      const partidas = [
        createPartidaFinalizadaFixture({
          id: "partida-1",
          dupla1Id: "dupla-A",
          dupla2Id: "dupla-B",
          vencedoraId: "dupla-A",
        }),
      ];

      const result = classificacaoService.verificarConfrontoDireto(
        partidas,
        "dupla-A",
        "dupla-B"
      );

      expect(result.vencedora).toBe("dupla-A");
    });

    it("deve retornar vencedora mesmo com ordem invertida", () => {
      const partidas = [
        createPartidaFinalizadaFixture({
          id: "partida-1",
          dupla1Id: "dupla-B",
          dupla2Id: "dupla-A",
          vencedoraId: "dupla-B",
        }),
      ];

      const result = classificacaoService.verificarConfrontoDireto(
        partidas,
        "dupla-A",
        "dupla-B"
      );

      expect(result.vencedora).toBe("dupla-B");
    });

    it("deve retornar null se não houver confronto", () => {
      const partidas = [
        createPartidaFinalizadaFixture({
          id: "partida-1",
          dupla1Id: "dupla-X",
          dupla2Id: "dupla-Y",
          vencedoraId: "dupla-X",
        }),
      ];

      const result = classificacaoService.verificarConfrontoDireto(
        partidas,
        "dupla-A",
        "dupla-B"
      );

      expect(result.vencedora).toBeNull();
    });

    it("deve retornar null se confronto não tiver vencedora", () => {
      const partidas = [
        createPartidaFinalizadaFixture({
          id: "partida-1",
          dupla1Id: "dupla-A",
          dupla2Id: "dupla-B",
          vencedoraId: undefined,
          status: StatusPartida.AGENDADA,
        }),
      ];

      const result = classificacaoService.verificarConfrontoDireto(
        partidas,
        "dupla-A",
        "dupla-B"
      );

      expect(result.vencedora).toBeNull();
    });
  });

  describe("buscarConfrontoDireto", () => {
    it("deve buscar confronto direto no repositório", async () => {
      const partida = createPartidaFinalizadaFixture();
      mockPartidaRepository.buscarConfrontoDireto.mockResolvedValue(partida);

      const result = await classificacaoService.buscarConfrontoDireto(
        TEST_IDS.grupo1,
        TEST_IDS.dupla1,
        TEST_IDS.dupla2
      );

      expect(mockPartidaRepository.buscarConfrontoDireto).toHaveBeenCalledWith(
        TEST_IDS.grupo1,
        TEST_IDS.dupla1,
        TEST_IDS.dupla2
      );
      expect(result).toEqual(partida);
    });

    it("deve retornar null se não houver confronto", async () => {
      mockPartidaRepository.buscarConfrontoDireto.mockResolvedValue(null);

      const result = await classificacaoService.buscarConfrontoDireto(
        TEST_IDS.grupo1,
        TEST_IDS.dupla1,
        "dupla-inexistente"
      );

      expect(result).toBeNull();
    });
  });

  describe("obterClassificacao", () => {
    it("deve retornar duplas ordenadas por classificação", async () => {
      const duplasOrdenadas = [
        createDuplaFixture({ id: "dupla-1", posicaoGrupo: 1, pontos: 9 }),
        createDuplaFixture({ id: "dupla-2", posicaoGrupo: 2, pontos: 6 }),
        createDuplaFixture({ id: "dupla-3", posicaoGrupo: 3, pontos: 3 }),
      ];
      mockDuplaRepository.buscarPorGrupoOrdenado.mockResolvedValue(
        duplasOrdenadas
      );

      const result = await classificacaoService.obterClassificacao(
        TEST_IDS.grupo1
      );

      expect(mockDuplaRepository.buscarPorGrupoOrdenado).toHaveBeenCalledWith(
        TEST_IDS.grupo1
      );
      expect(result).toHaveLength(3);
      expect(result[0].posicaoGrupo).toBe(1);
    });
  });

  describe("obterClassificados", () => {
    it("deve retornar N primeiros classificados", async () => {
      const classificados = [
        createDuplaFixture({ id: "dupla-1", posicaoGrupo: 1 }),
        createDuplaFixture({ id: "dupla-2", posicaoGrupo: 2 }),
      ];
      mockDuplaRepository.buscarClassificadasPorGrupo.mockResolvedValue(
        classificados
      );

      const result = await classificacaoService.obterClassificados(
        TEST_IDS.grupo1,
        2
      );

      expect(
        mockDuplaRepository.buscarClassificadasPorGrupo
      ).toHaveBeenCalledWith(TEST_IDS.grupo1, 2);
      expect(result).toHaveLength(2);
    });
  });

  describe("recalcularClassificacaoGrupo", () => {
    it("deve recalcular classificação e atualizar posições", async () => {
      const duplas = [
        createDuplaFixture({
          id: "dupla-1",
          pontos: 6,
          saldoGames: 5,
          jogador1Id: "j1",
          jogador2Id: "j2",
          etapaId: TEST_IDS.etapa,
        }),
        createDuplaFixture({
          id: "dupla-2",
          pontos: 9,
          saldoGames: 8,
          jogador1Id: "j3",
          jogador2Id: "j4",
          etapaId: TEST_IDS.etapa,
        }),
        createDuplaFixture({
          id: "dupla-3",
          pontos: 3,
          saldoGames: -3,
          jogador1Id: "j5",
          jogador2Id: "j6",
          etapaId: TEST_IDS.etapa,
        }),
      ];

      const partidas = [
        createPartidaFinalizadaFixture({ id: "partida-1" }),
        createPartidaFinalizadaFixture({ id: "partida-2" }),
        createPartidaFinalizadaFixture({ id: "partida-3" }),
      ];

      mockDuplaRepository.buscarPorGrupo.mockResolvedValue(duplas);
      mockPartidaRepository.buscarFinalizadasPorGrupo.mockResolvedValue(partidas);
      mockDuplaRepository.atualizarPosicaoGrupo.mockResolvedValue(undefined);
      (estatisticasJogadorService.atualizarPosicaoGrupo as jest.Mock).mockResolvedValue(undefined);
      mockGrupoRepository.atualizarContadores.mockResolvedValue(undefined);
      mockGrupoRepository.marcarCompleto.mockResolvedValue(undefined);

      await classificacaoService.recalcularClassificacaoGrupo(TEST_IDS.grupo1);

      expect(mockDuplaRepository.buscarPorGrupo).toHaveBeenCalledWith(
        TEST_IDS.grupo1
      );
      expect(mockPartidaRepository.buscarFinalizadasPorGrupo).toHaveBeenCalledWith(
        TEST_IDS.grupo1
      );

      // Deve atualizar posição para cada dupla
      expect(mockDuplaRepository.atualizarPosicaoGrupo).toHaveBeenCalledTimes(3);

      // Deve atualizar estatísticas de cada jogador (2 por dupla = 6 total)
      expect(estatisticasJogadorService.atualizarPosicaoGrupo).toHaveBeenCalledTimes(6);

      // Deve atualizar contadores
      expect(mockGrupoRepository.atualizarContadores).toHaveBeenCalled();
    });

    it("deve marcar grupo como completo quando todas partidas finalizadas", async () => {
      // 3 duplas = 3 partidas (combinação 2 a 2)
      const duplas = [
        createDuplaFixture({ id: "dupla-1", jogador1Id: "j1", jogador2Id: "j2", etapaId: TEST_IDS.etapa }),
        createDuplaFixture({ id: "dupla-2", jogador1Id: "j3", jogador2Id: "j4", etapaId: TEST_IDS.etapa }),
        createDuplaFixture({ id: "dupla-3", jogador1Id: "j5", jogador2Id: "j6", etapaId: TEST_IDS.etapa }),
      ];

      const partidas = [
        createPartidaFinalizadaFixture({ id: "partida-1" }),
        createPartidaFinalizadaFixture({ id: "partida-2" }),
        createPartidaFinalizadaFixture({ id: "partida-3" }),
      ];

      mockDuplaRepository.buscarPorGrupo.mockResolvedValue(duplas);
      mockPartidaRepository.buscarFinalizadasPorGrupo.mockResolvedValue(partidas);
      mockDuplaRepository.atualizarPosicaoGrupo.mockResolvedValue(undefined);
      (estatisticasJogadorService.atualizarPosicaoGrupo as jest.Mock).mockResolvedValue(undefined);
      mockGrupoRepository.atualizarContadores.mockResolvedValue(undefined);
      mockGrupoRepository.marcarCompleto.mockResolvedValue(undefined);

      await classificacaoService.recalcularClassificacaoGrupo(TEST_IDS.grupo1);

      expect(mockGrupoRepository.marcarCompleto).toHaveBeenCalledWith(
        TEST_IDS.grupo1,
        true
      );
    });

    it("deve propagar erro em caso de falha", async () => {
      mockDuplaRepository.buscarPorGrupo.mockRejectedValue(
        new Error("Erro de conexão")
      );

      await expect(
        classificacaoService.recalcularClassificacaoGrupo(TEST_IDS.grupo1)
      ).rejects.toThrow("Erro de conexão");
    });
  });
});
