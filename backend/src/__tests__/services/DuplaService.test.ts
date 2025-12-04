/**
 * Testes do DuplaService
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

jest.mock("../../services/CabecaDeChaveService", () => ({
  __esModule: true,
  default: {
    obterIdsCabecas: jest.fn(),
  },
}));

jest.mock("../../services/HistoricoDuplaService", () => ({
  __esModule: true,
  default: {
    calcularEstatisticas: jest.fn(),
    registrar: jest.fn(),
  },
}));

import { DuplaService } from "../../services/DuplaService";
import { createMockDuplaRepository } from "../mocks/repositories";
import cabecaDeChaveService from "../../services/CabecaDeChaveService";
import historicoDuplaService from "../../services/HistoricoDuplaService";
import {
  createDuplaFixture,
  createInscricaoFixture,
  TEST_IDS,
  NivelJogador,
  GeneroJogador,
} from "../fixtures";

describe("DuplaService", () => {
  let mockDuplaRepository: ReturnType<typeof createMockDuplaRepository>;
  let duplaService: DuplaService;

  const TEST_ARENA_ID = TEST_IDS.arena;
  const TEST_ETAPA_ID = TEST_IDS.etapa;

  beforeEach(() => {
    jest.clearAllMocks();

    mockDuplaRepository = createMockDuplaRepository();
    duplaService = new DuplaService(mockDuplaRepository);
  });

  describe("buscarPorEtapa", () => {
    it("deve retornar duplas de uma etapa", async () => {
      const duplas = [createDuplaFixture()];
      mockDuplaRepository.buscarPorEtapa.mockResolvedValue(duplas);

      const result = await duplaService.buscarPorEtapa(
        TEST_ETAPA_ID,
        TEST_ARENA_ID
      );

      expect(mockDuplaRepository.buscarPorEtapa).toHaveBeenCalledWith(
        TEST_ETAPA_ID,
        TEST_ARENA_ID
      );
      expect(result).toEqual(duplas);
    });

    it("deve retornar array vazio se não houver duplas", async () => {
      mockDuplaRepository.buscarPorEtapa.mockResolvedValue([]);

      const result = await duplaService.buscarPorEtapa(
        TEST_ETAPA_ID,
        TEST_ARENA_ID
      );

      expect(result).toEqual([]);
    });
  });

  describe("buscarPorGrupo", () => {
    it("deve retornar duplas de um grupo", async () => {
      const duplas = [createDuplaFixture(), createDuplaFixture({ id: "dupla-2" })];
      mockDuplaRepository.buscarPorGrupo.mockResolvedValue(duplas);

      const result = await duplaService.buscarPorGrupo(TEST_IDS.grupo1);

      expect(mockDuplaRepository.buscarPorGrupo).toHaveBeenCalledWith(
        TEST_IDS.grupo1
      );
      expect(result).toHaveLength(2);
    });
  });

  describe("buscarPorJogador", () => {
    it("deve retornar dupla do jogador", async () => {
      const dupla = createDuplaFixture();
      mockDuplaRepository.buscarPorJogador.mockResolvedValue(dupla);

      const result = await duplaService.buscarPorJogador(
        TEST_ETAPA_ID,
        TEST_IDS.jogador1
      );

      expect(mockDuplaRepository.buscarPorJogador).toHaveBeenCalledWith(
        TEST_ETAPA_ID,
        TEST_IDS.jogador1
      );
      expect(result).toEqual(dupla);
    });

    it("deve retornar null se jogador não tiver dupla", async () => {
      mockDuplaRepository.buscarPorJogador.mockResolvedValue(null);

      const result = await duplaService.buscarPorJogador(
        TEST_ETAPA_ID,
        "jogador-sem-dupla"
      );

      expect(result).toBeNull();
    });
  });

  describe("marcarClassificada", () => {
    it("deve marcar dupla como classificada", async () => {
      mockDuplaRepository.marcarClassificada.mockResolvedValue(undefined);

      await duplaService.marcarClassificada(TEST_IDS.dupla1, true);

      expect(mockDuplaRepository.marcarClassificada).toHaveBeenCalledWith(
        TEST_IDS.dupla1,
        true
      );
    });

    it("deve desmarcar dupla como classificada", async () => {
      mockDuplaRepository.marcarClassificada.mockResolvedValue(undefined);

      await duplaService.marcarClassificada(TEST_IDS.dupla1, false);

      expect(mockDuplaRepository.marcarClassificada).toHaveBeenCalledWith(
        TEST_IDS.dupla1,
        false
      );
    });
  });

  describe("marcarClassificadasEmLote", () => {
    it("deve marcar múltiplas duplas como classificadas", async () => {
      const duplaIds = [TEST_IDS.dupla1, TEST_IDS.dupla2];
      mockDuplaRepository.atualizarEmLote.mockResolvedValue(undefined);

      await duplaService.marcarClassificadasEmLote(duplaIds, true);

      expect(mockDuplaRepository.atualizarEmLote).toHaveBeenCalledWith([
        { id: TEST_IDS.dupla1, data: { classificada: true } },
        { id: TEST_IDS.dupla2, data: { classificada: true } },
      ]);
    });
  });

  describe("deletarPorEtapa", () => {
    it("deve deletar todas as duplas de uma etapa", async () => {
      mockDuplaRepository.deletarPorEtapa.mockResolvedValue(4);

      const result = await duplaService.deletarPorEtapa(
        TEST_ETAPA_ID,
        TEST_ARENA_ID
      );

      expect(mockDuplaRepository.deletarPorEtapa).toHaveBeenCalledWith(
        TEST_ETAPA_ID,
        TEST_ARENA_ID
      );
      expect(result).toBe(4);
    });

    it("deve retornar 0 se não houver duplas para deletar", async () => {
      mockDuplaRepository.deletarPorEtapa.mockResolvedValue(0);

      const result = await duplaService.deletarPorEtapa(
        TEST_ETAPA_ID,
        TEST_ARENA_ID
      );

      expect(result).toBe(0);
    });
  });

  describe("formarDuplasComCabecasDeChave", () => {
    it("deve formar duplas protegendo cabeças de chave", async () => {
      const inscricoes = [
        createInscricaoFixture({
          id: "inscricao-1",
          jogadorId: "jogador-1",
          jogadorNome: "Jogador 1",
          jogadorNivel: NivelJogador.INTERMEDIARIO,
          jogadorGenero: GeneroJogador.MASCULINO,
        }),
        createInscricaoFixture({
          id: "inscricao-2",
          jogadorId: "jogador-2",
          jogadorNome: "Jogador 2",
          jogadorNivel: NivelJogador.INTERMEDIARIO,
          jogadorGenero: GeneroJogador.MASCULINO,
        }),
        createInscricaoFixture({
          id: "inscricao-3",
          jogadorId: "jogador-3",
          jogadorNome: "Jogador 3",
          jogadorNivel: NivelJogador.INTERMEDIARIO,
          jogadorGenero: GeneroJogador.MASCULINO,
        }),
        createInscricaoFixture({
          id: "inscricao-4",
          jogadorId: "jogador-4",
          jogadorNome: "Jogador 4",
          jogadorNivel: NivelJogador.INTERMEDIARIO,
          jogadorGenero: GeneroJogador.MASCULINO,
        }),
      ];

      // Mock: jogador-1 é cabeça de chave
      (cabecaDeChaveService.obterIdsCabecas as jest.Mock).mockResolvedValue([
        "jogador-1",
      ]);

      (historicoDuplaService.calcularEstatisticas as jest.Mock).mockResolvedValue({
        todasCombinacoesFeitas: false,
        totalCombinacoesPossiveis: 6,
        combinacoesRealizadas: 0,
      });

      (historicoDuplaService.registrar as jest.Mock).mockResolvedValue(undefined);

      // Mock criar dupla - retorna uma dupla para cada chamada
      mockDuplaRepository.criar
        .mockResolvedValueOnce(
          createDuplaFixture({
            id: "dupla-1",
            jogador1Id: "jogador-1",
            jogador1Nome: "Jogador 1",
          })
        )
        .mockResolvedValueOnce(
          createDuplaFixture({
            id: "dupla-2",
            jogador1Id: "jogador-3",
            jogador1Nome: "Jogador 3",
          })
        );

      const result = await duplaService.formarDuplasComCabecasDeChave(
        TEST_ETAPA_ID,
        "Etapa Teste",
        TEST_ARENA_ID,
        inscricoes
      );

      expect(cabecaDeChaveService.obterIdsCabecas).toHaveBeenCalledWith(
        TEST_ARENA_ID,
        TEST_ETAPA_ID
      );
      expect(historicoDuplaService.calcularEstatisticas).toHaveBeenCalled();
      expect(mockDuplaRepository.criar).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);
    });

    it("deve lançar erro se número de jogadores for ímpar", async () => {
      const inscricoes = [
        createInscricaoFixture({ jogadorId: "jogador-1" }),
        createInscricaoFixture({ jogadorId: "jogador-2" }),
        createInscricaoFixture({ jogadorId: "jogador-3" }),
      ];

      (cabecaDeChaveService.obterIdsCabecas as jest.Mock).mockResolvedValue([]);
      (historicoDuplaService.calcularEstatisticas as jest.Mock).mockResolvedValue({
        todasCombinacoesFeitas: false,
      });

      await expect(
        duplaService.formarDuplasComCabecasDeChave(
          TEST_ETAPA_ID,
          "Etapa Teste",
          TEST_ARENA_ID,
          inscricoes
        )
      ).rejects.toThrow("Número ímpar de jogadores");
    });

    it("deve lançar erro se houver mais cabeças que jogadores normais", async () => {
      const inscricoes = [
        createInscricaoFixture({ jogadorId: "jogador-1" }),
        createInscricaoFixture({ jogadorId: "jogador-2" }),
        createInscricaoFixture({ jogadorId: "jogador-3" }),
        createInscricaoFixture({ jogadorId: "jogador-4" }),
      ];

      // 3 cabeças de chave, apenas 1 jogador normal
      (cabecaDeChaveService.obterIdsCabecas as jest.Mock).mockResolvedValue([
        "jogador-1",
        "jogador-2",
        "jogador-3",
      ]);

      (historicoDuplaService.calcularEstatisticas as jest.Mock).mockResolvedValue({
        todasCombinacoesFeitas: false,
      });

      await expect(
        duplaService.formarDuplasComCabecasDeChave(
          TEST_ETAPA_ID,
          "Etapa Teste",
          TEST_ARENA_ID,
          inscricoes
        )
      ).rejects.toThrow("Impossível formar duplas");
    });

    it("deve formar duplas livremente quando todas combinações de cabeças já foram feitas", async () => {
      const inscricoes = [
        createInscricaoFixture({ jogadorId: "jogador-1", jogadorNome: "J1" }),
        createInscricaoFixture({ jogadorId: "jogador-2", jogadorNome: "J2" }),
        createInscricaoFixture({ jogadorId: "jogador-3", jogadorNome: "J3" }),
        createInscricaoFixture({ jogadorId: "jogador-4", jogadorNome: "J4" }),
      ];

      (cabecaDeChaveService.obterIdsCabecas as jest.Mock).mockResolvedValue([
        "jogador-1",
        "jogador-2",
      ]);

      (historicoDuplaService.calcularEstatisticas as jest.Mock).mockResolvedValue({
        todasCombinacoesFeitas: true,
        totalCombinacoesPossiveis: 1,
        combinacoesRealizadas: 1,
      });

      (historicoDuplaService.registrar as jest.Mock).mockResolvedValue(undefined);

      mockDuplaRepository.criar
        .mockResolvedValueOnce(createDuplaFixture({ id: "dupla-1" }))
        .mockResolvedValueOnce(createDuplaFixture({ id: "dupla-2" }));

      const result = await duplaService.formarDuplasComCabecasDeChave(
        TEST_ETAPA_ID,
        "Etapa Teste",
        TEST_ARENA_ID,
        inscricoes
      );

      expect(result).toHaveLength(2);
      expect(mockDuplaRepository.criar).toHaveBeenCalledTimes(2);
    });
  });
});
