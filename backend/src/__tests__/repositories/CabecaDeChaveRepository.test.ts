/**
 * O que o CabecaDeChaveRepository lê e grava no Firestore
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
const mockAdd = jest.fn();
const mockRef = { update: jest.fn(), delete: jest.fn() };
const mockDoc = jest.fn(() => mockRef);

jest.mock("../../config/firebase", () => ({
  db: {
    collection: jest.fn(() => ({ ...mockConsulta, add: mockAdd, doc: mockDoc })),
    batch: jest.fn(() => mockBatch),
  },
}));

import { Timestamp } from "firebase-admin/firestore";
import { CabecaDeChaveRepository } from "../../repositories/firebase/CabecaDeChaveRepository";

describe("CabecaDeChaveRepository", () => {
  let repositorio: CabecaDeChaveRepository;
  const agora = expect.any(Timestamp);
  const doc = (id: string, dados = {}) => ({ id, ref: id, data: () => dados });

  beforeEach(() => {
    jest.clearAllMocks();
    repositorio = new CabecaDeChaveRepository();
  });

  it("cria ativa, com as datas", async () => {
    mockAdd.mockResolvedValue({ id: "c1" });
    const dto = {
      arenaId: "a1",
      etapaId: "e1",
      jogadorId: "j1",
      jogadorNome: "Um",
      ordem: 2,
    };

    const criada = await repositorio.criar(dto);

    expect(criada).toMatchObject({ id: "c1", ...dto, ativo: true });
    expect(mockAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        ...dto,
        ativo: true,
        criadoEm: agora,
        atualizadoEm: agora,
      })
    );
  });

  it("busca só a ativa do jogador, na arena e na etapa", async () => {
    mockGet.mockResolvedValue({ empty: false, docs: [doc("c1", { ordem: 1 })] });

    expect(await repositorio.buscarPorJogador("a1", "e1", "j1")).toEqual({
      id: "c1",
      ordem: 1,
    });
    expect(mockConsulta.where.mock.calls).toEqual([
      ["arenaId", "==", "a1"],
      ["etapaId", "==", "e1"],
      ["jogadorId", "==", "j1"],
      ["ativo", "==", true],
    ]);
  });

  it("retorna null se o jogador não é cabeça", async () => {
    mockGet.mockResolvedValue({ empty: true, docs: [] });

    expect(await repositorio.buscarPorJogador("a1", "e1", "j1")).toBeNull();
  });

  it("lista as ativas na ordem", async () => {
    mockGet.mockResolvedValue({ docs: [doc("c1"), doc("c2")] });

    const lista = await repositorio.listarAtivas("a1", "e1");

    expect(lista.map((c) => c.id)).toEqual(["c1", "c2"]);
    expect(mockConsulta.orderBy).toHaveBeenCalledWith("ordem", "asc");
    expect(mockConsulta.where).toHaveBeenCalledWith("ativo", "==", true);
  });

  it("atualiza só os campos informados, inclusive ativo falso", async () => {
    await repositorio.atualizar("c1", { ordem: 3 });
    await repositorio.atualizar("c1", { ativo: false });

    expect(mockRef.update.mock.calls).toEqual([
      [{ ordem: 3, atualizadoEm: agora }],
      [{ ativo: false, atualizadoEm: agora }],
    ]);
  });

  it("deleta pelo id", async () => {
    await repositorio.deletar("c1");

    expect(mockDoc).toHaveBeenCalledWith("c1");
    expect(mockRef.delete).toHaveBeenCalled();
  });

  it("deleta todas da etapa e conta", async () => {
    mockGet.mockResolvedValue({
      empty: false,
      size: 2,
      docs: [doc("c1"), doc("c2")],
    });

    expect(await repositorio.deletarPorEtapa("e1", "a1")).toBe(2);
    expect(mockConsulta.where.mock.calls).toEqual([
      ["etapaId", "==", "e1"],
      ["arenaId", "==", "a1"],
    ]);
    expect(mockBatch.delete.mock.calls).toEqual([["c1"], ["c2"]]);
    expect(mockBatch.commit).toHaveBeenCalledTimes(1);
  });

  it("não grava nada se a etapa não tem cabeças", async () => {
    mockGet.mockResolvedValue({ empty: true, size: 0, docs: [] });

    expect(await repositorio.deletarPorEtapa("e1", "a1")).toBe(0);
    expect(mockBatch.commit).not.toHaveBeenCalled();
  });
});
