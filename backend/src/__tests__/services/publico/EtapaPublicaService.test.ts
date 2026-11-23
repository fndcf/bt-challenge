/**
 * Testes do EtapaPublicaService
 */

jest.mock("../../../utils/logger", () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

jest.mock("../../../config/firebase", () => ({
  db: { collection: jest.fn() },
}));

import { Timestamp } from "firebase-admin/firestore";
import { Etapa } from "../../../models/Etapa";
import { IPartidaTeamsRepository } from "../../../repositories/interfaces/IPartidaTeamsRepository";
import { EtapaPublicaService } from "../../../services/publico/EtapaPublicaService";
import {
  createMockConfrontoEquipeRepository,
  createMockConfrontoRepository,
  createMockDuplaRepository,
  createMockEquipeRepository,
  createMockEstatisticasRepository,
  createMockEtapaRepository,
  createMockGrupoRepository,
  createMockPartidaReiDaPraiaRepository,
  createMockPartidaRepository,
} from "../../mocks/repositories";

const em = (segundos: number) => Timestamp.fromMillis(segundos * 1000);
const ids = (itens: { id: string }[]) => itens.map((i) => i.id);

describe("EtapaPublicaService", () => {
  const etapas = createMockEtapaRepository();
  const grupos = createMockGrupoRepository();
  const duplas = createMockDuplaRepository();
  const partidas = createMockPartidaRepository();
  const confrontos = createMockConfrontoRepository();
  const estatisticas = createMockEstatisticasRepository();
  const partidasReiDaPraia = createMockPartidaReiDaPraiaRepository();
  const equipes = createMockEquipeRepository();
  const confrontosEquipe = createMockConfrontoEquipeRepository();
  const partidasTeams = { buscarPorEtapa: jest.fn() };

  const service = new EtapaPublicaService(
    etapas,
    grupos,
    duplas,
    partidas,
    confrontos,
    estatisticas,
    partidasReiDaPraia,
    equipes,
    confrontosEquipe,
    partidasTeams as unknown as IPartidaTeamsRepository
  );

  const etapa = (formato?: string) =>
    ({ id: "e1", arenaId: "a1", formato }) as Etapa;

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe("buscarGrupos", () => {
    const grupo = { id: "g1", nome: "Grupo A", ordem: 1, totalDuplas: 2 };

    beforeEach(() => {
      grupos.buscarPorEtapaOrdenado.mockResolvedValue([grupo]);
    });

    it.each(["dupla_fixa", undefined])(
      "monta os grupos de duplas (formato %s)",
      async (formato) => {
        duplas.buscarPorGrupoOrdenado.mockResolvedValue([
          { id: "d1", jogador1Nome: "A", jogador2Nome: "B", posicaoGrupo: 1 },
        ]);
        partidas.buscarPorGrupoOrdenado.mockResolvedValue([
          { id: "p1", dupla1Nome: "A & B", status: "agendada" },
        ]);

        const [resultado] = await service.buscarGrupos(etapa(formato));

        expect(grupos.buscarPorEtapaOrdenado).toHaveBeenCalledWith("e1", "a1");
        expect(resultado).toMatchObject({
          id: "g1",
          totalDuplas: 2,
          completo: false,
          formato: "dupla_fixa",
          duplas: [{ id: "d1", pontos: 0, classificada: false }],
          partidas: [{ id: "p1", setsDupla1: 0, placar: [] }],
        });
      }
    );

    it.each(["rei_da_praia", "super_x"])(
      "monta os grupos individuais (%s)",
      async (formato) => {
        estatisticas.buscarPorGrupo.mockResolvedValue([
          { id: "s1", jogadorId: "j1", posicaoGrupo: 2 },
          { id: "s2", jogadorId: "j2", posicaoGrupo: 1 },
        ]);
        partidasReiDaPraia.buscarPorGrupo.mockResolvedValue([
          { id: "p2", criadoEm: em(2) },
          { id: "p1", criadoEm: em(1) },
        ]);

        const [resultado] = await service.buscarGrupos(etapa(formato));

        expect(resultado).toMatchObject({ formato, totalJogadores: 2 });
        if (!("jogadores" in resultado)) throw new Error("sem jogadores");
        expect(ids(resultado.jogadores)).toEqual(["s2", "s1"]);
        expect(ids(resultado.partidas)).toEqual(["p1", "p2"]);
      }
    );

    it("sem posição no grupo, ordena por pontos e saldo de games", async () => {
      estatisticas.buscarPorGrupo.mockResolvedValue([
        { id: "s1", pontosGrupo: 3, saldoGamesGrupo: 1 },
        { id: "s2", pontosGrupo: 3, saldoGamesGrupo: 5 },
        { id: "s3", pontosGrupo: 6, saldoGamesGrupo: 0 },
      ]);
      partidasReiDaPraia.buscarPorGrupo.mockResolvedValue([]);

      const [resultado] = await service.buscarGrupos(etapa("super_x"));

      if (!("jogadores" in resultado)) throw new Error("sem jogadores");
      expect(ids(resultado.jogadores)).toEqual(["s3", "s2", "s1"]);
    });

    it("no Teams, monta pelas equipes e confrontos", async () => {
      equipes.buscarPorEtapa.mockResolvedValue([{ id: "eq1", grupoId: "A" }]);
      confrontosEquipe.buscarPorEtapa.mockResolvedValue([]);
      partidasTeams.buscarPorEtapa.mockResolvedValue([]);

      const resultado = await service.buscarGrupos(etapa("teams"));

      expect(ids(resultado)).toEqual(["A"]);
      expect(equipes.buscarPorEtapa).toHaveBeenCalledWith("e1", "a1");
      expect(grupos.buscarPorEtapaOrdenado).not.toHaveBeenCalled();
    });
  });

  describe("buscarChaves", () => {
    it("sem confrontos, avisa que não tem chaves", async () => {
      confrontos.buscarPorEtapaOrdenado.mockResolvedValue([]);

      expect(await service.buscarChaves("e1", "a1")).toEqual({
        formato: "eliminacao_simples",
        temChaves: false,
        rodadas: [],
      });
    });

    it("agrupa por fase, da final para trás", async () => {
      confrontos.buscarPorEtapaOrdenado.mockResolvedValue([
        { id: "q1", fase: "quartas", ordem: 1 },
        { id: "q2", fase: "quartas", ordem: 2 },
        { id: "f", fase: "final", ordem: 3 },
      ]);

      const { temChaves, rodadas } = await service.buscarChaves("e1", "a1");

      expect(temChaves).toBe(true);
      expect(rodadas.map((r) => [r.nome, ids(r.partidas)])).toEqual([
        ["Final", ["f"]],
        ["Quartas de Final", ["q1", "q2"]],
      ]);
    });

    const unicaPartida = async (confronto: object) => {
      confrontos.buscarPorEtapaOrdenado.mockResolvedValue([
        { id: "c1", fase: "final", ordem: 1, ...confronto },
      ]);
      return (await service.buscarChaves("e1", "a1")).rodadas[0].partidas[0];
    };

    it("traz vencedor e placar detalhado", async () => {
      const placar = [{ numero: 1, gamesDupla1: 4, gamesDupla2: 6 }];
      partidas.buscarPorId.mockResolvedValue({ placar });

      expect(
        await unicaPartida({
          dupla1Id: "d1",
          dupla1Nome: "A & B",
          dupla2Id: "d2",
          dupla2Nome: "C & D",
          status: "finalizada",
          vencedoraId: "d2",
          placar: "4-6",
          partidaId: "p1",
        })
      ).toMatchObject({
        jogador1: { id: "d1", nome: "A & B" },
        jogador2: { id: "d2", nome: "C & D" },
        vencedor: "jogador2",
        placar: "4-6",
        placarDetalhado: placar,
        status: "finalizada",
      });
    });

    it.each([
      ["não existe", () => partidas.buscarPorId.mockResolvedValue(null)],
      [
        "falha",
        () => partidas.buscarPorId.mockRejectedValue(new Error("banco")),
      ],
      [
        "não tem sets",
        () => partidas.buscarPorId.mockResolvedValue({ placar: "6-1" }),
      ],
    ])("mostra o confronto sem placar quando a partida %s", async (_, preparar) => {
      preparar();

      expect(
        (await unicaPartida({ partidaId: "p1" })).placarDetalhado
      ).toBeNull();
    });

    it("confronto sem duplas definidas", async () => {
      expect(await unicaPartida({ status: "agendada" })).toMatchObject({
        jogador1: { id: "", nome: "A definir" },
        jogador2: null,
        vencedor: null,
        placarDetalhado: null,
        status: "agendada",
      });
      expect(partidas.buscarPorId).not.toHaveBeenCalled();
    });

    it.each([
      ["BYE", "bye"],
      ["em_andamento", "em_andamento"],
      [undefined, "agendada"],
    ])("status %s vira %s", async (status, esperado) => {
      expect((await unicaPartida({ status })).status).toBe(esperado);
    });
  });

  describe("buscarHistoricoJogador", () => {
    it("traz a etapa e a posição, da mais recente para a mais antiga", async () => {
      estatisticas.buscarPorJogador.mockResolvedValue([
        {
          id: "s1",
          etapaId: "e1",
          colocacao: "Campeao",
          gamesVencidos: 9,
          gamesPerdidos: 4,
          criadoEm: em(1),
        },
        { id: "s2", etapaId: "apagada", criadoEm: em(2) },
        { id: "s3", etapaId: "e1", colocacao: "outra" },
      ]);
      etapas.buscarPorId.mockImplementation(async (id: string) =>
        id === "e1" ? { nome: "Etapa 1" } : null
      );

      const historico = await service.buscarHistoricoJogador("j1", "a1");

      expect(estatisticas.buscarPorJogador).toHaveBeenCalledWith("j1", "a1");
      expect(ids(historico)).toEqual(["s2", "s1", "s3"]);
      expect(historico[0]).toMatchObject({
        etapaNome: "Etapa Sem Nome",
        posicao: undefined,
        vitorias: 0,
      });
      expect(historico[1]).toMatchObject({
        etapaNome: "Etapa 1",
        posicao: 1,
        saldoGames: 5,
      });
      expect(historico[2].posicao).toBe(99);
    });

    it("pula a participação que falhar", async () => {
      estatisticas.buscarPorJogador.mockResolvedValue([
        { id: "s1" },
        { id: "s2", etapaId: "e1" },
      ]);
      etapas.buscarPorId.mockImplementation(async (id?: string) => {
        if (!id) throw new Error("id vazio");
        return { nome: "Etapa 1" };
      });

      expect(ids(await service.buscarHistoricoJogador("j1", "a1"))).toEqual([
        "s2",
      ]);
    });
  });
});
