/**
 * Testes do Badge (status e selo de formato)
 */

import { render, screen } from "@testing-library/react";
import { Badge } from "@/components/ui";
import { theme } from "@/styles/theme";
import { getCoresFormato } from "@/styles/semantic";
import { FormatoEtapa } from "@/types/etapa";

const corDe = (elemento: HTMLElement, propriedade: string) =>
  window.getComputedStyle(elemento).getPropertyValue(propriedade);

// jsdom devolve cores em rgb()
const rgb = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return `rgb(${r}, ${g}, ${b})`;
};

describe("Badge", () => {
  it("renderiza o texto", () => {
    render(<Badge tom="sucesso">Finalizado</Badge>);
    expect(screen.getByText("Finalizado")).toBeInTheDocument();
  });

  it.each(["sucesso", "aviso", "erro", "neutro", "info"] as const)(
    "tom %s usa as cores de status",
    (tom) => {
      render(<Badge tom={tom}>Status</Badge>);
      const badge = screen.getByText("Status");
      expect(corDe(badge, "color")).toBe(rgb(theme.semantic.status[tom].texto));
      expect(corDe(badge, "background")).toContain(rgb(theme.semantic.status[tom].fundo));
    }
  );

  it("sem tom usa neutro", () => {
    render(<Badge>Status</Badge>);
    expect(corDe(screen.getByText("Status"), "color")).toBe(
      rgb(theme.semantic.status.neutro.texto)
    );
  });

  it("formato usa a cor de identidade do formato (e ignora o tom)", () => {
    render(
      <Badge formato={FormatoEtapa.REI_DA_PRAIA} tom="erro">
        Rei da Praia
      </Badge>
    );
    const badge = screen.getByText("Rei da Praia");
    const cores = getCoresFormato(FormatoEtapa.REI_DA_PRAIA);
    expect(corDe(badge, "color")).toBe(rgb(cores.texto));
    expect(corDe(badge, "background")).toContain(rgb(cores.claro));
  });

  it("repassa atributos HTML", () => {
    render(
      <Badge tom="info" title="Em curso" data-testid="selo">
        Info
      </Badge>
    );
    expect(screen.getByTestId("selo")).toHaveAttribute("title", "Em curso");
  });
});
