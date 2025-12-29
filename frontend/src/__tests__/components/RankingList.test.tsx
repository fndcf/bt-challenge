/**
 * Testes do componente RankingList
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { RankingList as RankingListComponent, invalidateRankingCache } from "@/components/jogadores/RankingList";
import { GeneroJogador, NivelJogador } from "@/types/jogador";

// Mock do serviço
const mockBuscarRanking = jest.fn();

jest.mock("@/services", () => ({
  getArenaPublicService: () => ({
    buscarRanking: mockBuscarRanking,
  }),
}));

const mockJogadores = [
  {
    id: "jogador-1",
    jogadorId: "jog-1",
    jogadorNome: "João Silva",
    pontos: 150,
    vitorias: 10,
    derrotas: 5,
    etapasParticipadas: 3,
  },
  {
    id: "jogador-2",
    jogadorId: "jog-2",
    jogadorNome: "Carlos Santos",
    pontos: 120,
    vitorias: 8,
    derrotas: 6,
    etapasParticipadas: 2,
  },
  {
    id: "jogador-3",
    jogadorId: "jog-3",
    jogadorNome: "Pedro Costa",
    pontos: 100,
    vitorias: 7,
    derrotas: 7,
    etapasParticipadas: 2,
  },
];

const renderWithRouter = (component: React.ReactNode) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe("RankingList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    invalidateRankingCache(); // Limpar cache entre testes
    mockBuscarRanking.mockResolvedValue(mockJogadores);
  });

  describe("renderização básica", () => {
    it("deve renderizar ranking masculino e feminino", async () => {
      renderWithRouter(<RankingListComponent arenaSlug="minha-arena" />);

      await waitFor(() => {
        expect(screen.getByText("Ranking Masculino")).toBeInTheDocument();
        expect(screen.getByText("Ranking Feminino")).toBeInTheDocument();
      });
    });

    it("deve mostrar carregando inicialmente", () => {
      mockBuscarRanking.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve([]), 1000))
      );

      renderWithRouter(<RankingListComponent arenaSlug="minha-arena" />);
      expect(screen.getAllByText("Carregando...").length).toBeGreaterThan(0);
    });

    it("deve mostrar jogadores após carregar", async () => {
      renderWithRouter(<RankingListComponent arenaSlug="minha-arena" />);

      await waitFor(() => {
        expect(screen.getAllByText("João Silva").length).toBeGreaterThan(0);
      });
    });
  });

  describe("tabs de nível", () => {
    it("deve ter tabs para todos os níveis", async () => {
      renderWithRouter(<RankingListComponent arenaSlug="minha-arena" />);

      await waitFor(() => {
        expect(screen.getAllByText(/Iniciante/).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Intermediário/).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Avançado/).length).toBeGreaterThan(0);
      });
    });

    it("deve trocar de nível ao clicar na tab", async () => {
      renderWithRouter(<RankingListComponent arenaSlug="minha-arena" />);

      await waitFor(() => {
        expect(screen.getAllByText(/Iniciante/).length).toBeGreaterThan(0);
      });

      // Clicar na tab Iniciante
      const inicianteTabs = screen.getAllByText(/Iniciante/);
      fireEvent.click(inicianteTabs[0]);

      // Deve chamar API com novo nível
      await waitFor(() => {
        expect(mockBuscarRanking).toHaveBeenCalledWith(
          "minha-arena",
          999,
          GeneroJogador.MASCULINO,
          NivelJogador.INICIANTE
        );
      });
    });
  });

  describe("estado vazio", () => {
    it("deve mostrar mensagem quando não há jogadores", async () => {
      mockBuscarRanking.mockResolvedValue([]);

      renderWithRouter(<RankingListComponent arenaSlug="minha-arena" />);

      await waitFor(() => {
        expect(
          screen.getAllByText(/Nenhum jogador/).length
        ).toBeGreaterThan(0);
      });
    });
  });

  describe("erro", () => {
    it("deve mostrar erro quando falha ao carregar", async () => {
      mockBuscarRanking.mockRejectedValue(new Error("Erro de rede"));

      renderWithRouter(<RankingListComponent arenaSlug="minha-arena" />);

      await waitFor(() => {
        expect(screen.getAllByText(/Erro/).length).toBeGreaterThan(0);
      });
    });
  });

  describe("sem arenaSlug", () => {
    it("não deve carregar sem arenaSlug", async () => {
      renderWithRouter(<RankingListComponent />);

      await waitFor(() => {
        expect(mockBuscarRanking).not.toHaveBeenCalled();
      });
    });
  });

  describe("props customizadas", () => {
    it("deve aceitar limitPorNivel", async () => {
      renderWithRouter(
        <RankingListComponent arenaSlug="minha-arena" limitPorNivel={5} />
      );

      await waitFor(() => {
        expect(screen.getAllByText(/Top 5 jogadores/).length).toBeGreaterThan(0);
      });
    });

    it("deve aceitar showPagination", async () => {
      const manyJogadores = Array.from({ length: 25 }, (_, i) => ({
        id: `jogador-${i}`,
        jogadorId: `jog-${i}`,
        jogadorNome: `Jogador ${i + 1}`,
        pontos: 150 - i,
        vitorias: 10 - Math.floor(i / 3),
        derrotas: 5 + Math.floor(i / 3),
        etapasParticipadas: 3,
      }));

      mockBuscarRanking.mockResolvedValue(manyJogadores);

      renderWithRouter(
        <RankingListComponent
          arenaSlug="minha-arena"
          showPagination={true}
          itensPorPagina={10}
        />
      );

      await waitFor(() => {
        // Deve mostrar info de paginação
        expect(screen.getAllByText(/por página/).length).toBeGreaterThan(0);
      });
    });

    it("deve aceitar className", () => {
      const { container } = renderWithRouter(
        <RankingListComponent arenaSlug="minha-arena" className="custom-class" />
      );

      expect(container.firstChild).toHaveClass("custom-class");
    });
  });

  describe("estatísticas do jogador", () => {
    it("deve mostrar pontos do jogador", async () => {
      renderWithRouter(<RankingListComponent arenaSlug="minha-arena" />);

      await waitFor(() => {
        expect(screen.getAllByText("150").length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });

    it("deve mostrar vitórias do jogador", async () => {
      renderWithRouter(<RankingListComponent arenaSlug="minha-arena" />);

      await waitFor(() => {
        expect(screen.getAllByText("10").length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });

    it("deve mostrar derrotas do jogador", async () => {
      renderWithRouter(<RankingListComponent arenaSlug="minha-arena" />);

      await waitFor(() => {
        // O mock retorna jogador com 5 derrotas
        expect(screen.getAllByText("5").length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });

    it("deve mostrar etapas participadas", async () => {
      renderWithRouter(<RankingListComponent arenaSlug="minha-arena" />);

      await waitFor(() => {
        expect(screen.getAllByText("3").length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });
  });

  describe("links para perfil", () => {
    it("deve ter links para perfil do jogador", async () => {
      renderWithRouter(<RankingListComponent arenaSlug="minha-arena" />);

      await waitFor(() => {
        const links = screen.getAllByRole("link");
        const jogadorLink = links.find((link) =>
          link.getAttribute("href")?.includes("/jogador/")
        );
        expect(jogadorLink).toBeInTheDocument();
      });
    });
  });

  describe("paginação", () => {
    it("deve navegar para próxima página", async () => {
      const manyJogadores = Array.from({ length: 25 }, (_, i) => ({
        id: `jogador-${i}`,
        jogadorId: `jog-${i}`,
        jogadorNome: `Jogador ${i + 1}`,
        pontos: 150 - i,
        vitorias: 10,
        derrotas: 5,
        etapasParticipadas: 3,
      }));

      mockBuscarRanking.mockResolvedValue(manyJogadores);

      renderWithRouter(
        <RankingListComponent
          arenaSlug="minha-arena"
          showPagination={true}
          itensPorPagina={10}
        />
      );

      await waitFor(() => {
        expect(screen.getAllByText("Próxima →").length).toBeGreaterThan(0);
      });

      // Clicar em próxima
      const proximaButtons = screen.getAllByText("Próxima →");
      fireEvent.click(proximaButtons[0]);

      await waitFor(() => {
        expect(screen.getAllByText(/Página 2/).length).toBeGreaterThan(0);
      });
    });

    it("deve navegar para página anterior", async () => {
      const manyJogadores = Array.from({ length: 25 }, (_, i) => ({
        id: `jogador-${i}`,
        jogadorId: `jog-${i}`,
        jogadorNome: `Jogador ${i + 1}`,
        pontos: 150 - i,
        vitorias: 10,
        derrotas: 5,
        etapasParticipadas: 3,
      }));

      mockBuscarRanking.mockResolvedValue(manyJogadores);

      renderWithRouter(
        <RankingListComponent
          arenaSlug="minha-arena"
          showPagination={true}
          itensPorPagina={10}
        />
      );

      await waitFor(() => {
        expect(screen.getAllByText("Próxima →").length).toBeGreaterThan(0);
      });

      // Ir para página 2
      const proximaButtons = screen.getAllByText("Próxima →");
      fireEvent.click(proximaButtons[0]);

      await waitFor(() => {
        expect(screen.getAllByText(/Página 2/).length).toBeGreaterThan(0);
      });

      // Voltar para página 1
      const anteriorButtons = screen.getAllByText("← Anterior");
      fireEvent.click(anteriorButtons[0]);

      await waitFor(() => {
        expect(screen.getAllByText(/Página 1/).length).toBeGreaterThan(0);
      });
    });

    it("deve desabilitar anterior na primeira página", async () => {
      const manyJogadores = Array.from({ length: 25 }, (_, i) => ({
        id: `jogador-${i}`,
        jogadorId: `jog-${i}`,
        jogadorNome: `Jogador ${i + 1}`,
        pontos: 150 - i,
        vitorias: 10,
        derrotas: 5,
        etapasParticipadas: 3,
      }));

      mockBuscarRanking.mockResolvedValue(manyJogadores);

      renderWithRouter(
        <RankingListComponent
          arenaSlug="minha-arena"
          showPagination={true}
          itensPorPagina={10}
        />
      );

      await waitFor(() => {
        const anteriorButtons = screen.getAllByText("← Anterior");
        expect(anteriorButtons[0]).toBeDisabled();
      });
    });
  });

  describe("posições de ranking", () => {
    it("deve exibir posição 1, 2, 3 com destaque", async () => {
      renderWithRouter(<RankingListComponent arenaSlug="minha-arena" />);

      await waitFor(() => {
        // Posições 1, 2, 3 devem estar visíveis
        expect(screen.getAllByText("1").length).toBeGreaterThan(0);
        expect(screen.getAllByText("2").length).toBeGreaterThan(0);
        expect(screen.getAllByText("3").length).toBeGreaterThan(0);
      });
    });
  });
});
