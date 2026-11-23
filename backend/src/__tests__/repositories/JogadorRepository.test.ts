/**
 * O que o JogadorRepository grava no Firestore
 */

jest.mock("../../utils/logger", () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

const mockBatch = { set: jest.fn(), delete: jest.fn(), commit: jest.fn() };
const mockAdd = jest.fn();
const mockGet = jest.fn();
const mockRef = { id: "novo", get: jest.fn(), update: jest.fn() };
const mockDoc = jest.fn(() => mockRef);

jest.mock("../../config/firebase", () => ({
  db: {
    collection: jest.fn(() => ({
      add: mockAdd,
      doc: mockDoc,
      where: jest.fn(() => ({ get: mockGet })),
    })),
    batch: jest.fn(() => mockBatch),
  },
}));

import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { JogadorRepository } from "../../repositories/firebase/JogadorRepository";
import { GeneroJogador, NivelJogador, StatusJogador } from "../fixtures";

describe("JogadorRepository", () => {
  let repositorio: JogadorRepository;
  const item = {
    nome: " Ana Paula ",
    email: " ANA@test.com ",
    telefone: "",
    genero: GeneroJogador.FEMININO,
    nivel: NivelJogador.AVANCADO,
    status: StatusJogador.ATIVO,
    arenaId: "a1",
    criadoPor: "u1",
  };
  const gravado = {
    arenaId: "a1",
    nome: "Ana Paula",
    email: "ana@test.com",
    telefone: undefined,
    dataNascimento: undefined,
    genero: GeneroJogador.FEMININO,
    nivel: NivelJogador.AVANCADO,
    status: StatusJogador.ATIVO,
    observacoes: undefined,
    vitorias: 0,
    derrotas: 0,
    pontos: 0,
    criadoEm: expect.any(Timestamp),
    atualizadoEm: expect.any(Timestamp),
    criadoPor: "u1",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAdd.mockResolvedValue({ id: "novo" });
    repositorio = new JogadorRepository();
  });

  it("criar e criarEmLote gravam o jogador do mesmo jeito", async () => {
    await repositorio.criar(item);
    const [criado] = await repositorio.criarEmLote([item]);

    expect(mockAdd).toHaveBeenCalledWith(gravado);
    expect(mockBatch.set).toHaveBeenCalledWith(mockRef, gravado);
    expect(criado).toEqual({ id: "novo", ...gravado });
  });

  it("atualizar grava só o que veio, e vazio apaga o campo opcional", async () => {
    mockRef.get.mockResolvedValue({ id: "j1", exists: true, data: () => ({}) });
    const apagar = FieldValue.delete();

    await repositorio.atualizar("j1", {
      nome: " Ana ",
      email: "",
      telefone: "   ",
      dataNascimento: "",
      observacoes: " nota ",
    });

    expect(mockRef.update).toHaveBeenCalledWith({
      nome: "Ana",
      email: apagar,
      telefone: apagar,
      dataNascimento: apagar,
      observacoes: "nota",
      atualizadoEm: expect.any(Timestamp),
    });
  });

  it.each([
    ["ana@test", undefined, 1],
    ["9999", undefined, 1],
    ["ana@test", true, 0],
    ["9999", true, 0],
    ["paula", true, 1],
  ])("busca %s (só nome: %s) encontra %i", async (busca, buscaSoNome, total) => {
    mockGet.mockResolvedValue({
      docs: [
        {
          id: "j1",
          data: () => ({
            nome: "Ana Paula",
            email: "ana@test.com",
            telefone: "11999998888",
          }),
        },
      ],
    });

    const lista = await repositorio.listar({ arenaId: "a1", busca, buscaSoNome });

    expect(lista.total).toBe(total);
  });

  it("criarEmLote divide em lotes de 500", async () => {
    const criados = await repositorio.criarEmLote(Array(501).fill(item));

    expect(criados).toHaveLength(501);
    expect(mockBatch.set).toHaveBeenCalledTimes(501);
    expect(mockBatch.commit).toHaveBeenCalledTimes(2);
  });
});
