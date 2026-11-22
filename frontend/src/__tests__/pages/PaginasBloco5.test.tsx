/**
 * Testes das peças das páginas: campos novos do ui, formulários da etapa e
 * modais
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import { ModalNovaArena } from "@/components/modals/ModalNovaArena";
import { ModalSubstituirJogador } from "@/components/modals/ModalSubstituirJogador";
import {
  ButtonLink,
  Checkbox,
  OpcoesCartao,
  Textarea,
} from "@/components/ui";
import { ConfiguracoesJogadores } from "@/pages/CriarEtapa/components/ConfiguracoesJogadores";
import { DistribuicaoPreview } from "@/pages/CriarEtapa/components/DistribuicaoPreview";
import { InformacoesBasicas } from "@/pages/CriarEtapa/components/InformacoesBasicas";
import { ConfiguracoesJogadoresEdit } from "@/pages/EditarEtapa/components/ConfiguracoesJogadoresEdit";
import { FormatoDisplay } from "@/pages/EditarEtapa/components/FormatoDisplay";
import { HistoricoCard } from "@/pages/JogadorPerfil/components/HistoricoCard";
import { JogadoresList } from "@/pages/EtapaDetalhe/components/JogadoresList";
import { SlugField } from "@/pages/RegisterArena/components/SlugField";
import {
  FormatoEtapa,
  TipoFormacaoDupla,
  VarianteTeams,
} from "@/types/etapa";
import { GeneroJogador } from "@/types/jogador";

const mockDisponiveis = jest.fn();
const mockSubstituir = jest.fn();
jest.mock("@/services", () => ({
  getEtapaService: () => ({
    buscarJogadoresDisponiveis: mockDisponiveis,
    substituirJogador: mockSubstituir,
  }),
}));

const nada = jest.fn();

describe("ui: campos novos", () => {
  it("Checkbox liga rótulo, ajuda e valor", () => {
    const onChange = jest.fn();
    render(
      <Checkbox label="Aceito" helperText="Ajuda" checked={false} onChange={onChange} />
    );

    const caixa = screen.getByRole("checkbox", { name: "Aceito" });
    expect(caixa).toHaveAccessibleDescription("Ajuda");
    fireEvent.click(caixa);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("OpcoesCartao marca a opção e avisa a troca", () => {
    const onChange = jest.fn();
    render(
      <OpcoesCartao
        rotulo="Escolha"
        opcoes={[
          { valor: "a", titulo: "A", descricao: "Primeira" },
          { valor: "b", titulo: "B", descricao: "Segunda" },
        ]}
        valor="a"
        onChange={onChange}
      />
    );

    expect(screen.getByRole("radio", { name: /Primeira/ })).toBeChecked();
    fireEvent.click(screen.getByRole("radio", { name: /Segunda/ }));
    expect(onChange).toHaveBeenCalledWith("b");
  });

  it("Textarea mostra o erro no lugar da ajuda", () => {
    render(
      <Textarea label="Texto" helperText="Ajuda" error="Inválido" onChange={nada} value="" />
    );

    expect(screen.getByLabelText("Texto")).toBeInvalid();
    expect(screen.getByText("Inválido")).toBeInTheDocument();
    expect(screen.queryByText("Ajuda")).not.toBeInTheDocument();
  });

  it("ButtonLink é um link", () => {
    render(
      <MemoryRouter>
        <ButtonLink to="/destino">Ir</ButtonLink>
      </MemoryRouter>
    );
    expect(screen.getByRole("link", { name: "Ir" })).toHaveAttribute(
      "href",
      "/destino"
    );
  });
});

describe("Criar etapa: número de jogadores", () => {
  const renderizar = (formato: FormatoEtapa, extra: object = {}) => {
    const onMaxJogadoresChange = jest.fn();
    render(
      <ConfiguracoesJogadores
        formato={formato}
        maxJogadores={16}
        contaPontosRanking
        darPontosParticipacao
        melhorDe3={false}
        melhorDe3Eliminatoria={false}
        onMaxJogadoresChange={onMaxJogadoresChange}
        onContaPontosRankingChange={nada}
        onDarPontosParticipacaoChange={nada}
        onMelhorDe3Change={nada}
        onMelhorDe3EliminatoriaChange={nada}
        {...extra}
      />
    );
    return onMaxJogadoresChange;
  };

  it.each([
    [FormatoEtapa.DUPLA_FIXA, "3", 6],
    [FormatoEtapa.DUPLA_FIXA, "17", 18],
    [FormatoEtapa.DUPLA_FIXA, "99", 52],
    [FormatoEtapa.REI_DA_PRAIA, "", 8],
    [FormatoEtapa.REI_DA_PRAIA, "10", 12],
    [FormatoEtapa.REI_DA_PRAIA, "70", 64],
    [FormatoEtapa.TEAMS, "5", 8],
    [FormatoEtapa.TEAMS, "13", 16],
    [FormatoEtapa.TEAMS, "200", 104],
  ])("%s: %s vira %i ao sair do campo", (formato, digitado, esperado) => {
    const onMax = renderizar(formato);
    fireEvent.blur(screen.getByRole("spinbutton"), {
      target: { value: digitado },
    });
    expect(onMax).toHaveBeenLastCalledWith(esperado);
  });

  it("valor já válido não muda", () => {
    const onMax = renderizar(FormatoEtapa.TEAMS, {
      varianteTeams: VarianteTeams.TEAMS_6,
      maxJogadores: 18,
    });
    fireEvent.blur(screen.getByRole("spinbutton"));
    expect(onMax).not.toHaveBeenCalled();
  });

  it("Super X não tem campo nem pontos de participação", () => {
    renderizar(FormatoEtapa.SUPER_X);
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText("Dar pontos de participação")
    ).not.toBeInTheDocument();
  });
});

describe("Criar etapa: nível e prévia", () => {
  const props = {
    nome: "",
    descricao: "",
    genero: GeneroJogador.MASCULINO,
    local: "",
    onNomeChange: nada,
    onDescricaoChange: nada,
    onGeneroChange: nada,
    onNivelChange: nada,
    onLocalChange: nada,
  };

  it("nível é obrigatório na Dupla Fixa e opcional na balanceada", () => {
    const { rerender } = render(
      <InformacoesBasicas {...props} formato={FormatoEtapa.DUPLA_FIXA} />
    );
    expect(screen.getByLabelText(/Nível/)).toBeRequired();
    expect(screen.queryByText("Todos os níveis")).not.toBeInTheDocument();

    rerender(
      <InformacoesBasicas
        {...props}
        formato={FormatoEtapa.DUPLA_FIXA}
        tipoFormacaoDupla={TipoFormacaoDupla.BALANCEADO}
      />
    );
    expect(screen.getByLabelText(/Nível/)).not.toBeRequired();
    expect(screen.getByText("Todos os níveis")).toBeInTheDocument();
  });

  it("misto só em Teams e Dupla Fixa", () => {
    const { rerender } = render(
      <InformacoesBasicas {...props} formato={FormatoEtapa.TEAMS} />
    );
    expect(screen.getByText("Misto")).toBeInTheDocument();
    rerender(
      <InformacoesBasicas {...props} formato={FormatoEtapa.REI_DA_PRAIA} />
    );
    expect(screen.queryByText("Misto")).not.toBeInTheDocument();
  });

  it("prévia avisa quando o número não fecha", () => {
    const base: any = {
      formato: FormatoEtapa.REI_DA_PRAIA,
      tipoChaveamento: "melhores_com_melhores",
      infoDuplaFixa: {},
    };
    const { rerender } = render(
      <DistribuicaoPreview
        {...base}
        infoReiDaPraia={{ valido: false, descricao: "Precisa ser múltiplo de 4" }}
      />
    );
    expect(screen.getByText("Precisa ser múltiplo de 4")).toBeInTheDocument();

    rerender(
      <DistribuicaoPreview
        {...base}
        infoReiDaPraia={{
          valido: true,
          descricao: "Detalhe",
          totalJogadores: 4,
          qtdGrupos: 1,
        }}
      />
    );
    expect(screen.getByText(/grupo$/)).toBeInTheDocument();
    expect(screen.getByText(/Cada grupo: 4 jogadores/)).toBeInTheDocument();
  });
});

describe("Editar etapa", () => {
  it("com chaves geradas tudo fica bloqueado", () => {
    render(
      <ConfiguracoesJogadoresEdit
        formato={FormatoEtapa.DUPLA_FIXA}
        maxJogadores={16}
        chavesGeradas
        temInscritos
        totalInscritos={16}
        minimoJogadores={16}
        contaPontosRanking
        darPontosParticipacao
        melhorDe3
        melhorDe3Eliminatoria
        onMaxJogadoresChange={nada}
        onBlur={nada}
        onContaPontosRankingChange={nada}
        onDarPontosParticipacaoChange={nada}
        onMelhorDe3Change={nada}
        onMelhorDe3EliminatoriaChange={nada}
      />
    );

    expect(screen.getByRole("spinbutton")).toBeDisabled();
    const caixas = screen.getAllByRole("checkbox");
    expect(caixas).toHaveLength(4);
    caixas.forEach((caixa) => expect(caixa).toBeDisabled());
  });

  it("mostra o formato com a variante", () => {
    render(
      <FormatoDisplay
        formato={FormatoEtapa.TEAMS}
        varianteTeams={VarianteTeams.TEAMS_6}
        chavesGeradas={false}
        onTipoChaveamentoChange={nada}
      />
    );
    expect(screen.getByText("Teams 6")).toBeInTheDocument();
  });
});

describe("ModalSubstituirJogador", () => {
  it("escolhe quem sai e quem entra e confirma", async () => {
    mockDisponiveis.mockResolvedValue([
      { id: "n1", nome: "Novo", nivel: "iniciante", genero: "masculino" },
    ]);
    mockSubstituir.mockResolvedValue(undefined);
    const onSuccess = jest.fn();

    render(
      <ModalSubstituirJogador
        isOpen
        onClose={nada}
        onSuccess={onSuccess}
        etapaId="e1"
        inscricoes={[
          {
            id: "i1",
            jogadorId: "a1",
            jogadorNome: "Antigo",
            jogadorNivel: "iniciante",
            jogadorGenero: "masculino",
          } as any,
        ]}
      />
    );

    const confirmar = screen.getByText("Confirmar Substituição");
    expect(confirmar).toBeDisabled();

    fireEvent.click(screen.getByRole("radio", { name: /Antigo/ }));
    fireEvent.click(await screen.findByRole("radio", { name: /Novo/ }));
    fireEvent.click(confirmar);

    await waitFor(() =>
      expect(mockSubstituir).toHaveBeenCalledWith("e1", "a1", "n1")
    );
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
  });
});

describe("ModalNovaArena", () => {
  it("limpa o slug digitado e cria", async () => {
    const onCriar = jest.fn().mockResolvedValue(undefined);
    const onClose = jest.fn();
    render(<ModalNovaArena isOpen onClose={onClose} onCriar={onCriar} />);

    expect(screen.getByText("Criar Arena")).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/Nome da Arena/), {
      target: { value: "Minha Arena" },
    });
    fireEvent.change(screen.getByLabelText(/Slug/), {
      target: { value: "Minha Arena!" },
    });
    fireEvent.click(screen.getByText("Criar Arena"));

    await waitFor(() =>
      expect(onCriar).toHaveBeenCalledWith("Minha Arena", "minhaarena")
    );
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});

describe("páginas públicas e cadastro", () => {
  it("lista de inscritos pagina de 12 em 12 e continua a numeração", () => {
    render(
      <MemoryRouter>
        <JogadoresList
          slug="arena"
          jogadores={Array.from({ length: 13 }, (_, i) => ({
            id: `j${i}`,
            nome: `Jogador ${i + 1}`,
          }))}
        />
      </MemoryRouter>
    );

    expect(screen.queryByText("Jogador 13")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Próxima →"));
    expect(screen.getByRole("link", { name: /13.*Jogador 13/ })).toHaveAttribute(
      "href",
      "/arena/arena/jogador/j12"
    );
  });

  it("histórico mostra games e leva à etapa", () => {
    render(
      <MemoryRouter>
        <HistoricoCard
          slug="arena"
          historico={[
            { id: "h1", etapaId: "e1", etapaNome: "Etapa 1", gamesVencidos: 6, gamesPerdidos: 2 },
          ]}
        />
      </MemoryRouter>
    );
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/arena/arena/etapa/e1"
    );
    expect(screen.getByTitle("6 vencidos, 2 perdidos")).toBeInTheDocument();
  });

  it("slug mostra a disponibilidade", () => {
    const props = { value: "arena", disabled: false, onChange: nada };
    const { rerender } = render(
      <SlugField {...props} checkingSlug={false} slugAvailable />
    );
    expect(screen.getByRole("status")).toHaveTextContent("Slug disponível!");

    rerender(
      <SlugField {...props} checkingSlug={false} slugAvailable={false} />
    );
    expect(screen.getByRole("status")).toHaveTextContent("já está em uso");
  });
});
