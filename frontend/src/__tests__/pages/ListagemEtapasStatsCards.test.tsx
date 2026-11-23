/**
 * Números da tela Etapas: um cartão por formato
 */

import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { StatsCards } from "@/pages/ListagemEtapas/components/StatsCards";
import { FormatoEtapa } from "@/types/etapa";

describe("StatsCards", () => {
  it("mostra o total de cada um dos 4 formatos", () => {
    render(
      <StatsCards
        stats={{
          totalEtapas: 10,
          inscricoesAbertas: 1,
          emAndamento: 5,
          finalizadas: 4,
          porFormato: {
            [FormatoEtapa.DUPLA_FIXA]: 4,
            [FormatoEtapa.REI_DA_PRAIA]: 3,
            [FormatoEtapa.SUPER_X]: 2,
            [FormatoEtapa.TEAMS]: 1,
          },
        }}
      />
    );

    // Cartão = rótulo + número, lado a lado
    const cartao = (rotulo: string) => screen.getByText(rotulo).parentElement?.textContent;

    expect(cartao("Dupla Fixa")).toBe("Dupla Fixa4");
    expect(cartao("Rei da Praia")).toBe("Rei da Praia3");
    expect(cartao("Super X")).toBe("Super X2");
    expect(cartao("Teams")).toBe("Teams1");
  });
});
