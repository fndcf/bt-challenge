/**
 * Testes de renderização da página ListagemEtapas
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { useListagemEtapas } from "@/pages/ListagemEtapas/hooks/useListagemEtapas";
import ListagemEtapas from "@/pages/ListagemEtapas";

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

// Mock do react-router-dom
const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// Mock do hook useListagemEtapas
jest.mock("@/pages/ListagemEtapas/hooks/useListagemEtapas", () => ({
  useListagemEtapas: jest.fn(),
}));

// Mock dos componentes filhos
jest.mock("@/pages/ListagemEtapas/components/PageHeader", () => ({
  PageHeader: ({ onCriarClick }: any) => (
    <div data-testid="page-header">
      <h1>Etapas</h1>
      <button onClick={onCriarClick} data-testid="criar-btn">
        Criar Etapa
      </button>
    </div>
  ),
}));

jest.mock("@/pages/ListagemEtapas/components/StatsCards", () => ({
  StatsCards: ({ stats }: any) => (
    <div data-testid="stats-cards">
      <span>Total: {stats.totalEtapas}</span>
      <span>Abertas: {stats.inscricoesAbertas}</span>
      <span>Em Andamento: {stats.emAndamento}</span>
      <span>Finalizadas: {stats.finalizadas}</span>
    </div>
  ),
}));

jest.mock("@/pages/ListagemEtapas/components/FiltersBar", () => ({
  FiltersBar: ({
    filtroStatus,
    filtroFormato,
    filtroNivel,
    filtroGenero,
    ordenacao,
    onStatusChange,
    onFormatoChange,
    onNivelChange,
    onGeneroChange,
    onOrdenacaoChange,
    onLimparFiltros,
    temFiltrosAtivos,
  }: any) => (
    <div data-testid="filters-bar">
      <span>Status: {filtroStatus || "todos"}</span>
      <span>Formato: {filtroFormato || "todos"}</span>
      <span>Nível: {filtroNivel || "todos"}</span>
      <span>Gênero: {filtroGenero || "todos"}</span>
      <span>Ordenação: {ordenacao}</span>
      <button onClick={() => onStatusChange("aberta")} data-testid="filtro-status-btn">
        Filtrar Aberta
      </button>
      <button onClick={() => onFormatoChange("dupla_fixa")} data-testid="filtro-formato-btn">
        Filtrar Dupla Fixa
      </button>
      <button onClick={() => onNivelChange("A")} data-testid="filtro-nivel-btn">
        Filtrar Nível A
      </button>
      <button onClick={() => onGeneroChange("masculino")} data-testid="filtro-genero-btn">
        Filtrar Masculino
      </button>
      <button onClick={() => onOrdenacaoChange("criadoEm")} data-testid="ordenacao-btn">
        Ordenar por Data Criação
      </button>
      {temFiltrosAtivos && (
        <button onClick={onLimparFiltros} data-testid="limpar-filtros-btn">
          Limpar Filtros
        </button>
      )}
    </div>
  ),
}));

jest.mock("@/pages/ListagemEtapas/components/EtapasList", () => ({
  EtapasList: ({ etapas, loading, error, temFiltrosAtivos, onCriarClick }: any) => (
    <div data-testid="etapas-list">
      {loading && <span data-testid="loading">Carregando...</span>}
      {error && <span data-testid="error">{error}</span>}
      {!loading && !error && etapas.length === 0 && (
        <div data-testid="empty-state">
          <span>Nenhuma etapa encontrada</span>
          {!temFiltrosAtivos && (
            <button onClick={onCriarClick} data-testid="criar-primeira-btn">
              Criar primeira etapa
            </button>
          )}
        </div>
      )}
      {!loading && !error && etapas.length > 0 && (
        <ul data-testid="etapas-items">
          {etapas.map((etapa: any) => (
            <li key={etapa.id} data-testid={`etapa-${etapa.id}`}>
              {etapa.nome}
            </li>
          ))}
        </ul>
      )}
    </div>
  ),
}));

jest.mock("@/pages/ListagemEtapas/components/Pagination", () => ({
  Pagination: ({
    paginaAtual,
    totalPaginas,
    totalEtapas,
    etapasPorPagina,
    onProximaPagina,
    onPaginaAnterior,
    onIrParaPagina,
  }: any) => (
    <div data-testid="pagination">
      <span>
        Página {paginaAtual} de {totalPaginas}
      </span>
      <span>Total: {totalEtapas} etapas</span>
      <button
        onClick={onPaginaAnterior}
        disabled={paginaAtual <= 1}
        data-testid="prev-page-btn"
      >
        Anterior
      </button>
      <button
        onClick={onProximaPagina}
        disabled={paginaAtual >= totalPaginas}
        data-testid="next-page-btn"
      >
        Próxima
      </button>
      <button onClick={() => onIrParaPagina(2)} data-testid="goto-page-btn">
        Ir para página 2
      </button>
    </div>
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

describe("ListagemEtapas - Renderização", () => {
  const mockUseListagemEtapas = useListagemEtapas as jest.Mock;

  const defaultMockReturn = {
    etapas: [],
    loading: false,
    error: null,
    stats: {
      totalEtapas: 10,
      inscricoesAbertas: 3,
      emAndamento: 4,
      finalizadas: 3,
      reiDaPraia: 5,
      duplaFixa: 5,
    },
    filtroStatus: "",
    filtroFormato: "",
    filtroNivel: "",
    filtroGenero: "",
    ordenacao: "dataRealizacao",
    paginaAtual: 1,
    totalPaginas: 1,
    totalEtapas: 0,
    etapasPorPagina: 12,
    setFiltroStatus: jest.fn(),
    setFiltroFormato: jest.fn(),
    setFiltroNivel: jest.fn(),
    setFiltroGenero: jest.fn(),
    setOrdenacao: jest.fn(),
    limparFiltros: jest.fn(),
    proximaPagina: jest.fn(),
    paginaAnterior: jest.fn(),
    irParaPagina: jest.fn(),
    recarregar: jest.fn(),
    temFiltrosAtivos: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseListagemEtapas.mockReturnValue(defaultMockReturn);
  });

  describe("Estrutura básica", () => {
    it("deve renderizar o header", () => {
      renderWithRouter(<ListagemEtapas />);

      expect(screen.getByTestId("page-header")).toBeInTheDocument();
    });

    it("deve renderizar cards de estatísticas", () => {
      renderWithRouter(<ListagemEtapas />);

      expect(screen.getByTestId("stats-cards")).toBeInTheDocument();
    });

    it("deve renderizar barra de filtros", () => {
      renderWithRouter(<ListagemEtapas />);

      expect(screen.getByTestId("filters-bar")).toBeInTheDocument();
    });

    it("deve renderizar lista de etapas", () => {
      renderWithRouter(<ListagemEtapas />);

      expect(screen.getByTestId("etapas-list")).toBeInTheDocument();
    });

    it("deve renderizar paginação", () => {
      renderWithRouter(<ListagemEtapas />);

      expect(screen.getByTestId("pagination")).toBeInTheDocument();
    });

    it("deve renderizar footer", () => {
      renderWithRouter(<ListagemEtapas />);

      expect(screen.getByTestId("footer")).toBeInTheDocument();
    });
  });

  describe("Estatísticas", () => {
    it("deve exibir estatísticas corretas", () => {
      renderWithRouter(<ListagemEtapas />);

      expect(screen.getByText("Total: 10")).toBeInTheDocument();
      expect(screen.getByText("Abertas: 3")).toBeInTheDocument();
      expect(screen.getByText("Em Andamento: 4")).toBeInTheDocument();
      expect(screen.getByText("Finalizadas: 3")).toBeInTheDocument();
    });
  });

  describe("Estados de loading", () => {
    it("deve mostrar loading quando carregando", () => {
      mockUseListagemEtapas.mockReturnValue({
        ...defaultMockReturn,
        loading: true,
      });

      renderWithRouter(<ListagemEtapas />);

      expect(screen.getByTestId("loading")).toBeInTheDocument();
    });

    it("não deve mostrar loading quando não está carregando", () => {
      renderWithRouter(<ListagemEtapas />);

      expect(screen.queryByTestId("loading")).not.toBeInTheDocument();
    });
  });

  describe("Estados de erro", () => {
    it("deve mostrar erro quando há erro", () => {
      mockUseListagemEtapas.mockReturnValue({
        ...defaultMockReturn,
        error: "Erro ao carregar etapas",
      });

      renderWithRouter(<ListagemEtapas />);

      expect(screen.getByTestId("error")).toBeInTheDocument();
      expect(screen.getByText("Erro ao carregar etapas")).toBeInTheDocument();
    });

    it("não deve mostrar erro quando não há erro", () => {
      renderWithRouter(<ListagemEtapas />);

      expect(screen.queryByTestId("error")).not.toBeInTheDocument();
    });
  });

  describe("Lista de etapas", () => {
    it("deve mostrar estado vazio quando não há etapas", () => {
      renderWithRouter(<ListagemEtapas />);

      expect(screen.getByTestId("empty-state")).toBeInTheDocument();
      expect(screen.getByText("Nenhuma etapa encontrada")).toBeInTheDocument();
    });

    it("deve mostrar botão criar primeira etapa quando lista vazia e sem filtros", () => {
      renderWithRouter(<ListagemEtapas />);

      expect(screen.getByTestId("criar-primeira-btn")).toBeInTheDocument();
    });

    it("não deve mostrar botão criar primeira etapa quando há filtros ativos", () => {
      mockUseListagemEtapas.mockReturnValue({
        ...defaultMockReturn,
        temFiltrosAtivos: true,
      });

      renderWithRouter(<ListagemEtapas />);

      expect(screen.queryByTestId("criar-primeira-btn")).not.toBeInTheDocument();
    });

    it("deve mostrar lista de etapas quando há etapas", () => {
      mockUseListagemEtapas.mockReturnValue({
        ...defaultMockReturn,
        etapas: [
          { id: "1", nome: "Etapa 1" },
          { id: "2", nome: "Etapa 2" },
          { id: "3", nome: "Etapa 3" },
        ],
        totalEtapas: 3,
      });

      renderWithRouter(<ListagemEtapas />);

      expect(screen.getByTestId("etapas-items")).toBeInTheDocument();
      expect(screen.getByTestId("etapa-1")).toBeInTheDocument();
      expect(screen.getByTestId("etapa-2")).toBeInTheDocument();
      expect(screen.getByTestId("etapa-3")).toBeInTheDocument();
    });
  });

  describe("Filtros", () => {
    it("deve exibir valores de filtros atuais", () => {
      renderWithRouter(<ListagemEtapas />);

      expect(screen.getByText("Status: todos")).toBeInTheDocument();
      expect(screen.getByText("Formato: todos")).toBeInTheDocument();
      expect(screen.getByText("Nível: todos")).toBeInTheDocument();
      expect(screen.getByText("Gênero: todos")).toBeInTheDocument();
    });

    it("deve chamar setFiltroStatus ao clicar no botão de filtro", () => {
      const mockSetFiltroStatus = jest.fn();
      mockUseListagemEtapas.mockReturnValue({
        ...defaultMockReturn,
        setFiltroStatus: mockSetFiltroStatus,
      });

      renderWithRouter(<ListagemEtapas />);

      fireEvent.click(screen.getByTestId("filtro-status-btn"));

      expect(mockSetFiltroStatus).toHaveBeenCalledWith("aberta");
    });

    it("deve chamar setFiltroFormato ao clicar no botão de filtro", () => {
      const mockSetFiltroFormato = jest.fn();
      mockUseListagemEtapas.mockReturnValue({
        ...defaultMockReturn,
        setFiltroFormato: mockSetFiltroFormato,
      });

      renderWithRouter(<ListagemEtapas />);

      fireEvent.click(screen.getByTestId("filtro-formato-btn"));

      expect(mockSetFiltroFormato).toHaveBeenCalledWith("dupla_fixa");
    });

    it("deve chamar setFiltroNivel ao clicar no botão de filtro", () => {
      const mockSetFiltroNivel = jest.fn();
      mockUseListagemEtapas.mockReturnValue({
        ...defaultMockReturn,
        setFiltroNivel: mockSetFiltroNivel,
      });

      renderWithRouter(<ListagemEtapas />);

      fireEvent.click(screen.getByTestId("filtro-nivel-btn"));

      expect(mockSetFiltroNivel).toHaveBeenCalledWith("A");
    });

    it("deve chamar setFiltroGenero ao clicar no botão de filtro", () => {
      const mockSetFiltroGenero = jest.fn();
      mockUseListagemEtapas.mockReturnValue({
        ...defaultMockReturn,
        setFiltroGenero: mockSetFiltroGenero,
      });

      renderWithRouter(<ListagemEtapas />);

      fireEvent.click(screen.getByTestId("filtro-genero-btn"));

      expect(mockSetFiltroGenero).toHaveBeenCalledWith("masculino");
    });

    it("deve chamar setOrdenacao ao clicar no botão de ordenação", () => {
      const mockSetOrdenacao = jest.fn();
      mockUseListagemEtapas.mockReturnValue({
        ...defaultMockReturn,
        setOrdenacao: mockSetOrdenacao,
      });

      renderWithRouter(<ListagemEtapas />);

      fireEvent.click(screen.getByTestId("ordenacao-btn"));

      expect(mockSetOrdenacao).toHaveBeenCalledWith("criadoEm");
    });

    it("deve mostrar botão limpar filtros quando há filtros ativos", () => {
      mockUseListagemEtapas.mockReturnValue({
        ...defaultMockReturn,
        temFiltrosAtivos: true,
      });

      renderWithRouter(<ListagemEtapas />);

      expect(screen.getByTestId("limpar-filtros-btn")).toBeInTheDocument();
    });

    it("não deve mostrar botão limpar filtros quando não há filtros ativos", () => {
      renderWithRouter(<ListagemEtapas />);

      expect(screen.queryByTestId("limpar-filtros-btn")).not.toBeInTheDocument();
    });

    it("deve chamar limparFiltros ao clicar no botão", () => {
      const mockLimparFiltros = jest.fn();
      mockUseListagemEtapas.mockReturnValue({
        ...defaultMockReturn,
        temFiltrosAtivos: true,
        limparFiltros: mockLimparFiltros,
      });

      renderWithRouter(<ListagemEtapas />);

      fireEvent.click(screen.getByTestId("limpar-filtros-btn"));

      expect(mockLimparFiltros).toHaveBeenCalled();
    });
  });

  describe("Paginação", () => {
    it("deve exibir informações de paginação", () => {
      mockUseListagemEtapas.mockReturnValue({
        ...defaultMockReturn,
        paginaAtual: 1,
        totalPaginas: 5,
        totalEtapas: 50,
      });

      renderWithRouter(<ListagemEtapas />);

      expect(screen.getByText("Página 1 de 5")).toBeInTheDocument();
      expect(screen.getByText("Total: 50 etapas")).toBeInTheDocument();
    });

    it("deve chamar proximaPagina ao clicar no botão", () => {
      const mockProximaPagina = jest.fn();
      mockUseListagemEtapas.mockReturnValue({
        ...defaultMockReturn,
        paginaAtual: 1,
        totalPaginas: 5,
        proximaPagina: mockProximaPagina,
      });

      renderWithRouter(<ListagemEtapas />);

      fireEvent.click(screen.getByTestId("next-page-btn"));

      expect(mockProximaPagina).toHaveBeenCalled();
    });

    it("deve chamar paginaAnterior ao clicar no botão", () => {
      const mockPaginaAnterior = jest.fn();
      mockUseListagemEtapas.mockReturnValue({
        ...defaultMockReturn,
        paginaAtual: 2,
        totalPaginas: 5,
        paginaAnterior: mockPaginaAnterior,
      });

      renderWithRouter(<ListagemEtapas />);

      fireEvent.click(screen.getByTestId("prev-page-btn"));

      expect(mockPaginaAnterior).toHaveBeenCalled();
    });

    it("deve chamar irParaPagina ao clicar no botão", () => {
      const mockIrParaPagina = jest.fn();
      mockUseListagemEtapas.mockReturnValue({
        ...defaultMockReturn,
        paginaAtual: 1,
        totalPaginas: 5,
        irParaPagina: mockIrParaPagina,
      });

      renderWithRouter(<ListagemEtapas />);

      fireEvent.click(screen.getByTestId("goto-page-btn"));

      expect(mockIrParaPagina).toHaveBeenCalledWith(2);
    });

    it("deve desabilitar botão anterior na primeira página", () => {
      mockUseListagemEtapas.mockReturnValue({
        ...defaultMockReturn,
        paginaAtual: 1,
        totalPaginas: 5,
      });

      renderWithRouter(<ListagemEtapas />);

      expect(screen.getByTestId("prev-page-btn")).toBeDisabled();
    });

    it("deve desabilitar botão próxima na última página", () => {
      mockUseListagemEtapas.mockReturnValue({
        ...defaultMockReturn,
        paginaAtual: 5,
        totalPaginas: 5,
      });

      renderWithRouter(<ListagemEtapas />);

      expect(screen.getByTestId("next-page-btn")).toBeDisabled();
    });
  });

  describe("Navegação", () => {
    it("deve navegar para criar etapa ao clicar no botão do header", () => {
      renderWithRouter(<ListagemEtapas />);

      fireEvent.click(screen.getByTestId("criar-btn"));

      expect(mockNavigate).toHaveBeenCalledWith("/admin/etapas/criar");
    });

    it("deve navegar para criar etapa ao clicar no botão de estado vazio", () => {
      renderWithRouter(<ListagemEtapas />);

      fireEvent.click(screen.getByTestId("criar-primeira-btn"));

      expect(mockNavigate).toHaveBeenCalledWith("/admin/etapas/criar");
    });
  });
});
