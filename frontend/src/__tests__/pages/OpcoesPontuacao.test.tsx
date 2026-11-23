/**
 * Opções de pontuação e sets da etapa
 */

import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { OpcoesPontuacao } from "@/pages/CriarEtapa/components/OpcoesPontuacao";
import { FormatoEtapa } from "@/types/etapa";

const nada = () => {};

const renderizar = (formato: FormatoEtapa, melhorDe3 = true) =>
  render(
    <OpcoesPontuacao
      formato={formato}
      contaPontosRanking
      darPontosParticipacao
      melhorDe3={melhorDe3}
      melhorDe3Eliminatoria={false}
      onContaPontosRankingChange={nada}
      onDarPontosParticipacaoChange={nada}
      onMelhorDe3Change={nada}
      onMelhorDe3EliminatoriaChange={nada}
    />
  );

const opcaoEliminatoria = () =>
  screen.queryByRole("checkbox", { name: /fase eliminatória/ });

describe("OpcoesPontuacao", () => {
  it.each([FormatoEtapa.DUPLA_FIXA, FormatoEtapa.REI_DA_PRAIA, FormatoEtapa.TEAMS])(
    "%s com melhor de 3 oferece aplicar também na eliminatória",
    (formato) => {
      renderizar(formato);
      expect(opcaoEliminatoria()).toBeInTheDocument();
    }
  );

  it("Super X não oferece a opção da eliminatória (não tem eliminatória)", () => {
    renderizar(FormatoEtapa.SUPER_X);
    expect(screen.getByRole("checkbox", { name: "Partidas melhor de 3 sets" })).toBeInTheDocument();
    expect(opcaoEliminatoria()).not.toBeInTheDocument();
  });

  it("sem melhor de 3, a opção da eliminatória não aparece", () => {
    renderizar(FormatoEtapa.DUPLA_FIXA, false);
    expect(opcaoEliminatoria()).not.toBeInTheDocument();
  });
});
