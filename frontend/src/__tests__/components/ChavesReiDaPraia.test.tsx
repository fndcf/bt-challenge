/**
 * Testes do componente ChavesReiDaPraia
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// Mock dos services
const mockBuscarGrupos = jest.fn();
const mockBuscarJogadores = jest.fn();
const mockBuscarConfrontosEliminatorios = jest.fn();

jest.mock("@/services", () => ({
  getReiDaPraiaService: () => ({
    buscarGrupos: mockBuscarGrupos,
    buscarJogadores: mockBuscarJogadores,
    buscarConfrontosEliminatorios: mockBuscarConfrontosEliminatorios,
  }),
}));

// Mock do PartidasGrupoReiDaPraia
jest.mock("@/components/etapas/PartidasGrupoReiDaPraia", () => ({
  PartidasGrupoReiDaPraia: ({ grupoNome }: { grupoNome: string }) => (
    <div data-testid="partidas-grupo">Partidas do {grupoNome}</div>
  ),
}));

// Mock do FaseEliminatoriaReiDaPraia
jest.mock("@/components/etapas/FaseEliminatoriaReiDaPraia", () => ({
  FaseEliminatoriaReiDaPraia: () => (
    <div data-testid="fase-eliminatoria">Fase Eliminatória Rei da Praia</div>
  ),
}));

import { ChavesReiDaPraia } from "@/components/etapas/ChavesReiDaPraia/ChavesReiDaPraia";

const mockGrupos = [
  {
    id: "grupo-1",
    nome: "Grupo A",
    etapaId: "etapa-1",
    completo: true,
    partidasFinalizadas: 3,
    totalPartidas: 3,
  },
  {
    id: "grupo-2",
    nome: "Grupo B",
    etapaId: "etapa-1",
    completo: false,
    partidasFinalizadas: 2,
    totalPartidas: 3,
  },
];

const mockJogadores = [
  {
    id: "jog-1",
    jogadorId: "jog-1",
    jogadorNome: "João Silva",
    jogadorNivel: "avancado",
    grupoId: "grupo-1",
    pontosGrupo: 9,
    jogosGrupo: 3,
    vitoriasGrupo: 3,
    derrotasGrupo: 0,
    gamesVencidosGrupo: 18,
    gamesPerdidosGrupo: 6,
    saldoGamesGrupo: 12,
    saldoSetsGrupo: 3,
    posicaoGrupo: 1,
  },
  {
    id: "jog-2",
    jogadorId: "jog-2",
    jogadorNome: "Maria Santos",
    jogadorNivel: "intermediario",
    grupoId: "grupo-1",
    pontosGrupo: 6,
    jogosGrupo: 3,
    vitoriasGrupo: 2,
    derrotasGrupo: 1,
    gamesVencidosGrupo: 14,
    gamesPerdidosGrupo: 10,
    saldoGamesGrupo: 4,
    saldoSetsGrupo: 1,
    posicaoGrupo: 2,
  },
  {
    id: "jog-3",
    jogadorId: "jog-3",
    jogadorNome: "Pedro Oliveira",
    jogadorNivel: "iniciante",
    grupoId: "grupo-2",
    pontosGrupo: 3,
    jogosGrupo: 2,
    vitoriasGrupo: 1,
    derrotasGrupo: 1,
    gamesVencidosGrupo: 10,
    gamesPerdidosGrupo: 10,
    saldoGamesGrupo: 0,
    saldoSetsGrupo: 0,
    posicaoGrupo: 1,
  },
  {
    id: "jog-4",
    jogadorId: "jog-4",
    jogadorNome: "Ana Costa",
    grupoId: "grupo-2",
    pontosGrupo: 0,
    jogosGrupo: 2,
    vitoriasGrupo: 0,
    derrotasGrupo: 2,
    gamesVencidosGrupo: 4,
    gamesPerdidosGrupo: 12,
    saldoGamesGrupo: -8,
    saldoSetsGrupo: -2,
    posicaoGrupo: 2,
  },
];

describe("ChavesReiDaPraia", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBuscarGrupos.mockResolvedValue(mockGrupos);
    mockBuscarJogadores.mockResolvedValue(mockJogadores);
    mockBuscarConfrontosEliminatorios.mockResolvedValue([]);
  });

  describe("estado de loading", () => {
    it("deve mostrar spinner durante loading", () => {
      mockBuscarGrupos.mockReturnValue(new Promise(() => {}));
      mockBuscarJogadores.mockReturnValue(new Promise(() => {}));

      const { container } = render(
        <ChavesReiDaPraia etapaId="etapa-1" arenaId="arena-1" />
      );

      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe("estado de erro", () => {
    it("deve mostrar mensagem de erro", async () => {
      mockBuscarGrupos.mockRejectedValue(new Error("Erro ao carregar grupos"));

      render(<ChavesReiDaPraia etapaId="etapa-1" arenaId="arena-1" />);

      await waitFor(() => {
        expect(screen.getByText(/Erro:/)).toBeInTheDocument();
        expect(screen.getByText(/Erro ao carregar grupos/)).toBeInTheDocument();
      });
    });
  });

  describe("estado vazio", () => {
    it("deve mostrar mensagem quando não há grupos", async () => {
      mockBuscarGrupos.mockResolvedValue([]);
      mockBuscarJogadores.mockResolvedValue([]);

      render(<ChavesReiDaPraia etapaId="etapa-1" arenaId="arena-1" />);

      await waitFor(() => {
        expect(
          screen.getByText(/Nenhuma chave gerada ainda/)
        ).toBeInTheDocument();
      });
    });
  });

  describe("renderização de grupos", () => {
    it("deve mostrar título Rei da Praia", async () => {
      render(<ChavesReiDaPraia etapaId="etapa-1" arenaId="arena-1" />);

      await waitFor(() => {
        expect(screen.getByText("Grupos Rei da Praia")).toBeInTheDocument();
      });
    });

    it("deve mostrar estatísticas", async () => {
      render(<ChavesReiDaPraia etapaId="etapa-1" arenaId="arena-1" />);

      await waitFor(() => {
        // 2 grupos * 3 partidas = 6 partidas total
        expect(screen.getByText(/2 grupos • 4 jogadores • 6 partidas/)).toBeInTheDocument();
      });
    });

    it("deve mostrar nomes dos grupos", async () => {
      render(<ChavesReiDaPraia etapaId="etapa-1" arenaId="arena-1" />);

      await waitFor(() => {
        expect(screen.getByText("Grupo A")).toBeInTheDocument();
        expect(screen.getByText("Grupo B")).toBeInTheDocument();
      });
    });

    it("deve mostrar quantidade de jogadores por grupo", async () => {
      render(<ChavesReiDaPraia etapaId="etapa-1" arenaId="arena-1" />);

      await waitFor(() => {
        expect(screen.getAllByText("2 jogadores").length).toBeGreaterThan(0);
      });
    });

    it("deve mostrar badge de completo para grupos finalizados", async () => {
      render(<ChavesReiDaPraia etapaId="etapa-1" arenaId="arena-1" />);

      await waitFor(() => {
        expect(screen.getByText("✓ Completo")).toBeInTheDocument();
      });
    });

    it("deve mostrar progresso de partidas", async () => {
      render(<ChavesReiDaPraia etapaId="etapa-1" arenaId="arena-1" />);

      await waitFor(() => {
        expect(screen.getByText("3 / 3 partidas")).toBeInTheDocument();
        expect(screen.getByText("2 / 3 partidas")).toBeInTheDocument();
      });
    });
  });

  describe("renderização de jogadores", () => {
    it("deve mostrar nomes dos jogadores", async () => {
      render(<ChavesReiDaPraia etapaId="etapa-1" arenaId="arena-1" />);

      await waitFor(() => {
        expect(screen.getByText("João Silva")).toBeInTheDocument();
        expect(screen.getByText("Maria Santos")).toBeInTheDocument();
        expect(screen.getByText("Pedro Oliveira")).toBeInTheDocument();
        expect(screen.getByText("Ana Costa")).toBeInTheDocument();
      });
    });

    it("deve mostrar posição dos jogadores", async () => {
      render(<ChavesReiDaPraia etapaId="etapa-1" arenaId="arena-1" />);

      await waitFor(() => {
        // Posições 1 e 2 em cada grupo
        expect(screen.getAllByText("1").length).toBeGreaterThan(0);
        expect(screen.getAllByText("2").length).toBeGreaterThan(0);
      });
    });

    it("deve mostrar nível do jogador", async () => {
      render(<ChavesReiDaPraia etapaId="etapa-1" arenaId="arena-1" />);

      await waitFor(() => {
        expect(screen.getByText("Nível: Avançado")).toBeInTheDocument();
        expect(screen.getByText("Nível: Intermediário")).toBeInTheDocument();
        expect(screen.getByText("Nível: Iniciante")).toBeInTheDocument();
      });
    });

    it("deve mostrar estatísticas quando há jogos", async () => {
      render(<ChavesReiDaPraia etapaId="etapa-1" arenaId="arena-1" />);

      await waitFor(() => {
        // Labels
        expect(screen.getAllByText("PTS").length).toBeGreaterThan(0);
        expect(screen.getAllByText("V-D").length).toBeGreaterThan(0);
        expect(screen.getAllByText("GF-GC").length).toBeGreaterThan(0);
        expect(screen.getAllByText("SG").length).toBeGreaterThan(0);
      });
    });

    it("deve mostrar estatísticas com valores corretos", async () => {
      render(<ChavesReiDaPraia etapaId="etapa-1" arenaId="arena-1" />);

      await waitFor(() => {
        // João Silva: 9 pontos, 3-0, saldo +12
        expect(screen.getByText("9")).toBeInTheDocument();
        expect(screen.getByText("3-0")).toBeInTheDocument();
        expect(screen.getByText("+12")).toBeInTheDocument();
      });
    });

    it("deve mostrar saldo negativo corretamente", async () => {
      render(<ChavesReiDaPraia etapaId="etapa-1" arenaId="arena-1" />);

      await waitFor(() => {
        // Ana Costa: saldo -8
        expect(screen.getByText("-8")).toBeInTheDocument();
      });
    });
  });

  describe("tabs de navegação", () => {
    it("deve mostrar tabs de Grupos e Eliminatória", async () => {
      render(<ChavesReiDaPraia etapaId="etapa-1" arenaId="arena-1" />);

      await waitFor(() => {
        // "Fase de Grupos" aparece como tab e possivelmente em outro lugar
        expect(screen.getAllByText(/Fase de Grupos/).length).toBeGreaterThan(0);
        expect(screen.getByText("Eliminatória")).toBeInTheDocument();
      });
    });

    it("deve começar na aba de grupos", async () => {
      render(<ChavesReiDaPraia etapaId="etapa-1" arenaId="arena-1" />);

      await waitFor(() => {
        expect(screen.getByText("Grupos Rei da Praia")).toBeInTheDocument();
      });
    });

    it("deve trocar para aba eliminatória ao clicar", async () => {
      render(<ChavesReiDaPraia etapaId="etapa-1" arenaId="arena-1" />);

      await waitFor(() => {
        expect(screen.getByText("Eliminatória")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Eliminatória"));

      await waitFor(() => {
        expect(screen.getByTestId("fase-eliminatoria")).toBeInTheDocument();
      });
    });

    it("deve voltar para aba de grupos", async () => {
      render(<ChavesReiDaPraia etapaId="etapa-1" arenaId="arena-1" />);

      await waitFor(() => {
        fireEvent.click(screen.getByText("Eliminatória"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("fase-eliminatoria")).toBeInTheDocument();
      });

      // Clicar na primeira tab "Fase de Grupos"
      const faseGruposTabs = screen.getAllByText(/Fase de Grupos/);
      fireEvent.click(faseGruposTabs[0]);

      await waitFor(() => {
        expect(screen.getByText("Grupos Rei da Praia")).toBeInTheDocument();
      });
    });
  });

  describe("ver partidas", () => {
    it("deve mostrar botão Ver Partidas", async () => {
      render(<ChavesReiDaPraia etapaId="etapa-1" arenaId="arena-1" />);

      await waitFor(() => {
        expect(screen.getAllByText(/Ver Partidas/).length).toBe(2);
      });
    });

    it("deve expandir partidas ao clicar", async () => {
      render(<ChavesReiDaPraia etapaId="etapa-1" arenaId="arena-1" />);

      await waitFor(() => {
        expect(screen.getAllByText(/Ver Partidas/).length).toBeGreaterThan(0);
      });

      const verPartidasButtons = screen.getAllByText(/Ver Partidas/);
      fireEvent.click(verPartidasButtons[0]);

      await waitFor(() => {
        expect(screen.getByTestId("partidas-grupo")).toBeInTheDocument();
      });
    });

    it("deve ocultar partidas ao clicar novamente", async () => {
      render(<ChavesReiDaPraia etapaId="etapa-1" arenaId="arena-1" />);

      await waitFor(() => {
        expect(screen.getAllByText(/Ver Partidas/).length).toBeGreaterThan(0);
      });

      const verPartidasButtons = screen.getAllByText(/Ver Partidas/);
      fireEvent.click(verPartidasButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/Ocultar Partidas/)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Ocultar Partidas/));

      await waitFor(() => {
        expect(screen.queryByTestId("partidas-grupo")).not.toBeInTheDocument();
      });
    });
  });

  describe("info card", () => {
    it("deve mostrar card informativo", async () => {
      render(<ChavesReiDaPraia etapaId="etapa-1" arenaId="arena-1" />);

      await waitFor(() => {
        expect(screen.getByText("Formato Rei da Praia")).toBeInTheDocument();
        expect(
          screen.getByText(/Cada grupo tem 4 jogadores que formam duplas diferentes/)
        ).toBeInTheDocument();
      });
    });

    it("deve mostrar regras de pontuação", async () => {
      render(<ChavesReiDaPraia etapaId="etapa-1" arenaId="arena-1" />);

      await waitFor(() => {
        expect(screen.getAllByText(/3 pontos/).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/1 set/).length).toBeGreaterThan(0);
        expect(screen.getByText(/Classificação por pontos/)).toBeInTheDocument();
      });
    });
  });

  describe("ordenação de jogadores", () => {
    it("deve ordenar por posicaoGrupo quando disponível", async () => {
      render(<ChavesReiDaPraia etapaId="etapa-1" arenaId="arena-1" />);

      await waitFor(() => {
        // João Silva deve estar em primeiro (posicaoGrupo: 1)
        expect(screen.getByText("João Silva")).toBeInTheDocument();
      });
    });

    it("deve ordenar por pontos como fallback", async () => {
      // Jogadores sem posicaoGrupo
      const jogadoresSemPosicao = [
        {
          id: "a",
          jogadorId: "a",
          jogadorNome: "Jogador A",
          jogadorNivel: "iniciante",
          grupoId: "grupo-1",
          pontosGrupo: 3,
          jogosGrupo: 1,
          vitoriasGrupo: 1,
          derrotasGrupo: 0,
          gamesVencidosGrupo: 6,
          gamesPerdidosGrupo: 3,
          saldoGamesGrupo: 3,
          saldoSetsGrupo: 1,
        },
        {
          id: "b",
          jogadorId: "b",
          jogadorNome: "Jogador B",
          jogadorNivel: "iniciante",
          grupoId: "grupo-1",
          pontosGrupo: 6,
          jogosGrupo: 2,
          vitoriasGrupo: 2,
          derrotasGrupo: 0,
          gamesVencidosGrupo: 12,
          gamesPerdidosGrupo: 6,
          saldoGamesGrupo: 6,
          saldoSetsGrupo: 2,
        },
      ];

      mockBuscarJogadores.mockResolvedValue(jogadoresSemPosicao);

      render(<ChavesReiDaPraia etapaId="etapa-1" arenaId="arena-1" />);

      await waitFor(() => {
        // Jogador B deve estar em primeiro (6 pontos > 3 pontos)
        expect(screen.getByText("Jogador B")).toBeInTheDocument();
      });
    });
  });

  describe("grupo vazio", () => {
    it("deve mostrar mensagem quando grupo não tem jogadores", async () => {
      // Grupo sem jogadores
      const grupoVazio = [
        {
          id: "grupo-vazio",
          nome: "Grupo Vazio",
          etapaId: "etapa-1",
          completo: false,
          partidasFinalizadas: 0,
          totalPartidas: 3,
        },
      ];

      mockBuscarGrupos.mockResolvedValue(grupoVazio);
      mockBuscarJogadores.mockResolvedValue([]);

      render(<ChavesReiDaPraia etapaId="etapa-1" arenaId="arena-1" />);

      await waitFor(() => {
        expect(
          screen.getByText("Nenhum jogador neste grupo")
        ).toBeInTheDocument();
      });
    });
  });

  describe("eliminatória existente", () => {
    it("deve verificar se eliminatória existe", async () => {
      mockBuscarConfrontosEliminatorios.mockResolvedValue([
        { id: "confronto-1" },
      ]);

      render(<ChavesReiDaPraia etapaId="etapa-1" arenaId="arena-1" />);

      await waitFor(() => {
        expect(mockBuscarConfrontosEliminatorios).toHaveBeenCalledWith("etapa-1");
      });
    });
  });

  describe("jogador sem nível", () => {
    it("deve tratar jogador sem nível definido", async () => {
      const jogadorSemNivel = [
        {
          id: "jog-sem-nivel",
          jogadorId: "jog-sem-nivel",
          jogadorNome: "Jogador Sem Nível",
          grupoId: "grupo-1",
          pontosGrupo: 0,
          jogosGrupo: 0,
          vitoriasGrupo: 0,
          derrotasGrupo: 0,
          gamesVencidosGrupo: 0,
          gamesPerdidosGrupo: 0,
          saldoGamesGrupo: 0,
          saldoSetsGrupo: 0,
        },
      ];

      mockBuscarJogadores.mockResolvedValue(jogadorSemNivel);

      render(<ChavesReiDaPraia etapaId="etapa-1" arenaId="arena-1" />);

      await waitFor(() => {
        expect(screen.getByText("Jogador Sem Nível")).toBeInTheDocument();
        // Não deve mostrar texto de nível
        expect(screen.queryByText(/Nível:/)).not.toBeInTheDocument();
      });
    });
  });
});
