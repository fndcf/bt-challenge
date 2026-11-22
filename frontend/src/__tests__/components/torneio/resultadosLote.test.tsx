/**
 * Testes do CampoPlacar, do ModalResultadosLote e das regras de resultados
 * em lote
 */

import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { CampoPlacar, ModalResultadosLote } from "@/components/torneio";
import { ModalRegistrarResultadoEliminatorio } from "@/components/etapas/ModalRegistrarResultadoEliminatorio";
import { StatusConfrontoEliminatorio } from "@/types/chave";
import {
  getSituacaoPartida,
  montarPlacarEnvio,
  montarResultadosIniciais,
  PlacarSets,
  resultadoVazio,
  validarResultado,
} from "@/utils/resultadosLote";

jest.mock("@/services", () => ({ getChaveService: () => ({}) }));

const set = (gamesDupla1?: number, gamesDupla2?: number) => ({
  gamesDupla1,
  gamesDupla2,
});

const placar = (set1 = set(), set2 = set(), set3 = set()): PlacarSets => ({
  set1,
  set2,
  set3,
});

const nomesDosCampos = () =>
  screen
    .getAllByRole("spinbutton")
    .map((campo) => campo.getAttribute("aria-label"));

const CampoComEstado = ({ inicial = placar() }: { inicial?: PlacarSets }) => {
  const [valor, setValor] = useState(inicial);
  return (
    <CampoPlacar
      melhorDe3
      lado1={{ nome: "Ana" }}
      lado2={{ nome: "Bia" }}
      placar={valor}
      onChange={(chave, campo, games) =>
        setValor((prev) => ({
          ...prev,
          [chave]: { ...prev[chave], [campo]: games },
        }))
      }
    />
  );
};

describe("CampoPlacar", () => {
  it("deve ter um campo por dupla quando é set único", () => {
    render(
      <CampoPlacar
        lado1={{ nome: "Ana", detalhe: "Equipe 1" }}
        lado2={{ nome: "Bia" }}
        onChange={jest.fn()}
      />
    );

    expect(nomesDosCampos()).toEqual(["Games de Ana", "Games de Bia"]);
    expect(screen.getByText("Equipe 1")).toBeInTheDocument();
    expect(screen.queryByText("Set 1")).not.toBeInTheDocument();
  });

  it("deve seguir a ordem set a set no melhor de 3", () => {
    render(<CampoComEstado />);

    expect(nomesDosCampos()).toEqual([
      "Games de Ana, Set 1",
      "Games de Bia, Set 1",
      "Games de Ana, Set 2",
      "Games de Bia, Set 2",
    ]);
  });

  it("deve abrir o desempate só com 1 set para cada", () => {
    render(<CampoComEstado inicial={placar(set(6, 4), set(3))} />);
    expect(screen.queryByText("Set 3")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Games de Bia, Set 2"), {
      target: { value: "6" },
    });

    expect(screen.getByText("Set 3")).toBeInTheDocument();
    expect(screen.getAllByRole("spinbutton")).toHaveLength(6);
  });

  it("deve informar número, ou undefined ao apagar", () => {
    const onChange = jest.fn();
    render(
      <CampoPlacar
        lado1={{ nome: "Ana" }}
        lado2={{ nome: "Bia" }}
        placar={placar(set(6, 4))}
        onChange={onChange}
      />
    );

    fireEvent.change(screen.getByLabelText("Games de Ana"), {
      target: { value: "0" },
    });
    fireEvent.change(screen.getByLabelText("Games de Bia"), {
      target: { value: "" },
    });

    expect(onChange).toHaveBeenNthCalledWith(1, "set1", "gamesDupla1", 0);
    expect(onChange).toHaveBeenNthCalledWith(
      2,
      "set1",
      "gamesDupla2",
      undefined
    );
  });

  it("deve anunciar o erro e marcar os campos", () => {
    render(
      <CampoPlacar
        lado1={{ nome: "Ana" }}
        lado2={{ nome: "Bia" }}
        onChange={jest.fn()}
        erro="Placar inválido"
      />
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Placar inválido");
    expect(screen.getByLabelText("Games de Ana")).toBeInvalid();
  });
});

describe("ModalResultadosLote", () => {
  const props = {
    contexto: "Grupo A",
    totalPartidas: 3,
    jaFinalizadas: 1,
    seraoSalvas: 2,
    onClose: jest.fn(),
  };

  it("deve salvar pelo botão do rodapé, fora do formulário", () => {
    const onSubmit = jest.fn((e) => e.preventDefault());
    render(
      <ModalResultadosLote {...props} onSubmit={onSubmit}>
        conteúdo
      </ModalResultadosLote>
    );

    const salvar = screen.getByRole("button", { name: "Salvar Resultados (2)" });
    expect(salvar.closest("form")).toBeNull();
    fireEvent.click(salvar);

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("deve mostrar resumo, item extra e erro geral", () => {
    render(
      <ModalResultadosLote
        {...props}
        onSubmit={jest.fn()}
        resumoExtra={[{ rotulo: "Sem Jogadores", valor: 4 }]}
        erroGlobal="Erro de rede"
      >
        conteúdo
      </ModalResultadosLote>
    );

    expect(
      screen.getByText("Registrar Resultados - Grupo A")
    ).toBeInTheDocument();
    expect(screen.getByText("Sem Jogadores").nextSibling).toHaveTextContent("4");
    expect(screen.getByText("Erro de rede")).toBeInTheDocument();
  });

  it("deve bloquear o salvar com a etapa finalizada", () => {
    render(
      <ModalResultadosLote {...props} onSubmit={jest.fn()} etapaFinalizada>
        conteúdo
      </ModalResultadosLote>
    );

    expect(
      screen.getByRole("button", { name: "Etapa Finalizada" })
    ).toBeDisabled();
  });
});

describe("ModalRegistrarResultadoEliminatorio no melhor de 3", () => {
  it("deve carregar os 3 sets salvos na ordem certa", () => {
    render(
      <ModalRegistrarResultadoEliminatorio
        confronto={
          {
            id: "c1",
            dupla1Nome: "Ana",
            dupla2Nome: "Bia",
            dupla1Origem: "1º Grupo A",
            dupla2Origem: "2º Grupo B",
            status: StatusConfrontoEliminatorio.FINALIZADA,
            placar: "6-4, 3-6, 7-5",
          } as any
        }
        melhorDe3
        onClose={jest.fn()}
        onSuccess={jest.fn()}
      />
    );

    expect(
      screen
        .getAllByRole("spinbutton")
        .map((campo) => (campo as HTMLInputElement).value)
    ).toEqual(["6", "4", "3", "6", "7", "5"]);
  });
});

describe("regras de resultados em lote", () => {
  it("deve começar com o placar salvo só nas finalizadas", () => {
    const salvo = [{ gamesDupla1: 6, gamesDupla2: 4 }];
    const iniciais = montarResultadosIniciais([
      { id: "a", status: "finalizada", placar: salvo },
      { id: "b", status: "agendada", placar: salvo },
    ]);

    expect(iniciais.get("a")?.set1).toEqual(set(6, 4));
    expect(iniciais.get("b")?.set1).toEqual({});
  });

  it("deve pular a partida sem placar", () => {
    expect(resultadoVazio(placar(), true)).toBe(true);
    expect(resultadoVazio(placar(set(), set(6, 4)), true)).toBe(false);
    // Em set único, o segundo set não conta
    expect(resultadoVazio(placar(set(), set(6, 4)), false)).toBe(true);
    expect(validarResultado(placar(), true)).toBeUndefined();
  });

  it("deve validar cada set com o nome dele", () => {
    expect(validarResultado(placar(set(6, 6)), false)).toBe(
      "Não há um vencedor definido"
    );
    expect(validarResultado(placar(set(6, 4), set(6)), true)).toBe(
      "Set 2: Preencha o placar da segunda dupla"
    );
    expect(validarResultado(placar(set(6, 4), set(4, 6)), true)).toMatch(
      /^Set 3 \(desempate\):/
    );
    expect(
      validarResultado(placar(set(6, 4), set(4, 6), set(7, 5)), true)
    ).toBeUndefined();
  });

  it("deve enviar só os sets que valem", () => {
    // Desempate digitado antes de corrigir o set 2 não é enviado
    expect(
      montarPlacarEnvio(placar(set(6, 4), set(6, 2), set(7, 5)), true)
    ).toHaveLength(2);
    expect(
      montarPlacarEnvio(placar(set(6, 4), set(4, 6), set(7, 5)), true)
    ).toHaveLength(3);
    expect(montarPlacarEnvio(placar(set(6, 4), set(4, 6)), false)).toEqual([
      { numero: 1, gamesDupla1: 6, gamesDupla2: 4 },
    ]);
  });

  it("deve descrever a situação da partida", () => {
    expect(getSituacaoPartida("wo").label).toBe("W.O.");
    expect(getSituacaoPartida("outro")).toEqual({
      label: "outro",
      tom: "neutro",
    });
  });
});
