/**
 * Testes do componente ModalRegistrarResultado
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { StatusPartida } from "@/types/chave";

// Mock do service
const mockRegistrarResultado = jest.fn();

jest.mock("@/services", () => ({
  getPartidaService: () => ({
    registrarResultado: mockRegistrarResultado,
  }),
}));

import { ModalRegistrarResultado } from "@/components/etapas/ModalRegistrarResultado/ModalRegistrarResultado";

const mockPartidaNova = {
  id: "partida-1",
  dupla1Id: "dupla-1",
  dupla1Nome: "João & Maria",
  dupla2Id: "dupla-2",
  dupla2Nome: "Pedro & Ana",
  status: StatusPartida.AGENDADA,
  placar: [],
  grupoId: "grupo-1",
  etapaId: "etapa-1",
};

const mockPartidaFinalizada = {
  id: "partida-2",
  dupla1Id: "dupla-1",
  dupla1Nome: "João & Maria",
  dupla2Id: "dupla-2",
  dupla2Nome: "Pedro & Ana",
  status: StatusPartida.FINALIZADA,
  placar: [
    {
      numero: 1,
      gamesDupla1: 6,
      gamesDupla2: 4,
      vencedorId: "dupla-1",
    },
  ],
  grupoId: "grupo-1",
  etapaId: "etapa-1",
};

describe("ModalRegistrarResultado", () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("renderização", () => {
    it("deve mostrar título 'Registrar Resultado' para partida nova", () => {
      render(
        <ModalRegistrarResultado
          partida={mockPartidaNova}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByText("Registrar Resultado")).toBeInTheDocument();
    });

    it("deve mostrar título 'Editar Resultado' para partida finalizada", () => {
      render(
        <ModalRegistrarResultado
          partida={mockPartidaFinalizada}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByText(/Editar Resultado/)).toBeInTheDocument();
    });

    it("deve mostrar nomes das duplas", () => {
      render(
        <ModalRegistrarResultado
          partida={mockPartidaNova}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      // Os nomes aparecem múltiplas vezes (no box de info e nos labels)
      expect(screen.getAllByText("João & Maria").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Pedro & Ana").length).toBeGreaterThan(0);
    });

    it("deve mostrar separador VS", () => {
      render(
        <ModalRegistrarResultado
          partida={mockPartidaNova}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByText("VS")).toBeInTheDocument();
    });

    it("deve mostrar seção de placar", () => {
      render(
        <ModalRegistrarResultado
          partida={mockPartidaNova}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByText("Placar")).toBeInTheDocument();
    });

    it("deve mostrar inputs de placar", () => {
      render(
        <ModalRegistrarResultado
          partida={mockPartidaNova}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      expect(inputs.length).toBe(2);
    });

    it("deve mostrar botões de ação", () => {
      render(
        <ModalRegistrarResultado
          partida={mockPartidaNova}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByText("Cancelar")).toBeInTheDocument();
      expect(screen.getByText("Salvar Resultado")).toBeInTheDocument();
    });

    it("deve mostrar dicas de placar válido", () => {
      render(
        <ModalRegistrarResultado
          partida={mockPartidaNova}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(
        screen.getByText(/Placares válidos:/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/6-0, 6-1, 6-2, 6-3, 6-4, 7-5, 7-6/)
      ).toBeInTheDocument();
    });
  });

  describe("edição de partida finalizada", () => {
    it("deve preencher placar existente", () => {
      render(
        <ModalRegistrarResultado
          partida={mockPartidaFinalizada}
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
        <ModalRegistrarResultado
          partida={mockPartidaFinalizada}
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
        <ModalRegistrarResultado
          partida={mockPartidaNova}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });

      expect(screen.getByText("Vencedor:")).toBeInTheDocument();
      // João & Maria deve aparecer como vencedor
      expect(screen.getByText("Placar: 6 x 4")).toBeInTheDocument();
    });

    it("deve identificar dupla2 como vencedora quando ela ganha", () => {
      render(
        <ModalRegistrarResultado
          partida={mockPartidaNova}
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
        <ModalRegistrarResultado
          partida={mockPartidaNova}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "5" } });
      fireEvent.change(inputs[1], { target: { value: "5" } });

      expect(screen.queryByText("Vencedor:")).not.toBeInTheDocument();
    });
  });

  describe("validação de placar", () => {
    // O botão "Salvar" está desabilitado quando não há vencedor,
    // então testamos indiretamente pelo estado desabilitado
    it("deve desabilitar botão quando placar vazio", () => {
      render(
        <ModalRegistrarResultado
          partida={mockPartidaNova}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const submitButton = screen.getByText("Salvar Resultado").closest("button");
      expect(submitButton).toBeDisabled();
    });

    it("deve desabilitar botão quando apenas dupla1 preenchida", () => {
      render(
        <ModalRegistrarResultado
          partida={mockPartidaNova}
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
        <ModalRegistrarResultado
          partida={mockPartidaNova}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[1], { target: { value: "6" } });

      const submitButton = screen.getByText("Salvar Resultado").closest("button");
      expect(submitButton).toBeDisabled();
    });

    it("deve desabilitar botão para placar empatado (ex: 6x6)", () => {
      render(
        <ModalRegistrarResultado
          partida={mockPartidaNova}
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
        <ModalRegistrarResultado
          partida={mockPartidaNova}
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
        <ModalRegistrarResultado
          partida={mockPartidaNova}
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

    it("deve mostrar erro para 7x4 (inválido)", async () => {
      render(
        <ModalRegistrarResultado
          partida={mockPartidaNova}
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
          screen.getByText(/Set com 7 games:/)
        ).toBeInTheDocument();
      });
    });

    it("deve mostrar erro para mais de 7 games", async () => {
      render(
        <ModalRegistrarResultado
          partida={mockPartidaNova}
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
      { dupla1: 6, dupla2: 1 },
      { dupla1: 6, dupla2: 2 },
      { dupla1: 6, dupla2: 3 },
      { dupla1: 6, dupla2: 4 },
      { dupla1: 7, dupla2: 5 },
      { dupla1: 7, dupla2: 6 },
      { dupla1: 0, dupla2: 6 },
      { dupla1: 5, dupla2: 7 },
    ];

    placaresValidos.forEach(({ dupla1, dupla2 }) => {
      it(`deve aceitar placar ${dupla1}x${dupla2}`, async () => {
        mockRegistrarResultado.mockResolvedValue(undefined);
        const alertMock = jest.spyOn(window, "alert").mockImplementation(() => {});

        render(
          <ModalRegistrarResultado
            partida={mockPartidaNova}
            onClose={mockOnClose}
            onSuccess={mockOnSuccess}
          />
        );

        const inputs = screen.getAllByRole("spinbutton");
        fireEvent.change(inputs[0], { target: { value: String(dupla1) } });
        fireEvent.change(inputs[1], { target: { value: String(dupla2) } });

        fireEvent.click(screen.getByText("Salvar Resultado"));

        await waitFor(() => {
          expect(mockRegistrarResultado).toHaveBeenCalled();
        });

        alertMock.mockRestore();
      });
    });
  });

  describe("submissão do formulário", () => {
    it("deve chamar registrarResultado com dados corretos", async () => {
      mockRegistrarResultado.mockResolvedValue(undefined);
      const alertMock = jest.spyOn(window, "alert").mockImplementation(() => {});

      render(
        <ModalRegistrarResultado
          partida={mockPartidaNova}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });

      fireEvent.click(screen.getByText("Salvar Resultado"));

      await waitFor(() => {
        expect(mockRegistrarResultado).toHaveBeenCalledWith(
          "partida-1",
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
      mockRegistrarResultado.mockResolvedValue(undefined);
      const alertMock = jest.spyOn(window, "alert").mockImplementation(() => {});

      render(
        <ModalRegistrarResultado
          partida={mockPartidaNova}
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
      mockRegistrarResultado.mockResolvedValue(undefined);
      const alertMock = jest.spyOn(window, "alert").mockImplementation(() => {});

      render(
        <ModalRegistrarResultado
          partida={mockPartidaNova}
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
      mockRegistrarResultado.mockResolvedValue(undefined);
      const alertMock = jest.spyOn(window, "alert").mockImplementation(() => {});

      render(
        <ModalRegistrarResultado
          partida={mockPartidaFinalizada}
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
      mockRegistrarResultado.mockRejectedValue(new Error("Erro de rede"));

      render(
        <ModalRegistrarResultado
          partida={mockPartidaNova}
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
        <ModalRegistrarResultado
          partida={mockPartidaNova}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      fireEvent.click(screen.getByText("Cancelar"));
      expect(mockOnClose).toHaveBeenCalled();
    });

    it("deve fechar modal ao clicar no X", () => {
      render(
        <ModalRegistrarResultado
          partida={mockPartidaNova}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      fireEvent.click(screen.getByText("✕"));
      expect(mockOnClose).toHaveBeenCalled();
    });

    it("deve fechar modal ao clicar no overlay", () => {
      const { container } = render(
        <ModalRegistrarResultado
          partida={mockPartidaNova}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      // O overlay é o segundo elemento filho do container principal
      const overlay = container.querySelector('[class*="OverlayBackground"]');
      if (overlay) {
        fireEvent.click(overlay);
        expect(mockOnClose).toHaveBeenCalled();
      }
    });

    it("deve desabilitar botão de salvar sem vencedor", () => {
      render(
        <ModalRegistrarResultado
          partida={mockPartidaNova}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const submitButton = screen.getByText("Salvar Resultado").closest("button");
      expect(submitButton).toBeDisabled();
    });

    it("deve habilitar botão de salvar com vencedor válido", () => {
      render(
        <ModalRegistrarResultado
          partida={mockPartidaNova}
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
      mockRegistrarResultado.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(
        <ModalRegistrarResultado
          partida={mockPartidaNova}
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
      mockRegistrarResultado.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(
        <ModalRegistrarResultado
          partida={mockPartidaNova}
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
});
