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

jest.mock("../../repositories/firebase/JogadorRepository", () => ({
  JogadorRepository: jest.fn(),
}));

jest.mock("../../repositories/firebase/InscricaoRepository", () => ({
  InscricaoRepository: jest.fn(),
}));

import { JogadorService } from "../../services/JogadorService";
import {
  createMockJogadorRepository,
  createMockInscricaoRepository,
} from "../mocks/repositories";
import {
  createJogadorFixture,
  createJogadoresFixture,
  NivelJogador,
  GeneroJogador,
  StatusJogador,
} from "../fixtures";

describe("JogadorService", () => {
  let mockJogadorRepository: ReturnType<typeof createMockJogadorRepository>;
  let mockInscricaoRepository: ReturnType<typeof createMockInscricaoRepository>;
  let jogadorService: JogadorService;

  const TEST_ARENA_ID = "arena-test-001";
  const TEST_ADMIN_ID = "admin-test-001";
  const TEST_JOGADOR_ID = "jogador-test-001";

  beforeEach(() => {
    jest.clearAllMocks();

    mockJogadorRepository = createMockJogadorRepository();
    mockInscricaoRepository = createMockInscricaoRepository();

    jogadorService = new JogadorService(
      mockJogadorRepository,
      mockInscricaoRepository
    );
  });

  describe("criar", () => {
    it("deve criar um jogador com dados válidos", async () => {
      const dadosCriacao = {
        nome: "João Silva",
        email: "joao@teste.com",
        telefone: "11999999999",
        genero: GeneroJogador.MASCULINO,
        nivel: NivelJogador.INTERMEDIARIO,
        status: StatusJogador.ATIVO,
      };

      const jogadorCriado = createJogadorFixture({
        id: TEST_JOGADOR_ID,
        ...dadosCriacao,
      });

      mockJogadorRepository.nomeExiste.mockResolvedValue(false);
      mockJogadorRepository.criar.mockResolvedValue(jogadorCriado);

      const result = await jogadorService.criar(
        TEST_ARENA_ID,
        TEST_ADMIN_ID,
        dadosCriacao
      );

      expect(mockJogadorRepository.nomeExiste).toHaveBeenCalledWith(
        TEST_ARENA_ID,
        "João Silva"
      );
      expect(mockJogadorRepository.criar).toHaveBeenCalledWith(
        expect.objectContaining({
          arenaId: TEST_ARENA_ID,
          criadoPor: TEST_ADMIN_ID,
          nome: "João Silva",
          genero: GeneroJogador.MASCULINO,
          nivel: NivelJogador.INTERMEDIARIO,
        })
      );
      expect(result.id).toBe(TEST_JOGADOR_ID);
      expect(result.nome).toBe("João Silva");
    });

    it("deve lançar erro se nome já existe", async () => {
      const dadosCriacao = {
        nome: "João Silva",
        genero: GeneroJogador.MASCULINO,
        nivel: NivelJogador.INTERMEDIARIO,
        status: StatusJogador.ATIVO,
      };

      mockJogadorRepository.nomeExiste.mockResolvedValue(true);

      await expect(
        jogadorService.criar(TEST_ARENA_ID, TEST_ADMIN_ID, dadosCriacao)
      ).rejects.toThrow("Já existe um jogador com este nome nesta arena");

      expect(mockJogadorRepository.criar).not.toHaveBeenCalled();
    });

    it("deve lançar erro se dados inválidos (nome muito curto)", async () => {
      const dadosInvalidos = {
        nome: "AB",
        genero: GeneroJogador.MASCULINO,
        nivel: NivelJogador.INTERMEDIARIO,
        status: StatusJogador.ATIVO,
      };

      await expect(
        jogadorService.criar(TEST_ARENA_ID, TEST_ADMIN_ID, dadosInvalidos)
      ).rejects.toThrow();
    });
  });

  describe("buscarPorId", () => {
    it("deve retornar jogador quando encontrado", async () => {
      const jogador = createJogadorFixture({ id: TEST_JOGADOR_ID });
      mockJogadorRepository.buscarPorIdEArena.mockResolvedValue(jogador);

      const result = await jogadorService.buscarPorId(
        TEST_JOGADOR_ID,
        TEST_ARENA_ID
      );

      expect(mockJogadorRepository.buscarPorIdEArena).toHaveBeenCalledWith(
        TEST_JOGADOR_ID,
        TEST_ARENA_ID
      );
      expect(result).toEqual(jogador);
    });

    it("deve retornar null quando jogador não encontrado", async () => {
      mockJogadorRepository.buscarPorIdEArena.mockResolvedValue(null);

      const result = await jogadorService.buscarPorId(
        "id-inexistente",
        TEST_ARENA_ID
      );

      expect(result).toBeNull();
    });
  });

  describe("listar", () => {
    it("deve listar jogadores com filtros", async () => {
      const jogadores = createJogadoresFixture(4);
      const expectedResponse = {
        jogadores,
        total: 4,
        limite: 10,
        offset: 0,
        temMais: false,
      };

      mockJogadorRepository.listar.mockResolvedValue(expectedResponse);

      const result = await jogadorService.listar({
        arenaId: TEST_ARENA_ID,
        nivel: NivelJogador.INTERMEDIARIO,
      });

      expect(mockJogadorRepository.listar).toHaveBeenCalledWith({
        arenaId: TEST_ARENA_ID,
        nivel: NivelJogador.INTERMEDIARIO,
      });
      expect(result.jogadores).toHaveLength(4);
      expect(result.total).toBe(4);
    });
  });

  describe("atualizar", () => {
    it("deve atualizar jogador existente", async () => {
      const jogadorOriginal = createJogadorFixture({ id: TEST_JOGADOR_ID });
      const jogadorAtualizado = createJogadorFixture({
        id: TEST_JOGADOR_ID,
        nome: "João Silva Atualizado",
        nivel: NivelJogador.AVANCADO,
      });

      mockJogadorRepository.buscarPorIdEArena.mockResolvedValue(
        jogadorOriginal
      );
      mockJogadorRepository.nomeExiste.mockResolvedValue(false);
      mockJogadorRepository.atualizar.mockResolvedValue(jogadorAtualizado);

      const result = await jogadorService.atualizar(
        TEST_JOGADOR_ID,
        TEST_ARENA_ID,
        { nome: "João Silva Atualizado", nivel: NivelJogador.AVANCADO }
      );

      expect(result.nome).toBe("João Silva Atualizado");
      expect(result.nivel).toBe(NivelJogador.AVANCADO);
    });

    it("deve lançar erro ao atualizar jogador inexistente", async () => {
      mockJogadorRepository.buscarPorIdEArena.mockResolvedValue(null);

      await expect(
        jogadorService.atualizar("id-inexistente", TEST_ARENA_ID, {
          nome: "Novo Nome",
        })
      ).rejects.toThrow("Jogador não encontrado");
    });

    it("deve lançar erro se novo nome já existe", async () => {
      const jogadorOriginal = createJogadorFixture({
        id: TEST_JOGADOR_ID,
        nome: "Nome Original",
      });

      mockJogadorRepository.buscarPorIdEArena.mockResolvedValue(
        jogadorOriginal
      );
      mockJogadorRepository.nomeExiste.mockResolvedValue(true);

      await expect(
        jogadorService.atualizar(TEST_JOGADOR_ID, TEST_ARENA_ID, {
          nome: "Nome Já Existente",
        })
      ).rejects.toThrow("Falha ao atualizar jogador");
    });
  });

  describe("deletar", () => {
    it("deve deletar jogador sem inscrições ativas", async () => {
      const jogador = createJogadorFixture({ id: TEST_JOGADOR_ID });

      mockJogadorRepository.buscarPorIdEArena.mockResolvedValue(jogador);
      mockInscricaoRepository.buscarAtivasPorJogador.mockResolvedValue([]);
      mockJogadorRepository.deletar.mockResolvedValue(undefined);

      await jogadorService.deletar(TEST_JOGADOR_ID, TEST_ARENA_ID);

      expect(mockJogadorRepository.deletar).toHaveBeenCalledWith(
        TEST_JOGADOR_ID
      );
    });

    it("deve lançar erro ao deletar jogador inexistente", async () => {
      mockJogadorRepository.buscarPorIdEArena.mockResolvedValue(null);

      await expect(
        jogadorService.deletar("id-inexistente", TEST_ARENA_ID)
      ).rejects.toThrow("Jogador não encontrado");
    });

    it("deve lançar erro ao deletar jogador com inscrições ativas", async () => {
      const jogador = createJogadorFixture({ id: TEST_JOGADOR_ID });
      const inscricaoAtiva = { id: "inscricao-1", jogadorId: TEST_JOGADOR_ID };

      mockJogadorRepository.buscarPorIdEArena.mockResolvedValue(jogador);
      mockInscricaoRepository.buscarAtivasPorJogador.mockResolvedValue([
        inscricaoAtiva as any,
      ]);

      await expect(
        jogadorService.deletar(TEST_JOGADOR_ID, TEST_ARENA_ID)
      ).rejects.toThrow("está inscrito em uma ou mais etapas");

      expect(mockJogadorRepository.deletar).not.toHaveBeenCalled();
    });
  });

  describe("deletarEmLote", () => {
    it("deve deletar múltiplos jogadores e reportar erros", async () => {
      const jogador1 = createJogadorFixture({ id: "jogador-1" });

      mockJogadorRepository.buscarPorIdEArena
        .mockResolvedValueOnce(jogador1)
        .mockResolvedValueOnce(null);

      mockInscricaoRepository.buscarAtivasPorJogador.mockResolvedValue([]);
      mockJogadorRepository.deletar.mockResolvedValue(undefined);

      const result = await jogadorService.deletarEmLote(
        ["jogador-1", "jogador-2"],
        TEST_ARENA_ID
      );

      expect(result.deletados).toContain("jogador-1");
      expect(result.erros).toHaveLength(1);
      expect(result.erros[0].id).toBe("jogador-2");
      expect(result.erros[0].motivo).toContain("não encontrado");
    });
  });

  describe("contarPorNivel", () => {
    it("deve retornar contagem por nível", async () => {
      const contagem = {
        [NivelJogador.INICIANTE]: 5,
        [NivelJogador.INTERMEDIARIO]: 10,
        [NivelJogador.AVANCADO]: 3,
      };

      mockJogadorRepository.contarPorNivel.mockResolvedValue(contagem);

      const result = await jogadorService.contarPorNivel(TEST_ARENA_ID);

      expect(result[NivelJogador.INICIANTE]).toBe(5);
      expect(result[NivelJogador.INTERMEDIARIO]).toBe(10);
      expect(result[NivelJogador.AVANCADO]).toBe(3);
    });

    it("deve retornar zeros em caso de erro", async () => {
      mockJogadorRepository.contarPorNivel.mockRejectedValue(
        new Error("Erro de conexão")
      );

      const result = await jogadorService.contarPorNivel(TEST_ARENA_ID);

      expect(result[NivelJogador.INICIANTE]).toBe(0);
      expect(result[NivelJogador.INTERMEDIARIO]).toBe(0);
      expect(result[NivelJogador.AVANCADO]).toBe(0);
    });
  });

  describe("buscarAtivos", () => {
    it("deve retornar apenas jogadores ativos", async () => {
      const jogadoresAtivos = createJogadoresFixture(3).map((j) => ({
        ...j,
        status: StatusJogador.ATIVO,
      }));

      mockJogadorRepository.buscarAtivos.mockResolvedValue(jogadoresAtivos);

      const result = await jogadorService.buscarAtivos(TEST_ARENA_ID);

      expect(mockJogadorRepository.buscarAtivos).toHaveBeenCalledWith(
        TEST_ARENA_ID
      );
      expect(result).toHaveLength(3);
    });
  });

  describe("buscarPorNivel", () => {
    it("deve retornar jogadores do nível especificado", async () => {
      const jogadoresAvancados = createJogadoresFixture(2).map((j) => ({
        ...j,
        nivel: NivelJogador.AVANCADO,
      }));

      mockJogadorRepository.buscarPorNivel.mockResolvedValue(
        jogadoresAvancados
      );

      const result = await jogadorService.buscarPorNivel(
        TEST_ARENA_ID,
        NivelJogador.AVANCADO
      );

      expect(mockJogadorRepository.buscarPorNivel).toHaveBeenCalledWith(
        TEST_ARENA_ID,
        NivelJogador.AVANCADO
      );
      expect(result).toHaveLength(2);
    });
  });

  describe("contar", () => {
    it("deve retornar contagem de jogadores", async () => {
      mockJogadorRepository.contar.mockResolvedValue(10);

      const result = await jogadorService.contar(TEST_ARENA_ID);

      expect(result).toBe(10);
    });

    it("deve retornar 0 em caso de erro", async () => {
      mockJogadorRepository.contar.mockRejectedValue(new Error("Erro de conexão"));

      const result = await jogadorService.contar(TEST_ARENA_ID);

      expect(result).toBe(0);
    });
  });

  describe("buscarPorIds", () => {
    it("deve buscar jogadores por IDs", async () => {
      const jogadores = createJogadoresFixture(3);
      const ids = jogadores.map((j) => j.id);

      mockJogadorRepository.buscarPorIds.mockResolvedValue(jogadores);

      const result = await jogadorService.buscarPorIds(ids, TEST_ARENA_ID);

      expect(mockJogadorRepository.buscarPorIds).toHaveBeenCalledWith(
        ids,
        TEST_ARENA_ID
      );
      expect(result).toHaveLength(3);
    });
  });

  describe("atualizarEstatisticas", () => {
    it("deve atualizar estatísticas do jogador", async () => {
      mockJogadorRepository.atualizarEstatisticas.mockResolvedValue(undefined);

      await jogadorService.atualizarEstatisticas(TEST_JOGADOR_ID, {
        vitorias: 5,
        derrotas: 2,
        pontos: 15,
      });

      expect(mockJogadorRepository.atualizarEstatisticas).toHaveBeenCalledWith(
        TEST_JOGADOR_ID,
        { vitorias: 5, derrotas: 2, pontos: 15 }
      );
    });
  });

  describe("incrementarVitorias", () => {
    it("deve incrementar vitórias do jogador", async () => {
      mockJogadorRepository.incrementarVitorias.mockResolvedValue(undefined);

      await jogadorService.incrementarVitorias(TEST_JOGADOR_ID);

      expect(mockJogadorRepository.incrementarVitorias).toHaveBeenCalledWith(
        TEST_JOGADOR_ID
      );
    });
  });

  describe("incrementarDerrotas", () => {
    it("deve incrementar derrotas do jogador", async () => {
      mockJogadorRepository.incrementarDerrotas.mockResolvedValue(undefined);

      await jogadorService.incrementarDerrotas(TEST_JOGADOR_ID);

      expect(mockJogadorRepository.incrementarDerrotas).toHaveBeenCalledWith(
        TEST_JOGADOR_ID
      );
    });
  });

  describe("criar - erros", () => {
    it("deve lançar erro genérico em caso de falha inesperada", async () => {
      const dadosCriacao = {
        nome: "João Silva",
        genero: GeneroJogador.MASCULINO,
        nivel: NivelJogador.INTERMEDIARIO,
        status: StatusJogador.ATIVO,
      };

      mockJogadorRepository.nomeExiste.mockResolvedValue(false);
      mockJogadorRepository.criar.mockRejectedValue(new Error("Erro de banco"));

      await expect(
        jogadorService.criar(TEST_ARENA_ID, TEST_ADMIN_ID, dadosCriacao)
      ).rejects.toThrow("Falha ao criar jogador");
    });
  });

  describe("deletar - erros", () => {
    it("deve lançar erro genérico em caso de falha inesperada", async () => {
      const jogador = createJogadorFixture({ id: TEST_JOGADOR_ID });

      mockJogadorRepository.buscarPorIdEArena.mockResolvedValue(jogador);
      mockInscricaoRepository.buscarAtivasPorJogador.mockResolvedValue([]);
      mockJogadorRepository.deletar.mockRejectedValue(new Error("Erro de banco"));

      await expect(
        jogadorService.deletar(TEST_JOGADOR_ID, TEST_ARENA_ID)
      ).rejects.toThrow("Falha ao deletar jogador");
    });
  });

  describe("atualizar - erros", () => {
    it("deve lançar erro quando nome já existe para outro jogador", async () => {
      const jogadorOriginal = createJogadorFixture({
        id: TEST_JOGADOR_ID,
        nome: "Nome Original",
      });

      mockJogadorRepository.buscarPorIdEArena.mockResolvedValue(jogadorOriginal);
      mockJogadorRepository.nomeExiste.mockResolvedValue(true);

      await expect(
        jogadorService.atualizar(TEST_JOGADOR_ID, TEST_ARENA_ID, {
          nome: "Nome Já Existente",
        })
      ).rejects.toThrow();
    });

    it("deve lançar erro genérico em caso de falha inesperada", async () => {
      const jogadorOriginal = createJogadorFixture({
        id: TEST_JOGADOR_ID,
        nome: "Nome Original",
      });

      mockJogadorRepository.buscarPorIdEArena.mockResolvedValue(jogadorOriginal);
      mockJogadorRepository.nomeExiste.mockResolvedValue(false);
      mockJogadorRepository.atualizar.mockRejectedValue(new Error("Erro de banco"));

      await expect(
        jogadorService.atualizar(TEST_JOGADOR_ID, TEST_ARENA_ID, {
          nome: "Novo Nome",
        })
      ).rejects.toThrow("Falha ao atualizar jogador");
    });
  });
});
