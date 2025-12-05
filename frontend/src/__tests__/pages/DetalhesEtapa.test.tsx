/**
 * Testes de renderização da página DetalhesEtapa (admin)
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { useDetalhesEtapa } from "@/hooks/useDetalhesEtapa";
import DetalhesEtapa from "@/pages/DetalhesEtapa";
import { FormatoEtapa, StatusEtapa } from "@/types/etapa";
import { NivelJogador, GeneroJogador } from "@/types/jogador";

// Mock do logger
jest.mock("@/utils/logger", () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock do useDetalhesEtapa para testes de componente
jest.mock("@/hooks/useDetalhesEtapa", () => ({
  useDetalhesEtapa: jest.fn(),
}));

// Mock do react-router-dom
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  useParams: () => ({ id: "etapa-123" }),
}));

// Mock dos serviços
jest.mock("@/services", () => ({
  getEtapaService: () => ({
    buscarPorId: jest.fn(),
    deletar: jest.fn(),
  }),
}));

// Mock dos componentes filhos
jest.mock("@/pages/DetalhesEtapa/components/EtapaHeader", () => ({
  EtapaHeader: ({ etapa, onEditar, onExcluir }: any) => (
    <div data-testid="etapa-header">
      <h1>{etapa.nome}</h1>
      <button onClick={onEditar} data-testid="btn-editar">Editar</button>
      <button onClick={onExcluir} data-testid="btn-excluir">Excluir</button>
    </div>
  ),
}));

jest.mock("@/pages/DetalhesEtapa/components/EtapaInfoCards", () => ({
  EtapaInfoCards: ({ etapa, progresso, isReiDaPraia }: any) => (
    <div data-testid="etapa-info-cards">
      <span>Progresso: {progresso}%</span>
      <span>Formato: {isReiDaPraia ? "Rei da Praia" : "Dupla Fixa"}</span>
    </div>
  ),
}));

jest.mock("@/pages/DetalhesEtapa/components/ActionsSection", () => ({
  ActionsSection: ({ onAbrirInscricoes, onEncerrarInscricoes, onGerarChaves, onApagarChaves, onFinalizarEtapa, onVerChaves }: any) => (
    <div data-testid="actions-section">
      <button onClick={onAbrirInscricoes} data-testid="btn-abrir-inscricoes">Abrir Inscrições</button>
      <button onClick={onEncerrarInscricoes} data-testid="btn-encerrar-inscricoes">Encerrar Inscrições</button>
      <button onClick={onGerarChaves} data-testid="btn-gerar-chaves">Gerar Chaves</button>
      <button onClick={onApagarChaves} data-testid="btn-apagar-chaves">Apagar Chaves</button>
      <button onClick={onFinalizarEtapa} data-testid="btn-finalizar-etapa">Finalizar Etapa</button>
      <button onClick={onVerChaves} data-testid="btn-ver-chaves">Ver Chaves</button>
    </div>
  ),
}));

jest.mock("@/pages/DetalhesEtapa/components/InscricoesTab", () => ({
  InscricoesTab: ({ inscricoes, onInscricao, onCancelar, onCancelarMultiplos }: any) => (
    <div data-testid="inscricoes-tab">
      <span>Total: {inscricoes.length}</span>
      <button onClick={onInscricao} data-testid="btn-nova-inscricao">Nova Inscrição</button>
      <button onClick={() => onCancelar("inscricao-1")} data-testid="btn-cancelar-inscricao">Cancelar Inscrição</button>
      <button onClick={() => onCancelarMultiplos(["ins-1", "ins-2"])} data-testid="btn-cancelar-multiplos">Cancelar Múltiplos</button>
    </div>
  ),
}));

jest.mock("@/pages/DetalhesEtapa/components/CabecasTab", () => ({
  CabecasTab: ({ etapa, onUpdate }: any) => (
    <div data-testid="cabecas-tab">
      <span>Cabeças de Chave - {etapa.nome}</span>
      <button onClick={onUpdate} data-testid="btn-update-cabecas">Atualizar</button>
    </div>
  ),
}));

jest.mock("@/components/etapas/ChavesEtapa", () => ({
  ChavesEtapa: ({ etapaId }: any) => (
    <div data-testid="chaves-etapa">Chaves Dupla Fixa: {etapaId}</div>
  ),
}));

jest.mock("@/components/etapas/ChavesReiDaPraia", () => ({
  ChavesReiDaPraia: ({ etapaId }: any) => (
    <div data-testid="chaves-rei-da-praia">Chaves Rei da Praia: {etapaId}</div>
  ),
}));

jest.mock("@/components/etapas/ModalInscricao", () => ({
  ModalInscricao: ({ onClose, onSuccess }: any) => (
    <div data-testid="modal-inscricao">
      <button onClick={onClose} data-testid="btn-fechar-modal">Fechar</button>
      <button onClick={onSuccess} data-testid="btn-confirmar-inscricao">Confirmar</button>
    </div>
  ),
}));

jest.mock("@/components/modals/ConfirmacaoPerigosa", () => ({
  ConfirmacaoPerigosa: ({ isOpen, onConfirm, onClose }: any) => (
    isOpen ? (
      <div data-testid="modal-confirmacao">
        <button onClick={onClose} data-testid="btn-cancelar-confirmacao">Cancelar</button>
        <button onClick={onConfirm} data-testid="btn-confirmar-exclusao">Confirmar</button>
      </div>
    ) : null
  ),
}));

jest.mock("@/components/layout/Footer", () => ({
  Footer: () => <footer data-testid="footer">Footer</footer>,
}));

// ============================================
// TESTES DE RENDERIZAÇÃO DO COMPONENTE
// ============================================

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe("DetalhesEtapa - Renderização", () => {
  const mockUseDetalhesEtapa = useDetalhesEtapa as jest.Mock;

  const mockEtapa = {
    id: "etapa-123",
    nome: "Etapa Teste",
    formato: FormatoEtapa.DUPLA_FIXA,
    status: StatusEtapa.INSCRICOES_ABERTAS,
    nivel: NivelJogador.INTERMEDIARIO,
    genero: GeneroJogador.MASCULINO,
    maxJogadores: 16,
    totalInscritos: 8,
    chavesGeradas: false,
    inscricoes: [],
    qtdGrupos: 2,
  };

  const defaultMockReturn = {
    etapa: mockEtapa,
    loading: false,
    error: "",
    abaAtiva: "inscricoes",
    modalInscricaoAberto: false,
    modalConfirmacaoAberto: false,
    isReiDaPraia: false,
    progresso: 50,
    carregarEtapa: jest.fn(),
    handleAbrirInscricoes: jest.fn(),
    handleEncerrarInscricoes: jest.fn(),
    handleFinalizarEtapa: jest.fn(),
    handleCancelarInscricao: jest.fn(),
    handleCancelarMultiplosInscricoes: jest.fn(),
    handleGerarChaves: jest.fn(),
    handleApagarChaves: jest.fn(),
    setAbaAtiva: jest.fn(),
    setModalInscricaoAberto: jest.fn(),
    setModalConfirmacaoAberto: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDetalhesEtapa.mockReturnValue(defaultMockReturn);
  });

  describe("Estado de loading", () => {
    it("deve renderizar spinner durante carregamento", () => {
      mockUseDetalhesEtapa.mockReturnValue({
        ...defaultMockReturn,
        etapa: null,
        loading: true,
      });

      renderWithRouter(<DetalhesEtapa />);

      expect(screen.getByText("Carregando etapa...")).toBeInTheDocument();
    });
  });

  describe("Estado de erro", () => {
    it("deve renderizar mensagem de erro", () => {
      mockUseDetalhesEtapa.mockReturnValue({
        ...defaultMockReturn,
        etapa: null,
        loading: false,
        error: "Etapa não encontrada",
      });

      renderWithRouter(<DetalhesEtapa />);

      expect(screen.getByText("Etapa não encontrada")).toBeInTheDocument();
    });

    it("deve renderizar mensagem padrão quando etapa é null sem erro", () => {
      mockUseDetalhesEtapa.mockReturnValue({
        ...defaultMockReturn,
        etapa: null,
        loading: false,
        error: "",
      });

      renderWithRouter(<DetalhesEtapa />);

      expect(screen.getByText("Etapa não encontrada")).toBeInTheDocument();
    });

    it("deve renderizar botão para voltar às etapas", () => {
      mockUseDetalhesEtapa.mockReturnValue({
        ...defaultMockReturn,
        etapa: null,
        loading: false,
        error: "Erro",
      });

      renderWithRouter(<DetalhesEtapa />);

      expect(screen.getByText("← Voltar para etapas")).toBeInTheDocument();
    });

    it("deve navegar ao clicar em voltar", () => {
      mockUseDetalhesEtapa.mockReturnValue({
        ...defaultMockReturn,
        etapa: null,
        loading: false,
        error: "Erro",
      });

      renderWithRouter(<DetalhesEtapa />);

      fireEvent.click(screen.getByText("← Voltar para etapas"));

      expect(mockNavigate).toHaveBeenCalledWith("/admin/etapas");
    });
  });

  describe("Renderização com sucesso", () => {
    it("deve renderizar EtapaHeader", () => {
      renderWithRouter(<DetalhesEtapa />);

      expect(screen.getByTestId("etapa-header")).toBeInTheDocument();
      expect(screen.getByText("Etapa Teste")).toBeInTheDocument();
    });

    it("deve renderizar EtapaInfoCards", () => {
      renderWithRouter(<DetalhesEtapa />);

      expect(screen.getByTestId("etapa-info-cards")).toBeInTheDocument();
      expect(screen.getByText("Progresso: 50%")).toBeInTheDocument();
    });

    it("deve renderizar ActionsSection", () => {
      renderWithRouter(<DetalhesEtapa />);

      expect(screen.getByTestId("actions-section")).toBeInTheDocument();
    });

    it("deve renderizar Footer", () => {
      renderWithRouter(<DetalhesEtapa />);

      expect(screen.getByTestId("footer")).toBeInTheDocument();
    });
  });

  describe("Tabs", () => {
    it("deve renderizar tab de Inscrições", () => {
      renderWithRouter(<DetalhesEtapa />);

      expect(screen.getByText("Inscrições")).toBeInTheDocument();
    });

    it("deve renderizar tab de Cabeças de Chave", () => {
      renderWithRouter(<DetalhesEtapa />);

      expect(screen.getByText("Cabeças de Chave")).toBeInTheDocument();
    });

    it("não deve renderizar tab de Chaves quando chaves não geradas", () => {
      renderWithRouter(<DetalhesEtapa />);

      expect(screen.queryByText("Chaves/Grupos")).not.toBeInTheDocument();
    });

    it("deve renderizar tab de Chaves quando chaves geradas", () => {
      mockUseDetalhesEtapa.mockReturnValue({
        ...defaultMockReturn,
        etapa: { ...mockEtapa, chavesGeradas: true },
      });

      renderWithRouter(<DetalhesEtapa />);

      expect(screen.getByText("Chaves/Grupos")).toBeInTheDocument();
    });

    it("deve exibir badge com total de inscritos", () => {
      renderWithRouter(<DetalhesEtapa />);

      expect(screen.getByText("8")).toBeInTheDocument();
    });
  });

  describe("Conteúdo das Tabs", () => {
    it("deve renderizar InscricoesTab quando aba inscricoes ativa", () => {
      renderWithRouter(<DetalhesEtapa />);

      expect(screen.getByTestId("inscricoes-tab")).toBeInTheDocument();
    });

    it("deve renderizar CabecasTab quando aba cabeças ativa", () => {
      mockUseDetalhesEtapa.mockReturnValue({
        ...defaultMockReturn,
        abaAtiva: "cabeças",
      });

      renderWithRouter(<DetalhesEtapa />);

      expect(screen.getByTestId("cabecas-tab")).toBeInTheDocument();
    });

    it("deve renderizar ChavesEtapa para Dupla Fixa quando aba chaves ativa", () => {
      mockUseDetalhesEtapa.mockReturnValue({
        ...defaultMockReturn,
        etapa: { ...mockEtapa, chavesGeradas: true },
        abaAtiva: "chaves",
        isReiDaPraia: false,
      });

      renderWithRouter(<DetalhesEtapa />);

      expect(screen.getByTestId("chaves-etapa")).toBeInTheDocument();
    });

    it("deve renderizar ChavesReiDaPraia quando aba chaves ativa e é Rei da Praia", () => {
      mockUseDetalhesEtapa.mockReturnValue({
        ...defaultMockReturn,
        etapa: { ...mockEtapa, chavesGeradas: true, formato: FormatoEtapa.REI_DA_PRAIA },
        abaAtiva: "chaves",
        isReiDaPraia: true,
      });

      renderWithRouter(<DetalhesEtapa />);

      expect(screen.getByTestId("chaves-rei-da-praia")).toBeInTheDocument();
    });
  });

  describe("Navegação de tabs", () => {
    it("deve chamar setAbaAtiva ao clicar em tab", () => {
      const mockSetAbaAtiva = jest.fn();
      mockUseDetalhesEtapa.mockReturnValue({
        ...defaultMockReturn,
        setAbaAtiva: mockSetAbaAtiva,
      });

      renderWithRouter(<DetalhesEtapa />);

      fireEvent.click(screen.getByText("Cabeças de Chave"));

      expect(mockSetAbaAtiva).toHaveBeenCalledWith("cabeças");
    });
  });

  describe("Modais", () => {
    it("não deve renderizar modal de inscrição quando fechado", () => {
      renderWithRouter(<DetalhesEtapa />);

      expect(screen.queryByTestId("modal-inscricao")).not.toBeInTheDocument();
    });

    it("deve renderizar modal de inscrição quando aberto", () => {
      mockUseDetalhesEtapa.mockReturnValue({
        ...defaultMockReturn,
        modalInscricaoAberto: true,
      });

      renderWithRouter(<DetalhesEtapa />);

      expect(screen.getByTestId("modal-inscricao")).toBeInTheDocument();
    });

    it("não deve renderizar modal de confirmação quando fechado", () => {
      renderWithRouter(<DetalhesEtapa />);

      expect(screen.queryByTestId("modal-confirmacao")).not.toBeInTheDocument();
    });

    it("deve renderizar modal de confirmação quando aberto", () => {
      mockUseDetalhesEtapa.mockReturnValue({
        ...defaultMockReturn,
        modalConfirmacaoAberto: true,
      });

      renderWithRouter(<DetalhesEtapa />);

      expect(screen.getByTestId("modal-confirmacao")).toBeInTheDocument();
    });
  });

  describe("Actions", () => {
    it("deve chamar handleAbrirInscricoes", () => {
      const mockHandleAbrirInscricoes = jest.fn();
      mockUseDetalhesEtapa.mockReturnValue({
        ...defaultMockReturn,
        handleAbrirInscricoes: mockHandleAbrirInscricoes,
      });

      renderWithRouter(<DetalhesEtapa />);

      fireEvent.click(screen.getByTestId("btn-abrir-inscricoes"));

      expect(mockHandleAbrirInscricoes).toHaveBeenCalled();
    });

    it("deve chamar handleEncerrarInscricoes", () => {
      const mockHandleEncerrarInscricoes = jest.fn();
      mockUseDetalhesEtapa.mockReturnValue({
        ...defaultMockReturn,
        handleEncerrarInscricoes: mockHandleEncerrarInscricoes,
      });

      renderWithRouter(<DetalhesEtapa />);

      fireEvent.click(screen.getByTestId("btn-encerrar-inscricoes"));

      expect(mockHandleEncerrarInscricoes).toHaveBeenCalled();
    });

    it("deve chamar handleGerarChaves", () => {
      const mockHandleGerarChaves = jest.fn();
      mockUseDetalhesEtapa.mockReturnValue({
        ...defaultMockReturn,
        handleGerarChaves: mockHandleGerarChaves,
      });

      renderWithRouter(<DetalhesEtapa />);

      fireEvent.click(screen.getByTestId("btn-gerar-chaves"));

      expect(mockHandleGerarChaves).toHaveBeenCalled();
    });
  });

  describe("Navegação de edição", () => {
    it("deve navegar para edição ao clicar em Editar", () => {
      renderWithRouter(<DetalhesEtapa />);

      fireEvent.click(screen.getByTestId("btn-editar"));

      expect(mockNavigate).toHaveBeenCalledWith("/admin/etapas/etapa-123/editar");
    });
  });

  describe("Formato da etapa", () => {
    it("deve exibir Dupla Fixa quando não é Rei da Praia", () => {
      renderWithRouter(<DetalhesEtapa />);

      expect(screen.getByText("Formato: Dupla Fixa")).toBeInTheDocument();
    });

    it("deve exibir Rei da Praia quando é Rei da Praia", () => {
      mockUseDetalhesEtapa.mockReturnValue({
        ...defaultMockReturn,
        isReiDaPraia: true,
      });

      renderWithRouter(<DetalhesEtapa />);

      expect(screen.getByText("Formato: Rei da Praia")).toBeInTheDocument();
    });
  });

  describe("Exclusão de etapa", () => {
    const mockConfirm = jest.fn();
    const mockAlert = jest.fn();
    const mockDeletar = jest.fn();

    beforeEach(() => {
      window.confirm = mockConfirm;
      window.alert = mockAlert;
      jest.requireMock("@/services").getEtapaService = () => ({
        deletar: mockDeletar,
      });
    });

    it("deve cancelar exclusão quando usuário não confirma", () => {
      mockConfirm.mockReturnValue(false);

      renderWithRouter(<DetalhesEtapa />);

      fireEvent.click(screen.getByTestId("btn-excluir"));

      expect(mockNavigate).not.toHaveBeenCalledWith("/admin/etapas");
    });

    it("deve excluir etapa quando usuário confirma", async () => {
      mockConfirm.mockReturnValue(true);
      mockDeletar.mockResolvedValue({});

      renderWithRouter(<DetalhesEtapa />);

      fireEvent.click(screen.getByTestId("btn-excluir"));

      // Aguardar a exclusão
      await screen.findByTestId("etapa-header");

      expect(mockConfirm).toHaveBeenCalled();
    });
  });

  describe("Callbacks dos Actions", () => {
    it("deve chamar setAbaAtiva ao clicar em Ver Chaves", () => {
      const mockSetAbaAtiva = jest.fn();
      mockUseDetalhesEtapa.mockReturnValue({
        ...defaultMockReturn,
        setAbaAtiva: mockSetAbaAtiva,
      });

      renderWithRouter(<DetalhesEtapa />);

      fireEvent.click(screen.getByTestId("btn-ver-chaves"));

      expect(mockSetAbaAtiva).toHaveBeenCalledWith("chaves");
    });

    it("deve abrir modal de confirmação ao clicar em Apagar Chaves", () => {
      const mockSetModalConfirmacaoAberto = jest.fn();
      mockUseDetalhesEtapa.mockReturnValue({
        ...defaultMockReturn,
        setModalConfirmacaoAberto: mockSetModalConfirmacaoAberto,
      });

      renderWithRouter(<DetalhesEtapa />);

      fireEvent.click(screen.getByTestId("btn-apagar-chaves"));

      // Deve chamar setModalConfirmacaoAberto(true) para abrir o modal
      expect(mockSetModalConfirmacaoAberto).toHaveBeenCalledWith(true);
    });

    it("deve chamar handleFinalizarEtapa", () => {
      const mockHandleFinalizarEtapa = jest.fn();
      mockUseDetalhesEtapa.mockReturnValue({
        ...defaultMockReturn,
        handleFinalizarEtapa: mockHandleFinalizarEtapa,
      });

      renderWithRouter(<DetalhesEtapa />);

      fireEvent.click(screen.getByTestId("btn-finalizar-etapa"));

      expect(mockHandleFinalizarEtapa).toHaveBeenCalled();
    });
  });

  describe("Callbacks da InscricoesTab", () => {
    it("deve abrir modal de inscrição", () => {
      const mockSetModalInscricaoAberto = jest.fn();
      mockUseDetalhesEtapa.mockReturnValue({
        ...defaultMockReturn,
        setModalInscricaoAberto: mockSetModalInscricaoAberto,
      });

      renderWithRouter(<DetalhesEtapa />);

      fireEvent.click(screen.getByTestId("btn-nova-inscricao"));

      expect(mockSetModalInscricaoAberto).toHaveBeenCalledWith(true);
    });

    it("deve chamar handleCancelarInscricao", () => {
      const mockHandleCancelarInscricao = jest.fn();
      mockUseDetalhesEtapa.mockReturnValue({
        ...defaultMockReturn,
        handleCancelarInscricao: mockHandleCancelarInscricao,
      });

      renderWithRouter(<DetalhesEtapa />);

      fireEvent.click(screen.getByTestId("btn-cancelar-inscricao"));

      expect(mockHandleCancelarInscricao).toHaveBeenCalledWith("inscricao-1");
    });

    it("deve chamar handleCancelarMultiplosInscricoes", () => {
      const mockHandleCancelarMultiplos = jest.fn();
      mockUseDetalhesEtapa.mockReturnValue({
        ...defaultMockReturn,
        handleCancelarMultiplosInscricoes: mockHandleCancelarMultiplos,
      });

      renderWithRouter(<DetalhesEtapa />);

      fireEvent.click(screen.getByTestId("btn-cancelar-multiplos"));

      expect(mockHandleCancelarMultiplos).toHaveBeenCalledWith(["ins-1", "ins-2"]);
    });
  });

  describe("Callbacks da CabecasTab", () => {
    it("deve chamar carregarEtapa ao atualizar", () => {
      const mockCarregarEtapa = jest.fn();
      mockUseDetalhesEtapa.mockReturnValue({
        ...defaultMockReturn,
        abaAtiva: "cabeças",
        carregarEtapa: mockCarregarEtapa,
      });

      renderWithRouter(<DetalhesEtapa />);

      fireEvent.click(screen.getByTestId("btn-update-cabecas"));

      expect(mockCarregarEtapa).toHaveBeenCalled();
    });
  });

  describe("Modal de Inscrição callbacks", () => {
    it("deve fechar modal ao clicar em fechar", () => {
      const mockSetModalInscricaoAberto = jest.fn();
      mockUseDetalhesEtapa.mockReturnValue({
        ...defaultMockReturn,
        modalInscricaoAberto: true,
        setModalInscricaoAberto: mockSetModalInscricaoAberto,
      });

      renderWithRouter(<DetalhesEtapa />);

      fireEvent.click(screen.getByTestId("btn-fechar-modal"));

      expect(mockSetModalInscricaoAberto).toHaveBeenCalledWith(false);
    });

    it("deve chamar carregarEtapa e fechar modal ao confirmar inscrição", async () => {
      const mockCarregarEtapa = jest.fn().mockResolvedValue(undefined);
      const mockSetModalInscricaoAberto = jest.fn();
      mockUseDetalhesEtapa.mockReturnValue({
        ...defaultMockReturn,
        modalInscricaoAberto: true,
        carregarEtapa: mockCarregarEtapa,
        setModalInscricaoAberto: mockSetModalInscricaoAberto,
      });

      renderWithRouter(<DetalhesEtapa />);

      fireEvent.click(screen.getByTestId("btn-confirmar-inscricao"));

      await screen.findByTestId("modal-inscricao");

      expect(mockCarregarEtapa).toHaveBeenCalled();
    });
  });

  describe("Modal de Confirmação callbacks", () => {
    it("deve fechar modal ao cancelar", () => {
      const mockSetModalConfirmacaoAberto = jest.fn();
      mockUseDetalhesEtapa.mockReturnValue({
        ...defaultMockReturn,
        modalConfirmacaoAberto: true,
        setModalConfirmacaoAberto: mockSetModalConfirmacaoAberto,
      });

      renderWithRouter(<DetalhesEtapa />);

      fireEvent.click(screen.getByTestId("btn-cancelar-confirmacao"));

      expect(mockSetModalConfirmacaoAberto).toHaveBeenCalledWith(false);
    });

    it("deve chamar handleApagarChaves e fechar modal ao confirmar", async () => {
      const mockHandleApagarChaves = jest.fn().mockResolvedValue(undefined);
      const mockSetModalConfirmacaoAberto = jest.fn();
      mockUseDetalhesEtapa.mockReturnValue({
        ...defaultMockReturn,
        modalConfirmacaoAberto: true,
        handleApagarChaves: mockHandleApagarChaves,
        setModalConfirmacaoAberto: mockSetModalConfirmacaoAberto,
      });

      renderWithRouter(<DetalhesEtapa />);

      fireEvent.click(screen.getByTestId("btn-confirmar-exclusao"));

      await screen.findByTestId("modal-confirmacao");

      expect(mockHandleApagarChaves).toHaveBeenCalled();
    });
  });

  describe("Tab de Chaves click", () => {
    it("deve chamar setAbaAtiva ao clicar na tab de chaves", () => {
      const mockSetAbaAtiva = jest.fn();
      mockUseDetalhesEtapa.mockReturnValue({
        ...defaultMockReturn,
        etapa: { ...mockEtapa, chavesGeradas: true },
        setAbaAtiva: mockSetAbaAtiva,
      });

      renderWithRouter(<DetalhesEtapa />);

      fireEvent.click(screen.getByText("Chaves/Grupos"));

      expect(mockSetAbaAtiva).toHaveBeenCalledWith("chaves");
    });

    it("deve exibir badge com quantidade de grupos na tab de chaves", () => {
      mockUseDetalhesEtapa.mockReturnValue({
        ...defaultMockReturn,
        etapa: { ...mockEtapa, chavesGeradas: true, qtdGrupos: 4 },
      });

      renderWithRouter(<DetalhesEtapa />);

      expect(screen.getByText("4")).toBeInTheDocument();
    });

    it("deve exibir 0 quando qtdGrupos é undefined", () => {
      mockUseDetalhesEtapa.mockReturnValue({
        ...defaultMockReturn,
        etapa: { ...mockEtapa, chavesGeradas: true, qtdGrupos: undefined },
      });

      renderWithRouter(<DetalhesEtapa />);

      expect(screen.getByText("0")).toBeInTheDocument();
    });
  });
});
