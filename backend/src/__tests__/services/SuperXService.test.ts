/**
 * Testes para SuperXService
 */

// Mocks devem vir antes dos imports
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

jest.mock("../../services/EstatisticasJogadorService", () => ({
  __esModule: true,
  default: {
    criarEmLote: jest.fn(),
    atualizarGrupoEmLote: jest.fn(),
    buscarPorJogadoresEtapa: jest.fn(),
    atualizarAposPartidaGrupoComIncrement: jest.fn(),
    reverterAposPartidaComIncrement: jest.fn(),
    atualizarPosicoesGrupoEmLote: jest.fn(),
  },
}));

jest.mock("../../utils/arrayUtils", () => ({
  embaralhar: jest.fn((arr) => [...arr]),
}));

import { SuperXService } from "../../services/SuperXService";
import estatisticasJogadorService from "../../services/EstatisticasJogadorService";
import { StatusEtapa } from "../../models/Etapa";
import { StatusPartida } from "../../models/Partida";
import { TEST_IDS, NivelJogador, GeneroJogador } from "../fixtures";
import {
  getSuperXSchedule,
  getTotalRodadas,
  getPartidasPorRodada,
  getTotalPartidas,
  validarSchedule,
} from "../../config/SuperXSchedules";

describe("SuperXService", () => {
  let service: SuperXService;

  // Mock repositories
  const mockEtapaRepository = {
    buscarPorIdEArena: jest.fn(),
    marcarChavesGeradas: jest.fn(),
    atualizarStatus: jest.fn(),
  };

  const mockInscricaoRepository = {
    buscarConfirmadas: jest.fn(),
  };

  const mockGrupoRepository = {
    criar: jest.fn(),
    buscarPorEtapa: jest.fn(),
    adicionarPartidasEmLote: jest.fn(),
    atualizar: jest.fn(),
    deletarPorEtapa: jest.fn(),
  };

  const mockPartidaReiDaPraiaRepository = {
    criarEmLote: jest.fn(),
    buscarPorIdEArena: jest.fn(),
    buscarPorEtapa: jest.fn(),
    buscarPorGrupo: jest.fn(),
    atualizar: jest.fn(),
    deletarPorEtapa: jest.fn(),
  };

  const mockEstatisticasJogadorRepository = {
    buscarPorGrupo: jest.fn(),
    buscarPorEtapa: jest.fn(),
    deletarPorEtapa: jest.fn(),
  };

  const TEST_ARENA_ID = TEST_IDS.arena;
  const TEST_ETAPA_ID = TEST_IDS.etapa;

  beforeEach(() => {
    jest.clearAllMocks();

    service = new SuperXService(
      mockEtapaRepository as any,
      mockInscricaoRepository as any,
      mockGrupoRepository as any,
      mockPartidaReiDaPraiaRepository as any,
      mockEstatisticasJogadorRepository as any
    );
  });

  // ========== TESTES DOS SCHEDULES ==========
  describe("Schedule do Super 8", () => {
    it("deve ter configuracoes corretas", () => {
      const schedule = getSuperXSchedule(8);

      expect(schedule).toHaveLength(7);
      expect(getTotalRodadas(8)).toBe(7);
      expect(getPartidasPorRodada(8)).toBe(2);
      expect(getTotalPartidas(8)).toBe(14);
    });

    it("deve passar na validacao completa", () => {
      const resultado = validarSchedule(8);

      expect(resultado.valido).toBe(true);
      expect(resultado.erros).toHaveLength(0);
    });

    it("todos os jogadores devem participar de cada rodada", () => {
      const schedule = getSuperXSchedule(8);

      for (const rodada of schedule) {
        const jogadoresNaRodada = new Set<number>();

        for (const partida of rodada.partidas) {
          jogadoresNaRodada.add(partida.dupla1[0]);
          jogadoresNaRodada.add(partida.dupla1[1]);
          jogadoresNaRodada.add(partida.dupla2[0]);
          jogadoresNaRodada.add(partida.dupla2[1]);
        }

        expect(jogadoresNaRodada.size).toBe(8);
      }
    });
  });

  describe("Schedule do Super 12", () => {
    it("deve ter configuracoes corretas", () => {
      const schedule = getSuperXSchedule(12);

      expect(schedule).toHaveLength(11);
      expect(getTotalRodadas(12)).toBe(11);
      expect(getPartidasPorRodada(12)).toBe(3);
      expect(getTotalPartidas(12)).toBe(33);
    });

    it("deve passar na validacao completa", () => {
      const resultado = validarSchedule(12);

      expect(resultado.valido).toBe(true);
      expect(resultado.erros).toHaveLength(0);
    });

    it("todos os jogadores devem participar de cada rodada", () => {
      const schedule = getSuperXSchedule(12);

      for (const rodada of schedule) {
        const jogadoresNaRodada = new Set<number>();

        for (const partida of rodada.partidas) {
          jogadoresNaRodada.add(partida.dupla1[0]);
          jogadoresNaRodada.add(partida.dupla1[1]);
          jogadoresNaRodada.add(partida.dupla2[0]);
          jogadoresNaRodada.add(partida.dupla2[1]);
        }

        expect(jogadoresNaRodada.size).toBe(12);
      }
    });
  });

  describe("Consistencia entre variantes", () => {
    it("Super 8 e Super 12 devem ter estrutura consistente", () => {
      const schedule8 = getSuperXSchedule(8);
      const schedule12 = getSuperXSchedule(12);

      expect(schedule8[0].rodada).toBe(1);
      expect(schedule12[0].rodada).toBe(1);

      schedule8.forEach((rodada, index) => {
        expect(rodada.rodada).toBe(index + 1);
      });

      schedule12.forEach((rodada, index) => {
        expect(rodada.rodada).toBe(index + 1);
      });
    });

    it("cada jogador deve jogar uma partida por rodada", () => {
      // Super 8
      for (const rodada of getSuperXSchedule(8)) {
        const partidasPorJogador: Record<number, number> = {};
        for (let i = 0; i < 8; i++) partidasPorJogador[i] = 0;

        for (const partida of rodada.partidas) {
          partidasPorJogador[partida.dupla1[0]]++;
          partidasPorJogador[partida.dupla1[1]]++;
          partidasPorJogador[partida.dupla2[0]]++;
          partidasPorJogador[partida.dupla2[1]]++;
        }

        for (let i = 0; i < 8; i++) {
          expect(partidasPorJogador[i]).toBe(1);
        }
      }

      // Super 12
      for (const rodada of getSuperXSchedule(12)) {
        const partidasPorJogador: Record<number, number> = {};
        for (let i = 0; i < 12; i++) partidasPorJogador[i] = 0;

        for (const partida of rodada.partidas) {
          partidasPorJogador[partida.dupla1[0]]++;
          partidasPorJogador[partida.dupla1[1]]++;
          partidasPorJogador[partida.dupla2[0]]++;
          partidasPorJogador[partida.dupla2[1]]++;
        }

        for (let i = 0; i < 12; i++) {
          expect(partidasPorJogador[i]).toBe(1);
        }
      }
    });
  });

  // ========== TESTES DO SERVICE ==========
  describe("gerarChaves", () => {
    it("deve lancar erro se etapa nao encontrada", async () => {
      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(null);

      await expect(
        service.gerarChaves(TEST_ETAPA_ID, TEST_ARENA_ID)
      ).rejects.toThrow("Etapa não encontrada");
    });

    it("deve lancar erro se inscricoes nao estao encerradas", async () => {
      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue({
        id: TEST_ETAPA_ID,
        status: StatusEtapa.INSCRICOES_ABERTAS,
      });

      await expect(
        service.gerarChaves(TEST_ETAPA_ID, TEST_ARENA_ID)
      ).rejects.toThrow("Inscrições devem estar encerradas");
    });

    it("deve lancar erro se chaves ja foram geradas", async () => {
      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue({
        id: TEST_ETAPA_ID,
        status: StatusEtapa.INSCRICOES_ENCERRADAS,
        chavesGeradas: true,
      });

      await expect(
        service.gerarChaves(TEST_ETAPA_ID, TEST_ARENA_ID)
      ).rejects.toThrow("Chaves já foram geradas");
    });

    it("deve lancar erro se variante Super X invalida", async () => {
      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue({
        id: TEST_ETAPA_ID,
        status: StatusEtapa.INSCRICOES_ENCERRADAS,
        chavesGeradas: false,
        varianteSuperX: 10, // Super 10 foi removido
        totalInscritos: 10,
        maxJogadores: 10,
      });

      await expect(
        service.gerarChaves(TEST_ETAPA_ID, TEST_ARENA_ID)
      ).rejects.toThrow("Variante Super X inválida");
    });

    it("deve lancar erro se numero de jogadores diferente da variante", async () => {
      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue({
        id: TEST_ETAPA_ID,
        status: StatusEtapa.INSCRICOES_ENCERRADAS,
        chavesGeradas: false,
        varianteSuperX: 8,
        totalInscritos: 6,
        maxJogadores: 8,
      });

      await expect(
        service.gerarChaves(TEST_ETAPA_ID, TEST_ARENA_ID)
      ).rejects.toThrow("Super 8 requer exatamente 8 jogadores");
    });

    it("deve lancar erro se total inscritos diferente do maximo", async () => {
      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue({
        id: TEST_ETAPA_ID,
        status: StatusEtapa.INSCRICOES_ENCERRADAS,
        chavesGeradas: false,
        varianteSuperX: 8,
        totalInscritos: 8,
        maxJogadores: 12,
      });

      await expect(
        service.gerarChaves(TEST_ETAPA_ID, TEST_ARENA_ID)
      ).rejects.toThrow("Etapa configurada para 12 jogadores");
    });

    it("deve gerar chaves com sucesso para Super 8", async () => {
      // Setup
      const inscricoes = Array.from({ length: 8 }, (_, i) => ({
        id: `inscricao-${i}`,
        jogadorId: `jogador-${i}`,
        jogadorNome: `Jogador ${i + 1}`,
        jogadorNivel: NivelJogador.INTERMEDIARIO,
        jogadorGenero: GeneroJogador.MASCULINO,
      }));

      const jogadoresEstatisticas = inscricoes.map((insc, i) => ({
        id: `stats-${i}`,
        jogadorId: insc.jogadorId,
        jogadorNome: insc.jogadorNome,
        jogadorNivel: insc.jogadorNivel,
        jogadorGenero: insc.jogadorGenero,
      }));

      const grupo = {
        id: "grupo-super8",
        nome: "Super 8",
        ordem: 1,
      };

      const partidas = Array.from({ length: 14 }, (_, i) => ({
        id: `partida-${i}`,
        rodada: Math.floor(i / 2) + 1,
      }));

      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue({
        id: TEST_ETAPA_ID,
        status: StatusEtapa.INSCRICOES_ENCERRADAS,
        chavesGeradas: false,
        varianteSuperX: 8,
        totalInscritos: 8,
        maxJogadores: 8,
      });

      mockInscricaoRepository.buscarConfirmadas.mockResolvedValue(inscricoes);
      (estatisticasJogadorService.criarEmLote as jest.Mock).mockResolvedValue(
        jogadoresEstatisticas
      );
      (estatisticasJogadorService.atualizarGrupoEmLote as jest.Mock).mockResolvedValue(
        undefined
      );
      mockGrupoRepository.criar.mockResolvedValue(grupo);
      mockPartidaReiDaPraiaRepository.criarEmLote.mockResolvedValue(partidas);
      mockGrupoRepository.adicionarPartidasEmLote.mockResolvedValue(undefined);
      mockEtapaRepository.marcarChavesGeradas.mockResolvedValue(undefined);

      // Execute
      const result = await service.gerarChaves(TEST_ETAPA_ID, TEST_ARENA_ID);

      // Verify
      expect(result.jogadores).toHaveLength(8);
      expect(result.grupo).toBeDefined();
      expect(result.partidas).toHaveLength(14);
      expect(mockEtapaRepository.marcarChavesGeradas).toHaveBeenCalledWith(
        TEST_ETAPA_ID,
        true
      );
    });

    it("deve gerar chaves com sucesso para Super 12", async () => {
      // Setup
      const inscricoes = Array.from({ length: 12 }, (_, i) => ({
        id: `inscricao-${i}`,
        jogadorId: `jogador-${i}`,
        jogadorNome: `Jogador ${i + 1}`,
        jogadorNivel: NivelJogador.INTERMEDIARIO,
        jogadorGenero: GeneroJogador.MASCULINO,
      }));

      const jogadoresEstatisticas = inscricoes.map((insc, i) => ({
        id: `stats-${i}`,
        jogadorId: insc.jogadorId,
        jogadorNome: insc.jogadorNome,
        jogadorNivel: insc.jogadorNivel,
        jogadorGenero: insc.jogadorGenero,
      }));

      const grupo = {
        id: "grupo-super12",
        nome: "Super 12",
        ordem: 1,
      };

      const partidas = Array.from({ length: 33 }, (_, i) => ({
        id: `partida-${i}`,
        rodada: Math.floor(i / 3) + 1,
      }));

      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue({
        id: TEST_ETAPA_ID,
        status: StatusEtapa.INSCRICOES_ENCERRADAS,
        chavesGeradas: false,
        varianteSuperX: 12,
        totalInscritos: 12,
        maxJogadores: 12,
      });

      mockInscricaoRepository.buscarConfirmadas.mockResolvedValue(inscricoes);
      (estatisticasJogadorService.criarEmLote as jest.Mock).mockResolvedValue(
        jogadoresEstatisticas
      );
      (estatisticasJogadorService.atualizarGrupoEmLote as jest.Mock).mockResolvedValue(
        undefined
      );
      mockGrupoRepository.criar.mockResolvedValue(grupo);
      mockPartidaReiDaPraiaRepository.criarEmLote.mockResolvedValue(partidas);
      mockGrupoRepository.adicionarPartidasEmLote.mockResolvedValue(undefined);
      mockEtapaRepository.marcarChavesGeradas.mockResolvedValue(undefined);

      // Execute
      const result = await service.gerarChaves(TEST_ETAPA_ID, TEST_ARENA_ID);

      // Verify
      expect(result.jogadores).toHaveLength(12);
      expect(result.grupo).toBeDefined();
      expect(result.partidas).toHaveLength(33);
    });

    it("deve lancar erro ao falhar ao criar estatisticas dos jogadores", async () => {
      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue({
        id: TEST_ETAPA_ID,
        status: StatusEtapa.INSCRICOES_ENCERRADAS,
        chavesGeradas: false,
        varianteSuperX: 8,
        totalInscritos: 8,
        maxJogadores: 8,
      });

      const inscricoes = Array.from({ length: 8 }, (_, i) => ({
        id: `inscricao-${i}`,
        jogadorId: `jogador-${i}`,
        jogadorNome: `Jogador ${i + 1}`,
        jogadorNivel: NivelJogador.INTERMEDIARIO,
        jogadorGenero: GeneroJogador.MASCULINO,
      }));

      mockInscricaoRepository.buscarConfirmadas.mockResolvedValue(inscricoes);
      (estatisticasJogadorService.criarEmLote as jest.Mock).mockRejectedValue(
        new Error("Erro ao criar estatisticas")
      );

      await expect(
        service.gerarChaves(TEST_ETAPA_ID, TEST_ARENA_ID)
      ).rejects.toThrow("Falha ao criar estatísticas dos jogadores");
    });

    it("deve lancar erro ao falhar ao criar grupo", async () => {
      const inscricoes = Array.from({ length: 8 }, (_, i) => ({
        id: `inscricao-${i}`,
        jogadorId: `jogador-${i}`,
        jogadorNome: `Jogador ${i + 1}`,
        jogadorNivel: NivelJogador.INTERMEDIARIO,
        jogadorGenero: GeneroJogador.MASCULINO,
      }));

      const jogadoresEstatisticas = inscricoes.map((insc, i) => ({
        id: `stats-${i}`,
        jogadorId: insc.jogadorId,
        jogadorNome: insc.jogadorNome,
      }));

      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue({
        id: TEST_ETAPA_ID,
        status: StatusEtapa.INSCRICOES_ENCERRADAS,
        chavesGeradas: false,
        varianteSuperX: 8,
        totalInscritos: 8,
        maxJogadores: 8,
      });

      mockInscricaoRepository.buscarConfirmadas.mockResolvedValue(inscricoes);
      (estatisticasJogadorService.criarEmLote as jest.Mock).mockResolvedValue(
        jogadoresEstatisticas
      );
      mockGrupoRepository.criar.mockRejectedValue(new Error("Erro ao criar grupo"));

      await expect(
        service.gerarChaves(TEST_ETAPA_ID, TEST_ARENA_ID)
      ).rejects.toThrow("Falha ao criar grupo");
    });
  });

  describe("registrarResultadoPartida", () => {
    it("deve lancar erro se placar nao tem exatamente 1 set", async () => {
      const placar = [
        { numero: 1, gamesDupla1: 6, gamesDupla2: 4 },
        { numero: 2, gamesDupla1: 6, gamesDupla2: 3 },
      ];

      await expect(
        service.registrarResultadoPartida("partida-1", TEST_ARENA_ID, placar)
      ).rejects.toThrow("Placar inválido: deve ter apenas 1 set");
    });

    it("deve lancar erro se partida nao encontrada", async () => {
      mockPartidaReiDaPraiaRepository.buscarPorIdEArena.mockResolvedValue(null);

      const placar = [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }];

      await expect(
        service.registrarResultadoPartida("partida-1", TEST_ARENA_ID, placar)
      ).rejects.toThrow("Partida não encontrada");
    });

    it("deve registrar resultado de nova partida com sucesso", async () => {
      const partida = {
        id: "partida-1",
        etapaId: TEST_ETAPA_ID,
        grupoId: "grupo-1",
        jogador1AId: "jogador-1",
        jogador1BId: "jogador-2",
        jogador2AId: "jogador-3",
        jogador2BId: "jogador-4",
        status: StatusPartida.AGENDADA,
        placar: null,
      };

      const estatisticasMap = new Map([
        ["jogador-1", { id: "stats-1", jogadorId: "jogador-1" }],
        ["jogador-2", { id: "stats-2", jogadorId: "jogador-2" }],
        ["jogador-3", { id: "stats-3", jogadorId: "jogador-3" }],
        ["jogador-4", { id: "stats-4", jogadorId: "jogador-4" }],
      ]);

      const jogadoresGrupo = [
        { id: "stats-1", jogadorId: "jogador-1", pontosGrupo: 1, saldoGamesGrupo: 2, saldoSetsGrupo: 1, gamesVencidosGrupo: 6 },
        { id: "stats-2", jogadorId: "jogador-2", pontosGrupo: 1, saldoGamesGrupo: 2, saldoSetsGrupo: 1, gamesVencidosGrupo: 6 },
        { id: "stats-3", jogadorId: "jogador-3", pontosGrupo: 0, saldoGamesGrupo: -2, saldoSetsGrupo: -1, gamesVencidosGrupo: 4 },
        { id: "stats-4", jogadorId: "jogador-4", pontosGrupo: 0, saldoGamesGrupo: -2, saldoSetsGrupo: -1, gamesVencidosGrupo: 4 },
      ];

      const partidasGrupo = [
        { id: "partida-1", status: StatusPartida.AGENDADA },
        { id: "partida-2", status: StatusPartida.AGENDADA },
      ];

      mockPartidaReiDaPraiaRepository.buscarPorIdEArena.mockResolvedValue(partida);
      (estatisticasJogadorService.buscarPorJogadoresEtapa as jest.Mock).mockResolvedValue(
        estatisticasMap
      );
      (estatisticasJogadorService.atualizarAposPartidaGrupoComIncrement as jest.Mock).mockResolvedValue(
        undefined
      );
      mockPartidaReiDaPraiaRepository.atualizar.mockResolvedValue(undefined);
      mockEstatisticasJogadorRepository.buscarPorGrupo.mockResolvedValue(jogadoresGrupo);
      mockPartidaReiDaPraiaRepository.buscarPorGrupo.mockResolvedValue(partidasGrupo);
      (estatisticasJogadorService.atualizarPosicoesGrupoEmLote as jest.Mock).mockResolvedValue(
        undefined
      );
      mockGrupoRepository.atualizar.mockResolvedValue(undefined);

      const placar = [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }];

      await service.registrarResultadoPartida("partida-1", TEST_ARENA_ID, placar);

      expect(mockPartidaReiDaPraiaRepository.atualizar).toHaveBeenCalledWith(
        "partida-1",
        expect.objectContaining({
          placar,
          setsDupla1: 1,
          setsDupla2: 0,
          vencedorDupla: 1,
          status: StatusPartida.FINALIZADA,
        })
      );
      expect(estatisticasJogadorService.atualizarAposPartidaGrupoComIncrement).toHaveBeenCalled();
    });

    it("deve reverter estatisticas ao editar partida ja finalizada", async () => {
      const partida = {
        id: "partida-1",
        etapaId: TEST_ETAPA_ID,
        grupoId: "grupo-1",
        jogador1AId: "jogador-1",
        jogador1BId: "jogador-2",
        jogador2AId: "jogador-3",
        jogador2BId: "jogador-4",
        status: StatusPartida.FINALIZADA,
        placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 3 }],
        setsDupla1: 1,
        setsDupla2: 0,
        vencedorDupla: 1,
      };

      const estatisticasMap = new Map([
        ["jogador-1", { id: "stats-1", jogadorId: "jogador-1" }],
        ["jogador-2", { id: "stats-2", jogadorId: "jogador-2" }],
        ["jogador-3", { id: "stats-3", jogadorId: "jogador-3" }],
        ["jogador-4", { id: "stats-4", jogadorId: "jogador-4" }],
      ]);

      const jogadoresGrupo = [
        { id: "stats-1", jogadorId: "jogador-1", pontosGrupo: 0, saldoGamesGrupo: 0, saldoSetsGrupo: 0, gamesVencidosGrupo: 0 },
        { id: "stats-2", jogadorId: "jogador-2", pontosGrupo: 0, saldoGamesGrupo: 0, saldoSetsGrupo: 0, gamesVencidosGrupo: 0 },
        { id: "stats-3", jogadorId: "jogador-3", pontosGrupo: 1, saldoGamesGrupo: 2, saldoSetsGrupo: 1, gamesVencidosGrupo: 6 },
        { id: "stats-4", jogadorId: "jogador-4", pontosGrupo: 1, saldoGamesGrupo: 2, saldoSetsGrupo: 1, gamesVencidosGrupo: 6 },
      ];

      const partidasGrupo = [
        { id: "partida-1", status: StatusPartida.FINALIZADA },
      ];

      mockPartidaReiDaPraiaRepository.buscarPorIdEArena.mockResolvedValue(partida);
      (estatisticasJogadorService.buscarPorJogadoresEtapa as jest.Mock).mockResolvedValue(
        estatisticasMap
      );
      (estatisticasJogadorService.reverterAposPartidaComIncrement as jest.Mock).mockResolvedValue(
        undefined
      );
      (estatisticasJogadorService.atualizarAposPartidaGrupoComIncrement as jest.Mock).mockResolvedValue(
        undefined
      );
      mockPartidaReiDaPraiaRepository.atualizar.mockResolvedValue(undefined);
      mockEstatisticasJogadorRepository.buscarPorGrupo.mockResolvedValue(jogadoresGrupo);
      mockPartidaReiDaPraiaRepository.buscarPorGrupo.mockResolvedValue(partidasGrupo);
      (estatisticasJogadorService.atualizarPosicoesGrupoEmLote as jest.Mock).mockResolvedValue(
        undefined
      );
      mockGrupoRepository.atualizar.mockResolvedValue(undefined);

      const placar = [{ numero: 1, gamesDupla1: 4, gamesDupla2: 6 }]; // Invertendo resultado

      await service.registrarResultadoPartida("partida-1", TEST_ARENA_ID, placar);

      // Deve ter chamado reversao antes de aplicar novo resultado
      expect(estatisticasJogadorService.reverterAposPartidaComIncrement).toHaveBeenCalled();
      expect(estatisticasJogadorService.atualizarAposPartidaGrupoComIncrement).toHaveBeenCalled();
    });

    it("deve marcar grupo como completo quando todas partidas finalizadas", async () => {
      const partida = {
        id: "partida-2",
        etapaId: TEST_ETAPA_ID,
        grupoId: "grupo-1",
        jogador1AId: "jogador-1",
        jogador1BId: "jogador-2",
        jogador2AId: "jogador-3",
        jogador2BId: "jogador-4",
        status: StatusPartida.AGENDADA,
        placar: null,
      };

      const estatisticasMap = new Map([
        ["jogador-1", { id: "stats-1", jogadorId: "jogador-1" }],
        ["jogador-2", { id: "stats-2", jogadorId: "jogador-2" }],
        ["jogador-3", { id: "stats-3", jogadorId: "jogador-3" }],
        ["jogador-4", { id: "stats-4", jogadorId: "jogador-4" }],
      ]);

      const jogadoresGrupo = [
        { id: "stats-1", jogadorId: "jogador-1", pontosGrupo: 2, saldoGamesGrupo: 4, saldoSetsGrupo: 2, gamesVencidosGrupo: 12 },
        { id: "stats-2", jogadorId: "jogador-2", pontosGrupo: 2, saldoGamesGrupo: 4, saldoSetsGrupo: 2, gamesVencidosGrupo: 12 },
        { id: "stats-3", jogadorId: "jogador-3", pontosGrupo: 0, saldoGamesGrupo: -4, saldoSetsGrupo: -2, gamesVencidosGrupo: 8 },
        { id: "stats-4", jogadorId: "jogador-4", pontosGrupo: 0, saldoGamesGrupo: -4, saldoSetsGrupo: -2, gamesVencidosGrupo: 8 },
      ];

      const partidasGrupo = [
        { id: "partida-1", status: StatusPartida.FINALIZADA },
        { id: "partida-2", status: StatusPartida.AGENDADA }, // Esta sera finalizada
      ];

      mockPartidaReiDaPraiaRepository.buscarPorIdEArena.mockResolvedValue(partida);
      (estatisticasJogadorService.buscarPorJogadoresEtapa as jest.Mock).mockResolvedValue(
        estatisticasMap
      );
      (estatisticasJogadorService.atualizarAposPartidaGrupoComIncrement as jest.Mock).mockResolvedValue(
        undefined
      );
      mockPartidaReiDaPraiaRepository.atualizar.mockResolvedValue(undefined);
      mockEstatisticasJogadorRepository.buscarPorGrupo.mockResolvedValue(jogadoresGrupo);
      mockPartidaReiDaPraiaRepository.buscarPorGrupo.mockResolvedValue(partidasGrupo);
      (estatisticasJogadorService.atualizarPosicoesGrupoEmLote as jest.Mock).mockResolvedValue(
        undefined
      );
      mockGrupoRepository.atualizar.mockResolvedValue(undefined);

      const placar = [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }];

      await service.registrarResultadoPartida("partida-2", TEST_ARENA_ID, placar);

      // Grupo deve ser marcado como completo
      expect(mockGrupoRepository.atualizar).toHaveBeenCalledWith(
        "grupo-1",
        expect.objectContaining({
          completo: true,
          partidasFinalizadas: 2,
        })
      );
    });
  });

  describe("registrarResultadosEmLote", () => {
    it("deve processar multiplos resultados com sucesso", async () => {
      const partidas = [
        {
          id: "partida-1",
          etapaId: TEST_ETAPA_ID,
          grupoId: "grupo-1",
          jogador1AId: "jogador-1",
          jogador1BId: "jogador-2",
          jogador2AId: "jogador-3",
          jogador2BId: "jogador-4",
          status: StatusPartida.AGENDADA,
          placar: null,
        },
        {
          id: "partida-2",
          etapaId: TEST_ETAPA_ID,
          grupoId: "grupo-1",
          jogador1AId: "jogador-5",
          jogador1BId: "jogador-6",
          jogador2AId: "jogador-7",
          jogador2BId: "jogador-8",
          status: StatusPartida.AGENDADA,
          placar: null,
        },
      ];

      const estatisticasMap = new Map([
        ["jogador-1", { id: "stats-1", jogadorId: "jogador-1" }],
        ["jogador-2", { id: "stats-2", jogadorId: "jogador-2" }],
        ["jogador-3", { id: "stats-3", jogadorId: "jogador-3" }],
        ["jogador-4", { id: "stats-4", jogadorId: "jogador-4" }],
        ["jogador-5", { id: "stats-5", jogadorId: "jogador-5" }],
        ["jogador-6", { id: "stats-6", jogadorId: "jogador-6" }],
        ["jogador-7", { id: "stats-7", jogadorId: "jogador-7" }],
        ["jogador-8", { id: "stats-8", jogadorId: "jogador-8" }],
      ]);

      const jogadoresGrupo = [
        { id: "stats-1", jogadorId: "jogador-1", pontosGrupo: 1, saldoGamesGrupo: 2, saldoSetsGrupo: 1, gamesVencidosGrupo: 6 },
      ];

      const partidasGrupo = [
        { id: "partida-1", status: StatusPartida.FINALIZADA },
        { id: "partida-2", status: StatusPartida.FINALIZADA },
      ];

      mockPartidaReiDaPraiaRepository.buscarPorIdEArena
        .mockResolvedValueOnce(partidas[0])
        .mockResolvedValueOnce(partidas[1]);

      (estatisticasJogadorService.buscarPorJogadoresEtapa as jest.Mock).mockResolvedValue(
        estatisticasMap
      );
      (estatisticasJogadorService.atualizarAposPartidaGrupoComIncrement as jest.Mock).mockResolvedValue(
        undefined
      );
      mockPartidaReiDaPraiaRepository.atualizar.mockResolvedValue(undefined);
      mockEstatisticasJogadorRepository.buscarPorGrupo.mockResolvedValue(jogadoresGrupo);
      mockPartidaReiDaPraiaRepository.buscarPorGrupo.mockResolvedValue(partidasGrupo);
      (estatisticasJogadorService.atualizarPosicoesGrupoEmLote as jest.Mock).mockResolvedValue(
        undefined
      );
      mockGrupoRepository.atualizar.mockResolvedValue(undefined);

      const resultados = [
        { partidaId: "partida-1", placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }] },
        { partidaId: "partida-2", placar: [{ numero: 1, gamesDupla1: 4, gamesDupla2: 6 }] },
      ];

      const result = await service.registrarResultadosEmLote(
        TEST_ETAPA_ID,
        TEST_ARENA_ID,
        resultados
      );

      expect(result.processados).toBe(2);
      expect(result.erros).toHaveLength(0);
    });

    it("deve retornar erro quando partida nao encontrada", async () => {
      mockPartidaReiDaPraiaRepository.buscarPorIdEArena.mockResolvedValue(null);
      (estatisticasJogadorService.buscarPorJogadoresEtapa as jest.Mock).mockResolvedValue(
        new Map()
      );

      const resultados = [
        { partidaId: "partida-inexistente", placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }] },
      ];

      const result = await service.registrarResultadosEmLote(
        TEST_ETAPA_ID,
        TEST_ARENA_ID,
        resultados
      );

      expect(result.processados).toBe(0);
      expect(result.erros).toHaveLength(1);
      expect(result.erros[0].erro).toBe("Partida não encontrada");
    });

    it("deve retornar erro quando placar invalido", async () => {
      const partida = {
        id: "partida-1",
        etapaId: TEST_ETAPA_ID,
        grupoId: "grupo-1",
        jogador1AId: "jogador-1",
        jogador1BId: "jogador-2",
        jogador2AId: "jogador-3",
        jogador2BId: "jogador-4",
        status: StatusPartida.AGENDADA,
        placar: null,
      };

      mockPartidaReiDaPraiaRepository.buscarPorIdEArena.mockResolvedValue(partida);
      (estatisticasJogadorService.buscarPorJogadoresEtapa as jest.Mock).mockResolvedValue(
        new Map()
      );

      const resultados = [
        {
          partidaId: "partida-1",
          placar: [
            { numero: 1, gamesDupla1: 6, gamesDupla2: 4 },
            { numero: 2, gamesDupla1: 6, gamesDupla2: 3 },
          ],
        },
      ];

      const result = await service.registrarResultadosEmLote(
        TEST_ETAPA_ID,
        TEST_ARENA_ID,
        resultados
      );

      expect(result.processados).toBe(0);
      expect(result.erros).toHaveLength(1);
      expect(result.erros[0].erro).toBe("Placar deve ter exatamente 1 set");
    });

    it("deve reverter resultados anteriores ao editar em lote", async () => {
      const partida = {
        id: "partida-1",
        etapaId: TEST_ETAPA_ID,
        grupoId: "grupo-1",
        jogador1AId: "jogador-1",
        jogador1BId: "jogador-2",
        jogador2AId: "jogador-3",
        jogador2BId: "jogador-4",
        status: StatusPartida.FINALIZADA,
        placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 3 }],
        setsDupla1: 1,
        setsDupla2: 0,
        vencedorDupla: 1,
      };

      const estatisticasMap = new Map([
        ["jogador-1", { id: "stats-1", jogadorId: "jogador-1" }],
        ["jogador-2", { id: "stats-2", jogadorId: "jogador-2" }],
        ["jogador-3", { id: "stats-3", jogadorId: "jogador-3" }],
        ["jogador-4", { id: "stats-4", jogadorId: "jogador-4" }],
      ]);

      const jogadoresGrupo = [
        { id: "stats-1", jogadorId: "jogador-1", pontosGrupo: 0, saldoGamesGrupo: 0, saldoSetsGrupo: 0, gamesVencidosGrupo: 0 },
      ];

      const partidasGrupo = [{ id: "partida-1", status: StatusPartida.FINALIZADA }];

      mockPartidaReiDaPraiaRepository.buscarPorIdEArena.mockResolvedValue(partida);
      (estatisticasJogadorService.buscarPorJogadoresEtapa as jest.Mock).mockResolvedValue(
        estatisticasMap
      );
      (estatisticasJogadorService.reverterAposPartidaComIncrement as jest.Mock).mockResolvedValue(
        undefined
      );
      (estatisticasJogadorService.atualizarAposPartidaGrupoComIncrement as jest.Mock).mockResolvedValue(
        undefined
      );
      mockPartidaReiDaPraiaRepository.atualizar.mockResolvedValue(undefined);
      mockEstatisticasJogadorRepository.buscarPorGrupo.mockResolvedValue(jogadoresGrupo);
      mockPartidaReiDaPraiaRepository.buscarPorGrupo.mockResolvedValue(partidasGrupo);
      (estatisticasJogadorService.atualizarPosicoesGrupoEmLote as jest.Mock).mockResolvedValue(
        undefined
      );
      mockGrupoRepository.atualizar.mockResolvedValue(undefined);

      const resultados = [
        { partidaId: "partida-1", placar: [{ numero: 1, gamesDupla1: 3, gamesDupla2: 6 }] },
      ];

      const result = await service.registrarResultadosEmLote(
        TEST_ETAPA_ID,
        TEST_ARENA_ID,
        resultados
      );

      expect(result.processados).toBe(1);
      expect(estatisticasJogadorService.reverterAposPartidaComIncrement).toHaveBeenCalled();
    });
  });

  describe("buscarJogadores", () => {
    it("deve retornar jogadores da etapa", async () => {
      const jogadores = [
        { id: "stats-1", jogadorId: "jogador-1", jogadorNome: "Jogador 1" },
        { id: "stats-2", jogadorId: "jogador-2", jogadorNome: "Jogador 2" },
      ];

      mockEstatisticasJogadorRepository.buscarPorEtapa.mockResolvedValue(jogadores);

      const result = await service.buscarJogadores(TEST_ETAPA_ID, TEST_ARENA_ID);

      expect(result).toEqual(jogadores);
      expect(mockEstatisticasJogadorRepository.buscarPorEtapa).toHaveBeenCalledWith(
        TEST_ETAPA_ID,
        TEST_ARENA_ID
      );
    });
  });

  describe("buscarPartidas", () => {
    it("deve retornar partidas da etapa", async () => {
      const partidas = [
        { id: "partida-1", rodada: 1 },
        { id: "partida-2", rodada: 1 },
      ];

      mockPartidaReiDaPraiaRepository.buscarPorEtapa.mockResolvedValue(partidas);

      const result = await service.buscarPartidas(TEST_ETAPA_ID, TEST_ARENA_ID);

      expect(result).toEqual(partidas);
      expect(mockPartidaReiDaPraiaRepository.buscarPorEtapa).toHaveBeenCalledWith(
        TEST_ETAPA_ID,
        TEST_ARENA_ID
      );
    });
  });

  describe("buscarPartidasPorRodada", () => {
    it("deve retornar apenas partidas da rodada especificada", async () => {
      const partidas = [
        { id: "partida-1", rodada: 1 },
        { id: "partida-2", rodada: 1 },
        { id: "partida-3", rodada: 2 },
        { id: "partida-4", rodada: 2 },
      ];

      mockPartidaReiDaPraiaRepository.buscarPorEtapa.mockResolvedValue(partidas);

      const result = await service.buscarPartidasPorRodada(
        TEST_ETAPA_ID,
        TEST_ARENA_ID,
        1
      );

      expect(result).toHaveLength(2);
      expect(result.every((p) => p.rodada === 1)).toBe(true);
    });
  });

  describe("buscarGrupo", () => {
    it("deve retornar grupo da etapa se existir", async () => {
      const grupo = { id: "grupo-1", nome: "Super 8" };

      mockGrupoRepository.buscarPorEtapa.mockResolvedValue([grupo]);

      const result = await service.buscarGrupo(TEST_ETAPA_ID, TEST_ARENA_ID);

      expect(result).toEqual(grupo);
    });

    it("deve retornar null se nao existir grupo", async () => {
      mockGrupoRepository.buscarPorEtapa.mockResolvedValue([]);

      const result = await service.buscarGrupo(TEST_ETAPA_ID, TEST_ARENA_ID);

      expect(result).toBeNull();
    });
  });

  describe("cancelarChaves", () => {
    it("deve lancar erro se etapa nao encontrada", async () => {
      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(null);

      await expect(
        service.cancelarChaves(TEST_ETAPA_ID, TEST_ARENA_ID)
      ).rejects.toThrow("Etapa não encontrada");
    });

    it("deve lancar erro se chaves nao foram geradas", async () => {
      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue({
        id: TEST_ETAPA_ID,
        chavesGeradas: false,
      });

      await expect(
        service.cancelarChaves(TEST_ETAPA_ID, TEST_ARENA_ID)
      ).rejects.toThrow("Chaves ainda não foram geradas");
    });

    it("deve cancelar chaves com sucesso", async () => {
      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue({
        id: TEST_ETAPA_ID,
        chavesGeradas: true,
      });

      mockGrupoRepository.deletarPorEtapa.mockResolvedValue(1);
      mockPartidaReiDaPraiaRepository.deletarPorEtapa.mockResolvedValue(14);
      mockEstatisticasJogadorRepository.deletarPorEtapa.mockResolvedValue(8);
      mockEtapaRepository.marcarChavesGeradas.mockResolvedValue(undefined);
      mockEtapaRepository.atualizarStatus.mockResolvedValue(undefined);

      await service.cancelarChaves(TEST_ETAPA_ID, TEST_ARENA_ID);

      expect(mockGrupoRepository.deletarPorEtapa).toHaveBeenCalledWith(
        TEST_ETAPA_ID,
        TEST_ARENA_ID
      );
      expect(mockPartidaReiDaPraiaRepository.deletarPorEtapa).toHaveBeenCalledWith(
        TEST_ETAPA_ID,
        TEST_ARENA_ID
      );
      expect(mockEstatisticasJogadorRepository.deletarPorEtapa).toHaveBeenCalledWith(
        TEST_ETAPA_ID,
        TEST_ARENA_ID
      );
      expect(mockEtapaRepository.marcarChavesGeradas).toHaveBeenCalledWith(
        TEST_ETAPA_ID,
        false
      );
      expect(mockEtapaRepository.atualizarStatus).toHaveBeenCalledWith(
        TEST_ETAPA_ID,
        StatusEtapa.INSCRICOES_ENCERRADAS
      );
    });
  });
});
