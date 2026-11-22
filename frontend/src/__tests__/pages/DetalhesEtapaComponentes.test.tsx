/**
 * Testes das seções da página DetalhesEtapa
 */

import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ActionsSection } from "@/pages/DetalhesEtapa/components/ActionsSection";
import { DuplasManuaisTab } from "@/pages/DetalhesEtapa/components/DuplasManuaisTab";
import { EtapaInfoCards } from "@/pages/DetalhesEtapa/components/EtapaInfoCards";
import { InscricoesTab } from "@/pages/DetalhesEtapa/components/InscricoesTab";
import { FormatoEtapa, StatusEtapa } from "@/types/etapa";
import {
  distribuirEmGrupos,
  getFormatoEtapaLabel,
  getQtdGrupos,
} from "@/utils/etapa";

const etapa = (extra: object = {}): any => ({
  id: "etapa-1",
  arenaId: "arena-1",
  nome: "Etapa 1",
  formato: FormatoEtapa.DUPLA_FIXA,
  status: StatusEtapa.INSCRICOES_ABERTAS,
  genero: "masculino",
  maxJogadores: 16,
  totalInscritos: 16,
  qtdGrupos: 2,
  jogadoresPorGrupo: 4,
  chavesGeradas: false,
  dataInicio: "2026-01-10T12:00:00",
  dataFim: "2026-01-20T12:00:00",
  dataRealizacao: "2026-01-25T12:00:00",
  ...extra,
});

const inscricao = (n: number, genero = "masculino"): any => ({
  id: `insc-${n}`,
  jogadorId: `jog-${n}`,
  jogadorNome: `Jogador ${n}`,
  jogadorNivel: "iniciante",
  jogadorGenero: genero,
  status: "confirmada",
});

describe("utils/etapa", () => {
  it("monta o nome do formato com a variante", () => {
    expect(getFormatoEtapaLabel(etapa())).toBe("Dupla Fixa");
    expect(
      getFormatoEtapaLabel(
        etapa({ formato: FormatoEtapa.SUPER_X, varianteSuperX: 12 })
      )
    ).toBe("Super 12");
    expect(
      getFormatoEtapaLabel(
        etapa({ formato: FormatoEtapa.TEAMS, varianteTeams: 6 })
      )
    ).toBe("Teams 6");
  });

  it.each([
    [5, [5]],
    [6, [3, 3]],
    [8, [4, 4]],
    [11, [3, 4, 4]],
    [12, [3, 3, 3, 3]],
    [16, [3, 3, 3, 3, 4]],
    [26, [3, 3, 3, 3, 3, 3, 4, 4]],
  ])("%i equipes no Teams viram os grupos %j", (equipes, grupos) => {
    expect(distribuirEmGrupos(equipes)).toEqual(grupos);
  });
});

describe("getQtdGrupos", () => {
  // Casos reais do emulador, onde o qtdGrupos gravado vinha errado
  it.each([
    ["Rei da Praia 16", { formato: FormatoEtapa.REI_DA_PRAIA, totalInscritos: 16, qtdGrupos: 2 }, 4],
    ["Rei da Praia 12", { formato: FormatoEtapa.REI_DA_PRAIA, totalInscritos: 12, qtdGrupos: 2 }, 3],
    ["Teams 4 com 16", { formato: FormatoEtapa.TEAMS, varianteTeams: 4, totalInscritos: 16, qtdGrupos: 2 }, 1],
    ["Teams 4 com 24", { formato: FormatoEtapa.TEAMS, varianteTeams: 4, totalInscritos: 24, qtdGrupos: 3 }, 2],
    ["Teams 4 com 48", { formato: FormatoEtapa.TEAMS, varianteTeams: 4, totalInscritos: 48, qtdGrupos: 6 }, 4],
    ["Dupla Fixa 16", { totalInscritos: 16, qtdGrupos: 2 }, 2],
    ["Dupla Fixa 52", { totalInscritos: 52, qtdGrupos: 7 }, 8],
    ["Dupla Fixa grupo único", { totalInscritos: 16, grupoUnico: true }, 1],
    ["Super X", { formato: FormatoEtapa.SUPER_X, totalInscritos: 8 }, 1],
  ])("%s", (_, dados, esperado) => {
    expect(getQtdGrupos(etapa({ ...dados, chavesGeradas: true }))).toBe(esperado);
  });

  it("antes de gerar usa as vagas da etapa", () => {
    expect(
      getQtdGrupos(
        etapa({ formato: FormatoEtapa.REI_DA_PRAIA, totalInscritos: 3, maxJogadores: 12 })
      )
    ).toBe(3);
  });
});

describe("ActionsSection", () => {
  const acoes = {
    isReiDaPraia: false,
    onAbrirInscricoes: jest.fn(),
    onEncerrarInscricoes: jest.fn(),
    onGerarChaves: jest.fn(),
    onApagarChaves: jest.fn(),
    onVerChaves: jest.fn(),
    onSubstituirJogador: jest.fn(),
    onExportarSumula: jest.fn(),
  };

  it("só deixa gerar com as vagas completas", () => {
    render(
      <ActionsSection
        {...acoes}
        etapa={etapa({
          status: StatusEtapa.INSCRICOES_ENCERRADAS,
          totalInscritos: 15,
        })}
      />
    );

    expect(screen.getByText("Gerar Chaves")).toBeDisabled();
    expect(screen.getByText("Faltam 1 jogador (15/16)")).toBeInTheDocument();
    expect(screen.getByText("Reabrir Inscrições")).toBeInTheDocument();
  });

  it("depois de gerar mostra ver, substituir, súmula e apagar", () => {
    render(
      <ActionsSection
        {...acoes}
        isTeams
        etapa={etapa({
          formato: FormatoEtapa.TEAMS,
          status: StatusEtapa.CHAVES_GERADAS,
          chavesGeradas: true,
        })}
      />
    );

    fireEvent.click(screen.getByText("Ver Equipes"));
    fireEvent.click(screen.getByText("Substituir Jogador"));
    fireEvent.click(screen.getByText("Exportar Súmula"));
    fireEvent.click(screen.getByText("Apagar Equipes"));

    expect(acoes.onVerChaves).toHaveBeenCalled();
    expect(acoes.onSubstituirJogador).toHaveBeenCalled();
    expect(acoes.onExportarSumula).toHaveBeenCalled();
    expect(acoes.onApagarChaves).toHaveBeenCalled();
  });

  it("avisa os próximos valores válidos no Rei da Praia", () => {
    render(
      <ActionsSection
        {...acoes}
        isReiDaPraia
        etapa={etapa({ formato: FormatoEtapa.REI_DA_PRAIA, totalInscritos: 10 })}
      />
    );

    expect(
      screen.getByText("Próximos valores válidos: 8 ou 12")
    ).toBeInTheDocument();
  });
});

describe("EtapaInfoCards", () => {
  it("mostra progresso e estrutura do Teams", () => {
    render(
      <EtapaInfoCards
        etapa={etapa({
          formato: FormatoEtapa.TEAMS,
          varianteTeams: 4,
          totalInscritos: 24,
          maxJogadores: 32,
          genero: "misto",
        })}
        progresso={75}
        isReiDaPraia={false}
        isTeams
      />
    );

    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "75"
    );
    expect(screen.getByText("2 grupos + eliminatórias")).toBeInTheDocument();
    expect(screen.getByText("Equipes não geradas")).toBeInTheDocument();
    expect(screen.getByText("Misto")).toBeInTheDocument();
  });
});

describe("InscricoesTab", () => {
  const props = {
    onInscricao: jest.fn(),
    onCancelar: jest.fn(),
    onCancelarMultiplos: jest.fn().mockResolvedValue(undefined),
  };

  it("seleciona, cancela em lote e cancela um", async () => {
    jest.spyOn(window, "confirm").mockReturnValue(true);
    render(
      <InscricoesTab
        {...props}
        etapa={etapa({ totalInscritos: 2 })}
        inscricoes={[inscricao(1), inscricao(2)]}
      />
    );

    fireEvent.click(screen.getByLabelText("Cancelar inscrição de Jogador 2"));
    expect(props.onCancelar).toHaveBeenCalledWith("insc-2", "Jogador 2");

    fireEvent.click(screen.getByRole("checkbox", { name: /Jogador 1/ }));
    expect(screen.getByText("1 selecionado(s)")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Excluir Selecionados"));

    await waitFor(() =>
      expect(props.onCancelarMultiplos).toHaveBeenCalledWith(["insc-1"])
    );
    await waitFor(() =>
      expect(screen.queryByText("1 selecionado(s)")).not.toBeInTheDocument()
    );
  });

  it("com chaves geradas só mostra a lista", () => {
    render(
      <InscricoesTab
        {...props}
        etapa={etapa({ chavesGeradas: true })}
        inscricoes={[inscricao(1)]}
      />
    );

    expect(screen.getByText("Jogador 1")).toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.queryByText("Inscrever Jogador")).not.toBeInTheDocument();
  });

  it("mostra o gênero só em etapa mista", () => {
    const { rerender } = render(
      <InscricoesTab {...props} etapa={etapa()} inscricoes={[inscricao(1)]} />
    );
    expect(screen.queryByText(/Masculino/)).not.toBeInTheDocument();

    rerender(
      <InscricoesTab
        {...props}
        etapa={etapa({ genero: "misto" })}
        inscricoes={[inscricao(1)]}
      />
    );
    expect(screen.getByText(/Masculino|^M$|♂/)).toBeInTheDocument();
  });
});

describe("DuplasManuaisTab", () => {
  const escolher = (nome: string) =>
    fireEvent.click(screen.getByRole("button", { name: new RegExp(`^${nome}`) }));

  it("monta as duplas na ordem dos cliques e confirma", async () => {
    const onConfirm = jest.fn().mockResolvedValue(undefined);
    render(
      <DuplasManuaisTab
        inscricoes={[1, 2, 3, 4].map((n) => inscricao(n))}
        onConfirm={onConfirm}
      />
    );

    const confirmar = screen.getByText("Confirmar Duplas e Gerar Chaves");
    expect(confirmar).toBeDisabled();

    ["Jogador 1", "Jogador 3", "Jogador 2", "Jogador 4"].forEach(escolher);
    expect(
      screen.getByText("Todos os jogadores foram alocados")
    ).toBeInTheDocument();
    fireEvent.click(confirmar);

    await waitFor(() =>
      expect(onConfirm).toHaveBeenCalledWith([
        { jogador1Id: "jog-1", jogador2Id: "jog-3" },
        { jogador1Id: "jog-2", jogador2Id: "jog-4" },
      ])
    );
  });

  it("remover devolve o jogador à lista e libera a vaga", () => {
    render(
      <DuplasManuaisTab
        inscricoes={[inscricao(1), inscricao(2)]}
        onConfirm={jest.fn()}
      />
    );

    escolher("Jogador 1");
    expect(screen.getByText("Jogadores Disponíveis (1)")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Remover Jogador 1"));
    expect(screen.getByText("Jogadores Disponíveis (2)")).toBeInTheDocument();
    expect(screen.getByText("0/2")).toBeInTheDocument();
  });

  it("no misto recusa dupla do mesmo gênero", () => {
    const onConfirm = jest.fn();
    render(
      <DuplasManuaisTab
        isMisto
        inscricoes={[
          inscricao(1),
          inscricao(2),
          inscricao(3, "feminino"),
          inscricao(4, "feminino"),
        ]}
        onConfirm={onConfirm}
      />
    );

    [1, 2, 3, 4].forEach((n) => escolher(`Jogador ${n}`));
    fireEvent.click(screen.getByText("Confirmar Duplas e Gerar Chaves"));

    expect(
      within(screen.getByRole("alert")).getByText(/Dupla 1: etapa mista/)
    ).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
