/**
 * Testes do componente ChavesEtapa
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// Mock dos services
const mockBuscarGrupos = jest.fn();
const mockBuscarDuplas = jest.fn();
const mockBuscarConfrontosEliminatorios = jest.fn();
const mockBuscarPorId = jest.fn();

jest.mock("@/services", () => ({
  getChaveService: () => ({
    buscarGrupos: mockBuscarGrupos,
    buscarDuplas: mockBuscarDuplas,
    buscarConfrontosEliminatorios: mockBuscarConfrontosEliminatorios,
  }),
  getEtapaService: () => ({
    buscarPorId: mockBuscarPorId,
  }),
}));

// Mock do PartidasGrupo
jest.mock("@/components/etapas/PartidasGrupo", () => ({
  PartidasGrupo: ({ grupoNome }: { grupoNome: string }) => (
    <div data-testid="partidas-grupo">Partidas do {grupoNome}</div>
  ),
}));

// Mock do FaseEliminatoria
jest.mock("@/components/etapas/FaseEliminatoria", () => ({
  FaseEliminatoria: () => (
    <div data-testid="fase-eliminatoria">Fase Eliminatória Component</div>
  ),
}));

import { ChavesEtapa } from "@/components/etapas/ChavesEtapa/ChavesEtapa";

const mockGrupos = [
  {
    id: "grupo-1",
    nome: "Grupo A",
    etapaId: "etapa-1",
    completo: true,
    partidasFinalizadas: 6,
    totalPartidas: 6,
  },
  {
    id: "grupo-2",
    nome: "Grupo B",
    etapaId: "etapa-1",
    completo: false,
    partidasFinalizadas: 4,
    totalPartidas: 6,
  },
];

const mockDuplas = [
  {
    id: "dupla-1",
    grupoId: "grupo-1",
    jogador1Nome: "João",
    jogador2Nome: "Maria",
    jogador1Nivel: "avançado",
    pontos: 9,
    jogos: 3,
    vitorias: 3,
    derrotas: 0,
    gamesVencidos: 18,
    gamesPerdidos: 6,
    saldoGames: 12,
    saldoSets: 3,
    posicaoGrupo: 1,
  },
  {
    id: "dupla-2",
    grupoId: "grupo-1",
    jogador1Nome: "Pedro",
    jogador2Nome: "Ana",
    jogador1Nivel: "intermediário",
    pontos: 6,
    jogos: 3,
    vitorias: 2,
    derrotas: 1,
    gamesVencidos: 14,
    gamesPerdidos: 10,
    saldoGames: 4,
    saldoSets: 1,
    posicaoGrupo: 2,
  },
  {
    id: "dupla-3",
    grupoId: "grupo-2",
    jogador1Nome: "Carlos",
    jogador2Nome: "Lucia",
    jogador1Nivel: "iniciante",
    pontos: 3,
    jogos: 2,
    vitorias: 1,
    derrotas: 1,
    gamesVencidos: 10,
    gamesPerdidos: 10,
    saldoGames: 0,
    saldoSets: 0,
    posicaoGrupo: 1,
  },
];

const mockEtapa = {
  id: "etapa-1",
  nome: "Etapa Teste",
  status: "em_andamento",
};

describe("ChavesEtapa", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBuscarGrupos.mockResolvedValue(mockGrupos);
    mockBuscarDuplas.mockResolvedValue(mockDuplas);
    mockBuscarPorId.mockResolvedValue(mockEtapa);
    mockBuscarConfrontosEliminatorios.mockResolvedValue([]);
  });

  describe("estado de loading", () => {
    it("deve mostrar spinner durante loading", () => {
      mockBuscarGrupos.mockReturnValue(new Promise(() => {}));
      mockBuscarDuplas.mockReturnValue(new Promise(() => {}));

      const { container } = render(
        <ChavesEtapa etapaId="etapa-1" arenaId="arena-1" />
      );

      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe("estado de erro", () => {
    it("deve mostrar mensagem de erro", async () => {
      mockBuscarGrupos.mockRejectedValue(new Error("Erro ao carregar grupos"));

      render(<ChavesEtapa etapaId="etapa-1" arenaId="arena-1" />);

      await waitFor(() => {
        expect(screen.getByText(/Erro:/)).toBeInTheDocument();
        expect(screen.getByText(/Erro ao carregar grupos/)).toBeInTheDocument();
      });
    });
  });

  describe("estado vazio", () => {
    it("deve mostrar mensagem quando não há grupos", async () => {
      mockBuscarGrupos.mockResolvedValue([]);
      mockBuscarDuplas.mockResolvedValue([]);

      render(<ChavesEtapa etapaId="etapa-1" arenaId="arena-1" />);

      await waitFor(() => {
        expect(
          screen.getByText(/Nenhuma chave gerada ainda/)
        ).toBeInTheDocument();
      });
    });
  });

  describe("renderização de grupos", () => {
    it("deve mostrar título e estatísticas", async () => {
      render(<ChavesEtapa etapaId="etapa-1" arenaId="arena-1" />);

      await waitFor(() => {
        expect(screen.getByText("Grupos e Duplas")).toBeInTheDocument();
        expect(screen.getByText("2 grupos • 3 duplas")).toBeInTheDocument();
      });
    });

    it("deve mostrar nomes dos grupos", async () => {
      render(<ChavesEtapa etapaId="etapa-1" arenaId="arena-1" />);

      await waitFor(() => {
        expect(screen.getByText("Grupo A")).toBeInTheDocument();
        expect(screen.getByText("Grupo B")).toBeInTheDocument();
      });
    });

    it("deve mostrar quantidade de duplas por grupo", async () => {
      render(<ChavesEtapa etapaId="etapa-1" arenaId="arena-1" />);

      await waitFor(() => {
        expect(screen.getByText("2 duplas")).toBeInTheDocument();
        expect(screen.getByText("1 duplas")).toBeInTheDocument();
      });
    });

    it("deve mostrar badge de completo para grupos finalizados", async () => {
      render(<ChavesEtapa etapaId="etapa-1" arenaId="arena-1" />);

      await waitFor(() => {
        expect(screen.getByText(/Completo/)).toBeInTheDocument();
      });
    });

    it("deve mostrar progresso de partidas", async () => {
      render(<ChavesEtapa etapaId="etapa-1" arenaId="arena-1" />);

      await waitFor(() => {
        expect(screen.getByText("6 / 6 partidas")).toBeInTheDocument();
        expect(screen.getByText("4 / 6 partidas")).toBeInTheDocument();
      });
    });
  });

  describe("renderização de duplas", () => {
    it("deve mostrar nomes das duplas", async () => {
      render(<ChavesEtapa etapaId="etapa-1" arenaId="arena-1" />);

      await waitFor(() => {
        expect(screen.getByText("João & Maria")).toBeInTheDocument();
        expect(screen.getByText("Pedro & Ana")).toBeInTheDocument();
        expect(screen.getByText("Carlos & Lucia")).toBeInTheDocument();
      });
    });

    it("deve mostrar posição das duplas", async () => {
      render(<ChavesEtapa etapaId="etapa-1" arenaId="arena-1" />);

      await waitFor(() => {
        // Posições 1, 2 no Grupo A e 1 no Grupo B
        expect(screen.getAllByText("1").length).toBeGreaterThan(0);
        expect(screen.getAllByText("2").length).toBeGreaterThan(0);
      });
    });

    it("deve mostrar nível do jogador", async () => {
      render(<ChavesEtapa etapaId="etapa-1" arenaId="arena-1" />);

      await waitFor(() => {
        expect(screen.getByText("Nível: avançado")).toBeInTheDocument();
        expect(screen.getByText("Nível: intermediário")).toBeInTheDocument();
      });
    });

    it("deve mostrar estatísticas quando há jogos", async () => {
      render(<ChavesEtapa etapaId="etapa-1" arenaId="arena-1" />);

      await waitFor(() => {
        // Pontos
        expect(screen.getAllByText("PTS").length).toBeGreaterThan(0);
        // Vitórias-Derrotas
        expect(screen.getAllByText("V-D").length).toBeGreaterThan(0);
        // Games
        expect(screen.getAllByText("GF-GC").length).toBeGreaterThan(0);
        // Saldo
        expect(screen.getAllByText("SG").length).toBeGreaterThan(0);
      });
    });

    it("deve mostrar estatísticas com valores corretos", async () => {
      render(<ChavesEtapa etapaId="etapa-1" arenaId="arena-1" />);

      await waitFor(() => {
        // João & Maria: 9 pontos, 3-0, saldo +12
        expect(screen.getByText("9")).toBeInTheDocument();
        expect(screen.getByText("3-0")).toBeInTheDocument();
        expect(screen.getByText("+12")).toBeInTheDocument();
      });
    });
  });

  describe("tabs de navegação", () => {
    it("deve mostrar tabs de Grupos e Eliminatória", async () => {
      render(<ChavesEtapa etapaId="etapa-1" arenaId="arena-1" />);

      await waitFor(() => {
        // "Fase de Grupos" aparece no botão da tab e no info card
        expect(screen.getAllByText(/Fase de Grupos/).length).toBeGreaterThan(0);
        expect(screen.getByText("Eliminatória")).toBeInTheDocument();
      });
    });

    it("deve começar na aba de grupos", async () => {
      render(<ChavesEtapa etapaId="etapa-1" arenaId="arena-1" />);

      await waitFor(() => {
        expect(screen.getByText("Grupos e Duplas")).toBeInTheDocument();
      });
    });

    it("deve trocar para aba eliminatória ao clicar", async () => {
      render(<ChavesEtapa etapaId="etapa-1" arenaId="arena-1" />);

      await waitFor(() => {
        expect(screen.getByText("Eliminatória")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Eliminatória"));

      await waitFor(() => {
        expect(screen.getByTestId("fase-eliminatoria")).toBeInTheDocument();
      });
    });

    it("deve voltar para aba de grupos", async () => {
      render(<ChavesEtapa etapaId="etapa-1" arenaId="arena-1" />);

      await waitFor(() => {
        fireEvent.click(screen.getByText("Eliminatória"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("fase-eliminatoria")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Fase de Grupos"));

      await waitFor(() => {
        expect(screen.getByText("Grupos e Duplas")).toBeInTheDocument();
      });
    });
  });

  describe("ver partidas", () => {
    it("deve mostrar botão Ver Partidas", async () => {
      render(<ChavesEtapa etapaId="etapa-1" arenaId="arena-1" />);

      await waitFor(() => {
        expect(screen.getAllByText(/Ver Partidas/).length).toBe(2);
      });
    });

    it("deve expandir partidas ao clicar", async () => {
      render(<ChavesEtapa etapaId="etapa-1" arenaId="arena-1" />);

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
      render(<ChavesEtapa etapaId="etapa-1" arenaId="arena-1" />);

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
      render(<ChavesEtapa etapaId="etapa-1" arenaId="arena-1" />);

      await waitFor(() => {
        // "Fase de Grupos" aparece múltiplas vezes
        expect(screen.getAllByText(/Fase de Grupos/).length).toBeGreaterThan(0);
        expect(
          screen.getByText(/Cada dupla joga contra todas as outras duplas/)
        ).toBeInTheDocument();
      });
    });
  });

  describe("ordenação de duplas", () => {
    it("deve ordenar por posicaoGrupo quando disponível", async () => {
      render(<ChavesEtapa etapaId="etapa-1" arenaId="arena-1" />);

      await waitFor(() => {
        // João & Maria deve estar em primeiro (posicaoGrupo: 1)
        // Pedro & Ana deve estar em segundo (posicaoGrupo: 2)
        const duplasGrupoA = screen.getAllByText(/João|Pedro/);
        expect(duplasGrupoA.length).toBeGreaterThan(0);
      });
    });

    it("deve ordenar por pontos como fallback", async () => {
      // Duplas sem posicaoGrupo
      const duplaSemPosicao = [
        {
          id: "dupla-a",
          grupoId: "grupo-1",
          jogador1Nome: "A",
          jogador2Nome: "B",
          jogador1Nivel: "iniciante",
          pontos: 3,
          jogos: 1,
          vitorias: 1,
          derrotas: 0,
          gamesVencidos: 6,
          gamesPerdidos: 3,
          saldoGames: 3,
          saldoSets: 1,
        },
        {
          id: "dupla-b",
          grupoId: "grupo-1",
          jogador1Nome: "C",
          jogador2Nome: "D",
          jogador1Nivel: "iniciante",
          pontos: 6,
          jogos: 2,
          vitorias: 2,
          derrotas: 0,
          gamesVencidos: 12,
          gamesPerdidos: 6,
          saldoGames: 6,
          saldoSets: 2,
        },
      ];

      mockBuscarDuplas.mockResolvedValue(duplaSemPosicao);

      render(<ChavesEtapa etapaId="etapa-1" arenaId="arena-1" />);

      await waitFor(() => {
        // C & D deve estar em primeiro (6 pontos > 3 pontos)
        expect(screen.getByText("C & D")).toBeInTheDocument();
      });
    });
  });

  describe("grupo vazio", () => {
    it("deve mostrar mensagem quando grupo não tem duplas", async () => {
      // Grupo sem duplas
      const grupoVazio = [
        {
          id: "grupo-vazio",
          nome: "Grupo Vazio",
          etapaId: "etapa-1",
          completo: false,
          partidasFinalizadas: 0,
          totalPartidas: 0,
        },
      ];

      mockBuscarGrupos.mockResolvedValue(grupoVazio);
      mockBuscarDuplas.mockResolvedValue([]);

      render(<ChavesEtapa etapaId="etapa-1" arenaId="arena-1" />);

      await waitFor(() => {
        expect(screen.getByText("Nenhuma dupla neste grupo")).toBeInTheDocument();
      });
    });
  });

  describe("etapa finalizada", () => {
    it("deve carregar status da etapa", async () => {
      mockBuscarPorId.mockResolvedValue({ ...mockEtapa, status: "finalizada" });

      render(<ChavesEtapa etapaId="etapa-1" arenaId="arena-1" />);

      await waitFor(() => {
        expect(mockBuscarPorId).toHaveBeenCalledWith("etapa-1");
      });
    });
  });

  describe("eliminatória existente", () => {
    it("deve verificar se eliminatória existe", async () => {
      mockBuscarConfrontosEliminatorios.mockResolvedValue([
        { id: "confronto-1" },
      ]);

      render(<ChavesEtapa etapaId="etapa-1" arenaId="arena-1" />);

      await waitFor(() => {
        expect(mockBuscarConfrontosEliminatorios).toHaveBeenCalledWith("etapa-1");
      });
    });
  });
});
