/**
 * Contas das estatísticas de jogador
 */

import { EstatisticasJogador } from "../../models/EstatisticasJogador";
import {
  grupoDaPartida,
  inverter,
  montarRanking,
  somarEtapas,
  totaisDaPartida,
} from "../../utils/estatisticas";

const vitoria = {
  venceu: true,
  setsVencidos: 2,
  setsPerdidos: 1,
  gamesVencidos: 16,
  gamesPerdidos: 11,
};
const derrota = { ...vitoria, venceu: false };

const etapa = (dados: Partial<EstatisticasJogador>) =>
  ({ jogadorId: "j1", etapaId: "e1", ...dados }) as EstatisticasJogador;

describe("o que uma partida soma", () => {
  it("nos totais", () => {
    expect(totaisDaPartida(vitoria)).toEqual({
      jogos: 1,
      vitorias: 1,
      derrotas: 0,
      setsVencidos: 2,
      setsPerdidos: 1,
      saldoSets: 1,
      gamesVencidos: 16,
      gamesPerdidos: 11,
      saldoGames: 5,
    });
    expect(totaisDaPartida(derrota)).toMatchObject({
      jogos: 1,
      vitorias: 0,
      derrotas: 1,
    });
  });

  it("no grupo, com 3 pontos por vitória", () => {
    expect(grupoDaPartida(vitoria)).toEqual({
      jogosGrupo: 1,
      vitoriasGrupo: 1,
      derrotasGrupo: 0,
      pontosGrupo: 3,
      setsVencidosGrupo: 2,
      setsPerdidosGrupo: 1,
      saldoSetsGrupo: 1,
      gamesVencidosGrupo: 16,
      gamesPerdidosGrupo: 11,
      saldoGamesGrupo: 5,
    });
    expect(grupoDaPartida(derrota)).toMatchObject({
      vitoriasGrupo: 0,
      derrotasGrupo: 1,
      pontosGrupo: 0,
    });
  });

  it("inverter desfaz a partida, sem deixar -0", () => {
    expect(inverter({ a: 3, b: -2, c: 0 })).toEqual({ a: -3, b: 2, c: 0 });
  });
});

describe("somarEtapas", () => {
  it("soma tudo, mas pontos só das etapas que contam", () => {
    const totais = somarEtapas(
      [
        etapa({ etapaId: "conta", pontos: 100, vitorias: 3, saldoGames: 4 }),
        etapa({ etapaId: "nao", pontos: 50, vitorias: 2, saldoGames: -1 }),
      ],
      (id) => id === "conta"
    );

    expect(totais).toMatchObject({
      etapasParticipadas: 2,
      pontos: 100,
      vitorias: 5,
      saldoGames: 3,
    });
  });

  it("campo que falta vale zero", () => {
    expect(somarEtapas([etapa({})])).toMatchObject({
      etapasParticipadas: 1,
      jogos: 0,
      pontos: 0,
      saldoSets: 0,
    });
  });
});

describe("montarRanking", () => {
  const ordem = (jogadores: Partial<EstatisticasJogador>[]) =>
    montarRanking(jogadores.map(etapa)).map((j) => j.jogadorId);

  it("junta as etapas do mesmo jogador", () => {
    const ranking = montarRanking([
      etapa({ jogadorNome: "Ana", pontos: 10 }),
      etapa({ jogadorNome: "Ana", etapaId: "e2", pontos: 30 }),
    ]);

    expect(ranking).toHaveLength(1);
    expect(ranking[0]).toMatchObject({
      jogadorId: "j1",
      jogadorNome: "Ana",
      pontos: 40,
      etapasParticipadas: 2,
    });
  });

  it.each([
    ["pontos", { pontos: 1 }, { pontos: 2 }],
    ["vitórias", { vitorias: 1 }, { vitorias: 2 }],
    ["saldo de games", { saldoGames: -1 }, { saldoGames: 1 }],
    ["games vencidos", { gamesVencidos: 1 }, { gamesVencidos: 2 }],
  ])("ordena por %s", (_, menor, maior) => {
    expect(
      ordem([
        { jogadorId: "menor", ...menor },
        { jogadorId: "maior", ...maior },
      ])
    ).toEqual(["maior", "menor"]);
  });

  it("respeita a ordem dos critérios", () => {
    expect(
      ordem([
        { jogadorId: "games", pontos: 5, vitorias: 1, gamesVencidos: 99 },
        { jogadorId: "saldo", pontos: 5, vitorias: 1, saldoGames: 2 },
        { jogadorId: "vitorias", pontos: 5, vitorias: 2, saldoGames: -9 },
        { jogadorId: "pontos", pontos: 6 },
      ])
    ).toEqual(["pontos", "vitorias", "saldo", "games"]);
  });
});
