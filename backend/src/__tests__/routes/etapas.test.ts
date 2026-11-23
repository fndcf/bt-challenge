/**
 * Rotas de etapa: login, arena certa, conferência dos dados e erros
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

// Quem chama vem no cabeçalho
jest.mock("../../middlewares/auth", () => ({
  requireAuth: (
    req: express.Request & { user?: object },
    _res: express.Response,
    next: express.NextFunction
  ) => {
    const arenaId = req.headers["x-arena"];
    if (arenaId) req.user = { uid: "u1", arenaId };
    next();
  },
}));

import express from "express";
import { Server } from "http";
import { AddressInfo } from "net";
import rotas from "../../routes/etapas";
import chaveService from "../../services/ChaveService";
import desempateService from "../../services/DesempateService";
import encerramentoService from "../../services/EncerramentoService";
import etapaService from "../../services/EtapaService";
import { DuplaFixaFormato } from "../../services/formatos/DuplaFixaFormato";
import reiDaPraiaService from "../../services/ReiDaPraiaService";
import superXService from "../../services/SuperXService";
import teamsService from "../../services/TeamsService";
import { ValidationError } from "../../utils/errors";
import { createEtapaFixture } from "../fixtures";

describe("rotas de etapa", () => {
  let servidor: Server;

  const chamar = async (
    metodo: string,
    caminho: string,
    corpo: object = {},
    arena = "a1"
  ) => {
    const { port } = servidor.address() as AddressInfo;
    const resposta = await fetch(`http://127.0.0.1:${port}${caminho}`, {
      method: metodo,
      headers: { "content-type": "application/json", "x-arena": arena },
      ...(metodo !== "GET" && { body: JSON.stringify(corpo) }),
    });
    const texto = await resposta.text();
    return { status: resposta.status, corpo: JSON.parse(texto) };
  };

  beforeAll((pronto) => {
    servidor = express()
      .use(express.json())
      .use(rotas)
      .listen(0, "127.0.0.1", () => pronto());
  });

  afterAll((pronto) => {
    servidor.close(pronto);
  });

  beforeEach(() => {
    jest.restoreAllMocks();
    // A etapa e1 é da arena a1
    jest
      .spyOn(etapaService, "buscarPorId")
      .mockImplementation(async (id, arenaId) =>
        id === "e1" && arenaId === "a1"
          ? createEtapaFixture({ id: "e1", arenaId: "a1" })
          : null
      );
  });

  // Toda rota que grava numa etapa, tirada do próprio roteador: rota nova
  // entra aqui sozinha
  const gravacoes = rotas.stack.flatMap(({ route }) =>
    route && String(route.path).startsWith("/:id")
      ? Object.keys(
          (route as unknown as { methods: Record<string, boolean> }).methods
        )
          .filter((metodo) => metodo !== "get")
          .map((metodo) => [
            metodo.toUpperCase(),
            String(route.path).replace(/:(\w+)/g, "$1"),
          ])
      : []
  );

  it("encontra as rotas que gravam", () => {
    expect(gravacoes.length).toBeGreaterThan(30);
  });

  it.each(gravacoes)("%s %s: etapa de outra arena não existe", async (metodo, caminho) => {
    const resposta = await chamar(
      metodo,
      caminho.replace("/id", "/e1"),
      {},
      "outra"
    );

    expect(resposta).toEqual({
      status: 404,
      corpo: { success: false, error: "Etapa não encontrada" },
    });
    expect(etapaService.buscarPorId).toHaveBeenCalledWith("e1", "outra");
  });

  it.each([
    ["GET", "/"],
    ["GET", "/e1"],
    ["POST", "/e1/encerrar"],
    ["DELETE", "/e1/teams/cancelar"],
  ])("%s %s exige login", async (metodo, caminho) => {
    expect((await chamar(metodo, caminho, {}, "")).status).toBe(401);
  });

  describe("confere os dados antes de chamar o service", () => {
    it.each([
      ["/e1/inscrever-lote", {}, "jogadorIds deve ser um array não vazio"],
      ["/e1/formar-duplas-manual", { formacoes: [] }, "Formações de duplas são obrigatórias"],
      ["/e1/desempate", { grupoId: "g", ids: ["a"], modo: "manual" }, "Dados de desempate inválidos"],
      ["/e1/desempate", { grupoId: "g", ids: ["a", "b"], modo: "outro" }, "Dados de desempate inválidos"],
      ["/e1/substituir-jogador", { jogadorAntigoId: "a" }, "jogadorAntigoId e jogadorNovoId são obrigatórios"],
      ["/e1/rei-da-praia/resultados-lote", { resultados: [] }, "Lista de resultados inválida"],
      ["/e1/super-x/resultados-lote", { resultados: [{ placar: [{}] }] }, "partidaId é obrigatório em cada resultado"],
      ["/e1/super-x/resultados-lote", { resultados: [{ partidaId: "p1", placar: [1, 2, 3, 4] }] }, "Placar deve ter entre 1 e 3 sets para partida p1"],
      ["/e1/teams/resultados-lote", {}, "É necessário enviar ao menos um resultado"],
      ["/e1/teams/partidas/p1/definir-jogadores", { dupla1JogadorIds: ["a", "b"], dupla2JogadorIds: ["c"] }, "dupla1JogadorIds e dupla2JogadorIds devem ser arrays com 2 IDs cada"],
    ])("%s %j", async (caminho, corpo, erro) => {
      expect(await chamar("POST", caminho, corpo)).toEqual({
        status: 400,
        corpo: { success: false, error: erro },
      });
    });

    it("cadastro inválido explica os campos", async () => {
      const { status, corpo } = await chamar("POST", "/", {});

      expect(status).toBe(422);
      expect(corpo.error).toBe("Dados inválidos");
      expect(corpo.details.length).toBeGreaterThan(0);
    });
  });

  describe("erros", () => {
    const encerrar = (erro: Error) => {
      jest
        .spyOn(encerramentoService, "encerrarEtapa")
        .mockRejectedValue(erro);
      return chamar("POST", "/e1/encerrar");
    };

    it("regra de negócio vai para quem chamou", async () => {
      expect(await encerrar(new Error("Etapa já está finalizada"))).toEqual({
        status: 400,
        corpo: { success: false, error: "Etapa já está finalizada" },
      });
    });

    it("erro da aplicação usa a própria mensagem e status", async () => {
      expect(await encerrar(new ValidationError("Mensagem própria"))).toEqual({
        status: 422,
        corpo: { success: false, error: "Mensagem própria" },
      });
    });

    it("erro inesperado não mostra detalhes", async () => {
      expect(await encerrar(new Error("falha no banco"))).toEqual({
        status: 500,
        corpo: { success: false, error: "Erro ao encerrar etapa" },
      });
    });

    it("consulta que falha não expõe a mensagem interna", async () => {
      jest
        .spyOn(chaveService, "buscarGrupos")
        .mockRejectedValue(new Error("índice já não existe"));

      expect(await chamar("GET", "/e1/grupos")).toEqual({
        status: 500,
        corpo: { success: false, error: "Erro ao buscar grupos" },
      });
    });
  });

  it("resolver empate grava a decisão e reaplica a classificação", async () => {
    const decisao = { modo: "manual" as const, participantes: [] };
    const definir = jest
      .spyOn(desempateService, "definirDesempate")
      .mockResolvedValue(decisao);
    const reaplicar = jest
      .spyOn(DuplaFixaFormato.prototype, "reaplicarClassificacao")
      .mockResolvedValue();

    const { status, corpo } = await chamar("POST", "/e1/desempate", {
      grupoId: "g1",
      ids: ["b", "a"],
      modo: "manual",
    });

    expect(status).toBe(200);
    expect(corpo.data).toEqual(decisao);
    expect(definir).toHaveBeenCalledWith("e1", "g1", ["b", "a"], "manual");
    expect(reaplicar).toHaveBeenCalledWith(
      expect.objectContaining({ id: "e1" }),
      "g1"
    );
  });

  it("partidas de confronto de outra arena não aparecem", async () => {
    const buscar = jest
      .spyOn(teamsService, "buscarConfronto")
      .mockResolvedValue(null);
    const partidas = jest.spyOn(teamsService, "buscarPartidasConfronto");

    const { status } = await chamar("GET", "/e1/teams/confrontos/c1/partidas");

    expect(status).toBe(404);
    expect(buscar).toHaveBeenCalledWith("c1", "e1", "a1");
    expect(partidas).not.toHaveBeenCalled();
  });

  it.each([
    ["Rei da Praia", "/e1/rei-da-praia/gerar-chaves", reiDaPraiaService, { jogadores: [1, 2], grupos: [1], partidas: [1, 2, 3] }, { jogadores: 2, grupos: 1, partidas: 3 }],
    ["Super X", "/e1/super-x/gerar-chaves", superXService, { jogadores: [1, 2], grupo: { id: "g" }, partidas: [1] }, { jogadores: 2, grupo: { id: "g" }, partidas: 1 }],
  ])("gerar chaves %s devolve as quantidades", async (_, caminho, service, gerado, esperado) => {
    jest
      .spyOn(service as unknown as { gerarChaves(): Promise<unknown> }, "gerarChaves")
      .mockResolvedValue(gerado);

    const { status, corpo } = await chamar("POST", caminho);

    expect(status).toBe(200);
    expect(corpo.data).toMatchObject(esperado);
  });
});
