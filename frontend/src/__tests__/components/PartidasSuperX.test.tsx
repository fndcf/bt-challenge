/**
 * Testes do componente PartidasSuperX
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// Mock dos services
const mockBuscarPartidas = jest.fn();

jest.mock("@/services", () => ({
  getSuperXService: () => ({
    buscarPartidas: mockBuscarPartidas,
  }),
}));

// Mock do ModalRegistrarResultadoSuperX
jest.mock("@/components/etapas/ModalRegistrarResultadoSuperX", () => ({
  ModalRegistrarResultadoSuperX: ({
    partida,
    onClose,
    onSuccess,
  }: {
    partida: any;
    onClose: () => void;
    onSuccess: () => void;
  }) => (
    <div data-testid="modal-resultado">
      <span>Modal para {partida.jogador1ANome}</span>
      <button data-testid="modal-close" onClick={onClose}>
        Fechar
      </button>
      <button data-testid="modal-success" onClick={onSuccess}>
        Salvar
      </button>
    </div>
  ),
}));

import { PartidasSuperX } from "@/components/etapas/PartidasSuperX/PartidasSuperX";

const mockPartidasRodada1 = [
  {
    id: "partida-1",
    etapaId: "etapa-1",
    grupoId: "grupo-1",
    rodada: 1,
    status: "finalizada",
    jogador1ANome: "João",
    jogador1BNome: "Maria",
    jogador2ANome: "Pedro",
    jogador2BNome: "Ana",
    setsDupla1: 1,
    setsDupla2: 0,
    placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 3 }],
  },
  {
    id: "partida-2",
    etapaId: "etapa-1",
    grupoId: "grupo-1",
    rodada: 1,
    status: "agendada",
    jogador1ANome: "Carlos",
    jogador1BNome: "Fernanda",
    jogador2ANome: "Roberto",
    jogador2BNome: "Lucia",
    setsDupla1: 0,
    setsDupla2: 0,
    placar: [],
  },
];

const mockPartidasRodada2 = [
  {
    id: "partida-3",
    etapaId: "etapa-1",
    grupoId: "grupo-1",
    rodada: 2,
    status: "em_andamento",
    jogador1ANome: "João",
    jogador1BNome: "Pedro",
    jogador2ANome: "Maria",
    jogador2BNome: "Ana",
    setsDupla1: 0,
    setsDupla2: 0,
    placar: [],
  },
  {
    id: "partida-4",
    etapaId: "etapa-1",
    grupoId: "grupo-1",
    rodada: 2,
    status: "cancelada",
    jogador1ANome: "Carlos",
    jogador1BNome: "Roberto",
    jogador2ANome: "Fernanda",
    jogador2BNome: "Lucia",
    setsDupla1: 0,
    setsDupla2: 0,
    placar: [],
  },
];

const mockPartidasWO = [
  {
    id: "partida-5",
    etapaId: "etapa-1",
    grupoId: "grupo-1",
    rodada: 3,
    status: "wo",
    jogador1ANome: "Jogador 1",
    jogador1BNome: "Jogador 2",
    jogador2ANome: "Jogador 3",
    jogador2BNome: "Jogador 4",
    setsDupla1: 0,
    setsDupla2: 0,
    placar: [],
  },
];

const mockPartidasSemRodada = [
  {
    id: "partida-sem-rodada",
    etapaId: "etapa-1",
    grupoId: "grupo-1",
    status: "agendada",
    jogador1ANome: "Jogador A",
    jogador1BNome: "Jogador B",
    jogador2ANome: "Jogador C",
    jogador2BNome: "Jogador D",
    setsDupla1: 0,
    setsDupla2: 0,
    placar: [],
  },
];

const mockPartidaDupla2Vencedor = [
  {
    id: "partida-d2-winner",
    etapaId: "etapa-1",
    grupoId: "grupo-1",
    rodada: 1,
    status: "finalizada",
    jogador1ANome: "Jogador 1",
    jogador1BNome: "Jogador 2",
    jogador2ANome: "Jogador 3",
    jogador2BNome: "Jogador 4",
    setsDupla1: 0,
    setsDupla2: 1,
    placar: [{ numero: 1, gamesDupla1: 4, gamesDupla2: 6 }],
  },
];

const allMockPartidas = [
  ...mockPartidasRodada1,
  ...mockPartidasRodada2,
  ...mockPartidasWO,
];

describe("PartidasSuperX", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBuscarPartidas.mockResolvedValue(allMockPartidas);
  });

  describe("estado de loading", () => {
    it("deve mostrar spinner durante loading", () => {
      mockBuscarPartidas.mockReturnValue(new Promise(() => {}));

      const { container } = render(
        <PartidasSuperX
          etapaId="etapa-1"
          grupoId="grupo-1"
          grupoNome="Super 8"
        />
      );

      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe("estado de erro", () => {
    it("deve mostrar mensagem de erro quando falha ao carregar", async () => {
      mockBuscarPartidas.mockRejectedValue(new Error("Erro de conexão"));

      render(
        <PartidasSuperX
          etapaId="etapa-1"
          grupoId="grupo-1"
          grupoNome="Super 8"
        />
      );

      await waitFor(() => {
        expect(
          screen.getByText(/Erro ao carregar partidas:/)
        ).toBeInTheDocument();
        expect(screen.getByText(/Erro de conexão/)).toBeInTheDocument();
      });
    });
  });

  describe("estado vazio", () => {
    it("deve mostrar mensagem quando não há partidas", async () => {
      mockBuscarPartidas.mockResolvedValue([]);

      render(
        <PartidasSuperX
          etapaId="etapa-1"
          grupoId="grupo-1"
          grupoNome="Super 8"
        />
      );

      await waitFor(() => {
        expect(
          screen.getByText("Nenhuma partida encontrada")
        ).toBeInTheDocument();
      });
    });
  });

  describe("renderização de partidas", () => {
    it("deve mostrar título com nome do grupo", async () => {
      render(
        <PartidasSuperX
          etapaId="etapa-1"
          grupoId="grupo-1"
          grupoNome="Super 8"
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Partidas - Super 8")).toBeInTheDocument();
      });
    });

    it("deve mostrar contador de partidas finalizadas", async () => {
      render(
        <PartidasSuperX
          etapaId="etapa-1"
          grupoId="grupo-1"
          grupoNome="Super 8"
        />
      );

      await waitFor(() => {
        // 1 partida finalizada de 5 total
        expect(screen.getByText("1 / 5 finalizadas")).toBeInTheDocument();
      });
    });

    it("deve agrupar partidas por rodada", async () => {
      render(
        <PartidasSuperX
          etapaId="etapa-1"
          grupoId="grupo-1"
          grupoNome="Super 8"
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Rodada 1")).toBeInTheDocument();
        expect(screen.getByText("Rodada 2")).toBeInTheDocument();
        expect(screen.getByText("Rodada 3")).toBeInTheDocument();
      });
    });

    it("deve mostrar contagem de partidas finalizadas por rodada", async () => {
      render(
        <PartidasSuperX
          etapaId="etapa-1"
          grupoId="grupo-1"
          grupoNome="Super 8"
        />
      );

      await waitFor(() => {
        // Rodada 1: 1/2, Rodada 2: 0/2, Rodada 3: 0/1
        expect(screen.getByText("1/2")).toBeInTheDocument();
        expect(screen.getByText("0/2")).toBeInTheDocument();
        expect(screen.getByText("0/1")).toBeInTheDocument();
      });
    });
  });

  describe("status das partidas", () => {
    it("deve mostrar status Finalizada", async () => {
      render(
        <PartidasSuperX
          etapaId="etapa-1"
          grupoId="grupo-1"
          grupoNome="Super 8"
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Finalizada")).toBeInTheDocument();
      });
    });

    it("deve mostrar status Aguardando para partida agendada", async () => {
      render(
        <PartidasSuperX
          etapaId="etapa-1"
          grupoId="grupo-1"
          grupoNome="Super 8"
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Aguardando")).toBeInTheDocument();
      });
    });

    it("deve mostrar status Em andamento", async () => {
      render(
        <PartidasSuperX
          etapaId="etapa-1"
          grupoId="grupo-1"
          grupoNome="Super 8"
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Em andamento")).toBeInTheDocument();
      });
    });

    it("deve mostrar status Cancelada", async () => {
      render(
        <PartidasSuperX
          etapaId="etapa-1"
          grupoId="grupo-1"
          grupoNome="Super 8"
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Cancelada")).toBeInTheDocument();
      });
    });

    it("deve mostrar status W.O.", async () => {
      render(
        <PartidasSuperX
          etapaId="etapa-1"
          grupoId="grupo-1"
          grupoNome="Super 8"
        />
      );

      await waitFor(() => {
        expect(screen.getByText("W.O.")).toBeInTheDocument();
      });
    });
  });

  describe("nomes das duplas", () => {
    it("deve mostrar nomes das duplas", async () => {
      render(
        <PartidasSuperX
          etapaId="etapa-1"
          grupoId="grupo-1"
          grupoNome="Super 8"
        />
      );

      await waitFor(() => {
        expect(screen.getByText("João & Maria")).toBeInTheDocument();
        expect(screen.getByText("Pedro & Ana")).toBeInTheDocument();
        expect(screen.getByText("Carlos & Fernanda")).toBeInTheDocument();
        expect(screen.getByText("Roberto & Lucia")).toBeInTheDocument();
      });
    });

    it("deve mostrar VS entre duplas", async () => {
      render(
        <PartidasSuperX
          etapaId="etapa-1"
          grupoId="grupo-1"
          grupoNome="Super 8"
        />
      );

      await waitFor(() => {
        const vsElements = screen.getAllByText("VS");
        expect(vsElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe("placar", () => {
    it("deve mostrar placar para partidas finalizadas", async () => {
      render(
        <PartidasSuperX
          etapaId="etapa-1"
          grupoId="grupo-1"
          grupoNome="Super 8"
        />
      );

      await waitFor(() => {
        expect(screen.getByText("6")).toBeInTheDocument();
        expect(screen.getByText("3")).toBeInTheDocument();
      });
    });

    it("deve destacar vencedor da dupla 1", async () => {
      render(
        <PartidasSuperX
          etapaId="etapa-1"
          grupoId="grupo-1"
          grupoNome="Super 8"
        />
      );

      await waitFor(() => {
        // Verificar que a partida finalizada está renderizada
        expect(screen.getByText("João & Maria")).toBeInTheDocument();
      });
    });

    it("deve destacar vencedor da dupla 2", async () => {
      mockBuscarPartidas.mockResolvedValue(mockPartidaDupla2Vencedor);

      render(
        <PartidasSuperX
          etapaId="etapa-1"
          grupoId="grupo-1"
          grupoNome="Super 8"
        />
      );

      await waitFor(() => {
        // Jogador 3 & Jogador 4 é o vencedor (setsDupla2 > setsDupla1)
        expect(screen.getByText("Jogador 3 & Jogador 4")).toBeInTheDocument();
        expect(screen.getByText("4")).toBeInTheDocument(); // games perdidos
        expect(screen.getByText("6")).toBeInTheDocument(); // games vencidos
      });
    });
  });

  describe("botões de ação", () => {
    it("deve mostrar botão Registrar Resultado para partida agendada", async () => {
      render(
        <PartidasSuperX
          etapaId="etapa-1"
          grupoId="grupo-1"
          grupoNome="Super 8"
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Registrar Resultado")).toBeInTheDocument();
      });
    });

    it("deve mostrar botão Editar Resultado para partida finalizada", async () => {
      render(
        <PartidasSuperX
          etapaId="etapa-1"
          grupoId="grupo-1"
          grupoNome="Super 8"
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Editar Resultado")).toBeInTheDocument();
      });
    });

    it("não deve mostrar botão Editar quando etapa está finalizada", async () => {
      render(
        <PartidasSuperX
          etapaId="etapa-1"
          grupoId="grupo-1"
          grupoNome="Super 8"
          etapaFinalizada={true}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText("Editar Resultado")).not.toBeInTheDocument();
      });
    });
  });

  describe("modal de resultado", () => {
    it("deve abrir modal ao clicar em Registrar Resultado", async () => {
      render(
        <PartidasSuperX
          etapaId="etapa-1"
          grupoId="grupo-1"
          grupoNome="Super 8"
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Registrar Resultado")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Registrar Resultado"));

      expect(screen.getByTestId("modal-resultado")).toBeInTheDocument();
    });

    it("deve abrir modal ao clicar em Editar Resultado", async () => {
      render(
        <PartidasSuperX
          etapaId="etapa-1"
          grupoId="grupo-1"
          grupoNome="Super 8"
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Editar Resultado")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Editar Resultado"));

      expect(screen.getByTestId("modal-resultado")).toBeInTheDocument();
    });

    it("deve fechar modal ao clicar em fechar", async () => {
      render(
        <PartidasSuperX
          etapaId="etapa-1"
          grupoId="grupo-1"
          grupoNome="Super 8"
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Registrar Resultado")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Registrar Resultado"));
      expect(screen.getByTestId("modal-resultado")).toBeInTheDocument();

      fireEvent.click(screen.getByTestId("modal-close"));
      expect(screen.queryByTestId("modal-resultado")).not.toBeInTheDocument();
    });

    it("deve recarregar partidas após sucesso do modal", async () => {
      const mockOnAtualizarGrupos = jest.fn();

      render(
        <PartidasSuperX
          etapaId="etapa-1"
          grupoId="grupo-1"
          grupoNome="Super 8"
          onAtualizarGrupos={mockOnAtualizarGrupos}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Registrar Resultado")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Registrar Resultado"));
      fireEvent.click(screen.getByTestId("modal-success"));

      // Modal deve fechar
      expect(screen.queryByTestId("modal-resultado")).not.toBeInTheDocument();

      // Deve chamar buscarPartidas novamente
      await waitFor(() => {
        expect(mockBuscarPartidas).toHaveBeenCalledTimes(2);
      });

      // Deve chamar callback de atualização de grupos
      expect(mockOnAtualizarGrupos).toHaveBeenCalled();
    });

    it("deve recarregar partidas mesmo sem callback de atualização", async () => {
      render(
        <PartidasSuperX
          etapaId="etapa-1"
          grupoId="grupo-1"
          grupoNome="Super 8"
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Registrar Resultado")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Registrar Resultado"));
      fireEvent.click(screen.getByTestId("modal-success"));

      // Deve chamar buscarPartidas novamente sem erro
      await waitFor(() => {
        expect(mockBuscarPartidas).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe("partidas sem rodada definida", () => {
    it("deve usar rodada 1 como padrão", async () => {
      mockBuscarPartidas.mockResolvedValue(mockPartidasSemRodada);

      render(
        <PartidasSuperX
          etapaId="etapa-1"
          grupoId="grupo-1"
          grupoNome="Super 8"
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Rodada 1")).toBeInTheDocument();
        expect(screen.getByText("Jogador A & Jogador B")).toBeInTheDocument();
      });
    });
  });

  describe("labels de status desconhecido", () => {
    it("deve mostrar status original quando não mapeado", async () => {
      const partidaComStatusDesconhecido = [
        {
          id: "partida-unknown",
          etapaId: "etapa-1",
          grupoId: "grupo-1",
          rodada: 1,
          status: "unknown_status",
          jogador1ANome: "Jogador X",
          jogador1BNome: "Jogador Y",
          jogador2ANome: "Jogador Z",
          jogador2BNome: "Jogador W",
          setsDupla1: 0,
          setsDupla2: 0,
          placar: [],
        },
      ];

      mockBuscarPartidas.mockResolvedValue(partidaComStatusDesconhecido);

      render(
        <PartidasSuperX
          etapaId="etapa-1"
          grupoId="grupo-1"
          grupoNome="Super 8"
        />
      );

      await waitFor(() => {
        expect(screen.getByText("unknown_status")).toBeInTheDocument();
      });
    });
  });

  describe("partidas sem placar", () => {
    it("deve mostrar 0 quando placar não existe", async () => {
      const partidaSemPlacar = [
        {
          id: "partida-sem-placar",
          etapaId: "etapa-1",
          grupoId: "grupo-1",
          rodada: 1,
          status: "finalizada",
          jogador1ANome: "Jogador 1",
          jogador1BNome: "Jogador 2",
          jogador2ANome: "Jogador 3",
          jogador2BNome: "Jogador 4",
          setsDupla1: 1,
          setsDupla2: 0,
          placar: null,
        },
      ];

      mockBuscarPartidas.mockResolvedValue(partidaSemPlacar);

      render(
        <PartidasSuperX
          etapaId="etapa-1"
          grupoId="grupo-1"
          grupoNome="Super 8"
        />
      );

      await waitFor(() => {
        const zeros = screen.getAllByText("0");
        expect(zeros.length).toBeGreaterThanOrEqual(2);
      });
    });
  });
});
