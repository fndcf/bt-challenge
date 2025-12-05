/**
 * Testes de renderização da página Jogadores (ListagemJogadores)
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { useListagemJogadores } from "@/pages/Jogadores/hooks/useListagemJogadores";
import ListagemJogadores from "@/pages/Jogadores";

// Mock do scrollIntoView (não suportado pelo jsdom)
Element.prototype.scrollIntoView = jest.fn();

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

// Mock do hook useListagemJogadores
jest.mock("@/pages/Jogadores/hooks/useListagemJogadores", () => ({
  useListagemJogadores: jest.fn(),
}));

// Mock dos componentes filhos
jest.mock("@/pages/Jogadores/components/PageHeader", () => ({
  PageHeader: ({ title, subtitle }: any) => (
    <div data-testid="page-header">
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </div>
  ),
}));

jest.mock("@/pages/Jogadores/components/SearchBar", () => ({
  SearchBar: ({ value, onChange }: any) => (
    <div data-testid="search-bar">
      <input
        data-testid="search-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Buscar"
      />
    </div>
  ),
}));

jest.mock("@/pages/Jogadores/components/FiltersBar", () => ({
  FiltersBar: ({
    nivelFiltro,
    setNivelFiltro,
    statusFiltro,
    setStatusFiltro,
    generoFiltro,
    setGeneroFiltro,
    temFiltrosAtivos,
    onLimparFiltros,
  }: any) => (
    <div data-testid="filters-bar">
      <select
        data-testid="nivel-select"
        value={nivelFiltro}
        onChange={(e) => setNivelFiltro(e.target.value)}
      >
        <option value="">Todos</option>
        <option value="A">A</option>
        <option value="B">B</option>
      </select>
      <select
        data-testid="status-select"
        value={statusFiltro}
        onChange={(e) => setStatusFiltro(e.target.value)}
      >
        <option value="">Todos</option>
        <option value="ATIVO">Ativo</option>
        <option value="INATIVO">Inativo</option>
      </select>
      <select
        data-testid="genero-select"
        value={generoFiltro}
        onChange={(e) => setGeneroFiltro(e.target.value)}
      >
        <option value="">Todos</option>
        <option value="M">Masculino</option>
        <option value="F">Feminino</option>
      </select>
      {temFiltrosAtivos && (
        <button data-testid="limpar-filtros" onClick={onLimparFiltros}>
          Limpar
        </button>
      )}
    </div>
  ),
}));

jest.mock("@/pages/Jogadores/components/JogadoresList", () => ({
  JogadoresList: ({
    jogadores,
    loading,
    total,
    arenaSlug,
    temFiltrosAtivos,
    onDeletar,
  }: any) => (
    <div data-testid="jogadores-list">
      {loading ? (
        <span data-testid="loading">Carregando...</span>
      ) : (
        <>
          <span data-testid="total">Total: {total}</span>
          <span data-testid="arena-slug">Slug: {arenaSlug}</span>
          <ul>
            {jogadores.map((j: any) => (
              <li key={j.id} data-testid={`jogador-${j.id}`}>
                {j.nome}
                <button onClick={() => onDeletar(j)}>Deletar</button>
              </li>
            ))}
          </ul>
          {jogadores.length === 0 && !temFiltrosAtivos && (
            <span data-testid="empty-message">Nenhum jogador encontrado</span>
          )}
        </>
      )}
    </div>
  ),
}));

jest.mock("@/pages/Jogadores/components/Pagination", () => ({
  Pagination: ({
    paginaAtual,
    totalPaginas,
    temMais,
    offset,
    onPaginaAnterior,
    onProximaPagina,
  }: any) => (
    <div data-testid="pagination">
      <span data-testid="pagina-atual">Página {paginaAtual}</span>
      <span data-testid="total-paginas">de {totalPaginas}</span>
      <button
        data-testid="btn-anterior"
        onClick={onPaginaAnterior}
        disabled={offset === 0}
      >
        Anterior
      </button>
      <button
        data-testid="btn-proxima"
        onClick={onProximaPagina}
        disabled={!temMais}
      >
        Próxima
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
  return render(<MemoryRouter>{component}</MemoryRouter>);
};

describe("ListagemJogadores - Renderização", () => {
  const mockUseListagemJogadores = useListagemJogadores as jest.Mock;

  const mockArena = {
    id: "arena-1",
    nome: "Arena Teste",
    slug: "arena-teste",
  };

  const mockJogadores = [
    { id: "1", nome: "João Silva", nivel: "A", genero: "M", status: "ATIVO" },
    { id: "2", nome: "Maria Santos", nivel: "B", genero: "F", status: "ATIVO" },
  ];

  const defaultMockReturn = {
    jogadores: mockJogadores,
    loading: false,
    arena: mockArena,
    errorMessage: "",
    successMessage: "",
    setErrorMessage: jest.fn(),
    setSuccessMessage: jest.fn(),
    busca: "",
    setBusca: jest.fn(),
    nivelFiltro: "",
    setNivelFiltro: jest.fn(),
    statusFiltro: "",
    setStatusFiltro: jest.fn(),
    generoFiltro: "",
    setGeneroFiltro: jest.fn(),
    limparFiltros: jest.fn(),
    temFiltrosAtivos: false,
    total: 2,
    offset: 0,
    temMais: false,
    paginaAtual: 1,
    totalPaginas: 1,
    handlePaginaAnterior: jest.fn(),
    handleProximaPagina: jest.fn(),
    handleDeletarJogador: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseListagemJogadores.mockReturnValue(defaultMockReturn);
  });

  describe("Estrutura básica", () => {
    it("deve renderizar PageHeader", () => {
      renderWithRouter(<ListagemJogadores />);

      expect(screen.getByTestId("page-header")).toBeInTheDocument();
      expect(screen.getByText("Jogadores")).toBeInTheDocument();
      expect(
        screen.getByText("Gerencie os jogadores da sua arena")
      ).toBeInTheDocument();
    });

    it("deve renderizar SearchBar", () => {
      renderWithRouter(<ListagemJogadores />);

      expect(screen.getByTestId("search-bar")).toBeInTheDocument();
    });

    it("deve renderizar FiltersBar", () => {
      renderWithRouter(<ListagemJogadores />);

      expect(screen.getByTestId("filters-bar")).toBeInTheDocument();
    });

    it("deve renderizar JogadoresList", () => {
      renderWithRouter(<ListagemJogadores />);

      expect(screen.getByTestId("jogadores-list")).toBeInTheDocument();
    });

    it("deve renderizar Footer", () => {
      renderWithRouter(<ListagemJogadores />);

      expect(screen.getByTestId("footer")).toBeInTheDocument();
    });
  });

  describe("Paginação", () => {
    it("deve renderizar Pagination quando tem jogadores e não está carregando", () => {
      renderWithRouter(<ListagemJogadores />);

      expect(screen.getByTestId("pagination")).toBeInTheDocument();
    });

    it("não deve renderizar Pagination quando está carregando", () => {
      mockUseListagemJogadores.mockReturnValue({
        ...defaultMockReturn,
        loading: true,
      });

      renderWithRouter(<ListagemJogadores />);

      expect(screen.queryByTestId("pagination")).not.toBeInTheDocument();
    });

    it("não deve renderizar Pagination quando não tem jogadores", () => {
      mockUseListagemJogadores.mockReturnValue({
        ...defaultMockReturn,
        jogadores: [],
      });

      renderWithRouter(<ListagemJogadores />);

      expect(screen.queryByTestId("pagination")).not.toBeInTheDocument();
    });

    it("deve exibir página atual e total de páginas", () => {
      mockUseListagemJogadores.mockReturnValue({
        ...defaultMockReturn,
        paginaAtual: 2,
        totalPaginas: 5,
      });

      renderWithRouter(<ListagemJogadores />);

      expect(screen.getByText("Página 2")).toBeInTheDocument();
      expect(screen.getByText("de 5")).toBeInTheDocument();
    });
  });

  describe("Alertas", () => {
    it("não deve renderizar alertas quando não há mensagens", () => {
      renderWithRouter(<ListagemJogadores />);

      // Verifica que não há botões de fechar (×)
      expect(screen.queryByText("×")).not.toBeInTheDocument();
    });

    it("deve renderizar alerta de sucesso quando há successMessage", () => {
      mockUseListagemJogadores.mockReturnValue({
        ...defaultMockReturn,
        successMessage: "Jogador criado com sucesso!",
      });

      renderWithRouter(<ListagemJogadores />);

      expect(
        screen.getByText("Jogador criado com sucesso!")
      ).toBeInTheDocument();
    });

    it("deve renderizar alerta de erro quando há errorMessage", () => {
      mockUseListagemJogadores.mockReturnValue({
        ...defaultMockReturn,
        errorMessage: "Erro ao carregar jogadores",
      });

      renderWithRouter(<ListagemJogadores />);

      expect(screen.getByText("Erro ao carregar jogadores")).toBeInTheDocument();
    });

    it("deve chamar setSuccessMessage ao fechar alerta de sucesso", () => {
      const mockSetSuccessMessage = jest.fn();
      mockUseListagemJogadores.mockReturnValue({
        ...defaultMockReturn,
        successMessage: "Sucesso!",
        setSuccessMessage: mockSetSuccessMessage,
      });

      renderWithRouter(<ListagemJogadores />);

      // Encontrar o botão de fechar (×)
      const closeButtons = screen.getAllByText("×");
      fireEvent.click(closeButtons[0]);

      expect(mockSetSuccessMessage).toHaveBeenCalledWith("");
    });

    it("deve chamar setErrorMessage ao fechar alerta de erro", () => {
      const mockSetErrorMessage = jest.fn();
      mockUseListagemJogadores.mockReturnValue({
        ...defaultMockReturn,
        errorMessage: "Erro!",
        setErrorMessage: mockSetErrorMessage,
      });

      renderWithRouter(<ListagemJogadores />);

      const closeButtons = screen.getAllByText("×");
      fireEvent.click(closeButtons[0]);

      expect(mockSetErrorMessage).toHaveBeenCalledWith("");
    });
  });

  describe("Estado de Loading", () => {
    it("deve exibir loading quando carregando", () => {
      mockUseListagemJogadores.mockReturnValue({
        ...defaultMockReturn,
        loading: true,
        jogadores: [],
      });

      renderWithRouter(<ListagemJogadores />);

      expect(screen.getByTestId("loading")).toBeInTheDocument();
    });
  });

  describe("Lista de Jogadores", () => {
    it("deve exibir lista de jogadores", () => {
      renderWithRouter(<ListagemJogadores />);

      expect(screen.getByTestId("jogador-1")).toBeInTheDocument();
      expect(screen.getByTestId("jogador-2")).toBeInTheDocument();
    });

    it("deve exibir total de jogadores", () => {
      renderWithRouter(<ListagemJogadores />);

      expect(screen.getByText("Total: 2")).toBeInTheDocument();
    });

    it("deve exibir slug da arena", () => {
      renderWithRouter(<ListagemJogadores />);

      expect(screen.getByText("Slug: arena-teste")).toBeInTheDocument();
    });
  });

  describe("Interações - Busca", () => {
    it("deve chamar setBusca ao digitar na busca", () => {
      const mockSetBusca = jest.fn();
      mockUseListagemJogadores.mockReturnValue({
        ...defaultMockReturn,
        setBusca: mockSetBusca,
      });

      renderWithRouter(<ListagemJogadores />);

      fireEvent.change(screen.getByTestId("search-input"), {
        target: { value: "João" },
      });

      expect(mockSetBusca).toHaveBeenCalledWith("João");
    });
  });

  describe("Interações - Filtros", () => {
    it("deve chamar setNivelFiltro ao selecionar nível", () => {
      const mockSetNivelFiltro = jest.fn();
      mockUseListagemJogadores.mockReturnValue({
        ...defaultMockReturn,
        setNivelFiltro: mockSetNivelFiltro,
      });

      renderWithRouter(<ListagemJogadores />);

      fireEvent.change(screen.getByTestId("nivel-select"), {
        target: { value: "A" },
      });

      expect(mockSetNivelFiltro).toHaveBeenCalledWith("A");
    });

    it("deve chamar setStatusFiltro ao selecionar status", () => {
      const mockSetStatusFiltro = jest.fn();
      mockUseListagemJogadores.mockReturnValue({
        ...defaultMockReturn,
        setStatusFiltro: mockSetStatusFiltro,
      });

      renderWithRouter(<ListagemJogadores />);

      fireEvent.change(screen.getByTestId("status-select"), {
        target: { value: "ATIVO" },
      });

      expect(mockSetStatusFiltro).toHaveBeenCalledWith("ATIVO");
    });

    it("deve chamar setGeneroFiltro ao selecionar gênero", () => {
      const mockSetGeneroFiltro = jest.fn();
      mockUseListagemJogadores.mockReturnValue({
        ...defaultMockReturn,
        setGeneroFiltro: mockSetGeneroFiltro,
      });

      renderWithRouter(<ListagemJogadores />);

      fireEvent.change(screen.getByTestId("genero-select"), {
        target: { value: "M" },
      });

      expect(mockSetGeneroFiltro).toHaveBeenCalledWith("M");
    });

    it("deve mostrar botão limpar filtros quando tem filtros ativos", () => {
      mockUseListagemJogadores.mockReturnValue({
        ...defaultMockReturn,
        temFiltrosAtivos: true,
      });

      renderWithRouter(<ListagemJogadores />);

      expect(screen.getByTestId("limpar-filtros")).toBeInTheDocument();
    });

    it("deve chamar limparFiltros ao clicar no botão", () => {
      const mockLimparFiltros = jest.fn();
      mockUseListagemJogadores.mockReturnValue({
        ...defaultMockReturn,
        temFiltrosAtivos: true,
        limparFiltros: mockLimparFiltros,
      });

      renderWithRouter(<ListagemJogadores />);

      fireEvent.click(screen.getByTestId("limpar-filtros"));

      expect(mockLimparFiltros).toHaveBeenCalled();
    });
  });

  describe("Interações - Paginação", () => {
    it("deve chamar handlePaginaAnterior ao clicar em Anterior", () => {
      const mockHandlePaginaAnterior = jest.fn();
      mockUseListagemJogadores.mockReturnValue({
        ...defaultMockReturn,
        offset: 12,
        handlePaginaAnterior: mockHandlePaginaAnterior,
      });

      renderWithRouter(<ListagemJogadores />);

      fireEvent.click(screen.getByTestId("btn-anterior"));

      expect(mockHandlePaginaAnterior).toHaveBeenCalled();
    });

    it("deve chamar handleProximaPagina ao clicar em Próxima", () => {
      const mockHandleProximaPagina = jest.fn();
      mockUseListagemJogadores.mockReturnValue({
        ...defaultMockReturn,
        temMais: true,
        handleProximaPagina: mockHandleProximaPagina,
      });

      renderWithRouter(<ListagemJogadores />);

      fireEvent.click(screen.getByTestId("btn-proxima"));

      expect(mockHandleProximaPagina).toHaveBeenCalled();
    });
  });

  describe("Interações - Deletar Jogador", () => {
    it("deve chamar handleDeletarJogador ao clicar em Deletar", () => {
      const mockHandleDeletarJogador = jest.fn();
      mockUseListagemJogadores.mockReturnValue({
        ...defaultMockReturn,
        handleDeletarJogador: mockHandleDeletarJogador,
      });

      renderWithRouter(<ListagemJogadores />);

      const deleteButtons = screen.getAllByText("Deletar");
      fireEvent.click(deleteButtons[0]);

      expect(mockHandleDeletarJogador).toHaveBeenCalledWith(mockJogadores[0]);
    });
  });

  describe("Valores dos filtros", () => {
    it("deve passar valor da busca para SearchBar", () => {
      mockUseListagemJogadores.mockReturnValue({
        ...defaultMockReturn,
        busca: "teste",
      });

      renderWithRouter(<ListagemJogadores />);

      expect(screen.getByTestId("search-input")).toHaveValue("teste");
    });

    it("deve passar valor do nivelFiltro para FiltersBar", () => {
      mockUseListagemJogadores.mockReturnValue({
        ...defaultMockReturn,
        nivelFiltro: "A",
      });

      renderWithRouter(<ListagemJogadores />);

      expect(screen.getByTestId("nivel-select")).toHaveValue("A");
    });

    it("deve passar valor do statusFiltro para FiltersBar", () => {
      mockUseListagemJogadores.mockReturnValue({
        ...defaultMockReturn,
        statusFiltro: "ATIVO",
      });

      renderWithRouter(<ListagemJogadores />);

      expect(screen.getByTestId("status-select")).toHaveValue("ATIVO");
    });

    it("deve passar valor do generoFiltro para FiltersBar", () => {
      mockUseListagemJogadores.mockReturnValue({
        ...defaultMockReturn,
        generoFiltro: "M",
      });

      renderWithRouter(<ListagemJogadores />);

      expect(screen.getByTestId("genero-select")).toHaveValue("M");
    });
  });

  describe("Lista vazia", () => {
    it("deve exibir mensagem quando lista está vazia e não tem filtros", () => {
      mockUseListagemJogadores.mockReturnValue({
        ...defaultMockReturn,
        jogadores: [],
        total: 0,
        temFiltrosAtivos: false,
      });

      renderWithRouter(<ListagemJogadores />);

      expect(screen.getByTestId("empty-message")).toBeInTheDocument();
    });
  });
});
