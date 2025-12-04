/**
 * Testes do EtapaService
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

// Mock de todos os repositories
jest.mock("../../repositories/firebase/EtapaRepository", () => ({
  EtapaRepository: jest.fn(),
}));
jest.mock("../../repositories/firebase/InscricaoRepository", () => ({
  InscricaoRepository: jest.fn(),
}));
jest.mock("../../repositories/firebase/JogadorRepository", () => ({
  JogadorRepository: jest.fn(),
}));
jest.mock("../../repositories/firebase/ConfigRepository", () => ({
  ConfigRepository: jest.fn(),
}));
jest.mock("../../repositories/firebase/CabecaDeChaveRepository", () => ({
  CabecaDeChaveRepository: jest.fn(),
}));
jest.mock("../../repositories/firebase/EstatisticasJogadorRepository", () => ({
  EstatisticasJogadorRepository: jest.fn(),
}));
jest.mock("../../repositories/firebase/GrupoRepository", () => ({
  GrupoRepository: jest.fn(),
}));
jest.mock("../../repositories/firebase/DuplaRepository", () => ({
  DuplaRepository: jest.fn(),
}));
jest.mock("../../repositories/firebase/ConfrontoEliminatorioRepository", () => ({
  ConfrontoEliminatorioRepository: jest.fn(),
}));

import { EtapaService } from "../../services/EtapaService";
import {
  createMockEtapaRepository,
  createMockInscricaoRepository,
  createMockJogadorRepository,
  createMockConfigRepository,
  createMockCabecaDeChaveRepository,
  createMockEstatisticasRepository,
  createMockGrupoRepository,
  createMockDuplaRepository,
  createMockConfrontoRepository,
} from "../mocks/repositories";
import {
  createEtapaFixture,
  createCriarEtapaDTO,
  createJogadorFixture,
  createInscricaoFixture,
  createDuplaFixture,
  createGrupoFixture,
  createConfrontoFixture,
  createEstatisticasJogadorFixture,
  TEST_IDS,
  NivelJogador,
  GeneroJogador,
  StatusEtapa,
  TipoFase,
} from "../fixtures";

describe("EtapaService", () => {
  let mockEtapaRepository: ReturnType<typeof createMockEtapaRepository>;
  let mockInscricaoRepository: ReturnType<typeof createMockInscricaoRepository>;
  let mockJogadorRepository: ReturnType<typeof createMockJogadorRepository>;
  let mockConfigRepository: ReturnType<typeof createMockConfigRepository>;
  let mockCabecaDeChaveRepository: ReturnType<typeof createMockCabecaDeChaveRepository>;
  let mockEstatisticasRepository: ReturnType<typeof createMockEstatisticasRepository>;
  let mockGrupoRepository: ReturnType<typeof createMockGrupoRepository>;
  let mockDuplaRepository: ReturnType<typeof createMockDuplaRepository>;
  let mockConfrontoRepository: ReturnType<typeof createMockConfrontoRepository>;
  let etapaService: EtapaService;

  const TEST_ARENA_ID = TEST_IDS.arena;
  const TEST_ADMIN_ID = TEST_IDS.admin;
  const TEST_ETAPA_ID = TEST_IDS.etapa;

  beforeEach(() => {
    jest.clearAllMocks();

    mockEtapaRepository = createMockEtapaRepository();
    mockInscricaoRepository = createMockInscricaoRepository();
    mockJogadorRepository = createMockJogadorRepository();
    mockConfigRepository = createMockConfigRepository();
    mockCabecaDeChaveRepository = createMockCabecaDeChaveRepository();
    mockEstatisticasRepository = createMockEstatisticasRepository();
    mockGrupoRepository = createMockGrupoRepository();
    mockDuplaRepository = createMockDuplaRepository();
    mockConfrontoRepository = createMockConfrontoRepository();

    etapaService = new EtapaService(
      mockEtapaRepository,
      mockInscricaoRepository,
      mockJogadorRepository,
      mockConfigRepository,
      mockCabecaDeChaveRepository,
      mockEstatisticasRepository,
      mockGrupoRepository,
      mockDuplaRepository,
      mockConfrontoRepository
    );
  });

  describe("criar", () => {
    it("deve criar uma etapa com dados válidos", async () => {
      const dadosCriacao = createCriarEtapaDTO();
      const etapaCriada = createEtapaFixture({ id: TEST_ETAPA_ID });

      mockEtapaRepository.criar.mockResolvedValue(etapaCriada);

      const result = await etapaService.criar(
        TEST_ARENA_ID,
        TEST_ADMIN_ID,
        dadosCriacao
      );

      expect(mockEtapaRepository.criar).toHaveBeenCalledWith(
        expect.objectContaining({
          arenaId: TEST_ARENA_ID,
          criadoPor: TEST_ADMIN_ID,
          nome: dadosCriacao.nome,
          nivel: dadosCriacao.nivel,
          genero: dadosCriacao.genero,
          formato: dadosCriacao.formato,
        })
      );
      expect(result.id).toBe(TEST_ETAPA_ID);
    });

    it("deve lançar erro se data fim for anterior à data início", async () => {
      const dataInicio = new Date();
      dataInicio.setDate(dataInicio.getDate() + 14);

      const dataFim = new Date();
      dataFim.setDate(dataFim.getDate() + 7);

      const dadosInvalidos = createCriarEtapaDTO({
        dataInicio: dataInicio.toISOString(),
        dataFim: dataFim.toISOString(),
      });

      await expect(
        etapaService.criar(TEST_ARENA_ID, TEST_ADMIN_ID, dadosInvalidos)
      ).rejects.toThrow("Data fim deve ser posterior à data início");
    });

    it("deve lançar erro se maxJogadores for ímpar", async () => {
      const dadosInvalidos = createCriarEtapaDTO({
        maxJogadores: 15,
      });

      await expect(
        etapaService.criar(TEST_ARENA_ID, TEST_ADMIN_ID, dadosInvalidos)
      ).rejects.toThrow("Número de jogadores deve ser par");
    });
  });

  describe("buscarPorId", () => {
    it("deve retornar etapa quando encontrada", async () => {
      const etapa = createEtapaFixture({ id: TEST_ETAPA_ID });
      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);

      const result = await etapaService.buscarPorId(TEST_ETAPA_ID, TEST_ARENA_ID);

      expect(mockEtapaRepository.buscarPorIdEArena).toHaveBeenCalledWith(
        TEST_ETAPA_ID,
        TEST_ARENA_ID
      );
      expect(result).toEqual(etapa);
    });

    it("deve retornar null quando etapa não encontrada", async () => {
      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(null);

      const result = await etapaService.buscarPorId(
        "id-inexistente",
        TEST_ARENA_ID
      );

      expect(result).toBeNull();
    });
  });

  describe("inscreverJogador", () => {
    it("deve inscrever jogador com sucesso", async () => {
      const etapa = createEtapaFixture({
        id: TEST_ETAPA_ID,
        status: StatusEtapa.INSCRICOES_ABERTAS,
        totalInscritos: 0,
        maxJogadores: 16,
      });
      const jogador = createJogadorFixture({
        id: TEST_IDS.jogador1,
        nivel: NivelJogador.INTERMEDIARIO,
        genero: GeneroJogador.MASCULINO,
      });
      const inscricao = createInscricaoFixture();

      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);
      mockJogadorRepository.buscarPorIdEArena.mockResolvedValue(jogador);
      mockInscricaoRepository.jogadorInscrito.mockResolvedValue(false);
      mockInscricaoRepository.criar.mockResolvedValue(inscricao);
      mockEtapaRepository.incrementarInscritos.mockResolvedValue(undefined);

      const result = await etapaService.inscreverJogador(
        TEST_ETAPA_ID,
        TEST_ARENA_ID,
        { jogadorId: TEST_IDS.jogador1 }
      );

      expect(mockInscricaoRepository.criar).toHaveBeenCalled();
      expect(mockEtapaRepository.incrementarInscritos).toHaveBeenCalledWith(
        TEST_ETAPA_ID,
        TEST_IDS.jogador1
      );
      expect(result.id).toBe(inscricao.id);
    });

    it("deve lançar erro se etapa não encontrada", async () => {
      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(null);

      await expect(
        etapaService.inscreverJogador(TEST_ETAPA_ID, TEST_ARENA_ID, {
          jogadorId: TEST_IDS.jogador1,
        })
      ).rejects.toThrow("Etapa não encontrada");
    });

    it("deve lançar erro se inscrições não estão abertas", async () => {
      const etapa = createEtapaFixture({
        status: StatusEtapa.INSCRICOES_ENCERRADAS,
      });
      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);

      await expect(
        etapaService.inscreverJogador(TEST_ETAPA_ID, TEST_ARENA_ID, {
          jogadorId: TEST_IDS.jogador1,
        })
      ).rejects.toThrow("Inscrições não estão abertas para esta etapa");
    });

    it("deve lançar erro se etapa está lotada", async () => {
      const etapa = createEtapaFixture({
        status: StatusEtapa.INSCRICOES_ABERTAS,
        totalInscritos: 16,
        maxJogadores: 16,
      });
      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);

      await expect(
        etapaService.inscreverJogador(TEST_ETAPA_ID, TEST_ARENA_ID, {
          jogadorId: TEST_IDS.jogador1,
        })
      ).rejects.toThrow("Etapa atingiu o número máximo de jogadores");
    });

    it("deve lançar erro se jogador não encontrado", async () => {
      const etapa = createEtapaFixture({
        status: StatusEtapa.INSCRICOES_ABERTAS,
      });
      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);
      mockJogadorRepository.buscarPorIdEArena.mockResolvedValue(null);

      await expect(
        etapaService.inscreverJogador(TEST_ETAPA_ID, TEST_ARENA_ID, {
          jogadorId: "jogador-inexistente",
        })
      ).rejects.toThrow("Jogador não encontrado");
    });

    it("deve lançar erro se nível do jogador não corresponde", async () => {
      const etapa = createEtapaFixture({
        status: StatusEtapa.INSCRICOES_ABERTAS,
        nivel: NivelJogador.AVANCADO,
      });
      const jogador = createJogadorFixture({
        nivel: NivelJogador.INICIANTE,
      });

      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);
      mockJogadorRepository.buscarPorIdEArena.mockResolvedValue(jogador);

      await expect(
        etapaService.inscreverJogador(TEST_ETAPA_ID, TEST_ARENA_ID, {
          jogadorId: TEST_IDS.jogador1,
        })
      ).rejects.toThrow("Este jogador não pode se inscrever nesta etapa");
    });

    it("deve lançar erro se jogador já está inscrito", async () => {
      const etapa = createEtapaFixture({
        status: StatusEtapa.INSCRICOES_ABERTAS,
      });
      const jogador = createJogadorFixture();

      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);
      mockJogadorRepository.buscarPorIdEArena.mockResolvedValue(jogador);
      mockInscricaoRepository.jogadorInscrito.mockResolvedValue(true);

      await expect(
        etapaService.inscreverJogador(TEST_ETAPA_ID, TEST_ARENA_ID, {
          jogadorId: TEST_IDS.jogador1,
        })
      ).rejects.toThrow("Jogador já está inscrito nesta etapa");
    });
  });

  describe("cancelarInscricao", () => {
    it("deve cancelar inscrição com sucesso", async () => {
      const inscricao = createInscricaoFixture();
      const etapa = createEtapaFixture({ chavesGeradas: false });

      mockInscricaoRepository.buscarPorIdEtapaArena.mockResolvedValue(inscricao);
      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);
      mockInscricaoRepository.cancelar.mockResolvedValue(undefined);
      mockEtapaRepository.decrementarInscritos.mockResolvedValue(undefined);

      await etapaService.cancelarInscricao(
        inscricao.id,
        TEST_ETAPA_ID,
        TEST_ARENA_ID
      );

      expect(mockInscricaoRepository.cancelar).toHaveBeenCalledWith(inscricao.id);
      expect(mockEtapaRepository.decrementarInscritos).toHaveBeenCalledWith(
        TEST_ETAPA_ID,
        inscricao.jogadorId
      );
    });

    it("deve lançar erro se inscrição não encontrada", async () => {
      mockInscricaoRepository.buscarPorIdEtapaArena.mockResolvedValue(null);

      await expect(
        etapaService.cancelarInscricao(
          "inscricao-inexistente",
          TEST_ETAPA_ID,
          TEST_ARENA_ID
        )
      ).rejects.toThrow("Inscrição não encontrada");
    });

    it("deve lançar erro se chaves já foram geradas", async () => {
      const inscricao = createInscricaoFixture();
      const etapa = createEtapaFixture({ chavesGeradas: true });

      mockInscricaoRepository.buscarPorIdEtapaArena.mockResolvedValue(inscricao);
      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);

      await expect(
        etapaService.cancelarInscricao(inscricao.id, TEST_ETAPA_ID, TEST_ARENA_ID)
      ).rejects.toThrow("Não é possível cancelar inscrição após geração de chaves");
    });
  });

  describe("listar", () => {
    it("deve listar etapas com filtros", async () => {
      const etapas = [createEtapaFixture()];
      const expectedResponse = {
        etapas,
        total: 1,
        limite: 10,
        offset: 0,
        temMais: false,
      };

      mockEtapaRepository.listar.mockResolvedValue(expectedResponse);

      const result = await etapaService.listar({
        arenaId: TEST_ARENA_ID,
        status: StatusEtapa.INSCRICOES_ABERTAS,
      });

      expect(mockEtapaRepository.listar).toHaveBeenCalledWith({
        arenaId: TEST_ARENA_ID,
        status: StatusEtapa.INSCRICOES_ABERTAS,
      });
      expect(result.etapas).toHaveLength(1);
    });
  });

  describe("atualizar", () => {
    it("deve atualizar etapa existente", async () => {
      const etapaOriginal = createEtapaFixture({
        chavesGeradas: false,
        totalInscritos: 0,
      });
      const etapaAtualizada = createEtapaFixture({
        nome: "Etapa Atualizada",
      });

      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapaOriginal);
      mockEtapaRepository.atualizar.mockResolvedValue(etapaAtualizada);

      const result = await etapaService.atualizar(
        TEST_ETAPA_ID,
        TEST_ARENA_ID,
        { nome: "Etapa Atualizada" }
      );

      expect(mockEtapaRepository.atualizar).toHaveBeenCalled();
      expect(result.nome).toBe("Etapa Atualizada");
    });

    it("deve lançar erro ao atualizar etapa inexistente", async () => {
      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(null);

      await expect(
        etapaService.atualizar(TEST_ETAPA_ID, TEST_ARENA_ID, {
          nome: "Novo Nome",
        })
      ).rejects.toThrow("Etapa não encontrada");
    });

    it("deve lançar erro se chaves já foram geradas", async () => {
      const etapa = createEtapaFixture({ chavesGeradas: true });
      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);

      await expect(
        etapaService.atualizar(TEST_ETAPA_ID, TEST_ARENA_ID, {
          nome: "Novo Nome",
        })
      ).rejects.toThrow("Não é possível editar etapa após geração de chaves");
    });

    it("deve lançar erro ao alterar nível com inscritos", async () => {
      const etapa = createEtapaFixture({
        chavesGeradas: false,
        totalInscritos: 5,
        nivel: NivelJogador.INTERMEDIARIO,
      });
      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);

      await expect(
        etapaService.atualizar(TEST_ETAPA_ID, TEST_ARENA_ID, {
          nivel: NivelJogador.AVANCADO,
        })
      ).rejects.toThrow(
        "Não é possível alterar o nível da etapa após ter inscritos"
      );
    });
  });

  describe("deletar", () => {
    it("deve deletar etapa sem inscritos", async () => {
      const etapa = createEtapaFixture({
        totalInscritos: 0,
        chavesGeradas: false,
      });

      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);
      mockCabecaDeChaveRepository.deletarPorEtapa.mockResolvedValue(0);
      mockEtapaRepository.deletar.mockResolvedValue(undefined);

      await etapaService.deletar(TEST_ETAPA_ID, TEST_ARENA_ID);

      expect(mockEtapaRepository.deletar).toHaveBeenCalledWith(TEST_ETAPA_ID);
    });

    it("deve lançar erro ao deletar etapa inexistente", async () => {
      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(null);

      await expect(
        etapaService.deletar("id-inexistente", TEST_ARENA_ID)
      ).rejects.toThrow("Etapa não encontrada");
    });

    it("deve lançar erro ao deletar etapa com inscritos", async () => {
      const etapa = createEtapaFixture({ totalInscritos: 5 });
      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);

      await expect(
        etapaService.deletar(TEST_ETAPA_ID, TEST_ARENA_ID)
      ).rejects.toThrow("possui 5 jogador(es) inscrito(s)");
    });

    it("deve lançar erro ao deletar etapa com chaves geradas", async () => {
      const etapa = createEtapaFixture({
        totalInscritos: 0,
        chavesGeradas: true,
      });
      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);

      await expect(
        etapaService.deletar(TEST_ETAPA_ID, TEST_ARENA_ID)
      ).rejects.toThrow("Não é possível excluir etapa após geração de chaves");
    });
  });

  describe("encerrarInscricoes", () => {
    it("deve encerrar inscrições com sucesso", async () => {
      const etapa = createEtapaFixture({
        status: StatusEtapa.INSCRICOES_ABERTAS,
      });
      const etapaAtualizada = createEtapaFixture({
        status: StatusEtapa.INSCRICOES_ENCERRADAS,
      });

      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);
      mockEtapaRepository.atualizarStatus.mockResolvedValue(etapaAtualizada);

      const result = await etapaService.encerrarInscricoes(
        TEST_ETAPA_ID,
        TEST_ARENA_ID
      );

      expect(mockEtapaRepository.atualizarStatus).toHaveBeenCalledWith(
        TEST_ETAPA_ID,
        StatusEtapa.INSCRICOES_ENCERRADAS
      );
      expect(result.status).toBe(StatusEtapa.INSCRICOES_ENCERRADAS);
    });

    it("deve lançar erro se inscrições não estão abertas", async () => {
      const etapa = createEtapaFixture({
        status: StatusEtapa.INSCRICOES_ENCERRADAS,
      });
      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);

      await expect(
        etapaService.encerrarInscricoes(TEST_ETAPA_ID, TEST_ARENA_ID)
      ).rejects.toThrow("Etapa não está com inscrições abertas");
    });
  });

  describe("reabrirInscricoes", () => {
    it("deve reabrir inscrições com sucesso", async () => {
      const etapa = createEtapaFixture({
        status: StatusEtapa.INSCRICOES_ENCERRADAS,
        chavesGeradas: false,
      });
      const etapaAtualizada = createEtapaFixture({
        status: StatusEtapa.INSCRICOES_ABERTAS,
      });

      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);
      mockEtapaRepository.atualizarStatus.mockResolvedValue(etapaAtualizada);

      const result = await etapaService.reabrirInscricoes(
        TEST_ETAPA_ID,
        TEST_ARENA_ID
      );

      expect(mockEtapaRepository.atualizarStatus).toHaveBeenCalledWith(
        TEST_ETAPA_ID,
        StatusEtapa.INSCRICOES_ABERTAS
      );
      expect(result.status).toBe(StatusEtapa.INSCRICOES_ABERTAS);
    });

    it("deve lançar erro se inscrições não estão encerradas", async () => {
      const etapa = createEtapaFixture({
        status: StatusEtapa.INSCRICOES_ABERTAS,
      });
      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);

      await expect(
        etapaService.reabrirInscricoes(TEST_ETAPA_ID, TEST_ARENA_ID)
      ).rejects.toThrow("Etapa não está com inscrições encerradas");
    });

    it("deve lançar erro se chaves já foram geradas", async () => {
      const etapa = createEtapaFixture({
        status: StatusEtapa.INSCRICOES_ENCERRADAS,
        chavesGeradas: true,
      });
      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);

      await expect(
        etapaService.reabrirInscricoes(TEST_ETAPA_ID, TEST_ARENA_ID)
      ).rejects.toThrow("Não é possível reabrir inscrições após gerar chaves");
    });
  });

  describe("obterEstatisticas", () => {
    it("deve retornar estatísticas", async () => {
      const estatisticas = {
        totalEtapas: 10,
        inscricoesAbertas: 2,
        emAndamento: 1,
        finalizadas: 7,
        totalParticipacoes: 150,
      };

      mockEtapaRepository.obterEstatisticas.mockResolvedValue(estatisticas);

      const result = await etapaService.obterEstatisticas(TEST_ARENA_ID);

      expect(result).toEqual(estatisticas);
    });

    it("deve retornar zeros em caso de erro", async () => {
      mockEtapaRepository.obterEstatisticas.mockRejectedValue(
        new Error("Erro de conexão")
      );

      const result = await etapaService.obterEstatisticas(TEST_ARENA_ID);

      expect(result.totalEtapas).toBe(0);
      expect(result.inscricoesAbertas).toBe(0);
      expect(result.emAndamento).toBe(0);
      expect(result.finalizadas).toBe(0);
    });
  });

  describe("buscarInscricao", () => {
    it("deve retornar inscrição quando encontrada", async () => {
      const inscricao = createInscricaoFixture();
      mockInscricaoRepository.buscarPorIdEtapaArena.mockResolvedValue(inscricao);

      const result = await etapaService.buscarInscricao(
        TEST_ETAPA_ID,
        TEST_ARENA_ID,
        inscricao.id
      );

      expect(result).toEqual(inscricao);
    });

    it("deve retornar null quando inscrição não encontrada", async () => {
      mockInscricaoRepository.buscarPorIdEtapaArena.mockResolvedValue(null);

      const result = await etapaService.buscarInscricao(
        TEST_ETAPA_ID,
        TEST_ARENA_ID,
        "inscricao-inexistente"
      );

      expect(result).toBeNull();
    });
  });

  describe("listarInscricoes", () => {
    it("deve listar inscrições confirmadas", async () => {
      const inscricoes = [createInscricaoFixture()];
      mockInscricaoRepository.buscarConfirmadas.mockResolvedValue(inscricoes);

      const result = await etapaService.listarInscricoes(TEST_ETAPA_ID, TEST_ARENA_ID);

      expect(mockInscricaoRepository.buscarConfirmadas).toHaveBeenCalledWith(
        TEST_ETAPA_ID,
        TEST_ARENA_ID
      );
      expect(result).toHaveLength(1);
    });
  });

  describe("criar - validações adicionais", () => {
    it("deve lançar erro se data de realização não for posterior ao fim das inscrições", async () => {
      const dataInicio = new Date();
      dataInicio.setDate(dataInicio.getDate() + 1);

      const dataFim = new Date();
      dataFim.setDate(dataFim.getDate() + 10);

      const dataRealizacao = new Date();
      dataRealizacao.setDate(dataRealizacao.getDate() + 5); // Antes do dataFim

      const dadosInvalidos = createCriarEtapaDTO({
        dataInicio: dataInicio.toISOString(),
        dataFim: dataFim.toISOString(),
        dataRealizacao: dataRealizacao.toISOString(),
      });

      await expect(
        etapaService.criar(TEST_ARENA_ID, TEST_ADMIN_ID, dadosInvalidos)
      ).rejects.toThrow("Data de realização deve ser posterior ao fim das inscrições");
    });
  });

  describe("atualizar - validações adicionais", () => {
    it("deve lançar erro ao alterar gênero com inscritos", async () => {
      const etapa = createEtapaFixture({
        chavesGeradas: false,
        totalInscritos: 5,
        genero: GeneroJogador.MASCULINO,
      });
      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);

      await expect(
        etapaService.atualizar(TEST_ETAPA_ID, TEST_ARENA_ID, {
          genero: GeneroJogador.FEMININO,
        })
      ).rejects.toThrow(
        "Não é possível alterar o gênero da etapa após ter inscritos"
      );
    });

    it("deve lançar erro ao diminuir maxJogadores abaixo dos inscritos", async () => {
      const etapa = createEtapaFixture({
        chavesGeradas: false,
        totalInscritos: 12,
        maxJogadores: 16,
      });
      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);

      await expect(
        etapaService.atualizar(TEST_ETAPA_ID, TEST_ARENA_ID, {
          maxJogadores: 8,
        })
      ).rejects.toThrow("Não é possível diminuir o máximo de jogadores para 8");
    });

    it("deve recalcular grupos ao alterar maxJogadores", async () => {
      const etapa = createEtapaFixture({
        chavesGeradas: false,
        totalInscritos: 0,
        maxJogadores: 16,
      });
      const etapaAtualizada = createEtapaFixture({
        maxJogadores: 32,
      });

      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);
      mockEtapaRepository.atualizar.mockResolvedValue(etapaAtualizada);

      await etapaService.atualizar(TEST_ETAPA_ID, TEST_ARENA_ID, {
        maxJogadores: 32,
      });

      expect(mockEtapaRepository.atualizar).toHaveBeenCalledWith(
        TEST_ETAPA_ID,
        expect.objectContaining({
          maxJogadores: 32,
        })
      );
    });

    it("deve converter datas ao atualizar", async () => {
      const etapa = createEtapaFixture({
        chavesGeradas: false,
        totalInscritos: 0,
      });
      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);
      mockEtapaRepository.atualizar.mockResolvedValue(etapa);

      const novaDataInicio = new Date();
      novaDataInicio.setDate(novaDataInicio.getDate() + 5);

      await etapaService.atualizar(TEST_ETAPA_ID, TEST_ARENA_ID, {
        dataInicio: novaDataInicio.toISOString(),
      });

      expect(mockEtapaRepository.atualizar).toHaveBeenCalled();
    });
  });

  describe("deletar - erro genérico", () => {
    it("deve lançar erro genérico em falha inesperada", async () => {
      const etapa = createEtapaFixture({
        totalInscritos: 0,
        chavesGeradas: false,
      });
      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);
      mockCabecaDeChaveRepository.deletarPorEtapa.mockResolvedValue(0);
      mockEtapaRepository.deletar.mockRejectedValue(new Error("Erro de conexão"));

      await expect(
        etapaService.deletar(TEST_ETAPA_ID, TEST_ARENA_ID)
      ).rejects.toThrow("Falha ao deletar etapa");
    });
  });

  describe("inscreverJogador - validação de gênero", () => {
    it("deve lançar erro se gênero do jogador não corresponde", async () => {
      const etapa = createEtapaFixture({
        status: StatusEtapa.INSCRICOES_ABERTAS,
        genero: GeneroJogador.FEMININO,
      });
      const jogador = createJogadorFixture({
        genero: GeneroJogador.MASCULINO,
        nivel: NivelJogador.INTERMEDIARIO,
      });

      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);
      mockJogadorRepository.buscarPorIdEArena.mockResolvedValue(jogador);

      await expect(
        etapaService.inscreverJogador(TEST_ETAPA_ID, TEST_ARENA_ID, {
          jogadorId: TEST_IDS.jogador1,
        })
      ).rejects.toThrow("Este jogador não pode se inscrever nesta etapa");
    });
  });

  describe("cancelarInscricao - etapa não encontrada", () => {
    it("deve lançar erro se etapa não encontrada", async () => {
      const inscricao = createInscricaoFixture();
      mockInscricaoRepository.buscarPorIdEtapaArena.mockResolvedValue(inscricao);
      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(null);

      await expect(
        etapaService.cancelarInscricao(inscricao.id, TEST_ETAPA_ID, TEST_ARENA_ID)
      ).rejects.toThrow("Etapa não encontrada");
    });
  });

  describe("encerrarEtapa", () => {
    it("deve lançar erro se etapa não encontrada", async () => {
      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(null);

      await expect(
        etapaService.encerrarEtapa(TEST_ETAPA_ID, TEST_ARENA_ID)
      ).rejects.toThrow("Etapa não encontrada");
    });

    it("deve lançar erro se etapa já está finalizada", async () => {
      const etapa = createEtapaFixture({
        status: StatusEtapa.FINALIZADA,
      });
      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);

      await expect(
        etapaService.encerrarEtapa(TEST_ETAPA_ID, TEST_ARENA_ID)
      ).rejects.toThrow("Etapa já está finalizada");
    });

    it("deve lançar erro se não há grupos", async () => {
      const etapa = createEtapaFixture({
        status: StatusEtapa.EM_ANDAMENTO,
      });
      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);
      mockConfigRepository.buscarPontuacao.mockResolvedValue({
        campeao: 100,
        vice: 70,
        semifinalista: 50,
        quartas: 30,
        oitavas: 20,
        participacao: 10,
      });
      mockGrupoRepository.buscarPorEtapa.mockResolvedValue([]);

      await expect(
        etapaService.encerrarEtapa(TEST_ETAPA_ID, TEST_ARENA_ID)
      ).rejects.toThrow("Nenhum grupo encontrado para esta etapa");
    });

    describe("cenário grupo único", () => {
      it("deve encerrar etapa com grupo único completo", async () => {
        const etapa = createEtapaFixture({
          status: StatusEtapa.EM_ANDAMENTO,
        });
        const grupo = createGrupoFixture({
          completo: true,
        });
        const duplas = [
          createDuplaFixture({ id: "dupla-1", jogador1Id: "j1", jogador2Id: "j2", posicaoGrupo: 1 }),
          createDuplaFixture({ id: "dupla-2", jogador1Id: "j3", jogador2Id: "j4", posicaoGrupo: 2 }),
        ];

        mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);
        mockConfigRepository.buscarPontuacao.mockResolvedValue({
          campeao: 100,
          vice: 70,
          semifinalista: 50,
          quartas: 30,
          oitavas: 20,
          participacao: 10,
        });
        mockGrupoRepository.buscarPorEtapa.mockResolvedValue([grupo]);
        mockDuplaRepository.buscarPorGrupoOrdenado.mockResolvedValue(duplas);
        mockDuplaRepository.buscarPorId.mockImplementation((id: string) =>
          Promise.resolve(duplas.find(d => d.id === id) || null)
        );
        mockEstatisticasRepository.buscarPorJogadorEEtapa.mockResolvedValue(
          createEstatisticasJogadorFixture()
        );
        mockEstatisticasRepository.atualizarPontuacao.mockResolvedValue(undefined);
        mockEtapaRepository.definirCampeao.mockResolvedValue(undefined);

        await etapaService.encerrarEtapa(TEST_ETAPA_ID, TEST_ARENA_ID);

        expect(mockEtapaRepository.definirCampeao).toHaveBeenCalled();
      });

      it("deve lançar erro se grupo único não está completo", async () => {
        const etapa = createEtapaFixture({
          status: StatusEtapa.EM_ANDAMENTO,
        });
        const grupo = createGrupoFixture({
          completo: false,
        });

        mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);
        mockConfigRepository.buscarPontuacao.mockResolvedValue({
          campeao: 100,
          vice: 70,
          semifinalista: 50,
          quartas: 30,
          oitavas: 20,
          participacao: 10,
        });
        mockGrupoRepository.buscarPorEtapa.mockResolvedValue([grupo]);

        await expect(
          etapaService.encerrarEtapa(TEST_ETAPA_ID, TEST_ARENA_ID)
        ).rejects.toThrow("O grupo ainda possui partidas pendentes");
      });

      it("deve lançar erro se não há duplas no grupo único", async () => {
        const etapa = createEtapaFixture({
          status: StatusEtapa.EM_ANDAMENTO,
        });
        const grupo = createGrupoFixture({
          completo: true,
        });

        mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);
        mockConfigRepository.buscarPontuacao.mockResolvedValue({
          campeao: 100,
          vice: 70,
          semifinalista: 50,
          quartas: 30,
          oitavas: 20,
          participacao: 10,
        });
        mockGrupoRepository.buscarPorEtapa.mockResolvedValue([grupo]);
        mockDuplaRepository.buscarPorGrupoOrdenado.mockResolvedValue([]);

        await expect(
          etapaService.encerrarEtapa(TEST_ETAPA_ID, TEST_ARENA_ID)
        ).rejects.toThrow("Nenhuma dupla encontrada no grupo");
      });
    });

    describe("cenário com eliminatória", () => {
      it("deve lançar erro se não há fase eliminatória", async () => {
        const etapa = createEtapaFixture({
          status: StatusEtapa.EM_ANDAMENTO,
        });
        const grupos = [
          createGrupoFixture({ id: "g1" }),
          createGrupoFixture({ id: "g2" }),
        ];

        mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);
        mockConfigRepository.buscarPontuacao.mockResolvedValue({
          campeao: 100,
          vice: 70,
          semifinalista: 50,
          quartas: 30,
          oitavas: 20,
          participacao: 10,
        });
        mockGrupoRepository.buscarPorEtapa.mockResolvedValue(grupos);
        mockConfrontoRepository.buscarPorFase.mockResolvedValue([]);

        await expect(
          etapaService.encerrarEtapa(TEST_ETAPA_ID, TEST_ARENA_ID)
        ).rejects.toThrow("Não há fase eliminatória para esta etapa");
      });

      it("deve lançar erro se a final não está finalizada", async () => {
        const etapa = createEtapaFixture({
          status: StatusEtapa.EM_ANDAMENTO,
        });
        const grupos = [
          createGrupoFixture({ id: "g1" }),
          createGrupoFixture({ id: "g2" }),
        ];
        const confrontoFinal = createConfrontoFixture({
          fase: TipoFase.FINAL,
          status: "agendada" as any,
        });

        mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);
        mockConfigRepository.buscarPontuacao.mockResolvedValue({
          campeao: 100,
          vice: 70,
          semifinalista: 50,
          quartas: 30,
          oitavas: 20,
          participacao: 10,
        });
        mockGrupoRepository.buscarPorEtapa.mockResolvedValue(grupos);
        mockConfrontoRepository.buscarPorFase.mockResolvedValue([confrontoFinal]);

        await expect(
          etapaService.encerrarEtapa(TEST_ETAPA_ID, TEST_ARENA_ID)
        ).rejects.toThrow("A final ainda não foi finalizada");
      });

      it("deve encerrar etapa com eliminatória completa", async () => {
        const etapa = createEtapaFixture({
          status: StatusEtapa.EM_ANDAMENTO,
        });
        const grupos = [
          createGrupoFixture({ id: "g1" }),
          createGrupoFixture({ id: "g2" }),
        ];
        const confrontoFinal = createConfrontoFixture({
          fase: TipoFase.FINAL,
          status: "finalizada" as any,
          vencedoraId: "dupla-campeao",
          vencedoraNome: "Dupla Campeã",
          dupla1Id: "dupla-campeao",
          dupla2Id: "dupla-vice",
        });
        const confrontosSemi = [
          createConfrontoFixture({
            fase: TipoFase.SEMIFINAL,
            status: "finalizada" as any,
            vencedoraId: "dupla-campeao",
            dupla1Id: "dupla-campeao",
            dupla2Id: "dupla-semi1",
          }),
          createConfrontoFixture({
            fase: TipoFase.SEMIFINAL,
            status: "finalizada" as any,
            vencedoraId: "dupla-vice",
            dupla1Id: "dupla-vice",
            dupla2Id: "dupla-semi2",
          }),
        ];
        const duplasNaoClassificadas = [
          createDuplaFixture({ id: "dupla-nc1", classificada: false }),
        ];

        mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);
        mockConfigRepository.buscarPontuacao.mockResolvedValue({
          campeao: 100,
          vice: 70,
          semifinalista: 50,
          quartas: 30,
          oitavas: 20,
          participacao: 10,
        });
        mockGrupoRepository.buscarPorEtapa.mockResolvedValue(grupos);
        mockConfrontoRepository.buscarPorFase.mockResolvedValue([confrontoFinal]);
        mockConfrontoRepository.buscarFinalizadosPorFase
          .mockResolvedValueOnce(confrontosSemi) // semifinal
          .mockResolvedValueOnce([]) // quartas
          .mockResolvedValueOnce([]); // oitavas
        mockDuplaRepository.buscarPorEtapa.mockResolvedValue(duplasNaoClassificadas);
        mockDuplaRepository.buscarPorId.mockImplementation((id: string) =>
          Promise.resolve(createDuplaFixture({ id, jogador1Id: `j1-${id}`, jogador2Id: `j2-${id}` }))
        );
        mockEstatisticasRepository.buscarPorJogadorEEtapa.mockResolvedValue(
          createEstatisticasJogadorFixture()
        );
        mockEstatisticasRepository.atualizarPontuacao.mockResolvedValue(undefined);
        mockEtapaRepository.definirCampeao.mockResolvedValue(undefined);

        await etapaService.encerrarEtapa(TEST_ETAPA_ID, TEST_ARENA_ID);

        expect(mockEtapaRepository.definirCampeao).toHaveBeenCalledWith(
          TEST_ETAPA_ID,
          "dupla-campeao",
          "Dupla Campeã"
        );
      });

      it("deve atribuir pontos para quartas e oitavas", async () => {
        const etapa = createEtapaFixture({
          status: StatusEtapa.EM_ANDAMENTO,
        });
        const grupos = [
          createGrupoFixture({ id: "g1" }),
          createGrupoFixture({ id: "g2" }),
        ];
        const confrontoFinal = createConfrontoFixture({
          fase: TipoFase.FINAL,
          status: "finalizada" as any,
          vencedoraId: "dupla-campeao",
          vencedoraNome: "Dupla Campeã",
          dupla1Id: "dupla-campeao",
          dupla2Id: "dupla-vice",
        });
        const confrontosQuartas = [
          createConfrontoFixture({
            fase: TipoFase.QUARTAS,
            status: "finalizada" as any,
            vencedoraId: "dupla-q1",
            dupla1Id: "dupla-q1",
            dupla2Id: "dupla-q1-perdedor",
          }),
        ];
        const confrontosOitavas = [
          createConfrontoFixture({
            fase: TipoFase.OITAVAS,
            status: "finalizada" as any,
            vencedoraId: "dupla-o1",
            dupla1Id: "dupla-o1",
            dupla2Id: "dupla-o1-perdedor",
          }),
        ];

        mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);
        mockConfigRepository.buscarPontuacao.mockResolvedValue({
          campeao: 100,
          vice: 70,
          semifinalista: 50,
          quartas: 30,
          oitavas: 20,
          participacao: 10,
        });
        mockGrupoRepository.buscarPorEtapa.mockResolvedValue(grupos);
        mockConfrontoRepository.buscarPorFase.mockResolvedValue([confrontoFinal]);
        mockConfrontoRepository.buscarFinalizadosPorFase
          .mockResolvedValueOnce([]) // semifinal
          .mockResolvedValueOnce(confrontosQuartas) // quartas
          .mockResolvedValueOnce(confrontosOitavas); // oitavas
        mockDuplaRepository.buscarPorEtapa.mockResolvedValue([]);
        mockDuplaRepository.buscarPorId.mockImplementation((id: string) =>
          Promise.resolve(createDuplaFixture({ id, jogador1Id: `j1-${id}`, jogador2Id: `j2-${id}` }))
        );
        mockEstatisticasRepository.buscarPorJogadorEEtapa.mockResolvedValue(
          createEstatisticasJogadorFixture()
        );
        mockEstatisticasRepository.atualizarPontuacao.mockResolvedValue(undefined);
        mockEtapaRepository.definirCampeao.mockResolvedValue(undefined);

        await etapaService.encerrarEtapa(TEST_ETAPA_ID, TEST_ARENA_ID);

        // Verificar que buscarFinalizadosPorFase foi chamado para quartas e oitavas
        expect(mockConfrontoRepository.buscarFinalizadosPorFase).toHaveBeenCalledWith(
          TEST_ETAPA_ID,
          TEST_ARENA_ID,
          TipoFase.QUARTAS
        );
        expect(mockConfrontoRepository.buscarFinalizadosPorFase).toHaveBeenCalledWith(
          TEST_ETAPA_ID,
          TEST_ARENA_ID,
          TipoFase.OITAVAS
        );
      });
    });

    describe("atribuição de pontos", () => {
      it("deve lidar com dupla não encontrada ao atribuir pontos", async () => {
        const etapa = createEtapaFixture({
          status: StatusEtapa.EM_ANDAMENTO,
        });
        const grupo = createGrupoFixture({
          completo: true,
        });
        const duplas = [
          createDuplaFixture({ id: "dupla-1" }),
        ];

        mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);
        mockConfigRepository.buscarPontuacao.mockResolvedValue({
          campeao: 100,
          vice: 70,
          semifinalista: 50,
          quartas: 30,
          oitavas: 20,
          participacao: 10,
        });
        mockGrupoRepository.buscarPorEtapa.mockResolvedValue([grupo]);
        mockDuplaRepository.buscarPorGrupoOrdenado.mockResolvedValue(duplas);
        mockDuplaRepository.buscarPorId.mockResolvedValue(null); // Dupla não encontrada
        mockEtapaRepository.definirCampeao.mockResolvedValue(undefined);

        // Não deve lançar erro, apenas logar warning
        await etapaService.encerrarEtapa(TEST_ETAPA_ID, TEST_ARENA_ID);

        expect(mockEtapaRepository.definirCampeao).toHaveBeenCalled();
      });

      it("deve lidar com estatísticas não encontradas ao atribuir pontos", async () => {
        const etapa = createEtapaFixture({
          status: StatusEtapa.EM_ANDAMENTO,
        });
        const grupo = createGrupoFixture({
          completo: true,
        });
        const duplas = [
          createDuplaFixture({ id: "dupla-1", jogador1Id: "j1", jogador2Id: "j2" }),
        ];

        mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);
        mockConfigRepository.buscarPontuacao.mockResolvedValue({
          campeao: 100,
          vice: 70,
          semifinalista: 50,
          quartas: 30,
          oitavas: 20,
          participacao: 10,
        });
        mockGrupoRepository.buscarPorEtapa.mockResolvedValue([grupo]);
        mockDuplaRepository.buscarPorGrupoOrdenado.mockResolvedValue(duplas);
        mockDuplaRepository.buscarPorId.mockResolvedValue(duplas[0]);
        mockEstatisticasRepository.buscarPorJogadorEEtapa.mockResolvedValue(null);
        mockEtapaRepository.definirCampeao.mockResolvedValue(undefined);

        // Não deve lançar erro, apenas logar warning
        await etapaService.encerrarEtapa(TEST_ETAPA_ID, TEST_ARENA_ID);

        expect(mockEtapaRepository.definirCampeao).toHaveBeenCalled();
      });
    });
  });

  describe("encerrarInscricoes - etapa não encontrada", () => {
    it("deve lançar erro se etapa não encontrada", async () => {
      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(null);

      await expect(
        etapaService.encerrarInscricoes(TEST_ETAPA_ID, TEST_ARENA_ID)
      ).rejects.toThrow("Etapa não encontrada");
    });
  });

  describe("reabrirInscricoes - etapa não encontrada", () => {
    it("deve lançar erro se etapa não encontrada", async () => {
      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(null);

      await expect(
        etapaService.reabrirInscricoes(TEST_ETAPA_ID, TEST_ARENA_ID)
      ).rejects.toThrow("Etapa não encontrada");
    });
  });
});
