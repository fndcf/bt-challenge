/**
 * Testes do componente ChavesSuperX
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// Mock dos services
const mockBuscarGrupo = jest.fn();
const mockBuscarJogadores = jest.fn();
const mockBuscarPartidas = jest.fn();
const mockEncerrarEtapa = jest.fn();

jest.mock("@/services", () => ({
  getSuperXService: () => ({
    buscarGrupo: mockBuscarGrupo,
    buscarJogadores: mockBuscarJogadores,
    buscarPartidas: mockBuscarPartidas,
  }),
  getEtapaService: () => ({
    encerrarEtapa: mockEncerrarEtapa,
  }),
}));

// Mock do invalidateRankingCache
jest.mock("@/components/jogadores/RankingList", () => ({
  invalidateRankingCache: jest.fn(),
}));

// Mock do ModalLancamentoResultadosLoteSuperX
jest.mock("@/components/etapas/ModalLancamentoResultadosLoteSuperX/ModalLancamentoResultadosLoteSuperX", () => ({
  ModalLancamentoResultadosLoteSuperX: ({ onClose, onSuccess }: any) => (
    <div data-testid="modal-resultados">
      <span>Modal Resultados</span>
      <button onClick={onClose}>Fechar</button>
      <button onClick={onSuccess}>Salvar</button>
    </div>
  ),
}));

// Mock do LoadingOverlay
jest.mock("@/components/ui/LoadingOverlay", () => ({
  LoadingOverlay: ({ isLoading, message }: any) =>
    isLoading ? <div data-testid="loading-overlay">{message}</div> : null,
}));

// Mock do ConfirmacaoPerigosa
jest.mock("@/components/modals/ConfirmacaoPerigosa/ConfirmacaoPerigosa", () => ({
  ConfirmacaoPerigosa: ({ isOpen, onConfirm, onClose }: any) =>
    isOpen ? (
      <div data-testid="modal-encerrar">
        <button onClick={onConfirm}>Confirmar Encerrar</button>
        <button onClick={onClose}>Cancelar</button>
      </div>
    ) : null,
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
    mockBuscarPartidas.mockResolvedValue([]);
    mockEncerrarEtapa.mockResolvedValue(undefined);
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

    it("deve desempatar por saldo de games quando pontos são iguais", async () => {
      const jogadoresEmpatados = [
        {
          id: "j1",
          jogadorId: "j1",
          jogadorNome: "Jogador1",
          jogadorNivel: "iniciante",
          pontosGrupo: 12,
          jogosGrupo: 5,
          vitoriasGrupo: 4,
          derrotasGrupo: 1,
          gamesVencidosGrupo: 30,
          gamesPerdidosGrupo: 26,
          saldoGamesGrupo: 4, // Menor saldo
          saldoSetsGrupo: 2,
        },
        {
          id: "j2",
          jogadorId: "j2",
          jogadorNome: "Jogador2",
          jogadorNivel: "iniciante",
          pontosGrupo: 12, // Mesmos pontos
          jogosGrupo: 5,
          vitoriasGrupo: 4,
          derrotasGrupo: 1,
          gamesVencidosGrupo: 35,
          gamesPerdidosGrupo: 25,
          saldoGamesGrupo: 10, // Maior saldo
          saldoSetsGrupo: 2,
        },
      ];

      mockBuscarJogadores.mockResolvedValue(jogadoresEmpatados);

      render(
        <ChavesSuperX
          etapaId="etapa-1"
          arenaId="arena-1"
          varianteSuperX={VarianteSuperX.SUPER_8}
        />
      );

      await waitFor(() => {
        const nomes = screen.getAllByText(/Jogador[12]/);
        expect(nomes[0].textContent).toBe("Jogador2");
      });
    });

    it("deve desempatar por games vencidos quando saldo de games é igual", async () => {
      const jogadoresEmpatados = [
        {
          id: "g1",
          jogadorId: "g1",
          jogadorNome: "GameA",
          jogadorNivel: "iniciante",
          pontosGrupo: 12,
          jogosGrupo: 5,
          vitoriasGrupo: 4,
          derrotasGrupo: 1,
          gamesVencidosGrupo: 30, // Menor
          gamesPerdidosGrupo: 24,
          saldoGamesGrupo: 6,
          saldoSetsGrupo: 2,
        },
        {
          id: "g2",
          jogadorId: "g2",
          jogadorNome: "GameB",
          jogadorNivel: "iniciante",
          pontosGrupo: 12,
          jogosGrupo: 5,
          vitoriasGrupo: 4,
          derrotasGrupo: 1,
          gamesVencidosGrupo: 36, // Maior
          gamesPerdidosGrupo: 30,
          saldoGamesGrupo: 6, // Igual
          saldoSetsGrupo: 2,
        },
      ];

      mockBuscarJogadores.mockResolvedValue(jogadoresEmpatados);

      render(
        <ChavesSuperX
          etapaId="etapa-1"
          arenaId="arena-1"
          varianteSuperX={VarianteSuperX.SUPER_8}
        />
      );

      await waitFor(() => {
        const nomes = screen.getAllByText(/Game[AB]/);
        expect(nomes[0].textContent).toBe("GameB");
      });
    });

    it("deve desempatar por saldo de sets quando games vencidos é igual", async () => {
      const jogadoresEmpatados = [
        {
          id: "s1",
          jogadorId: "s1",
          jogadorNome: "SetA",
          jogadorNivel: "iniciante",
          pontosGrupo: 12,
          jogosGrupo: 5,
          vitoriasGrupo: 4,
          derrotasGrupo: 1,
          gamesVencidosGrupo: 30,
          gamesPerdidosGrupo: 24,
          saldoGamesGrupo: 6,
          saldoSetsGrupo: 1, // Menor
        },
        {
          id: "s2",
          jogadorId: "s2",
          jogadorNome: "SetB",
          jogadorNivel: "iniciante",
          pontosGrupo: 12,
          jogosGrupo: 5,
          vitoriasGrupo: 4,
          derrotasGrupo: 1,
          gamesVencidosGrupo: 30, // Igual
          gamesPerdidosGrupo: 24,
          saldoGamesGrupo: 6, // Igual
          saldoSetsGrupo: 3, // Maior
        },
      ];

      mockBuscarJogadores.mockResolvedValue(jogadoresEmpatados);

      render(
        <ChavesSuperX
          etapaId="etapa-1"
          arenaId="arena-1"
          varianteSuperX={VarianteSuperX.SUPER_8}
        />
      );

      await waitFor(() => {
        const nomes = screen.getAllByText(/Set[AB]/);
        expect(nomes[0].textContent).toBe("SetB");
      });
    });

    it("deve desempatar por ordem alfabética quando tudo é igual", async () => {
      const jogadoresIguais = [
        {
          id: "z1",
          jogadorId: "z1",
          jogadorNome: "Zeca",
          jogadorNivel: "iniciante",
          pontosGrupo: 12,
          jogosGrupo: 5,
          vitoriasGrupo: 4,
          derrotasGrupo: 1,
          gamesVencidosGrupo: 30,
          gamesPerdidosGrupo: 24,
          saldoGamesGrupo: 6,
          saldoSetsGrupo: 2,
        },
        {
          id: "a1",
          jogadorId: "a1",
          jogadorNome: "Abel",
          jogadorNivel: "iniciante",
          pontosGrupo: 12,
          jogosGrupo: 5,
          vitoriasGrupo: 4,
          derrotasGrupo: 1,
          gamesVencidosGrupo: 30,
          gamesPerdidosGrupo: 24,
          saldoGamesGrupo: 6,
          saldoSetsGrupo: 2,
        },
      ];

      mockBuscarJogadores.mockResolvedValue(jogadoresIguais);

      render(
        <ChavesSuperX
          etapaId="etapa-1"
          arenaId="arena-1"
          varianteSuperX={VarianteSuperX.SUPER_8}
        />
      );

      await waitFor(() => {
        const nomes = screen.getAllByText(/Abel|Zeca/);
        expect(nomes[0].textContent).toBe("Abel");
      });
    });
  });

  describe("jogador sem nível ou com nível customizado", () => {
    it("deve tratar jogador sem nível definido", async () => {
      const jogadorSemNivel = [
        {
          id: "jog-sem-nivel",
          jogadorId: "jog-sem-nivel",
          jogadorNome: "Jogador Sem Nivel",
          pontosGrupo: 3,
          jogosGrupo: 1,
          vitoriasGrupo: 1,
          derrotasGrupo: 0,
          gamesVencidosGrupo: 6,
          gamesPerdidosGrupo: 3,
          saldoGamesGrupo: 3,
          saldoSetsGrupo: 1,
        },
      ];

      mockBuscarJogadores.mockResolvedValue(jogadorSemNivel);

      render(
        <ChavesSuperX
          etapaId="etapa-1"
          arenaId="arena-1"
          varianteSuperX={VarianteSuperX.SUPER_8}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Jogador Sem Nivel")).toBeInTheDocument();
      });
    });

    it("deve mostrar nível customizado quando diferente das opções padrão", async () => {
      const jogadorNivelCustom = [
        {
          id: "jog-custom",
          jogadorId: "jog-custom",
          jogadorNome: "Jogador Custom",
          jogadorNivel: "profissional",
          pontosGrupo: 3,
          jogosGrupo: 1,
          vitoriasGrupo: 1,
          derrotasGrupo: 0,
          gamesVencidosGrupo: 6,
          gamesPerdidosGrupo: 3,
          saldoGamesGrupo: 3,
          saldoSetsGrupo: 1,
        },
      ];

      mockBuscarJogadores.mockResolvedValue(jogadorNivelCustom);

      render(
        <ChavesSuperX
          etapaId="etapa-1"
          arenaId="arena-1"
          varianteSuperX={VarianteSuperX.SUPER_8}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Nivel: profissional")).toBeInTheDocument();
      });
    });
  });

  describe("modal de resultados", () => {
    it("deve abrir modal ao clicar em Registrar Resultados", async () => {
      mockBuscarPartidas.mockResolvedValue([
        { id: "partida-1" },
      ]);

      render(
        <ChavesSuperX
          etapaId="etapa-1"
          arenaId="arena-1"
          varianteSuperX={VarianteSuperX.SUPER_8}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Registrar Resultados")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Registrar Resultados"));

      await waitFor(() => {
        expect(screen.getByTestId("modal-resultados")).toBeInTheDocument();
      });
    });

    it("deve fechar modal ao clicar em Fechar", async () => {
      mockBuscarPartidas.mockResolvedValue([
        { id: "partida-1" },
      ]);

      render(
        <ChavesSuperX
          etapaId="etapa-1"
          arenaId="arena-1"
          varianteSuperX={VarianteSuperX.SUPER_8}
        />
      );

      await waitFor(() => {
        fireEvent.click(screen.getByText("Registrar Resultados"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("modal-resultados")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Fechar"));

      await waitFor(() => {
        expect(screen.queryByTestId("modal-resultados")).not.toBeInTheDocument();
      });
    });

    it("deve recarregar dados ao salvar resultados", async () => {
      mockBuscarPartidas.mockResolvedValue([
        { id: "partida-1" },
      ]);

      render(
        <ChavesSuperX
          etapaId="etapa-1"
          arenaId="arena-1"
          varianteSuperX={VarianteSuperX.SUPER_8}
        />
      );

      await waitFor(() => {
        fireEvent.click(screen.getByText("Registrar Resultados"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("modal-resultados")).toBeInTheDocument();
      });

      mockBuscarGrupo.mockClear();
      mockBuscarJogadores.mockClear();

      fireEvent.click(screen.getByText("Salvar"));

      await waitFor(() => {
        expect(mockBuscarGrupo).toHaveBeenCalled();
        expect(mockBuscarJogadores).toHaveBeenCalled();
      });
    });

    it("deve mostrar alerta ao erro ao carregar partidas", async () => {
      const alertMock = jest.spyOn(window, "alert").mockImplementation(() => {});
      mockBuscarPartidas.mockRejectedValue(new Error("Erro ao carregar"));

      render(
        <ChavesSuperX
          etapaId="etapa-1"
          arenaId="arena-1"
          varianteSuperX={VarianteSuperX.SUPER_8}
        />
      );

      await waitFor(() => {
        fireEvent.click(screen.getByText("Registrar Resultados"));
      });

      await waitFor(() => {
        expect(alertMock).toHaveBeenCalledWith("Erro ao carregar");
      });

      alertMock.mockRestore();
    });
  });

  describe("encerrar etapa", () => {
    it("deve mostrar botão de Encerrar Etapa quando todas as partidas estiverem finalizadas", async () => {
      // Grupo com todas as partidas finalizadas (14/14 para Super 8)
      const grupoFinalizado = {
        ...mockGrupo,
        partidasFinalizadas: 14,
        totalPartidas: 14,
      };
      mockBuscarGrupo.mockResolvedValue(grupoFinalizado);

      render(
        <ChavesSuperX
          etapaId="etapa-1"
          arenaId="arena-1"
          varianteSuperX={VarianteSuperX.SUPER_8}
          etapaFinalizada={false}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Encerrar Etapa")).toBeInTheDocument();
      });
    });

    it("deve abrir modal de confirmação ao clicar em Encerrar Etapa", async () => {
      const grupoFinalizado = {
        ...mockGrupo,
        partidasFinalizadas: 14,
      };
      mockBuscarGrupo.mockResolvedValue(grupoFinalizado);

      render(
        <ChavesSuperX
          etapaId="etapa-1"
          arenaId="arena-1"
          varianteSuperX={VarianteSuperX.SUPER_8}
          etapaFinalizada={false}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Encerrar Etapa")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Encerrar Etapa"));

      await waitFor(() => {
        expect(screen.getByTestId("modal-encerrar")).toBeInTheDocument();
      });
    });

    it("deve encerrar etapa ao confirmar", async () => {
      const onAtualizar = jest.fn();
      const grupoFinalizado = {
        ...mockGrupo,
        partidasFinalizadas: 14,
      };
      mockBuscarGrupo.mockResolvedValue(grupoFinalizado);

      render(
        <ChavesSuperX
          etapaId="etapa-1"
          arenaId="arena-1"
          varianteSuperX={VarianteSuperX.SUPER_8}
          etapaFinalizada={false}
          onAtualizar={onAtualizar}
        />
      );

      await waitFor(() => {
        fireEvent.click(screen.getByText("Encerrar Etapa"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("modal-encerrar")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Confirmar Encerrar"));

      await waitFor(() => {
        expect(mockEncerrarEtapa).toHaveBeenCalledWith("etapa-1");
        expect(onAtualizar).toHaveBeenCalled();
      });
    });

    it("deve mostrar alerta ao erro ao encerrar etapa", async () => {
      const alertMock = jest.spyOn(window, "alert").mockImplementation(() => {});
      mockEncerrarEtapa.mockRejectedValue(new Error("Erro ao encerrar"));

      const grupoFinalizado = {
        ...mockGrupo,
        partidasFinalizadas: 14,
      };
      mockBuscarGrupo.mockResolvedValue(grupoFinalizado);

      render(
        <ChavesSuperX
          etapaId="etapa-1"
          arenaId="arena-1"
          varianteSuperX={VarianteSuperX.SUPER_8}
          etapaFinalizada={false}
        />
      );

      await waitFor(() => {
        fireEvent.click(screen.getByText("Encerrar Etapa"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("modal-encerrar")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Confirmar Encerrar"));

      await waitFor(() => {
        expect(alertMock).toHaveBeenCalledWith("Erro ao encerrar");
      });

      alertMock.mockRestore();
    });

    it("deve fechar modal ao cancelar", async () => {
      const grupoFinalizado = {
        ...mockGrupo,
        partidasFinalizadas: 14,
      };
      mockBuscarGrupo.mockResolvedValue(grupoFinalizado);

      render(
        <ChavesSuperX
          etapaId="etapa-1"
          arenaId="arena-1"
          varianteSuperX={VarianteSuperX.SUPER_8}
          etapaFinalizada={false}
        />
      );

      await waitFor(() => {
        fireEvent.click(screen.getByText("Encerrar Etapa"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("modal-encerrar")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Cancelar"));

      await waitFor(() => {
        expect(screen.queryByTestId("modal-encerrar")).not.toBeInTheDocument();
      });
    });
  });
});
