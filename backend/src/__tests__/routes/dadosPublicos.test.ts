/**
 * O que as rotas sem login devolvem: nada de contato nem de administrador
 */

jest.mock("../../utils/logger", () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

jest.mock("../../config/firebase", () => ({
  __esModule: true,
  default: {},
  auth: {},
  db: { collection: jest.fn() },
}));

import express from "express";
import { AddressInfo } from "net";
import { Server } from "http";
import { Arena } from "../../domain/Arena";
import routes from "../../routes";
import { arenaService } from "../../services/ArenaService";
import etapaService from "../../services/EtapaService";
import jogadorService from "../../services/JogadorService";
import { createEtapaFixture, createJogadorFixture } from "../fixtures";

const SIGILOSO = "nao-pode-aparecer";

describe("dados públicos", () => {
  let servidor: Server;

  const buscar = async (caminho: string) => {
    const { port } = servidor.address() as AddressInfo;
    const resposta = await fetch(`http://127.0.0.1:${port}${caminho}`);
    return { status: resposta.status, texto: await resposta.text() };
  };

  beforeAll((pronto) => {
    servidor = express().use(routes).listen(0, "127.0.0.1", () => pronto());
  });

  afterAll((pronto) => {
    servidor.close(pronto);
  });

  beforeEach(() => {
    const arena = new Arena({
      id: "a1",
      nome: "Arena Um",
      slug: "arena-um",
      adminEmail: SIGILOSO,
      adminUid: SIGILOSO,
      ativa: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const jogador = createJogadorFixture({
      id: "j1",
      nome: "Ana Paula",
      email: SIGILOSO,
      telefone: SIGILOSO,
      dataNascimento: SIGILOSO,
      observacoes: SIGILOSO,
      criadoPor: SIGILOSO,
    });
    const etapa = createEtapaFixture({
      id: "e1",
      nome: "Etapa Um",
      criadoPor: SIGILOSO,
    });

    jest.spyOn(arenaService, "getArenaBySlug").mockResolvedValue(arena);
    jest.spyOn(arenaService, "getArenaById").mockResolvedValue(arena);
    jest.spyOn(arenaService, "listArenas").mockResolvedValue([arena]);
    jest.spyOn(jogadorService, "buscarPorId").mockResolvedValue(jogador);
    jest.spyOn(jogadorService, "listar").mockResolvedValue({
      jogadores: [jogador],
      total: 1,
      limite: 50,
      offset: 0,
      temMais: false,
    });
    jest.spyOn(etapaService, "buscarPorId").mockResolvedValue(etapa);
    jest.spyOn(etapaService, "listar").mockResolvedValue({
      etapas: [etapa],
      total: 1,
      limite: 20,
      offset: 0,
      temMais: false,
    });
  });

  it.each([
    ["/arenas", "Arena Um"],
    ["/arenas/a1", "Arena Um"],
    ["/arenas/slug/arena-um", "Arena Um"],
    ["/public/arena-um", "Arena Um"],
    ["/public/arena-um/jogadores", "Ana Paula"],
    ["/public/arena-um/jogadores/j1", "Ana Paula"],
    ["/public/arena-um/etapas", "Etapa Um"],
    ["/public/arena-um/etapas/e1", "Etapa Um"],
  ])("%s", async (caminho, esperado) => {
    const { status, texto } = await buscar(caminho);

    expect(status).toBe(200);
    expect(texto).toContain(esperado);
    expect(texto).not.toContain(SIGILOSO);
  });

  it("jogador público tem só estes campos", async () => {
    const { texto } = await buscar("/public/arena-um/jogadores/j1");

    expect(Object.keys(JSON.parse(texto).data).sort()).toEqual([
      "derrotas",
      "genero",
      "id",
      "nivel",
      "nome",
      "pontos",
      "status",
      "vitorias",
    ]);
  });

  it("a busca pública não procura por email nem telefone", async () => {
    await buscar("/public/arena-um/jogadores?busca=ana");

    expect(jogadorService.listar).toHaveBeenCalledWith(
      expect.objectContaining({ busca: "ana", buscaSoNome: true })
    );
  });

  it.each(["/arenas/me", "/arenas/mine", "/jogadores", "/jogadores/j1", "/etapas", "/etapas/e1"])(
    "%s exige login",
    async (caminho) => {
      expect((await buscar(caminho)).status).not.toBe(200);
    }
  );
});
