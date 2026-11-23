/**
 * Testes do EstatisticasJogadorService
 */

jest.mock("../../utils/logger", () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

jest.mock("../../config/firebase", () => ({
  db: { collection: jest.fn() },
}));

import { EstatisticasJogadorService } from "../../services/EstatisticasJogadorService";
import logger from "../../utils/logger";
import {
  grupoDaPartida,
  inverter,
  totaisDaPartida,
} from "../../utils/estatisticas";
import {
  createMockEstatisticasRepository,
  createMockEtapaRepository,
} from "../mocks/repositories";

describe("EstatisticasJogadorService", () => {
  const repo = createMockEstatisticasRepository();
  const etapas = createMockEtapaRepository();
  const service = new EstatisticasJogadorService(repo, etapas);

  const dto = {
    venceu: true,
    setsVencidos: 1,
    setsPerdidos: 0,
    gamesVencidos: 6,
    gamesPerdidos: 4,
  };
  const totais = totaisDaPartida(dto);
  const grupo = grupoDaPartida(dto);

  beforeEach(() => {
    jest.resetAllMocks();
    repo.buscarPorJogadorEEtapa.mockImplementation(async (jogadorId: string) =>
      jogadorId === "sem-estatistica" ? null : { id: `est-${jogadorId}` }
    );
  });

  describe("criar", () => {
    const novo = {
      etapaId: "e1",
      arenaId: "a1",
      jogadorId: "j1",
      jogadorNome: "Um",
    };

    it("cria um ou vários", async () => {
      repo.criar.mockResolvedValue({ id: "est-1" });
      repo.criarEmLote.mockResolvedValue([{ id: "est-1" }, { id: "est-2" }]);

      expect(await service.criar(novo)).toEqual({ id: "est-1" });
      expect(await service.criarEmLote([novo, novo])).toHaveLength(2);
      expect(repo.criar).toHaveBeenCalledWith(novo);
      expect(repo.criarEmLote).toHaveBeenCalledWith([novo, novo]);
    });

    it("propaga o erro", async () => {
      repo.criar.mockRejectedValue(new Error("banco"));
      repo.criarEmLote.mockRejectedValue(new Error("banco"));

      await expect(service.criar(novo)).rejects.toThrow("banco");
      await expect(service.criarEmLote([novo])).rejects.toThrow("banco");
      expect(logger.error).toHaveBeenCalledTimes(2);
    });
  });

  describe("buscar", () => {
    it("vários jogadores da etapa, por id do jogador", async () => {
      repo.buscarPorJogadoresDaEtapa.mockResolvedValue([
        { id: "est-1", jogadorId: "j1" },
        { id: "est-2", jogadorId: "j2" },
      ]);

      const mapa = await service.buscarPorJogadoresEtapa(["j1", "j2"], "e1");

      expect(mapa.get("j2")).toEqual({ id: "est-2", jogadorId: "j2" });
      expect(mapa.get("j3")).toBeUndefined();
    });

    it("os 2 primeiros do grupo, por padrão", async () => {
      repo.buscarClassificados.mockResolvedValue([]);

      await service.buscarClassificados("g1");
      await service.buscarClassificados("g1", 4);

      expect(repo.buscarClassificados.mock.calls).toEqual([
        ["g1", 2],
        ["g1", 4],
      ]);
    });
  });

  describe("partida de um jogador", () => {
    // A soma é do banco: cancelar a eliminatória desfaz várias partidas do
    // mesmo jogador ao mesmo tempo, e nenhuma pode se perder
    it.each([
      ["atualizarAposPartida", totais],
      ["reverterAposPartida", inverter(totais)],
      ["atualizarAposPartidaEliminatoria", totais],
    ] as const)("%s soma nos totais", async (metodo, incrementos) => {
      await service[metodo]("j1", "e1", dto);

      expect(repo.buscarPorJogadorEEtapa).toHaveBeenCalledWith("j1", "e1");
      expect(repo.incrementarEmLote).toHaveBeenCalledWith([
        { id: "est-j1", incrementos },
      ]);
    });

    it("reverter a eliminatória não deixa contagem negativa, só saldo", async () => {
      repo.buscarPorJogadorEEtapa.mockResolvedValue({
        id: "est-j1",
        ...totais,
        jogos: 3,
        vitorias: 0,
        gamesVencidos: 2,
        saldoGames: 1,
      });

      await service.reverterAposPartidaEliminatoria("j1", "e1", dto);

      expect(repo.atualizarEmLote).toHaveBeenCalledWith([
        {
          id: "est-j1",
          dados: {
            jogos: 2,
            vitorias: 0,
            derrotas: 0,
            setsVencidos: 0,
            setsPerdidos: 0,
            saldoSets: 0,
            gamesVencidos: 0,
            gamesPerdidos: 0,
            saldoGames: -1,
          },
        },
      ]);
    });
  });

  describe("partidas em lote", () => {
    const itens = [{ estatisticaId: "est-1", dto }];

    it.each([
      ["atualizarAposPartidaComIncrement", totais],
      ["reverterTotaisComIncrement", inverter(totais)],
      ["atualizarAposPartidaGrupoComIncrement", { ...grupo, ...totais }],
      [
        "reverterAposPartidaComIncrement",
        inverter({ ...grupo, ...totais }),
      ],
    ] as const)("%s", async (metodo, incrementos) => {
      await service[metodo](itens);

      expect(repo.incrementarEmLote).toHaveBeenCalledWith([
        { id: "est-1", incrementos },
      ]);
    });

    it.each([
      "atualizarAposPartidaComIncrement",
      "reverterTotaisComIncrement",
      "atualizarAposPartidaGrupoComIncrement",
      "reverterAposPartidaComIncrement",
    ] as const)("%s propaga o erro", async (metodo) => {
      repo.incrementarEmLote.mockRejectedValue(new Error("banco"));

      await expect(service[metodo](itens)).rejects.toThrow("banco");
    });
  });

  describe("grupo e classificação", () => {
    it("grupo pelo id da estatística", async () => {
      await service.atualizarGrupoEmLotePorId([
        { estatisticaId: "est-1", grupoId: "g1", grupoNome: "Grupo A" },
      ]);

      expect(repo.atualizarEmLote).toHaveBeenCalledWith([
        { id: "est-1", dados: { grupoId: "g1", grupoNome: "Grupo A" } },
      ]);
    });

    it("grupo pelo id do jogador, pulando quem não tem estatística", async () => {
      const item = (jogadorId: string, grupoId: string) => ({
        jogadorId,
        etapaId: "e1",
        grupoId,
        grupoNome: grupoId,
      });

      await service.atualizarGrupoEmLote([
        item("j1", "g1"),
        item("sem-estatistica", "g2"),
        item("j2", "g3"),
      ]);

      expect(repo.atualizarEmLote).toHaveBeenCalledWith([
        { id: "est-j1", dados: { grupoId: "g1", grupoNome: "g1" } },
        { id: "est-j2", dados: { grupoId: "g3", grupoNome: "g3" } },
      ]);
    });

    it("posição de vários e de um", async () => {
      await service.atualizarPosicoesGrupoEmLote([
        { estatisticaId: "est-1", posicaoGrupo: 2 },
      ]);
      await service.atualizarPosicaoGrupo("j1", "e1", 1);

      expect(repo.atualizarEmLote.mock.calls).toEqual([
        [[{ id: "est-1", dados: { posicaoGrupo: 2 } }]],
        [[{ id: "est-j1", dados: { posicaoGrupo: 1 } }]],
      ]);
    });

    it.each([true, false])("marca classificado: %s", async (classificado) => {
      await service.marcarComoClassificado("j1", "e1", classificado);

      expect(repo.atualizarEmLote).toHaveBeenCalledWith([
        { id: "est-j1", dados: { classificado } },
      ]);
    });

    it("marca vários, avisando de quem não tem estatística", async () => {
      await service.marcarComoClassificadoEmLote(
        [
          { jogadorId: "j1", etapaId: "e1" },
          { jogadorId: "sem-estatistica", etapaId: "e1" },
        ],
        true
      );

      expect(repo.atualizarEmLote).toHaveBeenCalledWith([
        { id: "est-j1", dados: { classificado: true } },
      ]);
      expect(logger.warn).toHaveBeenCalled();
    });
  });

  describe("jogador sem estatística ou com falha", () => {
    const operacoes: [string, (jogadorId: string) => Promise<void>][] = [
      ["atualizar", (j) => service.atualizarAposPartida(j, "e1", dto)],
      ["reverter", (j) => service.reverterAposPartida(j, "e1", dto)],
      [
        "atualizar eliminatória",
        (j) => service.atualizarAposPartidaEliminatoria(j, "e1", dto),
      ],
      [
        "reverter eliminatória",
        (j) => service.reverterAposPartidaEliminatoria(j, "e1", dto),
      ],
      ["posição", (j) => service.atualizarPosicaoGrupo(j, "e1", 1)],
      ["classificado", (j) => service.marcarComoClassificado(j, "e1", true)],
    ];

    it.each(operacoes)("%s: não grava e avisa", async (_, operacao) => {
      await operacao("sem-estatistica");

      expect(repo.incrementarEmLote).not.toHaveBeenCalled();
      expect(repo.atualizarEmLote).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledTimes(1);
    });

    it.each(operacoes)("%s: propaga o erro do banco", async (_, operacao) => {
      repo.incrementarEmLote.mockRejectedValue(new Error("banco"));
      repo.atualizarEmLote.mockRejectedValue(new Error("banco"));

      await expect(operacao("j1")).rejects.toThrow("banco");
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe("ranking", () => {
    const est = (jogadorId: string, etapaId: string, pontos: number, x = {}) => ({
      jogadorId,
      jogadorNome: jogadorId,
      jogadorNivel: "avancado",
      arenaId: "a1",
      etapaId,
      pontos,
      ...x,
    });

    beforeEach(() => {
      etapas.buscarIdsQueContamPontos.mockResolvedValue(new Set(["conta"]));
    });

    it("do nível, só com pontos das etapas que contam", async () => {
      repo.buscarPorArena.mockResolvedValue([
        est("j1", "conta", 10),
        est("j1", "nao", 99),
        est("j2", "conta", 20),
      ]);

      const ranking = await service.buscarRankingPorNivel("a1", "avancado");

      expect(repo.buscarPorArena).toHaveBeenCalledWith("a1", "avancado");
      expect(ranking.map((j) => [j.jogadorId, j.pontos])).toEqual([
        ["j2", 20],
        ["j1", 10],
      ]);
    });

    it("limita a 50, ou ao pedido", async () => {
      repo.buscarPorArena.mockResolvedValue(
        Array.from({ length: 60 }, (_, i) => est(`j${i}`, "conta", i))
      );

      expect(await service.buscarRankingPorNivel("a1", "avancado")).toHaveLength(50);
      expect(await service.buscarRankingPorNivel("a1", "avancado", 3)).toHaveLength(3);
      expect(await service.buscarRankingGlobalAgregado("a1")).toHaveLength(50);
      expect(await service.buscarRankingGlobalAgregado("a1", 999)).toHaveLength(60);
    });

    it("global soma os pontos de todas as etapas", async () => {
      repo.buscarPorArena.mockResolvedValue([
        est("j1", "conta", 10),
        est("j1", "nao", 99),
      ]);

      const [jogador] = await service.buscarRankingGlobalAgregado("a1");

      expect(repo.buscarPorArena).toHaveBeenCalledWith("a1");
      expect(jogador.pontos).toBe(109);
    });

    it("totais do jogador no nível, com a posição", async () => {
      repo.buscarPorJogador.mockResolvedValue([
        est("j1", "conta", 10, { setsVencidos: 3, setsPerdidos: 1 }),
        est("j1", "nao", 99, { gamesVencidos: 5, gamesPerdidos: 9 }),
        est("j1", "conta", 500, { jogadorNivel: "iniciante" }),
      ]);
      repo.buscarPorArena.mockResolvedValue([
        est("j1", "conta", 10),
        est("j2", "conta", 20),
      ]);

      expect(
        await service.buscarEstatisticasAgregadasPorNivel("j1", "a1", "avancado")
      ).toMatchObject({
        jogadorId: "j1",
        arenaId: "a1",
        nivel: "avancado",
        etapasParticipadas: 2,
        pontos: 10,
        saldoSets: 2,
        saldoGames: -4,
        posicaoRanking: 2,
      });
    });

    it("totais do jogador em todos os níveis", async () => {
      repo.buscarPorJogador.mockResolvedValue([
        est("j1", "conta", 10),
        est("j1", "nao", 99, { jogadorNivel: "iniciante" }),
      ]);
      repo.buscarPorArena.mockResolvedValue([est("j2", "conta", 1)]);

      expect(
        await service.buscarEstatisticasAgregadas("j1", "a1")
      ).toMatchObject({ pontos: 109, posicaoRanking: 0 });
    });

    it("null para quem não tem estatísticas", async () => {
      repo.buscarPorJogador.mockResolvedValue([
        est("j1", "conta", 1, { jogadorNivel: "iniciante" }),
      ]);
      expect(
        await service.buscarEstatisticasAgregadasPorNivel("j1", "a1", "avancado")
      ).toBeNull();

      repo.buscarPorJogador.mockResolvedValue([]);
      expect(await service.buscarEstatisticasAgregadas("j1", "a1")).toBeNull();
    });
  });
});
