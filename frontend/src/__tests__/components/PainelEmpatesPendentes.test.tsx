/**
 * Testes do PainelEmpatesPendentes / ModalResolverEmpate
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const mockListarEmpatesPendentes = jest.fn();
const mockResolverEmpate = jest.fn();

jest.mock("@/services", () => ({
  getEtapaService: () => ({
    listarEmpatesPendentes: mockListarEmpatesPendentes,
    resolverEmpate: mockResolverEmpate,
  }),
}));

import { PainelEmpatesPendentes } from "@/components/etapas/PainelEmpatesPendentes";
import { EmpatePendente } from "@/types/etapa";

const empateGrupoA: EmpatePendente = {
  grupoId: "grupo-a",
  grupoNome: "Grupo A",
  posicaoInicial: 2,
  participantes: [
    { id: "lipe", nome: "Lipe Dias" },
    { id: "davi", nome: "Davi Louzada" },
  ],
};

const empateGrupoB: EmpatePendente = {
  grupoId: "grupo-b",
  grupoNome: "Grupo B",
  posicaoInicial: 1,
  participantes: [
    { id: "ana", nome: "Ana" },
    { id: "bia", nome: "Bia" },
  ],
};

// O controle de "empate já visto" é por etapa e dura a sessão da página,
// então cada teste usa um etapaId diferente
let contadorEtapa = 0;
const novaEtapaId = () => `etapa-${++contadorEtapa}`;

// Na primeira carga só aparece o aviso: o modal é aberto pelo "Resolver"
const abrirModal = async (indice = 0) => {
  const botoes = await screen.findAllByRole("button", { name: "Resolver" });
  fireEvent.click(botoes[indice]);
};

describe("PainelEmpatesPendentes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("não deve renderizar nada sem empates", async () => {
    mockListarEmpatesPendentes.mockResolvedValue([]);
    const etapaId = novaEtapaId();

    const { container } = render(
      <PainelEmpatesPendentes etapaId={etapaId} onResolvido={jest.fn()} />
    );

    await waitFor(() =>
      expect(mockListarEmpatesPendentes).toHaveBeenCalledWith(etapaId)
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("não deve buscar empates com etapa finalizada", async () => {
    const onEmpatesChange = jest.fn();

    render(
      <PainelEmpatesPendentes
        etapaId={novaEtapaId()}
        onResolvido={jest.fn()}
        onEmpatesChange={onEmpatesChange}
        desabilitado
      />
    );

    await waitFor(() => expect(onEmpatesChange).toHaveBeenCalledWith([]));
    expect(mockListarEmpatesPendentes).not.toHaveBeenCalled();
  });

  it("ao abrir a página mostra só o aviso, sem abrir o modal", async () => {
    mockListarEmpatesPendentes.mockResolvedValue([empateGrupoA, empateGrupoB]);

    render(
      <PainelEmpatesPendentes etapaId={novaEtapaId()} onResolvido={jest.fn()} />
    );

    expect(await screen.findByText("2 empates na classificação")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Resolver" })).toHaveLength(2);
    expect(screen.queryByText("Empate no Grupo A")).not.toBeInTheDocument();
  });

  it("deve informar os empates ao pai (para bloquear ações)", async () => {
    mockListarEmpatesPendentes.mockResolvedValue([empateGrupoA]);
    const onEmpatesChange = jest.fn();

    render(
      <PainelEmpatesPendentes
        etapaId={novaEtapaId()}
        onResolvido={jest.fn()}
        onEmpatesChange={onEmpatesChange}
      />
    );

    await waitFor(() =>
      expect(onEmpatesChange).toHaveBeenCalledWith([empateGrupoA])
    );
  });

  it("deve abrir o modal sozinho quando surge um empate novo durante o uso", async () => {
    const etapaId = novaEtapaId();
    mockListarEmpatesPendentes.mockResolvedValueOnce([]);

    const { rerender } = render(
      <PainelEmpatesPendentes etapaId={etapaId} atualizarEm={1} onResolvido={jest.fn()} />
    );
    await waitFor(() => expect(mockListarEmpatesPendentes).toHaveBeenCalledTimes(1));

    // Admin salvou o último resultado do grupo: classificação recarregada
    mockListarEmpatesPendentes.mockResolvedValueOnce([empateGrupoA]);
    rerender(
      <PainelEmpatesPendentes etapaId={etapaId} atualizarEm={2} onResolvido={jest.fn()} />
    );

    expect(await screen.findByText("Empate no Grupo A")).toBeInTheDocument();
    expect(screen.getByText(/disputam o/)).toHaveTextContent("2º e 3º lugar");
  });

  it("não deve reabrir sozinho um empate já visto (ex: tela recarregada)", async () => {
    const etapaId = novaEtapaId();
    mockListarEmpatesPendentes.mockResolvedValue([empateGrupoA]);

    const { unmount } = render(
      <PainelEmpatesPendentes etapaId={etapaId} onResolvido={jest.fn()} />
    );
    expect(await screen.findByText("Empate na classificação")).toBeInTheDocument();

    // Tela de chaves desmonta/monta ao recarregar
    unmount();
    render(<PainelEmpatesPendentes etapaId={etapaId} onResolvido={jest.fn()} />);

    expect(await screen.findByText("Empate na classificação")).toBeInTheDocument();
    expect(screen.queryByText("Empate no Grupo A")).not.toBeInTheDocument();
  });

  it("'Decidir depois' fecha o modal e mantém o aviso", async () => {
    mockListarEmpatesPendentes.mockResolvedValue([empateGrupoA]);

    render(
      <PainelEmpatesPendentes etapaId={novaEtapaId()} onResolvido={jest.fn()} />
    );

    await abrirModal();
    fireEvent.click(screen.getByRole("button", { name: "Decidir depois" }));

    expect(screen.queryByText("Empate no Grupo A")).not.toBeInTheDocument();
    expect(screen.getByText("Empate na classificação")).toBeInTheDocument();
  });

  it("'Resolver' abre o empate escolhido", async () => {
    mockListarEmpatesPendentes.mockResolvedValue([empateGrupoA, empateGrupoB]);

    render(
      <PainelEmpatesPendentes etapaId={novaEtapaId()} onResolvido={jest.fn()} />
    );

    await abrirModal(1);

    expect(screen.getByText("Empate no Grupo B")).toBeInTheDocument();
  });

  it("deve mostrar o contexto do empate entre grupos", async () => {
    mockListarEmpatesPendentes.mockResolvedValue([
      {
        grupoId: "eliminatoria-primeiros",
        grupoNome: "Ranking dos 1º colocados",
        posicaoInicial: 1,
        participantes: [
          { id: "a", nome: "Ana (Grupo A)" },
          { id: "b", nome: "Bia (Grupo B)" },
          { id: "c", nome: "Cris (Grupo C)" },
        ],
        contexto: "Esta ordem define as duplas da eliminatória",
      },
    ]);

    render(
      <PainelEmpatesPendentes etapaId={novaEtapaId()} onResolvido={jest.fn()} />
    );

    await abrirModal();

    expect(screen.getByText("Empate no Ranking dos 1º colocados")).toBeInTheDocument();
    expect(
      screen.getByText("Esta ordem define as duplas da eliminatória")
    ).toBeInTheDocument();
    expect(screen.getByText(/disputam o/)).toHaveTextContent("1º, 2º e 3º lugar");
  });

  it("deve enviar a ordem escolhida manualmente", async () => {
    mockListarEmpatesPendentes.mockResolvedValue([empateGrupoA]);
    mockResolverEmpate.mockResolvedValue({
      modo: "manual",
      participantes: [empateGrupoA.participantes[1], empateGrupoA.participantes[0]],
    });
    const onResolvido = jest.fn();
    const etapaId = novaEtapaId();

    render(<PainelEmpatesPendentes etapaId={etapaId} onResolvido={onResolvido} />);

    await abrirModal();
    fireEvent.click(screen.getByRole("radio", { name: /Escolher a ordem/ }));
    fireEvent.click(screen.getByRole("button", { name: "Descer Lipe Dias" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar ordem" }));

    await waitFor(() => expect(onResolvido).toHaveBeenCalled());
    expect(mockResolverEmpate).toHaveBeenCalledWith(etapaId, {
      grupoId: "grupo-a",
      ids: ["davi", "lipe"],
      modo: "manual",
    });
  });

  it("deve sortear e mostrar o resultado antes de fechar", async () => {
    mockListarEmpatesPendentes.mockResolvedValue([empateGrupoA]);
    mockResolverEmpate.mockResolvedValue({
      modo: "sorteio",
      participantes: [empateGrupoA.participantes[1], empateGrupoA.participantes[0]],
    });
    const onResolvido = jest.fn();
    const etapaId = novaEtapaId();

    render(<PainelEmpatesPendentes etapaId={etapaId} onResolvido={onResolvido} />);

    await abrirModal();
    fireEvent.click(screen.getByRole("button", { name: "Sortear" }));

    expect(
      await screen.findByText("Resultado do sorteio — Grupo A")
    ).toBeInTheDocument();
    expect(mockResolverEmpate).toHaveBeenCalledWith(etapaId, {
      grupoId: "grupo-a",
      ids: ["lipe", "davi"],
      modo: "sorteio",
    });
    expect(onResolvido).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Fechar" }));
    await waitFor(() => expect(onResolvido).toHaveBeenCalled());
  });

  it("deve mostrar erro do backend sem fechar o modal", async () => {
    mockListarEmpatesPendentes.mockResolvedValue([empateGrupoA]);
    mockResolverEmpate.mockRejectedValue(
      new Error("Empate não encontrado ou já resolvido")
    );

    render(
      <PainelEmpatesPendentes etapaId={novaEtapaId()} onResolvido={jest.fn()} />
    );

    await abrirModal();
    fireEvent.click(screen.getByRole("button", { name: "Sortear" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Empate não encontrado ou já resolvido"
    );
    expect(screen.getByText("Empate no Grupo A")).toBeInTheDocument();
  });
});
