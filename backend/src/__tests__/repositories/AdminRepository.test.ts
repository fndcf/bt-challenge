/**
 * O que o AdminRepository lê e grava no Firestore
 */

jest.mock("../../utils/logger", () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

const mockRef = { get: jest.fn(), set: jest.fn(), update: jest.fn() };
const mockDoc = jest.fn(() => mockRef);

jest.mock("../../config/firebase", () => ({
  db: { collection: jest.fn(() => ({ doc: mockDoc })) },
}));

import { AdminRepository } from "../../repositories/firebase/AdminRepository";

describe("AdminRepository", () => {
  let repositorio: AdminRepository;
  const existe = (dados: object) => ({ exists: true, data: () => dados });

  beforeEach(() => {
    jest.clearAllMocks();
    repositorio = new AdminRepository();
  });

  it("cria o admin no documento do uid, com a primeira arena", async () => {
    await repositorio.criar({ uid: "u1", email: "a@t.com", arenaId: "a1" });

    expect(mockDoc).toHaveBeenCalledWith("u1");
    expect(mockRef.set).toHaveBeenCalledWith({
      uid: "u1",
      email: "a@t.com",
      arenaId: "a1",
      role: "admin",
      createdAt: expect.any(Date),
    });
  });

  it.each([
    ["várias arenas", { arenaIds: ["a1", "a2"], arenaId: "a1" }, ["a1", "a2"]],
    ["cadastro antigo, só arenaId", { arenaId: "a1" }, ["a1"]],
    ["nenhuma arena", {}, []],
  ])("entrega sempre a lista de arenas: %s", async (_, dados, esperado) => {
    mockRef.get.mockResolvedValue(existe(dados));

    expect((await repositorio.buscarPorUid("u1"))?.arenaIds).toEqual(esperado);
  });

  it("retorna null se o admin não existe", async () => {
    mockRef.get.mockResolvedValue({ exists: false });

    expect(await repositorio.buscarPorUid("u1")).toBeNull();
  });

  it("troca a arena padrão sem mexer na lista", async () => {
    await repositorio.definirArenaPadrao("u1", "a2");

    expect(mockRef.update).toHaveBeenCalledWith({ defaultArenaId: "a2" });
  });

  it("troca a arena padrão e a lista", async () => {
    await repositorio.definirArenaPadrao("u1", "a2", ["a1", "a2"]);

    expect(mockRef.update).toHaveBeenCalledWith({
      defaultArenaId: "a2",
      arenaIds: ["a1", "a2"],
    });
  });
});
