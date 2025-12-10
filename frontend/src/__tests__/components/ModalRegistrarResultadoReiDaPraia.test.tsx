/**
 * Testes do componente ModalRegistrarResultadoReiDaPraia
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// Mock do service
const mockRegistrarResultado = jest.fn();

jest.mock("@/services", () => ({
  getReiDaPraiaService: () => ({
    registrarResultado: mockRegistrarResultado,
  }),
}));

import { ModalRegistrarResultadoReiDaPraia } from "@/components/etapas/ModalRegistrarResultadoReiDaPraia/ModalRegistrarResultadoReiDaPraia";

const mockPartidaNova = {
  id: "partida-1",
  etapaId: "etapa-1",
  grupoId: "grupo-1",
  jogador1ANome: "João",
  jogador1BNome: "Maria",
  jogador2ANome: "Pedro",
  jogador2BNome: "Ana",
  status: "agendada",
  placar: [],
  setsDupla1: 0,
  setsDupla2: 0,
};

const mockPartidaFinalizada = {
  id: "partida-2",
  etapaId: "etapa-1",
  grupoId: "grupo-1",
  jogador1ANome: "João",
  jogador1BNome: "Maria",
  jogador2ANome: "Pedro",
  jogador2BNome: "Ana",
  status: "finalizada",
  placar: [
    {
      numero: 1,
      gamesDupla1: 6,
      gamesDupla2: 4,
    },
  ],
  setsDupla1: 1,
  setsDupla2: 0,
};

describe("ModalRegistrarResultadoReiDaPraia", () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("renderização", () => {
    it("deve mostrar título 'Registrar Resultado' para partida nova", () => {
      render(
        <ModalRegistrarResultadoReiDaPraia
          partida={mockPartidaNova}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByText("Registrar Resultado")).toBeInTheDocument();
    });

    it("deve mostrar título 'Editar Resultado' para partida finalizada", () => {
      render(
        <ModalRegistrarResultadoReiDaPraia
          partida={mockPartidaFinalizada}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByText(/Editar Resultado/)).toBeInTheDocument();
    });

    it("deve mostrar nomes das duplas", () => {
      render(
        <ModalRegistrarResultadoReiDaPraia
          partida={mockPartidaNova}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      // A dupla aparece múltiplas vezes (no box de info e nos labels)
      expect(screen.getAllByText("João & Maria").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Pedro & Ana").length).toBeGreaterThan(0);
    });

    it("deve mostrar separador VS", () => {
      render(
        <ModalRegistrarResultadoReiDaPraia
          partida={mockPartidaNova}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByText("VS")).toBeInTheDocument();
    });

    it("deve mostrar seção de placar", () => {
      render(
        <ModalRegistrarResultadoReiDaPraia
          partida={mockPartidaNova}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByText("Placar")).toBeInTheDocument();
    });

    it("deve mostrar inputs de placar", () => {
      render(
        <ModalRegistrarResultadoReiDaPraia
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
        <ModalRegistrarResultadoReiDaPraia
          partida={mockPartidaNova}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByText("Cancelar")).toBeInTheDocument();
      expect(screen.getByText("Salvar Resultado")).toBeInTheDocument();
    });

    it("deve ter formulário de placar estruturado", () => {
      render(
        <ModalRegistrarResultadoReiDaPraia
          partida={mockPartidaNova}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      // Verificar estrutura básica do formulário
      expect(screen.getByText("Placar")).toBeInTheDocument();
      const inputs = screen.getAllByRole("spinbutton");
      expect(inputs.length).toBe(2);
    });
  });

  describe("edição de partida finalizada", () => {
    it("deve preencher placar existente", () => {
      render(
        <ModalRegistrarResultadoReiDaPraia
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
        <ModalRegistrarResultadoReiDaPraia
          partida={mockPartidaFinalizada}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByText("Atualizar Resultado")).toBeInTheDocument();
    });
  });

  describe("cálculo de vencedor", () => {
    it("deve habilitar botão quando placar válido (dupla1 vence)", () => {
      render(
        <ModalRegistrarResultadoReiDaPraia
          partida={mockPartidaNova}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });

      // Botão deve estar habilitado quando há vencedor válido
      const submitButton = screen.getByText("Salvar Resultado").closest("button");
      expect(submitButton).not.toBeDisabled();
    });

    it("deve habilitar botão quando dupla2 vence", () => {
      render(
        <ModalRegistrarResultadoReiDaPraia
          partida={mockPartidaNova}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "3" } });
      fireEvent.change(inputs[1], { target: { value: "6" } });

      // Botão deve estar habilitado quando há vencedor válido
      const submitButton = screen.getByText("Salvar Resultado").closest("button");
      expect(submitButton).not.toBeDisabled();
    });

    it("não deve habilitar botão quando placar empatado", () => {
      render(
        <ModalRegistrarResultadoReiDaPraia
          partida={mockPartidaNova}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "5" } });
      fireEvent.change(inputs[1], { target: { value: "5" } });

      // Botão deve estar desabilitado para placar empatado
      const submitButton = screen.getByText("Salvar Resultado").closest("button");
      expect(submitButton).toBeDisabled();
    });
  });

  describe("validação de placar", () => {
    it("deve desabilitar botão quando placar vazio", () => {
      render(
        <ModalRegistrarResultadoReiDaPraia
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
        <ModalRegistrarResultadoReiDaPraia
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

    it("deve desabilitar botão para placar empatado", () => {
      render(
        <ModalRegistrarResultadoReiDaPraia
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

    it("deve mostrar erro para set com menos de 4 games para vencedor", async () => {
      render(
        <ModalRegistrarResultadoReiDaPraia
          partida={mockPartidaNova}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "3" } });
      fireEvent.change(inputs[1], { target: { value: "2" } });

      fireEvent.click(screen.getByText("Salvar Resultado"));

      await waitFor(() => {
        expect(
          screen.getByText(/O set deve ter no mínimo 4 games para o vencedor/)
        ).toBeInTheDocument();
      });
    });

    it("deve mostrar erro para 6x5 (inválido)", async () => {
      render(
        <ModalRegistrarResultadoReiDaPraia
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
        expect(screen.getByText(/Set com 6 games:/)).toBeInTheDocument();
      });
    });

    it("deve mostrar erro para mais de 7 games", async () => {
      render(
        <ModalRegistrarResultadoReiDaPraia
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
      { dupla1: 6, dupla2: 4 },
      { dupla1: 7, dupla2: 5 },
      { dupla1: 7, dupla2: 6 },
      { dupla1: 0, dupla2: 6 },
    ];

    placaresValidos.forEach(({ dupla1, dupla2 }) => {
      it(`deve aceitar placar ${dupla1}x${dupla2}`, async () => {
        mockRegistrarResultado.mockResolvedValue(undefined);
        const alertMock = jest.spyOn(window, "alert").mockImplementation(() => {});

        render(
          <ModalRegistrarResultadoReiDaPraia
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
        <ModalRegistrarResultadoReiDaPraia
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
          "etapa-1",
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
        <ModalRegistrarResultadoReiDaPraia
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
        <ModalRegistrarResultadoReiDaPraia
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
        <ModalRegistrarResultadoReiDaPraia
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
        <ModalRegistrarResultadoReiDaPraia
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
        <ModalRegistrarResultadoReiDaPraia
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
        <ModalRegistrarResultadoReiDaPraia
          partida={mockPartidaNova}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      fireEvent.click(screen.getByText("✕"));
      expect(mockOnClose).toHaveBeenCalled();
    });

    it("deve habilitar botão de salvar com vencedor válido", () => {
      render(
        <ModalRegistrarResultadoReiDaPraia
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
        <ModalRegistrarResultadoReiDaPraia
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
        <ModalRegistrarResultadoReiDaPraia
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

  describe("validações de placar adicionais", () => {
    it("deve desabilitar botão quando placar não preenchido", () => {
      render(
        <ModalRegistrarResultadoReiDaPraia
          partida={mockPartidaNova}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const submitButton = screen.getByText("Salvar Resultado").closest("button");
      expect(submitButton).toBeDisabled();
    });

    it("deve desabilitar botão para placar empatado", () => {
      render(
        <ModalRegistrarResultadoReiDaPraia
          partida={mockPartidaNova}
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
        <ModalRegistrarResultadoReiDaPraia
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
          screen.getByText(/Set com 7 games: placar deve ser 7-5 ou 7-6/)
        ).toBeInTheDocument();
      });
    });
  });
});
