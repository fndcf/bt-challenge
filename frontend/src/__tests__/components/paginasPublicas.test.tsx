/**
 * Testes complementares das páginas públicas: ranking, grupos e chave
 */

import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { RankingItem } from "@/components/jogadores/RankingList/components/RankingItem";
import { BracketViewer } from "@/components/visualizadores/BracketViewer";
import { ConfrontoPublico } from "@/components/visualizadores/GruposViewer/components/PartidasPublicas";
import {
  getFormato,
  montarTabela,
  ordenarGrupos,
  resumirGrupos,
} from "@/components/visualizadores/GruposViewer/gruposHelpers";
import { FormatoEtapa } from "@/types/etapa";

describe("RankingItem", () => {
  const renderItem = (jogador: object) =>
    render(
      <MemoryRouter>
        <RankingItem
          jogador={{ id: "1", jogadorNome: "Ana", ...jogador }}
          posicao={4}
          arenaSlug="arena"
        />
      </MemoryRouter>
    );

  it("deve mostrar zero pontos em vez de esconder", () => {
    renderItem({ pontos: 0, vitorias: 0 });

    expect(screen.getByText("Pts").nextSibling).toHaveTextContent("0");
    expect(screen.getByText("V").nextSibling).toHaveTextContent("0");
    expect(screen.queryByText("Games")).not.toBeInTheDocument();
  });

  it("deve mostrar posição, games e link para o perfil", () => {
    renderItem({ jogadorId: "jog-9", gamesVencidos: 12, gamesPerdidos: 7 });

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/arena/arena/jogador/jog-9");
    expect(within(link).getByText("4")).toBeInTheDocument();
    expect(screen.getByText("Games").nextSibling).toHaveTextContent("12/7");
  });
});

describe("ConfrontoPublico", () => {
  const confronto: any = {
    id: "c1",
    equipe1Id: "e1",
    equipe2Id: "e2",
    equipe1Nome: "Equipe 1",
    equipe2Nome: "Equipe 2",
    jogosEquipe1: 1,
    jogosEquipe2: 1,
    status: "em_andamento",
    vencedoraId: "e1",
    partidas: [
      {
        id: "p1",
        tipoJogo: "feminino",
        status: "finalizada",
        // Como a API manda: lista de jogadores, sem a equipe
        dupla1: [{ nome: "Ana" }, { nome: "Bia" }],
        dupla2: [{ nome: "Carla" }, { nome: "Duda" }],
        placar: [{ gamesDupla1: 4, gamesDupla2: 6 }],
        vencedoraEquipeId: "e2",
      },
    ],
  };

  it("deve marcar o vencedor da partida, e não o do confronto em andamento", () => {
    render(<ConfrontoPublico confronto={confronto} />);

    const vencedores = screen.getAllByRole("img", { name: "Vencedor" });
    expect(vencedores).toHaveLength(1);
    expect(vencedores[0].parentElement).toHaveTextContent("Carla & Duda");
    expect(screen.getByText("Em andamento")).toBeInTheDocument();
    expect(screen.getByText("Feminino")).toBeInTheDocument();
  });

  it("deve marcar o vencedor do confronto encerrado", () => {
    render(
      <ConfrontoPublico
        confronto={{ ...confronto, status: "finalizado", partidas: [] }}
      />
    );
    const [vencedor] = screen.getAllByRole("img", { name: "Vencedor" });
    expect(vencedor.parentElement).toHaveTextContent("Equipe 1");
  });
});

describe("BracketViewer", () => {
  it("deve mostrar 'A definir', e não BYE, quando falta o adversário", () => {
    render(
      <BracketViewer
        chaves={{
          formato: "dupla_fixa",
          temChaves: true,
          rodadas: [
            {
              numero: 3,
              nome: "Final",
              partidas: [
                {
                  id: "f",
                  numero: 1,
                  jogador1: { id: "1", nome: "Ana & Bia" },
                  jogador2: null,
                  status: "agendada",
                },
              ],
            },
          ],
        }}
      />
    );

    expect(screen.getByText("A definir")).toBeInTheDocument();
    expect(screen.queryByText(/BYE/)).not.toBeInTheDocument();
  });
});

describe("gruposHelpers", () => {
  const grupo = (dados: object): any => ({ id: "g", partidas: [], ...dados });

  it("deve deduzir o formato de grupos antigos", () => {
    expect(getFormato([grupo({ formato: "super_x" })])).toBe(
      FormatoEtapa.SUPER_X
    );
    expect(getFormato([grupo({ equipes: [{}] })])).toBe(FormatoEtapa.TEAMS);
    expect(getFormato([grupo({ jogadores: [{}] })])).toBe(
      FormatoEtapa.REI_DA_PRAIA
    );
    expect(getFormato([grupo({})])).toBe(FormatoEtapa.DUPLA_FIXA);
  });

  it("deve ignorar marca de classificado fora das vagas do Rei da Praia", () => {
    const jogadores = [1, 2, 3, 4].map((posicaoGrupo) => ({
      id: `j${posicaoGrupo}`,
      jogadorNome: `J${posicaoGrupo}`,
      posicaoGrupo,
      classificado: true,
    }));
    const classificados = (formato: FormatoEtapa) =>
      montarTabela(grupo({ jogadores }), formato)
        ?.linhas.filter((linha) => linha.classificado)
        .map((linha) => linha.id);

    expect(classificados(FormatoEtapa.REI_DA_PRAIA)).toEqual(["j1", "j2"]);
    expect(classificados(FormatoEtapa.SUPER_X)).toEqual([]);
  });

  it("deve pôr a eliminatória depois dos grupos", () => {
    const ordem = ordenarGrupos([
      grupo({ id: "final", tipo: "eliminatoria", ordem: 1 }),
      grupo({ id: "b", ordem: 2 }),
      grupo({ id: "a", ordem: 1 }),
    ]).map((g) => g.id);

    expect(ordem).toEqual(["a", "b", "final"]);
  });

  it("deve resumir partidas, ou confrontos no Teams", () => {
    const partidas = [{ status: "FINALIZADA" }, { status: "agendada" }];
    const confrontos = [
      { status: "finalizado" },
      { status: "finalizado" },
      { status: "agendado" },
    ];

    expect(
      resumirGrupos([grupo({ partidas })], FormatoEtapa.DUPLA_FIXA)
    ).toEqual({ total: 2, finalizados: 1, progresso: 50 });
    expect(resumirGrupos([grupo({ confrontos })], FormatoEtapa.TEAMS)).toEqual({
      total: 3,
      finalizados: 2,
      progresso: 67,
    });
    expect(resumirGrupos([grupo({})], FormatoEtapa.SUPER_X).progresso).toBe(0);
  });
});
