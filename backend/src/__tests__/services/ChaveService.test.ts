/**
 * Testes do ChaveService
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

// Mock recursivo para where chain
const mockWhereChain: any = {
  where: jest.fn(() => mockWhereChain),
  get: jest.fn(() => Promise.resolve({ empty: true, docs: [] })),
};

jest.mock("../../config/firebase", () => ({
  db: {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        update: jest.fn(),
      })),
      where: jest.fn(() => mockWhereChain),
    })),
    batch: jest.fn(() => ({
      delete: jest.fn(),
      commit: jest.fn(),
    })),
  },
  auth: { verifyIdToken: jest.fn() },
}));

// Mock dos services especializados
const mockDuplaService = {
  formarDuplasComCabecasDeChave: jest.fn(),
  buscarPorEtapa: jest.fn(),
  deletarPorEtapa: jest.fn(),
};

const mockGrupoService = {
  criarGrupos: jest.fn(),
  buscarPorEtapa: jest.fn(),
  deletarPorEtapa: jest.fn(),
};

const mockPartidaGrupoService = {
  gerarPartidas: jest.fn(),
  buscarPorEtapa: jest.fn(),
  registrarResultado: jest.fn(),
};

const mockEliminatoriaService = {
  gerarFaseEliminatoria: jest.fn(),
  registrarResultado: jest.fn(),
  buscarConfrontos: jest.fn(),
  cancelarFaseEliminatoria: jest.fn(),
};

jest.mock("../../services/EtapaService", () => ({
  __esModule: true,
  default: {
    buscarPorId: jest.fn(),
    listarInscricoes: jest.fn(),
  },
}));

jest.mock("../../services/EstatisticasJogadorService", () => ({
  __esModule: true,
  default: {
    criar: jest.fn(),
  },
}));

jest.mock("../../services/HistoricoDuplaService", () => ({
  __esModule: true,
  default: {
    limparDaEtapa: jest.fn(),
  },
}));

import { ChaveService } from "../../services/ChaveService";
import etapaService from "../../services/EtapaService";
import estatisticasJogadorService from "../../services/EstatisticasJogadorService";
import historicoDuplaService from "../../services/HistoricoDuplaService";
import {
  createEtapaFixture,
  createDuplaFixture,
  createGrupoFixture,
  createPartidaFixture,
  createConfrontoFixture,
  createInscricaoFixture,
  TEST_IDS,
  StatusEtapa,
  TipoFase,
} from "../fixtures";

describe("ChaveService", () => {
  let chaveService: ChaveService;

  const TEST_ARENA_ID = TEST_IDS.arena;
  const TEST_ETAPA_ID = TEST_IDS.etapa;

  beforeEach(() => {
    jest.clearAllMocks();

    chaveService = new ChaveService(
      mockDuplaService as any,
      mockGrupoService as any,
      mockPartidaGrupoService as any,
      mockEliminatoriaService as any
    );
  });

  describe("buscarDuplas", () => {
    it("deve buscar duplas de uma etapa", async () => {
      const duplas = [createDuplaFixture()];
      mockDuplaService.buscarPorEtapa.mockResolvedValue(duplas);

      const result = await chaveService.buscarDuplas(TEST_ETAPA_ID, TEST_ARENA_ID);

      expect(mockDuplaService.buscarPorEtapa).toHaveBeenCalledWith(
        TEST_ETAPA_ID,
        TEST_ARENA_ID
      );
      expect(result).toEqual(duplas);
    });
  });

  describe("buscarGrupos", () => {
    it("deve buscar grupos de uma etapa", async () => {
      const grupos = [createGrupoFixture()];
      mockGrupoService.buscarPorEtapa.mockResolvedValue(grupos);

      const result = await chaveService.buscarGrupos(TEST_ETAPA_ID, TEST_ARENA_ID);

      expect(mockGrupoService.buscarPorEtapa).toHaveBeenCalledWith(
        TEST_ETAPA_ID,
        TEST_ARENA_ID
      );
      expect(result).toEqual(grupos);
    });
  });

  describe("buscarPartidas", () => {
    it("deve buscar partidas de uma etapa", async () => {
      const partidas = [createPartidaFixture()];
      mockPartidaGrupoService.buscarPorEtapa.mockResolvedValue(partidas);

      const result = await chaveService.buscarPartidas(TEST_ETAPA_ID, TEST_ARENA_ID);

      expect(mockPartidaGrupoService.buscarPorEtapa).toHaveBeenCalledWith(
        TEST_ETAPA_ID,
        TEST_ARENA_ID
      );
      expect(result).toEqual(partidas);
    });
  });

  describe("buscarConfrontosEliminatorios", () => {
    it("deve buscar todos os confrontos eliminatórios", async () => {
      const confrontos = [createConfrontoFixture()];
      mockEliminatoriaService.buscarConfrontos.mockResolvedValue(confrontos);

      const result = await chaveService.buscarConfrontosEliminatorios(
        TEST_ETAPA_ID,
        TEST_ARENA_ID
      );

      expect(mockEliminatoriaService.buscarConfrontos).toHaveBeenCalledWith(
        TEST_ETAPA_ID,
        TEST_ARENA_ID,
        undefined
      );
      expect(result).toEqual(confrontos);
    });

    it("deve buscar confrontos de uma fase específica", async () => {
      const confrontos = [createConfrontoFixture({ fase: TipoFase.SEMIFINAL })];
      mockEliminatoriaService.buscarConfrontos.mockResolvedValue(confrontos);

      const result = await chaveService.buscarConfrontosEliminatorios(
        TEST_ETAPA_ID,
        TEST_ARENA_ID,
        TipoFase.SEMIFINAL
      );

      expect(mockEliminatoriaService.buscarConfrontos).toHaveBeenCalledWith(
        TEST_ETAPA_ID,
        TEST_ARENA_ID,
        TipoFase.SEMIFINAL
      );
      expect(result).toEqual(confrontos);
    });
  });

  describe("gerarFaseEliminatoria", () => {
    it("deve delegar para eliminatoriaService", async () => {
      const confrontos = [createConfrontoFixture()];
      mockEliminatoriaService.gerarFaseEliminatoria.mockResolvedValue({ confrontos });

      const result = await chaveService.gerarFaseEliminatoria(
        TEST_ETAPA_ID,
        TEST_ARENA_ID,
        2
      );

      expect(mockEliminatoriaService.gerarFaseEliminatoria).toHaveBeenCalledWith(
        TEST_ETAPA_ID,
        TEST_ARENA_ID,
        2
      );
      expect(result.confrontos).toEqual(confrontos);
    });
  });

  describe("registrarResultadoEliminatorio", () => {
    it("deve delegar para eliminatoriaService", async () => {
      mockEliminatoriaService.registrarResultado.mockResolvedValue(undefined);

      const placar = [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }];

      await chaveService.registrarResultadoEliminatorio(
        TEST_IDS.confronto1,
        TEST_ARENA_ID,
        placar
      );

      expect(mockEliminatoriaService.registrarResultado).toHaveBeenCalledWith(
        TEST_IDS.confronto1,
        TEST_ARENA_ID,
        placar
      );
    });
  });

  describe("cancelarFaseEliminatoria", () => {
    it("deve delegar para eliminatoriaService", async () => {
      mockEliminatoriaService.cancelarFaseEliminatoria.mockResolvedValue(undefined);

      await chaveService.cancelarFaseEliminatoria(TEST_ETAPA_ID, TEST_ARENA_ID);

      expect(mockEliminatoriaService.cancelarFaseEliminatoria).toHaveBeenCalledWith(
        TEST_ETAPA_ID,
        TEST_ARENA_ID
      );
    });
  });

  describe("gerarChaves", () => {
    it("deve lançar erro se etapa não encontrada", async () => {
      (etapaService.buscarPorId as jest.Mock).mockResolvedValue(null);

      await expect(
        chaveService.gerarChaves(TEST_ETAPA_ID, TEST_ARENA_ID)
      ).rejects.toThrow("Etapa não encontrada");
    });

    it("deve lançar erro se inscrições não estão encerradas", async () => {
      const etapa = createEtapaFixture({
        status: StatusEtapa.INSCRICOES_ABERTAS,
      });
      (etapaService.buscarPorId as jest.Mock).mockResolvedValue(etapa);

      await expect(
        chaveService.gerarChaves(TEST_ETAPA_ID, TEST_ARENA_ID)
      ).rejects.toThrow("Inscrições devem estar encerradas para gerar chaves");
    });

    it("deve lançar erro se chaves já foram geradas", async () => {
      const etapa = createEtapaFixture({
        status: StatusEtapa.INSCRICOES_ENCERRADAS,
        chavesGeradas: true,
      });
      (etapaService.buscarPorId as jest.Mock).mockResolvedValue(etapa);

      await expect(
        chaveService.gerarChaves(TEST_ETAPA_ID, TEST_ARENA_ID)
      ).rejects.toThrow("Chaves já foram geradas para esta etapa");
    });

    it("deve lançar erro se menos de 4 jogadores", async () => {
      const etapa = createEtapaFixture({
        status: StatusEtapa.INSCRICOES_ENCERRADAS,
        chavesGeradas: false,
        totalInscritos: 2,
      });
      (etapaService.buscarPorId as jest.Mock).mockResolvedValue(etapa);

      await expect(
        chaveService.gerarChaves(TEST_ETAPA_ID, TEST_ARENA_ID)
      ).rejects.toThrow("Necessário no mínimo 4 jogadores inscritos");
    });

    it("deve lançar erro se número de jogadores é ímpar", async () => {
      const etapa = createEtapaFixture({
        status: StatusEtapa.INSCRICOES_ENCERRADAS,
        chavesGeradas: false,
        totalInscritos: 5,
      });
      (etapaService.buscarPorId as jest.Mock).mockResolvedValue(etapa);

      await expect(
        chaveService.gerarChaves(TEST_ETAPA_ID, TEST_ARENA_ID)
      ).rejects.toThrow("Número de jogadores deve ser par");
    });

    it("deve lançar erro se total inscritos diferente do máximo", async () => {
      const etapa = createEtapaFixture({
        status: StatusEtapa.INSCRICOES_ENCERRADAS,
        chavesGeradas: false,
        totalInscritos: 8,
        maxJogadores: 16,
      });
      (etapaService.buscarPorId as jest.Mock).mockResolvedValue(etapa);

      await expect(
        chaveService.gerarChaves(TEST_ETAPA_ID, TEST_ARENA_ID)
      ).rejects.toThrow("Esta etapa está configurada para 16 jogadores");
    });

    it("deve gerar chaves com sucesso", async () => {
      const etapa = createEtapaFixture({
        status: StatusEtapa.INSCRICOES_ENCERRADAS,
        chavesGeradas: false,
        totalInscritos: 8,
        maxJogadores: 8,
      });
      (etapaService.buscarPorId as jest.Mock).mockResolvedValue(etapa);

      const inscricoes = [
        createInscricaoFixture({ jogadorId: "j1" }),
        createInscricaoFixture({ jogadorId: "j2" }),
        createInscricaoFixture({ jogadorId: "j3" }),
        createInscricaoFixture({ jogadorId: "j4" }),
        createInscricaoFixture({ jogadorId: "j5" }),
        createInscricaoFixture({ jogadorId: "j6" }),
        createInscricaoFixture({ jogadorId: "j7" }),
        createInscricaoFixture({ jogadorId: "j8" }),
      ];
      (etapaService.listarInscricoes as jest.Mock).mockResolvedValue(inscricoes);

      const duplas = [
        createDuplaFixture({ id: "d1" }),
        createDuplaFixture({ id: "d2" }),
        createDuplaFixture({ id: "d3" }),
        createDuplaFixture({ id: "d4" }),
      ];
      mockDuplaService.formarDuplasComCabecasDeChave.mockResolvedValue(duplas);

      (estatisticasJogadorService.criar as jest.Mock).mockResolvedValue(undefined);

      const grupos = [
        createGrupoFixture({ id: "g1" }),
        createGrupoFixture({ id: "g2" }),
      ];
      mockGrupoService.criarGrupos.mockResolvedValue(grupos);

      const partidas = [
        createPartidaFixture({ id: "p1" }),
        createPartidaFixture({ id: "p2" }),
      ];
      mockPartidaGrupoService.gerarPartidas.mockResolvedValue(partidas);

      const result = await chaveService.gerarChaves(TEST_ETAPA_ID, TEST_ARENA_ID);

      expect(result.duplas).toHaveLength(4);
      expect(result.grupos).toHaveLength(2);
      expect(result.partidas).toHaveLength(2);

      expect(mockDuplaService.formarDuplasComCabecasDeChave).toHaveBeenCalled();
      expect(mockGrupoService.criarGrupos).toHaveBeenCalled();
      expect(mockPartidaGrupoService.gerarPartidas).toHaveBeenCalled();
      expect(estatisticasJogadorService.criar).toHaveBeenCalledTimes(8); // 4 duplas x 2 jogadores
    });
  });

  describe("excluirChaves", () => {
    it("deve lançar erro se etapa não encontrada", async () => {
      (etapaService.buscarPorId as jest.Mock).mockResolvedValue(null);

      await expect(
        chaveService.excluirChaves(TEST_ETAPA_ID, TEST_ARENA_ID)
      ).rejects.toThrow("Etapa não encontrada");
    });

    it("deve lançar erro se etapa não possui chaves geradas", async () => {
      const etapa = createEtapaFixture({
        chavesGeradas: false,
      });
      (etapaService.buscarPorId as jest.Mock).mockResolvedValue(etapa);

      await expect(
        chaveService.excluirChaves(TEST_ETAPA_ID, TEST_ARENA_ID)
      ).rejects.toThrow("Esta etapa não possui chaves geradas");
    });

    it("deve excluir chaves com sucesso", async () => {
      const etapa = createEtapaFixture({
        chavesGeradas: true,
      });
      (etapaService.buscarPorId as jest.Mock).mockResolvedValue(etapa);

      mockEliminatoriaService.cancelarFaseEliminatoria.mockRejectedValue(
        new Error("Nenhuma fase")
      );
      mockGrupoService.deletarPorEtapa.mockResolvedValue(2);
      mockDuplaService.deletarPorEtapa.mockResolvedValue(4);
      (historicoDuplaService.limparDaEtapa as jest.Mock).mockResolvedValue(undefined);

      await chaveService.excluirChaves(TEST_ETAPA_ID, TEST_ARENA_ID);

      expect(mockGrupoService.deletarPorEtapa).toHaveBeenCalledWith(
        TEST_ETAPA_ID,
        TEST_ARENA_ID
      );
      expect(mockDuplaService.deletarPorEtapa).toHaveBeenCalledWith(
        TEST_ETAPA_ID,
        TEST_ARENA_ID
      );
      expect(historicoDuplaService.limparDaEtapa).toHaveBeenCalledWith(
        TEST_ARENA_ID,
        TEST_ETAPA_ID
      );
    });
  });
});
