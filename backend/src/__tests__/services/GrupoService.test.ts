/**
 * Testes do GrupoService
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

jest.mock("../../repositories/firebase/GrupoRepository", () => ({
  GrupoRepository: jest.fn(),
  grupoRepository: {},
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

import { GrupoService } from "../../services/GrupoService";
import {
  createMockGrupoRepository,
  createMockDuplaRepository,
} from "../mocks/repositories";
import cabecaDeChaveService from "../../services/CabecaDeChaveService";
import {
  createGrupoFixture,
  createDuplaFixture,
  TEST_IDS,
} from "../fixtures";

describe("GrupoService", () => {
  let mockGrupoRepository: ReturnType<typeof createMockGrupoRepository>;
  let mockDuplaRepository: ReturnType<typeof createMockDuplaRepository>;
  let grupoService: GrupoService;

  const TEST_ARENA_ID = TEST_IDS.arena;
  const TEST_ETAPA_ID = TEST_IDS.etapa;

  beforeEach(() => {
    jest.clearAllMocks();

    mockGrupoRepository = createMockGrupoRepository();
    mockDuplaRepository = createMockDuplaRepository();
    grupoService = new GrupoService(mockGrupoRepository, mockDuplaRepository);
  });

  describe("buscarPorEtapa", () => {
    it("deve retornar grupos de uma etapa ordenados", async () => {
      const grupos = [
        createGrupoFixture({ id: "grupo-1", nome: "Grupo A", ordem: 1 }),
        createGrupoFixture({ id: "grupo-2", nome: "Grupo B", ordem: 2 }),
      ];
      mockGrupoRepository.buscarPorEtapaOrdenado.mockResolvedValue(grupos);

      const result = await grupoService.buscarPorEtapa(
        TEST_ETAPA_ID,
        TEST_ARENA_ID
      );

      expect(mockGrupoRepository.buscarPorEtapaOrdenado).toHaveBeenCalledWith(
        TEST_ETAPA_ID,
        TEST_ARENA_ID
      );
      expect(result).toHaveLength(2);
      expect(result[0].nome).toBe("Grupo A");
    });

    it("deve retornar array vazio se não houver grupos", async () => {
      mockGrupoRepository.buscarPorEtapaOrdenado.mockResolvedValue([]);

      const result = await grupoService.buscarPorEtapa(
        TEST_ETAPA_ID,
        TEST_ARENA_ID
      );

      expect(result).toEqual([]);
    });
  });

  describe("buscarPorId", () => {
    it("deve retornar grupo quando encontrado", async () => {
      const grupo = createGrupoFixture();
      mockGrupoRepository.buscarPorId.mockResolvedValue(grupo);

      const result = await grupoService.buscarPorId(TEST_IDS.grupo1);

      expect(mockGrupoRepository.buscarPorId).toHaveBeenCalledWith(
        TEST_IDS.grupo1
      );
      expect(result).toEqual(grupo);
    });

    it("deve retornar null quando grupo não encontrado", async () => {
      mockGrupoRepository.buscarPorId.mockResolvedValue(null);

      const result = await grupoService.buscarPorId("grupo-inexistente");

      expect(result).toBeNull();
    });
  });

  describe("verificarTodosCompletos", () => {
    it("deve retornar true quando todos os grupos estão completos", async () => {
      mockGrupoRepository.todosCompletos.mockResolvedValue(true);

      const result = await grupoService.verificarTodosCompletos(
        TEST_ETAPA_ID,
        TEST_ARENA_ID
      );

      expect(mockGrupoRepository.todosCompletos).toHaveBeenCalledWith(
        TEST_ETAPA_ID,
        TEST_ARENA_ID
      );
      expect(result).toBe(true);
    });

    it("deve retornar false quando há grupos incompletos", async () => {
      mockGrupoRepository.todosCompletos.mockResolvedValue(false);

      const result = await grupoService.verificarTodosCompletos(
        TEST_ETAPA_ID,
        TEST_ARENA_ID
      );

      expect(result).toBe(false);
    });
  });

  describe("marcarCompleto", () => {
    it("deve marcar grupo como completo", async () => {
      mockGrupoRepository.marcarCompleto.mockResolvedValue(undefined);

      await grupoService.marcarCompleto(TEST_IDS.grupo1, true);

      expect(mockGrupoRepository.marcarCompleto).toHaveBeenCalledWith(
        TEST_IDS.grupo1,
        true
      );
    });

    it("deve desmarcar grupo como completo", async () => {
      mockGrupoRepository.marcarCompleto.mockResolvedValue(undefined);

      await grupoService.marcarCompleto(TEST_IDS.grupo1, false);

      expect(mockGrupoRepository.marcarCompleto).toHaveBeenCalledWith(
        TEST_IDS.grupo1,
        false
      );
    });
  });

  describe("buscarIncompletos", () => {
    it("deve retornar grupos incompletos", async () => {
      const gruposIncompletos = [
        createGrupoFixture({ id: "grupo-1", completo: false }),
      ];
      mockGrupoRepository.buscarIncompletos.mockResolvedValue(gruposIncompletos);

      const result = await grupoService.buscarIncompletos(
        TEST_ETAPA_ID,
        TEST_ARENA_ID
      );

      expect(mockGrupoRepository.buscarIncompletos).toHaveBeenCalledWith(
        TEST_ETAPA_ID,
        TEST_ARENA_ID
      );
      expect(result).toHaveLength(1);
      expect(result[0].completo).toBe(false);
    });
  });

  describe("incrementarPartidasFinalizadas", () => {
    it("deve incrementar partidas finalizadas", async () => {
      mockGrupoRepository.incrementarPartidasFinalizadas.mockResolvedValue(
        undefined
      );

      await grupoService.incrementarPartidasFinalizadas(TEST_IDS.grupo1);

      expect(
        mockGrupoRepository.incrementarPartidasFinalizadas
      ).toHaveBeenCalledWith(TEST_IDS.grupo1);
    });
  });

  describe("decrementarPartidasFinalizadas", () => {
    it("deve decrementar partidas finalizadas", async () => {
      mockGrupoRepository.decrementarPartidasFinalizadas.mockResolvedValue(
        undefined
      );

      await grupoService.decrementarPartidasFinalizadas(TEST_IDS.grupo1);

      expect(
        mockGrupoRepository.decrementarPartidasFinalizadas
      ).toHaveBeenCalledWith(TEST_IDS.grupo1);
    });
  });

  describe("definirClassificadas", () => {
    it("deve definir duplas classificadas do grupo", async () => {
      const duplasIds = [TEST_IDS.dupla1, TEST_IDS.dupla2];
      mockGrupoRepository.definirClassificadas.mockResolvedValue(undefined);

      await grupoService.definirClassificadas(TEST_IDS.grupo1, duplasIds);

      expect(mockGrupoRepository.definirClassificadas).toHaveBeenCalledWith(
        TEST_IDS.grupo1,
        duplasIds
      );
    });
  });

  describe("deletarPorEtapa", () => {
    it("deve deletar todos os grupos de uma etapa", async () => {
      mockGrupoRepository.deletarPorEtapa.mockResolvedValue(4);

      const result = await grupoService.deletarPorEtapa(
        TEST_ETAPA_ID,
        TEST_ARENA_ID
      );

      expect(mockGrupoRepository.deletarPorEtapa).toHaveBeenCalledWith(
        TEST_ETAPA_ID,
        TEST_ARENA_ID
      );
      expect(result).toBe(4);
    });

    it("deve retornar 0 se não houver grupos para deletar", async () => {
      mockGrupoRepository.deletarPorEtapa.mockResolvedValue(0);

      const result = await grupoService.deletarPorEtapa(
        TEST_ETAPA_ID,
        TEST_ARENA_ID
      );

      expect(result).toBe(0);
    });
  });

  describe("adicionarPartidasEmLote", () => {
    it("deve adicionar partidas ao grupo em lote", async () => {
      mockGrupoRepository.adicionarPartidasEmLote.mockResolvedValue(undefined);

      await grupoService.adicionarPartidasEmLote(TEST_IDS.grupo1, [TEST_IDS.partida1, "partida-2"]);

      expect(mockGrupoRepository.adicionarPartidasEmLote).toHaveBeenCalledWith(
        TEST_IDS.grupo1,
        [TEST_IDS.partida1, "partida-2"]
      );
    });
  });

  describe("atualizarContadores", () => {
    it("deve atualizar contadores do grupo", async () => {
      mockGrupoRepository.atualizarContadores.mockResolvedValue(undefined);

      await grupoService.atualizarContadores(TEST_IDS.grupo1, {
        totalPartidas: 6,
        partidasFinalizadas: 3,
      });

      expect(mockGrupoRepository.atualizarContadores).toHaveBeenCalledWith(
        TEST_IDS.grupo1,
        { totalPartidas: 6, partidasFinalizadas: 3 }
      );
    });
  });

  describe("criarGrupos", () => {
    it("deve criar grupos distribuindo duplas corretamente", async () => {
      const duplas = [
        createDuplaFixture({ id: "dupla-1", jogador1Id: "jogador-1" }),
        createDuplaFixture({ id: "dupla-2", jogador1Id: "jogador-2" }),
        createDuplaFixture({ id: "dupla-3", jogador1Id: "jogador-3" }),
        createDuplaFixture({ id: "dupla-4", jogador1Id: "jogador-4" }),
        createDuplaFixture({ id: "dupla-5", jogador1Id: "jogador-5" }),
        createDuplaFixture({ id: "dupla-6", jogador1Id: "jogador-6" }),
      ];

      // Sem cabeças de chave
      (cabecaDeChaveService.obterIdsCabecas as jest.Mock).mockResolvedValue([]);

      // Mock criarEmLote - retorna array de grupos
      mockGrupoRepository.criarEmLote.mockImplementation(async (dtos: any[]) =>
        dtos.map((dto, idx) =>
          createGrupoFixture({
            id: `grupo-${idx + 1}`,
            nome: dto.nome,
            ordem: dto.ordem,
          })
        )
      );

      mockDuplaRepository.atualizarEmLote.mockResolvedValue(undefined);

      const result = await grupoService.criarGrupos(
        TEST_ETAPA_ID,
        TEST_ARENA_ID,
        duplas,
        3
      );

      expect(cabecaDeChaveService.obterIdsCabecas).toHaveBeenCalledWith(
        TEST_ARENA_ID,
        TEST_ETAPA_ID
      );
      expect(mockGrupoRepository.criarEmLote).toHaveBeenCalledTimes(1);
      expect(mockDuplaRepository.atualizarEmLote).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(2);
    });

    it("deve distribuir cabeças de chave uniformemente entre grupos", async () => {
      const duplas = [
        createDuplaFixture({ id: "dupla-1", jogador1Id: "cabeca-1" }),
        createDuplaFixture({ id: "dupla-2", jogador1Id: "cabeca-2" }),
        createDuplaFixture({ id: "dupla-3", jogador1Id: "jogador-3" }),
        createDuplaFixture({ id: "dupla-4", jogador1Id: "jogador-4" }),
        createDuplaFixture({ id: "dupla-5", jogador1Id: "jogador-5" }),
        createDuplaFixture({ id: "dupla-6", jogador1Id: "jogador-6" }),
      ];

      // 2 cabeças de chave
      (cabecaDeChaveService.obterIdsCabecas as jest.Mock).mockResolvedValue([
        "cabeca-1",
        "cabeca-2",
      ]);

      // Mock criarEmLote - retorna array de grupos
      mockGrupoRepository.criarEmLote.mockImplementation(async (dtos: any[]) =>
        dtos.map((dto, idx) =>
          createGrupoFixture({
            id: `grupo-${idx + 1}`,
            nome: dto.nome,
            ordem: dto.ordem,
          })
        )
      );

      mockDuplaRepository.atualizarEmLote.mockResolvedValue(undefined);

      const result = await grupoService.criarGrupos(
        TEST_ETAPA_ID,
        TEST_ARENA_ID,
        duplas,
        3
      );

      expect(result).toHaveLength(2);

      // Verificar que criarEmLote foi chamado com a estrutura correta
      expect(mockGrupoRepository.criarEmLote).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            etapaId: TEST_ETAPA_ID,
            arenaId: TEST_ARENA_ID,
            nome: "Grupo A",
            ordem: 1,
          })
        ])
      );
    });

    it("deve lançar erro se houver problema na distribuição", async () => {
      const duplas = [
        createDuplaFixture({ id: "dupla-1" }),
        createDuplaFixture({ id: "dupla-2" }),
        createDuplaFixture({ id: "dupla-3" }),
      ];

      (cabecaDeChaveService.obterIdsCabecas as jest.Mock).mockResolvedValue([]);

      mockGrupoRepository.criar.mockRejectedValue(new Error("Erro no banco"));

      await expect(
        grupoService.criarGrupos(TEST_ETAPA_ID, TEST_ARENA_ID, duplas, 3)
      ).rejects.toThrow("Falha ao criar grupos");
    });
  });

  describe("criarGrupos - distribuição com shuffle", () => {
    it("deve distribuir todas as duplas normais nos grupos mesmo após shuffle", async () => {
      const duplas = [
        createDuplaFixture({ id: "dupla-1", jogador1Id: "jogador-1" }),
        createDuplaFixture({ id: "dupla-2", jogador1Id: "jogador-2" }),
        createDuplaFixture({ id: "dupla-3", jogador1Id: "jogador-3" }),
        createDuplaFixture({ id: "dupla-4", jogador1Id: "jogador-4" }),
        createDuplaFixture({ id: "dupla-5", jogador1Id: "jogador-5" }),
        createDuplaFixture({ id: "dupla-6", jogador1Id: "jogador-6" }),
        createDuplaFixture({ id: "dupla-7", jogador1Id: "jogador-7" }),
        createDuplaFixture({ id: "dupla-8", jogador1Id: "jogador-8" }),
        createDuplaFixture({ id: "dupla-9", jogador1Id: "jogador-9" }),
      ];

      // Sem cabeças de chave - todas as duplas passam pelo shuffle
      (cabecaDeChaveService.obterIdsCabecas as jest.Mock).mockResolvedValue([]);

      mockGrupoRepository.criarEmLote.mockImplementation(async (dtos: any[]) => {
        return dtos.map((dto, idx) =>
          createGrupoFixture({
            id: `grupo-${idx + 1}`,
            nome: dto.nome,
            ordem: dto.ordem,
          })
        );
      });

      mockDuplaRepository.atualizarEmLote.mockResolvedValue(undefined);

      const result = await grupoService.criarGrupos(
        TEST_ETAPA_ID,
        TEST_ARENA_ID,
        duplas,
        3
      );

      // Verificar que todos os grupos foram criados
      expect(mockGrupoRepository.criarEmLote).toHaveBeenCalledTimes(1);

      // Verificar que atualizarEmLote foi chamado (para atribuir grupoId às duplas)
      expect(mockDuplaRepository.atualizarEmLote).toHaveBeenCalledTimes(1);

      // Verificar que atualizarEmLote recebeu exatamente 9 itens (todas as duplas)
      const atualizarArgs = mockDuplaRepository.atualizarEmLote.mock.calls[0][0];
      expect(atualizarArgs).toHaveLength(9);

      // Verificar que cada dupla foi atribuída a um grupo (tem grupoId e grupoNome)
      for (const item of atualizarArgs) {
        expect(item.data).toHaveProperty("grupoId");
        expect(item.data).toHaveProperty("grupoNome");
        expect(item.data.grupoId).toBeDefined();
        expect(item.data.grupoNome).toBeDefined();
      }

      // Verificar que o resultado contém grupos
      expect(result.length).toBeGreaterThan(0);
    });

    it("deve distribuir duplas normais entre grupos junto com cabeças de chave", async () => {
      const duplas = [
        createDuplaFixture({ id: "dupla-1", jogador1Id: "cabeca-1" }),
        createDuplaFixture({ id: "dupla-2", jogador1Id: "cabeca-2" }),
        createDuplaFixture({ id: "dupla-3", jogador1Id: "jogador-3" }),
        createDuplaFixture({ id: "dupla-4", jogador1Id: "jogador-4" }),
        createDuplaFixture({ id: "dupla-5", jogador1Id: "jogador-5" }),
        createDuplaFixture({ id: "dupla-6", jogador1Id: "jogador-6" }),
      ];

      // 2 cabeças de chave
      (cabecaDeChaveService.obterIdsCabecas as jest.Mock).mockResolvedValue([
        "cabeca-1",
        "cabeca-2",
      ]);

      mockGrupoRepository.criarEmLote.mockImplementation(async (dtos: any[]) =>
        dtos.map((dto, idx) =>
          createGrupoFixture({
            id: `grupo-${idx + 1}`,
            nome: dto.nome,
            ordem: dto.ordem,
          })
        )
      );

      mockDuplaRepository.atualizarEmLote.mockResolvedValue(undefined);

      const result = await grupoService.criarGrupos(
        TEST_ETAPA_ID,
        TEST_ARENA_ID,
        duplas,
        3
      );

      // Verificar que atualizarEmLote atribuiu todas as 6 duplas
      const atualizarArgs = mockDuplaRepository.atualizarEmLote.mock.calls[0][0];
      expect(atualizarArgs).toHaveLength(6);

      // Verificar que todas as duplas (cabeças + normais) foram distribuídas
      const duplaIdsDistribuidos = atualizarArgs.map((item: any) => item.id);
      expect(duplaIdsDistribuidos).toContain("dupla-1");
      expect(duplaIdsDistribuidos).toContain("dupla-2");
      expect(duplaIdsDistribuidos).toContain("dupla-3");
      expect(duplaIdsDistribuidos).toContain("dupla-4");
      expect(duplaIdsDistribuidos).toContain("dupla-5");
      expect(duplaIdsDistribuidos).toContain("dupla-6");

      expect(result).toHaveLength(2);
    });
  });

  describe("criarGrupos - grupo único", () => {
    it("deve criar um único grupo com todas as duplas quando grupoUnico=true", async () => {
      const duplas = [
        createDuplaFixture({ id: "dupla-1", jogador1Id: "j-1" }),
        createDuplaFixture({ id: "dupla-2", jogador1Id: "j-2" }),
        createDuplaFixture({ id: "dupla-3", jogador1Id: "j-3" }),
        createDuplaFixture({ id: "dupla-4", jogador1Id: "j-4" }),
        createDuplaFixture({ id: "dupla-5", jogador1Id: "j-5" }),
        createDuplaFixture({ id: "dupla-6", jogador1Id: "j-6" }),
      ];

      (cabecaDeChaveService.obterIdsCabecas as jest.Mock).mockResolvedValue([]);

      mockGrupoRepository.criarEmLote.mockImplementation(async (dtos: any[]) =>
        dtos.map((dto, idx) =>
          createGrupoFixture({
            id: `grupo-${idx + 1}`,
            nome: dto.nome,
            ordem: dto.ordem,
          })
        )
      );
      mockDuplaRepository.atualizarEmLote.mockResolvedValue(undefined);

      const result = await grupoService.criarGrupos(
        TEST_ETAPA_ID,
        TEST_ARENA_ID,
        duplas,
        3,
        true // grupoUnico
      );

      // Deve criar apenas 1 grupo
      expect(result).toHaveLength(1);

      // O criarEmLote deve receber apenas 1 grupo com 6 duplas
      const gruposCriados = mockGrupoRepository.criarEmLote.mock.calls[0][0];
      expect(gruposCriados).toHaveLength(1);
      expect(gruposCriados[0].nome).toBe("Grupo A");
    });

    it("deve criar múltiplos grupos quando grupoUnico=false", async () => {
      const duplas = [
        createDuplaFixture({ id: "dupla-1", jogador1Id: "j-1" }),
        createDuplaFixture({ id: "dupla-2", jogador1Id: "j-2" }),
        createDuplaFixture({ id: "dupla-3", jogador1Id: "j-3" }),
        createDuplaFixture({ id: "dupla-4", jogador1Id: "j-4" }),
        createDuplaFixture({ id: "dupla-5", jogador1Id: "j-5" }),
        createDuplaFixture({ id: "dupla-6", jogador1Id: "j-6" }),
      ];

      (cabecaDeChaveService.obterIdsCabecas as jest.Mock).mockResolvedValue([]);

      mockGrupoRepository.criarEmLote.mockImplementation(async (dtos: any[]) =>
        dtos.map((dto, idx) =>
          createGrupoFixture({
            id: `grupo-${idx + 1}`,
            nome: dto.nome,
            ordem: dto.ordem,
          })
        )
      );
      mockDuplaRepository.atualizarEmLote.mockResolvedValue(undefined);

      const result = await grupoService.criarGrupos(
        TEST_ETAPA_ID,
        TEST_ARENA_ID,
        duplas,
        3,
        false // não é grupo único
      );

      // 6 duplas = 2 grupos de 3
      expect(result).toHaveLength(2);
    });

    it("deve criar grupo único com 8 duplas", async () => {
      const duplas = Array.from({ length: 8 }, (_, i) =>
        createDuplaFixture({ id: `dupla-${i + 1}`, jogador1Id: `j-${i + 1}` })
      );

      (cabecaDeChaveService.obterIdsCabecas as jest.Mock).mockResolvedValue([]);

      mockGrupoRepository.criarEmLote.mockImplementation(async (dtos: any[]) =>
        dtos.map((dto, idx) =>
          createGrupoFixture({
            id: `grupo-${idx + 1}`,
            nome: dto.nome,
            ordem: dto.ordem,
          })
        )
      );
      mockDuplaRepository.atualizarEmLote.mockResolvedValue(undefined);

      const result = await grupoService.criarGrupos(
        TEST_ETAPA_ID,
        TEST_ARENA_ID,
        duplas,
        3,
        true
      );

      expect(result).toHaveLength(1);

      const gruposCriados = mockGrupoRepository.criarEmLote.mock.calls[0][0];
      expect(gruposCriados).toHaveLength(1);
    });
  });
});
