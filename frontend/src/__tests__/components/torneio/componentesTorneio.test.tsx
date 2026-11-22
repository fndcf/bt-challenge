/**
 * Testes dos componentes de domínio: TabelaClassificacao, GrupoPainel e
 * CardConfronto
 */

import { render, screen, within } from "@testing-library/react";
import {
  CardConfronto,
  GrupoPainel,
  TabelaClassificacao,
} from "@/components/torneio";
import { getCoresFormato } from "@/styles/semantic";
import { FormatoEtapa } from "@/types/etapa";
import { COLUNAS_ADMIN, LinhaClassificacao } from "@/utils/classificacao";

const linhas: LinhaClassificacao[] = [
  {
    id: "1",
    posicao: 1,
    nome: "Ana & Bia",
    detalhe: "Nível: avançado",
    classificado: true,
    estatisticas: {
      jogos: 2,
      vitorias: 2,
      derrotas: 0,
      pontos: 6,
      gamesVencidos: 12,
      gamesPerdidos: 4,
      saldoGames: 8,
    },
  },
  {
    id: "2",
    posicao: 2,
    nome: "Caio & Davi",
    estatisticas: { jogos: 2, derrotas: 2, saldoGames: -8 },
  },
];

const renderTabela = (
  props: Partial<React.ComponentProps<typeof TabelaClassificacao>> = {}
) =>
  render(
    <TabelaClassificacao
      formato={FormatoEtapa.SUPER_X}
      legenda="Classificação do Grupo A"
      rotuloNome="Dupla"
      colunas={COLUNAS_ADMIN}
      linhas={linhas}
      {...props}
    />
  );

describe("TabelaClassificacao", () => {
  it("deve ser uma tabela com nome acessível e colunas na ordem pedida", () => {
    renderTabela();

    expect(
      screen.getByRole("table", { name: "Classificação do Grupo A" })
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("columnheader").map((c) => c.textContent)
    ).toEqual(["#", "Dupla", "PTS", "V-D", "GF-GC", "SG"]);
  });

  it("deve mostrar os valores e o sinal do saldo", () => {
    renderTabela();
    const [, primeira, segunda] = screen.getAllByRole("row");

    expect(within(primeira).getByText("6")).toBeInTheDocument();
    expect(within(primeira).getByText("2-0")).toBeInTheDocument();
    expect(within(primeira).getByText("12-4")).toBeInTheDocument();
    expect(within(primeira).getByText("+8")).toBeInTheDocument();
    expect(within(primeira).getByText("Nível: avançado")).toBeInTheDocument();
    expect(within(segunda).getByText("-8")).toBeInTheDocument();
  });

  it("deve mostrar zero quando a estatística não existe", () => {
    renderTabela();
    const segunda = screen.getAllByRole("row")[2];

    expect(within(segunda).getByText("0")).toBeInTheDocument();
    expect(within(segunda).getByText("0-2")).toBeInTheDocument();
    expect(within(segunda).getByText("0-0")).toBeInTheDocument();
  });

  it("deve indicar o classificado também em texto", () => {
    renderTabela();
    const [, primeira, segunda] = screen.getAllByRole("row");

    expect(within(primeira).getByText("(classificado)")).toBeInTheDocument();
    expect(
      within(segunda).queryByText("(classificado)")
    ).not.toBeInTheDocument();
  });

  it("deve mostrar só posição e nome sem estatísticas", () => {
    renderTabela({ mostrarEstatisticas: false });

    expect(screen.getAllByRole("columnheader")).toHaveLength(2);
    expect(screen.queryByText("PTS")).not.toBeInTheDocument();
    expect(screen.getByText("Ana & Bia")).toBeInTheDocument();
  });

  it.each(Object.values(FormatoEtapa))(
    "deve usar a cor do formato %s no número da posição",
    (formato) => {
      renderTabela({ formato, mostrarEstatisticas: false });

      expect(screen.getByText("1")).toHaveStyle({
        color: getCoresFormato(formato).texto,
      });
    }
  );
});

describe("GrupoPainel", () => {
  it("deve mostrar cabeçalho, progresso, selo de completo e ação", () => {
    render(
      <GrupoPainel
        formato={FormatoEtapa.TEAMS}
        nome="Grupo A"
        etiquetas={["3 equipes", "2/3 confrontos"]}
        progresso="3 / 3 partidas"
        completo
        acao={<button>Registrar</button>}
      >
        conteúdo
      </GrupoPainel>
    );

    const titulo = screen.getByRole("heading", { name: "Grupo A" });
    expect(titulo.parentElement).toHaveStyle({
      background: getCoresFormato(FormatoEtapa.TEAMS).solido,
    });
    expect(screen.getByText("3 equipes")).toBeInTheDocument();
    expect(screen.getByText("2/3 confrontos")).toBeInTheDocument();
    expect(screen.getByText("3 / 3 partidas")).toBeInTheDocument();
    expect(screen.getByText("Completo")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Registrar" })).toBeEnabled();
  });

  it("não deve mostrar o selo enquanto o grupo não terminou", () => {
    render(
      <GrupoPainel nome="Grupo A" progresso="1 / 3 partidas">
        conteúdo
      </GrupoPainel>
    );

    expect(screen.queryByText("Completo")).not.toBeInTheDocument();
  });
});

describe("CardConfronto", () => {
  it("deve mostrar lados, placar, situação e o vencedor", () => {
    render(
      <CardConfronto
        titulo="CONFRONTO 1"
        situacao={{ label: "Finalizada", tom: "sucesso" }}
        lado1={{ nome: "Ana & Bia", detalhe: "(1º Grupo A)", placar: 6, vencedor: true }}
        lado2={{ nome: "Caio & Davi", placar: 0 }}
      />
    );

    expect(screen.getByText("CONFRONTO 1")).toBeInTheDocument();
    expect(screen.getByText("Finalizada")).toBeInTheDocument();
    expect(screen.getByText("(1º Grupo A)")).toBeInTheDocument();
    expect(screen.getByText("6")).toBeInTheDocument();
    // Placar zero também aparece
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("VS")).toBeInTheDocument();
    expect(screen.getAllByRole("img", { name: "Vencedor" })).toHaveLength(1);
  });

  it("não deve mostrar placar nem vencedor antes do resultado", () => {
    render(<CardConfronto lado1={{ nome: "Ana" }} lado2={{ nome: "Bia" }} />);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByRole("article")).toHaveTextContent(/^AnaVSBia$/);
  });

  it("deve mostrar ações e conteúdo, sem VS no compacto", () => {
    render(
      <CardConfronto
        compacto
        etiquetas={<span>FEM</span>}
        lado1={{ nome: "Ana" }}
        lado2={{ nome: "Bia" }}
        acoes={<button>Editar</button>}
      >
        <p>Empate 1-1</p>
      </CardConfronto>
    );

    expect(screen.queryByText("VS")).not.toBeInTheDocument();
    expect(screen.getByText("FEM")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Editar" })).toBeInTheDocument();
    expect(screen.getByText("Empate 1-1")).toBeInTheDocument();
  });
});
