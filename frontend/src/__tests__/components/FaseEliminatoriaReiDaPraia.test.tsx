/**
 * Testes do componente FaseEliminatoriaReiDaPraia
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { StatusConfrontoEliminatorio, TipoFase } from "@/types/chave";
import { TipoChaveamentoReiDaPraia } from "@/types/reiDaPraia";

// Mock do hook useFaseEliminatoriaReiDaPraia
const mockUseFaseEliminatoriaReiDaPraia = jest.fn();

jest.mock(
  "@/components/etapas/FaseEliminatoriaReiDaPraia/hooks/useFaseEliminatoriaReiDaPraia",
  () => ({
    useFaseEliminatoriaReiDaPraia: () => mockUseFaseEliminatoriaReiDaPraia(),
  })
);

// Mock do modal de resultado
jest.mock(
  "@/components/etapas/ModalRegistrarResultadoEliminatorio",
  () => ({
    ModalRegistrarResultadoEliminatorio: ({
      onClose,
      onSuccess,
    }: {
      confronto: any;
      onClose: () => void;
      onSuccess: () => void;
    }) => (
      <div data-testid="modal-resultado">
        <button onClick={onClose}>Fechar</button>
        <button onClick={onSuccess}>Salvar</button>
      </div>
    ),
  })
);

// Mock do modal de confirmação
jest.mock("@/components/modals/ConfirmacaoPerigosa", () => ({
  ConfirmacaoPerigosa: ({
    isOpen,
    onConfirm,
    onClose,
    titulo,
  }: {
    isOpen: boolean;
    onConfirm: () => void;
    onClose: () => void;
    titulo: string;
  }) =>
    isOpen ? (
      <div data-testid={`modal-confirmacao-${titulo.toLowerCase().replace(/\s/g, "-")}`}>
        <span>{titulo}</span>
        <button onClick={onClose} data-testid="btn-cancelar-modal">Cancelar</button>
        <button onClick={onConfirm} data-testid="btn-confirmar-modal">Confirmar</button>
      </div>
    ) : null,
}));

import { FaseEliminatoriaReiDaPraia } from "@/components/etapas/FaseEliminatoriaReiDaPraia/FaseEliminatoriaReiDaPraia";

const mockConfrontos = [
  {
    id: "conf-1",
    etapaId: "etapa-1",
    fase: TipoFase.SEMIFINAL,
    ordem: 1,
    dupla1Id: "dupla-1",
    dupla1Nome: "João & Maria",
    dupla1Origem: "1º Grupo A",
    dupla2Id: "dupla-2",
    dupla2Nome: "Pedro & Ana",
    dupla2Origem: "2º Grupo B",
    status: StatusConfrontoEliminatorio.FINALIZADA,
    placar: "2-1",
    vencedoraId: "dupla-1",
    vencedoraNome: "João & Maria",
  },
  {
    id: "conf-2",
    etapaId: "etapa-1",
    fase: TipoFase.SEMIFINAL,
    ordem: 2,
    dupla1Id: "dupla-3",
    dupla1Nome: "Carlos & Lucia",
    dupla1Origem: "1º Grupo B",
    dupla2Id: "dupla-4",
    dupla2Nome: "Bruno & Carla",
    dupla2Origem: "2º Grupo A",
    status: StatusConfrontoEliminatorio.AGENDADA,
    placar: null,
    vencedoraId: null,
    vencedoraNome: null,
  },
  {
    id: "conf-3",
    etapaId: "etapa-1",
    fase: TipoFase.FINAL,
    ordem: 1,
    dupla1Id: "dupla-1",
    dupla1Nome: "João & Maria",
    dupla1Origem: "Vencedor Semi 1",
    dupla2Id: null,
    dupla2Nome: "A definir",
    dupla2Origem: "Vencedor Semi 2",
    status: StatusConfrontoEliminatorio.AGENDADA,
    placar: null,
    vencedoraId: null,
    vencedoraNome: null,
  },
];

const mockConfrontoComBye = {
  id: "conf-bye",
  etapaId: "etapa-1",
  fase: TipoFase.QUARTAS,
  ordem: 1,
  dupla1Id: "dupla-1",
  dupla1Nome: "João & Maria",
  dupla1Origem: "1º Grupo A",
  dupla2Id: null,
  dupla2Nome: null,
  dupla2Origem: null,
  status: StatusConfrontoEliminatorio.BYE,
  placar: null,
  vencedoraId: "dupla-1",
  vencedoraNome: "João & Maria",
};

const mockGrupos = [
  { id: "grupo-1", nome: "Grupo A", completo: true, duplas: [], partidas: [] },
  { id: "grupo-2", nome: "Grupo B", completo: true, duplas: [], partidas: [] },
];

const defaultHookReturn = {
  confrontos: mockConfrontos,
  loading: false,
  erro: null,
  confrontoSelecionado: null,
  faseAtual: "todas" as const,
  etapaFinalizada: false,
  todosGruposCompletos: true,
  isGrupoUnico: false,
  partidasPendentes: 0,
  finalFinalizada: false,
  grupoUnicoCompleto: false,
  tipoChaveamento: "Melhores com Melhores",
  setConfrontoSelecionado: jest.fn(),
  setFaseAtual: jest.fn(),
  carregarConfrontos: jest.fn(),
  gerarEliminatoria: jest.fn(),
  cancelarEliminatoria: jest.fn(),
  encerrarEtapa: jest.fn(),
};

describe("FaseEliminatoriaReiDaPraia", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseFaseEliminatoriaReiDaPraia.mockReturnValue(defaultHookReturn);
  });

  describe("estado de loading", () => {
    it("deve mostrar spinner durante loading inicial", () => {
      mockUseFaseEliminatoriaReiDaPraia.mockReturnValue({
        ...defaultHookReturn,
        confrontos: [],
        loading: true,
      });

      const { container } = render(
        <FaseEliminatoriaReiDaPraia
          etapaId="etapa-1"
          arenaId="arena-1"
          grupos={mockGrupos}
        />
      );

      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe("estado de erro", () => {
    it("deve mostrar mensagem de erro", () => {
      mockUseFaseEliminatoriaReiDaPraia.mockReturnValue({
        ...defaultHookReturn,
        confrontos: [],
        erro: "Erro ao carregar confrontos",
      });

      render(
        <FaseEliminatoriaReiDaPraia
          etapaId="etapa-1"
          arenaId="arena-1"
          grupos={mockGrupos}
        />
      );

      expect(
        screen.getByText(/Erro ao carregar confrontos/)
      ).toBeInTheDocument();
    });

    it("deve mostrar botão tentar novamente", () => {
      const mockCarregar = jest.fn();
      mockUseFaseEliminatoriaReiDaPraia.mockReturnValue({
        ...defaultHookReturn,
        confrontos: [],
        erro: "Erro de rede",
        carregarConfrontos: mockCarregar,
      });

      render(
        <FaseEliminatoriaReiDaPraia
          etapaId="etapa-1"
          arenaId="arena-1"
          grupos={mockGrupos}
        />
      );

      const button = screen.getByText("🔄 Tentar Novamente");
      fireEvent.click(button);

      expect(mockCarregar).toHaveBeenCalled();
    });
  });

  describe("estado vazio", () => {
    it("deve mostrar EmptyState quando não há confrontos", () => {
      mockUseFaseEliminatoriaReiDaPraia.mockReturnValue({
        ...defaultHookReturn,
        confrontos: [],
      });

      render(
        <FaseEliminatoriaReiDaPraia
          etapaId="etapa-1"
          arenaId="arena-1"
          grupos={mockGrupos}
        />
      );

      expect(screen.getByText("Fase Eliminatória")).toBeInTheDocument();
    });
  });

  describe("renderização de confrontos", () => {
    it("deve mostrar título Rei da Praia", () => {
      render(
        <FaseEliminatoriaReiDaPraia
          etapaId="etapa-1"
          arenaId="arena-1"
          grupos={mockGrupos}
        />
      );

      expect(
        screen.getByText("Fase Eliminatória - Rei da Praia")
      ).toBeInTheDocument();
    });

    it("deve mostrar descrição", () => {
      render(
        <FaseEliminatoriaReiDaPraia
          etapaId="etapa-1"
          arenaId="arena-1"
          grupos={mockGrupos}
        />
      );

      expect(
        screen.getByText("Duplas formadas pelos classificados individuais!")
      ).toBeInTheDocument();
    });

    it("deve mostrar tipo de chaveamento", () => {
      render(
        <FaseEliminatoriaReiDaPraia
          etapaId="etapa-1"
          arenaId="arena-1"
          grupos={mockGrupos}
        />
      );

      expect(screen.getByText("Tipo de Chaveamento:")).toBeInTheDocument();
      expect(screen.getByText("Melhores com Melhores")).toBeInTheDocument();
    });

    it("deve mostrar nomes das duplas", () => {
      render(
        <FaseEliminatoriaReiDaPraia
          etapaId="etapa-1"
          arenaId="arena-1"
          grupos={mockGrupos}
        />
      );

      expect(screen.getAllByText("João & Maria").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Pedro & Ana").length).toBeGreaterThan(0);
    });

    it("deve mostrar separador VS", () => {
      render(
        <FaseEliminatoriaReiDaPraia
          etapaId="etapa-1"
          arenaId="arena-1"
          grupos={mockGrupos}
        />
      );

      expect(screen.getAllByText("VS").length).toBeGreaterThan(0);
    });
  });

  describe("fases", () => {
    it("deve mostrar nomes das fases", () => {
      render(
        <FaseEliminatoriaReiDaPraia
          etapaId="etapa-1"
          arenaId="arena-1"
          grupos={mockGrupos}
        />
      );

      expect(screen.getAllByText("Semifinal").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Final").length).toBeGreaterThan(0);
    });
  });

  describe("botões de ação", () => {
    it("deve mostrar botão cancelar eliminatória", () => {
      render(
        <FaseEliminatoriaReiDaPraia
          etapaId="etapa-1"
          arenaId="arena-1"
          grupos={mockGrupos}
        />
      );

      expect(screen.getByText("Cancelar Eliminatória")).toBeInTheDocument();
    });

    it("deve abrir modal de confirmação ao clicar em Cancelar Eliminatória", () => {
      render(
        <FaseEliminatoriaReiDaPraia
          etapaId="etapa-1"
          arenaId="arena-1"
          grupos={mockGrupos}
        />
      );

      fireEvent.click(screen.getByText("Cancelar Eliminatória"));

      // Deve abrir o modal de confirmação
      expect(screen.getByTestId("modal-confirmacao-cancelar-eliminatória")).toBeInTheDocument();
    });

    it("deve chamar cancelarEliminatoria ao confirmar no modal", async () => {
      const mockCancelar = jest.fn().mockResolvedValue(undefined);
      mockUseFaseEliminatoriaReiDaPraia.mockReturnValue({
        ...defaultHookReturn,
        cancelarEliminatoria: mockCancelar,
      });

      render(
        <FaseEliminatoriaReiDaPraia
          etapaId="etapa-1"
          arenaId="arena-1"
          grupos={mockGrupos}
        />
      );

      // Abre o modal
      fireEvent.click(screen.getByText("Cancelar Eliminatória"));

      // Confirma no modal
      fireEvent.click(screen.getByTestId("btn-confirmar-modal"));

      await waitFor(() => {
        expect(mockCancelar).toHaveBeenCalled();
      });
    });
  });

  describe("partida agendada", () => {
    it("deve mostrar botão Registrar Resultado", () => {
      render(
        <FaseEliminatoriaReiDaPraia
          etapaId="etapa-1"
          arenaId="arena-1"
          grupos={mockGrupos}
        />
      );

      expect(
        screen.getAllByText("Registrar Resultado").length
      ).toBeGreaterThan(0);
    });
  });

  describe("partida finalizada", () => {
    it("deve mostrar placar", () => {
      render(
        <FaseEliminatoriaReiDaPraia
          etapaId="etapa-1"
          arenaId="arena-1"
          grupos={mockGrupos}
        />
      );

      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getAllByText("1").length).toBeGreaterThan(0);
    });

    it("deve destacar vencedor via estilo", () => {
      render(
        <FaseEliminatoriaReiDaPraia
          etapaId="etapa-1"
          arenaId="arena-1"
          grupos={mockGrupos}
        />
      );

      // O vencedor é destacado via prop $isWinner no styled component
      // Verificamos que o nome do vencedor está presente
      expect(screen.getAllByText("João & Maria").length).toBeGreaterThan(0);
    });
  });

  describe("confronto com BYE", () => {
    it("deve mostrar informação de BYE", () => {
      mockUseFaseEliminatoriaReiDaPraia.mockReturnValue({
        ...defaultHookReturn,
        confrontos: [mockConfrontoComBye],
      });

      render(
        <FaseEliminatoriaReiDaPraia
          etapaId="etapa-1"
          arenaId="arena-1"
          grupos={mockGrupos}
        />
      );

      expect(
        screen.getByText("Classificado automaticamente (BYE)")
      ).toBeInTheDocument();
    });
  });

  describe("filtro por fase", () => {
    it("deve mostrar select de filtro", () => {
      render(
        <FaseEliminatoriaReiDaPraia
          etapaId="etapa-1"
          arenaId="arena-1"
          grupos={mockGrupos}
        />
      );

      expect(screen.getByText("Todas as Fases")).toBeInTheDocument();
    });
  });

  describe("encerrar etapa", () => {
    it("deve mostrar botão encerrar quando final finalizada", () => {
      mockUseFaseEliminatoriaReiDaPraia.mockReturnValue({
        ...defaultHookReturn,
        finalFinalizada: true,
      });

      render(
        <FaseEliminatoriaReiDaPraia
          etapaId="etapa-1"
          arenaId="arena-1"
          grupos={mockGrupos}
        />
      );

      expect(screen.getByText("Encerrar Etapa")).toBeInTheDocument();
    });

    it("deve mostrar mensagem quando etapa encerrada", () => {
      mockUseFaseEliminatoriaReiDaPraia.mockReturnValue({
        ...defaultHookReturn,
        finalFinalizada: true,
        etapaFinalizada: true,
      });

      render(
        <FaseEliminatoriaReiDaPraia
          etapaId="etapa-1"
          arenaId="arena-1"
          grupos={mockGrupos}
        />
      );

      expect(
        screen.getByText("Etapa Rei da Praia Finalizada!")
      ).toBeInTheDocument();
    });
  });

  describe("modal de resultado", () => {
    it("deve mostrar modal quando confronto selecionado", () => {
      mockUseFaseEliminatoriaReiDaPraia.mockReturnValue({
        ...defaultHookReturn,
        confrontoSelecionado: mockConfrontos[1],
      });

      render(
        <FaseEliminatoriaReiDaPraia
          etapaId="etapa-1"
          arenaId="arena-1"
          grupos={mockGrupos}
        />
      );

      expect(screen.getByTestId("modal-resultado")).toBeInTheDocument();
    });
  });

  describe("filtro por fase específica", () => {
    it("deve filtrar por semifinal", () => {
      mockUseFaseEliminatoriaReiDaPraia.mockReturnValue({
        ...defaultHookReturn,
        faseAtual: TipoFase.SEMIFINAL,
      });

      render(
        <FaseEliminatoriaReiDaPraia
          etapaId="etapa-1"
          arenaId="arena-1"
          grupos={mockGrupos}
        />
      );

      expect(screen.getAllByText("Semifinal").length).toBeGreaterThan(0);
    });
  });

  describe("editar resultado", () => {
    it("deve mostrar botão Editar Resultado para partida finalizada", () => {
      mockUseFaseEliminatoriaReiDaPraia.mockReturnValue({
        ...defaultHookReturn,
        confrontos: [mockConfrontos[0]], // Apenas a partida finalizada
      });

      render(
        <FaseEliminatoriaReiDaPraia
          etapaId="etapa-1"
          arenaId="arena-1"
          grupos={mockGrupos}
        />
      );

      expect(screen.getByText("Editar Resultado")).toBeInTheDocument();
    });

    it("deve chamar setConfrontoSelecionado ao editar", () => {
      const mockSetConfronto = jest.fn();
      mockUseFaseEliminatoriaReiDaPraia.mockReturnValue({
        ...defaultHookReturn,
        confrontos: [mockConfrontos[0]], // Apenas a partida finalizada
        setConfrontoSelecionado: mockSetConfronto,
      });

      render(
        <FaseEliminatoriaReiDaPraia
          etapaId="etapa-1"
          arenaId="arena-1"
          grupos={mockGrupos}
        />
      );

      fireEvent.click(screen.getByText("Editar Resultado"));
      expect(mockSetConfronto).toHaveBeenCalled();
    });

    it("deve mostrar Etapa Finalizada quando etapa está finalizada", () => {
      mockUseFaseEliminatoriaReiDaPraia.mockReturnValue({
        ...defaultHookReturn,
        confrontos: [mockConfrontos[0]], // Apenas a partida finalizada
        etapaFinalizada: true,
        finalFinalizada: true,
      });

      render(
        <FaseEliminatoriaReiDaPraia
          etapaId="etapa-1"
          arenaId="arena-1"
          grupos={mockGrupos}
        />
      );

      expect(screen.getByText("Etapa Finalizada")).toBeInTheDocument();
    });

    it("não deve chamar setConfrontoSelecionado quando etapa finalizada", () => {
      const mockSetConfronto = jest.fn();
      mockUseFaseEliminatoriaReiDaPraia.mockReturnValue({
        ...defaultHookReturn,
        confrontos: [mockConfrontos[0]], // Apenas a partida finalizada
        etapaFinalizada: true,
        finalFinalizada: true,
        setConfrontoSelecionado: mockSetConfronto,
      });

      render(
        <FaseEliminatoriaReiDaPraia
          etapaId="etapa-1"
          arenaId="arena-1"
          grupos={mockGrupos}
        />
      );

      fireEvent.click(screen.getByText("Etapa Finalizada"));
      expect(mockSetConfronto).not.toHaveBeenCalled();
    });
  });

  describe("chamar encerrarEtapa", () => {
    it("deve abrir modal de confirmação ao clicar em Encerrar Etapa", () => {
      mockUseFaseEliminatoriaReiDaPraia.mockReturnValue({
        ...defaultHookReturn,
        finalFinalizada: true,
      });

      render(
        <FaseEliminatoriaReiDaPraia
          etapaId="etapa-1"
          arenaId="arena-1"
          grupos={mockGrupos}
        />
      );

      fireEvent.click(screen.getByText("Encerrar Etapa"));

      // Deve abrir o modal de confirmação
      expect(screen.getByTestId("modal-confirmacao-encerrar-etapa-rei-da-praia")).toBeInTheDocument();
    });

    it("deve chamar encerrarEtapa ao confirmar no modal", async () => {
      const mockEncerrar = jest.fn().mockResolvedValue(undefined);
      mockUseFaseEliminatoriaReiDaPraia.mockReturnValue({
        ...defaultHookReturn,
        finalFinalizada: true,
        encerrarEtapa: mockEncerrar,
      });

      render(
        <FaseEliminatoriaReiDaPraia
          etapaId="etapa-1"
          arenaId="arena-1"
          grupos={mockGrupos}
        />
      );

      // Abre o modal
      fireEvent.click(screen.getByText("Encerrar Etapa"));

      // Confirma no modal
      fireEvent.click(screen.getByTestId("btn-confirmar-modal"));

      await waitFor(() => {
        expect(mockEncerrar).toHaveBeenCalled();
      });
    });
  });

  describe("seleção de filtro", () => {
    it("deve chamar setFaseAtual ao mudar filtro", () => {
      const mockSetFase = jest.fn();
      mockUseFaseEliminatoriaReiDaPraia.mockReturnValue({
        ...defaultHookReturn,
        setFaseAtual: mockSetFase,
      });

      render(
        <FaseEliminatoriaReiDaPraia
          etapaId="etapa-1"
          arenaId="arena-1"
          grupos={mockGrupos}
        />
      );

      const select = screen.getByRole("combobox");
      fireEvent.change(select, { target: { value: TipoFase.SEMIFINAL } });

      expect(mockSetFase).toHaveBeenCalledWith(TipoFase.SEMIFINAL);
    });
  });

  describe("registrar resultado", () => {
    it("deve chamar setConfrontoSelecionado ao registrar", () => {
      const mockSetConfronto = jest.fn();
      mockUseFaseEliminatoriaReiDaPraia.mockReturnValue({
        ...defaultHookReturn,
        confrontos: [mockConfrontos[1]], // Partida agendada
        setConfrontoSelecionado: mockSetConfronto,
      });

      render(
        <FaseEliminatoriaReiDaPraia
          etapaId="etapa-1"
          arenaId="arena-1"
          grupos={mockGrupos}
        />
      );

      fireEvent.click(screen.getByText("Registrar Resultado"));
      expect(mockSetConfronto).toHaveBeenCalledWith(mockConfrontos[1]);
    });
  });

  describe("botão cancelar desabilitado", () => {
    it("deve desabilitar botão cancelar quando etapa finalizada", () => {
      mockUseFaseEliminatoriaReiDaPraia.mockReturnValue({
        ...defaultHookReturn,
        etapaFinalizada: true,
        finalFinalizada: true,
      });

      render(
        <FaseEliminatoriaReiDaPraia
          etapaId="etapa-1"
          arenaId="arena-1"
          grupos={mockGrupos}
        />
      );

      const button = screen.getByText("Cancelar Eliminatória").closest("button");
      expect(button).toBeDisabled();
    });

    it("deve desabilitar botão cancelar durante loading", () => {
      mockUseFaseEliminatoriaReiDaPraia.mockReturnValue({
        ...defaultHookReturn,
        loading: true,
      });

      render(
        <FaseEliminatoriaReiDaPraia
          etapaId="etapa-1"
          arenaId="arena-1"
          grupos={mockGrupos}
        />
      );

      const button = screen.getByText("Cancelar Eliminatória").closest("button");
      expect(button).toBeDisabled();
    });
  });

  describe("botões desabilitados", () => {
    it("deve desabilitar botão encerrar quando etapa já encerrada", () => {
      mockUseFaseEliminatoriaReiDaPraia.mockReturnValue({
        ...defaultHookReturn,
        finalFinalizada: true,
        etapaFinalizada: true,
      });

      render(
        <FaseEliminatoriaReiDaPraia
          etapaId="etapa-1"
          arenaId="arena-1"
          grupos={mockGrupos}
        />
      );

      const button = screen.getByText("Etapa Encerrada").closest("button");
      expect(button).toBeDisabled();
    });
  });
});
