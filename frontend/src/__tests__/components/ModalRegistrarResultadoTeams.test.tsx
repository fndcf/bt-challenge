/**
 * Testes do componente ModalRegistrarResultadoTeams
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// Mock do service
const mockRegistrarResultado = jest.fn();

jest.mock("@/services", () => ({
  getTeamsService: () => ({
    registrarResultado: mockRegistrarResultado,
  }),
}));

import { ModalRegistrarResultadoTeams } from "@/components/etapas/ModalRegistrarResultadoTeams/ModalRegistrarResultadoTeams";
import { StatusPartidaTeams } from "@/types/teams";

// Dados de teste
const criarPartidaMock = (overrides = {}) => ({
  id: "partida-1",
  confrontoId: "confronto-1",
  etapaId: "etapa-1",
  arenaId: "arena-1",
  equipe1Id: "equipe-1",
  equipe1Nome: "Equipe Alpha",
  equipe2Id: "equipe-2",
  equipe2Nome: "Equipe Beta",
  tipoJogo: "feminino",
  ordem: 1,
  status: StatusPartidaTeams.PENDENTE,
  placar: [],
  dupla1: [
    { id: "jog-1", nome: "Maria" },
    { id: "jog-2", nome: "Ana" },
  ],
  dupla2: [
    { id: "jog-3", nome: "Julia" },
    { id: "jog-4", nome: "Carla" },
  ],
  ...overrides,
});

describe("ModalRegistrarResultadoTeams", () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(window, "alert").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("renderização básica", () => {
    it("deve renderizar modal com título Registrar Resultado para partida pendente", () => {
      render(
        <ModalRegistrarResultadoTeams
          etapaId="etapa-1"
          partida={criarPartidaMock()}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByText("Registrar Resultado")).toBeInTheDocument();
    });

    it("deve renderizar modal com título Editar Resultado para partida finalizada", () => {
      const partidaFinalizada = criarPartidaMock({
        status: StatusPartidaTeams.FINALIZADA,
        placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }],
      });

      render(
        <ModalRegistrarResultadoTeams
          etapaId="etapa-1"
          partida={partidaFinalizada}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByText("Editar Resultado")).toBeInTheDocument();
    });

    it("deve mostrar nomes das duplas", () => {
      render(
        <ModalRegistrarResultadoTeams
          etapaId="etapa-1"
          partida={criarPartidaMock()}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      // Os nomes aparecem múltiplas vezes (no box e nos labels dos inputs)
      expect(screen.getAllByText(/Maria & Ana/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Julia & Carla/).length).toBeGreaterThan(0);
    });

    it("deve mostrar nomes das equipes", () => {
      render(
        <ModalRegistrarResultadoTeams
          etapaId="etapa-1"
          partida={criarPartidaMock()}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByText("Equipe Alpha")).toBeInTheDocument();
      expect(screen.getByText("Equipe Beta")).toBeInTheDocument();
    });

    it("deve mostrar separador VS", () => {
      render(
        <ModalRegistrarResultadoTeams
          etapaId="etapa-1"
          partida={criarPartidaMock()}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByText("VS")).toBeInTheDocument();
    });

    it("deve mostrar campos de placar vazios inicialmente", () => {
      render(
        <ModalRegistrarResultadoTeams
          etapaId="etapa-1"
          partida={criarPartidaMock()}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      expect(inputs).toHaveLength(2);
      expect(inputs[0]).toHaveValue(null);
      expect(inputs[1]).toHaveValue(null);
    });

    it("deve carregar placar existente para partida finalizada", () => {
      const partidaFinalizada = criarPartidaMock({
        status: StatusPartidaTeams.FINALIZADA,
        placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }],
      });

      render(
        <ModalRegistrarResultadoTeams
          etapaId="etapa-1"
          partida={partidaFinalizada}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      expect(inputs[0]).toHaveValue(6);
      expect(inputs[1]).toHaveValue(4);
    });
  });

  describe("interações", () => {
    it("deve chamar onClose ao clicar no botão X", () => {
      render(
        <ModalRegistrarResultadoTeams
          etapaId="etapa-1"
          partida={criarPartidaMock()}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      fireEvent.click(screen.getByText("✕"));
      expect(mockOnClose).toHaveBeenCalled();
    });

    it("deve chamar onClose ao clicar no botão Cancelar", () => {
      render(
        <ModalRegistrarResultadoTeams
          etapaId="etapa-1"
          partida={criarPartidaMock()}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      fireEvent.click(screen.getByText("Cancelar"));
      expect(mockOnClose).toHaveBeenCalled();
    });

    it("deve chamar onClose ao clicar no overlay", () => {
      const { container } = render(
        <ModalRegistrarResultadoTeams
          etapaId="etapa-1"
          partida={criarPartidaMock()}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      // Encontrar o overlay background
      const overlay = container.querySelector('[class*="OverlayBackground"]');
      if (overlay) {
        fireEvent.click(overlay);
        expect(mockOnClose).toHaveBeenCalled();
      }
    });

    it("deve atualizar valor do input de placar ao digitar", () => {
      render(
        <ModalRegistrarResultadoTeams
          etapaId="etapa-1"
          partida={criarPartidaMock()}
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

    it("deve limpar valor do input quando apagado", () => {
      render(
        <ModalRegistrarResultadoTeams
          etapaId="etapa-1"
          partida={criarPartidaMock()}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[0], { target: { value: "" } });

      expect(inputs[0]).toHaveValue(null);
    });
  });

  describe("validações de placar", () => {
    it("deve mostrar erro quando ambos placares estão vazios", async () => {
      render(
        <ModalRegistrarResultadoTeams
          etapaId="etapa-1"
          partida={criarPartidaMock()}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      // O botão está desabilitado quando não há vencedor, então submetemos o form diretamente
      const form = document.querySelector("form");
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(screen.getByText("O placar deve ser preenchido")).toBeInTheDocument();
      });
    });

    it("deve mostrar erro quando apenas primeiro placar está vazio", async () => {
      render(
        <ModalRegistrarResultadoTeams
          etapaId="etapa-1"
          partida={criarPartidaMock()}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[1], { target: { value: "4" } });
      // O botão está desabilitado quando não há vencedor, então submetemos o form diretamente
      const form = document.querySelector("form");
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(screen.getByText("Preencha o placar da primeira dupla")).toBeInTheDocument();
      });
    });

    it("deve mostrar erro quando apenas segundo placar está vazio", async () => {
      render(
        <ModalRegistrarResultadoTeams
          etapaId="etapa-1"
          partida={criarPartidaMock()}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      // O botão está desabilitado quando não há vencedor, então submetemos o form diretamente
      const form = document.querySelector("form");
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(screen.getByText("Preencha o placar da segunda dupla")).toBeInTheDocument();
      });
    });

    it("deve mostrar erro quando placar é 0 x 0", async () => {
      render(
        <ModalRegistrarResultadoTeams
          etapaId="etapa-1"
          partida={criarPartidaMock()}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "0" } });
      fireEvent.change(inputs[1], { target: { value: "0" } });
      // O botão está desabilitado quando não há vencedor, então submetemos o form diretamente
      const form = document.querySelector("form");
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(screen.getByText("O placar nao pode ser 0 x 0")).toBeInTheDocument();
      });
    });

    it("deve mostrar erro quando vencedor tem menos de 4 games", async () => {
      render(
        <ModalRegistrarResultadoTeams
          etapaId="etapa-1"
          partida={criarPartidaMock()}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "3" } });
      fireEvent.change(inputs[1], { target: { value: "2" } });
      fireEvent.click(screen.getByText("Salvar Resultado"));

      await waitFor(() => {
        expect(screen.getByText("O set deve ter no minimo 4 games para o vencedor")).toBeInTheDocument();
      });
    });

    it("deve mostrar erro para placar 4-3", async () => {
      render(
        <ModalRegistrarResultadoTeams
          etapaId="etapa-1"
          partida={criarPartidaMock()}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "4" } });
      fireEvent.change(inputs[1], { target: { value: "3" } });
      fireEvent.click(screen.getByText("Salvar Resultado"));

      await waitFor(() => {
        expect(screen.getByText("Set com 4 games: placar deve ser 4-0, 4-1 ou 4-2")).toBeInTheDocument();
      });
    });

    it("deve mostrar erro para placar 5-2", async () => {
      render(
        <ModalRegistrarResultadoTeams
          etapaId="etapa-1"
          partida={criarPartidaMock()}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "5" } });
      fireEvent.change(inputs[1], { target: { value: "2" } });
      fireEvent.click(screen.getByText("Salvar Resultado"));

      await waitFor(() => {
        expect(screen.getByText("Set com 5 games: placar deve ser 5-3 ou 5-4")).toBeInTheDocument();
      });
    });

    it("deve mostrar erro para placar 6-5", async () => {
      render(
        <ModalRegistrarResultadoTeams
          etapaId="etapa-1"
          partida={criarPartidaMock()}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "5" } });
      fireEvent.click(screen.getByText("Salvar Resultado"));

      await waitFor(() => {
        expect(screen.getByText("Set com 6 games: placar deve ser 6-0, 6-1, 6-2, 6-3 ou 6-4")).toBeInTheDocument();
      });
    });

    it("deve mostrar erro para placar 7-4", async () => {
      render(
        <ModalRegistrarResultadoTeams
          etapaId="etapa-1"
          partida={criarPartidaMock()}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "7" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });
      fireEvent.click(screen.getByText("Salvar Resultado"));

      await waitFor(() => {
        expect(screen.getByText("Set com 7 games: placar deve ser 7-5 ou 7-6")).toBeInTheDocument();
      });
    });

    it("deve mostrar erro para placar com mais de 7 games", async () => {
      render(
        <ModalRegistrarResultadoTeams
          etapaId="etapa-1"
          partida={criarPartidaMock()}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "8" } });
      fireEvent.change(inputs[1], { target: { value: "6" } });
      fireEvent.click(screen.getByText("Salvar Resultado"));

      await waitFor(() => {
        expect(screen.getByText("Set nao pode ter mais de 7 games")).toBeInTheDocument();
      });
    });

    it("deve mostrar erro para empate (sem vencedor)", async () => {
      render(
        <ModalRegistrarResultadoTeams
          etapaId="etapa-1"
          partida={criarPartidaMock()}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      // Usar 7x7 pois 6x6 cai na validação de "Set com 6 games" antes
      fireEvent.change(inputs[0], { target: { value: "7" } });
      fireEvent.change(inputs[1], { target: { value: "7" } });
      // O botão está desabilitado quando não há vencedor, então submetemos o form diretamente
      const form = document.querySelector("form");
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(screen.getByText("Nao ha um vencedor definido")).toBeInTheDocument();
      });
    });
  });

  describe("placares válidos", () => {
    it("deve aceitar placar 4-0", async () => {
      mockRegistrarResultado.mockResolvedValue({});

      render(
        <ModalRegistrarResultadoTeams
          etapaId="etapa-1"
          partida={criarPartidaMock()}
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
      mockRegistrarResultado.mockResolvedValue({});

      render(
        <ModalRegistrarResultadoTeams
          etapaId="etapa-1"
          partida={criarPartidaMock()}
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
      mockRegistrarResultado.mockResolvedValue({});

      render(
        <ModalRegistrarResultadoTeams
          etapaId="etapa-1"
          partida={criarPartidaMock()}
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
      mockRegistrarResultado.mockResolvedValue({});

      render(
        <ModalRegistrarResultadoTeams
          etapaId="etapa-1"
          partida={criarPartidaMock()}
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

    it("deve aceitar placar 5-4", async () => {
      mockRegistrarResultado.mockResolvedValue({});

      render(
        <ModalRegistrarResultadoTeams
          etapaId="etapa-1"
          partida={criarPartidaMock()}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "5" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });
      fireEvent.click(screen.getByText("Salvar Resultado"));

      await waitFor(() => {
        expect(mockRegistrarResultado).toHaveBeenCalled();
      });
    });

    it("deve aceitar placar 6-4", async () => {
      mockRegistrarResultado.mockResolvedValue({});

      render(
        <ModalRegistrarResultadoTeams
          etapaId="etapa-1"
          partida={criarPartidaMock()}
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
      mockRegistrarResultado.mockResolvedValue({});

      render(
        <ModalRegistrarResultadoTeams
          etapaId="etapa-1"
          partida={criarPartidaMock()}
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
      mockRegistrarResultado.mockResolvedValue({});

      render(
        <ModalRegistrarResultadoTeams
          etapaId="etapa-1"
          partida={criarPartidaMock()}
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

  describe("submissão do formulário", () => {
    it("deve chamar registrarResultado com dados corretos", async () => {
      mockRegistrarResultado.mockResolvedValue({});

      render(
        <ModalRegistrarResultadoTeams
          etapaId="etapa-1"
          partida={criarPartidaMock()}
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

    it("deve mostrar alerta de sucesso e chamar onSuccess", async () => {
      mockRegistrarResultado.mockResolvedValue({});
      const alertMock = jest.spyOn(window, "alert").mockImplementation(() => {});

      render(
        <ModalRegistrarResultadoTeams
          etapaId="etapa-1"
          partida={criarPartidaMock()}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });
      fireEvent.click(screen.getByText("Salvar Resultado"));

      await waitFor(() => {
        expect(alertMock).toHaveBeenCalledWith("Resultado registrado com sucesso!");
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it("deve mostrar alerta de atualização para edição", async () => {
      mockRegistrarResultado.mockResolvedValue({});
      const alertMock = jest.spyOn(window, "alert").mockImplementation(() => {});

      const partidaFinalizada = criarPartidaMock({
        status: StatusPartidaTeams.FINALIZADA,
        placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }],
      });

      render(
        <ModalRegistrarResultadoTeams
          etapaId="etapa-1"
          partida={partidaFinalizada}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      fireEvent.click(screen.getByText("Atualizar Resultado"));

      await waitFor(() => {
        expect(alertMock).toHaveBeenCalledWith("Resultado atualizado com sucesso!");
      });
    });

    it("deve mostrar erro quando service falha", async () => {
      mockRegistrarResultado.mockRejectedValue(new Error("Erro de rede"));

      render(
        <ModalRegistrarResultadoTeams
          etapaId="etapa-1"
          partida={criarPartidaMock()}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });
      fireEvent.click(screen.getByText("Salvar Resultado"));

      await waitFor(() => {
        expect(screen.getByText("Erro de rede")).toBeInTheDocument();
      });
    });

    it("deve mostrar erro genérico quando service falha sem mensagem", async () => {
      mockRegistrarResultado.mockRejectedValue({});

      render(
        <ModalRegistrarResultadoTeams
          etapaId="etapa-1"
          partida={criarPartidaMock()}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });
      fireEvent.click(screen.getByText("Salvar Resultado"));

      await waitFor(() => {
        expect(screen.getByText("Erro ao registrar resultado")).toBeInTheDocument();
      });
    });

    it("deve desabilitar botões durante loading", async () => {
      mockRegistrarResultado.mockImplementation(() => new Promise(() => {}));

      render(
        <ModalRegistrarResultadoTeams
          etapaId="etapa-1"
          partida={criarPartidaMock()}
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
        expect(screen.getByText("Salvando...")).toBeInTheDocument();
      });
    });

    it("deve mostrar Atualizando... durante loading de edição", async () => {
      mockRegistrarResultado.mockImplementation(() => new Promise(() => {}));

      const partidaFinalizada = criarPartidaMock({
        status: StatusPartidaTeams.FINALIZADA,
        placar: [{ numero: 1, gamesDupla1: 6, gamesDupla2: 4 }],
      });

      render(
        <ModalRegistrarResultadoTeams
          etapaId="etapa-1"
          partida={partidaFinalizada}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      fireEvent.click(screen.getByText("Atualizar Resultado"));

      await waitFor(() => {
        expect(screen.getByText("Atualizando...")).toBeInTheDocument();
      });
    });

    it("deve desabilitar inputs durante loading", async () => {
      mockRegistrarResultado.mockImplementation(() => new Promise(() => {}));

      render(
        <ModalRegistrarResultadoTeams
          etapaId="etapa-1"
          partida={criarPartidaMock()}
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

  describe("cálculo do vencedor", () => {
    it("deve habilitar botão de salvar quando dupla1 vence", async () => {
      mockRegistrarResultado.mockResolvedValue({});

      render(
        <ModalRegistrarResultadoTeams
          etapaId="etapa-1"
          partida={criarPartidaMock()}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });

      // Botão de salvar deve estar habilitado quando há vencedor
      const salvarButton = screen.getByRole("button", { name: /salvar resultado/i });
      expect(salvarButton).not.toBeDisabled();
    });

    it("deve habilitar botão de salvar quando dupla2 vence", async () => {
      mockRegistrarResultado.mockResolvedValue({});

      render(
        <ModalRegistrarResultadoTeams
          etapaId="etapa-1"
          partida={criarPartidaMock()}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "2" } });
      fireEvent.change(inputs[1], { target: { value: "4" } });

      // Botão de salvar deve estar habilitado quando há vencedor
      const salvarButton = screen.getByRole("button", { name: /salvar resultado/i });
      expect(salvarButton).not.toBeDisabled();
    });

    it("deve desabilitar botão de salvar quando não há vencedor definido", () => {
      render(
        <ModalRegistrarResultadoTeams
          etapaId="etapa-1"
          partida={criarPartidaMock()}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      // Sem placar preenchido, não há vencedor - botão submit deve estar desabilitado
      const salvarButton = screen.getByRole("button", { name: /salvar resultado/i });
      expect(salvarButton).toBeDisabled();
    });
  });

  describe("partida sem nomes de jogadores", () => {
    it("deve lidar com dupla sem jogadores definidos", () => {
      const partidaSemJogadores = criarPartidaMock({
        dupla1: [{ id: "j1" }, { id: "j2" }],
        dupla2: [{ id: "j3" }, { id: "j4" }],
      });

      render(
        <ModalRegistrarResultadoTeams
          etapaId="etapa-1"
          partida={partidaSemJogadores}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      // Deve renderizar sem quebrar mesmo sem nomes
      expect(screen.getByText("VS")).toBeInTheDocument();
    });
  });
});
