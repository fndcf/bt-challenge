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

  describe("adicionarPartida", () => {
    it("deve adicionar partida ao grupo", async () => {
      mockGrupoRepository.adicionarPartida.mockResolvedValue(undefined);

      await grupoService.adicionarPartida(TEST_IDS.grupo1, TEST_IDS.partida1);

      expect(mockGrupoRepository.adicionarPartida).toHaveBeenCalledWith(
        TEST_IDS.grupo1,
        TEST_IDS.partida1
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
});
