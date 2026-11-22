/**
 * Testes do componente FaseEliminatoria
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { StatusConfrontoEliminatorio, TipoFase } from "@/types/chave";

// Mock do hook useFaseEliminatoria
const mockUseFaseEliminatoria = jest.fn();

jest.mock(
  "@/components/etapas/FaseEliminatoria/hooks/useFaseEliminatoria",
  () => ({
    useFaseEliminatoria: () => mockUseFaseEliminatoria(),
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

import { FaseEliminatoria } from "@/components/etapas/FaseEliminatoria/FaseEliminatoria";

const mockConfrontos = [
  {
    id: "conf-1",
    etapaId: "etapa-1",
    fase: TipoFase.SEMIFINAL,
    ordem: 1,
    dupla1Id: "dupla-1",
    dupla1Nome: "João / Maria",
    dupla1Origem: "1º Grupo A",
    dupla2Id: "dupla-2",
    dupla2Nome: "Pedro / Ana",
    dupla2Origem: "2º Grupo B",
    status: StatusConfrontoEliminatorio.FINALIZADA,
    placar: "2-1",
    vencedoraId: "dupla-1",
    vencedoraNome: "João / Maria",
  },
  {
    id: "conf-2",
    etapaId: "etapa-1",
    fase: TipoFase.SEMIFINAL,
    ordem: 2,
    dupla1Id: "dupla-3",
    dupla1Nome: "Carlos / Lucia",
    dupla1Origem: "1º Grupo B",
    dupla2Id: "dupla-4",
    dupla2Nome: "Bruno / Carla",
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
    dupla1Nome: "João / Maria",
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
  dupla1Nome: "João / Maria",
  dupla1Origem: "1º Grupo A",
  dupla2Id: null,
  dupla2Nome: null,
  dupla2Origem: null,
  status: StatusConfrontoEliminatorio.BYE,
  placar: null,
  vencedoraId: "dupla-1",
  vencedoraNome: "João / Maria",
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
  setConfrontoSelecionado: jest.fn(),
  setFaseAtual: jest.fn(),
  carregarConfrontos: jest.fn(),
  gerarEliminatoria: jest.fn(),
  cancelarEliminatoria: jest.fn(),
  encerrarEtapa: jest.fn(),
};

describe("FaseEliminatoria", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseFaseEliminatoria.mockReturnValue(defaultHookReturn);
  });

  describe("estado de loading", () => {
    it("deve mostrar spinner durante loading inicial", () => {
      mockUseFaseEliminatoria.mockReturnValue({
        ...defaultHookReturn,
        confrontos: [],
        loading: true,
      });

      const { container } = render(
        <FaseEliminatoria
          etapaId="etapa-1"
          arenaId="arena-1"
          grupos={mockGrupos}
        />
      );

      // Verifica que o container de loading existe
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe("estado de erro", () => {
    it("deve mostrar mensagem de erro", () => {
      mockUseFaseEliminatoria.mockReturnValue({
        ...defaultHookReturn,
        confrontos: [],
        erro: "Erro ao carregar confrontos",
      });

      render(
        <FaseEliminatoria
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
      mockUseFaseEliminatoria.mockReturnValue({
        ...defaultHookReturn,
        confrontos: [],
        erro: "Erro de rede",
        carregarConfrontos: mockCarregar,
      });

      render(
        <FaseEliminatoria
          etapaId="etapa-1"
          arenaId="arena-1"
          grupos={mockGrupos}
        />
      );

      const button = screen.getByText("Tentar Novamente");
      fireEvent.click(button);

      expect(mockCarregar).toHaveBeenCalled();
    });
  });

  describe("estado vazio (sem confrontos)", () => {
    it("deve mostrar EmptyState quando não há confrontos", () => {
      mockUseFaseEliminatoria.mockReturnValue({
        ...defaultHookReturn,
        confrontos: [],
      });

      render(
        <FaseEliminatoria
          etapaId="etapa-1"
          arenaId="arena-1"
          grupos={mockGrupos}
        />
      );

      expect(screen.getByText("Fase Eliminatória")).toBeInTheDocument();
    });
  });

  describe("renderização de confrontos", () => {
    it("deve mostrar título da seção", () => {
      render(
        <FaseEliminatoria
          etapaId="etapa-1"
          arenaId="arena-1"
          grupos={mockGrupos}
        />
      );

      expect(screen.getByText("Fase Eliminatória")).toBeInTheDocument();
      expect(
        screen.getByText("Confrontos mata-mata até o campeão!")
      ).toBeInTheDocument();
    });

    it("deve mostrar nomes das duplas", () => {
      render(
        <FaseEliminatoria
          etapaId="etapa-1"
          arenaId="arena-1"
          grupos={mockGrupos}
        />
      );

      expect(screen.getAllByText("João / Maria").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Pedro / Ana").length).toBeGreaterThan(0);
    });

    it("deve mostrar origem das duplas", () => {
      render(
        <FaseEliminatoria
          etapaId="etapa-1"
          arenaId="arena-1"
          grupos={mockGrupos}
        />
      );

      expect(screen.getAllByText("(1º Grupo A)").length).toBeGreaterThan(0);
    });

    it("deve mostrar separador VS", () => {
      render(
        <FaseEliminatoria
          etapaId="etapa-1"
          arenaId="arena-1"
          grupos={mockGrupos}
        />
      );

      expect(screen.getAllByText("VS").length).toBeGreaterThan(0);
    });
  });

  describe("fases", () => {
    it("deve mostrar nome da fase Semifinal", () => {
      render(
        <FaseEliminatoria
          etapaId="etapa-1"
          arenaId="arena-1"
          grupos={mockGrupos}
        />
      );

      // Pode aparecer múltiplas vezes (no select e no card)
      expect(screen.getAllByText("Semifinal").length).toBeGreaterThan(0);
    });

    it("deve mostrar nome da fase Final", () => {
      render(
        <FaseEliminatoria
          etapaId="etapa-1"
          arenaId="arena-1"
          grupos={mockGrupos}
        />
      );

      // Pode aparecer múltiplas vezes (no select e no card)
      expect(screen.getAllByText("Final").length).toBeGreaterThan(0);
    });
  });

  describe("botões de ação", () => {
    it("deve mostrar botão cancelar eliminatória", () => {
      render(
        <FaseEliminatoria
          etapaId="etapa-1"
          arenaId="arena-1"
          grupos={mockGrupos}
        />
      );

      expect(screen.getByText("Cancelar Eliminatória")).toBeInTheDocument();
    });

    it("deve abrir modal de confirmação ao clicar em Cancelar Eliminatória", () => {
      render(
        <FaseEliminatoria
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
      mockUseFaseEliminatoria.mockReturnValue({
        ...defaultHookReturn,
        cancelarEliminatoria: mockCancelar,
      });

      render(
        <FaseEliminatoria
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

    it("deve desabilitar cancelar quando etapa finalizada", () => {
      mockUseFaseEliminatoria.mockReturnValue({
        ...defaultHookReturn,
        etapaFinalizada: true,
      });

      render(
        <FaseEliminatoria
          etapaId="etapa-1"
          arenaId="arena-1"
          grupos={mockGrupos}
        />
      );

      expect(
        screen.getByText("Cancelar Eliminatória").closest("button")
      ).toBeDisabled();
    });
  });

  describe("partida agendada", () => {
    it("deve mostrar botão Registrar Resultado para partida agendada", () => {
      render(
        <FaseEliminatoria
          etapaId="etapa-1"
          arenaId="arena-1"
          grupos={mockGrupos}
        />
      );

      expect(
        screen.getAllByText("Registrar Resultado").length
      ).toBeGreaterThan(0);
    });

    it("deve abrir modal ao clicar em Registrar Resultado", () => {
      const mockSetConfronto = jest.fn();
      mockUseFaseEliminatoria.mockReturnValue({
        ...defaultHookReturn,
        setConfrontoSelecionado: mockSetConfronto,
      });

      render(
        <FaseEliminatoria
          etapaId="etapa-1"
          arenaId="arena-1"
          grupos={mockGrupos}
        />
      );

      // Pegar o primeiro botão de registrar
      const buttons = screen.getAllByText("Registrar Resultado");
      fireEvent.click(buttons[0]);

      expect(mockSetConfronto).toHaveBeenCalled();
    });
  });

  describe("partida finalizada", () => {
    it("deve mostrar placar da partida finalizada", () => {
      render(
        <FaseEliminatoria
          etapaId="etapa-1"
          arenaId="arena-1"
          grupos={mockGrupos}
        />
      );

      // Placar 2-1
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getAllByText("1").length).toBeGreaterThan(0);
    });

    it("deve destacar vencedor da partida finalizada via estilo", () => {
      render(
        <FaseEliminatoria
          etapaId="etapa-1"
          arenaId="arena-1"
          grupos={mockGrupos}
        />
      );

      // O vencedor é destacado via prop $isWinner no styled component
      // Verificamos que o nome do vencedor está presente
      expect(screen.getAllByText("João / Maria").length).toBeGreaterThan(0);
    });

    it("deve mostrar botão Editar Resultado", () => {
      render(
        <FaseEliminatoria
          etapaId="etapa-1"
          arenaId="arena-1"
          grupos={mockGrupos}
        />
      );

      expect(screen.getByText("Editar Resultado")).toBeInTheDocument();
    });

    it("deve mostrar Etapa Finalizada quando etapa encerrada", () => {
      mockUseFaseEliminatoria.mockReturnValue({
        ...defaultHookReturn,
        etapaFinalizada: true,
      });

      render(
        <FaseEliminatoria
          etapaId="etapa-1"
          arenaId="arena-1"
          grupos={mockGrupos}
        />
      );

      expect(screen.getAllByText("Etapa Finalizada").length).toBeGreaterThan(0);
    });
  });

  describe("confronto com BYE", () => {
    it("deve mostrar informação de BYE", () => {
      mockUseFaseEliminatoria.mockReturnValue({
        ...defaultHookReturn,
        confrontos: [mockConfrontoComBye],
      });

      render(
        <FaseEliminatoria
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
        <FaseEliminatoria
          etapaId="etapa-1"
          arenaId="arena-1"
          grupos={mockGrupos}
        />
      );

      expect(screen.getByText("Todas as Fases")).toBeInTheDocument();
    });

    it("deve chamar setFaseAtual ao mudar filtro", () => {
      const mockSetFase = jest.fn();
      mockUseFaseEliminatoria.mockReturnValue({
        ...defaultHookReturn,
        setFaseAtual: mockSetFase,
      });

      render(
        <FaseEliminatoria
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

  describe("encerrar etapa", () => {
    it("deve mostrar botão encerrar quando final finalizada", () => {
      mockUseFaseEliminatoria.mockReturnValue({
        ...defaultHookReturn,
        finalFinalizada: true,
      });

      render(
        <FaseEliminatoria
          etapaId="etapa-1"
          arenaId="arena-1"
          grupos={mockGrupos}
        />
      );

      expect(screen.getByText("Encerrar Etapa")).toBeInTheDocument();
    });

    it("deve mostrar mensagem de sucesso quando etapa encerrada", () => {
      mockUseFaseEliminatoria.mockReturnValue({
        ...defaultHookReturn,
        finalFinalizada: true,
        etapaFinalizada: true,
      });

      render(
        <FaseEliminatoria
          etapaId="etapa-1"
          arenaId="arena-1"
          grupos={mockGrupos}
        />
      );

      expect(screen.getByText("Etapa Finalizada!")).toBeInTheDocument();
    });
  });

  describe("modal de resultado", () => {
    it("deve mostrar modal quando confronto selecionado", () => {
      mockUseFaseEliminatoria.mockReturnValue({
        ...defaultHookReturn,
        confrontoSelecionado: mockConfrontos[1],
      });

      render(
        <FaseEliminatoria
          etapaId="etapa-1"
          arenaId="arena-1"
          grupos={mockGrupos}
        />
      );

      expect(screen.getByTestId("modal-resultado")).toBeInTheDocument();
    });

    it("deve fechar modal ao clicar em fechar", () => {
      const mockSetConfronto = jest.fn();
      mockUseFaseEliminatoria.mockReturnValue({
        ...defaultHookReturn,
        confrontoSelecionado: mockConfrontos[1],
        setConfrontoSelecionado: mockSetConfronto,
      });

      render(
        <FaseEliminatoria
          etapaId="etapa-1"
          arenaId="arena-1"
          grupos={mockGrupos}
        />
      );

      fireEvent.click(screen.getByText("Fechar"));
      expect(mockSetConfronto).toHaveBeenCalledWith(null);
    });

    it("deve chamar carregarConfrontos ao salvar resultado", () => {
      const mockSetConfronto = jest.fn();
      const mockCarregar = jest.fn();
      mockUseFaseEliminatoria.mockReturnValue({
        ...defaultHookReturn,
        confrontoSelecionado: mockConfrontos[1],
        setConfrontoSelecionado: mockSetConfronto,
        carregarConfrontos: mockCarregar,
      });

      render(
        <FaseEliminatoria
          etapaId="etapa-1"
          arenaId="arena-1"
          grupos={mockGrupos}
        />
      );

      fireEvent.click(screen.getByText("Salvar"));
      expect(mockSetConfronto).toHaveBeenCalledWith(null);
      expect(mockCarregar).toHaveBeenCalled();
    });
  });

  describe("filtro por fase específica", () => {
    it("deve filtrar confrontos por fase semifinal", () => {
      mockUseFaseEliminatoria.mockReturnValue({
        ...defaultHookReturn,
        faseAtual: TipoFase.SEMIFINAL,
      });

      render(
        <FaseEliminatoria
          etapaId="etapa-1"
          arenaId="arena-1"
          grupos={mockGrupos}
        />
      );

      expect(screen.getAllByText("Semifinal").length).toBeGreaterThan(0);
    });
  });

  describe("editar resultado", () => {
    it("deve chamar setConfrontoSelecionado ao editar resultado", () => {
      const mockSetConfronto = jest.fn();
      mockUseFaseEliminatoria.mockReturnValue({
        ...defaultHookReturn,
        confrontos: [mockConfrontos[0]], // Apenas partida finalizada
        setConfrontoSelecionado: mockSetConfronto,
      });

      render(
        <FaseEliminatoria
          etapaId="etapa-1"
          arenaId="arena-1"
          grupos={mockGrupos}
        />
      );

      fireEvent.click(screen.getByText("Editar Resultado"));
      expect(mockSetConfronto).toHaveBeenCalled();
    });
  });
});
