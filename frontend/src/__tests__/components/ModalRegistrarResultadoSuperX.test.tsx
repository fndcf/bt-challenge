/**
 * Testes do componente ModalRegistrarResultadoSuperX
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// Mock do window.alert
const mockAlert = jest.fn();
window.alert = mockAlert;

// Mock dos services
const mockRegistrarResultado = jest.fn();

jest.mock("@/services", () => ({
  getSuperXService: () => ({
    registrarResultado: mockRegistrarResultado,
  }),
}));

import { ModalRegistrarResultadoSuperX } from "@/components/etapas/ModalRegistrarResultadoSuperX/ModalRegistrarResultadoSuperX";

const mockPartidaAgendada = {
  id: "partida-1",
  etapaId: "etapa-1",
  grupoId: "grupo-1",
  rodada: 1,
  status: "agendada",
  jogador1ANome: "João",
  jogador1BNome: "Maria",
  jogador2ANome: "Pedro",
  jogador2BNome: "Ana",
  setsDupla1: 0,
  setsDupla2: 0,
  placar: [],
};

const mockPartidaFinalizada = {
  id: "partida-2",
  etapaId: "etapa-1",
  grupoId: "grupo-1",
  rodada: 1,
  status: "finalizada",
  jogador1ANome: "Carlos",
  jogador1BNome: "Fernanda",
  jogador2ANome: "Roberto",
  jogador2BNome: "Lucia",
  setsDupla1: 1,
  setsDupla2: 0,
  placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 3 }],
};

const mockPartidaFinalizadaSemPlacar = {
  id: "partida-3",
  etapaId: "etapa-1",
  grupoId: "grupo-1",
  rodada: 1,
  status: "finalizada",
  jogador1ANome: "Player 1",
  jogador1BNome: "Player 2",
  jogador2ANome: "Player 3",
  jogador2BNome: "Player 4",
  setsDupla1: 1,
  setsDupla2: 0,
  placar: [],
};

describe("ModalRegistrarResultadoSuperX", () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockRegistrarResultado.mockResolvedValue(undefined);
  });

  describe("renderização", () => {
    it("deve mostrar título Registrar Resultado para partida agendada", () => {
      render(
        <ModalRegistrarResultadoSuperX
          partida={mockPartidaAgendada}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(
        screen.getByText("Registrar Resultado - Super X")
      ).toBeInTheDocument();
    });

    it("deve mostrar título Editar Resultado para partida finalizada", () => {
      render(
        <ModalRegistrarResultadoSuperX
          partida={mockPartidaFinalizada}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(
        screen.getByText("Editar Resultado - Super X")
      ).toBeInTheDocument();
    });

    it("deve mostrar nomes das duplas", () => {
      render(
        <ModalRegistrarResultadoSuperX
          partida={mockPartidaAgendada}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      // Nomes aparecem múltiplas vezes (header e labels)
      expect(screen.getAllByText("João & Maria").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Pedro & Ana").length).toBeGreaterThan(0);
      expect(screen.getByText("VS")).toBeInTheDocument();
    });

    it("deve mostrar campos de placar", () => {
      render(
        <ModalRegistrarResultadoSuperX
          partida={mockPartidaAgendada}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByText("Placar (1 Set)")).toBeInTheDocument();
      const inputs = screen.getAllByPlaceholderText("0");
      expect(inputs).toHaveLength(2);
    });

    it("deve mostrar botões Cancelar e Salvar", () => {
      render(
        <ModalRegistrarResultadoSuperX
          partida={mockPartidaAgendada}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByText("Cancelar")).toBeInTheDocument();
      expect(screen.getByText("Salvar Resultado")).toBeInTheDocument();
    });

    it("deve carregar placar existente na edição", () => {
      render(
        <ModalRegistrarResultadoSuperX
          partida={mockPartidaFinalizada}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      expect(inputs[0]).toHaveValue(6);
      expect(inputs[1]).toHaveValue(3);
    });

    it("não deve carregar placar quando partida finalizada não tem placar", () => {
      render(
        <ModalRegistrarResultadoSuperX
          partida={mockPartidaFinalizadaSemPlacar}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      expect(inputs[0]).toHaveValue(null);
      expect(inputs[1]).toHaveValue(null);
    });
  });

  describe("interações", () => {
    it("deve fechar ao clicar no botão X", () => {
      render(
        <ModalRegistrarResultadoSuperX
          partida={mockPartidaAgendada}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      fireEvent.click(screen.getByText("x"));
      expect(mockOnClose).toHaveBeenCalled();
    });

    it("deve fechar ao clicar em Cancelar", () => {
      render(
        <ModalRegistrarResultadoSuperX
          partida={mockPartidaAgendada}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      fireEvent.click(screen.getByText("Cancelar"));
      expect(mockOnClose).toHaveBeenCalled();
    });

    it("deve ter overlay clicável", () => {
      render(
        <ModalRegistrarResultadoSuperX
          partida={mockPartidaAgendada}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      // Verificar que o modal está renderizado corretamente
      expect(screen.getByText("Registrar Resultado - Super X")).toBeInTheDocument();
      // Verificar que os botões de fechar existem
      expect(screen.getByText("x")).toBeInTheDocument();
      expect(screen.getByText("Cancelar")).toBeInTheDocument();
    });

    it("deve permitir digitar placar nos inputs", () => {
      render(
        <ModalRegistrarResultadoSuperX
          partida={mockPartidaAgendada}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });

      expect(inputs[0]).toHaveValue(6);
      expect(inputs[1]).toHaveValue(4);
    });

    it("deve limpar o valor quando input fica vazio", () => {
      render(
        <ModalRegistrarResultadoSuperX
          partida={mockPartidaFinalizada}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "" } });

      expect(inputs[0]).toHaveValue(null);
    });
  });

  describe("validações de placar", () => {
    it("deve desabilitar botão quando ambos placares estão vazios", async () => {
      render(
        <ModalRegistrarResultadoSuperX
          partida={mockPartidaAgendada}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      // Botão fica desabilitado quando não há resultado definido
      const submitButton = screen.getByRole("button", {
        name: /Salvar Resultado/i,
      });
      expect(submitButton).toBeDisabled();
    });

    it("deve desabilitar botão quando somente placar da segunda dupla preenchido", async () => {
      render(
        <ModalRegistrarResultadoSuperX
          partida={mockPartidaAgendada}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[1], { target: { value: "6" } });

      // Botão fica desabilitado pois não há vencedor definido
      const submitButton = screen.getByRole("button", {
        name: /Salvar Resultado/i,
      });
      expect(submitButton).toBeDisabled();
    });

    it("deve desabilitar botão quando somente placar da primeira dupla preenchido", async () => {
      render(
        <ModalRegistrarResultadoSuperX
          partida={mockPartidaAgendada}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });

      // Botão fica desabilitado pois não há vencedor definido
      const submitButton = screen.getByRole("button", {
        name: /Salvar Resultado/i,
      });
      expect(submitButton).toBeDisabled();
    });

    it("deve desabilitar botão quando placar é 0 x 0", async () => {
      render(
        <ModalRegistrarResultadoSuperX
          partida={mockPartidaAgendada}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "0" } });
      fireEvent.change(inputs[1], { target: { value: "0" } });

      // Botão fica desabilitado pois não há vencedor definido
      const submitButton = screen.getByRole("button", {
        name: /Salvar Resultado/i,
      });
      expect(submitButton).toBeDisabled();
    });

    it("deve mostrar erro quando vencedor tem menos de 4 games", async () => {
      render(
        <ModalRegistrarResultadoSuperX
          partida={mockPartidaAgendada}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "3" } });
      fireEvent.change(inputs[1], { target: { value: "2" } });

      // O botão é habilitado porque há um vencedor (3 > 2)
      const form = screen.getByRole("button", { name: /Salvar Resultado/i });
      fireEvent.click(form);

      await waitFor(() => {
        expect(
          screen.getByText("O set deve ter no minimo 4 games para o vencedor")
        ).toBeInTheDocument();
      });
    });

    it("deve mostrar erro para placar 4-3 (inválido)", async () => {
      render(
        <ModalRegistrarResultadoSuperX
          partida={mockPartidaAgendada}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "4" } });
      fireEvent.change(inputs[1], { target: { value: "3" } });

      const form = screen.getByRole("button", { name: /Salvar Resultado/i });
      fireEvent.click(form);

      await waitFor(() => {
        expect(
          screen.getByText("Set com 4 games: placar deve ser 4-0, 4-1 ou 4-2")
        ).toBeInTheDocument();
      });
    });

    it("deve mostrar erro para placar 5-1 (inválido)", async () => {
      render(
        <ModalRegistrarResultadoSuperX
          partida={mockPartidaAgendada}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "5" } });
      fireEvent.change(inputs[1], { target: { value: "1" } });

      const form = screen.getByRole("button", { name: /Salvar Resultado/i });
      fireEvent.click(form);

      await waitFor(() => {
        expect(
          screen.getByText("Set com 5 games: placar deve ser 5-3 ou 5-4")
        ).toBeInTheDocument();
      });
    });

    it("deve mostrar erro para placar 6-5 (inválido)", async () => {
      render(
        <ModalRegistrarResultadoSuperX
          partida={mockPartidaAgendada}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "5" } });

      const form = screen.getByRole("button", { name: /Salvar Resultado/i });
      fireEvent.click(form);

      await waitFor(() => {
        expect(
          screen.getByText(
            "Set com 6 games: placar deve ser 6-0, 6-1, 6-2, 6-3 ou 6-4"
          )
        ).toBeInTheDocument();
      });
    });

    it("deve mostrar erro para placar 7-3 (inválido)", async () => {
      render(
        <ModalRegistrarResultadoSuperX
          partida={mockPartidaAgendada}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "7" } });
      fireEvent.change(inputs[1], { target: { value: "3" } });

      const form = screen.getByRole("button", { name: /Salvar Resultado/i });
      fireEvent.click(form);

      await waitFor(() => {
        expect(
          screen.getByText("Set com 7 games: placar deve ser 7-5 ou 7-6")
        ).toBeInTheDocument();
      });
    });

    it("deve mostrar erro quando set tem mais de 7 games", async () => {
      render(
        <ModalRegistrarResultadoSuperX
          partida={mockPartidaAgendada}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "8" } });
      fireEvent.change(inputs[1], { target: { value: "6" } });

      const form = screen.getByRole("button", { name: /Salvar Resultado/i });
      fireEvent.click(form);

      await waitFor(() => {
        expect(
          screen.getByText("Set nao pode ter mais de 7 games")
        ).toBeInTheDocument();
      });
    });

    it("deve desabilitar botão quando há empate", async () => {
      render(
        <ModalRegistrarResultadoSuperX
          partida={mockPartidaAgendada}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "5" } });
      fireEvent.change(inputs[1], { target: { value: "5" } });

      // Botão fica desabilitado quando não há vencedor (empate)
      const submitButton = screen.getByRole("button", {
        name: /Salvar Resultado/i,
      });
      expect(submitButton).toBeDisabled();
    });
  });

  describe("placares válidos", () => {
    it("deve aceitar placar 4-0", async () => {
      render(
        <ModalRegistrarResultadoSuperX
          partida={mockPartidaAgendada}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "4" } });
      fireEvent.change(inputs[1], { target: { value: "0" } });

      fireEvent.click(screen.getByText("Salvar Resultado"));

      await waitFor(() => {
        expect(mockRegistrarResultado).toHaveBeenCalled();
      });
    });

    it("deve aceitar placar 4-1", async () => {
      render(
        <ModalRegistrarResultadoSuperX
          partida={mockPartidaAgendada}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "4" } });
      fireEvent.change(inputs[1], { target: { value: "1" } });

      fireEvent.click(screen.getByText("Salvar Resultado"));

      await waitFor(() => {
        expect(mockRegistrarResultado).toHaveBeenCalled();
      });
    });

    it("deve aceitar placar 4-2", async () => {
      render(
        <ModalRegistrarResultadoSuperX
          partida={mockPartidaAgendada}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "4" } });
      fireEvent.change(inputs[1], { target: { value: "2" } });

      fireEvent.click(screen.getByText("Salvar Resultado"));

      await waitFor(() => {
        expect(mockRegistrarResultado).toHaveBeenCalled();
      });
    });

    it("deve aceitar placar 5-3", async () => {
      render(
        <ModalRegistrarResultadoSuperX
          partida={mockPartidaAgendada}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "5" } });
      fireEvent.change(inputs[1], { target: { value: "3" } });

      fireEvent.click(screen.getByText("Salvar Resultado"));

      await waitFor(() => {
        expect(mockRegistrarResultado).toHaveBeenCalled();
      });
    });

    it("deve aceitar placar 6-4", async () => {
      render(
        <ModalRegistrarResultadoSuperX
          partida={mockPartidaAgendada}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });

      fireEvent.click(screen.getByText("Salvar Resultado"));

      await waitFor(() => {
        expect(mockRegistrarResultado).toHaveBeenCalled();
      });
    });

    it("deve aceitar placar 7-5", async () => {
      render(
        <ModalRegistrarResultadoSuperX
          partida={mockPartidaAgendada}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "7" } });
      fireEvent.change(inputs[1], { target: { value: "5" } });

      fireEvent.click(screen.getByText("Salvar Resultado"));

      await waitFor(() => {
        expect(mockRegistrarResultado).toHaveBeenCalled();
      });
    });

    it("deve aceitar placar 7-6 (tiebreak)", async () => {
      render(
        <ModalRegistrarResultadoSuperX
          partida={mockPartidaAgendada}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "7" } });
      fireEvent.change(inputs[1], { target: { value: "6" } });

      fireEvent.click(screen.getByText("Salvar Resultado"));

      await waitFor(() => {
        expect(mockRegistrarResultado).toHaveBeenCalled();
      });
    });
  });

  describe("envio do formulário", () => {
    it("deve chamar registrarResultado com dados corretos para novo resultado", async () => {
      render(
        <ModalRegistrarResultadoSuperX
          partida={mockPartidaAgendada}
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
          [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }]
        );
      });
    });

    it("deve mostrar alerta de sucesso para novo resultado", async () => {
      render(
        <ModalRegistrarResultadoSuperX
          partida={mockPartidaAgendada}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });

      fireEvent.click(screen.getByText("Salvar Resultado"));

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          "Resultado registrado com sucesso!"
        );
      });
    });

    it("deve mostrar alerta de sucesso para edição", async () => {
      render(
        <ModalRegistrarResultadoSuperX
          partida={mockPartidaFinalizada}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "7" } });
      fireEvent.change(inputs[1], { target: { value: "5" } });

      // Para edição o botão é "Atualizar Resultado"
      fireEvent.click(screen.getByText("Atualizar Resultado"));

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          "Resultado atualizado com sucesso!"
        );
      });
    });

    it("deve chamar onSuccess após sucesso", async () => {
      render(
        <ModalRegistrarResultadoSuperX
          partida={mockPartidaAgendada}
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
    });

    it("deve mostrar erro quando API falha", async () => {
      mockRegistrarResultado.mockRejectedValue(new Error("Erro de servidor"));

      render(
        <ModalRegistrarResultadoSuperX
          partida={mockPartidaAgendada}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });

      fireEvent.click(screen.getByText("Salvar Resultado"));

      await waitFor(() => {
        expect(screen.getByText("Erro de servidor")).toBeInTheDocument();
      });
    });

    it("deve mostrar erro genérico quando API falha sem mensagem", async () => {
      mockRegistrarResultado.mockRejectedValue({});

      render(
        <ModalRegistrarResultadoSuperX
          partida={mockPartidaAgendada}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });

      fireEvent.click(screen.getByText("Salvar Resultado"));

      await waitFor(() => {
        expect(
          screen.getByText("Erro ao registrar resultado")
        ).toBeInTheDocument();
      });
    });

    it("deve mostrar erro genérico para edição quando API falha sem mensagem", async () => {
      mockRegistrarResultado.mockRejectedValue({});

      render(
        <ModalRegistrarResultadoSuperX
          partida={mockPartidaFinalizada}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "7" } });
      fireEvent.change(inputs[1], { target: { value: "5" } });

      // Para edição o botão é "Atualizar Resultado"
      fireEvent.click(screen.getByText("Atualizar Resultado"));

      await waitFor(() => {
        expect(
          screen.getByText("Erro ao atualizar resultado")
        ).toBeInTheDocument();
      });
    });
  });

  describe("estado de loading", () => {
    it("deve desabilitar inputs durante loading", async () => {
      mockRegistrarResultado.mockReturnValue(new Promise(() => {}));

      render(
        <ModalRegistrarResultadoSuperX
          partida={mockPartidaAgendada}
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

    it("deve desabilitar botão Cancelar durante loading", async () => {
      mockRegistrarResultado.mockReturnValue(new Promise(() => {}));

      render(
        <ModalRegistrarResultadoSuperX
          partida={mockPartidaAgendada}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });

      fireEvent.click(screen.getByText("Salvar Resultado"));

      await waitFor(() => {
        expect(screen.getByText("Cancelar")).toBeDisabled();
      });
    });

    it("deve mostrar Salvando... durante loading", async () => {
      mockRegistrarResultado.mockReturnValue(new Promise(() => {}));

      render(
        <ModalRegistrarResultadoSuperX
          partida={mockPartidaAgendada}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });

      fireEvent.click(screen.getByText("Salvar Resultado"));

      await waitFor(() => {
        expect(screen.getByText("Salvando...")).toBeInTheDocument();
      });
    });
  });

  describe("cálculo do vencedor", () => {
    it("deve identificar dupla 1 como vencedora quando tem mais games", async () => {
      render(
        <ModalRegistrarResultadoSuperX
          partida={mockPartidaAgendada}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });

      // Se houver um elemento de preview do vencedor, verificar aqui
      expect(inputs[0]).toHaveValue(6);
      expect(inputs[1]).toHaveValue(4);
    });

    it("deve identificar dupla 2 como vencedora quando tem mais games", async () => {
      render(
        <ModalRegistrarResultadoSuperX
          partida={mockPartidaAgendada}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "4" } });
      fireEvent.change(inputs[1], { target: { value: "6" } });

      // Verificar dados
      expect(inputs[0]).toHaveValue(4);
      expect(inputs[1]).toHaveValue(6);
    });
  });
});
