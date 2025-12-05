/**
 * Testes de renderização da página EtapaDetalhe (pública)
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { useEtapaDetalhe } from "@/pages/EtapaDetalhe/hooks/useEtapaDetalhe";
import EtapaDetalhe from "@/pages/EtapaDetalhe";

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

// Mock do useDocumentTitle
jest.mock("@/hooks", () => ({
  useDocumentTitle: jest.fn(),
}));

// Mock do react-router-dom
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: () => ({ slug: "arena-teste", etapaId: "etapa-1" }),
  useNavigate: () => mockNavigate,
}));

// Mock do hook useEtapaDetalhe para testes de renderização
jest.mock("@/pages/EtapaDetalhe/hooks/useEtapaDetalhe", () => ({
  useEtapaDetalhe: jest.fn(),
}));

// Mock dos componentes filhos
jest.mock("@/pages/EtapaDetalhe/components/EtapaHeader", () => ({
  EtapaHeader: ({ arenaName, etapa, onBack }: any) => (
    <div data-testid="etapa-header">
      <span>Arena: {arenaName}</span>
      <span>Etapa: {etapa.nome}</span>
      <button onClick={onBack} data-testid="btn-voltar">Voltar</button>
    </div>
  ),
}));

jest.mock("@/pages/EtapaDetalhe/components/EtapaInfo", () => ({
  EtapaInfo: ({ etapa, totalJogadores }: any) => (
    <div data-testid="etapa-info">
      <span>Total: {totalJogadores}</span>
    </div>
  ),
}));

jest.mock("@/pages/EtapaDetalhe/components/JogadoresList", () => ({
  JogadoresList: ({ jogadores }: any) => (
    <div data-testid="jogadores-list">
      <span>Jogadores: {jogadores.length}</span>
    </div>
  ),
}));

jest.mock("@/components/visualizadores/BracketViewer", () => ({
  BracketViewer: ({ chaves }: any) => (
    <div data-testid="bracket-viewer">Bracket</div>
  ),
}));

jest.mock("@/components/visualizadores/GruposViewer", () => ({
  GruposViewer: ({ grupos }: any) => (
    <div data-testid="grupos-viewer">Grupos: {grupos.length}</div>
  ),
}));

// ============================================
// TESTES DE RENDERIZAÇÃO DA PÁGINA ETAPADETALHE
// ============================================

describe("EtapaDetalhe - Renderização da Página", () => {
  const mockUseEtapaDetalhe = useEtapaDetalhe as jest.Mock;

  const mockArenaData = {
    id: "arena-1",
    nome: "Arena Teste",
    slug: "arena-teste",
  };

  const mockEtapaData = {
    id: "etapa-1",
    nome: "Etapa 1",
    formato: "DUPLA_FIXA",
    status: "ABERTA",
    maxJogadores: 16,
    totalInscritos: 8,
  };

  const mockJogadoresData = [
    { id: "j1", nome: "João Silva", nivel: "INTERMEDIARIO" },
    { id: "j2", nome: "Maria Santos", nivel: "AVANCADO" },
  ];

  const mockGruposData = [
    { id: "g1", nome: "Grupo A", jogadores: ["j1", "j2"] },
    { id: "g2", nome: "Grupo B", jogadores: ["j3", "j4"] },
  ];

  const mockChavesData = {
    eliminatorias: [{ rodada: 1, partidas: [] }],
  };

  const defaultMockReturn = {
    arena: mockArenaData,
    etapa: mockEtapaData,
    jogadores: mockJogadoresData,
    grupos: [],
    chaves: null,
    loading: false,
    error: "",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseEtapaDetalhe.mockReturnValue(defaultMockReturn);
  });

  const renderPage = () => {
    return render(
      <MemoryRouter>
        <EtapaDetalhe />
      </MemoryRouter>
    );
  };

  describe("Estado de loading", () => {
    it("deve renderizar loading durante carregamento", () => {
      mockUseEtapaDetalhe.mockReturnValue({
        ...defaultMockReturn,
        arena: null,
        etapa: null,
        loading: true,
      });

      renderPage();

      expect(screen.getByText("Carregando...")).toBeInTheDocument();
    });

    it("não deve renderizar componentes durante loading", () => {
      mockUseEtapaDetalhe.mockReturnValue({
        ...defaultMockReturn,
        loading: true,
      });

      renderPage();

      expect(screen.queryByTestId("etapa-header")).not.toBeInTheDocument();
      expect(screen.queryByTestId("etapa-info")).not.toBeInTheDocument();
    });
  });

  describe("Estado de erro", () => {
    it("deve renderizar mensagem de erro", () => {
      mockUseEtapaDetalhe.mockReturnValue({
        ...defaultMockReturn,
        arena: null,
        etapa: null,
        error: "Etapa não encontrada",
      });

      renderPage();

      expect(screen.getByText("Etapa Não Encontrada")).toBeInTheDocument();
      expect(screen.getByText("Etapa não encontrada")).toBeInTheDocument();
    });

    it("deve renderizar mensagem padrão quando não tem erro específico", () => {
      mockUseEtapaDetalhe.mockReturnValue({
        ...defaultMockReturn,
        arena: null,
        etapa: null,
        error: "",
      });

      renderPage();

      expect(screen.getByText("Etapa Não Encontrada")).toBeInTheDocument();
      expect(
        screen.getByText("A etapa que você está procurando não existe.")
      ).toBeInTheDocument();
    });

    it("deve ter link para voltar à arena", () => {
      mockUseEtapaDetalhe.mockReturnValue({
        ...defaultMockReturn,
        arena: null,
        etapa: null,
        error: "Erro",
      });

      renderPage();

      const link = screen.getByText("Voltar para Arena");
      expect(link).toHaveAttribute("href", "/arena/arena-teste");
    });
  });

  describe("Renderização com sucesso", () => {
    it("deve renderizar EtapaHeader", () => {
      renderPage();

      expect(screen.getByTestId("etapa-header")).toBeInTheDocument();
    });

    it("deve renderizar EtapaInfo", () => {
      renderPage();

      expect(screen.getByTestId("etapa-info")).toBeInTheDocument();
    });

    it("deve renderizar JogadoresList", () => {
      renderPage();

      expect(screen.getByTestId("jogadores-list")).toBeInTheDocument();
    });

    it("deve exibir nome da arena no header", () => {
      renderPage();

      expect(screen.getByTestId("etapa-header")).toHaveTextContent(
        "Arena: Arena Teste"
      );
    });

    it("deve exibir nome da etapa no header", () => {
      renderPage();

      expect(screen.getByTestId("etapa-header")).toHaveTextContent(
        "Etapa: Etapa 1"
      );
    });

    it("deve exibir total de jogadores", () => {
      renderPage();

      expect(screen.getByTestId("etapa-info")).toHaveTextContent("Total: 2");
    });

    it("deve exibir lista de jogadores", () => {
      renderPage();

      expect(screen.getByTestId("jogadores-list")).toHaveTextContent(
        "Jogadores: 2"
      );
    });
  });

  describe("Grupos e Chaves", () => {
    it("não deve renderizar GruposViewer quando não há grupos", () => {
      renderPage();

      expect(screen.queryByTestId("grupos-viewer")).not.toBeInTheDocument();
    });

    it("deve renderizar GruposViewer quando há grupos", () => {
      mockUseEtapaDetalhe.mockReturnValue({
        ...defaultMockReturn,
        grupos: mockGruposData,
      });

      renderPage();

      expect(screen.getByTestId("grupos-viewer")).toBeInTheDocument();
      expect(screen.getByTestId("grupos-viewer")).toHaveTextContent("Grupos: 2");
    });

    it("não deve renderizar BracketViewer quando não há chaves", () => {
      renderPage();

      expect(screen.queryByTestId("bracket-viewer")).not.toBeInTheDocument();
    });

    it("deve renderizar BracketViewer quando há chaves", () => {
      mockUseEtapaDetalhe.mockReturnValue({
        ...defaultMockReturn,
        chaves: mockChavesData,
      });

      renderPage();

      expect(screen.getByTestId("bracket-viewer")).toBeInTheDocument();
    });
  });

  describe("Navegação", () => {
    it("deve chamar navigate ao clicar em voltar", () => {
      renderPage();

      fireEvent.click(screen.getByTestId("btn-voltar"));

      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
  });
});
