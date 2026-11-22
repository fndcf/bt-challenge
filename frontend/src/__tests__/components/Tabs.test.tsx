/**
 * Testes do componente Tabs e da ligação label/campo do Input e do Select
 */

import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { Input, Select, Tabs } from "@/components/ui";
import { getCoresFormato } from "@/styles/semantic";
import { FormatoEtapa } from "@/types/etapa";

const ABAS = [
  { id: "a", label: "Grupos" },
  { id: "b", label: "Eliminatória" },
  { id: "c", label: "Resumo" },
];

const ComEstado = () => {
  const [ativa, setAtiva] = useState("a");
  return <Tabs rotulo="Fases" abas={ABAS} ativa={ativa} onChange={setAtiva} />;
};

const abaAtiva = () => screen.getByRole("tab", { selected: true });

describe("Tabs", () => {
  it("deve marcar a aba ativa e trocar ao clicar", () => {
    render(<ComEstado />);
    expect(screen.getByRole("tablist", { name: "Fases" })).toBeInTheDocument();
    expect(abaAtiva()).toHaveTextContent("Grupos");

    fireEvent.click(screen.getByText("Eliminatória"));
    expect(abaAtiva()).toHaveTextContent("Eliminatória");
  });

  it("deve trocar e focar pelo teclado, dando a volta", () => {
    render(<ComEstado />);
    const lista = screen.getByRole("tablist");

    fireEvent.keyDown(lista, { key: "ArrowLeft" });
    expect(abaAtiva()).toHaveTextContent("Resumo");
    expect(abaAtiva()).toHaveFocus();

    fireEvent.keyDown(lista, { key: "ArrowRight" });
    expect(abaAtiva()).toHaveTextContent("Grupos");

    fireEvent.keyDown(lista, { key: "End" });
    expect(abaAtiva()).toHaveTextContent("Resumo");
    fireEvent.keyDown(lista, { key: "Home" });
    expect(abaAtiva()).toHaveTextContent("Grupos");
  });

  it("deve deixar só a aba ativa na ordem do Tab", () => {
    render(<ComEstado />);
    expect(
      screen.getAllByRole("tab").map((aba) => aba.getAttribute("tabindex"))
    ).toEqual(["0", "-1", "-1"]);
  });

  it("deve usar a cor do formato na aba ativa", () => {
    render(
      <Tabs
        rotulo="Fases"
        abas={ABAS}
        ativa="a"
        onChange={jest.fn()}
        formato={FormatoEtapa.TEAMS}
      />
    );
    expect(abaAtiva()).toHaveStyle({
      color: getCoresFormato(FormatoEtapa.TEAMS).solido,
    });
  });
});

describe("label dos campos", () => {
  it("deve ligar a label e a ajuda ao Input", () => {
    render(<Input label="Nome" helperText="Nome completo" />);
    expect(screen.getByLabelText("Nome")).toHaveAccessibleDescription(
      "Nome completo"
    );
  });

  it("deve ligar a label e o erro ao Select", () => {
    render(
      <Select label="Nível" error="Obrigatório" options={[]} id="nivel" />
    );
    const campo = screen.getByLabelText("Nível");
    expect(campo).toHaveAttribute("id", "nivel");
    expect(campo).toBeInvalid();
    expect(campo).toHaveAccessibleDescription("Obrigatório");
  });
});
