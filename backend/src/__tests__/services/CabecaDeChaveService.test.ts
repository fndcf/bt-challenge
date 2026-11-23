/**
 * Testes do CabecaDeChaveService
 */

jest.mock("../../utils/logger", () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

jest.mock("../../config/firebase", () => ({
  db: { collection: jest.fn() },
}));

import { CabecaDeChaveService } from "../../services/CabecaDeChaveService";
import { TEST_IDS, NivelJogador, GeneroJogador } from "../fixtures";
import { createMockCabecaDeChaveRepository } from "../mocks/repositories";

describe("CabecaDeChaveService", () => {
  let service: CabecaDeChaveService;
  let repo: ReturnType<typeof createMockCabecaDeChaveRepository>;

  const ARENA = TEST_IDS.arena;
  const ETAPA = TEST_IDS.etapa;
  const JOGADOR = TEST_IDS.jogador1;

  beforeEach(() => {
    repo = createMockCabecaDeChaveRepository();
    service = new CabecaDeChaveService(repo);
  });

  describe("criar", () => {
    const dto = {
      arenaId: ARENA,
      etapaId: ETAPA,
      jogadorId: JOGADOR,
      jogadorNome: "João Silva",
      jogadorNivel: NivelJogador.AVANCADO,
      jogadorGenero: GeneroJogador.MASCULINO,
      ordem: 1,
    };

    it("deve criar cabeça de chave com sucesso", async () => {
      repo.buscarPorJogador.mockResolvedValue(null);
      repo.criar.mockResolvedValue({ id: "cabeca-123", ...dto, ativo: true });

      const result = await service.criar(dto);

      expect(result).toMatchObject({ id: "cabeca-123", ativo: true, ordem: 1 });
      expect(repo.buscarPorJogador).toHaveBeenCalledWith(ARENA, ETAPA, JOGADOR);
      expect(repo.criar).toHaveBeenCalledWith(dto);
    });

    it("deve lançar erro se jogador já é cabeça de chave", async () => {
      repo.buscarPorJogador.mockResolvedValue({ id: "existente", ativo: true });

      await expect(service.criar(dto)).rejects.toThrow(
        "Jogador já é cabeça de chave"
      );
      expect(repo.criar).not.toHaveBeenCalled();
    });
  });

  describe("ehCabecaDeChave", () => {
    it.each([
      ["true quando está ativa", { ativo: true }, true],
      ["false quando está inativa", { ativo: false }, false],
      ["false quando não existe", null, false],
    ])("deve retornar %s", async (_, cabeca, esperado) => {
      repo.buscarPorJogador.mockResolvedValue(cabeca);

      expect(await service.ehCabecaDeChave(ARENA, ETAPA, JOGADOR)).toBe(
        esperado
      );
    });

    it("deve retornar false em caso de erro", async () => {
      repo.buscarPorJogador.mockRejectedValue(new Error("Erro de conexão"));

      expect(await service.ehCabecaDeChave(ARENA, ETAPA, JOGADOR)).toBe(false);
    });
  });

  describe("atualizar", () => {
    it("deve repassar os campos", async () => {
      await service.atualizar("cabeca-123", { ordem: 2 });

      expect(repo.atualizar).toHaveBeenCalledWith("cabeca-123", { ordem: 2 });
    });

    it("deve propagar erro", async () => {
      repo.atualizar.mockRejectedValue(new Error("Erro de banco"));

      await expect(
        service.atualizar("cabeca-123", { ordem: 5 })
      ).rejects.toThrow("Erro de banco");
    });
  });

  describe("remover", () => {
    it("deve deletar a cabeça de chave do jogador", async () => {
      repo.buscarPorJogador.mockResolvedValue({ id: "cabeca-123" });

      await service.remover(ARENA, ETAPA, JOGADOR);

      expect(repo.deletar).toHaveBeenCalledWith("cabeca-123");
    });

    it("deve lançar erro se não encontrada", async () => {
      repo.buscarPorJogador.mockResolvedValue(null);

      await expect(service.remover(ARENA, ETAPA, JOGADOR)).rejects.toThrow(
        "Cabeça de chave não encontrada"
      );
      expect(repo.deletar).not.toHaveBeenCalled();
    });
  });

  describe("removerSeExistirem", () => {
    it("deleta só as dos jogadores que são cabeças, sem registrar erro", async () => {
      repo.buscarPorJogador.mockImplementation(
        async (_arena: string, _etapa: string, jogadorId: string) =>
          jogadorId === "j1" ? { id: "cabeca-1" } : null
      );

      await service.removerSeExistirem(ARENA, ETAPA, ["j1", "j2"]);

      expect(repo.deletar.mock.calls).toEqual([["cabeca-1"]]);
    });

    it("uma falha não interrompe as outras", async () => {
      repo.buscarPorJogador.mockImplementation(
        async (_arena: string, _etapa: string, jogadorId: string) => {
          if (jogadorId === "j1") throw new Error("banco");
          return { id: "cabeca-2" };
        }
      );

      await service.removerSeExistirem(ARENA, ETAPA, ["j1", "j2"]);

      expect(repo.deletar.mock.calls).toEqual([["cabeca-2"]]);
    });
  });

  describe("obterIdsCabecas", () => {
    it("deve retornar os IDs das ativas, na ordem", async () => {
      repo.listarAtivas.mockResolvedValue([
        { jogadorId: "j1" },
        { jogadorId: "j2" },
      ]);

      expect(await service.obterIdsCabecas(ARENA, ETAPA)).toEqual(["j1", "j2"]);
    });

    it("deve retornar vazio se não houver cabeças", async () => {
      repo.listarAtivas.mockResolvedValue([]);

      expect(await service.obterIdsCabecas(ARENA, ETAPA)).toEqual([]);
    });

    it("deve propagar erro, para a geração de chaves parar", async () => {
      repo.listarAtivas.mockRejectedValue(new Error("Erro"));

      await expect(service.obterIdsCabecas(ARENA, ETAPA)).rejects.toThrow(
        "Erro"
      );
    });
  });

  it.each([0, 3])("deletarPorEtapa deve retornar a quantidade (%i)", async (n) => {
    repo.deletarPorEtapa.mockResolvedValue(n);

    expect(await service.deletarPorEtapa(ETAPA, ARENA)).toBe(n);
    expect(repo.deletarPorEtapa).toHaveBeenCalledWith(ETAPA, ARENA);
  });
});
