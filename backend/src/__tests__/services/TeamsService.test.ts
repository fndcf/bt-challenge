/**
 * Testes para TeamsService
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

jest.mock("../../config/firebase", () => ({
  db: {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        update: jest.fn().mockResolvedValue(undefined),
      })),
    })),
  },
}));

jest.mock("firebase-admin/firestore", () => ({
  Timestamp: {
    now: jest.fn(() => ({ seconds: 1234567890, nanoseconds: 0 })),
  },
}));

jest.mock("../../repositories/firebase/EstatisticasJogadorRepository", () => ({
  estatisticasJogadorRepository: {
    deletarPorEtapa: jest.fn().mockResolvedValue(undefined),
    buscarPorJogadorEEtapa: jest.fn(),
    atualizar: jest.fn(),
    buscarPorGrupo: jest.fn(),
    atualizarPosicaoGrupo: jest.fn(),
    atualizarPontuacao: jest.fn(),
    incrementarEstatisticas: jest.fn(),
    criarEmLote: jest.fn(),
    criar: jest.fn(),
    buscarPorId: jest.fn(),
  },
}));

import { TeamsService } from "../../services/TeamsService";
import { StatusEtapa, FaseEtapa, FormatoEtapa } from "../../models/Etapa";
import {
  VarianteTeams,
  TipoFormacaoEquipe,
  TipoFormacaoJogos,
  TipoJogoTeams,
} from "../../models/Teams";
import { NivelJogador, GeneroJogador } from "../../models/Jogador";
import { TEST_IDS } from "../fixtures";
import { ValidationError, NotFoundError } from "../../utils/errors";

describe("TeamsService", () => {
  let service: TeamsService;

  // Mock repositories
  const mockEquipeRepository = {
    criar: jest.fn(),
    criarEmLote: jest.fn(),
    buscarPorId: jest.fn(),
    buscarPorEtapa: jest.fn(),
    buscarPorEtapaOrdenadas: jest.fn(),
    atualizar: jest.fn(),
    deletar: jest.fn(),
    deletarPorEtapa: jest.fn(),
    atualizarEstatisticas: jest.fn(),
    incrementarEstatisticasEmLote: jest.fn(),
    buscarPorIds: jest.fn(),
    atualizarEmLote: jest.fn(),
    atualizarPosicoesEmLote: jest.fn(),
    marcarClassificada: jest.fn(),
    buscarClassificadas: jest.fn(),
    buscarPorClassificacao: jest.fn(),
  };

  const mockConfrontoRepository = {
    criar: jest.fn(),
    criarEmLote: jest.fn(),
    buscarPorId: jest.fn(),
    buscarPorEtapa: jest.fn(),
    buscarPorEtapaOrdenados: jest.fn(),
    atualizar: jest.fn(),
    deletar: jest.fn(),
    deletarPorEtapa: jest.fn(),
    buscarPorFase: jest.fn(),
    buscarPorRodada: jest.fn(),
    buscarPorEquipe: jest.fn(),
    registrarResultado: jest.fn(),
    atualizarStatus: jest.fn(),
    adicionarPartida: jest.fn(),
    adicionarPartidasEmLote: jest.fn(),
    incrementarPartidasFinalizadas: jest.fn(),
    atualizarContadorJogos: jest.fn(),
    marcarTemDecider: jest.fn(),
    contarFinalizados: jest.fn(),
    contarPorFase: jest.fn(),
    todosFinalizadosPorFase: jest.fn(),
    resetarConfronto: jest.fn(),
  };

  const mockPartidaRepository = {
    criar: jest.fn(),
    criarEmLote: jest.fn(),
    buscarPorId: jest.fn(),
    buscarPorEtapa: jest.fn(),
    buscarPorConfronto: jest.fn(),
    buscarPorConfrontoOrdenadas: jest.fn(),
    atualizar: jest.fn(),
    deletar: jest.fn(),
    deletarPorEtapa: jest.fn(),
    deletarPorConfronto: jest.fn(),
    buscarPorTipo: jest.fn(),
    buscarDecider: jest.fn(),
    registrarResultado: jest.fn(),
    atualizarStatus: jest.fn(),
    limparResultado: jest.fn(),
    contarFinalizadasPorConfronto: jest.fn(),
    contarPorConfronto: jest.fn(),
    existeDecider: jest.fn(),
  };

  const mockEstatisticasService = {
    criar: jest.fn(),
    criarEmLote: jest.fn(),
    buscarPorGrupo: jest.fn(),
    atualizar: jest.fn(),
    atualizarAposPartida: jest.fn(),
    reverterAposPartida: jest.fn(),
    atualizarPosicaoGrupo: jest.fn(),
    atualizarPosicoesGrupoEmLote: jest.fn(),
    incrementarEstatisticas: jest.fn(),
    buscarPorJogadoresEtapa: jest.fn(),
    atualizarAposPartidaGrupoComIncrement: jest.fn(),
    reverterAposPartidaComIncrement: jest.fn(),
    marcarComoClassificadoEmLote: jest.fn(),
  };

  const mockEtapaRepository = {
    buscarPorId: jest.fn(),
    buscarPorIdEArena: jest.fn(),
    atualizar: jest.fn(),
    marcarChavesGeradas: jest.fn(),
    atualizarStatus: jest.fn(),
  };

  const TEST_ARENA_ID = TEST_IDS.arena;
  const TEST_ETAPA_ID = TEST_IDS.etapa;

  const criarEtapaTeams = (overrides = {}) => ({
    id: TEST_ETAPA_ID,
    arenaId: TEST_ARENA_ID,
    formato: FormatoEtapa.TEAMS,
    status: StatusEtapa.INSCRICOES_ENCERRADAS,
    varianteTeams: VarianteTeams.TEAMS_4,
    tipoFormacaoEquipe: TipoFormacaoEquipe.BALANCEADO,
    tipoFormacaoJogos: TipoFormacaoJogos.SORTEIO,
    genero: GeneroJogador.MASCULINO,
    isMisto: false,
    chavesGeradas: false,
    ...overrides,
  });

  const criarInscricoes = (quantidade: number) =>
    Array.from({ length: quantidade }, (_, i) => ({
      jogadorId: `jogador-${i}`,
      jogadorNome: `Jogador ${i + 1}`,
      nivel: NivelJogador.INTERMEDIARIO,
      genero: i % 2 === 0 ? GeneroJogador.MASCULINO : GeneroJogador.FEMININO,
    }));

  beforeEach(() => {
    jest.clearAllMocks();

    service = new TeamsService(
      mockEquipeRepository as any,
      mockConfrontoRepository as any,
      mockPartidaRepository as any,
      mockEstatisticasService as any,
      mockEtapaRepository as any
    );
  });

  // ==================== GERAR EQUIPES ====================
  describe("gerarEquipes", () => {
    it("deve lancar erro se etapa nao for formato TEAMS", async () => {
      const etapa = criarEtapaTeams({ formato: FormatoEtapa.DUPLA_FIXA });
      const inscricoes = criarInscricoes(6);

      await expect(service.gerarEquipes(etapa as any, inscricoes)).rejects.toThrow(
        ValidationError
      );
    });

    it("deve lancar erro se inscricoes nao estao encerradas", async () => {
      const etapa = criarEtapaTeams({ status: StatusEtapa.INSCRICOES_ABERTAS });
      const inscricoes = criarInscricoes(6);

      await expect(service.gerarEquipes(etapa as any, inscricoes)).rejects.toThrow(
        ValidationError
      );
    });

    it("deve lancar erro se varianteTeams nao definida", async () => {
      const etapa = criarEtapaTeams({ varianteTeams: undefined });
      const inscricoes = criarInscricoes(6);

      await expect(service.gerarEquipes(etapa as any, inscricoes)).rejects.toThrow(
        ValidationError
      );
    });

    it("deve lancar erro se tipoFormacaoEquipe nao definido", async () => {
      const etapa = criarEtapaTeams({ tipoFormacaoEquipe: undefined });
      const inscricoes = criarInscricoes(6);

      await expect(service.gerarEquipes(etapa as any, inscricoes)).rejects.toThrow(
        ValidationError
      );
    });

    it("deve gerar equipes TEAMS_4 com sucesso usando formacao BALANCEADO", async () => {
      const etapa = criarEtapaTeams({
        varianteTeams: VarianteTeams.TEAMS_4,
        tipoFormacaoEquipe: TipoFormacaoEquipe.BALANCEADO,
      });
      const inscricoes = criarInscricoes(12); // 3 equipes de 4

      const equipesGeradas = [
        { id: "equipe-1", nome: "Equipe 1", jogadores: inscricoes.slice(0, 4) },
        { id: "equipe-2", nome: "Equipe 2", jogadores: inscricoes.slice(4, 8) },
        { id: "equipe-3", nome: "Equipe 3", jogadores: inscricoes.slice(8, 12) },
      ];

      mockEquipeRepository.criarEmLote.mockResolvedValue(equipesGeradas);
      mockEstatisticasService.criarEmLote.mockResolvedValue([]);

      const result = await service.gerarEquipes(etapa as any, inscricoes);

      expect(result.equipes).toHaveLength(3);
      expect(mockEquipeRepository.criarEmLote).toHaveBeenCalled();
      expect(mockEstatisticasService.criarEmLote).toHaveBeenCalled();
    });

    it("deve gerar equipes TEAMS_6 com sucesso usando formacao MESMO_NIVEL", async () => {
      const etapa = criarEtapaTeams({
        varianteTeams: VarianteTeams.TEAMS_6,
        tipoFormacaoEquipe: TipoFormacaoEquipe.MESMO_NIVEL,
      });
      const inscricoes = criarInscricoes(12); // 2 equipes de 6

      const equipesGeradas = [
        { id: "equipe-1", nome: "Equipe 1", jogadores: inscricoes.slice(0, 6) },
        { id: "equipe-2", nome: "Equipe 2", jogadores: inscricoes.slice(6, 12) },
      ];

      mockEquipeRepository.criarEmLote.mockResolvedValue(equipesGeradas);
      mockEstatisticasService.criarEmLote.mockResolvedValue([]);

      const result = await service.gerarEquipes(etapa as any, inscricoes);

      expect(result.equipes).toHaveLength(2);
      expect(result.temFaseGrupos).toBe(false); // < 6 equipes
    });

    it("deve ter fase de grupos quando 6+ equipes", async () => {
      const etapa = criarEtapaTeams({
        varianteTeams: VarianteTeams.TEAMS_4,
        tipoFormacaoEquipe: TipoFormacaoEquipe.BALANCEADO,
      });
      const inscricoes = criarInscricoes(24); // 6 equipes de 4

      const equipesGeradas = Array.from({ length: 6 }, (_, i) => ({
        id: `equipe-${i}`,
        nome: `Equipe ${i + 1}`,
        jogadores: inscricoes.slice(i * 4, (i + 1) * 4),
        grupoId: i < 3 ? "A" : "B",
        grupoNome: i < 3 ? "Grupo A" : "Grupo B",
      }));

      mockEquipeRepository.criarEmLote.mockResolvedValue(equipesGeradas);
      mockEstatisticasService.criarEmLote.mockResolvedValue([]);

      const result = await service.gerarEquipes(etapa as any, inscricoes);

      expect(result.equipes).toHaveLength(6);
      expect(result.temFaseGrupos).toBe(true);
    });

    it("deve gerar equipes mistas com distribuicao correta de genero", async () => {
      const etapa = criarEtapaTeams({
        varianteTeams: VarianteTeams.TEAMS_4,
        tipoFormacaoEquipe: TipoFormacaoEquipe.BALANCEADO,
        genero: GeneroJogador.MISTO,
        isMisto: true,
      });
      // 8 jogadores - 4 masculinos e 4 femininos para 2 equipes mistas de 4
      const inscricoes = [
        { jogadorId: "j1", jogadorNome: "Jogador 1", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
        { jogadorId: "j2", jogadorNome: "Jogador 2", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
        { jogadorId: "j3", jogadorNome: "Jogador 3", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.FEMININO },
        { jogadorId: "j4", jogadorNome: "Jogador 4", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.FEMININO },
        { jogadorId: "j5", jogadorNome: "Jogador 5", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
        { jogadorId: "j6", jogadorNome: "Jogador 6", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
        { jogadorId: "j7", jogadorNome: "Jogador 7", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.FEMININO },
        { jogadorId: "j8", jogadorNome: "Jogador 8", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.FEMININO },
      ];

      const equipesGeradas = [
        { id: "equipe-1", nome: "Equipe 1", jogadores: inscricoes.slice(0, 4) },
        { id: "equipe-2", nome: "Equipe 2", jogadores: inscricoes.slice(4, 8) },
      ];

      mockEquipeRepository.criarEmLote.mockResolvedValue(equipesGeradas);
      mockEstatisticasService.criarEmLote.mockResolvedValue([]);

      const result = await service.gerarEquipes(etapa as any, inscricoes);

      expect(result.equipes).toHaveLength(2);
    });
  });

  // ==================== FORMAR EQUIPES MANUALMENTE ====================
  describe("formarEquipesManualmente", () => {
    it("deve lancar erro se equipe nao tiver jogadores suficientes", async () => {
      const etapa = criarEtapaTeams({ varianteTeams: VarianteTeams.TEAMS_4 });
      const inscricoes = criarInscricoes(8);

      const formacoes = [
        { nome: "Equipe A", jogadorIds: ["jogador-0", "jogador-1", "jogador-2"] }, // Faltando 1
        { nome: "Equipe B", jogadorIds: ["jogador-4", "jogador-5", "jogador-6", "jogador-7"] },
      ];

      await expect(
        service.formarEquipesManualmente(etapa as any, inscricoes, formacoes)
      ).rejects.toThrow("Cada equipe deve ter exatamente 4 jogadores");
    });

    it("deve lancar erro se jogador nao esta inscrito", async () => {
      const etapa = criarEtapaTeams({ varianteTeams: VarianteTeams.TEAMS_4 });
      const inscricoes = criarInscricoes(8);

      const formacoes = [
        { nome: "Equipe A", jogadorIds: ["jogador-0", "jogador-1", "jogador-2", "jogador-inexistente"] },
        { nome: "Equipe B", jogadorIds: ["jogador-4", "jogador-5", "jogador-6", "jogador-7"] },
      ];

      await expect(
        service.formarEquipesManualmente(etapa as any, inscricoes, formacoes)
      ).rejects.toThrow("Jogador jogador-inexistente não está inscrito");
    });

    it("deve lancar erro se jogador esta em multiplas equipes", async () => {
      const etapa = criarEtapaTeams({ varianteTeams: VarianteTeams.TEAMS_4 });
      const inscricoes = criarInscricoes(8);

      const formacoes = [
        { nome: "Equipe A", jogadorIds: ["jogador-0", "jogador-1", "jogador-2", "jogador-3"] },
        { nome: "Equipe B", jogadorIds: ["jogador-0", "jogador-5", "jogador-6", "jogador-7"] }, // jogador-0 repetido
      ];

      await expect(
        service.formarEquipesManualmente(etapa as any, inscricoes, formacoes)
      ).rejects.toThrow("Jogador jogador-0 já está em outra equipe");
    });

    it("deve formar equipes manualmente com sucesso", async () => {
      const etapa = criarEtapaTeams({ varianteTeams: VarianteTeams.TEAMS_4 });
      const inscricoes = criarInscricoes(8);

      const formacoes = [
        { nome: "Os Bons", jogadorIds: ["jogador-0", "jogador-1", "jogador-2", "jogador-3"] },
        { nome: "Os Melhores", jogadorIds: ["jogador-4", "jogador-5", "jogador-6", "jogador-7"] },
      ];

      const equipesGeradas = [
        { id: "equipe-1", nome: "Os Bons", jogadores: inscricoes.slice(0, 4) },
        { id: "equipe-2", nome: "Os Melhores", jogadores: inscricoes.slice(4, 8) },
      ];

      mockEquipeRepository.criarEmLote.mockResolvedValue(equipesGeradas);
      mockEstatisticasService.criarEmLote.mockResolvedValue([]);

      const result = await service.formarEquipesManualmente(
        etapa as any,
        inscricoes,
        formacoes
      );

      expect(result.equipes).toHaveLength(2);
      expect(result.equipes[0].nome).toBe("Os Bons");
      expect(result.equipes[1].nome).toBe("Os Melhores");
    });

    it("deve lancar erro se proporcao de genero incorreta em etapa mista", async () => {
      const etapa = criarEtapaTeams({
        varianteTeams: VarianteTeams.TEAMS_4,
        isMisto: true,
        genero: GeneroJogador.MISTO,
      });
      const inscricoes = [
        { jogadorId: "j1", jogadorNome: "J1", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
        { jogadorId: "j2", jogadorNome: "J2", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
        { jogadorId: "j3", jogadorNome: "J3", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
        { jogadorId: "j4", jogadorNome: "J4", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
      ];

      const formacoes = [
        { nome: "Equipe A", jogadorIds: ["j1", "j2", "j3", "j4"] }, // 4 masculinos, deveria ser 2M + 2F
      ];

      await expect(
        service.formarEquipesManualmente(etapa as any, inscricoes, formacoes)
      ).rejects.toThrow(/Cada equipe mista deve ter/);
    });
  });

  // ==================== GERAR CONFRONTOS ====================
  describe("gerarConfrontos", () => {
    it("deve lancar erro se menos de 2 equipes", async () => {
      const etapa = criarEtapaTeams();

      mockEquipeRepository.buscarPorEtapaOrdenadas.mockResolvedValue([
        { id: "equipe-1", nome: "Equipe 1" },
      ]);

      await expect(
        service.gerarConfrontos(etapa as any, TipoFormacaoJogos.SORTEIO)
      ).rejects.toThrow("Mínimo de 2 equipes para gerar confrontos");
    });

    it("deve gerar confrontos round-robin para menos de 6 equipes", async () => {
      const etapa = criarEtapaTeams();
      const equipes = [
        { id: "e1", nome: "Equipe 1", jogadores: [] },
        { id: "e2", nome: "Equipe 2", jogadores: [] },
        { id: "e3", nome: "Equipe 3", jogadores: [] },
      ];

      const confrontosGerados = [
        { id: "c1", equipe1Id: "e1", equipe2Id: "e2", fase: FaseEtapa.GRUPOS },
        { id: "c2", equipe1Id: "e1", equipe2Id: "e3", fase: FaseEtapa.GRUPOS },
        { id: "c3", equipe1Id: "e2", equipe2Id: "e3", fase: FaseEtapa.GRUPOS },
      ];

      mockEquipeRepository.buscarPorEtapaOrdenadas.mockResolvedValue(equipes);
      mockConfrontoRepository.criarEmLote.mockResolvedValue(confrontosGerados);
      mockPartidaRepository.criarEmLote.mockResolvedValue([]);

      const result = await service.gerarConfrontos(etapa as any, TipoFormacaoJogos.SORTEIO);

      expect(result).toHaveLength(3);
      expect(mockConfrontoRepository.criarEmLote).toHaveBeenCalled();
    });

    it("deve usar equipes ja criadas quando fornecidas", async () => {
      const etapa = criarEtapaTeams();
      const equipes = [
        { id: "e1", nome: "Equipe 1", jogadores: [] },
        { id: "e2", nome: "Equipe 2", jogadores: [] },
      ];

      const confrontosGerados = [
        { id: "c1", equipe1Id: "e1", equipe2Id: "e2", fase: FaseEtapa.GRUPOS },
      ];

      mockConfrontoRepository.criarEmLote.mockResolvedValue(confrontosGerados);
      mockPartidaRepository.criarEmLote.mockResolvedValue([]);

      await service.gerarConfrontos(etapa as any, TipoFormacaoJogos.SORTEIO, equipes as any);

      // Nao deve buscar no banco pois equipes foram fornecidas
      expect(mockEquipeRepository.buscarPorEtapaOrdenadas).not.toHaveBeenCalled();
    });
  });

  // ==================== BUSCAR ====================
  describe("buscarEquipes", () => {
    it("deve retornar equipes da etapa", async () => {
      const equipes = [
        { id: "e1", nome: "Equipe 1" },
        { id: "e2", nome: "Equipe 2" },
      ];

      mockEquipeRepository.buscarPorEtapaOrdenadas.mockResolvedValue(equipes);

      const result = await service.buscarEquipes(TEST_ETAPA_ID, TEST_ARENA_ID);

      expect(result).toEqual(equipes);
      expect(mockEquipeRepository.buscarPorEtapaOrdenadas).toHaveBeenCalledWith(
        TEST_ETAPA_ID,
        TEST_ARENA_ID
      );
    });
  });

  describe("buscarConfrontos", () => {
    it("deve retornar confrontos da etapa", async () => {
      const confrontos = [
        { id: "c1", equipe1Nome: "Equipe 1", equipe2Nome: "Equipe 2" },
      ];

      mockConfrontoRepository.buscarPorEtapaOrdenados.mockResolvedValue(confrontos);

      const result = await service.buscarConfrontos(TEST_ETAPA_ID, TEST_ARENA_ID);

      expect(result).toEqual(confrontos);
    });
  });

  describe("buscarPartidasConfronto", () => {
    it("deve retornar partidas do confronto", async () => {
      const partidas = [
        { id: "p1", tipoJogo: TipoJogoTeams.MASCULINO },
        { id: "p2", tipoJogo: TipoJogoTeams.FEMININO },
        { id: "p3", tipoJogo: TipoJogoTeams.MISTO },
      ];

      mockPartidaRepository.buscarPorConfrontoOrdenadas.mockResolvedValue(partidas);

      const result = await service.buscarPartidasConfronto("confronto-1");

      expect(result).toHaveLength(3);
    });
  });

  // ==================== RENOMEAR EQUIPE ====================
  describe("renomearEquipe", () => {
    it("deve lancar erro se equipe nao encontrada", async () => {
      mockEquipeRepository.buscarPorId.mockResolvedValue(null);

      await expect(
        service.renomearEquipe("equipe-1", "Novo Nome", TEST_ARENA_ID)
      ).rejects.toThrow(NotFoundError);
    });

    it("deve lancar erro se arena nao confere", async () => {
      mockEquipeRepository.buscarPorId.mockResolvedValue({
        id: "equipe-1",
        arenaId: "outra-arena",
        nome: "Equipe 1",
      });

      await expect(
        service.renomearEquipe("equipe-1", "Novo Nome", TEST_ARENA_ID)
      ).rejects.toThrow("Você não tem permissão para editar esta equipe");
    });

    it("deve lancar erro se nome vazio", async () => {
      mockEquipeRepository.buscarPorId.mockResolvedValue({
        id: "equipe-1",
        arenaId: TEST_ARENA_ID,
        nome: "Equipe 1",
      });

      await expect(
        service.renomearEquipe("equipe-1", "   ", TEST_ARENA_ID)
      ).rejects.toThrow("Nome da equipe não pode ser vazio");
    });

    it("deve lancar erro se nome muito longo", async () => {
      mockEquipeRepository.buscarPorId.mockResolvedValue({
        id: "equipe-1",
        arenaId: TEST_ARENA_ID,
        nome: "Equipe 1",
      });

      const nomeLongo = "a".repeat(101);

      await expect(
        service.renomearEquipe("equipe-1", nomeLongo, TEST_ARENA_ID)
      ).rejects.toThrow("Nome da equipe não pode ter mais de 100 caracteres");
    });

    it("deve renomear equipe com sucesso", async () => {
      mockEquipeRepository.buscarPorId.mockResolvedValue({
        id: "equipe-1",
        arenaId: TEST_ARENA_ID,
        nome: "Equipe 1",
      });
      mockEquipeRepository.atualizarEmLote.mockResolvedValue(undefined);

      await service.renomearEquipe("equipe-1", "Os Campeoes", TEST_ARENA_ID);

      expect(mockEquipeRepository.atualizarEmLote).toHaveBeenCalledWith([
        { id: "equipe-1", dados: { nome: "Os Campeoes" } },
      ]);
    });
  });

  // ==================== RESETAR PARTIDAS ====================
  describe("resetarPartidas", () => {
    it("deve resetar todas as partidas e estatisticas", async () => {
      const confrontos = [
        { id: "c1" },
        { id: "c2" },
      ];

      const equipes = [
        {
          id: "e1",
          jogadores: [
            { id: "j1", nome: "J1", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
          ],
        },
        {
          id: "e2",
          jogadores: [
            { id: "j2", nome: "J2", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
          ],
        },
      ];

      mockPartidaRepository.deletarPorEtapa.mockResolvedValue(undefined);
      mockConfrontoRepository.buscarPorEtapa.mockResolvedValue(confrontos);
      mockConfrontoRepository.resetarConfronto.mockResolvedValue(undefined);
      mockEquipeRepository.buscarPorEtapa.mockResolvedValue(equipes);
      mockEquipeRepository.atualizarEmLote.mockResolvedValue(undefined);
      mockEstatisticasService.criar.mockResolvedValue(undefined);

      await service.resetarPartidas(TEST_ETAPA_ID, TEST_ARENA_ID);

      expect(mockPartidaRepository.deletarPorEtapa).toHaveBeenCalledWith(
        TEST_ETAPA_ID,
        TEST_ARENA_ID
      );
      expect(mockConfrontoRepository.resetarConfronto).toHaveBeenCalledTimes(2);
      expect(mockEquipeRepository.atualizarEmLote).toHaveBeenCalledTimes(1);
    });
  });

  // ==================== REGISTRAR RESULTADO PARTIDA ====================
  describe("registrarResultadoPartida", () => {
    it("deve lancar erro se partida nao encontrada", async () => {
      mockPartidaRepository.buscarPorId.mockResolvedValue(null);

      await expect(
        service.registrarResultadoPartida("partida-1", TEST_ARENA_ID, {
          placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }],
        })
      ).rejects.toThrow(NotFoundError);
    });

    it("deve lancar erro se confronto nao encontrado", async () => {
      mockPartidaRepository.buscarPorId.mockResolvedValue({
        id: "partida-1",
        confrontoId: "confronto-1",
        etapaId: TEST_ETAPA_ID,
        status: "agendada",
      });
      mockConfrontoRepository.buscarPorId.mockResolvedValue(null);
      mockPartidaRepository.buscarPorConfrontoOrdenadas.mockResolvedValue([]);

      await expect(
        service.registrarResultadoPartida("partida-1", TEST_ARENA_ID, {
          placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }],
        })
      ).rejects.toThrow(NotFoundError);
    });
  });

  // ==================== REGISTRAR RESULTADOS EM LOTE ====================
  describe("registrarResultadosEmLote", () => {
    it("deve retornar vazio se nenhum resultado fornecido", async () => {
      const result = await service.registrarResultadosEmLote(
        TEST_ETAPA_ID,
        TEST_ARENA_ID,
        []
      );

      expect(result.processados).toBe(0);
      expect(result.erros).toHaveLength(0);
      expect(result.confrontosFinalizados).toHaveLength(0);
    });

    it("deve registrar erro quando partida nao encontrada", async () => {
      mockPartidaRepository.buscarPorId.mockResolvedValue(null);

      const result = await service.registrarResultadosEmLote(
        TEST_ETAPA_ID,
        TEST_ARENA_ID,
        [{ partidaId: "partida-inexistente", placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }] }]
      );

      expect(result.processados).toBe(0);
      expect(result.erros).toHaveLength(1);
      expect(result.erros[0].erro).toBe("Partida não encontrada");
    });
  });

  // ==================== CANCELAR CHAVES ====================
  describe("cancelarChaves", () => {
    it("deve cancelar chaves deletando todas as entidades", async () => {
      mockPartidaRepository.deletarPorEtapa.mockResolvedValue(undefined);
      mockConfrontoRepository.deletarPorEtapa.mockResolvedValue(undefined);
      mockEquipeRepository.deletarPorEtapa.mockResolvedValue(undefined);

      await service.cancelarChaves(TEST_ETAPA_ID, TEST_ARENA_ID);

      expect(mockPartidaRepository.deletarPorEtapa).toHaveBeenCalledWith(
        TEST_ETAPA_ID,
        TEST_ARENA_ID
      );
      expect(mockConfrontoRepository.deletarPorEtapa).toHaveBeenCalledWith(
        TEST_ETAPA_ID,
        TEST_ARENA_ID
      );
      expect(mockEquipeRepository.deletarPorEtapa).toHaveBeenCalledWith(
        TEST_ETAPA_ID,
        TEST_ARENA_ID
      );
    });
  });

  // ==================== GERAR PARTIDAS CONFRONTO ====================
  describe("gerarPartidasConfronto", () => {
    it("deve lancar erro se equipes nao foram definidas", async () => {
      const confronto = {
        id: "confronto-1",
        equipe1Id: null,
        equipe2Id: null,
      };
      const etapa = criarEtapaTeams();

      await expect(
        service.gerarPartidasConfronto(confronto as any, etapa as any)
      ).rejects.toThrow(ValidationError);
    });

    it("deve lancar erro se equipe1 nao encontrada", async () => {
      const confronto = {
        id: "confronto-1",
        equipe1Id: "equipe-1",
        equipe2Id: "equipe-2",
      };
      const etapa = criarEtapaTeams({
        tipoFormacaoJogos: TipoFormacaoJogos.SORTEIO,
      });

      mockEquipeRepository.buscarPorIds.mockResolvedValue([
        { id: "equipe-2", jogadores: [] },
      ]);

      await expect(
        service.gerarPartidasConfronto(confronto as any, etapa as any)
      ).rejects.toThrow(NotFoundError);
    });

    it("deve criar partidas com sorteio para TEAMS_4 nao misto", async () => {
      const confronto = {
        id: "confronto-1",
        etapaId: TEST_ETAPA_ID,
        arenaId: TEST_ARENA_ID,
        equipe1Id: "equipe-1",
        equipe2Id: "equipe-2",
        equipe1Nome: "Equipe 1",
        equipe2Nome: "Equipe 2",
      };
      const etapa = criarEtapaTeams({
        varianteTeams: VarianteTeams.TEAMS_4,
        tipoFormacaoJogos: TipoFormacaoJogos.SORTEIO,
        genero: GeneroJogador.MASCULINO,
        isMisto: false,
      });

      const jogadores = [
        { id: "j1", nome: "J1", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
        { id: "j2", nome: "J2", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
        { id: "j3", nome: "J3", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
        { id: "j4", nome: "J4", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
      ];

      mockEquipeRepository.buscarPorIds.mockResolvedValue([
        { id: "equipe-1", nome: "Equipe 1", jogadores },
        { id: "equipe-2", nome: "Equipe 2", jogadores },
      ]);

      const partidasCriadas = [
        { id: "partida-1", tipoJogo: TipoJogoTeams.MASCULINO },
        { id: "partida-2", tipoJogo: TipoJogoTeams.MASCULINO },
      ];

      mockPartidaRepository.criarEmLote.mockResolvedValue(partidasCriadas);
      mockConfrontoRepository.adicionarPartidasEmLote.mockResolvedValue(undefined);

      const result = await service.gerarPartidasConfronto(confronto as any, etapa as any);

      expect(result).toHaveLength(2);
      expect(mockPartidaRepository.criarEmLote).toHaveBeenCalled();
    });

    it("deve criar partidas com sorteio para TEAMS_4 misto", async () => {
      const confronto = {
        id: "confronto-1",
        etapaId: TEST_ETAPA_ID,
        arenaId: TEST_ARENA_ID,
        equipe1Id: "equipe-1",
        equipe2Id: "equipe-2",
        equipe1Nome: "Equipe 1",
        equipe2Nome: "Equipe 2",
      };
      const etapa = criarEtapaTeams({
        varianteTeams: VarianteTeams.TEAMS_4,
        tipoFormacaoJogos: TipoFormacaoJogos.SORTEIO,
        genero: GeneroJogador.MISTO,
        isMisto: true,
      });

      const jogadoresEquipe1 = [
        { id: "j1", nome: "J1", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
        { id: "j2", nome: "J2", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
        { id: "j3", nome: "J3", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.FEMININO },
        { id: "j4", nome: "J4", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.FEMININO },
      ];

      const jogadoresEquipe2 = [
        { id: "j5", nome: "J5", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
        { id: "j6", nome: "J6", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
        { id: "j7", nome: "J7", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.FEMININO },
        { id: "j8", nome: "J8", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.FEMININO },
      ];

      mockEquipeRepository.buscarPorIds.mockResolvedValue([
        { id: "equipe-1", nome: "Equipe 1", jogadores: jogadoresEquipe1 },
        { id: "equipe-2", nome: "Equipe 2", jogadores: jogadoresEquipe2 },
      ]);

      const partidasCriadas = [
        { id: "partida-1", tipoJogo: TipoJogoTeams.FEMININO },
        { id: "partida-2", tipoJogo: TipoJogoTeams.MASCULINO },
      ];

      mockPartidaRepository.criarEmLote.mockResolvedValue(partidasCriadas);
      mockConfrontoRepository.adicionarPartidasEmLote.mockResolvedValue(undefined);

      const result = await service.gerarPartidasConfronto(confronto as any, etapa as any);

      expect(result).toHaveLength(2);
    });

    it("deve criar partidas com sorteio para TEAMS_6 nao misto", async () => {
      const confronto = {
        id: "confronto-1",
        etapaId: TEST_ETAPA_ID,
        arenaId: TEST_ARENA_ID,
        equipe1Id: "equipe-1",
        equipe2Id: "equipe-2",
        equipe1Nome: "Equipe 1",
        equipe2Nome: "Equipe 2",
      };
      const etapa = criarEtapaTeams({
        varianteTeams: VarianteTeams.TEAMS_6,
        tipoFormacaoJogos: TipoFormacaoJogos.SORTEIO,
        genero: GeneroJogador.MASCULINO,
        isMisto: false,
      });

      const jogadores = [
        { id: "j1", nome: "J1", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
        { id: "j2", nome: "J2", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
        { id: "j3", nome: "J3", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
        { id: "j4", nome: "J4", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
        { id: "j5", nome: "J5", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
        { id: "j6", nome: "J6", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
      ];

      mockEquipeRepository.buscarPorIds.mockResolvedValue([
        { id: "equipe-1", nome: "Equipe 1", jogadores },
        { id: "equipe-2", nome: "Equipe 2", jogadores },
      ]);

      const partidasCriadas = [
        { id: "partida-1", tipoJogo: TipoJogoTeams.MASCULINO },
        { id: "partida-2", tipoJogo: TipoJogoTeams.MASCULINO },
        { id: "partida-3", tipoJogo: TipoJogoTeams.MASCULINO },
      ];

      mockPartidaRepository.criarEmLote.mockResolvedValue(partidasCriadas);
      mockConfrontoRepository.adicionarPartidasEmLote.mockResolvedValue(undefined);

      const result = await service.gerarPartidasConfronto(confronto as any, etapa as any);

      expect(result).toHaveLength(3);
    });

    it("deve criar partidas com sorteio para TEAMS_6 misto", async () => {
      const confronto = {
        id: "confronto-1",
        etapaId: TEST_ETAPA_ID,
        arenaId: TEST_ARENA_ID,
        equipe1Id: "equipe-1",
        equipe2Id: "equipe-2",
        equipe1Nome: "Equipe 1",
        equipe2Nome: "Equipe 2",
      };
      const etapa = criarEtapaTeams({
        varianteTeams: VarianteTeams.TEAMS_6,
        tipoFormacaoJogos: TipoFormacaoJogos.SORTEIO,
        genero: GeneroJogador.MISTO,
        isMisto: true,
      });

      const jogadoresEquipe1 = [
        { id: "j1", nome: "J1", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
        { id: "j2", nome: "J2", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
        { id: "j3", nome: "J3", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
        { id: "j4", nome: "J4", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.FEMININO },
        { id: "j5", nome: "J5", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.FEMININO },
        { id: "j6", nome: "J6", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.FEMININO },
      ];

      mockEquipeRepository.buscarPorIds.mockResolvedValue([
        { id: "equipe-1", nome: "Equipe 1", jogadores: jogadoresEquipe1 },
        { id: "equipe-2", nome: "Equipe 2", jogadores: jogadoresEquipe1 },
      ]);

      const partidasCriadas = [
        { id: "partida-1", tipoJogo: TipoJogoTeams.FEMININO },
        { id: "partida-2", tipoJogo: TipoJogoTeams.MASCULINO },
        { id: "partida-3", tipoJogo: TipoJogoTeams.MISTO },
      ];

      mockPartidaRepository.criarEmLote.mockResolvedValue(partidasCriadas);
      mockConfrontoRepository.adicionarPartidasEmLote.mockResolvedValue(undefined);

      const result = await service.gerarPartidasConfronto(confronto as any, etapa as any);

      expect(result).toHaveLength(3);
    });
  });

  // ==================== GERAR DECIDER ====================
  describe("gerarDecider", () => {
    it("deve lancar erro se variante nao suporta decider", async () => {
      const confronto = {
        id: "confronto-1",
        temDecider: false,
        equipe1Id: "equipe-1",
        equipe2Id: "equipe-2",
      };
      const etapa = criarEtapaTeams({ varianteTeams: VarianteTeams.TEAMS_6 });

      await expect(
        service.gerarDecider(confronto as any, etapa as any)
      ).rejects.toThrow("Decider só é permitido para TEAMS_4");
    });
  });

  // ==================== DEFINIR PARTIDAS MANUALMENTE ====================
  describe("definirPartidasManualmente", () => {
    it("deve lancar erro se equipe1 nao encontrada", async () => {
      const confronto = {
        id: "confronto-1",
        equipe1Id: "equipe-1",
        equipe2Id: "equipe-2",
      };
      const etapa = criarEtapaTeams();
      const definicao = { partidas: [] };

      mockEquipeRepository.buscarPorId
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: "equipe-2" });

      await expect(
        service.definirPartidasManualmente(confronto as any, etapa as any, definicao as any)
      ).rejects.toThrow(NotFoundError);
    });
  });

  // ==================== DEFINIR JOGADORES PARTIDA ====================
  describe("definirJogadoresPartida", () => {
    it("deve lancar erro se partida nao encontrada", async () => {
      mockPartidaRepository.buscarPorId.mockResolvedValue(null);

      await expect(
        service.definirJogadoresPartida(
          "partida-1",
          TEST_ARENA_ID,
          ["j1", "j2"],
          ["j3", "j4"]
        )
      ).rejects.toThrow(NotFoundError);
    });

    it("deve lancar erro se arena nao confere", async () => {
      mockPartidaRepository.buscarPorId.mockResolvedValue({
        id: "partida-1",
        arenaId: "outra-arena",
        dupla1: [],
        dupla2: [],
        confrontoId: "confronto-1",
        tipoJogo: TipoJogoTeams.MASCULINO,
      });

      await expect(
        service.definirJogadoresPartida(
          "partida-1",
          TEST_ARENA_ID,
          ["j1", "j2"],
          ["j3", "j4"]
        )
      ).rejects.toThrow("Partida não pertence a esta arena");
    });

    it("deve lancar erro se partida ja tem jogadores definidos", async () => {
      mockPartidaRepository.buscarPorId.mockResolvedValue({
        id: "partida-1",
        arenaId: TEST_ARENA_ID,
        dupla1: [{ id: "j1", nome: "J1" }],
        dupla2: [],
        confrontoId: "confronto-1",
        tipoJogo: TipoJogoTeams.MASCULINO,
      });

      await expect(
        service.definirJogadoresPartida(
          "partida-1",
          TEST_ARENA_ID,
          ["j1", "j2"],
          ["j3", "j4"]
        )
      ).rejects.toThrow("Esta partida já tem jogadores definidos");
    });

    it("deve definir jogadores com sucesso", async () => {
      const jogadores1 = [
        { id: "j1", nome: "J1", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
        { id: "j2", nome: "J2", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
      ];
      const jogadores2 = [
        { id: "j3", nome: "J3", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
        { id: "j4", nome: "J4", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
      ];

      const partida = {
        id: "partida-1",
        arenaId: TEST_ARENA_ID,
        dupla1: [],
        dupla2: [],
        confrontoId: "confronto-1",
        tipoJogo: TipoJogoTeams.MASCULINO,
        equipe1Id: "equipe-1",
        equipe2Id: "equipe-2",
      };

      const confronto = {
        id: "confronto-1",
        equipe1Id: "equipe-1",
        equipe2Id: "equipe-2",
        partidas: ["partida-1"],
      };

      const equipe1 = {
        id: "equipe-1",
        nome: "Equipe 1",
        jogadores: jogadores1,
      };
      const equipe2 = {
        id: "equipe-2",
        nome: "Equipe 2",
        jogadores: jogadores2,
      };

      mockPartidaRepository.buscarPorId
        .mockResolvedValueOnce(partida)
        .mockResolvedValueOnce({ ...partida, dupla1: jogadores1, dupla2: jogadores2 });

      mockEquipeRepository.buscarPorId
        .mockResolvedValueOnce(equipe1)
        .mockResolvedValueOnce(equipe2);

      mockConfrontoRepository.buscarPorId.mockResolvedValue(confronto);
      mockPartidaRepository.atualizar.mockResolvedValue(undefined);

      await service.definirJogadoresPartida(
        "partida-1",
        TEST_ARENA_ID,
        ["j1", "j2"] as [string, string],
        ["j3", "j4"] as [string, string]
      );

      expect(mockPartidaRepository.atualizar).toHaveBeenCalled();
    });
  });

  // ==================== GERAR DECIDER COMPLETO ====================
  describe("gerarDecider - completo", () => {
    it("deve gerar decider com sucesso para TEAMS_4", async () => {
      const confronto = {
        id: "confronto-1",
        etapaId: TEST_ETAPA_ID,
        arenaId: TEST_ARENA_ID,
        temDecider: false,
        equipe1Id: "equipe-1",
        equipe2Id: "equipe-2",
        equipe1Nome: "Equipe 1",
        equipe2Nome: "Equipe 2",
      };
      const etapa = criarEtapaTeams({
        varianteTeams: VarianteTeams.TEAMS_4,
        tipoFormacaoJogos: TipoFormacaoJogos.SORTEIO,
        genero: GeneroJogador.MASCULINO,
        isMisto: false,
      });

      const jogadores = [
        { id: "j1", nome: "J1", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
        { id: "j2", nome: "J2", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
        { id: "j3", nome: "J3", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
        { id: "j4", nome: "J4", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
      ];

      mockPartidaRepository.existeDecider.mockResolvedValue(false);
      mockEquipeRepository.buscarPorId
        .mockResolvedValueOnce({ id: "equipe-1", nome: "Equipe 1", jogadores })
        .mockResolvedValueOnce({ id: "equipe-2", nome: "Equipe 2", jogadores });

      const partidaDecider = {
        id: "partida-decider",
        tipoJogo: TipoJogoTeams.DECIDER,
        isDecider: true,
      };

      mockPartidaRepository.criarEmLote.mockResolvedValue([partidaDecider]);
      mockConfrontoRepository.adicionarPartida.mockResolvedValue(undefined);
      mockConfrontoRepository.marcarTemDecider.mockResolvedValue(undefined);

      const result = await service.gerarDecider(confronto as any, etapa as any);

      expect(result.tipoJogo).toBe(TipoJogoTeams.DECIDER);
      expect(mockPartidaRepository.criarEmLote).toHaveBeenCalled();
      expect(mockConfrontoRepository.marcarTemDecider).toHaveBeenCalledWith("confronto-1", true);
    });

    it("deve lancar erro se decider ja existe", async () => {
      const confronto = {
        id: "confronto-1",
        temDecider: false,
        equipe1Id: "equipe-1",
        equipe2Id: "equipe-2",
      };
      const etapa = criarEtapaTeams({ varianteTeams: VarianteTeams.TEAMS_4 });

      mockPartidaRepository.existeDecider.mockResolvedValue(true);

      await expect(
        service.gerarDecider(confronto as any, etapa as any)
      ).rejects.toThrow("Decider já existe para este confronto");
    });

    it("deve gerar decider para etapa mista", async () => {
      const confronto = {
        id: "confronto-1",
        etapaId: TEST_ETAPA_ID,
        arenaId: TEST_ARENA_ID,
        temDecider: false,
        equipe1Id: "equipe-1",
        equipe2Id: "equipe-2",
        equipe1Nome: "Equipe 1",
        equipe2Nome: "Equipe 2",
      };
      const etapa = criarEtapaTeams({
        varianteTeams: VarianteTeams.TEAMS_4,
        tipoFormacaoJogos: TipoFormacaoJogos.SORTEIO,
        genero: GeneroJogador.MISTO,
        isMisto: true,
      });

      const jogadoresEquipe1 = [
        { id: "j1", nome: "J1", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
        { id: "j2", nome: "J2", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
        { id: "j3", nome: "J3", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.FEMININO },
        { id: "j4", nome: "J4", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.FEMININO },
      ];

      mockPartidaRepository.existeDecider.mockResolvedValue(false);
      mockEquipeRepository.buscarPorId
        .mockResolvedValueOnce({ id: "equipe-1", nome: "Equipe 1", jogadores: jogadoresEquipe1 })
        .mockResolvedValueOnce({ id: "equipe-2", nome: "Equipe 2", jogadores: jogadoresEquipe1 });

      const partidaDecider = { id: "partida-decider", tipoJogo: TipoJogoTeams.DECIDER };

      mockPartidaRepository.criarEmLote.mockResolvedValue([partidaDecider]);
      mockConfrontoRepository.adicionarPartida.mockResolvedValue(undefined);
      mockConfrontoRepository.marcarTemDecider.mockResolvedValue(undefined);

      const result = await service.gerarDecider(confronto as any, etapa as any);

      expect(result.tipoJogo).toBe(TipoJogoTeams.DECIDER);
    });

    it("deve criar decider vazio para formacao manual", async () => {
      const confronto = {
        id: "confronto-1",
        etapaId: TEST_ETAPA_ID,
        arenaId: TEST_ARENA_ID,
        temDecider: false,
        equipe1Id: "equipe-1",
        equipe2Id: "equipe-2",
        equipe1Nome: "Equipe 1",
        equipe2Nome: "Equipe 2",
      };
      const etapa = criarEtapaTeams({
        varianteTeams: VarianteTeams.TEAMS_4,
        tipoFormacaoJogos: TipoFormacaoJogos.MANUAL,
      });

      const jogadores = [
        { id: "j1", nome: "J1", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
        { id: "j2", nome: "J2", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
      ];

      mockPartidaRepository.existeDecider.mockResolvedValue(false);
      mockEquipeRepository.buscarPorId
        .mockResolvedValueOnce({ id: "equipe-1", nome: "Equipe 1", jogadores })
        .mockResolvedValueOnce({ id: "equipe-2", nome: "Equipe 2", jogadores });

      const partidaDecider = { id: "partida-decider", tipoJogo: TipoJogoTeams.DECIDER };

      mockPartidaRepository.criarEmLote.mockResolvedValue([partidaDecider]);
      mockConfrontoRepository.adicionarPartida.mockResolvedValue(undefined);
      mockConfrontoRepository.marcarTemDecider.mockResolvedValue(undefined);

      const result = await service.gerarDecider(confronto as any, etapa as any);

      expect(result.tipoJogo).toBe(TipoJogoTeams.DECIDER);
    });
  });

  // ==================== RECALCULAR CLASSIFICACAO ====================
  describe("recalcularClassificacao", () => {
    it("deve recalcular classificacao das equipes", async () => {
      const equipes = [
        { id: "e1", nome: "Equipe 1", pontos: 3, saldoJogos: 1, saldoGames: 5, gamesVencidos: 10 },
        { id: "e2", nome: "Equipe 2", pontos: 6, saldoJogos: 2, saldoGames: 8, gamesVencidos: 15 },
        { id: "e3", nome: "Equipe 3", pontos: 3, saldoJogos: 1, saldoGames: 3, gamesVencidos: 8 },
      ];

      mockEquipeRepository.buscarPorEtapa.mockResolvedValue(equipes);
      mockEquipeRepository.atualizarPosicoesEmLote.mockResolvedValue(undefined);

      const result = await service.recalcularClassificacao(TEST_ETAPA_ID, TEST_ARENA_ID);

      expect(result).toHaveLength(3);
      // Equipe 2 deve ser primeira (6 pontos)
      expect(result[0].id).toBe("e2");
      expect(result[0].posicao).toBe(1);
      // Entre e1 e e3 (ambas 3 pontos), e1 tem mais saldo de games (5 > 3)
      expect(result[1].id).toBe("e1");
      expect(result[1].posicao).toBe(2);
      expect(result[2].id).toBe("e3");
      expect(result[2].posicao).toBe(3);
    });

    it("deve ordenar por saldo de jogos quando pontos iguais", async () => {
      const equipes = [
        { id: "e1", nome: "Equipe 1", pontos: 3, saldoJogos: -1, saldoGames: 5, gamesVencidos: 10 },
        { id: "e2", nome: "Equipe 2", pontos: 3, saldoJogos: 1, saldoGames: 5, gamesVencidos: 10 },
      ];

      mockEquipeRepository.buscarPorEtapa.mockResolvedValue(equipes);
      mockEquipeRepository.atualizarPosicoesEmLote.mockResolvedValue(undefined);

      const result = await service.recalcularClassificacao(TEST_ETAPA_ID, TEST_ARENA_ID);

      expect(result[0].id).toBe("e2"); // Maior saldo de jogos
      expect(result[1].id).toBe("e1");
    });
  });

  // ==================== REGISTRAR RESULTADO PARTIDA - COMPLETO ====================
  describe("registrarResultadoPartida - completo", () => {
    it("deve registrar resultado e atualizar contadores do confronto", async () => {
      const partida = {
        id: "partida-1",
        confrontoId: "confronto-1",
        etapaId: TEST_ETAPA_ID,
        arenaId: TEST_ARENA_ID,
        status: "agendada",
        tipoJogo: TipoJogoTeams.MASCULINO,
        equipe1Id: "equipe-1",
        equipe2Id: "equipe-2",
        equipe1Nome: "Equipe 1",
        equipe2Nome: "Equipe 2",
        dupla1: [
          { id: "j1", nome: "J1", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
          { id: "j2", nome: "J2", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
        ],
        dupla2: [
          { id: "j3", nome: "J3", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
          { id: "j4", nome: "J4", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
        ],
      };

      const confronto = {
        id: "confronto-1",
        etapaId: TEST_ETAPA_ID,
        arenaId: TEST_ARENA_ID,
        equipe1Id: "equipe-1",
        equipe2Id: "equipe-2",
        equipe1Nome: "Equipe 1",
        equipe2Nome: "Equipe 2",
        jogosEquipe1: 0,
        jogosEquipe2: 0,
        partidasFinalizadas: 0,
        totalPartidas: 2,
        temDecider: false,
      };

      mockPartidaRepository.buscarPorId.mockResolvedValue(partida);
      mockConfrontoRepository.buscarPorId.mockResolvedValue(confronto);
      mockPartidaRepository.buscarPorConfrontoOrdenadas.mockResolvedValue([partida]);
      mockPartidaRepository.registrarResultado.mockResolvedValue(undefined);
      mockConfrontoRepository.atualizar.mockResolvedValue(undefined);
      mockEstatisticasService.buscarPorJogadoresEtapa.mockResolvedValue(new Map([
        ["j1", { id: "est-1" }],
        ["j2", { id: "est-2" }],
        ["j3", { id: "est-3" }],
        ["j4", { id: "est-4" }],
      ]));
      (mockEstatisticasService as any).atualizarAposPartidaComIncrement = jest.fn().mockResolvedValue(undefined);
      mockEquipeRepository.incrementarEstatisticasEmLote.mockResolvedValue(undefined);

      const placar = [
        { numero: 1, gamesDupla1: 6, gamesDupla2: 4 },
        { numero: 2, gamesDupla1: 6, gamesDupla2: 3 },
      ];

      await service.registrarResultadoPartida("partida-1", TEST_ARENA_ID, { placar });

      expect(mockPartidaRepository.registrarResultado).toHaveBeenCalled();
      expect(mockConfrontoRepository.atualizar).toHaveBeenCalled();
    });
  });

  // ==================== REGISTRAR RESULTADOS EM LOTE - COMPLETO ====================
  describe("registrarResultadosEmLote - completo", () => {
    it("deve processar multiplos resultados do mesmo confronto", async () => {
      const partida1 = {
        id: "partida-1",
        confrontoId: "confronto-1",
        etapaId: TEST_ETAPA_ID,
        arenaId: TEST_ARENA_ID,
        status: "agendada",
        tipoJogo: TipoJogoTeams.MASCULINO,
        equipe1Id: "equipe-1",
        equipe2Id: "equipe-2",
        dupla1: [
          { id: "j1", nome: "J1", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
          { id: "j2", nome: "J2", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
        ],
        dupla2: [
          { id: "j3", nome: "J3", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
          { id: "j4", nome: "J4", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
        ],
      };

      const partida2 = {
        ...partida1,
        id: "partida-2",
      };

      const confronto = {
        id: "confronto-1",
        etapaId: TEST_ETAPA_ID,
        arenaId: TEST_ARENA_ID,
        equipe1Id: "equipe-1",
        equipe2Id: "equipe-2",
        equipe1Nome: "Equipe 1",
        equipe2Nome: "Equipe 2",
        jogosEquipe1: 0,
        jogosEquipe2: 0,
        partidasFinalizadas: 0,
        totalPartidas: 2,
      };

      mockPartidaRepository.buscarPorId
        .mockResolvedValueOnce(partida1)
        .mockResolvedValueOnce(partida2);
      mockConfrontoRepository.buscarPorId.mockResolvedValue(confronto);
      mockPartidaRepository.registrarResultado.mockResolvedValue(undefined);
      mockPartidaRepository.buscarPorConfrontoOrdenadas.mockResolvedValue([
        { ...partida1, status: "finalizada", vencedoraEquipeId: "equipe-1" },
        { ...partida2, status: "finalizada", vencedoraEquipeId: "equipe-1" },
      ]);
      mockConfrontoRepository.atualizar.mockResolvedValue(undefined);
      mockEstatisticasService.buscarPorJogadoresEtapa.mockResolvedValue(new Map([
        ["j1", { id: "est-1" }],
        ["j2", { id: "est-2" }],
        ["j3", { id: "est-3" }],
        ["j4", { id: "est-4" }],
      ]));
      (mockEstatisticasService as any).atualizarAposPartidaComIncrement = jest.fn().mockResolvedValue(undefined);
      mockEquipeRepository.incrementarEstatisticasEmLote.mockResolvedValue(undefined);
      mockEquipeRepository.buscarPorEtapa.mockResolvedValue([]);
      mockEquipeRepository.atualizarPosicoesEmLote.mockResolvedValue(undefined);

      const resultados = [
        { partidaId: "partida-1", placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }] },
        { partidaId: "partida-2", placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 3 }] },
      ];

      const result = await service.registrarResultadosEmLote(TEST_ETAPA_ID, TEST_ARENA_ID, resultados);

      expect(result.processados).toBe(2);
      expect(result.erros).toHaveLength(0);
    });

    it("deve registrar erro quando confronto nao encontrado", async () => {
      const partida = {
        id: "partida-1",
        confrontoId: "confronto-inexistente",
        etapaId: TEST_ETAPA_ID,
      };

      mockPartidaRepository.buscarPorId.mockResolvedValue(partida);
      mockConfrontoRepository.buscarPorId.mockResolvedValue(null);

      const result = await service.registrarResultadosEmLote(
        TEST_ETAPA_ID,
        TEST_ARENA_ID,
        [{ partidaId: "partida-1", placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }] }]
      );

      expect(result.processados).toBe(0);
      expect(result.erros).toHaveLength(1);
      expect(result.erros[0].erro).toBe("Confronto não encontrado");
    });
  });

  // ==================== GERAR CONFRONTOS COM FASE GRUPOS ====================
  describe("gerarConfrontos - fase grupos", () => {
    it("deve gerar confrontos com fase de grupos para 6+ equipes", async () => {
      const etapa = criarEtapaTeams();
      const equipes = Array.from({ length: 6 }, (_, i) => ({
        id: `e${i}`,
        nome: `Equipe ${i + 1}`,
        jogadores: [],
        grupoId: i < 3 ? "A" : "B",
      }));

      const confrontosGrupos = [
        { id: "c1", equipe1Id: "e0", equipe2Id: "e1", fase: FaseEtapa.GRUPOS },
        { id: "c2", equipe1Id: "e0", equipe2Id: "e2", fase: FaseEtapa.GRUPOS },
        { id: "c3", equipe1Id: "e1", equipe2Id: "e2", fase: FaseEtapa.GRUPOS },
        { id: "c4", equipe1Id: "e3", equipe2Id: "e4", fase: FaseEtapa.GRUPOS },
        { id: "c5", equipe1Id: "e3", equipe2Id: "e5", fase: FaseEtapa.GRUPOS },
        { id: "c6", equipe1Id: "e4", equipe2Id: "e5", fase: FaseEtapa.GRUPOS },
      ];

      const confrontoFinal = { id: "final", fase: FaseEtapa.FINAL };
      const semifinais = [
        { id: "semi1", fase: FaseEtapa.SEMIFINAL, proximoConfrontoId: "final" },
        { id: "semi2", fase: FaseEtapa.SEMIFINAL, proximoConfrontoId: "final" },
      ];

      mockEquipeRepository.buscarPorEtapaOrdenadas.mockResolvedValue(equipes);
      mockConfrontoRepository.criarEmLote
        .mockResolvedValueOnce(confrontosGrupos)
        .mockResolvedValueOnce([confrontoFinal])  // Final
        .mockResolvedValueOnce(semifinais);
      mockPartidaRepository.criarEmLote.mockResolvedValue([]);

      const result = await service.gerarConfrontos(etapa as any, TipoFormacaoJogos.SORTEIO);

      // Deve ter confrontos de grupos + semifinais + final
      expect(result.length).toBeGreaterThan(6);
    });
  });

  // ==================== FORMAR EQUIPES MANUALMENTE COM GRUPOS ====================
  describe("formarEquipesManualmente - com grupos", () => {
    it("deve atribuir grupos quando 6+ equipes", async () => {
      const etapa = criarEtapaTeams({ varianteTeams: VarianteTeams.TEAMS_4 });
      const inscricoes = criarInscricoes(24); // 6 equipes de 4

      const formacoes = Array.from({ length: 6 }, (_, i) => ({
        nome: `Equipe ${i + 1}`,
        jogadorIds: inscricoes.slice(i * 4, (i + 1) * 4).map((j) => j.jogadorId),
      }));

      const equipesGeradas = formacoes.map((f, i) => ({
        id: `equipe-${i}`,
        nome: f.nome,
        jogadores: inscricoes.slice(i * 4, (i + 1) * 4),
        grupoId: i < 3 ? "A" : "B",
        grupoNome: i < 3 ? "Grupo A" : "Grupo B",
      }));

      mockEquipeRepository.criarEmLote.mockResolvedValue(equipesGeradas);
      mockEstatisticasService.criarEmLote.mockResolvedValue([]);

      const result = await service.formarEquipesManualmente(etapa as any, inscricoes, formacoes);

      expect(result.equipes).toHaveLength(6);
      expect(result.temFaseGrupos).toBe(true);
    });
  });

  // ==================== GERAR PARTIDAS CONFRONTO - MANUAL ====================
  describe("gerarPartidasConfronto - formacao manual", () => {
    it("deve criar partidas vazias para formacao manual", async () => {
      const confronto = {
        id: "confronto-1",
        etapaId: TEST_ETAPA_ID,
        arenaId: TEST_ARENA_ID,
        equipe1Id: "equipe-1",
        equipe2Id: "equipe-2",
        equipe1Nome: "Equipe 1",
        equipe2Nome: "Equipe 2",
      };
      const etapa = criarEtapaTeams({
        varianteTeams: VarianteTeams.TEAMS_4,
        tipoFormacaoJogos: TipoFormacaoJogos.MANUAL,
        genero: GeneroJogador.MASCULINO,
        isMisto: false,
      });

      const jogadores = [
        { id: "j1", nome: "J1", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
        { id: "j2", nome: "J2", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
        { id: "j3", nome: "J3", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
        { id: "j4", nome: "J4", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
      ];

      mockEquipeRepository.buscarPorIds.mockResolvedValue([
        { id: "equipe-1", nome: "Equipe 1", jogadores },
        { id: "equipe-2", nome: "Equipe 2", jogadores },
      ]);

      const partidasVazias = [
        { id: "p1", tipoJogo: TipoJogoTeams.MASCULINO, dupla1: [], dupla2: [] },
        { id: "p2", tipoJogo: TipoJogoTeams.MASCULINO, dupla1: [], dupla2: [] },
      ];

      mockPartidaRepository.criarEmLote.mockResolvedValue(partidasVazias);
      mockConfrontoRepository.adicionarPartida.mockResolvedValue(undefined);

      const result = await service.gerarPartidasConfronto(confronto as any, etapa as any);

      expect(result).toHaveLength(2);
      // Partidas devem estar vazias (sem jogadores)
      expect(result[0].dupla1).toHaveLength(0);
    });
  });

  // ==================== DEFINIR PARTIDAS MANUALMENTE - COMPLETO ====================
  describe("definirPartidasManualmente - completo", () => {
    it("deve definir partidas manualmente com sucesso", async () => {
      const jogadores1 = [
        { id: "j1", nome: "J1", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
        { id: "j2", nome: "J2", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
      ];
      const jogadores2 = [
        { id: "j3", nome: "J3", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
        { id: "j4", nome: "J4", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
      ];

      const confronto = {
        id: "confronto-1",
        etapaId: TEST_ETAPA_ID,
        arenaId: TEST_ARENA_ID,
        equipe1Id: "equipe-1",
        equipe2Id: "equipe-2",
        equipe1Nome: "Equipe 1",
        equipe2Nome: "Equipe 2",
      };

      const etapa = criarEtapaTeams();

      const definicao = {
        partidas: [
          {
            ordem: 1,
            tipoJogo: TipoJogoTeams.MASCULINO,
            dupla1JogadorIds: ["j1", "j2"],
            dupla2JogadorIds: ["j3", "j4"],
          },
        ],
      };

      mockEquipeRepository.buscarPorId
        .mockResolvedValueOnce({ id: "equipe-1", nome: "Equipe 1", jogadores: jogadores1 })
        .mockResolvedValueOnce({ id: "equipe-2", nome: "Equipe 2", jogadores: jogadores2 });

      const partidasCriadas = [{ id: "partida-1", tipoJogo: TipoJogoTeams.MASCULINO }];

      mockPartidaRepository.criarEmLote.mockResolvedValue(partidasCriadas);
      mockConfrontoRepository.adicionarPartidasEmLote.mockResolvedValue(undefined);

      const result = await service.definirPartidasManualmente(
        confronto as any,
        etapa as any,
        definicao as any
      );

      expect(result).toHaveLength(1);
      expect(mockPartidaRepository.criarEmLote).toHaveBeenCalled();
    });

    it("deve lancar erro se jogador nao pertence a equipe", async () => {
      const jogadores1 = [
        { id: "j1", nome: "J1", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
      ];
      const jogadores2 = [
        { id: "j3", nome: "J3", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
      ];

      const confronto = {
        id: "confronto-1",
        equipe1Id: "equipe-1",
        equipe2Id: "equipe-2",
      };

      const etapa = criarEtapaTeams();

      const definicao = {
        partidas: [
          {
            ordem: 1,
            tipoJogo: TipoJogoTeams.MASCULINO,
            dupla1JogadorIds: ["j1", "j-inexistente"], // j-inexistente nao existe
            dupla2JogadorIds: ["j3", "j4"],
          },
        ],
      };

      mockEquipeRepository.buscarPorId
        .mockResolvedValueOnce({ id: "equipe-1", nome: "Equipe 1", jogadores: jogadores1 })
        .mockResolvedValueOnce({ id: "equipe-2", nome: "Equipe 2", jogadores: jogadores2 });

      await expect(
        service.definirPartidasManualmente(confronto as any, etapa as any, definicao as any)
      ).rejects.toThrow("não pertence à equipe");
    });
  });

  // ==================== GERAR PARTIDAS VAZIAS - COBERTURA ADICIONAL ====================
  describe("gerarPartidasConfronto - partidas vazias", () => {
    it("deve criar partidas vazias TEAMS_4 misto", async () => {
      const confronto = {
        id: "confronto-1",
        etapaId: TEST_ETAPA_ID,
        arenaId: TEST_ARENA_ID,
        equipe1Id: "equipe-1",
        equipe2Id: "equipe-2",
        equipe1Nome: "Equipe 1",
        equipe2Nome: "Equipe 2",
      };
      const etapa = criarEtapaTeams({
        varianteTeams: VarianteTeams.TEAMS_4,
        tipoFormacaoJogos: TipoFormacaoJogos.MANUAL,
        genero: GeneroJogador.MISTO,
        isMisto: true,
      });

      const jogadoresEquipe = [
        { id: "j1", nome: "J1", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
        { id: "j2", nome: "J2", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
        { id: "j3", nome: "J3", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.FEMININO },
        { id: "j4", nome: "J4", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.FEMININO },
      ];

      mockEquipeRepository.buscarPorIds.mockResolvedValue([
        { id: "equipe-1", nome: "Equipe 1", jogadores: jogadoresEquipe },
        { id: "equipe-2", nome: "Equipe 2", jogadores: jogadoresEquipe },
      ]);

      const partidasVazias = [
        { id: "p1", tipoJogo: TipoJogoTeams.FEMININO, dupla1: [], dupla2: [] },
        { id: "p2", tipoJogo: TipoJogoTeams.MASCULINO, dupla1: [], dupla2: [] },
      ];

      mockPartidaRepository.criarEmLote.mockResolvedValue(partidasVazias);
      mockConfrontoRepository.adicionarPartida.mockResolvedValue(undefined);

      const result = await service.gerarPartidasConfronto(confronto as any, etapa as any);

      expect(result).toHaveLength(2);
    });

    it("deve criar partidas vazias TEAMS_6 nao misto", async () => {
      const confronto = {
        id: "confronto-1",
        etapaId: TEST_ETAPA_ID,
        arenaId: TEST_ARENA_ID,
        equipe1Id: "equipe-1",
        equipe2Id: "equipe-2",
        equipe1Nome: "Equipe 1",
        equipe2Nome: "Equipe 2",
      };
      const etapa = criarEtapaTeams({
        varianteTeams: VarianteTeams.TEAMS_6,
        tipoFormacaoJogos: TipoFormacaoJogos.MANUAL,
        genero: GeneroJogador.MASCULINO,
        isMisto: false,
      });

      const jogadores = Array.from({ length: 6 }, (_, i) => ({
        id: `j${i}`,
        nome: `J${i}`,
        nivel: NivelJogador.INTERMEDIARIO,
        genero: GeneroJogador.MASCULINO,
      }));

      mockEquipeRepository.buscarPorIds.mockResolvedValue([
        { id: "equipe-1", nome: "Equipe 1", jogadores },
        { id: "equipe-2", nome: "Equipe 2", jogadores },
      ]);

      const partidasVazias = [
        { id: "p1", tipoJogo: TipoJogoTeams.MASCULINO, dupla1: [], dupla2: [] },
        { id: "p2", tipoJogo: TipoJogoTeams.MASCULINO, dupla1: [], dupla2: [] },
        { id: "p3", tipoJogo: TipoJogoTeams.MASCULINO, dupla1: [], dupla2: [] },
      ];

      mockPartidaRepository.criarEmLote.mockResolvedValue(partidasVazias);
      mockConfrontoRepository.adicionarPartida.mockResolvedValue(undefined);

      const result = await service.gerarPartidasConfronto(confronto as any, etapa as any);

      expect(result).toHaveLength(3);
    });

    it("deve criar partidas vazias TEAMS_6 misto", async () => {
      const confronto = {
        id: "confronto-1",
        etapaId: TEST_ETAPA_ID,
        arenaId: TEST_ARENA_ID,
        equipe1Id: "equipe-1",
        equipe2Id: "equipe-2",
        equipe1Nome: "Equipe 1",
        equipe2Nome: "Equipe 2",
      };
      const etapa = criarEtapaTeams({
        varianteTeams: VarianteTeams.TEAMS_6,
        tipoFormacaoJogos: TipoFormacaoJogos.MANUAL,
        genero: GeneroJogador.MISTO,
        isMisto: true,
      });

      const jogadoresEquipe = [
        { id: "j1", nome: "J1", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
        { id: "j2", nome: "J2", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
        { id: "j3", nome: "J3", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
        { id: "j4", nome: "J4", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.FEMININO },
        { id: "j5", nome: "J5", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.FEMININO },
        { id: "j6", nome: "J6", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.FEMININO },
      ];

      mockEquipeRepository.buscarPorIds.mockResolvedValue([
        { id: "equipe-1", nome: "Equipe 1", jogadores: jogadoresEquipe },
        { id: "equipe-2", nome: "Equipe 2", jogadores: jogadoresEquipe },
      ]);

      const partidasVazias = [
        { id: "p1", tipoJogo: TipoJogoTeams.FEMININO, dupla1: [], dupla2: [] },
        { id: "p2", tipoJogo: TipoJogoTeams.MASCULINO, dupla1: [], dupla2: [] },
        { id: "p3", tipoJogo: TipoJogoTeams.MISTO, dupla1: [], dupla2: [] },
      ];

      mockPartidaRepository.criarEmLote.mockResolvedValue(partidasVazias);
      mockConfrontoRepository.adicionarPartida.mockResolvedValue(undefined);

      const result = await service.gerarPartidasConfronto(confronto as any, etapa as any);

      expect(result).toHaveLength(3);
    });
  });

  // ==================== DEFINIR JOGADORES - CENARIOS ADICIONAIS ====================
  describe("definirJogadoresPartida - cenarios adicionais", () => {
    it("deve buscar IDs do confronto se partida nao tem equipe IDs", async () => {
      const jogadores1 = [
        { id: "j1", nome: "J1", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
        { id: "j2", nome: "J2", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
      ];
      const jogadores2 = [
        { id: "j3", nome: "J3", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
        { id: "j4", nome: "J4", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
      ];

      // Partida sem equipe1Id/equipe2Id (partida antiga)
      const partida = {
        id: "partida-1",
        arenaId: TEST_ARENA_ID,
        dupla1: [],
        dupla2: [],
        confrontoId: "confronto-1",
        tipoJogo: TipoJogoTeams.MASCULINO,
        equipe1Id: null,
        equipe2Id: null,
      };

      const confronto = {
        id: "confronto-1",
        equipe1Id: "equipe-1",
        equipe2Id: "equipe-2",
        equipe1Nome: "Equipe 1",
        equipe2Nome: "Equipe 2",
        partidas: ["partida-1"],
      };

      mockPartidaRepository.buscarPorId
        .mockResolvedValueOnce(partida)
        .mockResolvedValueOnce({ ...partida, dupla1: jogadores1, dupla2: jogadores2 });

      mockConfrontoRepository.buscarPorId.mockResolvedValue(confronto);
      mockPartidaRepository.atualizar.mockResolvedValue(undefined);

      mockEquipeRepository.buscarPorId
        .mockResolvedValueOnce({ id: "equipe-1", nome: "Equipe 1", jogadores: jogadores1 })
        .mockResolvedValueOnce({ id: "equipe-2", nome: "Equipe 2", jogadores: jogadores2 });

      await service.definirJogadoresPartida(
        "partida-1",
        TEST_ARENA_ID,
        ["j1", "j2"] as [string, string],
        ["j3", "j4"] as [string, string]
      );

      // Deve ter atualizado a partida com os IDs das equipes
      expect(mockPartidaRepository.atualizar).toHaveBeenCalled();
    });

    it("deve lancar erro se equipe nao encontrada apos busca", async () => {
      const partida = {
        id: "partida-1",
        arenaId: TEST_ARENA_ID,
        dupla1: [],
        dupla2: [],
        confrontoId: "confronto-1",
        tipoJogo: TipoJogoTeams.MASCULINO,
        equipe1Id: "equipe-1",
        equipe2Id: "equipe-2",
      };

      const confronto = {
        id: "confronto-1",
        equipe1Id: "equipe-1",
        equipe2Id: "equipe-2",
        partidas: ["partida-1"],
      };

      mockPartidaRepository.buscarPorId.mockResolvedValue(partida);
      mockConfrontoRepository.buscarPorId.mockResolvedValue(confronto);
      mockEquipeRepository.buscarPorId
        .mockResolvedValueOnce(null) // equipe1 nao encontrada
        .mockResolvedValueOnce({ id: "equipe-2", nome: "Equipe 2", jogadores: [] });

      await expect(
        service.definirJogadoresPartida(
          "partida-1",
          TEST_ARENA_ID,
          ["j1", "j2"] as [string, string],
          ["j3", "j4"] as [string, string]
        )
      ).rejects.toThrow("Equipe não encontrada");
    });

    it("deve lancar erro se jogador nao pertence a equipe correta", async () => {
      const jogadores1 = [
        { id: "j1", nome: "J1", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
        { id: "j2", nome: "J2", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
      ];
      const jogadores2 = [
        { id: "j3", nome: "J3", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
        { id: "j4", nome: "J4", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
      ];

      const partida = {
        id: "partida-1",
        arenaId: TEST_ARENA_ID,
        dupla1: [],
        dupla2: [],
        confrontoId: "confronto-1",
        tipoJogo: TipoJogoTeams.MASCULINO,
        equipe1Id: "equipe-1",
        equipe2Id: "equipe-2",
      };

      const confronto = {
        id: "confronto-1",
        equipe1Id: "equipe-1",
        equipe2Id: "equipe-2",
        partidas: ["partida-1"],
      };

      mockPartidaRepository.buscarPorId.mockResolvedValue(partida);
      mockConfrontoRepository.buscarPorId.mockResolvedValue(confronto);
      mockEquipeRepository.buscarPorId
        .mockResolvedValueOnce({ id: "equipe-1", nome: "Equipe 1", jogadores: jogadores1 })
        .mockResolvedValueOnce({ id: "equipe-2", nome: "Equipe 2", jogadores: jogadores2 });

      // Tentar passar jogador j3 (da equipe2) para dupla1 (deveria ser da equipe1)
      await expect(
        service.definirJogadoresPartida(
          "partida-1",
          TEST_ARENA_ID,
          ["j1", "j3"] as [string, string], // j3 nao pertence a equipe1
          ["j3", "j4"] as [string, string]
        )
      ).rejects.toThrow("não pertence à equipe");
    });
  });

  // ==================== GERAR DECIDER - EQUIPE NAO ENCONTRADA ====================
  describe("gerarDecider - erros", () => {
    it("deve lancar erro se equipe nao encontrada", async () => {
      const confronto = {
        id: "confronto-1",
        etapaId: TEST_ETAPA_ID,
        arenaId: TEST_ARENA_ID,
        temDecider: false,
        equipe1Id: "equipe-1",
        equipe2Id: "equipe-2",
      };
      const etapa = criarEtapaTeams({ varianteTeams: VarianteTeams.TEAMS_4 });

      mockPartidaRepository.existeDecider.mockResolvedValue(false);
      mockEquipeRepository.buscarPorId
        .mockResolvedValueOnce(null) // equipe1 nao encontrada
        .mockResolvedValueOnce({ id: "equipe-2", nome: "Equipe 2", jogadores: [] });

      await expect(
        service.gerarDecider(confronto as any, etapa as any)
      ).rejects.toThrow("Equipe não encontrada");
    });
  });

  // ==================== GERAR CONFRONTOS - COBERTURA ADICIONAL ====================
  describe("gerarConfrontos - cenarios adicionais", () => {
    it("deve gerar partidas quando formacao nao e MANUAL", async () => {
      const etapa = criarEtapaTeams({
        tipoFormacaoJogos: TipoFormacaoJogos.SORTEIO,
        varianteTeams: VarianteTeams.TEAMS_4,
        genero: GeneroJogador.MASCULINO,
        isMisto: false,
      });

      const jogadores = [
        { id: "j1", nome: "J1", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
        { id: "j2", nome: "J2", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
        { id: "j3", nome: "J3", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
        { id: "j4", nome: "J4", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
      ];

      const equipes = [
        { id: "e1", nome: "Equipe 1", jogadores },
        { id: "e2", nome: "Equipe 2", jogadores },
      ];

      const confrontosGerados = [
        { id: "c1", equipe1Id: "e1", equipe2Id: "e2", fase: FaseEtapa.GRUPOS },
      ];

      mockEquipeRepository.buscarPorEtapaOrdenadas.mockResolvedValue(equipes);
      mockConfrontoRepository.criarEmLote.mockResolvedValue(confrontosGerados);

      const partidas = [
        { id: "p1", tipoJogo: TipoJogoTeams.MASCULINO },
        { id: "p2", tipoJogo: TipoJogoTeams.MASCULINO },
      ];
      mockPartidaRepository.criarEmLote.mockResolvedValue(partidas);
      mockConfrontoRepository.adicionarPartidasEmLote.mockResolvedValue(undefined);

      const result = await service.gerarConfrontos(etapa as any, TipoFormacaoJogos.SORTEIO);

      expect(result).toHaveLength(1);
      expect(mockPartidaRepository.criarEmLote).toHaveBeenCalled();
    });
  });

  // ==================== GERAR EQUIPES - NIVEL VARIADO ====================
  describe("gerarEquipes - niveis variados", () => {
    it("deve distribuir jogadores por nivel em equipes balanceadas", async () => {
      const etapa = criarEtapaTeams({
        varianteTeams: VarianteTeams.TEAMS_4,
        tipoFormacaoEquipe: TipoFormacaoEquipe.BALANCEADO,
        genero: GeneroJogador.MASCULINO,
        isMisto: false,
      });

      // 8 jogadores com niveis variados para 2 equipes
      const inscricoes = [
        { jogadorId: "j1", jogadorNome: "Jogador 1", nivel: NivelJogador.AVANCADO, genero: GeneroJogador.MASCULINO },
        { jogadorId: "j2", jogadorNome: "Jogador 2", nivel: NivelJogador.AVANCADO, genero: GeneroJogador.MASCULINO },
        { jogadorId: "j3", jogadorNome: "Jogador 3", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
        { jogadorId: "j4", jogadorNome: "Jogador 4", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
        { jogadorId: "j5", jogadorNome: "Jogador 5", nivel: NivelJogador.INICIANTE, genero: GeneroJogador.MASCULINO },
        { jogadorId: "j6", jogadorNome: "Jogador 6", nivel: NivelJogador.INICIANTE, genero: GeneroJogador.MASCULINO },
        { jogadorId: "j7", jogadorNome: "Jogador 7", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
        { jogadorId: "j8", jogadorNome: "Jogador 8", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
      ];

      const equipesGeradas = [
        { id: "equipe-1", nome: "Equipe 1", jogadores: inscricoes.slice(0, 4) },
        { id: "equipe-2", nome: "Equipe 2", jogadores: inscricoes.slice(4, 8) },
      ];

      mockEquipeRepository.criarEmLote.mockResolvedValue(equipesGeradas);
      mockEstatisticasService.criarEmLote.mockResolvedValue([]);

      const result = await service.gerarEquipes(etapa as any, inscricoes);

      expect(result.equipes).toHaveLength(2);
    });

    it("deve gerar equipes mistos com nivel variado", async () => {
      const etapa = criarEtapaTeams({
        varianteTeams: VarianteTeams.TEAMS_4,
        tipoFormacaoEquipe: TipoFormacaoEquipe.BALANCEADO,
        genero: GeneroJogador.MISTO,
        isMisto: true,
      });

      // 8 jogadores (4M + 4F) para 2 equipes mistas
      const inscricoes = [
        { jogadorId: "j1", jogadorNome: "Jogador 1", nivel: NivelJogador.AVANCADO, genero: GeneroJogador.MASCULINO },
        { jogadorId: "j2", jogadorNome: "Jogador 2", nivel: NivelJogador.INICIANTE, genero: GeneroJogador.MASCULINO },
        { jogadorId: "j3", jogadorNome: "Jogador 3", nivel: NivelJogador.AVANCADO, genero: GeneroJogador.FEMININO },
        { jogadorId: "j4", jogadorNome: "Jogador 4", nivel: NivelJogador.INICIANTE, genero: GeneroJogador.FEMININO },
        { jogadorId: "j5", jogadorNome: "Jogador 5", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
        { jogadorId: "j6", jogadorNome: "Jogador 6", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
        { jogadorId: "j7", jogadorNome: "Jogador 7", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.FEMININO },
        { jogadorId: "j8", jogadorNome: "Jogador 8", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.FEMININO },
      ];

      const equipesGeradas = [
        { id: "equipe-1", nome: "Equipe 1", jogadores: inscricoes.slice(0, 4) },
        { id: "equipe-2", nome: "Equipe 2", jogadores: inscricoes.slice(4, 8) },
      ];

      mockEquipeRepository.criarEmLote.mockResolvedValue(equipesGeradas);
      mockEstatisticasService.criarEmLote.mockResolvedValue([]);

      const result = await service.gerarEquipes(etapa as any, inscricoes);

      expect(result.equipes).toHaveLength(2);
    });
  });

  // ==================== GERAR CONFRONTOS - FASES ELIMINATORIAS ====================
  describe("gerarConfrontos - fases eliminatorias", () => {
    const criarEquipesComGrupo = (quantidade: number, numGrupos: number) => {
      const equipesPerGrupo = quantidade / numGrupos;
      return Array.from({ length: quantidade }, (_, i) => {
        const grupoIndex = Math.floor(i / equipesPerGrupo);
        const grupoLetter = String.fromCharCode(65 + grupoIndex); // A, B, C, D...
        return {
          id: `e${i}`,
          nome: `Equipe ${i + 1}`,
          jogadores: [],
          grupoId: grupoLetter,
        };
      });
    };

    it("deve gerar fase eliminatoria para 2 grupos (6 equipes)", async () => {
      const etapa = criarEtapaTeams();
      const equipes = criarEquipesComGrupo(6, 2);

      // Confrontos de grupos
      const confrontosGrupos = equipes.flatMap((e1, i) =>
        equipes.slice(i + 1).filter(e2 => e2.grupoId === e1.grupoId).map(e2 => ({
          id: `c${i}`,
          equipe1Id: e1.id,
          equipe2Id: e2.id,
          fase: FaseEtapa.GRUPOS,
          grupoId: e1.grupoId,
        }))
      );

      // Confrontos eliminatoria
      const confrontoFinal = { id: "final", fase: FaseEtapa.FINAL };
      const semifinais = [
        { id: "semi1", fase: FaseEtapa.SEMIFINAL, proximoConfrontoId: "final" },
        { id: "semi2", fase: FaseEtapa.SEMIFINAL, proximoConfrontoId: "final" },
      ];

      mockEquipeRepository.buscarPorEtapaOrdenadas.mockResolvedValue(equipes);
      mockConfrontoRepository.criarEmLote
        .mockResolvedValueOnce(confrontosGrupos)
        .mockResolvedValueOnce([confrontoFinal])  // Final
        .mockResolvedValueOnce(semifinais);
      mockPartidaRepository.criarEmLote.mockResolvedValue([]);

      const result = await service.gerarConfrontos(etapa as any, TipoFormacaoJogos.SORTEIO);

      expect(result.length).toBeGreaterThan(0);
      expect(mockConfrontoRepository.criarEmLote).toHaveBeenCalled();
    });

    it("deve gerar fase eliminatoria para 3 grupos (9 equipes)", async () => {
      const etapa = criarEtapaTeams();
      const equipes = criarEquipesComGrupo(9, 3);

      const confrontosGrupos = [];
      for (let g = 0; g < 3; g++) {
        const letra = String.fromCharCode(65 + g);
        const equipesDoGrupo = equipes.filter(e => e.grupoId === letra);
        for (let i = 0; i < equipesDoGrupo.length; i++) {
          for (let j = i + 1; j < equipesDoGrupo.length; j++) {
            confrontosGrupos.push({
              id: `c${g}_${i}_${j}`,
              equipe1Id: equipesDoGrupo[i].id,
              equipe2Id: equipesDoGrupo[j].id,
              fase: FaseEtapa.GRUPOS,
              grupoId: letra,
            });
          }
        }
      }

      const confrontoFinal = { id: "final", fase: FaseEtapa.FINAL };
      const semifinais = [
        { id: "semi1", fase: FaseEtapa.SEMIFINAL },
        { id: "semi2", fase: FaseEtapa.SEMIFINAL },
      ];
      const quartas = [
        { id: "q1", fase: FaseEtapa.QUARTAS },
        { id: "q2", fase: FaseEtapa.QUARTAS },
        { id: "q3", fase: FaseEtapa.QUARTAS },
        { id: "q4", fase: FaseEtapa.QUARTAS },
      ];

      mockEquipeRepository.buscarPorEtapaOrdenadas.mockResolvedValue(equipes);
      mockConfrontoRepository.criarEmLote
        .mockResolvedValueOnce(confrontosGrupos)
        .mockResolvedValueOnce([confrontoFinal])  // Final
        .mockResolvedValueOnce(semifinais)
        .mockResolvedValueOnce(quartas);
      mockPartidaRepository.criarEmLote.mockResolvedValue([]);

      const result = await service.gerarConfrontos(etapa as any, TipoFormacaoJogos.SORTEIO);

      expect(result.length).toBeGreaterThan(0);
    });

    it("deve gerar fase eliminatoria para 4 grupos (12 equipes)", async () => {
      const etapa = criarEtapaTeams();
      const equipes = criarEquipesComGrupo(12, 4);

      const confrontosGrupos = [];
      for (let g = 0; g < 4; g++) {
        const letra = String.fromCharCode(65 + g);
        const equipesDoGrupo = equipes.filter(e => e.grupoId === letra);
        for (let i = 0; i < equipesDoGrupo.length; i++) {
          for (let j = i + 1; j < equipesDoGrupo.length; j++) {
            confrontosGrupos.push({
              id: `c${g}_${i}_${j}`,
              equipe1Id: equipesDoGrupo[i].id,
              equipe2Id: equipesDoGrupo[j].id,
              fase: FaseEtapa.GRUPOS,
              grupoId: letra,
            });
          }
        }
      }

      const confrontoFinal = { id: "final", fase: FaseEtapa.FINAL };
      const semifinais = [
        { id: "semi1", fase: FaseEtapa.SEMIFINAL },
        { id: "semi2", fase: FaseEtapa.SEMIFINAL },
      ];
      const quartas = [
        { id: "q1", fase: FaseEtapa.QUARTAS },
        { id: "q2", fase: FaseEtapa.QUARTAS },
        { id: "q3", fase: FaseEtapa.QUARTAS },
        { id: "q4", fase: FaseEtapa.QUARTAS },
      ];

      mockEquipeRepository.buscarPorEtapaOrdenadas.mockResolvedValue(equipes);
      mockConfrontoRepository.criarEmLote
        .mockResolvedValueOnce(confrontosGrupos)
        .mockResolvedValueOnce([confrontoFinal])  // Final
        .mockResolvedValueOnce(semifinais)
        .mockResolvedValueOnce(quartas);
      mockPartidaRepository.criarEmLote.mockResolvedValue([]);

      const result = await service.gerarConfrontos(etapa as any, TipoFormacaoJogos.SORTEIO);

      expect(result.length).toBeGreaterThan(0);
    });
  });

  // ==================== GERAR PARTIDAS - TEAMS_4 MISTO COM SORTEIO ====================
  describe("gerarPartidasConfronto - variantes", () => {
    it("deve criar partidas TEAMS_4 genero feminino", async () => {
      const confronto = {
        id: "confronto-1",
        etapaId: TEST_ETAPA_ID,
        arenaId: TEST_ARENA_ID,
        equipe1Id: "equipe-1",
        equipe2Id: "equipe-2",
        equipe1Nome: "Equipe 1",
        equipe2Nome: "Equipe 2",
      };
      const etapa = criarEtapaTeams({
        varianteTeams: VarianteTeams.TEAMS_4,
        tipoFormacaoJogos: TipoFormacaoJogos.SORTEIO,
        genero: GeneroJogador.FEMININO,
        isMisto: false,
      });

      const jogadores = [
        { id: "j1", nome: "J1", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.FEMININO },
        { id: "j2", nome: "J2", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.FEMININO },
        { id: "j3", nome: "J3", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.FEMININO },
        { id: "j4", nome: "J4", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.FEMININO },
      ];

      mockEquipeRepository.buscarPorIds.mockResolvedValue([
        { id: "equipe-1", nome: "Equipe 1", jogadores },
        { id: "equipe-2", nome: "Equipe 2", jogadores },
      ]);

      const partidasCriadas = [
        { id: "partida-1", tipoJogo: TipoJogoTeams.FEMININO },
        { id: "partida-2", tipoJogo: TipoJogoTeams.FEMININO },
      ];

      mockPartidaRepository.criarEmLote.mockResolvedValue(partidasCriadas);
      mockConfrontoRepository.adicionarPartidasEmLote.mockResolvedValue(undefined);

      const result = await service.gerarPartidasConfronto(confronto as any, etapa as any);

      expect(result).toHaveLength(2);
    });

    it("deve criar partidas TEAMS_6 genero feminino", async () => {
      const confronto = {
        id: "confronto-1",
        etapaId: TEST_ETAPA_ID,
        arenaId: TEST_ARENA_ID,
        equipe1Id: "equipe-1",
        equipe2Id: "equipe-2",
        equipe1Nome: "Equipe 1",
        equipe2Nome: "Equipe 2",
      };
      const etapa = criarEtapaTeams({
        varianteTeams: VarianteTeams.TEAMS_6,
        tipoFormacaoJogos: TipoFormacaoJogos.SORTEIO,
        genero: GeneroJogador.FEMININO,
        isMisto: false,
      });

      const jogadores = Array.from({ length: 6 }, (_, i) => ({
        id: `j${i}`,
        nome: `J${i}`,
        nivel: NivelJogador.INTERMEDIARIO,
        genero: GeneroJogador.FEMININO,
      }));

      mockEquipeRepository.buscarPorIds.mockResolvedValue([
        { id: "equipe-1", nome: "Equipe 1", jogadores },
        { id: "equipe-2", nome: "Equipe 2", jogadores },
      ]);

      const partidasCriadas = [
        { id: "partida-1", tipoJogo: TipoJogoTeams.FEMININO },
        { id: "partida-2", tipoJogo: TipoJogoTeams.FEMININO },
        { id: "partida-3", tipoJogo: TipoJogoTeams.FEMININO },
      ];

      mockPartidaRepository.criarEmLote.mockResolvedValue(partidasCriadas);
      mockConfrontoRepository.adicionarPartidasEmLote.mockResolvedValue(undefined);

      const result = await service.gerarPartidasConfronto(confronto as any, etapa as any);

      expect(result).toHaveLength(3);
    });

    it("deve criar partidas vazias TEAMS_4 genero feminino para formacao manual", async () => {
      const confronto = {
        id: "confronto-1",
        etapaId: TEST_ETAPA_ID,
        arenaId: TEST_ARENA_ID,
        equipe1Id: "equipe-1",
        equipe2Id: "equipe-2",
        equipe1Nome: "Equipe 1",
        equipe2Nome: "Equipe 2",
      };
      const etapa = criarEtapaTeams({
        varianteTeams: VarianteTeams.TEAMS_4,
        tipoFormacaoJogos: TipoFormacaoJogos.MANUAL,
        genero: GeneroJogador.FEMININO,
        isMisto: false,
      });

      const jogadores = [
        { id: "j1", nome: "J1", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.FEMININO },
        { id: "j2", nome: "J2", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.FEMININO },
        { id: "j3", nome: "J3", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.FEMININO },
        { id: "j4", nome: "J4", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.FEMININO },
      ];

      mockEquipeRepository.buscarPorIds.mockResolvedValue([
        { id: "equipe-1", nome: "Equipe 1", jogadores },
        { id: "equipe-2", nome: "Equipe 2", jogadores },
      ]);

      const partidasVazias = [
        { id: "p1", tipoJogo: TipoJogoTeams.FEMININO, dupla1: [], dupla2: [] },
        { id: "p2", tipoJogo: TipoJogoTeams.FEMININO, dupla1: [], dupla2: [] },
      ];

      mockPartidaRepository.criarEmLote.mockResolvedValue(partidasVazias);
      mockConfrontoRepository.adicionarPartida.mockResolvedValue(undefined);

      const result = await service.gerarPartidasConfronto(confronto as any, etapa as any);

      expect(result).toHaveLength(2);
    });
  });

  // ==================== GERAR EQUIPES - ALEATORIO ====================
  describe("gerarEquipes - formacao aleatorio", () => {
    it("deve gerar equipes com formacao aleatorio nao misto", async () => {
      const etapa = criarEtapaTeams({
        varianteTeams: VarianteTeams.TEAMS_4,
        tipoFormacaoEquipe: TipoFormacaoEquipe.MESMO_NIVEL,
        genero: GeneroJogador.MASCULINO,
        isMisto: false,
      });

      const inscricoes = Array.from({ length: 8 }, (_, i) => ({
        jogadorId: `j${i}`,
        jogadorNome: `Jogador ${i + 1}`,
        nivel: NivelJogador.INTERMEDIARIO,
        genero: GeneroJogador.MASCULINO,
      }));

      const equipesGeradas = [
        { id: "equipe-1", nome: "Equipe 1", jogadores: inscricoes.slice(0, 4) },
        { id: "equipe-2", nome: "Equipe 2", jogadores: inscricoes.slice(4, 8) },
      ];

      mockEquipeRepository.criarEmLote.mockResolvedValue(equipesGeradas);
      mockEstatisticasService.criarEmLote.mockResolvedValue([]);

      const result = await service.gerarEquipes(etapa as any, inscricoes);

      expect(result.equipes).toHaveLength(2);
    });

    it("deve gerar equipes com formacao aleatorio misto", async () => {
      const etapa = criarEtapaTeams({
        varianteTeams: VarianteTeams.TEAMS_4,
        tipoFormacaoEquipe: TipoFormacaoEquipe.MESMO_NIVEL,
        genero: GeneroJogador.MISTO,
        isMisto: true,
      });

      const inscricoes = [
        { jogadorId: "j1", jogadorNome: "J1", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
        { jogadorId: "j2", jogadorNome: "J2", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
        { jogadorId: "j3", jogadorNome: "J3", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
        { jogadorId: "j4", jogadorNome: "J4", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
        { jogadorId: "j5", jogadorNome: "J5", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.FEMININO },
        { jogadorId: "j6", jogadorNome: "J6", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.FEMININO },
        { jogadorId: "j7", jogadorNome: "J7", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.FEMININO },
        { jogadorId: "j8", jogadorNome: "J8", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.FEMININO },
      ];

      const equipesGeradas = [
        { id: "equipe-1", nome: "Equipe 1", jogadores: inscricoes.slice(0, 4) },
        { id: "equipe-2", nome: "Equipe 2", jogadores: inscricoes.slice(4, 8) },
      ];

      mockEquipeRepository.criarEmLote.mockResolvedValue(equipesGeradas);
      mockEstatisticasService.criarEmLote.mockResolvedValue([]);

      const result = await service.gerarEquipes(etapa as any, inscricoes);

      expect(result.equipes).toHaveLength(2);
    });

    it("deve gerar equipes TEAMS_6 com MESMO_NIVEL", async () => {
      const etapa = criarEtapaTeams({
        varianteTeams: VarianteTeams.TEAMS_6,
        tipoFormacaoEquipe: TipoFormacaoEquipe.MESMO_NIVEL,
        genero: GeneroJogador.MASCULINO,
        isMisto: false,
      });

      const inscricoes = Array.from({ length: 12 }, (_, i) => ({
        jogadorId: `j${i}`,
        jogadorNome: `Jogador ${i + 1}`,
        nivel: NivelJogador.INTERMEDIARIO,
        genero: GeneroJogador.MASCULINO,
      }));

      const equipesGeradas = [
        { id: "equipe-1", nome: "Equipe 1", jogadores: inscricoes.slice(0, 6) },
        { id: "equipe-2", nome: "Equipe 2", jogadores: inscricoes.slice(6, 12) },
      ];

      mockEquipeRepository.criarEmLote.mockResolvedValue(equipesGeradas);
      mockEstatisticasService.criarEmLote.mockResolvedValue([]);

      const result = await service.gerarEquipes(etapa as any, inscricoes);

      expect(result.equipes).toHaveLength(2);
    });

    it("deve gerar equipes TEAMS_6 misto com MESMO_NIVEL", async () => {
      const etapa = criarEtapaTeams({
        varianteTeams: VarianteTeams.TEAMS_6,
        tipoFormacaoEquipe: TipoFormacaoEquipe.MESMO_NIVEL,
        genero: GeneroJogador.MISTO,
        isMisto: true,
      });

      const inscricoes = [
        { jogadorId: "j1", jogadorNome: "J1", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
        { jogadorId: "j2", jogadorNome: "J2", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
        { jogadorId: "j3", jogadorNome: "J3", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
        { jogadorId: "j4", jogadorNome: "J4", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.FEMININO },
        { jogadorId: "j5", jogadorNome: "J5", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.FEMININO },
        { jogadorId: "j6", jogadorNome: "J6", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.FEMININO },
        { jogadorId: "j7", jogadorNome: "J7", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
        { jogadorId: "j8", jogadorNome: "J8", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
        { jogadorId: "j9", jogadorNome: "J9", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
        { jogadorId: "j10", jogadorNome: "J10", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.FEMININO },
        { jogadorId: "j11", jogadorNome: "J11", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.FEMININO },
        { jogadorId: "j12", jogadorNome: "J12", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.FEMININO },
      ];

      const equipesGeradas = [
        { id: "equipe-1", nome: "Equipe 1", jogadores: inscricoes.slice(0, 6) },
        { id: "equipe-2", nome: "Equipe 2", jogadores: inscricoes.slice(6, 12) },
      ];

      mockEquipeRepository.criarEmLote.mockResolvedValue(equipesGeradas);
      mockEstatisticasService.criarEmLote.mockResolvedValue([]);

      const result = await service.gerarEquipes(etapa as any, inscricoes);

      expect(result.equipes).toHaveLength(2);
    });
  });

  // ==================== RECALCULAR CLASSIFICACAO - CENARIOS ADICIONAIS ====================
  describe("recalcularClassificacao - cenarios adicionais", () => {
    it("deve ordenar por saldo de games quando pontos e saldo de jogos iguais", async () => {
      const equipes = [
        { id: "e1", nome: "Equipe 1", pontos: 3, saldoJogos: 1, saldoGames: 2, gamesVencidos: 10 },
        { id: "e2", nome: "Equipe 2", pontos: 3, saldoJogos: 1, saldoGames: 5, gamesVencidos: 10 },
      ];

      mockEquipeRepository.buscarPorEtapa.mockResolvedValue(equipes);
      mockEquipeRepository.atualizarPosicoesEmLote.mockResolvedValue(undefined);

      const result = await service.recalcularClassificacao(TEST_ETAPA_ID, TEST_ARENA_ID);

      expect(result[0].id).toBe("e2"); // Maior saldo de games
      expect(result[1].id).toBe("e1");
    });

    it("deve ordenar por games vencidos quando outros criterios iguais", async () => {
      const equipes = [
        { id: "e1", nome: "Equipe 1", pontos: 3, saldoJogos: 1, saldoGames: 5, gamesVencidos: 10 },
        { id: "e2", nome: "Equipe 2", pontos: 3, saldoJogos: 1, saldoGames: 5, gamesVencidos: 15 },
      ];

      mockEquipeRepository.buscarPorEtapa.mockResolvedValue(equipes);
      mockEquipeRepository.atualizarPosicoesEmLote.mockResolvedValue(undefined);

      const result = await service.recalcularClassificacao(TEST_ETAPA_ID, TEST_ARENA_ID);

      expect(result[0].id).toBe("e2"); // Mais games vencidos
      expect(result[1].id).toBe("e1");
    });

    it("deve ordenar por nome quando todos criterios iguais", async () => {
      const equipes = [
        { id: "e1", nome: "Zebra", pontos: 3, saldoJogos: 1, saldoGames: 5, gamesVencidos: 10 },
        { id: "e2", nome: "Aguia", pontos: 3, saldoJogos: 1, saldoGames: 5, gamesVencidos: 10 },
      ];

      mockEquipeRepository.buscarPorEtapa.mockResolvedValue(equipes);
      mockEquipeRepository.atualizarPosicoesEmLote.mockResolvedValue(undefined);

      const result = await service.recalcularClassificacao(TEST_ETAPA_ID, TEST_ARENA_ID);

      expect(result[0].id).toBe("e2"); // Aguia vem antes de Zebra
      expect(result[1].id).toBe("e1");
    });
  });

  // ==================== DEFINIR PARTIDAS - CENARIOS ADICIONAIS ====================
  describe("definirPartidasManualmente - cenarios adicionais", () => {
    it("deve lancar erro se equipe2 nao encontrada", async () => {
      const confronto = {
        id: "confronto-1",
        equipe1Id: "equipe-1",
        equipe2Id: "equipe-2",
      };

      const etapa = criarEtapaTeams();

      const definicao = {
        partidas: [],
      };

      mockEquipeRepository.buscarPorId
        .mockResolvedValueOnce({ id: "equipe-1", nome: "Equipe 1", jogadores: [] })
        .mockResolvedValueOnce(null); // equipe2 nao encontrada

      await expect(
        service.definirPartidasManualmente(confronto as any, etapa as any, definicao as any)
      ).rejects.toThrow(NotFoundError);
    });

    it("deve definir partida mista manualmente", async () => {
      const jogadores1 = [
        { id: "j1", nome: "J1", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
        { id: "j2", nome: "J2", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.FEMININO },
      ];
      const jogadores2 = [
        { id: "j3", nome: "J3", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
        { id: "j4", nome: "J4", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.FEMININO },
      ];

      const confronto = {
        id: "confronto-1",
        etapaId: TEST_ETAPA_ID,
        arenaId: TEST_ARENA_ID,
        equipe1Id: "equipe-1",
        equipe2Id: "equipe-2",
        equipe1Nome: "Equipe 1",
        equipe2Nome: "Equipe 2",
      };

      const etapa = criarEtapaTeams({
        genero: GeneroJogador.MISTO,
        isMisto: true,
      });

      const definicao = {
        partidas: [
          {
            ordem: 1,
            tipoJogo: TipoJogoTeams.MISTO,
            dupla1JogadorIds: ["j1", "j2"],
            dupla2JogadorIds: ["j3", "j4"],
          },
        ],
      };

      mockEquipeRepository.buscarPorId
        .mockResolvedValueOnce({ id: "equipe-1", nome: "Equipe 1", jogadores: jogadores1 })
        .mockResolvedValueOnce({ id: "equipe-2", nome: "Equipe 2", jogadores: jogadores2 });

      const partidasCriadas = [{ id: "partida-1", tipoJogo: TipoJogoTeams.MISTO }];

      mockPartidaRepository.criarEmLote.mockResolvedValue(partidasCriadas);
      mockConfrontoRepository.adicionarPartidasEmLote.mockResolvedValue(undefined);

      const result = await service.definirPartidasManualmente(
        confronto as any,
        etapa as any,
        definicao as any
      );

      expect(result).toHaveLength(1);
    });
  });

  // ==================== GERAR EQUIPES - COM 5+ GRUPOS ====================
  describe("gerarEquipes - muitos grupos", () => {
    it("deve gerar equipes com 5 grupos (15 equipes)", async () => {
      const etapa = criarEtapaTeams({
        varianteTeams: VarianteTeams.TEAMS_4,
        tipoFormacaoEquipe: TipoFormacaoEquipe.BALANCEADO,
        genero: GeneroJogador.MASCULINO,
        isMisto: false,
      });

      // 60 jogadores para 15 equipes de 4 (5 grupos de 3 equipes)
      const inscricoes = Array.from({ length: 60 }, (_, i) => ({
        jogadorId: `j${i}`,
        jogadorNome: `Jogador ${i + 1}`,
        nivel: i % 3 === 0 ? NivelJogador.AVANCADO : i % 3 === 1 ? NivelJogador.INTERMEDIARIO : NivelJogador.INICIANTE,
        genero: GeneroJogador.MASCULINO,
      }));

      // 15 equipes distribuídas em 5 grupos
      const equipesGeradas = Array.from({ length: 15 }, (_, i) => {
        const grupoIndex = Math.floor(i / 3);
        const grupoLetter = String.fromCharCode(65 + grupoIndex); // A, B, C, D, E
        return {
          id: `equipe-${i}`,
          nome: `Equipe ${i + 1}`,
          jogadores: inscricoes.slice(i * 4, (i + 1) * 4),
          grupoId: grupoLetter,
          grupoNome: `Grupo ${grupoLetter}`,
        };
      });

      mockEquipeRepository.criarEmLote.mockResolvedValue(equipesGeradas);
      mockEstatisticasService.criarEmLote.mockResolvedValue([]);

      const result = await service.gerarEquipes(etapa as any, inscricoes);

      expect(result.equipes).toHaveLength(15);
      expect(result.temFaseGrupos).toBe(true);
    });
  });

  // ==================== GERAR DECIDER - MAIS CENARIOS ====================
  describe("gerarDecider - mais cenarios", () => {
    it("deve lancar erro se equipe2 nao encontrada", async () => {
      const confronto = {
        id: "confronto-1",
        etapaId: TEST_ETAPA_ID,
        arenaId: TEST_ARENA_ID,
        temDecider: false,
        equipe1Id: "equipe-1",
        equipe2Id: "equipe-2",
      };
      const etapa = criarEtapaTeams({ varianteTeams: VarianteTeams.TEAMS_4 });

      mockPartidaRepository.existeDecider.mockResolvedValue(false);
      mockEquipeRepository.buscarPorId
        .mockResolvedValueOnce({ id: "equipe-1", nome: "Equipe 1", jogadores: [] })
        .mockResolvedValueOnce(null); // equipe2 nao encontrada

      await expect(
        service.gerarDecider(confronto as any, etapa as any)
      ).rejects.toThrow("Equipe não encontrada");
    });
  });

  // ==================== GERAR PARTIDAS CONFRONTO - MAIS CENARIOS ====================
  describe("gerarPartidasConfronto - mais cenarios", () => {
    it("deve lancar erro se equipe2 nao encontrada", async () => {
      const confronto = {
        id: "confronto-1",
        etapaId: TEST_ETAPA_ID,
        arenaId: TEST_ARENA_ID,
        equipe1Id: "equipe-1",
        equipe2Id: "equipe-2",
        equipe1Nome: "Equipe 1",
        equipe2Nome: "Equipe 2",
      };
      const etapa = criarEtapaTeams({
        tipoFormacaoJogos: TipoFormacaoJogos.SORTEIO,
      });

      mockEquipeRepository.buscarPorIds.mockResolvedValue([
        { id: "equipe-1", jogadores: [] },
        // equipe-2 falta
      ]);

      await expect(
        service.gerarPartidasConfronto(confronto as any, etapa as any)
      ).rejects.toThrow(NotFoundError);
    });

    it("deve criar partidas TEAMS_6 genero feminino manual", async () => {
      const confronto = {
        id: "confronto-1",
        etapaId: TEST_ETAPA_ID,
        arenaId: TEST_ARENA_ID,
        equipe1Id: "equipe-1",
        equipe2Id: "equipe-2",
        equipe1Nome: "Equipe 1",
        equipe2Nome: "Equipe 2",
      };
      const etapa = criarEtapaTeams({
        varianteTeams: VarianteTeams.TEAMS_6,
        tipoFormacaoJogos: TipoFormacaoJogos.MANUAL,
        genero: GeneroJogador.FEMININO,
        isMisto: false,
      });

      const jogadores = Array.from({ length: 6 }, (_, i) => ({
        id: `j${i}`,
        nome: `J${i}`,
        nivel: NivelJogador.INTERMEDIARIO,
        genero: GeneroJogador.FEMININO,
      }));

      mockEquipeRepository.buscarPorIds.mockResolvedValue([
        { id: "equipe-1", nome: "Equipe 1", jogadores },
        { id: "equipe-2", nome: "Equipe 2", jogadores },
      ]);

      const partidasVazias = [
        { id: "p1", tipoJogo: TipoJogoTeams.FEMININO, dupla1: [], dupla2: [] },
        { id: "p2", tipoJogo: TipoJogoTeams.FEMININO, dupla1: [], dupla2: [] },
        { id: "p3", tipoJogo: TipoJogoTeams.FEMININO, dupla1: [], dupla2: [] },
      ];

      mockPartidaRepository.criarEmLote.mockResolvedValue(partidasVazias);
      mockConfrontoRepository.adicionarPartida.mockResolvedValue(undefined);

      const result = await service.gerarPartidasConfronto(confronto as any, etapa as any);

      expect(result).toHaveLength(3);
    });
  });

  // ==================== GERAR EQUIPES - MAIS COMBINACOES ====================
  describe("gerarEquipes - mais combinacoes", () => {
    it("deve gerar equipes com BALANCEADO e genero feminino", async () => {
      const etapa = criarEtapaTeams({
        varianteTeams: VarianteTeams.TEAMS_4,
        tipoFormacaoEquipe: TipoFormacaoEquipe.BALANCEADO,
        genero: GeneroJogador.FEMININO,
        isMisto: false,
      });

      const inscricoes = Array.from({ length: 8 }, (_, i) => ({
        jogadorId: `j${i}`,
        jogadorNome: `Jogador ${i + 1}`,
        nivel: i < 4 ? NivelJogador.AVANCADO : NivelJogador.INICIANTE,
        genero: GeneroJogador.FEMININO,
      }));

      const equipesGeradas = [
        { id: "equipe-1", nome: "Equipe 1", jogadores: inscricoes.slice(0, 4) },
        { id: "equipe-2", nome: "Equipe 2", jogadores: inscricoes.slice(4, 8) },
      ];

      mockEquipeRepository.criarEmLote.mockResolvedValue(equipesGeradas);
      mockEstatisticasService.criarEmLote.mockResolvedValue([]);

      const result = await service.gerarEquipes(etapa as any, inscricoes);

      expect(result.equipes).toHaveLength(2);
    });

    it("deve gerar equipes TEAMS_6 com BALANCEADO e genero feminino", async () => {
      const etapa = criarEtapaTeams({
        varianteTeams: VarianteTeams.TEAMS_6,
        tipoFormacaoEquipe: TipoFormacaoEquipe.BALANCEADO,
        genero: GeneroJogador.FEMININO,
        isMisto: false,
      });

      const inscricoes = Array.from({ length: 12 }, (_, i) => ({
        jogadorId: `j${i}`,
        jogadorNome: `Jogador ${i + 1}`,
        nivel: i % 3 === 0 ? NivelJogador.AVANCADO : i % 3 === 1 ? NivelJogador.INTERMEDIARIO : NivelJogador.INICIANTE,
        genero: GeneroJogador.FEMININO,
      }));

      const equipesGeradas = [
        { id: "equipe-1", nome: "Equipe 1", jogadores: inscricoes.slice(0, 6) },
        { id: "equipe-2", nome: "Equipe 2", jogadores: inscricoes.slice(6, 12) },
      ];

      mockEquipeRepository.criarEmLote.mockResolvedValue(equipesGeradas);
      mockEstatisticasService.criarEmLote.mockResolvedValue([]);

      const result = await service.gerarEquipes(etapa as any, inscricoes);

      expect(result.equipes).toHaveLength(2);
    });

    it("deve gerar equipes TEAMS_6 misto com BALANCEADO", async () => {
      const etapa = criarEtapaTeams({
        varianteTeams: VarianteTeams.TEAMS_6,
        tipoFormacaoEquipe: TipoFormacaoEquipe.BALANCEADO,
        genero: GeneroJogador.MISTO,
        isMisto: true,
      });

      // 12 jogadores (6M + 6F) para 2 equipes mistas de 6
      const inscricoes = [
        { jogadorId: "j1", jogadorNome: "J1", nivel: NivelJogador.AVANCADO, genero: GeneroJogador.MASCULINO },
        { jogadorId: "j2", jogadorNome: "J2", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
        { jogadorId: "j3", jogadorNome: "J3", nivel: NivelJogador.INICIANTE, genero: GeneroJogador.MASCULINO },
        { jogadorId: "j4", jogadorNome: "J4", nivel: NivelJogador.AVANCADO, genero: GeneroJogador.FEMININO },
        { jogadorId: "j5", jogadorNome: "J5", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.FEMININO },
        { jogadorId: "j6", jogadorNome: "J6", nivel: NivelJogador.INICIANTE, genero: GeneroJogador.FEMININO },
        { jogadorId: "j7", jogadorNome: "J7", nivel: NivelJogador.AVANCADO, genero: GeneroJogador.MASCULINO },
        { jogadorId: "j8", jogadorNome: "J8", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
        { jogadorId: "j9", jogadorNome: "J9", nivel: NivelJogador.INICIANTE, genero: GeneroJogador.MASCULINO },
        { jogadorId: "j10", jogadorNome: "J10", nivel: NivelJogador.AVANCADO, genero: GeneroJogador.FEMININO },
        { jogadorId: "j11", jogadorNome: "J11", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.FEMININO },
        { jogadorId: "j12", jogadorNome: "J12", nivel: NivelJogador.INICIANTE, genero: GeneroJogador.FEMININO },
      ];

      const equipesGeradas = [
        { id: "equipe-1", nome: "Equipe 1", jogadores: inscricoes.slice(0, 6) },
        { id: "equipe-2", nome: "Equipe 2", jogadores: inscricoes.slice(6, 12) },
      ];

      mockEquipeRepository.criarEmLote.mockResolvedValue(equipesGeradas);
      mockEstatisticasService.criarEmLote.mockResolvedValue([]);

      const result = await service.gerarEquipes(etapa as any, inscricoes);

      expect(result.equipes).toHaveLength(2);
    });
  });

  // ==================== REGISTRAR RESULTADO - CENARIOS ADICIONAIS ====================
  describe("registrarResultadoPartida - cenarios adicionais", () => {
    it("deve processar resultado com dupla2 vencedora", async () => {
      const partida = {
        id: "partida-1",
        confrontoId: "confronto-1",
        etapaId: TEST_ETAPA_ID,
        arenaId: TEST_ARENA_ID,
        status: "agendada",
        tipoJogo: TipoJogoTeams.MASCULINO,
        equipe1Id: "equipe-1",
        equipe2Id: "equipe-2",
        equipe1Nome: "Equipe 1",
        equipe2Nome: "Equipe 2",
        dupla1: [
          { id: "j1", nome: "J1", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
          { id: "j2", nome: "J2", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
        ],
        dupla2: [
          { id: "j3", nome: "J3", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
          { id: "j4", nome: "J4", nivel: NivelJogador.INTERMEDIARIO, genero: GeneroJogador.MASCULINO },
        ],
      };

      const confronto = {
        id: "confronto-1",
        etapaId: TEST_ETAPA_ID,
        arenaId: TEST_ARENA_ID,
        equipe1Id: "equipe-1",
        equipe2Id: "equipe-2",
        equipe1Nome: "Equipe 1",
        equipe2Nome: "Equipe 2",
        jogosEquipe1: 0,
        jogosEquipe2: 0,
        partidasFinalizadas: 0,
        totalPartidas: 2,
        temDecider: false,
      };

      mockPartidaRepository.buscarPorId.mockResolvedValue(partida);
      mockConfrontoRepository.buscarPorId.mockResolvedValue(confronto);
      mockPartidaRepository.buscarPorConfrontoOrdenadas.mockResolvedValue([partida]);
      mockPartidaRepository.registrarResultado.mockResolvedValue(undefined);
      mockConfrontoRepository.atualizar.mockResolvedValue(undefined);
      mockEstatisticasService.buscarPorJogadoresEtapa.mockResolvedValue(new Map([
        ["j1", { id: "est-1" }],
        ["j2", { id: "est-2" }],
        ["j3", { id: "est-3" }],
        ["j4", { id: "est-4" }],
      ]));
      (mockEstatisticasService as any).atualizarAposPartidaComIncrement = jest.fn().mockResolvedValue(undefined);
      mockEquipeRepository.incrementarEstatisticasEmLote.mockResolvedValue(undefined);

      // Placar com dupla2/equipe2 vencedora
      const placar = [
        { numero: 1, gamesDupla1: 3, gamesDupla2: 6 },
        { numero: 2, gamesDupla1: 4, gamesDupla2: 6 },
      ];

      await service.registrarResultadoPartida("partida-1", TEST_ARENA_ID, { placar });

      expect(mockPartidaRepository.registrarResultado).toHaveBeenCalled();
    });
  });
});
