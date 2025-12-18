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

const mockUpdate = jest.fn().mockResolvedValue(undefined);
const mockDoc = jest.fn(() => ({ update: mockUpdate }));
const mockCollection = jest.fn(() => ({ doc: mockDoc }));

jest.mock("../../config/firebase", () => ({
  db: { collection: mockCollection },
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
// Mock do CabecaDeChaveService
const mockCabecaDeChaveService = {
  deletarPorEtapa: jest.fn().mockResolvedValue(0),
};
jest.mock("../../services/CabecaDeChaveService", () => ({
  __esModule: true,
  default: mockCabecaDeChaveService,
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
  createMockEstatisticasRepository,
  createMockGrupoRepository,
  createMockDuplaRepository,
  createMockConfrontoRepository,
  createMockEquipeRepository,
  createMockConfrontoEquipeRepository,
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
import { FormatoEtapa } from "../../models/Etapa";
import { StatusConfronto } from "../../models/Teams";

describe("EtapaService", () => {
  let mockEtapaRepository: ReturnType<typeof createMockEtapaRepository>;
  let mockInscricaoRepository: ReturnType<typeof createMockInscricaoRepository>;
  let mockJogadorRepository: ReturnType<typeof createMockJogadorRepository>;
  let mockConfigRepository: ReturnType<typeof createMockConfigRepository>;
  let mockEstatisticasRepository: ReturnType<typeof createMockEstatisticasRepository>;
  let mockGrupoRepository: ReturnType<typeof createMockGrupoRepository>;
  let mockDuplaRepository: ReturnType<typeof createMockDuplaRepository>;
  let mockConfrontoRepository: ReturnType<typeof createMockConfrontoRepository>;
  let mockEquipeRepository: ReturnType<typeof createMockEquipeRepository>;
  let mockConfrontoEquipeRepository: ReturnType<typeof createMockConfrontoEquipeRepository>;
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
    mockEstatisticasRepository = createMockEstatisticasRepository();
    mockGrupoRepository = createMockGrupoRepository();
    mockDuplaRepository = createMockDuplaRepository();
    mockConfrontoRepository = createMockConfrontoRepository();
    mockEquipeRepository = createMockEquipeRepository();
    mockConfrontoEquipeRepository = createMockConfrontoEquipeRepository();

    etapaService = new EtapaService(
      mockEtapaRepository,
      mockInscricaoRepository,
      mockJogadorRepository,
      mockConfigRepository,
      mockEstatisticasRepository,
      mockGrupoRepository,
      mockDuplaRepository,
      mockConfrontoRepository,
      mockEquipeRepository,
      mockConfrontoEquipeRepository
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
      mockCabecaDeChaveService.deletarPorEtapa.mockResolvedValue(0);
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
      mockCabecaDeChaveService.deletarPorEtapa.mockResolvedValue(0);
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
        mockEstatisticasRepository.buscarPorJogadorEEtapa.mockResolvedValue(null);
        mockEstatisticasRepository.atualizarPontuacaoEmLote.mockResolvedValue(undefined);
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

  describe("inscreverJogador - TEAMS misto", () => {
    it("deve lançar erro se limite de masculinos atingido em TEAMS misto", async () => {
      const etapa = createEtapaFixture({
        status: StatusEtapa.INSCRICOES_ABERTAS,
        formato: FormatoEtapa.TEAMS,
        genero: GeneroJogador.MISTO,
        maxJogadores: 8, // 4 de cada gênero
        totalInscritos: 4,
      });
      const jogador = createJogadorFixture({
        genero: GeneroJogador.MASCULINO,
        nivel: NivelJogador.INTERMEDIARIO,
      });

      // 4 masculinos já inscritos
      const inscricoesExistentes = Array.from({ length: 4 }, (_, i) =>
        createInscricaoFixture({
          id: `inscricao-${i}`,
          jogadorId: `jogador-${i}`,
          jogadorGenero: GeneroJogador.MASCULINO,
        })
      );

      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);
      mockJogadorRepository.buscarPorIdEArena.mockResolvedValue(jogador);
      mockInscricaoRepository.jogadorInscrito.mockResolvedValue(false);
      mockInscricaoRepository.buscarConfirmadas.mockResolvedValue(inscricoesExistentes);

      await expect(
        etapaService.inscreverJogador(TEST_ETAPA_ID, TEST_ARENA_ID, {
          jogadorId: TEST_IDS.jogador1,
        })
      ).rejects.toThrow("Limite de jogadores masculinos atingido");
    });

    it("deve lançar erro se limite de femininas atingido em TEAMS misto", async () => {
      const etapa = createEtapaFixture({
        status: StatusEtapa.INSCRICOES_ABERTAS,
        formato: FormatoEtapa.TEAMS,
        genero: GeneroJogador.MISTO,
        maxJogadores: 8, // 4 de cada gênero
        totalInscritos: 4,
      });
      const jogador = createJogadorFixture({
        genero: GeneroJogador.FEMININO,
        nivel: NivelJogador.INTERMEDIARIO,
      });

      // 4 femininas já inscritas
      const inscricoesExistentes = Array.from({ length: 4 }, (_, i) =>
        createInscricaoFixture({
          id: `inscricao-${i}`,
          jogadorId: `jogador-${i}`,
          jogadorGenero: GeneroJogador.FEMININO,
        })
      );

      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);
      mockJogadorRepository.buscarPorIdEArena.mockResolvedValue(jogador);
      mockInscricaoRepository.jogadorInscrito.mockResolvedValue(false);
      mockInscricaoRepository.buscarConfirmadas.mockResolvedValue(inscricoesExistentes);

      await expect(
        etapaService.inscreverJogador(TEST_ETAPA_ID, TEST_ARENA_ID, {
          jogadorId: TEST_IDS.jogador1,
        })
      ).rejects.toThrow("Limite de jogadoras femininas atingido");
    });
  });

  describe("inscreverJogadoresEmLote", () => {
    it("deve inscrever múltiplos jogadores com sucesso", async () => {
      const etapa = createEtapaFixture({
        status: StatusEtapa.INSCRICOES_ABERTAS,
        totalInscritos: 0,
        maxJogadores: 16,
      });

      const jogador1 = createJogadorFixture({ id: "j1", nome: "Jogador 1" });
      const jogador2 = createJogadorFixture({ id: "j2", nome: "Jogador 2" });
      const inscricoes = [
        createInscricaoFixture({ id: "i1", jogadorId: "j1" }),
        createInscricaoFixture({ id: "i2", jogadorId: "j2" }),
      ];

      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);
      mockInscricaoRepository.buscarConfirmadas.mockResolvedValue([]);
      mockJogadorRepository.buscarPorIdEArena
        .mockResolvedValueOnce(jogador1)
        .mockResolvedValueOnce(jogador2);
      mockInscricaoRepository.criarEmLote.mockResolvedValue(inscricoes);

      const result = await etapaService.inscreverJogadoresEmLote(
        TEST_ETAPA_ID,
        TEST_ARENA_ID,
        ["j1", "j2"]
      );

      expect(result.inscricoes).toHaveLength(2);
      expect(result.erros).toHaveLength(0);
    });

    it("deve retornar erros para jogadores não encontrados", async () => {
      const etapa = createEtapaFixture({
        status: StatusEtapa.INSCRICOES_ABERTAS,
        totalInscritos: 0,
        maxJogadores: 16,
      });

      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);
      mockInscricaoRepository.buscarConfirmadas.mockResolvedValue([]);
      mockJogadorRepository.buscarPorIdEArena.mockResolvedValue(null);

      const result = await etapaService.inscreverJogadoresEmLote(
        TEST_ETAPA_ID,
        TEST_ARENA_ID,
        ["j-inexistente"]
      );

      expect(result.inscricoes).toHaveLength(0);
      expect(result.erros).toHaveLength(1);
      expect(result.erros[0].erro).toBe("Jogador não encontrado");
    });

    it("deve lançar erro se etapa não encontrada", async () => {
      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(null);

      await expect(
        etapaService.inscreverJogadoresEmLote(TEST_ETAPA_ID, TEST_ARENA_ID, ["j1"])
      ).rejects.toThrow("Etapa não encontrada");
    });

    it("deve lançar erro se inscrições não estão abertas", async () => {
      const etapa = createEtapaFixture({
        status: StatusEtapa.INSCRICOES_ENCERRADAS,
      });
      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);

      await expect(
        etapaService.inscreverJogadoresEmLote(TEST_ETAPA_ID, TEST_ARENA_ID, ["j1"])
      ).rejects.toThrow("Inscrições não estão abertas para esta etapa");
    });

    it("deve lançar erro se não há vagas suficientes", async () => {
      const etapa = createEtapaFixture({
        status: StatusEtapa.INSCRICOES_ABERTAS,
        totalInscritos: 15,
        maxJogadores: 16,
      });
      const inscricoesExistentes = Array.from({ length: 15 }, (_, i) =>
        createInscricaoFixture({ id: `i${i}`, jogadorId: `j${i}` })
      );

      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);
      mockInscricaoRepository.buscarConfirmadas.mockResolvedValue(inscricoesExistentes);

      await expect(
        etapaService.inscreverJogadoresEmLote(TEST_ETAPA_ID, TEST_ARENA_ID, ["j1", "j2"])
      ).rejects.toThrow("Apenas 1 vagas disponíveis");
    });

    it("deve retornar erro para jogador já inscrito", async () => {
      const etapa = createEtapaFixture({
        status: StatusEtapa.INSCRICOES_ABERTAS,
        totalInscritos: 1,
        maxJogadores: 16,
      });

      const jogador = createJogadorFixture({ id: "j1" });
      const inscricoesExistentes = [createInscricaoFixture({ jogadorId: "j1" })];

      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);
      mockInscricaoRepository.buscarConfirmadas.mockResolvedValue(inscricoesExistentes);
      mockJogadorRepository.buscarPorIdEArena.mockResolvedValue(jogador);

      const result = await etapaService.inscreverJogadoresEmLote(
        TEST_ETAPA_ID,
        TEST_ARENA_ID,
        ["j1"]
      );

      expect(result.erros).toHaveLength(1);
      expect(result.erros[0].erro).toBe("Jogador já está inscrito");
    });

    it("deve retornar erro para nível incompatível", async () => {
      const etapa = createEtapaFixture({
        status: StatusEtapa.INSCRICOES_ABERTAS,
        nivel: NivelJogador.AVANCADO,
      });
      const jogador = createJogadorFixture({
        id: "j1",
        nivel: NivelJogador.INICIANTE,
      });

      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);
      mockInscricaoRepository.buscarConfirmadas.mockResolvedValue([]);
      mockJogadorRepository.buscarPorIdEArena.mockResolvedValue(jogador);

      const result = await etapaService.inscreverJogadoresEmLote(
        TEST_ETAPA_ID,
        TEST_ARENA_ID,
        ["j1"]
      );

      expect(result.erros).toHaveLength(1);
      expect(result.erros[0].erro).toContain("Nível incompatível");
    });

    it("deve retornar erro para gênero incompatível", async () => {
      const etapa = createEtapaFixture({
        status: StatusEtapa.INSCRICOES_ABERTAS,
        genero: GeneroJogador.FEMININO,
      });
      const jogador = createJogadorFixture({
        id: "j1",
        genero: GeneroJogador.MASCULINO,
      });

      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);
      mockInscricaoRepository.buscarConfirmadas.mockResolvedValue([]);
      mockJogadorRepository.buscarPorIdEArena.mockResolvedValue(jogador);

      const result = await etapaService.inscreverJogadoresEmLote(
        TEST_ETAPA_ID,
        TEST_ARENA_ID,
        ["j1"]
      );

      expect(result.erros).toHaveLength(1);
      expect(result.erros[0].erro).toContain("Gênero incompatível");
    });

    it("deve verificar proporção de gênero em TEAMS misto", async () => {
      const etapa = createEtapaFixture({
        status: StatusEtapa.INSCRICOES_ABERTAS,
        formato: FormatoEtapa.TEAMS,
        genero: GeneroJogador.MISTO,
        maxJogadores: 8, // 4 masc + 4 fem
      });

      // 4 masculinos já inscritos
      const inscricoesExistentes = Array.from({ length: 4 }, (_, i) =>
        createInscricaoFixture({
          jogadorId: `j-masc-${i}`,
          jogadorGenero: GeneroJogador.MASCULINO,
        })
      );

      const jogadorMasc = createJogadorFixture({
        id: "j-novo-masc",
        genero: GeneroJogador.MASCULINO,
      });

      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);
      mockInscricaoRepository.buscarConfirmadas.mockResolvedValue(inscricoesExistentes);
      mockJogadorRepository.buscarPorIdEArena.mockResolvedValue(jogadorMasc);

      const result = await etapaService.inscreverJogadoresEmLote(
        TEST_ETAPA_ID,
        TEST_ARENA_ID,
        ["j-novo-masc"]
      );

      expect(result.erros).toHaveLength(1);
      expect(result.erros[0].erro).toContain("Limite de jogadores masculinos");
    });
  });

  describe("cancelarInscricoesEmLote", () => {
    it("deve cancelar múltiplas inscrições com sucesso", async () => {
      const etapa = createEtapaFixture({ chavesGeradas: false });
      const inscricoes = [
        createInscricaoFixture({ id: "i1", jogadorId: "j1" }),
        createInscricaoFixture({ id: "i2", jogadorId: "j2" }),
      ];

      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);
      mockInscricaoRepository.buscarPorIds.mockResolvedValue(inscricoes);
      mockInscricaoRepository.cancelarEmLote.mockResolvedValue(undefined);
      mockEtapaRepository.decrementarInscritosEmLote.mockResolvedValue(undefined);

      const result = await etapaService.cancelarInscricoesEmLote(
        ["i1", "i2"],
        TEST_ETAPA_ID,
        TEST_ARENA_ID
      );

      expect(result.canceladas).toBe(2);
      expect(result.jogadorIds).toEqual(["j1", "j2"]);
    });

    it("deve retornar erros para inscrições não encontradas", async () => {
      const etapa = createEtapaFixture({ chavesGeradas: false });

      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);
      mockInscricaoRepository.buscarPorIds.mockResolvedValue([]);

      const result = await etapaService.cancelarInscricoesEmLote(
        ["i-inexistente"],
        TEST_ETAPA_ID,
        TEST_ARENA_ID
      );

      expect(result.canceladas).toBe(0);
      expect(result.erros).toHaveLength(1);
      expect(result.erros[0]).toContain("não encontrada");
    });

    it("deve lançar erro se etapa não encontrada", async () => {
      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(null);

      await expect(
        etapaService.cancelarInscricoesEmLote(["i1"], TEST_ETAPA_ID, TEST_ARENA_ID)
      ).rejects.toThrow("Etapa não encontrada");
    });

    it("deve lançar erro se chaves já foram geradas", async () => {
      const etapa = createEtapaFixture({ chavesGeradas: true });
      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);

      await expect(
        etapaService.cancelarInscricoesEmLote(["i1"], TEST_ETAPA_ID, TEST_ARENA_ID)
      ).rejects.toThrow("Não é possível cancelar inscrições após geração de chaves");
    });
  });

  describe("encerrarEtapa - formato TEAMS", () => {
    it("deve encerrar etapa TEAMS com sucesso", async () => {
      const etapa = createEtapaFixture({
        status: StatusEtapa.EM_ANDAMENTO,
        formato: FormatoEtapa.TEAMS,
        contaPontosRanking: true,
      });

      const equipes = [
        {
          id: "eq1",
          nome: "Equipe Campeã",
          jogadores: [
            { id: "j1", nome: "Jogador 1" },
            { id: "j2", nome: "Jogador 2" },
          ],
        },
        {
          id: "eq2",
          nome: "Equipe Vice",
          jogadores: [
            { id: "j3", nome: "Jogador 3" },
            { id: "j4", nome: "Jogador 4" },
          ],
        },
      ];

      const confrontos = [
        { id: "c1", status: StatusConfronto.FINALIZADO },
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
      mockConfrontoEquipeRepository.buscarPorEtapa.mockResolvedValue(confrontos);
      mockEquipeRepository.buscarPorClassificacao.mockResolvedValue(equipes);
      mockEstatisticasRepository.buscarPorJogadorEEtapa.mockResolvedValue(
        createEstatisticasJogadorFixture()
      );
      mockEstatisticasRepository.atualizarPontuacaoEmLote.mockResolvedValue(undefined);
      mockEquipeRepository.atualizarPosicoesEmLote.mockResolvedValue(undefined);
      mockEtapaRepository.definirCampeao.mockResolvedValue(undefined);

      await etapaService.encerrarEtapa(TEST_ETAPA_ID, TEST_ARENA_ID);

      expect(mockEtapaRepository.definirCampeao).toHaveBeenCalledWith(
        TEST_ETAPA_ID,
        "eq1",
        "Equipe Campeã"
      );
    });

    it("deve lançar erro se não há confrontos TEAMS", async () => {
      const etapa = createEtapaFixture({
        status: StatusEtapa.EM_ANDAMENTO,
        formato: FormatoEtapa.TEAMS,
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
      mockConfrontoEquipeRepository.buscarPorEtapa.mockResolvedValue([]);

      await expect(
        etapaService.encerrarEtapa(TEST_ETAPA_ID, TEST_ARENA_ID)
      ).rejects.toThrow("Nenhum confronto encontrado para esta etapa");
    });

    it("deve lançar erro se há confrontos pendentes TEAMS", async () => {
      const etapa = createEtapaFixture({
        status: StatusEtapa.EM_ANDAMENTO,
        formato: FormatoEtapa.TEAMS,
      });

      const confrontos = [
        { id: "c1", status: StatusConfronto.AGENDADO },
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
      mockConfrontoEquipeRepository.buscarPorEtapa.mockResolvedValue(confrontos);

      await expect(
        etapaService.encerrarEtapa(TEST_ETAPA_ID, TEST_ARENA_ID)
      ).rejects.toThrow("Ainda há 1 confronto(s) pendente(s)");
    });

    it("deve lançar erro se não há equipes TEAMS", async () => {
      const etapa = createEtapaFixture({
        status: StatusEtapa.EM_ANDAMENTO,
        formato: FormatoEtapa.TEAMS,
      });

      const confrontos = [{ id: "c1", status: StatusConfronto.FINALIZADO }];

      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);
      mockConfigRepository.buscarPontuacao.mockResolvedValue({
        campeao: 100,
        vice: 70,
        semifinalista: 50,
        quartas: 30,
        oitavas: 20,
        participacao: 10,
      });
      mockConfrontoEquipeRepository.buscarPorEtapa.mockResolvedValue(confrontos);
      mockEquipeRepository.buscarPorClassificacao.mockResolvedValue([]);

      await expect(
        etapaService.encerrarEtapa(TEST_ETAPA_ID, TEST_ARENA_ID)
      ).rejects.toThrow("Nenhuma equipe encontrada para esta etapa");
    });

    it("deve pular atribuição de pontos se etapa não conta no ranking", async () => {
      const etapa = createEtapaFixture({
        status: StatusEtapa.EM_ANDAMENTO,
        formato: FormatoEtapa.TEAMS,
        contaPontosRanking: false,
      });

      const equipes = [
        {
          id: "eq1",
          nome: "Equipe Campeã",
          jogadores: [{ id: "j1", nome: "Jogador 1" }],
        },
      ];

      const confrontos = [{ id: "c1", status: StatusConfronto.FINALIZADO }];

      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);
      mockConfigRepository.buscarPontuacao.mockResolvedValue({
        campeao: 100,
        vice: 70,
        semifinalista: 50,
        quartas: 30,
        oitavas: 20,
        participacao: 10,
      });
      mockConfrontoEquipeRepository.buscarPorEtapa.mockResolvedValue(confrontos);
      mockEquipeRepository.buscarPorClassificacao.mockResolvedValue(equipes);
      mockEtapaRepository.definirCampeao.mockResolvedValue(undefined);

      await etapaService.encerrarEtapa(TEST_ETAPA_ID, TEST_ARENA_ID);

      expect(mockEstatisticasRepository.atualizarPontuacaoEmLote).not.toHaveBeenCalled();
      expect(mockEtapaRepository.definirCampeao).toHaveBeenCalled();
    });
  });

  describe("encerrarEtapa - formato SUPER_X", () => {
    it("deve encerrar etapa SUPER_X com sucesso", async () => {
      const etapa = createEtapaFixture({
        status: StatusEtapa.EM_ANDAMENTO,
        formato: FormatoEtapa.SUPER_X,
        contaPontosRanking: true,
      });

      const grupo = createGrupoFixture({ completo: true });
      const jogadores = [
        createEstatisticasJogadorFixture({
          id: "e1",
          jogadorId: "j1",
          jogadorNome: "Campeão",
          posicaoGrupo: 1,
        }),
        createEstatisticasJogadorFixture({
          id: "e2",
          jogadorId: "j2",
          jogadorNome: "Vice",
          posicaoGrupo: 2,
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
      mockGrupoRepository.buscarPorEtapa.mockResolvedValue([grupo]);
      mockEstatisticasRepository.buscarPorGrupoOrdenado.mockResolvedValue(jogadores);
      mockEstatisticasRepository.atualizarPontuacaoEmLote.mockResolvedValue(undefined);
      mockEtapaRepository.definirCampeao.mockResolvedValue(undefined);

      await etapaService.encerrarEtapa(TEST_ETAPA_ID, TEST_ARENA_ID);

      expect(mockEtapaRepository.definirCampeao).toHaveBeenCalledWith(
        TEST_ETAPA_ID,
        "j1",
        "Campeão"
      );
    });

    it("deve lançar erro se grupo SUPER_X não está completo", async () => {
      const etapa = createEtapaFixture({
        status: StatusEtapa.EM_ANDAMENTO,
        formato: FormatoEtapa.SUPER_X,
      });

      const grupo = createGrupoFixture({ completo: false });

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

    it("deve lançar erro se não há jogadores no grupo SUPER_X", async () => {
      const etapa = createEtapaFixture({
        status: StatusEtapa.EM_ANDAMENTO,
        formato: FormatoEtapa.SUPER_X,
      });

      const grupo = createGrupoFixture({ completo: true });

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
      mockEstatisticasRepository.buscarPorGrupoOrdenado.mockResolvedValue([]);

      await expect(
        etapaService.encerrarEtapa(TEST_ETAPA_ID, TEST_ARENA_ID)
      ).rejects.toThrow("Nenhum jogador encontrado no grupo");
    });

    it("deve pular atribuição de pontos se SUPER_X não conta no ranking", async () => {
      const etapa = createEtapaFixture({
        status: StatusEtapa.EM_ANDAMENTO,
        formato: FormatoEtapa.SUPER_X,
        contaPontosRanking: false,
      });

      const grupo = createGrupoFixture({ completo: true });
      const jogadores = [
        createEstatisticasJogadorFixture({
          id: "e1",
          jogadorId: "j1",
          jogadorNome: "Campeão",
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
      mockGrupoRepository.buscarPorEtapa.mockResolvedValue([grupo]);
      mockEstatisticasRepository.buscarPorGrupoOrdenado.mockResolvedValue(jogadores);
      mockEtapaRepository.definirCampeao.mockResolvedValue(undefined);

      await etapaService.encerrarEtapa(TEST_ETAPA_ID, TEST_ARENA_ID);

      expect(mockEstatisticasRepository.atualizarPontuacaoEmLote).not.toHaveBeenCalled();
      expect(mockEtapaRepository.definirCampeao).toHaveBeenCalled();
    });
  });

  describe("encerrarEtapa - grupo único sem pontos ranking", () => {
    it("deve pular atribuição de pontos se grupo único não conta no ranking", async () => {
      const etapa = createEtapaFixture({
        status: StatusEtapa.EM_ANDAMENTO,
        formato: FormatoEtapa.DUPLA_FIXA,
        contaPontosRanking: false,
      });

      const grupo = createGrupoFixture({ completo: true });
      const duplas = [
        createDuplaFixture({
          id: "dupla-1",
          jogador1Id: "j1",
          jogador1Nome: "J1",
          jogador2Id: "j2",
          jogador2Nome: "J2",
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
      mockGrupoRepository.buscarPorEtapa.mockResolvedValue([grupo]);
      mockDuplaRepository.buscarPorGrupoOrdenado.mockResolvedValue(duplas);
      mockEtapaRepository.definirCampeao.mockResolvedValue(undefined);

      await etapaService.encerrarEtapa(TEST_ETAPA_ID, TEST_ARENA_ID);

      expect(mockEstatisticasRepository.buscarPorJogadorEEtapa).not.toHaveBeenCalled();
      expect(mockEtapaRepository.definirCampeao).toHaveBeenCalled();
    });
  });

  describe("encerrarEtapa - eliminatória sem pontos ranking", () => {
    it("deve pular atribuição de pontos se eliminatória não conta no ranking", async () => {
      const etapa = createEtapaFixture({
        status: StatusEtapa.EM_ANDAMENTO,
        contaPontosRanking: false,
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
      mockEtapaRepository.definirCampeao.mockResolvedValue(undefined);

      await etapaService.encerrarEtapa(TEST_ETAPA_ID, TEST_ARENA_ID);

      expect(mockConfrontoRepository.buscarFinalizadosPorFase).not.toHaveBeenCalled();
      expect(mockDuplaRepository.buscarPorEtapa).not.toHaveBeenCalled();
      expect(mockEtapaRepository.definirCampeao).toHaveBeenCalled();
    });
  });

  describe("atualizar - recalcular grupos", () => {
    it("deve recalcular grupos corretamente ao aumentar para mais de 5 duplas", async () => {
      const etapa = createEtapaFixture({
        chavesGeradas: false,
        totalInscritos: 0,
        maxJogadores: 8, // 4 duplas
      });
      const etapaAtualizada = createEtapaFixture({
        maxJogadores: 12, // 6 duplas -> precisa de 2 grupos
      });

      mockEtapaRepository.buscarPorIdEArena.mockResolvedValue(etapa);
      mockEtapaRepository.atualizar.mockResolvedValue(etapaAtualizada);

      await etapaService.atualizar(TEST_ETAPA_ID, TEST_ARENA_ID, {
        maxJogadores: 12,
      });

      expect(mockEtapaRepository.atualizar).toHaveBeenCalledWith(
        TEST_ETAPA_ID,
        expect.objectContaining({
          maxJogadores: 12,
          qtdGrupos: expect.any(Number),
        })
      );
    });
  });
});
