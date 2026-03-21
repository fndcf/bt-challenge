/**
 * Testes do ExcelSumulaService
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

// Mock dos repositories
const mockEtapaRepo = {
  buscarPorId: jest.fn(),
};

const mockGrupoRepo = {
  buscarPorEtapa: jest.fn(),
};

const mockPartidaRepo = {
  buscarPorEtapa: jest.fn(),
};

jest.mock("../../services/ServiceContainer", () => ({
  container: {
    repositories: {
      etapa: mockEtapaRepo,
      grupo: mockGrupoRepo,
      partida: mockPartidaRepo,
    },
  },
}));

const mockReiDaPraiaBuscarPorEtapa = jest.fn();
jest.mock("../../repositories/firebase/PartidaReiDaPraiaRepository", () => ({
  PartidaReiDaPraiaRepository: jest.fn(() => ({
    buscarPorEtapa: mockReiDaPraiaBuscarPorEtapa,
  })),
}));

const mockConfrontoBuscarPorEtapa = jest.fn();
jest.mock("../../repositories/firebase/ConfrontoEquipeRepository", () => ({
  ConfrontoEquipeRepository: jest.fn(() => ({
    buscarPorEtapa: mockConfrontoBuscarPorEtapa,
  })),
}));

jest.mock("../../repositories/firebase/JogadorRepository", () => ({
  JogadorRepository: jest.fn(),
}));

jest.mock("../../repositories/firebase/InscricaoRepository", () => ({
  InscricaoRepository: jest.fn(),
}));

import ExcelJS from "exceljs";
import excelSumulaService from "../../services/ExcelSumulaService";
import { FormatoEtapa, StatusEtapa } from "../../models/Etapa";

describe("ExcelSumulaService", () => {
  const TEST_ARENA_ID = "arena-test-001";
  const TEST_ETAPA_ID = "etapa-test-001";

  const criarEtapaMock = (formato: FormatoEtapa) => ({
    id: TEST_ETAPA_ID,
    arenaId: TEST_ARENA_ID,
    nome: "Etapa Teste",
    formato,
    status: StatusEtapa.INSCRICOES_ENCERRADAS,
    chavesGeradas: true,
    totalInscritos: 8,
    maxJogadores: 8,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("gerarSumula", () => {
    it("deve rejeitar quando etapa não existe", async () => {
      mockEtapaRepo.buscarPorId.mockResolvedValue(null);

      await expect(
        excelSumulaService.gerarSumula(TEST_ETAPA_ID, TEST_ARENA_ID)
      ).rejects.toThrow("Etapa não encontrada");
    });

    it("deve rejeitar quando etapa não pertence à arena", async () => {
      mockEtapaRepo.buscarPorId.mockResolvedValue(
        criarEtapaMock(FormatoEtapa.DUPLA_FIXA)
      );

      await expect(
        excelSumulaService.gerarSumula(TEST_ETAPA_ID, "outra-arena")
      ).rejects.toThrow("não pertence a esta arena");
    });

    it("deve rejeitar quando chaves não foram geradas", async () => {
      const etapa = { ...criarEtapaMock(FormatoEtapa.DUPLA_FIXA), chavesGeradas: false };
      mockEtapaRepo.buscarPorId.mockResolvedValue(etapa);

      await expect(
        excelSumulaService.gerarSumula(TEST_ETAPA_ID, TEST_ARENA_ID)
      ).rejects.toThrow("não foram geradas");
    });

    it("deve gerar súmula para Dupla Fixa", async () => {
      mockEtapaRepo.buscarPorId.mockResolvedValue(
        criarEtapaMock(FormatoEtapa.DUPLA_FIXA)
      );

      mockGrupoRepo.buscarPorEtapa.mockResolvedValue([
        { id: "g1", nome: "Grupo A", ordem: 1 },
        { id: "g2", nome: "Grupo B", ordem: 2 },
      ]);

      mockPartidaRepo.buscarPorEtapa.mockResolvedValue([
        {
          id: "p1",
          grupoId: "g1",
          fase: "grupos",
          dupla1Nome: "João / Maria",
          dupla2Nome: "Carlos / Ana",
          numero: 1,
        },
        {
          id: "p2",
          grupoId: "g2",
          fase: "grupos",
          dupla1Nome: "Pedro / Julia",
          dupla2Nome: "Lucas / Fernanda",
          numero: 1,
        },
      ]);

      const { buffer, nomeArquivo } = await excelSumulaService.gerarSumula(
        TEST_ETAPA_ID,
        TEST_ARENA_ID
      );

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
      expect(nomeArquivo).toBe("sumula-etapa-teste.xlsx");

      // Verificar conteúdo do Excel
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
      const worksheet = workbook.worksheets[0];

      expect(worksheet.name).toBe("Súmula - Fase de Grupos");

      const headerRow = worksheet.getRow(1);
      expect(headerRow.getCell(1).value).toBe("Grupo");
      expect(headerRow.getCell(3).value).toBe("Dupla 1");
      expect(headerRow.getCell(5).value).toBe("Dupla 2");

      const dataRow = worksheet.getRow(2);
      expect(dataRow.getCell(1).value).toBe("Grupo A");
      expect(dataRow.getCell(3).value).toBe("João / Maria");
      expect(dataRow.getCell(5).value).toBe("Carlos / Ana");
    });

    it("deve gerar súmula para Rei da Praia", async () => {
      mockEtapaRepo.buscarPorId.mockResolvedValue(
        criarEtapaMock(FormatoEtapa.REI_DA_PRAIA)
      );

      mockGrupoRepo.buscarPorEtapa.mockResolvedValue([
        { id: "g1", nome: "Grupo 1", ordem: 1 },
      ]);

      mockReiDaPraiaBuscarPorEtapa.mockResolvedValue([
        {
          id: "p1",
          grupoId: "g1",
          rodada: 1,
          jogador1ANome: "João",
          jogador1BNome: "Maria",
          jogador2ANome: "Carlos",
          jogador2BNome: "Ana",
        },
      ]);

      const { buffer } = await excelSumulaService.gerarSumula(
        TEST_ETAPA_ID,
        TEST_ARENA_ID
      );

      expect(buffer).toBeInstanceOf(Buffer);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
      const worksheet = workbook.worksheets[0];

      const dataRow = worksheet.getRow(2);
      expect(dataRow.getCell(1).value).toBe("Grupo 1");
      expect(dataRow.getCell(3).value).toBe("João / Maria");
      expect(dataRow.getCell(5).value).toBe("Carlos / Ana");
    });

    it("deve gerar súmula para Super X", async () => {
      mockEtapaRepo.buscarPorId.mockResolvedValue(
        criarEtapaMock(FormatoEtapa.SUPER_X)
      );

      mockReiDaPraiaBuscarPorEtapa.mockResolvedValue([
        {
          id: "p1",
          rodada: 1,
          jogador1ANome: "João",
          jogador1BNome: "Maria",
          jogador2ANome: "Carlos",
          jogador2BNome: "Ana",
        },
        {
          id: "p2",
          rodada: 2,
          jogador1ANome: "Pedro",
          jogador1BNome: "Julia",
          jogador2ANome: "Lucas",
          jogador2BNome: "Fernanda",
        },
      ]);

      const { buffer } = await excelSumulaService.gerarSumula(
        TEST_ETAPA_ID,
        TEST_ARENA_ID
      );

      expect(buffer).toBeInstanceOf(Buffer);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
      const worksheet = workbook.worksheets[0];

      expect(worksheet.name).toBe("Súmula");

      const row1 = worksheet.getRow(2);
      expect(row1.getCell(1).value).toBe("Rodada 1");

      const row2 = worksheet.getRow(4); // linha 3 é separador
      expect(row2.getCell(1).value).toBe("Rodada 2");
    });

    it("deve gerar súmula para TEAMS", async () => {
      mockEtapaRepo.buscarPorId.mockResolvedValue(
        criarEtapaMock(FormatoEtapa.TEAMS)
      );

      mockConfrontoBuscarPorEtapa.mockResolvedValue([
        {
          id: "c1",
          fase: "grupos",
          rodada: 1,
          grupoNome: "Grupo A",
          equipe1Nome: "Time Alpha",
          equipe2Nome: "Time Beta",
        },
        {
          id: "c2",
          fase: "eliminatoria",
          rodada: 1,
          equipe1Nome: "Time Alpha",
          equipe2Nome: "Time Gamma",
        },
      ]);

      const { buffer } = await excelSumulaService.gerarSumula(
        TEST_ETAPA_ID,
        TEST_ARENA_ID
      );

      expect(buffer).toBeInstanceOf(Buffer);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
      const worksheet = workbook.worksheets[0];

      // Só deve ter confrontos da fase de grupos
      expect(worksheet.rowCount).toBe(2); // header + 1 confronto (eliminatória filtrada)

      const dataRow = worksheet.getRow(2);
      expect(dataRow.getCell(1).value).toBe("Grupo A");
      expect(dataRow.getCell(3).value).toBe("Time Alpha");
      expect(dataRow.getCell(5).value).toBe("Time Beta");
    });

    it("deve gerar nome de arquivo sem espaços", async () => {
      const etapa = {
        ...criarEtapaMock(FormatoEtapa.DUPLA_FIXA),
        nome: "Etapa de Verão 2026",
      };
      mockEtapaRepo.buscarPorId.mockResolvedValue(etapa);
      mockGrupoRepo.buscarPorEtapa.mockResolvedValue([]);
      mockPartidaRepo.buscarPorEtapa.mockResolvedValue([]);

      const { nomeArquivo } = await excelSumulaService.gerarSumula(
        TEST_ETAPA_ID,
        TEST_ARENA_ID
      );

      expect(nomeArquivo).toBe("sumula-etapa-de-verão-2026.xlsx");
    });
  });
});
