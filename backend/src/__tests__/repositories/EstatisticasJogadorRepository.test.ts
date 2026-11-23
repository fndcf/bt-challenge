/**
 * O que o EstatisticasJogadorRepository lê e grava no Firestore
 */

jest.mock("../../utils/logger", () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

const mockGet = jest.fn();
const mockConsulta = {
  where: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  get: mockGet,
};
const mockBatch = {
  set: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  commit: jest.fn(),
};
const mockAdd = jest.fn();
const mockRef = { get: jest.fn(), update: jest.fn(), delete: jest.fn() };
const mockDoc = jest.fn((id = "novo") => ({ id, ...mockRef }));

jest.mock("../../config/firebase", () => ({
  db: {
    collection: jest.fn(() => ({ ...mockConsulta, add: mockAdd, doc: mockDoc })),
    batch: jest.fn(() => mockBatch),
  },
}));

import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { EstatisticasJogadorRepository } from "../../repositories/firebase/EstatisticasJogadorRepository";
import { totaisDaPartida } from "../../utils/estatisticas";

describe("EstatisticasJogadorRepository", () => {
  let repositorio: EstatisticasJogadorRepository;
  const agora = expect.any(Timestamp);
  const doc = (id: string, dados = {}) => ({ id, ref: id, data: () => dados });
  const filtros = () => mockConsulta.where.mock.calls;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockResolvedValue({ docs: [] });
    repositorio = new EstatisticasJogadorRepository();
  });

  describe("criar", () => {
    const dto = {
      etapaId: "e1",
      arenaId: "a1",
      jogadorId: "j1",
      jogadorNome: "Um",
      jogadorNivel: "avancado",
    };
    const zerada = expect.objectContaining({
      ...dto,
      jogos: 0,
      pontos: 0,
      saldoGames: 0,
      jogosGrupo: 0,
      pontosGrupo: 0,
      saldoGamesGrupo: 0,
      classificado: false,
      criadoEm: agora,
      atualizadoEm: agora,
    });

    it("um ou vários gravam as mesmas estatísticas zeradas", async () => {
      mockAdd.mockResolvedValue({ id: "est-1" });

      const criada = await repositorio.criar(dto);
      const [emLote] = await repositorio.criarEmLote([dto]);

      expect(mockAdd).toHaveBeenCalledWith(zerada);
      expect(mockBatch.set.mock.calls[0][1]).toEqual(zerada);
      expect(criada.id).toBe("est-1");
      expect(emLote.id).toBe("novo");
    });

    it("divide em lotes de 500", async () => {
      expect(await repositorio.criarEmLote(Array(501).fill(dto))).toHaveLength(501);
      expect(mockBatch.commit).toHaveBeenCalledTimes(2);
    });
  });

  describe("buscar", () => {
    it("por arena, com ou sem nível", async () => {
      await repositorio.buscarPorArena("a1");
      expect(filtros()).toEqual([["arenaId", "==", "a1"]]);

      await repositorio.buscarPorArena("a1", "avancado");
      expect(filtros().slice(1)).toEqual([
        ["arenaId", "==", "a1"],
        ["jogadorNivel", "==", "avancado"],
      ]);
    });

    it("do jogador na etapa", async () => {
      expect(await repositorio.buscarPorJogadorEEtapa("j1", "e1")).toBeNull();

      mockGet.mockResolvedValue({ docs: [doc("est-1", { jogos: 2 })] });
      expect(await repositorio.buscarPorJogadorEEtapa("j1", "e1")).toEqual({
        id: "est-1",
        jogos: 2,
      });
    });

    it("de mais de 30 jogadores, em partes (limite do Firestore)", async () => {
      mockGet
        .mockResolvedValueOnce({ docs: [doc("a")] })
        .mockResolvedValueOnce({ docs: [doc("b")] });
      const ids = Array.from({ length: 32 }, (_, i) => `j${i}`);

      const achadas = await repositorio.buscarPorJogadoresDaEtapa(ids, "e1");

      expect(achadas.map((e) => e.id)).toEqual(["a", "b"]);
      expect(
        filtros()
          .filter(([campo]) => campo === "jogadorId")
          .map(([, , valores]) => valores.length)
      ).toEqual([30, 2]);
    });

    it("sem jogadores, não consulta", async () => {
      expect(await repositorio.buscarPorJogadoresDaEtapa([], "e1")).toEqual([]);
      expect(mockGet).not.toHaveBeenCalled();
    });

    it("do grupo, na ordem da posição", async () => {
      mockGet.mockResolvedValue({
        docs: [
          doc("sem"),
          doc("2", { posicaoGrupo: 2 }),
          doc("1", { posicaoGrupo: 1 }),
        ],
      });

      const lista = await repositorio.buscarPorGrupoOrdenado("g1");

      expect(lista.map((e) => e.id)).toEqual(["1", "2", "sem"]);
    });

    it("os primeiros do grupo", async () => {
      await repositorio.buscarClassificados("g1", 3);

      expect(mockConsulta.orderBy).toHaveBeenCalledWith("posicaoGrupo", "asc");
      expect(mockConsulta.limit).toHaveBeenCalledWith(3);
    });

    it.each([
      [
        "buscarPorEtapa",
        [
          ["etapaId", "==", "x"],
          ["arenaId", "==", "a1"],
        ],
      ],
      [
        "buscarPorJogador",
        [
          ["jogadorId", "==", "x"],
          ["arenaId", "==", "a1"],
        ],
      ],
    ] as const)("%s", async (metodo, esperado) => {
      await repositorio[metodo]("x", "a1");

      expect(filtros()).toEqual(esperado);
    });
  });

  describe("gravar", () => {
    it("soma pelo banco (increment)", async () => {
      const incrementos = totaisDaPartida({
        venceu: false,
        setsVencidos: 0,
        setsPerdidos: 1,
        gamesVencidos: 2,
        gamesPerdidos: 6,
      });

      await repositorio.incrementarEmLote([{ id: "est-1", incrementos }]);

      expect(mockDoc).toHaveBeenCalledWith("est-1");
      expect(mockBatch.update.mock.calls[0][1]).toEqual({
        jogos: FieldValue.increment(1),
        vitorias: FieldValue.increment(0),
        derrotas: FieldValue.increment(1),
        setsVencidos: FieldValue.increment(0),
        setsPerdidos: FieldValue.increment(1),
        saldoSets: FieldValue.increment(-1),
        gamesVencidos: FieldValue.increment(2),
        gamesPerdidos: FieldValue.increment(6),
        saldoGames: FieldValue.increment(-4),
        atualizadoEm: agora,
      });
    });

    it("atualiza vários, em lotes de 500", async () => {
      await repositorio.atualizarEmLote(
        Array(501).fill({ id: "est-1", dados: { posicaoGrupo: 1 } })
      );

      expect(mockBatch.update).toHaveBeenCalledTimes(501);
      expect(mockBatch.update.mock.calls[0][1]).toEqual({
        posicaoGrupo: 1,
        atualizadoEm: agora,
      });
      expect(mockBatch.commit).toHaveBeenCalledTimes(2);
    });

    it("pontuação final", async () => {
      await repositorio.atualizarPontuacaoEmLote([
        { estatisticaId: "est-1", pontos: 100, colocacao: "campeao" },
      ]);

      expect(mockBatch.update.mock.calls[0][1]).toEqual({
        pontos: 100,
        colocacao: "campeao",
        atualizadoEm: agora,
      });
    });

    it("lista vazia não grava nada", async () => {
      await repositorio.atualizarEmLote([]);
      await repositorio.incrementarEmLote([]);
      await repositorio.atualizarPontuacaoEmLote([]);

      expect(mockBatch.commit).not.toHaveBeenCalled();
    });

    it("atualiza um e devolve como ficou", async () => {
      mockRef.get.mockResolvedValue({
        exists: true,
        data: () => ({ classificado: false }),
      });

      expect(
        await repositorio.atualizar("est-1", { classificado: false })
      ).toEqual({ id: "est-1", classificado: false });
      expect(mockRef.update).toHaveBeenCalledWith({
        classificado: false,
        atualizadoEm: agora,
      });
    });

    it.each(["atualizar", "deletar"] as const)(
      "%s: erro se não existe",
      async (metodo) => {
        mockRef.get.mockResolvedValue({ exists: false });

        await expect(repositorio[metodo]("x", {})).rejects.toThrow(
          "Estatísticas não encontradas"
        );
      }
    );

    it("deleta as da etapa e conta", async () => {
      mockGet.mockResolvedValueOnce({ empty: true, docs: [] });
      expect(await repositorio.deletarPorEtapa("e1", "a1")).toBe(0);

      mockGet.mockResolvedValueOnce({
        empty: false,
        size: 2,
        docs: [doc("a"), doc("b")],
      });
      expect(await repositorio.deletarPorEtapa("e1", "a1")).toBe(2);
      expect(mockBatch.delete.mock.calls).toEqual([["a"], ["b"]]);
    });
  });
});
