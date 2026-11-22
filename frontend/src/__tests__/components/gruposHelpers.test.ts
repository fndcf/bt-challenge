/**
 * Classificação pública do Teams
 */

import { montarTabela } from "@/components/visualizadores/GruposViewer/gruposHelpers";
import { FormatoEtapa } from "@/types/etapa";

it("numera as equipes dentro do grupo, não pela posição geral da etapa", () => {
  const grupo: any = {
    equipes: [
      { id: "a", nome: "Equipe 4", pontos: 6, vitorias: 2, posicaoGrupo: 2 },
      { id: "b", nome: "Equipe 1", pontos: 3, vitorias: 1, posicaoGrupo: 3 },
      { id: "c", nome: "Equipe 5", pontos: 0, vitorias: 0, posicaoGrupo: 5 },
    ],
  };

  expect(
    montarTabela(grupo, FormatoEtapa.TEAMS)?.linhas.map((l) => l.posicao)
  ).toEqual([1, 2, 3]);
});
