/**
 * O que o EtapaRepository grava no Firestore
 */

jest.mock("../../utils/logger", () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

const mockUpdate = jest.fn();
const mockAdd = jest.fn();
const mockGet = jest.fn();

jest.mock("../../config/firebase", () => ({
  db: {
    collection: jest.fn(() => ({
      add: mockAdd,
      where: jest.fn(() => ({ get: mockGet })),
      doc: jest.fn(() => ({ update: mockUpdate })),
    })),
  },
}));

import { FieldPath, FieldValue, Timestamp } from "firebase-admin/firestore";
import { EmpatePendente, StatusEtapa } from "../../models/Etapa";
import { EtapaRepository } from "../../repositories/firebase/EtapaRepository";

const empate: EmpatePendente = {
  grupoId: "A",
  grupoNome: "Grupo A",
  posicaoInicial: 1,
  participantes: [
    { id: "1", nome: "Um" },
    { id: "2", nome: "Dois" },
  ],
};

describe("EtapaRepository", () => {
  let repositorio: EtapaRepository;
  const agora = expect.any(Timestamp);
  const apagar = FieldValue.delete();

  beforeEach(() => {
    jest.clearAllMocks();
    mockAdd.mockResolvedValue({ id: "nova" });
    repositorio = new EtapaRepository();
  });

  describe("marcarChavesGeradas", () => {
    it("ao gerar, marca a data e o status", async () => {
      await repositorio.marcarChavesGeradas("e1", true);

      expect(mockUpdate).toHaveBeenCalledWith({
        chavesGeradas: true,
        dataGeracaoChaves: agora,
        status: StatusEtapa.CHAVES_GERADAS,
        atualizadoEm: agora,
      });
    });

    it("ao desfazer, volta para inscrições encerradas, numa gravação só", async () => {
      await repositorio.marcarChavesGeradas("e1", false);

      expect(mockUpdate).toHaveBeenCalledTimes(1);
      expect(mockUpdate).toHaveBeenCalledWith({
        chavesGeradas: false,
        dataGeracaoChaves: null,
        status: StatusEtapa.INSCRICOES_ENCERRADAS,
        atualizadoEm: agora,
      });
    });
  });

  describe("definirInscritos", () => {
    it("troca a lista sem mexer no total (substituição)", async () => {
      await repositorio.definirInscritos("e1", ["a", "b"]);

      expect(mockUpdate).toHaveBeenCalledWith({
        jogadoresInscritos: ["a", "b"],
        atualizadoEm: agora,
      });
    });

    it("grava o total quando informado, inclusive zero", async () => {
      await repositorio.definirInscritos("e1", [], 0);

      expect(mockUpdate).toHaveBeenCalledWith({
        jogadoresInscritos: [],
        totalInscritos: 0,
        atualizadoEm: agora,
      });
    });
  });

  describe("desempates", () => {
    const pendentesDe = (grupo: string) =>
      new FieldPath("empatesPendentes", grupo);
    const desempatesDe = (grupo: string) => new FieldPath("desempates", grupo);

    it("grava os pendentes do grupo e apaga quando não sobra nenhum", async () => {
      await repositorio.salvarEmpatesPendentes("e1", "A", [empate]);
      await repositorio.salvarEmpatesPendentes("e1", "A", []);

      expect(mockUpdate.mock.calls).toEqual([
        [pendentesDe("A"), [empate], "atualizadoEm", agora],
        [pendentesDe("A"), apagar, "atualizadoEm", agora],
      ]);
    });

    it("grava a decisão e o que falta decidir", async () => {
      const decisao = { ids: ["2", "1"], modo: "manual" as const };
      await repositorio.salvarDesempates("e1", "A", [decisao], []);

      expect(mockUpdate).toHaveBeenCalledWith(
        desempatesDe("A"),
        [decisao],
        pendentesDe("A"),
        apagar,
        "atualizadoEm",
        agora
      );
    });

    it("limpa tudo da etapa", async () => {
      await repositorio.limparDesempates("e1");

      expect(mockUpdate).toHaveBeenCalledWith({
        empatesPendentes: apagar,
        desempates: apagar,
      });
    });

    it("limpa só os grupos pedidos, com ou sem as decisões", async () => {
      await repositorio.limparEmpatesDosGrupos("e1", ["A", "B"]);
      await repositorio.limparEmpatesDosGrupos("e1", ["A"], true);

      const inicio = [new FieldPath("atualizadoEm"), agora];
      expect(mockUpdate.mock.calls).toEqual([
        [...inicio, pendentesDe("A"), apagar, pendentesDe("B"), apagar],
        [...inicio, pendentesDe("A"), apagar, desempatesDe("A"), apagar],
      ]);
    });
  });

  it("conta pontos a etapa marcada ou antiga, sem o campo", async () => {
    const doc = (id: string, dados = {}) => ({ id, data: () => dados });
    mockGet.mockResolvedValue({
      docs: [
        doc("sim", { contaPontosRanking: true }),
        doc("nao", { contaPontosRanking: false }),
        doc("antiga"),
      ],
    });

    expect(await repositorio.buscarIdsQueContamPontos("a1")).toEqual(
      new Set(["sim", "antiga"])
    );
  });

  it("não grava a quantidade de grupos, que depende do formato", async () => {
    await repositorio.criar({
      arenaId: "a1",
      criadoPor: "u1",
      nome: "Etapa",
      genero: "masculino",
      formato: "rei_da_praia",
      maxJogadores: 16,
      jogadoresPorGrupo: 4,
    } as unknown as Parameters<EtapaRepository["criar"]>[0]);

    expect(mockAdd.mock.calls[0][0]).not.toHaveProperty("qtdGrupos");
  });
});
