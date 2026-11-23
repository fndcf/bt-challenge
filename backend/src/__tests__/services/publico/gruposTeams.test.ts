/**
 * Grupos do Teams na página pública
 */

import { ConfrontoEquipe, Equipe, PartidaTeams } from "../../../models/Teams";
import { montarGruposTeams } from "../../../services/publico/gruposTeams";

const equipe = (id: string, dados: Partial<Equipe> = {}) =>
  ({ id, nome: id, ordem: 1, ...dados }) as Equipe;
const confronto = (id: string, dados: object = {}) =>
  ({ id, fase: "grupos", ordem: 1, ...dados }) as ConfrontoEquipe;
const partida = (id: string, dados: object = {}) =>
  ({ id, confrontoId: "c1", ordem: 1, ...dados }) as PartidaTeams;
const ids = (itens: { id: string }[]) => itens.map((i) => i.id);

describe("montarGruposTeams", () => {
  it("retorna vazio sem equipes nem confrontos", () => {
    expect(montarGruposTeams([], [], [])).toEqual([]);
  });

  it("separa por grupo, em ordem alfabética", () => {
    const grupos = montarGruposTeams(
      [
        equipe("e1", { grupoId: "B", grupoNome: "Grupo B" }),
        equipe("e2", { grupoId: "A", grupoNome: "Grupo A" }),
      ],
      [confronto("c1", { grupoId: "B" })],
      []
    );

    expect(grupos.map((g) => [g.id, g.nome, g.ordem])).toEqual([
      ["A", "Grupo A", 1],
      ["B", "Grupo B", 2],
    ]);
    expect(ids(grupos[1].equipes)).toEqual(["e1"]);
    expect(ids(grupos[1].confrontos)).toEqual(["c1"]);
  });

  it("sem grupos, mostra uma classificação única", () => {
    const [grupo, ...resto] = montarGruposTeams(
      [equipe("e1"), equipe("e2")],
      [confronto("c1")],
      []
    );

    expect(resto).toEqual([]);
    expect(grupo).toMatchObject({
      id: "unico",
      nome: "Classificação",
      totalEquipes: 2,
      tipo: "grupos",
    });
  });

  it("sem nome gravado, usa a letra do grupo ou a posição dele", () => {
    const grupos = montarGruposTeams(
      [equipe("e1", { grupoId: "C" }), equipe("e2", { grupoId: "id-longo" })],
      [],
      []
    );

    expect(grupos.map((g) => g.nome)).toEqual(["Grupo C", "Grupo 2"]);
  });

  it("ordena equipes pela posição; sem posição, por pontos e saldo", () => {
    const comPosicao = montarGruposTeams(
      [equipe("e1", { posicao: 2, pontos: 9 }), equipe("e2", { posicao: 1 })],
      [],
      []
    );
    const semPosicao = montarGruposTeams(
      [
        equipe("e1", { pontos: 3, saldoJogos: 1 }),
        equipe("e2", { pontos: 3, saldoJogos: 4 }),
        equipe("e3", { pontos: 6, saldoJogos: -2 }),
      ],
      [],
      []
    );

    expect(ids(comPosicao[0].equipes)).toEqual(["e2", "e1"]);
    expect(ids(semPosicao[0].equipes)).toEqual(["e3", "e2", "e1"]);
  });

  it("ordena confrontos por rodada e ordem, com as partidas em ordem", () => {
    const [grupo] = montarGruposTeams(
      [],
      [
        confronto("c3", { rodada: 2, ordem: 1 }),
        confronto("c2", { rodada: 1, ordem: 3 }),
        confronto("c1", { rodada: 1, ordem: 2 }),
      ],
      [partida("p2", { ordem: 2 }), partida("p1"), partida("x", { confrontoId: "outro" })]
    );

    expect(ids(grupo.confrontos)).toEqual(["c1", "c2", "c3"]);
    expect(ids(grupo.confrontos[0].partidas)).toEqual(["p1", "p2"]);
    expect(grupo.confrontos[1].partidas).toEqual([]);
  });

  it("põe as fases eliminatórias depois dos grupos, da primeira à final", () => {
    const grupos = montarGruposTeams(
      [equipe("e1", { grupoId: "A" })],
      [
        confronto("f", { fase: "final", ordem: 9 }),
        confronto("s2", { fase: "semifinal", ordem: 8 }),
        confronto("s1", { fase: "SEMIFINAL", ordem: 7 }),
        confronto("g", { fase: "GRUPOS", grupoId: "A" }),
      ],
      []
    );

    expect(grupos.map((g) => [g.id, g.nome, g.tipo])).toEqual([
      ["A", "Grupo A", "grupos"],
      ["eliminatoria-SEMIFINAL", "Semifinal", "eliminatoria"],
      ["eliminatoria-FINAL", "Final", "eliminatoria"],
    ]);
    expect(ids(grupos[0].confrontos)).toEqual(["g"]);
    expect(ids(grupos[1].confrontos)).toEqual(["s1", "s2"]);
  });
});
