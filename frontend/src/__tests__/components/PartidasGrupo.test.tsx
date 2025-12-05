/**
 * Testes do componente PartidasGrupo
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { StatusPartida } from "@/types/chave";

// Mock do chaveService
const mockBuscarPartidas = jest.fn();

jest.mock("@/services", () => ({
  getChaveService: () => ({
    buscarPartidas: mockBuscarPartidas,
  }),
}));

// Mock do ModalRegistrarResultado
jest.mock(
  "@/components/etapas/ModalRegistrarResultado",
  () => ({
    ModalRegistrarResultado: ({
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

import { PartidasGrupo } from "@/components/etapas/PartidasGrupo/PartidasGrupo";

const mockPartidas = [
  {
    id: "partida-1",
    grupoId: "grupo-1",
    dupla1Id: "dupla-1",
    dupla1Nome: "João / Maria",
    dupla2Id: "dupla-2",
    dupla2Nome: "Pedro / Ana",
    status: StatusPartida.AGENDADA,
    setsDupla1: 0,
    setsDupla2: 0,
    vencedoraId: null,
  },
  {
    id: "partida-2",
    grupoId: "grupo-1",
    dupla1Id: "dupla-1",
    dupla1Nome: "João / Maria",
    dupla2Id: "dupla-3",
    dupla2Nome: "Carlos / Lucia",
    status: StatusPartida.FINALIZADA,
    setsDupla1: 2,
    setsDupla2: 1,
    vencedoraId: "dupla-1",
  },
  {
    id: "partida-3",
    grupoId: "grupo-1",
    dupla1Id: "dupla-2",
    dupla1Nome: "Pedro / Ana",
    dupla2Id: "dupla-3",
    dupla2Nome: "Carlos / Lucia",
    status: StatusPartida.EM_ANDAMENTO,
    setsDupla1: 1,
    setsDupla2: 1,
    vencedoraId: null,
  },
];

describe("PartidasGrupo", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("estados de loading e erro", () => {
    it("deve mostrar loading enquanto carrega partidas", async () => {
      mockBuscarPartidas.mockReturnValue(new Promise(() => {})); // never resolves

      const { container } = render(
        <PartidasGrupo
          etapaId="etapa-1"
          grupoId="grupo-1"
          grupoNome="Grupo A"
        />
      );

      // O componente renderiza um spinner (div com animação) enquanto carrega
      // Não deve mostrar conteúdo ainda
      expect(screen.queryByText("Partidas -")).not.toBeInTheDocument();
      expect(container.firstChild).toBeInTheDocument();
    });

    it("deve mostrar erro quando falha ao carregar", async () => {
      mockBuscarPartidas.mockRejectedValue(new Error("Erro de conexão"));

      render(
        <PartidasGrupo
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
        <PartidasGrupo
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
        <PartidasGrupo
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
        <PartidasGrupo
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
        <PartidasGrupo
          etapaId="etapa-1"
          grupoId="grupo-1"
          grupoNome="Grupo A"
        />
      );

      await waitFor(() => {
        expect(screen.getAllByText("João / Maria").length).toBeGreaterThan(0);
        expect(screen.getAllByText("Pedro / Ana").length).toBeGreaterThan(0);
        expect(screen.getAllByText("Carlos / Lucia").length).toBeGreaterThan(0);
      });
    });

    it("deve mostrar separador VS entre duplas", async () => {
      mockBuscarPartidas.mockResolvedValue(mockPartidas);

      render(
        <PartidasGrupo
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
    it("deve mostrar badge 'Aguardando' para partida AGENDADA", async () => {
      mockBuscarPartidas.mockResolvedValue([mockPartidas[0]]);

      render(
        <PartidasGrupo
          etapaId="etapa-1"
          grupoId="grupo-1"
          grupoNome="Grupo A"
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Aguardando")).toBeInTheDocument();
      });
    });

    it("deve mostrar badge 'Finalizada' para partida FINALIZADA", async () => {
      mockBuscarPartidas.mockResolvedValue([mockPartidas[1]]);

      render(
        <PartidasGrupo
          etapaId="etapa-1"
          grupoId="grupo-1"
          grupoNome="Grupo A"
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Finalizada")).toBeInTheDocument();
      });
    });

    it("deve mostrar badge 'Em andamento' para partida EM_ANDAMENTO", async () => {
      mockBuscarPartidas.mockResolvedValue([mockPartidas[2]]);

      render(
        <PartidasGrupo
          etapaId="etapa-1"
          grupoId="grupo-1"
          grupoNome="Grupo A"
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Em andamento")).toBeInTheDocument();
      });
    });

    it("deve mostrar badge 'Cancelada' para partida CANCELADA", async () => {
      const partidaCancelada = {
        ...mockPartidas[0],
        status: StatusPartida.CANCELADA,
      };
      mockBuscarPartidas.mockResolvedValue([partidaCancelada]);

      render(
        <PartidasGrupo
          etapaId="etapa-1"
          grupoId="grupo-1"
          grupoNome="Grupo A"
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Cancelada")).toBeInTheDocument();
      });
    });

    it("deve mostrar badge 'W.O.' para partida WO", async () => {
      const partidaWO = { ...mockPartidas[0], status: StatusPartida.WO };
      mockBuscarPartidas.mockResolvedValue([partidaWO]);

      render(
        <PartidasGrupo
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
        <PartidasGrupo
          etapaId="etapa-1"
          grupoId="grupo-1"
          grupoNome="Grupo A"
        />
      );

      await waitFor(() => {
        expect(screen.getByText("2")).toBeInTheDocument();
        expect(screen.getByText("1")).toBeInTheDocument();
      });
    });

    it("não deve mostrar placar para partida não finalizada", async () => {
      mockBuscarPartidas.mockResolvedValue([mockPartidas[0]]);

      render(
        <PartidasGrupo
          etapaId="etapa-1"
          grupoId="grupo-1"
          grupoNome="Grupo A"
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Aguardando")).toBeInTheDocument();
      });

      // Não deve haver elementos Score para partida agendada
      const scoreElements = document.querySelectorAll('[class*="Score"]');
      expect(scoreElements.length).toBe(0);
    });
  });

  describe("botões de ação", () => {
    it("deve mostrar botão 'Registrar Resultado' para partida AGENDADA", async () => {
      mockBuscarPartidas.mockResolvedValue([mockPartidas[0]]);

      render(
        <PartidasGrupo
          etapaId="etapa-1"
          grupoId="grupo-1"
          grupoNome="Grupo A"
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Registrar Resultado")).toBeInTheDocument();
      });
    });

    it("deve mostrar botão 'Editar Resultado' para partida FINALIZADA", async () => {
      mockBuscarPartidas.mockResolvedValue([mockPartidas[1]]);

      render(
        <PartidasGrupo
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
        <PartidasGrupo
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
        <PartidasGrupo
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

  describe("bloqueio por eliminatória ou etapa finalizada", () => {
    it("deve desabilitar edição quando eliminatória existe", async () => {
      mockBuscarPartidas.mockResolvedValue([mockPartidas[1]]);

      render(
        <PartidasGrupo
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
        <PartidasGrupo
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

    it("deve mostrar 'Etapa Finalizada' quando etapa está finalizada", async () => {
      mockBuscarPartidas.mockResolvedValue([mockPartidas[1]]);

      render(
        <PartidasGrupo
          etapaId="etapa-1"
          grupoId="grupo-1"
          grupoNome="Grupo A"
          etapaFinalizada={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Etapa Finalizada")).toBeInTheDocument();
      });
    });

    it("não deve mostrar aviso de eliminatória quando etapa está finalizada", async () => {
      mockBuscarPartidas.mockResolvedValue([mockPartidas[1]]);

      render(
        <PartidasGrupo
          etapaId="etapa-1"
          grupoId="grupo-1"
          grupoNome="Grupo A"
          etapaFinalizada={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Etapa Finalizada")).toBeInTheDocument();
      });

      expect(
        screen.queryByText("Para editar, cancele a eliminatória primeiro")
      ).not.toBeInTheDocument();
    });
  });

  describe("callback de atualização", () => {
    it("deve chamar onAtualizarGrupos após registrar resultado", async () => {
      const onAtualizarGrupos = jest.fn();
      mockBuscarPartidas.mockResolvedValue([mockPartidas[0]]);

      render(
        <PartidasGrupo
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
          dupla1Id: "dupla-4",
          dupla1Nome: "Outra / Dupla",
          dupla2Id: "dupla-5",
          dupla2Nome: "Mais / Uma",
          status: StatusPartida.AGENDADA,
        },
      ];
      mockBuscarPartidas.mockResolvedValue(todasPartidas);

      render(
        <PartidasGrupo
          etapaId="etapa-1"
          grupoId="grupo-1"
          grupoNome="Grupo A"
        />
      );

      await waitFor(() => {
        // Deve mostrar apenas partidas do grupo-1
        expect(screen.getByText("1 / 3 finalizadas")).toBeInTheDocument();
        expect(screen.queryByText("Outra / Dupla")).not.toBeInTheDocument();
      });
    });
  });
});
