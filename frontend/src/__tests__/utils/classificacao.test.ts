/**
 * Testes das funções de classificação dos grupos
 */

import {
  formatarSaldo,
  linhasDeDuplas,
  linhasDeEquipes,
  linhasDeJogadores,
  ordenarJogadores,
  temJogos,
} from "@/utils/classificacao";

const jogador = (dados: object): any => ({
  jogadorNome: "Nome",
  pontosGrupo: 0,
  saldoGamesGrupo: 0,
  gamesVencidosGrupo: 0,
  saldoSetsGrupo: 0,
  ...dados,
});

const dupla = (dados: object): any => ({
  jogador1Nome: "A",
  jogador2Nome: "B",
  jogador1Nivel: "avancado",
  jogador2Nivel: "avancado",
  pontos: 0,
  saldoGames: 0,
  saldoSets: 0,
  gamesVencidos: 0,
  ...dados,
});

describe("classificacao", () => {
  it("deve usar a posição do backend antes dos critérios", () => {
    const linhas = linhasDeJogadores([
      jogador({ id: "a", posicaoGrupo: 2, pontosGrupo: 9 }),
      jogador({ id: "b", posicaoGrupo: 1, pontosGrupo: 3 }),
    ]);

    expect(linhas.map((l) => [l.id, l.posicao])).toEqual([
      ["b", 1],
      ["a", 2],
    ]);
  });

  it("deve aplicar os critérios em ordem e o nome por último", () => {
    const ordem = ordenarJogadores([
      jogador({ jogadorNome: "Zeca" }),
      jogador({ jogadorNome: "Abel" }),
      jogador({ jogadorNome: "Saldo", saldoGamesGrupo: 2 }),
      jogador({ jogadorNome: "Pontos", pontosGrupo: 3 }),
    ]).map((j) => j.jogadorNome);

    expect(ordem).toEqual(["Pontos", "Saldo", "Abel", "Zeca"]);
  });

  it("não deve alterar a lista recebida", () => {
    const lista = [
      jogador({ jogadorNome: "Zeca" }),
      jogador({ jogadorNome: "Abel" }),
    ];
    ordenarJogadores(lista);

    expect(lista[0].jogadorNome).toBe("Zeca");
  });

  it("deve usar só as estatísticas da fase de grupos do jogador", () => {
    const [linha] = linhasDeJogadores([
      jogador({ id: "a", pontos: 12, pontosGrupo: 6, jogos: 5, jogosGrupo: 3 }),
    ]);

    expect(linha.estatisticas).toMatchObject({ pontos: 6, jogos: 3 });
  });

  it("deve descrever o nível da dupla", () => {
    expect(linhasDeDuplas([dupla({ id: "1" })])[0].detalhe).toBe(
      "Nível: avançado"
    );
    expect(
      linhasDeDuplas([dupla({ id: "1", jogador2Nivel: "iniciante" })])[0].detalhe
    ).toBe("Nível: avançado + iniciante");
  });

  it("deve converter equipes com saldo de jogos", () => {
    const [linha] = linhasDeEquipes([
      { id: "e", nome: "Equipe 1", pontos: 3, saldoJogos: 2, saldoGames: 5 } as any,
    ]);

    expect(linha).toMatchObject({
      nome: "Equipe 1",
      estatisticas: { pontos: 3, saldoJogos: 2, saldoGames: 5 },
    });
  });

  it("deve saber se já houve jogo no grupo", () => {
    expect(temJogos([])).toBe(false);
    expect(temJogos(linhasDeDuplas([dupla({ jogos: 0 })]))).toBe(false);
    expect(temJogos(linhasDeDuplas([dupla({ jogos: 1 })]))).toBe(true);
  });

  it("deve mostrar o sinal de mais só no saldo positivo", () => {
    expect([3, 0, -3].map(formatarSaldo)).toEqual(["+3", "0", "-3"]);
  });
});
