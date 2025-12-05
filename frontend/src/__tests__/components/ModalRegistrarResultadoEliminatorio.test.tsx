/**
 * Testes do componente ModalRegistrarResultadoEliminatorio
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { StatusConfrontoEliminatorio, TipoFase } from "@/types/chave";

// Mock do service
const mockRegistrarResultadoEliminatorio = jest.fn();

jest.mock("@/services", () => ({
  getChaveService: () => ({
    registrarResultadoEliminatorio: mockRegistrarResultadoEliminatorio,
  }),
}));

import { ModalRegistrarResultadoEliminatorio } from "@/components/etapas/ModalRegistrarResultadoEliminatorio/ModalRegistrarResultadoEliminatorio";

const mockConfrontoNovo = {
  id: "confronto-1",
  etapaId: "etapa-1",
  fase: TipoFase.SEMIFINAL,
  ordem: 1,
  dupla1Id: "dupla-1",
  dupla1Nome: "João & Maria",
  dupla1Origem: "1º Grupo A",
  dupla2Id: "dupla-2",
  dupla2Nome: "Pedro & Ana",
  dupla2Origem: "2º Grupo B",
  status: StatusConfrontoEliminatorio.AGENDADA,
  placar: null,
  vencedoraId: null,
  vencedoraNome: null,
};

const mockConfrontoFinalizado = {
  id: "confronto-2",
  etapaId: "etapa-1",
  fase: TipoFase.FINAL,
  ordem: 1,
  dupla1Id: "dupla-1",
  dupla1Nome: "João & Maria",
  dupla1Origem: "Vencedor Semi 1",
  dupla2Id: "dupla-2",
  dupla2Nome: "Pedro & Ana",
  dupla2Origem: "Vencedor Semi 2",
  status: StatusConfrontoEliminatorio.FINALIZADA,
  placar: "6-4",
  vencedoraId: "dupla-1",
  vencedoraNome: "João & Maria",
};

describe("ModalRegistrarResultadoEliminatorio", () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("renderização", () => {
    it("deve mostrar título 'Registrar Resultado' para confronto novo", () => {
      render(
        <ModalRegistrarResultadoEliminatorio
          confronto={mockConfrontoNovo}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByText(/Registrar Resultado/)).toBeInTheDocument();
    });

    it("deve mostrar título 'Editar Resultado' para confronto finalizado", () => {
      render(
        <ModalRegistrarResultadoEliminatorio
          confronto={mockConfrontoFinalizado}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByText(/Editar Resultado/)).toBeInTheDocument();
    });

    it("deve mostrar info do confronto", () => {
      render(
        <ModalRegistrarResultadoEliminatorio
          confronto={mockConfrontoNovo}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByText("Confronto Eliminatório")).toBeInTheDocument();
      expect(screen.getByText("1º Grupo A vs 2º Grupo B")).toBeInTheDocument();
    });

    it("deve mostrar nomes das duplas nos labels", () => {
      render(
        <ModalRegistrarResultadoEliminatorio
          confronto={mockConfrontoNovo}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByText("João & Maria")).toBeInTheDocument();
      expect(screen.getByText("Pedro & Ana")).toBeInTheDocument();
    });

    it("deve mostrar seção de placar do set", () => {
      render(
        <ModalRegistrarResultadoEliminatorio
          confronto={mockConfrontoNovo}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByText("Placar do Set")).toBeInTheDocument();
    });

    it("deve mostrar inputs de placar", () => {
      render(
        <ModalRegistrarResultadoEliminatorio
          confronto={mockConfrontoNovo}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      expect(inputs.length).toBe(2);
    });

    it("deve mostrar botões de ação", () => {
      render(
        <ModalRegistrarResultadoEliminatorio
          confronto={mockConfrontoNovo}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByText("Cancelar")).toBeInTheDocument();
      expect(screen.getByText("Salvar Resultado")).toBeInTheDocument();
    });

    it("deve mostrar aviso sobre avanço automático", () => {
      render(
        <ModalRegistrarResultadoEliminatorio
          confronto={mockConfrontoNovo}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByText(/Importante:/)).toBeInTheDocument();
      expect(
        screen.getByText(/O vencedor avançará automaticamente/)
      ).toBeInTheDocument();
    });
  });

  describe("edição de confronto finalizado", () => {
    it("deve preencher placar existente", () => {
      render(
        <ModalRegistrarResultadoEliminatorio
          confronto={mockConfrontoFinalizado}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      expect(inputs[0]).toHaveValue(6);
      expect(inputs[1]).toHaveValue(4);
    });

    it("deve mostrar botão 'Atualizar Resultado'", () => {
      render(
        <ModalRegistrarResultadoEliminatorio
          confronto={mockConfrontoFinalizado}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByText("Atualizar Resultado")).toBeInTheDocument();
    });
  });

  describe("cálculo de vencedor", () => {
    it("deve mostrar vencedor quando placar válido", () => {
      render(
        <ModalRegistrarResultadoEliminatorio
          confronto={mockConfrontoNovo}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });

      expect(screen.getByText("Vencedor")).toBeInTheDocument();
      expect(screen.getByText("Placar: 6 x 4")).toBeInTheDocument();
    });

    it("deve identificar dupla2 como vencedora quando ela ganha", () => {
      render(
        <ModalRegistrarResultadoEliminatorio
          confronto={mockConfrontoNovo}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "3" } });
      fireEvent.change(inputs[1], { target: { value: "6" } });

      expect(screen.getByText("Placar: 3 x 6")).toBeInTheDocument();
    });

    it("não deve mostrar vencedor quando placar empatado", () => {
      render(
        <ModalRegistrarResultadoEliminatorio
          confronto={mockConfrontoNovo}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "5" } });
      fireEvent.change(inputs[1], { target: { value: "5" } });

      expect(screen.queryByText("Vencedor")).not.toBeInTheDocument();
    });
  });

  describe("validação de placar", () => {
    it("deve desabilitar botão quando placar vazio", () => {
      render(
        <ModalRegistrarResultadoEliminatorio
          confronto={mockConfrontoNovo}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const submitButton = screen.getByText("Salvar Resultado").closest("button");
      expect(submitButton).toBeDisabled();
    });

    it("deve desabilitar botão quando apenas dupla1 preenchida", () => {
      render(
        <ModalRegistrarResultadoEliminatorio
          confronto={mockConfrontoNovo}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });

      const submitButton = screen.getByText("Salvar Resultado").closest("button");
      expect(submitButton).toBeDisabled();
    });

    it("deve desabilitar botão para placar empatado", () => {
      render(
        <ModalRegistrarResultadoEliminatorio
          confronto={mockConfrontoNovo}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "6" } });

      const submitButton = screen.getByText("Salvar Resultado").closest("button");
      expect(submitButton).toBeDisabled();
    });

    it("deve mostrar erro para set com menos de 6 games", async () => {
      render(
        <ModalRegistrarResultadoEliminatorio
          confronto={mockConfrontoNovo}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "5" } });
      fireEvent.change(inputs[1], { target: { value: "3" } });

      fireEvent.click(screen.getByText("Salvar Resultado"));

      await waitFor(() => {
        expect(
          screen.getByText(/O set deve ter no mínimo 6 games/)
        ).toBeInTheDocument();
      });
    });

    it("deve mostrar erro para 6x5 (inválido)", async () => {
      render(
        <ModalRegistrarResultadoEliminatorio
          confronto={mockConfrontoNovo}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "5" } });

      fireEvent.click(screen.getByText("Salvar Resultado"));

      await waitFor(() => {
        expect(
          screen.getByText(/Set com 6 games:/)
        ).toBeInTheDocument();
      });
    });

    it("deve mostrar erro para mais de 7 games", async () => {
      render(
        <ModalRegistrarResultadoEliminatorio
          confronto={mockConfrontoNovo}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "8" } });
      fireEvent.change(inputs[1], { target: { value: "6" } });

      fireEvent.click(screen.getByText("Salvar Resultado"));

      await waitFor(() => {
        expect(
          screen.getByText(/Set não pode ter mais de 7 games/)
        ).toBeInTheDocument();
      });
    });
  });

  describe("placares válidos", () => {
    const placaresValidos = [
      { dupla1: 6, dupla2: 0 },
      { dupla1: 6, dupla2: 4 },
      { dupla1: 7, dupla2: 5 },
      { dupla1: 7, dupla2: 6 },
      { dupla1: 0, dupla2: 6 },
    ];

    placaresValidos.forEach(({ dupla1, dupla2 }) => {
      it(`deve aceitar placar ${dupla1}x${dupla2}`, async () => {
        mockRegistrarResultadoEliminatorio.mockResolvedValue(undefined);
        const alertMock = jest.spyOn(window, "alert").mockImplementation(() => {});

        render(
          <ModalRegistrarResultadoEliminatorio
            confronto={mockConfrontoNovo}
            onClose={mockOnClose}
            onSuccess={mockOnSuccess}
          />
        );

        const inputs = screen.getAllByRole("spinbutton");
        fireEvent.change(inputs[0], { target: { value: String(dupla1) } });
        fireEvent.change(inputs[1], { target: { value: String(dupla2) } });

        fireEvent.click(screen.getByText("Salvar Resultado"));

        await waitFor(() => {
          expect(mockRegistrarResultadoEliminatorio).toHaveBeenCalled();
        });

        alertMock.mockRestore();
      });
    });
  });

  describe("submissão do formulário", () => {
    it("deve chamar registrarResultadoEliminatorio com dados corretos", async () => {
      mockRegistrarResultadoEliminatorio.mockResolvedValue(undefined);
      const alertMock = jest.spyOn(window, "alert").mockImplementation(() => {});

      render(
        <ModalRegistrarResultadoEliminatorio
          confronto={mockConfrontoNovo}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });

      fireEvent.click(screen.getByText("Salvar Resultado"));

      await waitFor(() => {
        expect(mockRegistrarResultadoEliminatorio).toHaveBeenCalledWith(
          "confronto-1",
          [
            expect.objectContaining({
              numero: 1,
              gamesDupla1: 6,
              gamesDupla2: 4,
            }),
          ]
        );
      });

      alertMock.mockRestore();
    });

    it("deve chamar onSuccess após registro bem sucedido", async () => {
      mockRegistrarResultadoEliminatorio.mockResolvedValue(undefined);
      const alertMock = jest.spyOn(window, "alert").mockImplementation(() => {});

      render(
        <ModalRegistrarResultadoEliminatorio
          confronto={mockConfrontoNovo}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });

      fireEvent.click(screen.getByText("Salvar Resultado"));

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });

      alertMock.mockRestore();
    });

    it("deve mostrar alert de sucesso para novo registro", async () => {
      mockRegistrarResultadoEliminatorio.mockResolvedValue(undefined);
      const alertMock = jest.spyOn(window, "alert").mockImplementation(() => {});

      render(
        <ModalRegistrarResultadoEliminatorio
          confronto={mockConfrontoNovo}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });

      fireEvent.click(screen.getByText("Salvar Resultado"));

      await waitFor(() => {
        expect(alertMock).toHaveBeenCalledWith(
          expect.stringContaining("Resultado registrado com sucesso")
        );
      });

      alertMock.mockRestore();
    });

    it("deve mostrar alert de sucesso para edição", async () => {
      mockRegistrarResultadoEliminatorio.mockResolvedValue(undefined);
      const alertMock = jest.spyOn(window, "alert").mockImplementation(() => {});

      render(
        <ModalRegistrarResultadoEliminatorio
          confronto={mockConfrontoFinalizado}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      fireEvent.click(screen.getByText("Atualizar Resultado"));

      await waitFor(() => {
        expect(alertMock).toHaveBeenCalledWith(
          expect.stringContaining("Resultado atualizado com sucesso")
        );
      });

      alertMock.mockRestore();
    });

    it("deve mostrar erro ao falhar registro", async () => {
      mockRegistrarResultadoEliminatorio.mockRejectedValue(
        new Error("Erro de rede")
      );

      render(
        <ModalRegistrarResultadoEliminatorio
          confronto={mockConfrontoNovo}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });

      fireEvent.click(screen.getByText("Salvar Resultado"));

      await waitFor(() => {
        expect(screen.getByText(/Erro de rede/)).toBeInTheDocument();
      });
    });
  });

  describe("botões de ação", () => {
    it("deve fechar modal ao clicar em Cancelar", () => {
      render(
        <ModalRegistrarResultadoEliminatorio
          confronto={mockConfrontoNovo}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      fireEvent.click(screen.getByText("Cancelar"));
      expect(mockOnClose).toHaveBeenCalled();
    });

    it("deve fechar modal ao clicar no X", () => {
      render(
        <ModalRegistrarResultadoEliminatorio
          confronto={mockConfrontoNovo}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      fireEvent.click(screen.getByText("✕"));
      expect(mockOnClose).toHaveBeenCalled();
    });

    it("deve habilitar botão de salvar com vencedor válido", () => {
      render(
        <ModalRegistrarResultadoEliminatorio
          confronto={mockConfrontoNovo}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });

      const submitButton = screen.getByText("Salvar Resultado").closest("button");
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe("estado de loading", () => {
    it("deve mostrar spinner durante loading", async () => {
      mockRegistrarResultadoEliminatorio.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(
        <ModalRegistrarResultadoEliminatorio
          confronto={mockConfrontoNovo}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });

      fireEvent.click(screen.getByText("Salvar Resultado"));

      expect(screen.getByText("Salvando...")).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText("Salvando...")).not.toBeInTheDocument();
      });
    });

    it("deve desabilitar inputs durante loading", async () => {
      mockRegistrarResultadoEliminatorio.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(
        <ModalRegistrarResultadoEliminatorio
          confronto={mockConfrontoNovo}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });

      fireEvent.click(screen.getByText("Salvar Resultado"));

      await waitFor(() => {
        expect(inputs[0]).toBeDisabled();
        expect(inputs[1]).toBeDisabled();
      });
    });
  });

  describe("validações de placar não preenchido", () => {
    it("deve desabilitar botão quando placar não preenchido", () => {
      render(
        <ModalRegistrarResultadoEliminatorio
          confronto={mockConfrontoNovo}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const submitButton = screen.getByText("Salvar Resultado").closest("button");
      expect(submitButton).toBeDisabled();
    });

    it("deve desabilitar botão quando apenas dupla1 preenchida", () => {
      render(
        <ModalRegistrarResultadoEliminatorio
          confronto={mockConfrontoNovo}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });

      const submitButton = screen.getByText("Salvar Resultado").closest("button");
      expect(submitButton).toBeDisabled();
    });

    it("deve desabilitar botão quando apenas dupla2 preenchida", () => {
      render(
        <ModalRegistrarResultadoEliminatorio
          confronto={mockConfrontoNovo}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[1], { target: { value: "6" } });

      const submitButton = screen.getByText("Salvar Resultado").closest("button");
      expect(submitButton).toBeDisabled();
    });

    it("deve desabilitar botão para placar empatado", () => {
      render(
        <ModalRegistrarResultadoEliminatorio
          confronto={mockConfrontoNovo}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "5" } });
      fireEvent.change(inputs[1], { target: { value: "5" } });

      const submitButton = screen.getByText("Salvar Resultado").closest("button");
      expect(submitButton).toBeDisabled();
    });

    it("deve mostrar erro para 7x4 (inválido)", async () => {
      render(
        <ModalRegistrarResultadoEliminatorio
          confronto={mockConfrontoNovo}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "7" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });

      fireEvent.click(screen.getByText("Salvar Resultado"));

      await waitFor(() => {
        expect(
          screen.getByText(/Set com 7 games: placar deve ser 7-5 ou 7-6/)
        ).toBeInTheDocument();
      });
    });
  });
});
