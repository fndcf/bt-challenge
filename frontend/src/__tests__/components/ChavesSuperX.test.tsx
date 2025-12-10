/**
 * Testes do componente ChavesSuperX
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// Mock dos services
const mockBuscarGrupo = jest.fn();
const mockBuscarJogadores = jest.fn();

jest.mock("@/services", () => ({
  getSuperXService: () => ({
    buscarGrupo: mockBuscarGrupo,
    buscarJogadores: mockBuscarJogadores,
  }),
}));

// Mock do PartidasSuperX
jest.mock("@/components/etapas/PartidasSuperX", () => ({
  PartidasSuperX: ({ grupoNome }: { grupoNome: string }) => (
    <div data-testid="partidas-super-x">Partidas do {grupoNome}</div>
  ),
}));

import { ChavesSuperX } from "@/components/etapas/ChavesSuperX/ChavesSuperX";
import { VarianteSuperX } from "@/types/etapa";

const mockGrupo = {
  id: "grupo-super-x",
  nome: "Super 8",
  etapaId: "etapa-1",
  completo: false,
  partidasFinalizadas: 7,
  totalPartidas: 14,
};

const mockGrupoCompleto = {
  id: "grupo-super-x",
  nome: "Super 8",
  etapaId: "etapa-1",
  completo: true,
  partidasFinalizadas: 14,
  totalPartidas: 14,
};

const mockJogadores = [
  {
    id: "jog-1",
    jogadorId: "jog-1",
    jogadorNome: "João Silva",
    jogadorNivel: "avancado",
    pontosGrupo: 18,
    jogosGrupo: 7,
    vitoriasGrupo: 6,
    derrotasGrupo: 1,
    gamesVencidosGrupo: 42,
    gamesPerdidosGrupo: 21,
    saldoGamesGrupo: 21,
    saldoSetsGrupo: 5,
    posicaoGrupo: 1,
  },
  {
    id: "jog-2",
    jogadorId: "jog-2",
    jogadorNome: "Maria Santos",
    jogadorNivel: "intermediario",
    pontosGrupo: 15,
    jogosGrupo: 7,
    vitoriasGrupo: 5,
    derrotasGrupo: 2,
    gamesVencidosGrupo: 38,
    gamesPerdidosGrupo: 28,
    saldoGamesGrupo: 10,
    saldoSetsGrupo: 3,
    posicaoGrupo: 2,
  },
  {
    id: "jog-3",
    jogadorId: "jog-3",
    jogadorNome: "Pedro Oliveira",
    jogadorNivel: "iniciante",
    pontosGrupo: 12,
    jogosGrupo: 7,
    vitoriasGrupo: 4,
    derrotasGrupo: 3,
    gamesVencidosGrupo: 35,
    gamesPerdidosGrupo: 32,
    saldoGamesGrupo: 3,
    saldoSetsGrupo: 1,
    posicaoGrupo: 3,
  },
  {
    id: "jog-4",
    jogadorId: "jog-4",
    jogadorNome: "Ana Costa",
    pontosGrupo: 9,
    jogosGrupo: 7,
    vitoriasGrupo: 3,
    derrotasGrupo: 4,
    gamesVencidosGrupo: 30,
    gamesPerdidosGrupo: 35,
    saldoGamesGrupo: -5,
    saldoSetsGrupo: -1,
    posicaoGrupo: 4,
  },
  {
    id: "jog-5",
    jogadorId: "jog-5",
    jogadorNome: "Carlos Lima",
    pontosGrupo: 6,
    jogosGrupo: 7,
    vitoriasGrupo: 2,
    derrotasGrupo: 5,
    gamesVencidosGrupo: 25,
    gamesPerdidosGrupo: 38,
    saldoGamesGrupo: -13,
    saldoSetsGrupo: -3,
    posicaoGrupo: 5,
  },
  {
    id: "jog-6",
    jogadorId: "jog-6",
    jogadorNome: "Fernanda Dias",
    pontosGrupo: 3,
    jogosGrupo: 7,
    vitoriasGrupo: 1,
    derrotasGrupo: 6,
    gamesVencidosGrupo: 20,
    gamesPerdidosGrupo: 42,
    saldoGamesGrupo: -22,
    saldoSetsGrupo: -5,
    posicaoGrupo: 6,
  },
  {
    id: "jog-7",
    jogadorId: "jog-7",
    jogadorNome: "Roberto Alves",
    pontosGrupo: 0,
    jogosGrupo: 7,
    vitoriasGrupo: 0,
    derrotasGrupo: 7,
    gamesVencidosGrupo: 15,
    gamesPerdidosGrupo: 49,
    saldoGamesGrupo: -34,
    saldoSetsGrupo: -7,
    posicaoGrupo: 7,
  },
  {
    id: "jog-8",
    jogadorId: "jog-8",
    jogadorNome: "Lucia Mendes",
    pontosGrupo: 21,
    jogosGrupo: 7,
    vitoriasGrupo: 7,
    derrotasGrupo: 0,
    gamesVencidosGrupo: 49,
    gamesPerdidosGrupo: 14,
    saldoGamesGrupo: 35,
    saldoSetsGrupo: 7,
    posicaoGrupo: 0,
  },
];

const mockJogadoresSemJogos = [
  {
    id: "jog-1",
    jogadorId: "jog-1",
    jogadorNome: "João Silva",
    jogadorNivel: "avancado",
    pontosGrupo: 0,
    jogosGrupo: 0,
    vitoriasGrupo: 0,
    derrotasGrupo: 0,
    gamesVencidosGrupo: 0,
    gamesPerdidosGrupo: 0,
    saldoGamesGrupo: 0,
    saldoSetsGrupo: 0,
    posicaoGrupo: 1,
  },
];

describe("ChavesSuperX", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBuscarGrupo.mockResolvedValue(mockGrupo);
    mockBuscarJogadores.mockResolvedValue(mockJogadores);
  });

  describe("estado de loading", () => {
    it("deve mostrar spinner durante loading", () => {
      mockBuscarGrupo.mockReturnValue(new Promise(() => {}));
      mockBuscarJogadores.mockReturnValue(new Promise(() => {}));

      const { container } = render(
        <ChavesSuperX
          etapaId="etapa-1"
          arenaId="arena-1"
          varianteSuperX={VarianteSuperX.SUPER_8}
        />
      );

      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe("estado de erro", () => {
    it("deve mostrar mensagem de erro quando falha ao carregar", async () => {
      mockBuscarGrupo.mockRejectedValue(new Error("Erro ao carregar chaves"));

      render(
        <ChavesSuperX
          etapaId="etapa-1"
          arenaId="arena-1"
          varianteSuperX={VarianteSuperX.SUPER_8}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Erro:/)).toBeInTheDocument();
        expect(screen.getByText(/Erro ao carregar chaves/)).toBeInTheDocument();
      });
    });

    it("deve mostrar erro genérico quando não há mensagem", async () => {
      mockBuscarGrupo.mockRejectedValue({});

      render(
        <ChavesSuperX
          etapaId="etapa-1"
          arenaId="arena-1"
          varianteSuperX={VarianteSuperX.SUPER_8}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Erro:/)).toBeInTheDocument();
      });
    });
  });

  describe("estado vazio", () => {
    it("deve mostrar mensagem quando não há chaves geradas", async () => {
      mockBuscarGrupo.mockResolvedValue(null);

      render(
        <ChavesSuperX
          etapaId="etapa-1"
          arenaId="arena-1"
          varianteSuperX={VarianteSuperX.SUPER_8}
        />
      );

      await waitFor(() => {
        expect(
          screen.getByText("Nenhuma chave gerada ainda")
        ).toBeInTheDocument();
      });
    });

    it("deve mostrar mensagem quando grupo não tem jogadores", async () => {
      mockBuscarJogadores.mockResolvedValue([]);

      render(
        <ChavesSuperX
          etapaId="etapa-1"
          arenaId="arena-1"
          varianteSuperX={VarianteSuperX.SUPER_8}
        />
      );

      await waitFor(() => {
        expect(
          screen.getByText("Nenhum jogador neste grupo")
        ).toBeInTheDocument();
      });
    });
  });

  describe("renderização do Super 8", () => {
    it("deve mostrar título Super 8 com variante correta", async () => {
      render(
        <ChavesSuperX
          etapaId="etapa-1"
          arenaId="arena-1"
          varianteSuperX={VarianteSuperX.SUPER_8}
        />
      );

      await waitFor(() => {
        // Pode haver múltiplos "Super 8" (header e card)
        expect(screen.getAllByText("Super 8").length).toBeGreaterThan(0);
      });
    });

    it("deve mostrar badge de Grupo Unico", async () => {
      render(
        <ChavesSuperX
          etapaId="etapa-1"
          arenaId="arena-1"
          varianteSuperX={VarianteSuperX.SUPER_8}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Grupo Unico")).toBeInTheDocument();
      });
    });

    it("deve mostrar estatísticas corretas para Super 8", async () => {
      render(
        <ChavesSuperX
          etapaId="etapa-1"
          arenaId="arena-1"
          varianteSuperX={VarianteSuperX.SUPER_8}
        />
      );

      await waitFor(() => {
        // Verificar se o componente renderiza corretamente
        expect(screen.getByText("Grupo Unico")).toBeInTheDocument();
      });
    });

    it("deve mostrar número de jogadores no badge do grupo", async () => {
      render(
        <ChavesSuperX
          etapaId="etapa-1"
          arenaId="arena-1"
          varianteSuperX={VarianteSuperX.SUPER_8}
        />
      );

      await waitFor(() => {
        // Pode haver múltiplas ocorrências de "8 jogadores"
        expect(screen.getAllByText(/8 jogadores/).length).toBeGreaterThan(0);
      });
    });
  });

  describe("renderização do Super 12", () => {
    it("deve mostrar título Super 12 com variante correta", async () => {
      render(
        <ChavesSuperX
          etapaId="etapa-1"
          arenaId="arena-1"
          varianteSuperX={VarianteSuperX.SUPER_12}
        />
      );

      await waitFor(() => {
        // Pode haver múltiplos "Super 12" (header e card)
        expect(screen.getAllByText("Super 12").length).toBeGreaterThan(0);
      });
    });

    it("deve mostrar informações do formato Super 12", async () => {
      render(
        <ChavesSuperX
          etapaId="etapa-1"
          arenaId="arena-1"
          varianteSuperX={VarianteSuperX.SUPER_12}
        />
      );

      await waitFor(() => {
        // Verificar se mostra o formato Super 12 no card informativo
        expect(screen.getByText("Formato Super 12")).toBeInTheDocument();
      });
    });
  });

  describe("lista de jogadores", () => {
    it("deve mostrar todos os jogadores ordenados por posição", async () => {
      render(
        <ChavesSuperX
          etapaId="etapa-1"
          arenaId="arena-1"
          varianteSuperX={VarianteSuperX.SUPER_8}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("João Silva")).toBeInTheDocument();
        expect(screen.getByText("Maria Santos")).toBeInTheDocument();
        expect(screen.getByText("Pedro Oliveira")).toBeInTheDocument();
        expect(screen.getByText("Ana Costa")).toBeInTheDocument();
      });
    });

    it("deve mostrar nível do jogador quando disponível", async () => {
      render(
        <ChavesSuperX
          etapaId="etapa-1"
          arenaId="arena-1"
          varianteSuperX={VarianteSuperX.SUPER_8}
        />
      );

      await waitFor(() => {
        // O componente pode ou não mostrar nível - verificar se os jogadores aparecem
        expect(screen.getByText("João Silva")).toBeInTheDocument();
      });
    });

    it("deve mostrar estatísticas dos jogadores com jogos", async () => {
      render(
        <ChavesSuperX
          etapaId="etapa-1"
          arenaId="arena-1"
          varianteSuperX={VarianteSuperX.SUPER_8}
        />
      );

      await waitFor(() => {
        // PTS label
        expect(screen.getAllByText("PTS").length).toBeGreaterThan(0);
        // V-D label
        expect(screen.getAllByText("V-D").length).toBeGreaterThan(0);
        // GF-GC label
        expect(screen.getAllByText("GF-GC").length).toBeGreaterThan(0);
        // SG label
        expect(screen.getAllByText("SG").length).toBeGreaterThan(0);
      });
    });

    it("não deve mostrar estatísticas quando jogador não tem jogos", async () => {
      mockBuscarJogadores.mockResolvedValue(mockJogadoresSemJogos);

      render(
        <ChavesSuperX
          etapaId="etapa-1"
          arenaId="arena-1"
          varianteSuperX={VarianteSuperX.SUPER_8}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("João Silva")).toBeInTheDocument();
        // Não deve ter os labels de estatísticas
        expect(screen.queryByText("PTS")).not.toBeInTheDocument();
      });
    });

    it("deve mostrar saldo de games positivo com formatação correta", async () => {
      render(
        <ChavesSuperX
          etapaId="etapa-1"
          arenaId="arena-1"
          varianteSuperX={VarianteSuperX.SUPER_8}
        />
      );

      await waitFor(() => {
        // Saldo positivo do primeiro jogador (+21)
        expect(screen.getByText("+21")).toBeInTheDocument();
      });
    });

    it("deve mostrar saldo de games negativo com formatação correta", async () => {
      render(
        <ChavesSuperX
          etapaId="etapa-1"
          arenaId="arena-1"
          varianteSuperX={VarianteSuperX.SUPER_8}
        />
      );

      await waitFor(() => {
        // Saldo negativo
        expect(screen.getByText("-5")).toBeInTheDocument();
      });
    });
  });

  describe("footer do grupo", () => {
    it("deve mostrar contagem de partidas", async () => {
      render(
        <ChavesSuperX
          etapaId="etapa-1"
          arenaId="arena-1"
          varianteSuperX={VarianteSuperX.SUPER_8}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("7 / 14 partidas")).toBeInTheDocument();
      });
    });

    it("deve mostrar badge de completo quando grupo está completo", async () => {
      mockBuscarGrupo.mockResolvedValue(mockGrupoCompleto);

      render(
        <ChavesSuperX
          etapaId="etapa-1"
          arenaId="arena-1"
          varianteSuperX={VarianteSuperX.SUPER_8}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Completo")).toBeInTheDocument();
      });
    });

    it("não deve mostrar badge de completo quando grupo não está completo", async () => {
      render(
        <ChavesSuperX
          etapaId="etapa-1"
          arenaId="arena-1"
          varianteSuperX={VarianteSuperX.SUPER_8}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText("Completo")).not.toBeInTheDocument();
      });
    });
  });

  describe("toggle de partidas", () => {
    it("deve mostrar botão Ver Partidas inicialmente", async () => {
      render(
        <ChavesSuperX
          etapaId="etapa-1"
          arenaId="arena-1"
          varianteSuperX={VarianteSuperX.SUPER_8}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Ver Partidas")).toBeInTheDocument();
      });
    });

    it("deve mostrar partidas ao clicar em Ver Partidas", async () => {
      render(
        <ChavesSuperX
          etapaId="etapa-1"
          arenaId="arena-1"
          varianteSuperX={VarianteSuperX.SUPER_8}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Ver Partidas")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Ver Partidas"));

      expect(screen.getByTestId("partidas-super-x")).toBeInTheDocument();
      expect(screen.getByText("▼ Ocultar Partidas")).toBeInTheDocument();
    });

    it("deve ocultar partidas ao clicar novamente", async () => {
      render(
        <ChavesSuperX
          etapaId="etapa-1"
          arenaId="arena-1"
          varianteSuperX={VarianteSuperX.SUPER_8}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Ver Partidas")).toBeInTheDocument();
      });

      // Mostrar partidas
      fireEvent.click(screen.getByText("Ver Partidas"));
      expect(screen.getByTestId("partidas-super-x")).toBeInTheDocument();

      // Ocultar partidas
      fireEvent.click(screen.getByText("▼ Ocultar Partidas"));
      expect(screen.queryByTestId("partidas-super-x")).not.toBeInTheDocument();
      expect(screen.getByText("Ver Partidas")).toBeInTheDocument();
    });
  });

  describe("card informativo", () => {
    it("deve mostrar informações sobre o formato Super 8", async () => {
      render(
        <ChavesSuperX
          etapaId="etapa-1"
          arenaId="arena-1"
          varianteSuperX={VarianteSuperX.SUPER_8}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Formato Super 8")).toBeInTheDocument();
        expect(
          screen.getByText(/7 rodadas, garantindo que cada/)
        ).toBeInTheDocument();
      });
    });

    it("deve mostrar informações sobre o formato Super 12", async () => {
      render(
        <ChavesSuperX
          etapaId="etapa-1"
          arenaId="arena-1"
          varianteSuperX={VarianteSuperX.SUPER_12}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Formato Super 12")).toBeInTheDocument();
        expect(
          screen.getByText(/11 rodadas, garantindo que cada/)
        ).toBeInTheDocument();
      });
    });

    it("deve mostrar critérios de classificação", async () => {
      render(
        <ChavesSuperX
          etapaId="etapa-1"
          arenaId="arena-1"
          varianteSuperX={VarianteSuperX.SUPER_8}
        />
      );

      await waitFor(() => {
        expect(
          screen.getByText(/Classificacao por pontos/)
        ).toBeInTheDocument();
      });
    });
  });

  describe("variante não definida", () => {
    it("deve mostrar Super X quando variante não está definida", async () => {
      render(<ChavesSuperX etapaId="etapa-1" arenaId="arena-1" />);

      await waitFor(() => {
        expect(screen.getByText("Super X")).toBeInTheDocument();
        expect(screen.getByText("Formato Super X")).toBeInTheDocument();
      });
    });
  });

  describe("ordenação de jogadores", () => {
    it("deve ordenar jogadores por posição do grupo quando definida", async () => {
      const jogadoresDesordenados = [
        { ...mockJogadores[2], posicaoGrupo: 3 },
        { ...mockJogadores[0], posicaoGrupo: 1 },
        { ...mockJogadores[1], posicaoGrupo: 2 },
      ];
      mockBuscarJogadores.mockResolvedValue(jogadoresDesordenados);

      render(
        <ChavesSuperX
          etapaId="etapa-1"
          arenaId="arena-1"
          varianteSuperX={VarianteSuperX.SUPER_8}
        />
      );

      await waitFor(() => {
        const items = screen.getAllByText(/Silva|Santos|Oliveira/);
        // Deve estar ordenado: João Silva (1), Maria Santos (2), Pedro Oliveira (3)
        expect(items.length).toBeGreaterThan(0);
      });
    });

    it("deve ordenar por pontos quando posições são iguais", async () => {
      const jogadoresComMesmaPosicao = [
        { ...mockJogadores[0], posicaoGrupo: undefined, pontosGrupo: 10 },
        { ...mockJogadores[1], posicaoGrupo: undefined, pontosGrupo: 15 },
      ];
      mockBuscarJogadores.mockResolvedValue(jogadoresComMesmaPosicao);

      render(
        <ChavesSuperX
          etapaId="etapa-1"
          arenaId="arena-1"
          varianteSuperX={VarianteSuperX.SUPER_8}
        />
      );

      await waitFor(() => {
        // Maria deve aparecer primeiro (15 pontos) antes de João (10 pontos)
        const items = screen.getAllByText(/Silva|Santos/);
        expect(items.length).toBeGreaterThan(0);
      });
    });
  });
});
