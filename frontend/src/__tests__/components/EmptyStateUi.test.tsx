/**
 * Testes do EmptyState do design system (components/ui)
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { EmptyState, Button } from "@/components/ui";

describe("EmptyState (ui)", () => {
  it("mostra só o título quando é o único informado", () => {
    const { container } = render(<EmptyState titulo="Nenhuma chave gerada ainda" />);

    expect(screen.getByText("Nenhuma chave gerada ainda")).toBeInTheDocument();
    expect(container.querySelector("svg")).toBeNull();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("mostra descrição, ícone (decorativo) e ação", () => {
    const onClick = jest.fn();
    render(
      <EmptyState
        titulo="Nenhum jogador"
        descricao="Cadastre o primeiro jogador da arena."
        icone={<svg data-testid="icone" />}
        acao={<Button onClick={onClick}>Novo Jogador</Button>}
      />
    );

    expect(screen.getByText("Cadastre o primeiro jogador da arena.")).toBeInTheDocument();
    expect(screen.getByTestId("icone").parentElement).toHaveAttribute("aria-hidden", "true");

    fireEvent.click(screen.getByRole("button", { name: "Novo Jogador" }));
    expect(onClick).toHaveBeenCalled();
  });
});
