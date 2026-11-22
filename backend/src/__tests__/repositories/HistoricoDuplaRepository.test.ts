/**
 * O que o HistoricoDuplaRepository grava no Firestore
 */

jest.mock("../../utils/logger", () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

const mockGet = jest.fn();
const mockConsulta = {
  where: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  get: mockGet,
};
const mockBatch = { set: jest.fn(), delete: jest.fn(), commit: jest.fn() };
const mockDoc = jest.fn();

jest.mock("../../config/firebase", () => ({
  db: {
    collection: jest.fn(() => ({ ...mockConsulta, doc: mockDoc })),
    batch: jest.fn(() => mockBatch),
  },
}));

import { Timestamp } from "firebase-admin/firestore";
import { HistoricoDuplaRepository } from "../../repositories/firebase/HistoricoDuplaRepository";

describe("HistoricoDuplaRepository", () => {
  let repositorio: HistoricoDuplaRepository;
  const item = {
    arenaId: "a1",
    etapaId: "e1",
    etapaNome: "Etapa",
    jogador1Id: "j1",
    jogador1Nome: "Um",
    jogador2Id: "j2",
    jogador2Nome: "Dois",
    chaveNormalizada: "j1_j2",
    ambosForamCabecas: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    repositorio = new HistoricoDuplaRepository();
  });

  it("grava todos num lote só, com o mesmo horário", async () => {
    mockDoc.mockReturnValueOnce({ id: "h1" }).mockReturnValueOnce({ id: "h2" });

    const criados = await repositorio.criarEmLote([item, item]);

    expect(criados.map((h) => h.id)).toEqual(["h1", "h2"]);
    expect(mockBatch.set).toHaveBeenCalledTimes(2);
    expect(mockBatch.set).toHaveBeenCalledWith(
      { id: "h1" },
      { ...item, criadoEm: expect.any(Timestamp) }
    );
    expect(criados[0].criadoEm).toBe(criados[1].criadoEm);
    expect(mockBatch.commit).toHaveBeenCalledTimes(1);
  });

  it("deleta os da etapa na arena e conta", async () => {
    mockGet.mockResolvedValue({
      empty: false,
      size: 2,
      docs: [{ ref: "h1" }, { ref: "h2" }],
    });

    expect(await repositorio.deletarPorEtapa("e1", "a1")).toBe(2);
    expect(mockConsulta.where.mock.calls).toEqual([
      ["arenaId", "==", "a1"],
      ["etapaId", "==", "e1"],
    ]);
    expect(mockBatch.delete.mock.calls).toEqual([["h1"], ["h2"]]);
  });

  it("não grava nada se não há histórico", async () => {
    mockGet.mockResolvedValue({ empty: true, size: 0, docs: [] });

    expect(await repositorio.deletarPorEtapa("e1", "a1")).toBe(0);
    expect(mockBatch.commit).not.toHaveBeenCalled();
  });
});
