/**
 * Testes do EliminatoriaService
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

jest.mock("../../repositories/firebase/ConfrontoEliminatorioRepository", () => ({
  ConfrontoEliminatorioRepository: jest.fn(),
  confrontoEliminatorioRepository: {},
}));

jest.mock("../../repositories/firebase/DuplaRepository", () => ({
  DuplaRepository: jest.fn(),
  duplaRepository: {},
}));

jest.mock("../../repositories/firebase/GrupoRepository", () => ({
  GrupoRepository: jest.fn(),
  grupoRepository: {},
}));

jest.mock("../../repositories/firebase/PartidaRepository", () => ({
  PartidaRepository: jest.fn(),
  partidaRepository: {},
}));

jest.mock("../../services/EstatisticasJogadorService", () => ({
  __esModule: true,
  default: {
    marcarComoClassificado: jest.fn(),
    atualizarAposPartidaEliminatoria: jest.fn(),
    reverterAposPartidaEliminatoria: jest.fn(),
  },
}));

import { EliminatoriaService } from "../../services/EliminatoriaService";
import {
  createMockConfrontoRepository,
  createMockDuplaRepository,
  createMockGrupoRepository,
  createMockPartidaRepository,
} from "../mocks/repositories";
import estatisticasJogadorService from "../../services/EstatisticasJogadorService";
import {
  createGrupoFixture,
  createDuplaFixture,
  createConfrontoFixture,
  createPartidaFixture,
  TEST_IDS,
  TipoFase,
  StatusConfrontoEliminatorio,
} from "../fixtures";

describe("EliminatoriaService", () => {
  let mockConfrontoRepository: ReturnType<typeof createMockConfrontoRepository>;
  let mockDuplaRepository: ReturnType<typeof createMockDuplaRepository>;
  let mockGrupoRepository: ReturnType<typeof createMockGrupoRepository>;
  let mockPartidaRepository: ReturnType<typeof createMockPartidaRepository>;
  let eliminatoriaService: EliminatoriaService;

  const TEST_ARENA_ID = TEST_IDS.arena;
  const TEST_ETAPA_ID = TEST_IDS.etapa;

  beforeEach(() => {
    jest.clearAllMocks();

    mockConfrontoRepository = createMockConfrontoRepository();
    mockDuplaRepository = createMockDuplaRepository();
    mockGrupoRepository = createMockGrupoRepository();
    mockPartidaRepository = createMockPartidaRepository();

    eliminatoriaService = new EliminatoriaService(
      mockConfrontoRepository,
      mockDuplaRepository,
      mockGrupoRepository,
      mockPartidaRepository
    );
  });

  describe("buscarConfrontos", () => {
    it("deve buscar todos os confrontos de uma etapa", async () => {
      const confrontos = [
        createConfrontoFixture({ id: "c1", fase: TipoFase.SEMIFINAL, ordem: 1 }),
        createConfrontoFixture({ id: "c2", fase: TipoFase.SEMIFINAL, ordem: 2 }),
        createConfrontoFixture({ id: "c3", fase: TipoFase.FINAL, ordem: 1 }),
      ];
      mockConfrontoRepository.buscarPorEtapaOrdenado.mockResolvedValue(confrontos);

      const result = await eliminatoriaService.buscarConfrontos(
        TEST_ETAPA_ID,
        TEST_ARENA_ID
      );

      expect(mockConfrontoRepository.buscarPorEtapaOrdenado).toHaveBeenCalledWith(
        TEST_ETAPA_ID,
        TEST_ARENA_ID
      );
      expect(result).toHaveLength(3);
    });

    it("deve buscar confrontos de uma fase específica", async () => {
      const confrontos = [
        createConfrontoFixture({ id: "c1", fase: TipoFase.SEMIFINAL, ordem: 1 }),
        createConfrontoFixture({ id: "c2", fase: TipoFase.SEMIFINAL, ordem: 2 }),
      ];
      mockConfrontoRepository.buscarPorFaseOrdenado.mockResolvedValue(confrontos);

      const result = await eliminatoriaService.buscarConfrontos(
        TEST_ETAPA_ID,
        TEST_ARENA_ID,
        TipoFase.SEMIFINAL
      );

      expect(mockConfrontoRepository.buscarPorFaseOrdenado).toHaveBeenCalledWith(
        TEST_ETAPA_ID,
        TEST_ARENA_ID,
        TipoFase.SEMIFINAL
      );
      expect(result).toHaveLength(2);
    });
  });

  describe("gerarFaseEliminatoria", () => {
    it("deve lançar erro se não houver grupos", async () => {
      mockGrupoRepository.buscarPorEtapaOrdenado.mockResolvedValue([]);

      await expect(
        eliminatoriaService.gerarFaseEliminatoria(TEST_ETAPA_ID, TEST_ARENA_ID)
      ).rejects.toThrow("Nenhum grupo encontrado");
    });

    it("deve lançar erro se houver apenas 1 grupo", async () => {
      const grupos = [createGrupoFixture({ completo: true })];
      mockGrupoRepository.buscarPorEtapaOrdenado.mockResolvedValue(grupos);

      await expect(
        eliminatoriaService.gerarFaseEliminatoria(TEST_ETAPA_ID, TEST_ARENA_ID)
      ).rejects.toThrow("Não é possível gerar fase eliminatória com apenas 1 grupo");
    });

    it("deve lançar erro se houver grupos incompletos", async () => {
      const grupos = [
        createGrupoFixture({ id: "g1", nome: "Grupo A", completo: true }),
        createGrupoFixture({ id: "g2", nome: "Grupo B", completo: false }),
      ];
      mockGrupoRepository.buscarPorEtapaOrdenado.mockResolvedValue(grupos);

      await expect(
        eliminatoriaService.gerarFaseEliminatoria(TEST_ETAPA_ID, TEST_ARENA_ID)
      ).rejects.toThrow("Os seguintes grupos ainda possuem partidas pendentes: Grupo B");
    });

    it("deve lançar erro se tiver mais de 8 grupos", async () => {
      const grupos = Array.from({ length: 9 }, (_, i) =>
        createGrupoFixture({ id: `g${i}`, nome: `Grupo ${i}`, completo: true })
      );
      mockGrupoRepository.buscarPorEtapaOrdenado.mockResolvedValue(grupos);

      await expect(
        eliminatoriaService.gerarFaseEliminatoria(TEST_ETAPA_ID, TEST_ARENA_ID)
      ).rejects.toThrow("Número máximo de grupos suportado é 8");
    });

    it("deve gerar semifinal para 2 grupos", async () => {
      const grupos = [
        createGrupoFixture({ id: "g1", nome: "Grupo A", completo: true }),
        createGrupoFixture({ id: "g2", nome: "Grupo B", completo: true }),
      ];
      mockGrupoRepository.buscarPorEtapaOrdenado.mockResolvedValue(grupos);

      // Duplas classificadas
      const duplasGrupoA = [
        createDuplaFixture({ id: "d1", posicaoGrupo: 1, jogador1Id: "j1", jogador2Id: "j2" }),
        createDuplaFixture({ id: "d2", posicaoGrupo: 2, jogador1Id: "j3", jogador2Id: "j4" }),
      ];
      const duplasGrupoB = [
        createDuplaFixture({ id: "d3", posicaoGrupo: 1, jogador1Id: "j5", jogador2Id: "j6" }),
        createDuplaFixture({ id: "d4", posicaoGrupo: 2, jogador1Id: "j7", jogador2Id: "j8" }),
      ];

      mockDuplaRepository.buscarClassificadasPorGrupo
        .mockResolvedValueOnce(duplasGrupoA)
        .mockResolvedValueOnce(duplasGrupoB);

      mockConfrontoRepository.criar.mockResolvedValue(
        createConfrontoFixture({ fase: TipoFase.SEMIFINAL })
      );
      mockDuplaRepository.marcarClassificada.mockResolvedValue(undefined);
      (estatisticasJogadorService.marcarComoClassificado as jest.Mock).mockResolvedValue(undefined);

      const result = await eliminatoriaService.gerarFaseEliminatoria(
        TEST_ETAPA_ID,
        TEST_ARENA_ID,
        2
      );

      expect(result.confrontos).toBeDefined();
      expect(mockConfrontoRepository.criar).toHaveBeenCalled();
      expect(mockDuplaRepository.marcarClassificada).toHaveBeenCalled();
    });

    it("deve gerar quartas para 4 grupos", async () => {
      const grupos = Array.from({ length: 4 }, (_, i) =>
        createGrupoFixture({
          id: `g${i + 1}`,
          nome: `Grupo ${String.fromCharCode(65 + i)}`,
          completo: true,
        })
      );
      mockGrupoRepository.buscarPorEtapaOrdenado.mockResolvedValue(grupos);

      // 2 duplas classificadas por grupo = 8 duplas
      for (let g = 0; g < 4; g++) {
        mockDuplaRepository.buscarClassificadasPorGrupo.mockResolvedValueOnce([
          createDuplaFixture({
            id: `d${g * 2 + 1}`,
            posicaoGrupo: 1,
            jogador1Id: `j${g * 4 + 1}`,
            jogador2Id: `j${g * 4 + 2}`,
          }),
          createDuplaFixture({
            id: `d${g * 2 + 2}`,
            posicaoGrupo: 2,
            jogador1Id: `j${g * 4 + 3}`,
            jogador2Id: `j${g * 4 + 4}`,
          }),
        ]);
      }

      mockConfrontoRepository.criar.mockResolvedValue(
        createConfrontoFixture({ fase: TipoFase.QUARTAS })
      );
      mockDuplaRepository.marcarClassificada.mockResolvedValue(undefined);
      (estatisticasJogadorService.marcarComoClassificado as jest.Mock).mockResolvedValue(undefined);

      const result = await eliminatoriaService.gerarFaseEliminatoria(
        TEST_ETAPA_ID,
        TEST_ARENA_ID,
        2
      );

      expect(result.confrontos).toBeDefined();
      // 4 grupos x 2 classificados = 8 duplas = 4 confrontos de quartas
      expect(mockConfrontoRepository.criar).toHaveBeenCalledTimes(4);
    });
  });

  describe("registrarResultado", () => {
    it("deve lançar erro se confronto não existir", async () => {
      mockConfrontoRepository.buscarPorIdEArena.mockResolvedValue(null);

      await expect(
        eliminatoriaService.registrarResultado(
          "confronto-inexistente",
          TEST_ARENA_ID,
          [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }]
        )
      ).rejects.toThrow("Confronto não encontrado");
    });

    it("deve lançar erro se placar não tiver exatamente 1 set", async () => {
      const confronto = createConfrontoFixture();
      mockConfrontoRepository.buscarPorIdEArena.mockResolvedValue(confronto);

      await expect(
        eliminatoriaService.registrarResultado(
          TEST_IDS.confronto1,
          TEST_ARENA_ID,
          [
            { numero: 1, gamesDupla1: 6, gamesDupla2: 4 },
            { numero: 2, gamesDupla1: 6, gamesDupla2: 3 },
          ]
        )
      ).rejects.toThrow("Placar inválido: deve ter apenas 1 set");
    });

    it("deve registrar resultado corretamente", async () => {
      const confronto = createConfrontoFixture({
        dupla1Id: "d1",
        dupla1Nome: "João & Pedro",
        dupla2Id: "d2",
        dupla2Nome: "Maria & Ana",
        status: StatusConfrontoEliminatorio.AGENDADA,
      });
      mockConfrontoRepository.buscarPorIdEArena.mockResolvedValue(confronto);

      const partida = createPartidaFixture({ id: "partida-1" });
      mockPartidaRepository.criar.mockResolvedValue(partida);
      mockPartidaRepository.registrarResultado.mockResolvedValue(undefined);
      mockConfrontoRepository.registrarResultado.mockResolvedValue(undefined);

      const dupla1 = createDuplaFixture({ id: "d1", jogador1Id: "j1", jogador2Id: "j2" });
      const dupla2 = createDuplaFixture({ id: "d2", jogador1Id: "j3", jogador2Id: "j4" });
      mockDuplaRepository.buscarPorId
        .mockResolvedValueOnce(dupla1)
        .mockResolvedValueOnce(dupla2);

      (estatisticasJogadorService.atualizarAposPartidaEliminatoria as jest.Mock).mockResolvedValue(undefined);

      // Não gera próxima fase
      mockConfrontoRepository.buscarPorFaseOrdenado.mockResolvedValue([confronto]);

      await eliminatoriaService.registrarResultado(
        TEST_IDS.confronto1,
        TEST_ARENA_ID,
        [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }]
      );

      expect(mockPartidaRepository.criar).toHaveBeenCalled();
      expect(mockPartidaRepository.registrarResultado).toHaveBeenCalled();
      expect(mockConfrontoRepository.registrarResultado).toHaveBeenCalledWith(
        TEST_IDS.confronto1,
        expect.objectContaining({
          status: StatusConfrontoEliminatorio.FINALIZADA,
          vencedoraId: "d1",
          vencedoraNome: "João & Pedro",
          placar: "6-4",
        })
      );
    });
  });

  describe("cancelarFaseEliminatoria", () => {
    it("deve lançar erro se não houver fase eliminatória", async () => {
      mockConfrontoRepository.buscarPorEtapa.mockResolvedValue([]);

      await expect(
        eliminatoriaService.cancelarFaseEliminatoria(TEST_ETAPA_ID, TEST_ARENA_ID)
      ).rejects.toThrow("Nenhuma fase eliminatória encontrada");
    });

    it("deve cancelar fase eliminatória corretamente", async () => {
      const confrontos = [
        createConfrontoFixture({
          id: "c1",
          status: StatusConfrontoEliminatorio.AGENDADA,
        }),
        createConfrontoFixture({
          id: "c2",
          status: StatusConfrontoEliminatorio.FINALIZADA,
          partidaId: "partida-1",
        }),
      ];
      mockConfrontoRepository.buscarPorEtapa.mockResolvedValue(confrontos);

      // Mock reverterEstatisticasConfronto dependencies
      const partida = createPartidaFixture({
        id: "partida-1",
        placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4, vencedorId: "d1" }],
        vencedoraId: "d1",
      });
      mockPartidaRepository.buscarPorId.mockResolvedValue(partida);

      const dupla1 = createDuplaFixture({ id: "d1", jogador1Id: "j1", jogador2Id: "j2" });
      const dupla2 = createDuplaFixture({ id: "d2", jogador1Id: "j3", jogador2Id: "j4" });
      mockDuplaRepository.buscarPorId
        .mockResolvedValueOnce(dupla1)
        .mockResolvedValueOnce(dupla2);

      (estatisticasJogadorService.reverterAposPartidaEliminatoria as jest.Mock).mockResolvedValue(undefined);

      mockPartidaRepository.buscarPorTipo.mockResolvedValue([partida]);
      mockPartidaRepository.deletarEmLote.mockResolvedValue(undefined);
      mockConfrontoRepository.deletarPorEtapa.mockResolvedValue(2);

      const duplasClassificadas = [dupla1, dupla2];
      mockDuplaRepository.buscarClassificadas.mockResolvedValue(duplasClassificadas);
      mockDuplaRepository.marcarClassificada.mockResolvedValue(undefined);
      (estatisticasJogadorService.marcarComoClassificado as jest.Mock).mockResolvedValue(undefined);

      await eliminatoriaService.cancelarFaseEliminatoria(
        TEST_ETAPA_ID,
        TEST_ARENA_ID
      );

      expect(mockConfrontoRepository.deletarPorEtapa).toHaveBeenCalledWith(
        TEST_ETAPA_ID,
        TEST_ARENA_ID
      );
      expect(mockPartidaRepository.deletarEmLote).toHaveBeenCalled();
      expect(mockDuplaRepository.marcarClassificada).toHaveBeenCalledWith("d1", false);
      expect(mockDuplaRepository.marcarClassificada).toHaveBeenCalledWith("d2", false);
    });
  });

  describe("registrarResultado - casos adicionais", () => {
    it("deve reverter estatísticas se for edição de resultado", async () => {
      const confronto = createConfrontoFixture({
        dupla1Id: "d1",
        dupla1Nome: "João & Pedro",
        dupla2Id: "d2",
        dupla2Nome: "Maria & Ana",
        status: StatusConfrontoEliminatorio.FINALIZADA,
        partidaId: "partida-existente",
        vencedoraId: "d1",
        placar: "6-4",
      });
      mockConfrontoRepository.buscarPorIdEArena.mockResolvedValue(confronto);

      // Mock reverterEstatisticasConfronto
      const partidaExistente = createPartidaFixture({
        id: "partida-existente",
        placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4, vencedorId: "d1" }],
        vencedoraId: "d1",
      });
      mockPartidaRepository.buscarPorId.mockResolvedValue(partidaExistente);

      const dupla1 = createDuplaFixture({ id: "d1", jogador1Id: "j1", jogador2Id: "j2" });
      const dupla2 = createDuplaFixture({ id: "d2", jogador1Id: "j3", jogador2Id: "j4" });
      mockDuplaRepository.buscarPorId
        .mockResolvedValueOnce(dupla1)
        .mockResolvedValueOnce(dupla2)
        .mockResolvedValueOnce(dupla1)
        .mockResolvedValueOnce(dupla2);

      (estatisticasJogadorService.reverterAposPartidaEliminatoria as jest.Mock).mockResolvedValue(undefined);

      mockPartidaRepository.atualizar.mockResolvedValue(undefined);
      mockConfrontoRepository.registrarResultado.mockResolvedValue(undefined);

      (estatisticasJogadorService.atualizarAposPartidaEliminatoria as jest.Mock).mockResolvedValue(undefined);

      // Mock avancarVencedor - apenas 1 confronto finalizado aciona geração de próxima fase
      // Precisa de mock para grupos e confrontos da próxima fase
      const confrontoAtualizado = {
        ...confronto,
        status: StatusConfrontoEliminatorio.FINALIZADA,
        vencedoraId: "d2",
        vencedoraNome: "Maria & Ana",
      };
      mockConfrontoRepository.buscarPorFaseOrdenado.mockResolvedValue([confrontoAtualizado]);

      // Mock grupos para avancarVencedor
      const grupos = [createGrupoFixture({ id: "g1" }), createGrupoFixture({ id: "g2" })];
      mockGrupoRepository.buscarPorEtapaOrdenado.mockResolvedValue(grupos);

      // Não existe próxima fase ainda - mas com apenas 1 vencedor não pode criar final
      // A função deve criar a próxima fase apenas se houver vencedores suficientes
      mockConfrontoRepository.buscarPorFase.mockResolvedValue([]);
      mockConfrontoRepository.criar.mockResolvedValue(createConfrontoFixture({ fase: TipoFase.FINAL }));

      await eliminatoriaService.registrarResultado(
        TEST_IDS.confronto1,
        TEST_ARENA_ID,
        [{ numero: 1, gamesDupla1: 4, gamesDupla2: 6 }] // Novo resultado: d2 vence
      );

      expect(estatisticasJogadorService.reverterAposPartidaEliminatoria).toHaveBeenCalled();
      expect(mockPartidaRepository.atualizar).toHaveBeenCalled();
    });

    it("deve atualizar estatísticas para ambas as duplas", async () => {
      const confronto = createConfrontoFixture({
        dupla1Id: "d1",
        dupla1Nome: "João & Pedro",
        dupla2Id: "d2",
        dupla2Nome: "Maria & Ana",
        status: StatusConfrontoEliminatorio.AGENDADA,
      });
      mockConfrontoRepository.buscarPorIdEArena.mockResolvedValue(confronto);

      const partida = createPartidaFixture({ id: "partida-nova" });
      mockPartidaRepository.criar.mockResolvedValue(partida);
      mockPartidaRepository.registrarResultado.mockResolvedValue(undefined);
      mockConfrontoRepository.registrarResultado.mockResolvedValue(undefined);

      const dupla1 = createDuplaFixture({ id: "d1", jogador1Id: "j1", jogador2Id: "j2" });
      const dupla2 = createDuplaFixture({ id: "d2", jogador1Id: "j3", jogador2Id: "j4" });
      mockDuplaRepository.buscarPorId
        .mockResolvedValueOnce(dupla1)
        .mockResolvedValueOnce(dupla2);

      (estatisticasJogadorService.atualizarAposPartidaEliminatoria as jest.Mock).mockResolvedValue(undefined);

      mockConfrontoRepository.buscarPorFaseOrdenado.mockResolvedValue([confronto]);

      await eliminatoriaService.registrarResultado(
        TEST_IDS.confronto1,
        TEST_ARENA_ID,
        [{ numero: 1, gamesDupla1: 6, gamesDupla2: 3 }]
      );

      // Deve ter chamado para todos os 4 jogadores (2 de cada dupla)
      expect(estatisticasJogadorService.atualizarAposPartidaEliminatoria).toHaveBeenCalledTimes(4);
    });

    it("deve gerar próxima fase quando todos confrontos estão finalizados", async () => {
      const confronto = createConfrontoFixture({
        id: "c1",
        dupla1Id: "d1",
        dupla1Nome: "João & Pedro",
        dupla2Id: "d2",
        dupla2Nome: "Maria & Ana",
        status: StatusConfrontoEliminatorio.AGENDADA,
        fase: TipoFase.SEMIFINAL,
        ordem: 1,
      });
      mockConfrontoRepository.buscarPorIdEArena.mockResolvedValue(confronto);

      const partida = createPartidaFixture({ id: "partida-nova" });
      mockPartidaRepository.criar.mockResolvedValue(partida);
      mockPartidaRepository.registrarResultado.mockResolvedValue(undefined);
      mockConfrontoRepository.registrarResultado.mockResolvedValue(undefined);

      const dupla1 = createDuplaFixture({ id: "d1", jogador1Id: "j1", jogador2Id: "j2" });
      const dupla2 = createDuplaFixture({ id: "d2", jogador1Id: "j3", jogador2Id: "j4" });
      mockDuplaRepository.buscarPorId
        .mockResolvedValueOnce(dupla1)
        .mockResolvedValueOnce(dupla2);

      (estatisticasJogadorService.atualizarAposPartidaEliminatoria as jest.Mock).mockResolvedValue(undefined);

      // Simular que ambos confrontos da semifinal estão finalizados
      const confrontosFinalizados = [
        createConfrontoFixture({
          id: "c1",
          fase: TipoFase.SEMIFINAL,
          ordem: 1,
          status: StatusConfrontoEliminatorio.FINALIZADA,
          vencedoraId: "d1",
          vencedoraNome: "João & Pedro",
        }),
        createConfrontoFixture({
          id: "c2",
          fase: TipoFase.SEMIFINAL,
          ordem: 2,
          status: StatusConfrontoEliminatorio.FINALIZADA,
          vencedoraId: "d3",
          vencedoraNome: "Carlos & Lucas",
        }),
      ];
      mockConfrontoRepository.buscarPorFaseOrdenado.mockResolvedValue(confrontosFinalizados);

      // Grupos para mapeamento
      const grupos = [
        createGrupoFixture({ id: "g1" }),
        createGrupoFixture({ id: "g2" }),
      ];
      mockGrupoRepository.buscarPorEtapaOrdenado.mockResolvedValue(grupos);

      // Não existe próxima fase
      mockConfrontoRepository.buscarPorFase.mockResolvedValue([]);

      // Criar confronto da final
      mockConfrontoRepository.criar.mockResolvedValue(
        createConfrontoFixture({ fase: TipoFase.FINAL })
      );

      await eliminatoriaService.registrarResultado(
        "c1",
        TEST_ARENA_ID,
        [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }]
      );

      // Deve ter criado a final
      expect(mockConfrontoRepository.criar).toHaveBeenCalledWith(
        expect.objectContaining({
          fase: TipoFase.FINAL,
        })
      );
    });

    it("deve atualizar próxima fase existente quando resultado muda", async () => {
      const confronto = createConfrontoFixture({
        id: "c1",
        dupla1Id: "d1",
        dupla1Nome: "João & Pedro",
        dupla2Id: "d2",
        dupla2Nome: "Maria & Ana",
        status: StatusConfrontoEliminatorio.AGENDADA,
        fase: TipoFase.QUARTAS,
        ordem: 1,
      });
      mockConfrontoRepository.buscarPorIdEArena.mockResolvedValue(confronto);

      const partida = createPartidaFixture({ id: "partida-nova" });
      mockPartidaRepository.criar.mockResolvedValue(partida);
      mockPartidaRepository.registrarResultado.mockResolvedValue(undefined);
      mockConfrontoRepository.registrarResultado.mockResolvedValue(undefined);

      const dupla1 = createDuplaFixture({ id: "d1", jogador1Id: "j1", jogador2Id: "j2" });
      const dupla2 = createDuplaFixture({ id: "d2", jogador1Id: "j3", jogador2Id: "j4" });
      mockDuplaRepository.buscarPorId
        .mockResolvedValueOnce(dupla1)
        .mockResolvedValueOnce(dupla2);

      (estatisticasJogadorService.atualizarAposPartidaEliminatoria as jest.Mock).mockResolvedValue(undefined);

      // Simular todos confrontos das quartas finalizados
      const confrontosFinalizados = [
        createConfrontoFixture({
          id: "c1",
          fase: TipoFase.QUARTAS,
          ordem: 1,
          status: StatusConfrontoEliminatorio.FINALIZADA,
          vencedoraId: "d1",
          vencedoraNome: "João & Pedro",
        }),
        createConfrontoFixture({
          id: "c2",
          fase: TipoFase.QUARTAS,
          ordem: 2,
          status: StatusConfrontoEliminatorio.FINALIZADA,
          vencedoraId: "d3",
          vencedoraNome: "Carlos & Lucas",
        }),
      ];
      mockConfrontoRepository.buscarPorFaseOrdenado.mockResolvedValue(confrontosFinalizados);

      // Grupos para mapeamento
      const grupos = [
        createGrupoFixture({ id: "g1" }),
        createGrupoFixture({ id: "g2" }),
      ];
      mockGrupoRepository.buscarPorEtapaOrdenado.mockResolvedValue(grupos);

      // Já existe próxima fase
      const confrontoSemifinalExistente = createConfrontoFixture({
        id: "c-semi",
        fase: TipoFase.SEMIFINAL,
        ordem: 1,
        dupla1Id: "d-antigo1",
        dupla2Id: "d-antigo2",
        status: StatusConfrontoEliminatorio.AGENDADA,
      });
      mockConfrontoRepository.buscarPorFase.mockResolvedValue([confrontoSemifinalExistente]);
      mockConfrontoRepository.atualizarDuplas.mockResolvedValue(undefined);

      await eliminatoriaService.registrarResultado(
        "c1",
        TEST_ARENA_ID,
        [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }]
      );

      // Deve ter atualizado a semifinal existente
      expect(mockConfrontoRepository.atualizarDuplas).toHaveBeenCalled();
    });
  });

  describe("gerarFaseEliminatoria - cenários com BYE", () => {
    it("deve gerar fase com BYE para 3 grupos", async () => {
      const grupos = Array.from({ length: 3 }, (_, i) =>
        createGrupoFixture({
          id: `g${i + 1}`,
          nome: `Grupo ${String.fromCharCode(65 + i)}`,
          completo: true,
        })
      );
      mockGrupoRepository.buscarPorEtapaOrdenado.mockResolvedValue(grupos);

      // 2 duplas classificadas por grupo = 6 duplas
      for (let g = 0; g < 3; g++) {
        mockDuplaRepository.buscarClassificadasPorGrupo.mockResolvedValueOnce([
          createDuplaFixture({
            id: `d${g * 2 + 1}`,
            posicaoGrupo: 1,
            jogador1Id: `j${g * 4 + 1}`,
            jogador2Id: `j${g * 4 + 2}`,
          }),
          createDuplaFixture({
            id: `d${g * 2 + 2}`,
            posicaoGrupo: 2,
            jogador1Id: `j${g * 4 + 3}`,
            jogador2Id: `j${g * 4 + 4}`,
          }),
        ]);
      }

      mockConfrontoRepository.criar.mockResolvedValue(
        createConfrontoFixture({ fase: TipoFase.QUARTAS })
      );
      mockConfrontoRepository.registrarResultado.mockResolvedValue(undefined);
      mockDuplaRepository.marcarClassificada.mockResolvedValue(undefined);
      (estatisticasJogadorService.marcarComoClassificado as jest.Mock).mockResolvedValue(undefined);

      const result = await eliminatoriaService.gerarFaseEliminatoria(
        TEST_ETAPA_ID,
        TEST_ARENA_ID,
        2
      );

      expect(result.confrontos).toBeDefined();
      expect(mockConfrontoRepository.criar).toHaveBeenCalled();
    });

    it("deve gerar fase com BYE para 5 grupos", async () => {
      const grupos = Array.from({ length: 5 }, (_, i) =>
        createGrupoFixture({
          id: `g${i + 1}`,
          nome: `Grupo ${String.fromCharCode(65 + i)}`,
          completo: true,
        })
      );
      mockGrupoRepository.buscarPorEtapaOrdenado.mockResolvedValue(grupos);

      // 2 duplas classificadas por grupo = 10 duplas
      for (let g = 0; g < 5; g++) {
        mockDuplaRepository.buscarClassificadasPorGrupo.mockResolvedValueOnce([
          createDuplaFixture({
            id: `d${g * 2 + 1}`,
            posicaoGrupo: 1,
            jogador1Id: `j${g * 4 + 1}`,
            jogador2Id: `j${g * 4 + 2}`,
          }),
          createDuplaFixture({
            id: `d${g * 2 + 2}`,
            posicaoGrupo: 2,
            jogador1Id: `j${g * 4 + 3}`,
            jogador2Id: `j${g * 4 + 4}`,
          }),
        ]);
      }

      mockConfrontoRepository.criar.mockResolvedValue(
        createConfrontoFixture({ fase: TipoFase.OITAVAS })
      );
      mockConfrontoRepository.registrarResultado.mockResolvedValue(undefined);
      mockDuplaRepository.marcarClassificada.mockResolvedValue(undefined);
      (estatisticasJogadorService.marcarComoClassificado as jest.Mock).mockResolvedValue(undefined);

      const result = await eliminatoriaService.gerarFaseEliminatoria(
        TEST_ETAPA_ID,
        TEST_ARENA_ID,
        2
      );

      expect(result.confrontos).toBeDefined();
      expect(mockConfrontoRepository.criar).toHaveBeenCalled();
    });

    it("deve gerar fase para 6 grupos", async () => {
      const grupos = Array.from({ length: 6 }, (_, i) =>
        createGrupoFixture({
          id: `g${i + 1}`,
          nome: `Grupo ${String.fromCharCode(65 + i)}`,
          completo: true,
        })
      );
      mockGrupoRepository.buscarPorEtapaOrdenado.mockResolvedValue(grupos);

      // 2 duplas classificadas por grupo = 12 duplas
      for (let g = 0; g < 6; g++) {
        mockDuplaRepository.buscarClassificadasPorGrupo.mockResolvedValueOnce([
          createDuplaFixture({
            id: `d${g * 2 + 1}`,
            posicaoGrupo: 1,
            jogador1Id: `j${g * 4 + 1}`,
            jogador2Id: `j${g * 4 + 2}`,
          }),
          createDuplaFixture({
            id: `d${g * 2 + 2}`,
            posicaoGrupo: 2,
            jogador1Id: `j${g * 4 + 3}`,
            jogador2Id: `j${g * 4 + 4}`,
          }),
        ]);
      }

      mockConfrontoRepository.criar.mockResolvedValue(
        createConfrontoFixture({ fase: TipoFase.OITAVAS })
      );
      mockConfrontoRepository.registrarResultado.mockResolvedValue(undefined);
      mockDuplaRepository.marcarClassificada.mockResolvedValue(undefined);
      (estatisticasJogadorService.marcarComoClassificado as jest.Mock).mockResolvedValue(undefined);

      const result = await eliminatoriaService.gerarFaseEliminatoria(
        TEST_ETAPA_ID,
        TEST_ARENA_ID,
        2
      );

      expect(result.confrontos).toBeDefined();
      expect(mockConfrontoRepository.criar).toHaveBeenCalled();
    });

    it("deve gerar oitavas para 8 grupos", async () => {
      const grupos = Array.from({ length: 8 }, (_, i) =>
        createGrupoFixture({
          id: `g${i + 1}`,
          nome: `Grupo ${String.fromCharCode(65 + i)}`,
          completo: true,
        })
      );
      mockGrupoRepository.buscarPorEtapaOrdenado.mockResolvedValue(grupos);

      // 2 duplas classificadas por grupo = 16 duplas
      for (let g = 0; g < 8; g++) {
        mockDuplaRepository.buscarClassificadasPorGrupo.mockResolvedValueOnce([
          createDuplaFixture({
            id: `d${g * 2 + 1}`,
            posicaoGrupo: 1,
            jogador1Id: `j${g * 4 + 1}`,
            jogador2Id: `j${g * 4 + 2}`,
          }),
          createDuplaFixture({
            id: `d${g * 2 + 2}`,
            posicaoGrupo: 2,
            jogador1Id: `j${g * 4 + 3}`,
            jogador2Id: `j${g * 4 + 4}`,
          }),
        ]);
      }

      mockConfrontoRepository.criar.mockResolvedValue(
        createConfrontoFixture({ fase: TipoFase.OITAVAS })
      );
      mockDuplaRepository.marcarClassificada.mockResolvedValue(undefined);
      (estatisticasJogadorService.marcarComoClassificado as jest.Mock).mockResolvedValue(undefined);

      const result = await eliminatoriaService.gerarFaseEliminatoria(
        TEST_ETAPA_ID,
        TEST_ARENA_ID,
        2
      );

      expect(result.confrontos).toBeDefined();
      // 16 duplas = 8 confrontos de oitavas
      expect(mockConfrontoRepository.criar).toHaveBeenCalledTimes(8);
    });
  });

  describe("atualizarProximaFase - limpar resultado anterior", () => {
    it("deve limpar resultado e deletar partida quando confronto já tinha resultado", async () => {
      const confronto = createConfrontoFixture({
        id: "c1",
        dupla1Id: "d1",
        dupla1Nome: "João & Pedro",
        dupla2Id: "d2",
        dupla2Nome: "Maria & Ana",
        status: StatusConfrontoEliminatorio.AGENDADA,
        fase: TipoFase.QUARTAS,
        ordem: 1,
      });
      mockConfrontoRepository.buscarPorIdEArena.mockResolvedValue(confronto);

      const partida = createPartidaFixture({ id: "partida-nova" });
      mockPartidaRepository.criar.mockResolvedValue(partida);
      mockPartidaRepository.registrarResultado.mockResolvedValue(undefined);
      mockConfrontoRepository.registrarResultado.mockResolvedValue(undefined);

      const dupla1 = createDuplaFixture({ id: "d1", jogador1Id: "j1", jogador2Id: "j2" });
      const dupla2 = createDuplaFixture({ id: "d2", jogador1Id: "j3", jogador2Id: "j4" });
      mockDuplaRepository.buscarPorId
        .mockResolvedValueOnce(dupla1)
        .mockResolvedValueOnce(dupla2);

      (estatisticasJogadorService.atualizarAposPartidaEliminatoria as jest.Mock).mockResolvedValue(undefined);

      // Simular todos confrontos das quartas finalizados
      const confrontosQuartas = [
        createConfrontoFixture({
          id: "c1",
          fase: TipoFase.QUARTAS,
          ordem: 1,
          status: StatusConfrontoEliminatorio.FINALIZADA,
          vencedoraId: "d1",
          vencedoraNome: "João & Pedro",
        }),
        createConfrontoFixture({
          id: "c2",
          fase: TipoFase.QUARTAS,
          ordem: 2,
          status: StatusConfrontoEliminatorio.FINALIZADA,
          vencedoraId: "d3",
          vencedoraNome: "Carlos & Lucas",
        }),
      ];

      // Confronto da semifinal com resultado anterior
      const confrontoSemiComResultado = createConfrontoFixture({
        id: "c-semi",
        fase: TipoFase.SEMIFINAL,
        ordem: 1,
        dupla1Id: "d-antigo1",
        dupla2Id: "d-antigo2",
        status: StatusConfrontoEliminatorio.FINALIZADA,
        partidaId: "partida-semi-antiga",
        vencedoraId: "d-antigo1",
      });

      // buscarPorFaseOrdenado é chamado 2 vezes:
      // 1. Para buscar confrontos da fase atual (QUARTAS) em avancarVencedor
      // 2. Para buscar confrontos da próxima fase (SEMIFINAL) em atualizarProximaFase
      mockConfrontoRepository.buscarPorFaseOrdenado
        .mockResolvedValueOnce(confrontosQuartas) // avancarVencedor: busca quartas
        .mockResolvedValueOnce([confrontoSemiComResultado]); // atualizarProximaFase: busca semifinal

      const grupos = [
        createGrupoFixture({ id: "g1" }),
        createGrupoFixture({ id: "g2" }),
      ];
      mockGrupoRepository.buscarPorEtapaOrdenado.mockResolvedValue(grupos);

      // buscarPorFase verifica se já existe próxima fase
      mockConfrontoRepository.buscarPorFase.mockResolvedValue([confrontoSemiComResultado]);
      mockPartidaRepository.deletar.mockResolvedValue(undefined);
      mockConfrontoRepository.limparResultado.mockResolvedValue(undefined);
      mockConfrontoRepository.atualizarDuplas.mockResolvedValue(undefined);

      await eliminatoriaService.registrarResultado(
        "c1",
        TEST_ARENA_ID,
        [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }]
      );

      // Deve ter deletado a partida antiga e limpado o resultado
      expect(mockPartidaRepository.deletar).toHaveBeenCalledWith("partida-semi-antiga");
      expect(mockConfrontoRepository.limparResultado).toHaveBeenCalledWith("c-semi");
      expect(mockConfrontoRepository.atualizarDuplas).toHaveBeenCalled();
    });
  });

  describe("reverterEstatisticasConfronto", () => {
    it("deve reverter estatísticas de confronto finalizado", async () => {
      const confrontoFinalizado = createConfrontoFixture({
        id: "c1",
        dupla1Id: "d1",
        dupla2Id: "d2",
        status: StatusConfrontoEliminatorio.FINALIZADA,
        partidaId: "partida-1",
        vencedoraId: "d1",
        placar: "6-4",
      });

      mockConfrontoRepository.buscarPorEtapa.mockResolvedValue([confrontoFinalizado]);

      const partida = createPartidaFixture({
        id: "partida-1",
        placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4, vencedorId: "d1" }],
        vencedoraId: "d1",
      });
      mockPartidaRepository.buscarPorId.mockResolvedValue(partida);

      const dupla1 = createDuplaFixture({ id: "d1", jogador1Id: "j1", jogador2Id: "j2" });
      const dupla2 = createDuplaFixture({ id: "d2", jogador1Id: "j3", jogador2Id: "j4" });
      mockDuplaRepository.buscarPorId
        .mockResolvedValueOnce(dupla1)
        .mockResolvedValueOnce(dupla2);

      (estatisticasJogadorService.reverterAposPartidaEliminatoria as jest.Mock).mockResolvedValue(undefined);

      mockPartidaRepository.buscarPorTipo.mockResolvedValue([partida]);
      mockPartidaRepository.deletarEmLote.mockResolvedValue(undefined);
      mockConfrontoRepository.deletarPorEtapa.mockResolvedValue(1);

      mockDuplaRepository.buscarClassificadas.mockResolvedValue([dupla1]);
      mockDuplaRepository.marcarClassificada.mockResolvedValue(undefined);
      (estatisticasJogadorService.marcarComoClassificado as jest.Mock).mockResolvedValue(undefined);

      await eliminatoriaService.cancelarFaseEliminatoria(
        TEST_ETAPA_ID,
        TEST_ARENA_ID
      );

      // Deve ter revertido para todos os 4 jogadores
      expect(estatisticasJogadorService.reverterAposPartidaEliminatoria).toHaveBeenCalledTimes(4);
    });
  });
});
