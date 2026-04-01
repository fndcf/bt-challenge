/**
 * Testes do ExcelJogadorService
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

const mockBatchSet = jest.fn();
const mockBatchCommit = jest.fn().mockResolvedValue(undefined);
const mockDocRef = { id: "batch-doc-id" };

jest.mock("../../config/firebase", () => ({
  db: {
    collection: jest.fn(() => ({
      doc: jest.fn(() => mockDocRef),
    })),
    batch: jest.fn(() => ({
      set: mockBatchSet,
      commit: mockBatchCommit,
    })),
  },
  auth: { verifyIdToken: jest.fn() },
}));

jest.mock("../../repositories/firebase/JogadorRepository", () => ({
  JogadorRepository: jest.fn(),
}));

jest.mock("../../repositories/firebase/InscricaoRepository", () => ({
  InscricaoRepository: jest.fn(),
}));

import ExcelJS from "exceljs";
import {
  createJogadorFixture,
  NivelJogador,
  GeneroJogador,
  StatusJogador,
} from "../fixtures";

// Importar a classe diretamente para poder injetar mocks
// ExcelJogadorService depende do jogadorService singleton, vamos mockar via módulo
jest.mock("../../services/JogadorService", () => {
  const mockService = {
    listar: jest.fn(),
    criar: jest.fn(),
  };
  return {
    JogadorService: jest.fn(() => mockService),
    __esModule: true,
    default: mockService,
  };
});

import jogadorService from "../../services/JogadorService";
import excelJogadorService from "../../services/ExcelJogadorService";

const mockedJogadorService = jogadorService as jest.Mocked<typeof jogadorService>;

describe("ExcelJogadorService", () => {
  const TEST_ARENA_ID = "arena-test-001";
  const TEST_ADMIN_ID = "admin-test-001";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("exportarParaExcel", () => {
    it("deve exportar jogadores para buffer Excel", async () => {
      const jogadores = [
        createJogadorFixture({
          id: "j1",
          nome: "João Silva",
          genero: GeneroJogador.MASCULINO,
          nivel: NivelJogador.AVANCADO,
          status: StatusJogador.ATIVO,
          email: "joao@test.com",
        }),
        createJogadorFixture({
          id: "j2",
          nome: "Maria Santos",
          genero: GeneroJogador.FEMININO,
          nivel: NivelJogador.INICIANTE,
          status: StatusJogador.ATIVO,
        }),
      ];

      mockedJogadorService.listar.mockResolvedValue({
        jogadores,
        total: 2,
        limite: 10000,
        offset: 0,
        temMais: false,
      });

      const buffer = await excelJogadorService.exportarParaExcel(TEST_ARENA_ID);

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
      expect(mockedJogadorService.listar).toHaveBeenCalledWith(
        expect.objectContaining({
          arenaId: TEST_ARENA_ID,
          limite: 10000,
        })
      );

      // Verificar conteúdo do Excel
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
      const worksheet = workbook.worksheets[0];

      expect(worksheet.name).toBe("Jogadores");
      expect(worksheet.rowCount).toBe(3); // header + 2 jogadores

      // Verificar header
      const headerRow = worksheet.getRow(1);
      expect(headerRow.getCell(1).value).toBe("Nome Completo");
      expect(headerRow.getCell(5).value).toBe("Genero");
      expect(headerRow.getCell(6).value).toBe("Nivel");

      // Verificar dados
      const row1 = worksheet.getRow(2);
      expect(row1.getCell(1).value).toBe("João Silva");
      expect(row1.getCell(5).value).toBe("Masculino");
      expect(row1.getCell(6).value).toBe("Avançado");
    });

    it("deve exportar planilha vazia quando não há jogadores", async () => {
      mockedJogadorService.listar.mockResolvedValue({
        jogadores: [],
        total: 0,
        limite: 10000,
        offset: 0,
        temMais: false,
      });

      const buffer = await excelJogadorService.exportarParaExcel(TEST_ARENA_ID);
      expect(buffer).toBeInstanceOf(Buffer);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
      const worksheet = workbook.worksheets[0];

      expect(worksheet.rowCount).toBe(1); // apenas header
    });
  });

  describe("importarDeExcel", () => {
    const criarPlanilha = async (
      rows: Record<string, string>[]
    ): Promise<Buffer> => {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Jogadores");

      worksheet.columns = [
        { header: "Nome Completo", key: "nome" },
        { header: "Email", key: "email" },
        { header: "Telefone", key: "telefone" },
        { header: "Data de Nascimento", key: "dataNascimento" },
        { header: "Genero", key: "genero" },
        { header: "Nivel", key: "nivel" },
        { header: "Observacoes", key: "observacoes" },
      ];

      for (const row of rows) {
        worksheet.addRow(row);
      }

      const buffer = await workbook.xlsx.writeBuffer();
      return Buffer.from(buffer);
    };

    it("deve importar jogadores válidos com sucesso", async () => {
      const buffer = await criarPlanilha([
        { nome: "Carlos Souza", genero: "Masculino", nivel: "Iniciante" },
        { nome: "Ana Paula", genero: "Feminino", nivel: "Avançado", email: "ana@test.com" },
      ]);

      mockedJogadorService.listar.mockResolvedValue({
        jogadores: [],
        total: 0,
        limite: 10000,
        offset: 0,
        temMais: false,
      });

      const resultado = await excelJogadorService.importarDeExcel(
        TEST_ARENA_ID,
        TEST_ADMIN_ID,
        buffer
      );

      expect(resultado.criados).toBe(2);
      expect(mockBatchSet).toHaveBeenCalledTimes(2);
      expect(mockBatchCommit).toHaveBeenCalledTimes(1);

      // Verificar primeiro jogador no batch
      expect(mockBatchSet).toHaveBeenCalledWith(
        mockDocRef,
        expect.objectContaining({
          nome: "Carlos Souza",
          genero: GeneroJogador.MASCULINO,
          nivel: NivelJogador.INICIANTE,
          arenaId: TEST_ARENA_ID,
          criadoPor: TEST_ADMIN_ID,
        })
      );
    });

    it("deve aceitar variações de gênero (M, F, masculino, feminino)", async () => {
      const buffer = await criarPlanilha([
        { nome: "Jogador Um", genero: "M", nivel: "Iniciante" },
        { nome: "Jogador Dois", genero: "F", nivel: "Iniciante" },
        { nome: "Jogador Três", genero: "masculino", nivel: "Iniciante" },
        { nome: "Jogador Quatro", genero: "feminino", nivel: "Iniciante" },
      ]);

      mockedJogadorService.listar.mockResolvedValue({
        jogadores: [],
        total: 0,
        limite: 10000,
        offset: 0,
        temMais: false,
      });

      const resultado = await excelJogadorService.importarDeExcel(
        TEST_ARENA_ID,
        TEST_ADMIN_ID,
        buffer
      );

      expect(resultado.criados).toBe(4);
    });

    it("deve aceitar variações de nível (intermediário, avançado)", async () => {
      const buffer = await criarPlanilha([
        { nome: "Jogador Um", genero: "M", nivel: "Intermediário" },
        { nome: "Jogador Dois", genero: "M", nivel: "intermediario" },
        { nome: "Jogador Três", genero: "M", nivel: "Avançado" },
        { nome: "Jogador Quatro", genero: "M", nivel: "avancado" },
      ]);

      mockedJogadorService.listar.mockResolvedValue({
        jogadores: [],
        total: 0,
        limite: 10000,
        offset: 0,
        temMais: false,
      });

      const resultado = await excelJogadorService.importarDeExcel(
        TEST_ARENA_ID,
        TEST_ADMIN_ID,
        buffer
      );

      expect(resultado.criados).toBe(4);
    });

    it("deve rejeitar quando colunas obrigatórias estão ausentes", async () => {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Jogadores");
      worksheet.columns = [
        { header: "Nome Completo", key: "nome" },
        { header: "Email", key: "email" },
      ];
      worksheet.addRow({ nome: "Teste", email: "test@test.com" });

      const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

      await expect(
        excelJogadorService.importarDeExcel(TEST_ARENA_ID, TEST_ADMIN_ID, buffer)
      ).rejects.toThrow("Colunas obrigatórias ausentes");
    });

    it("deve rejeitar quando planilha está vazia", async () => {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Jogadores");
      worksheet.columns = [
        { header: "Nome Completo", key: "nome" },
        { header: "Genero", key: "genero" },
        { header: "Nivel", key: "nivel" },
      ];

      const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

      await expect(
        excelJogadorService.importarDeExcel(TEST_ARENA_ID, TEST_ADMIN_ID, buffer)
      ).rejects.toThrow("não contém dados");
    });

    it("deve rejeitar nome com menos de 3 caracteres", async () => {
      const buffer = await criarPlanilha([
        { nome: "AB", genero: "M", nivel: "Iniciante" },
      ]);

      await expect(
        excelJogadorService.importarDeExcel(TEST_ARENA_ID, TEST_ADMIN_ID, buffer)
      ).rejects.toThrow("mínimo 3 caracteres");
    });

    it("deve rejeitar gênero inválido", async () => {
      const buffer = await criarPlanilha([
        { nome: "Jogador Teste", genero: "Outro", nivel: "Iniciante" },
      ]);

      await expect(
        excelJogadorService.importarDeExcel(TEST_ARENA_ID, TEST_ADMIN_ID, buffer)
      ).rejects.toThrow('Gênero inválido "Outro"');
    });

    it("deve rejeitar nível inválido", async () => {
      const buffer = await criarPlanilha([
        { nome: "Jogador Teste", genero: "M", nivel: "Profissional" },
      ]);

      await expect(
        excelJogadorService.importarDeExcel(TEST_ARENA_ID, TEST_ADMIN_ID, buffer)
      ).rejects.toThrow('Nível inválido "Profissional"');
    });

    it("deve rejeitar email inválido", async () => {
      const buffer = await criarPlanilha([
        { nome: "Jogador Teste", genero: "M", nivel: "Iniciante", email: "invalido" },
      ]);

      await expect(
        excelJogadorService.importarDeExcel(TEST_ARENA_ID, TEST_ADMIN_ID, buffer)
      ).rejects.toThrow('Email inválido "invalido"');
    });

    it("deve rejeitar nomes duplicados na planilha", async () => {
      const buffer = await criarPlanilha([
        { nome: "João Silva", genero: "M", nivel: "Iniciante" },
        { nome: "João Silva", genero: "M", nivel: "Avançado" },
      ]);

      mockedJogadorService.listar.mockResolvedValue({
        jogadores: [],
        total: 0,
        limite: 10000,
        offset: 0,
        temMais: false,
      });

      await expect(
        excelJogadorService.importarDeExcel(TEST_ARENA_ID, TEST_ADMIN_ID, buffer)
      ).rejects.toThrow("duplicados na planilha");
    });

    it("deve rejeitar quando todos os jogadores já existem na arena", async () => {
      const buffer = await criarPlanilha([
        { nome: "João Silva", genero: "M", nivel: "Iniciante" },
      ]);

      mockedJogadorService.listar.mockResolvedValue({
        jogadores: [
          createJogadorFixture({ id: "existente", nome: "João Silva" }),
        ],
        total: 1,
        limite: 10000,
        offset: 0,
        temMais: false,
      });

      await expect(
        excelJogadorService.importarDeExcel(TEST_ARENA_ID, TEST_ADMIN_ID, buffer)
      ).rejects.toThrow("Todos os jogadores da planilha já existem na arena");
    });

    it("deve rejeitar quando todos os jogadores já existem (case insensitive)", async () => {
      const buffer = await criarPlanilha([
        { nome: "JOÃO SILVA", genero: "M", nivel: "Iniciante" },
      ]);

      mockedJogadorService.listar.mockResolvedValue({
        jogadores: [
          createJogadorFixture({ id: "existente", nome: "joão silva" }),
        ],
        total: 1,
        limite: 10000,
        offset: 0,
        temMais: false,
      });

      await expect(
        excelJogadorService.importarDeExcel(TEST_ARENA_ID, TEST_ADMIN_ID, buffer)
      ).rejects.toThrow("Todos os jogadores da planilha já existem na arena");
    });

    it("deve importar novos e ignorar duplicados existentes", async () => {
      const buffer = await criarPlanilha([
        { nome: "João Silva", genero: "M", nivel: "Iniciante" },
        { nome: "Carlos Souza", genero: "M", nivel: "Avançado" },
        { nome: "Ana Paula", genero: "F", nivel: "Intermediário" },
      ]);

      mockedJogadorService.listar.mockResolvedValue({
        jogadores: [
          createJogadorFixture({ id: "existente", nome: "João Silva" }),
        ],
        total: 1,
        limite: 10000,
        offset: 0,
        temMais: false,
      });

      const resultado = await excelJogadorService.importarDeExcel(
        TEST_ARENA_ID,
        TEST_ADMIN_ID,
        buffer
      );

      expect(resultado.criados).toBe(2);
      expect(resultado.ignorados).toEqual(["João Silva"]);
      expect(mockBatchSet).toHaveBeenCalledTimes(2);
    });
  });
});
