/**
 * Testes do componente PartidasGrupoReiDaPraia
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// Mock do reiDaPraiaService
const mockBuscarPartidas = jest.fn();

jest.mock("@/services", () => ({
  getReiDaPraiaService: () => ({
    buscarPartidas: mockBuscarPartidas,
  }),
}));

// Mock do ModalRegistrarResultadoReiDaPraia
jest.mock(
  "@/components/etapas/ModalRegistrarResultadoReiDaPraia",
  () => ({
    ModalRegistrarResultadoReiDaPraia: ({
      onClose,
      onSuccess,
    }: {
      partida: any;
      onClose: () => void;
      onSuccess: () => void;
    }) => (
      <div data-testid="modal-resultado">
        <button onClick={onClose}>Fechar Modal</button>
        <button onClick={onSuccess}>Salvar Resultado</button>
      </div>
    ),
  })
);

import { PartidasGrupoReiDaPraia } from "@/components/etapas/PartidasGrupoReiDaPraia/PartidasGrupoReiDaPraia";

const mockPartidas = [
  {
    id: "partida-1",
    grupoId: "grupo-1",
    jogador1ANome: "João",
    jogador1BNome: "Maria",
    jogador2ANome: "Pedro",
    jogador2BNome: "Ana",
    status: "agendada",
    setsDupla1: 0,
    setsDupla2: 0,
    placar: [],
  },
  {
    id: "partida-2",
    grupoId: "grupo-1",
    jogador1ANome: "Carlos",
    jogador1BNome: "Lucia",
    jogador2ANome: "Bruno",
    jogador2BNome: "Carla",
    status: "finalizada",
    setsDupla1: 2,
    setsDupla2: 1,
    placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }],
  },
  {
    id: "partida-3",
    grupoId: "grupo-1",
    jogador1ANome: "Fernando",
    jogador1BNome: "Rita",
    jogador2ANome: "Lucas",
    jogador2BNome: "Marta",
    status: "em_andamento",
    setsDupla1: 1,
    setsDupla2: 1,
    placar: [],
  },
];

describe("PartidasGrupoReiDaPraia", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("estados de loading e erro", () => {
    it("deve mostrar loading enquanto carrega partidas", async () => {
      mockBuscarPartidas.mockReturnValue(new Promise(() => {}));

      const { container } = render(
        <PartidasGrupoReiDaPraia
          etapaId="etapa-1"
          grupoId="grupo-1"
          grupoNome="Grupo A"
        />
      );

      expect(screen.queryByText("Partidas -")).not.toBeInTheDocument();
      expect(container.firstChild).toBeInTheDocument();
    });

    it("deve mostrar erro quando falha ao carregar", async () => {
      mockBuscarPartidas.mockRejectedValue(new Error("Erro de conexão"));

      render(
        <PartidasGrupoReiDaPraia
          etapaId="etapa-1"
          grupoId="grupo-1"
          grupoNome="Grupo A"
        />
      );

      await waitFor(() => {
        expect(
          screen.getByText(/Erro ao carregar partidas: Erro de conexão/)
        ).toBeInTheDocument();
      });
    });

    it("deve mostrar estado vazio quando não há partidas", async () => {
      mockBuscarPartidas.mockResolvedValue([]);

      render(
        <PartidasGrupoReiDaPraia
          etapaId="etapa-1"
          grupoId="grupo-1"
          grupoNome="Grupo A"
        />
      );

      await waitFor(() => {
        expect(
          screen.getByText("Nenhuma partida encontrada para este grupo")
        ).toBeInTheDocument();
      });
    });
  });

  describe("renderização de partidas", () => {
    it("deve mostrar título com nome do grupo", async () => {
      mockBuscarPartidas.mockResolvedValue(mockPartidas);

      render(
        <PartidasGrupoReiDaPraia
          etapaId="etapa-1"
          grupoId="grupo-1"
          grupoNome="Grupo A"
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Partidas - Grupo A")).toBeInTheDocument();
      });
    });

    it("deve mostrar contador de partidas finalizadas", async () => {
      mockBuscarPartidas.mockResolvedValue(mockPartidas);

      render(
        <PartidasGrupoReiDaPraia
          etapaId="etapa-1"
          grupoId="grupo-1"
          grupoNome="Grupo A"
        />
      );

      await waitFor(() => {
        expect(screen.getByText("1 / 3 finalizadas")).toBeInTheDocument();
      });
    });

    it("deve mostrar nomes das duplas", async () => {
      mockBuscarPartidas.mockResolvedValue(mockPartidas);

      render(
        <PartidasGrupoReiDaPraia
          etapaId="etapa-1"
          grupoId="grupo-1"
          grupoNome="Grupo A"
        />
      );

      await waitFor(() => {
        expect(screen.getByText("João & Maria")).toBeInTheDocument();
        expect(screen.getByText("Pedro & Ana")).toBeInTheDocument();
      });
    });

    it("deve mostrar separador VS entre duplas", async () => {
      mockBuscarPartidas.mockResolvedValue(mockPartidas);

      render(
        <PartidasGrupoReiDaPraia
          etapaId="etapa-1"
          grupoId="grupo-1"
          grupoNome="Grupo A"
        />
      );

      await waitFor(() => {
        expect(screen.getAllByText("VS").length).toBe(3);
      });
    });
  });

  describe("status das partidas", () => {
    it("deve mostrar badge 'Aguardando' para partida agendada", async () => {
      mockBuscarPartidas.mockResolvedValue([mockPartidas[0]]);

      render(
        <PartidasGrupoReiDaPraia
          etapaId="etapa-1"
          grupoId="grupo-1"
          grupoNome="Grupo A"
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Aguardando")).toBeInTheDocument();
      });
    });

    it("deve mostrar badge 'Finalizada' para partida finalizada", async () => {
      mockBuscarPartidas.mockResolvedValue([mockPartidas[1]]);

      render(
        <PartidasGrupoReiDaPraia
          etapaId="etapa-1"
          grupoId="grupo-1"
          grupoNome="Grupo A"
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Finalizada")).toBeInTheDocument();
      });
    });

    it("deve mostrar badge 'Em andamento' para partida em andamento", async () => {
      mockBuscarPartidas.mockResolvedValue([mockPartidas[2]]);

      render(
        <PartidasGrupoReiDaPraia
          etapaId="etapa-1"
          grupoId="grupo-1"
          grupoNome="Grupo A"
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Em andamento")).toBeInTheDocument();
      });
    });

    it("deve mostrar badge 'Cancelada' para partida cancelada", async () => {
      const partidaCancelada = { ...mockPartidas[0], status: "cancelada" };
      mockBuscarPartidas.mockResolvedValue([partidaCancelada]);

      render(
        <PartidasGrupoReiDaPraia
          etapaId="etapa-1"
          grupoId="grupo-1"
          grupoNome="Grupo A"
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Cancelada")).toBeInTheDocument();
      });
    });

    it("deve mostrar badge 'W.O.' para partida wo", async () => {
      const partidaWO = { ...mockPartidas[0], status: "wo" };
      mockBuscarPartidas.mockResolvedValue([partidaWO]);

      render(
        <PartidasGrupoReiDaPraia
          etapaId="etapa-1"
          grupoId="grupo-1"
          grupoNome="Grupo A"
        />
      );

      await waitFor(() => {
        expect(screen.getByText("W.O.")).toBeInTheDocument();
      });
    });
  });

  describe("placar de partidas finalizadas", () => {
    it("deve mostrar placar para partida finalizada", async () => {
      mockBuscarPartidas.mockResolvedValue([mockPartidas[1]]);

      render(
        <PartidasGrupoReiDaPraia
          etapaId="etapa-1"
          grupoId="grupo-1"
          grupoNome="Grupo A"
        />
      );

      await waitFor(() => {
        expect(screen.getByText("6")).toBeInTheDocument();
        expect(screen.getByText("4")).toBeInTheDocument();
      });
    });
  });

  describe("botões de ação", () => {
    it("deve mostrar botão 'Registrar Resultado' para partida agendada", async () => {
      mockBuscarPartidas.mockResolvedValue([mockPartidas[0]]);

      render(
        <PartidasGrupoReiDaPraia
          etapaId="etapa-1"
          grupoId="grupo-1"
          grupoNome="Grupo A"
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Registrar Resultado")).toBeInTheDocument();
      });
    });

    it("deve mostrar botão 'Editar Resultado' para partida finalizada", async () => {
      mockBuscarPartidas.mockResolvedValue([mockPartidas[1]]);

      render(
        <PartidasGrupoReiDaPraia
          etapaId="etapa-1"
          grupoId="grupo-1"
          grupoNome="Grupo A"
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Editar Resultado")).toBeInTheDocument();
      });
    });

    it("deve abrir modal ao clicar em 'Registrar Resultado'", async () => {
      mockBuscarPartidas.mockResolvedValue([mockPartidas[0]]);

      render(
        <PartidasGrupoReiDaPraia
          etapaId="etapa-1"
          grupoId="grupo-1"
          grupoNome="Grupo A"
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Registrar Resultado")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Registrar Resultado"));

      expect(screen.getByTestId("modal-resultado")).toBeInTheDocument();
    });

    it("deve fechar modal ao clicar em fechar", async () => {
      mockBuscarPartidas.mockResolvedValue([mockPartidas[0]]);

      render(
        <PartidasGrupoReiDaPraia
          etapaId="etapa-1"
          grupoId="grupo-1"
          grupoNome="Grupo A"
        />
      );

      await waitFor(() => {
        fireEvent.click(screen.getByText("Registrar Resultado"));
      });

      expect(screen.getByTestId("modal-resultado")).toBeInTheDocument();

      fireEvent.click(screen.getByText("Fechar Modal"));

      expect(screen.queryByTestId("modal-resultado")).not.toBeInTheDocument();
    });
  });

  describe("bloqueio por eliminatória", () => {
    it("deve desabilitar edição quando eliminatória existe", async () => {
      mockBuscarPartidas.mockResolvedValue([mockPartidas[1]]);

      render(
        <PartidasGrupoReiDaPraia
          etapaId="etapa-1"
          grupoId="grupo-1"
          grupoNome="Grupo A"
          eliminatoriaExiste={true}
        />
      );

      await waitFor(() => {
        const editButton = screen.getByText("Editar Resultado");
        expect(editButton.closest("button")).toBeDisabled();
      });
    });

    it("deve mostrar aviso quando eliminatória existe", async () => {
      mockBuscarPartidas.mockResolvedValue([mockPartidas[1]]);

      render(
        <PartidasGrupoReiDaPraia
          etapaId="etapa-1"
          grupoId="grupo-1"
          grupoNome="Grupo A"
          eliminatoriaExiste={true}
        />
      );

      await waitFor(() => {
        expect(
          screen.getByText("Para editar, cancele a eliminatória primeiro")
        ).toBeInTheDocument();
      });
    });
  });

  describe("callback de atualização", () => {
    it("deve chamar onAtualizarGrupos após registrar resultado", async () => {
      const onAtualizarGrupos = jest.fn();
      mockBuscarPartidas.mockResolvedValue([mockPartidas[0]]);

      render(
        <PartidasGrupoReiDaPraia
          etapaId="etapa-1"
          grupoId="grupo-1"
          grupoNome="Grupo A"
          onAtualizarGrupos={onAtualizarGrupos}
        />
      );

      await waitFor(() => {
        fireEvent.click(screen.getByText("Registrar Resultado"));
      });

      fireEvent.click(screen.getByText("Salvar Resultado"));

      await waitFor(() => {
        expect(onAtualizarGrupos).toHaveBeenCalled();
      });
    });
  });

  describe("filtro por grupo", () => {
    it("deve filtrar partidas pelo grupoId", async () => {
      const todasPartidas = [
        ...mockPartidas,
        {
          id: "partida-outro-grupo",
          grupoId: "grupo-2",
          jogador1ANome: "Outra",
          jogador1BNome: "Dupla",
          jogador2ANome: "Mais",
          jogador2BNome: "Uma",
          status: "agendada",
          setsDupla1: 0,
          setsDupla2: 0,
        },
      ];
      mockBuscarPartidas.mockResolvedValue(todasPartidas);

      render(
        <PartidasGrupoReiDaPraia
          etapaId="etapa-1"
          grupoId="grupo-1"
          grupoNome="Grupo A"
        />
      );

      await waitFor(() => {
        // Deve mostrar apenas partidas do grupo-1
        expect(screen.getByText("1 / 3 finalizadas")).toBeInTheDocument();
        expect(screen.queryByText("Outra & Dupla")).not.toBeInTheDocument();
      });
    });
  });
});
