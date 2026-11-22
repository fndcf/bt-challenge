/**
 * Testes do selo e do filtro de gênero
 */

import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import {
  FiltroGenero,
  passaNoFiltroGenero,
  SeloGenero,
  ValorFiltroGenero,
} from "@/components/jogadores/Genero";
import { semantic } from "@/styles/semantic";
import { GeneroJogador } from "@/types/jogador";

describe("SeloGenero", () => {
  it.each([
    [GeneroJogador.MASCULINO, "M", "Masculino", semantic.genero.masculino],
    [GeneroJogador.FEMININO, "F", "Feminino", semantic.genero.feminino],
  ])("deve mostrar símbolo, letra e cor de %s", (genero, texto, titulo, cores) => {
    render(<SeloGenero genero={genero} />);

    const selo = screen.getByTitle(titulo);
    expect(selo).toHaveTextContent(texto);
    // Ícone desenhado: o caractere sai torto no iPhone
    expect(selo.querySelector("svg")).toBeInTheDocument();
    expect(selo).toHaveStyle({ color: cores.texto, background: cores.fundo });
  });

  it("deve aceitar outro texto", () => {
    render(<SeloGenero genero={GeneroJogador.FEMININO}>Fem: 2/4</SeloGenero>);
    expect(screen.getByText("Fem: 2/4")).toBeInTheDocument();
  });

  it("não deve mostrar nada sem gênero definido", () => {
    const { container } = render(<SeloGenero />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("FiltroGenero", () => {
  const { MASCULINO, FEMININO } = GeneroJogador;

  const ComEstado = () => {
    const [valor, setValor] = useState<ValorFiltroGenero>("todos");
    return (
      <FiltroGenero
        valor={valor}
        onChange={setValor}
        generos={[MASCULINO, MASCULINO, FEMININO, undefined]}
      />
    );
  };

  it("deve mostrar a quantidade de cada opção e marcar a escolhida", () => {
    render(<ComEstado />);
    const botao = (nome: string) => screen.getByRole("button", { name: nome });

    expect(botao("Todos (4)")).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(botao("Fem (1)"));
    expect(botao("Fem (1)")).toHaveAttribute("aria-pressed", "true");
    expect(botao("Masc (2)")).toHaveAttribute("aria-pressed", "false");
    expect(botao("Todos (4)")).toHaveAttribute("aria-pressed", "false");
  });

  it("deve decidir quem aparece na lista", () => {
    expect(passaNoFiltroGenero(undefined, "todos")).toBe(true);
    expect(passaNoFiltroGenero(MASCULINO, MASCULINO)).toBe(true);
    expect(passaNoFiltroGenero(FEMININO, MASCULINO)).toBe(false);
    expect(passaNoFiltroGenero(undefined, FEMININO)).toBe(false);
  });
});
