/**
 * Testes de renderização da página EditarEtapa
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { useEditarEtapa } from "@/pages/EditarEtapa/hooks/useEditarEtapa";
import EditarEtapa from "@/pages/EditarEtapa";
import { FormatoEtapa, StatusEtapa } from "@/types/etapa";
import { TipoChaveamentoReiDaPraia } from "@/types/reiDaPraia";
import { GeneroJogador, NivelJogador } from "@/types/jogador";

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
  useParams: () => ({ id: "1" }),
}));

// Mock do hook useEditarEtapa
jest.mock("@/pages/EditarEtapa/hooks/useEditarEtapa", () => ({
  useEditarEtapa: jest.fn(),
}));

// Mock dos componentes filhos
jest.mock("@/pages/EditarEtapa/components/FormatoDisplay", () => ({
  FormatoDisplay: ({ formato, tipoChaveamento, chavesGeradas, onTipoChaveamentoChange }: any) => (
    <div data-testid="formato-display">
      <span>Formato: {formato}</span>
      <span>Tipo Chaveamento: {tipoChaveamento || "N/A"}</span>
      {!chavesGeradas && (
        <button
          onClick={() => onTipoChaveamentoChange("fase_grupos_eliminatoria")}
          data-testid="mudar-chaveamento-btn"
        >
          Mudar Chaveamento
        </button>
      )}
    </div>
  ),
}));

jest.mock("@/pages/EditarEtapa/components/RestricoesList", () => ({
  RestricoesList: ({ formato, chavesGeradas, temInscritos }: any) => (
    <div data-testid="restricoes-list">
      {chavesGeradas && <span data-testid="chaves-geradas-alert">Chaves já geradas</span>}
      {temInscritos && <span data-testid="tem-inscritos-alert">Existem inscritos</span>}
    </div>
  ),
}));

jest.mock("@/pages/EditarEtapa/components/ConfiguracoesJogadoresEdit", () => ({
  ConfiguracoesJogadoresEdit: ({
    maxJogadores,
    formato,
    chavesGeradas,
    temInscritos,
    totalInscritos,
    minimoJogadores,
    onMaxJogadoresChange,
    onBlur,
  }: any) => (
    <div data-testid="configuracoes-jogadores-edit">
      <input
        data-testid="max-jogadores-input"
        type="number"
        value={maxJogadores}
        onChange={(e) => onMaxJogadoresChange(Number(e.target.value))}
        onBlur={(e) => onBlur(Number(e.target.value))}
        disabled={chavesGeradas}
      />
      <span>Mínimo: {minimoJogadores}</span>
      <span>Total inscritos: {totalInscritos}</span>
    </div>
  ),
}));

jest.mock("@/pages/CriarEtapa/components/InformacoesBasicas", () => ({
  InformacoesBasicas: ({
    nome,
    descricao,
    genero,
    nivel,
    local,
    disabled,
    disabledGenero,
    disabledNivel,
    helperGenero,
    helperNivel,
    onNomeChange,
    onDescricaoChange,
    onGeneroChange,
    onNivelChange,
    onLocalChange,
  }: any) => (
    <div data-testid="informacoes-basicas">
      <input
        data-testid="nome-input"
        value={nome}
        onChange={(e) => onNomeChange(e.target.value)}
        disabled={disabled}
      />
      <input
        data-testid="descricao-input"
        value={descricao}
        onChange={(e) => onDescricaoChange(e.target.value)}
        disabled={disabled}
      />
      <button
        data-testid="genero-btn"
        onClick={() => onGeneroChange("feminino")}
        disabled={disabledGenero}
      >
        Mudar Gênero
      </button>
      <button
        data-testid="nivel-btn"
        onClick={() => onNivelChange("avancado")}
        disabled={disabledNivel}
      >
        Mudar Nível
      </button>
      <input
        data-testid="local-input"
        value={local}
        onChange={(e) => onLocalChange(e.target.value)}
        disabled={disabled}
      />
      <span>Gênero: {genero}</span>
      <span>Nível: {nivel}</span>
      {helperGenero && <span data-testid="helper-genero">{helperGenero}</span>}
      {helperNivel && <span data-testid="helper-nivel">{helperNivel}</span>}
    </div>
  ),
}));

jest.mock("@/pages/CriarEtapa/components/ConfiguracoesDatas", () => ({
  ConfiguracoesDatas: ({
    dataInicio,
    dataFim,
    dataRealizacao,
    disabled,
    onDataInicioChange,
    onDataFimChange,
    onDataRealizacaoChange,
  }: any) => (
    <div data-testid="configuracoes-datas">
      <input
        data-testid="data-inicio-input"
        type="date"
        value={dataInicio}
        onChange={(e) => onDataInicioChange(e.target.value)}
        disabled={disabled}
      />
      <input
        data-testid="data-fim-input"
        type="date"
        value={dataFim}
        onChange={(e) => onDataFimChange(e.target.value)}
        disabled={disabled}
      />
      <input
        data-testid="data-realizacao-input"
        type="date"
        value={dataRealizacao}
        onChange={(e) => onDataRealizacaoChange(e.target.value)}
        disabled={disabled}
      />
      <span>Fim: {dataFim}</span>
      <span>Realização: {dataRealizacao}</span>
    </div>
  ),
}));

jest.mock("@/components/layout/Footer", () => ({
  Footer: () => <footer data-testid="footer">Footer</footer>,
}));

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = jest.fn();

// ============================================
// TESTES DE RENDERIZAÇÃO DO COMPONENTE
// ============================================

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe("EditarEtapa - Renderização", () => {
  const mockUseEditarEtapa = useEditarEtapa as jest.Mock;

  const mockEtapa = {
    id: "1",
    nome: "Etapa Teste",
    descricao: "Descrição teste",
    formato: FormatoEtapa.DUPLA_FIXA,
    status: StatusEtapa.ABERTA,
    nivel: NivelJogador.INTERMEDIARIO,
    genero: GeneroJogador.MASCULINO,
    maxJogadores: 16,
    totalInscritos: 4,
    chavesGeradas: false,
    dataInicio: "2024-01-15",
    dataFim: "2024-01-20",
    dataRealizacao: "2024-01-25",
    local: "Quadra 1",
  };

  const defaultMockReturn = {
    etapa: mockEtapa,
    loading: false,
    salvando: false,
    error: null,
    formData: {
      nome: "Etapa Teste",
      descricao: "Descrição teste",
      genero: GeneroJogador.MASCULINO,
      nivel: NivelJogador.INTERMEDIARIO,
      maxJogadores: 16,
      dataInicio: "2024-01-15",
      dataFim: "2024-01-20",
      dataRealizacao: "2024-01-25",
      local: "Quadra 1",
      tipoChaveamento: TipoChaveamentoReiDaPraia.MELHORES_COM_MELHORES,
    },
    temInscritos: true,
    chavesGeradas: false,
    isReiDaPraia: false,
    handleChange: jest.fn(),
    handleSubmit: jest.fn((e) => e.preventDefault()),
    calcularMinimoJogadores: jest.fn(() => 6),
    ajustarValorJogadores: jest.fn((v) => v),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseEditarEtapa.mockReturnValue(defaultMockReturn);
  });

  describe("Estado de Loading", () => {
    it("deve renderizar loading quando carregando", () => {
      mockUseEditarEtapa.mockReturnValue({
        ...defaultMockReturn,
        loading: true,
        etapa: null,
      });

      renderWithRouter(<EditarEtapa />);

      expect(screen.getByText("Carregando etapa...")).toBeInTheDocument();
    });
  });

  describe("Estado de Erro sem etapa", () => {
    it("deve renderizar erro quando há erro e não tem etapa", () => {
      mockUseEditarEtapa.mockReturnValue({
        ...defaultMockReturn,
        error: "Etapa não encontrada",
        etapa: null,
      });

      renderWithRouter(<EditarEtapa />);

      expect(screen.getByText("Etapa não encontrada")).toBeInTheDocument();
      expect(screen.getByText("Voltar para etapas")).toBeInTheDocument();
    });

    it("deve navegar ao clicar em Voltar para etapas", () => {
      mockUseEditarEtapa.mockReturnValue({
        ...defaultMockReturn,
        error: "Etapa não encontrada",
        etapa: null,
      });

      renderWithRouter(<EditarEtapa />);

      fireEvent.click(screen.getByText("Voltar para etapas"));

      expect(mockNavigate).toHaveBeenCalledWith("/admin/etapas");
    });
  });

  describe("Estrutura básica", () => {
    it("deve renderizar o título", () => {
      renderWithRouter(<EditarEtapa />);

      expect(screen.getByText("Editar Etapa")).toBeInTheDocument();
    });

    it("deve renderizar o subtítulo", () => {
      renderWithRouter(<EditarEtapa />);

      expect(
        screen.getByText("Atualize as informações da etapa")
      ).toBeInTheDocument();
    });

    it("deve renderizar botão de voltar", () => {
      renderWithRouter(<EditarEtapa />);

      expect(screen.getByText("← Voltar")).toBeInTheDocument();
    });

    it("deve renderizar footer", () => {
      renderWithRouter(<EditarEtapa />);

      expect(screen.getByTestId("footer")).toBeInTheDocument();
    });
  });

  describe("Componentes do formulário", () => {
    it("deve renderizar FormatoDisplay", () => {
      renderWithRouter(<EditarEtapa />);

      expect(screen.getByTestId("formato-display")).toBeInTheDocument();
    });

    it("deve renderizar RestricoesList", () => {
      renderWithRouter(<EditarEtapa />);

      expect(screen.getByTestId("restricoes-list")).toBeInTheDocument();
    });

    it("deve renderizar InformacoesBasicas", () => {
      renderWithRouter(<EditarEtapa />);

      expect(screen.getByTestId("informacoes-basicas")).toBeInTheDocument();
    });

    it("deve renderizar ConfiguracoesDatas", () => {
      renderWithRouter(<EditarEtapa />);

      expect(screen.getByTestId("configuracoes-datas")).toBeInTheDocument();
    });

    it("deve renderizar ConfiguracoesJogadoresEdit", () => {
      renderWithRouter(<EditarEtapa />);

      expect(screen.getByTestId("configuracoes-jogadores-edit")).toBeInTheDocument();
    });
  });

  describe("Alertas de restrições", () => {
    it("deve mostrar alerta quando tem inscritos", () => {
      mockUseEditarEtapa.mockReturnValue({
        ...defaultMockReturn,
        temInscritos: true,
      });

      renderWithRouter(<EditarEtapa />);

      expect(screen.getByTestId("tem-inscritos-alert")).toBeInTheDocument();
    });

    it("deve mostrar alerta quando chaves já foram geradas", () => {
      mockUseEditarEtapa.mockReturnValue({
        ...defaultMockReturn,
        chavesGeradas: true,
        etapa: { ...mockEtapa, chavesGeradas: true },
      });

      renderWithRouter(<EditarEtapa />);

      expect(screen.getByTestId("chaves-geradas-alert")).toBeInTheDocument();
    });
  });

  describe("Erro de validação", () => {
    it("deve mostrar erro de validação quando há erro", () => {
      mockUseEditarEtapa.mockReturnValue({
        ...defaultMockReturn,
        error: "Nome deve ter no mínimo 3 caracteres",
      });

      renderWithRouter(<EditarEtapa />);

      expect(
        screen.getByText("Nome deve ter no mínimo 3 caracteres")
      ).toBeInTheDocument();
    });
  });

  describe("Botões de ação", () => {
    it("deve renderizar botão Cancelar", () => {
      renderWithRouter(<EditarEtapa />);

      expect(screen.getByText("Cancelar")).toBeInTheDocument();
    });

    it("deve renderizar botão Salvar Alterações", () => {
      renderWithRouter(<EditarEtapa />);

      expect(screen.getByText("Salvar Alterações")).toBeInTheDocument();
    });

    it("deve mostrar Salvando... quando salvando", () => {
      mockUseEditarEtapa.mockReturnValue({
        ...defaultMockReturn,
        salvando: true,
      });

      renderWithRouter(<EditarEtapa />);

      expect(screen.getByText("Salvando...")).toBeInTheDocument();
    });

    it("deve desabilitar botão submit quando salvando", () => {
      mockUseEditarEtapa.mockReturnValue({
        ...defaultMockReturn,
        salvando: true,
      });

      renderWithRouter(<EditarEtapa />);

      expect(screen.getByText("Salvando...").closest("button")).toBeDisabled();
    });

    it("deve desabilitar botão submit quando chaves geradas", () => {
      mockUseEditarEtapa.mockReturnValue({
        ...defaultMockReturn,
        chavesGeradas: true,
        etapa: { ...mockEtapa, chavesGeradas: true },
      });

      renderWithRouter(<EditarEtapa />);

      expect(
        screen.getByText("Salvar Alterações").closest("button")
      ).toBeDisabled();
    });
  });

  describe("Interações", () => {
    it("deve chamar handleChange ao digitar no nome", () => {
      const mockHandleChange = jest.fn();
      mockUseEditarEtapa.mockReturnValue({
        ...defaultMockReturn,
        handleChange: mockHandleChange,
      });

      renderWithRouter(<EditarEtapa />);

      fireEvent.change(screen.getByTestId("nome-input"), {
        target: { value: "Novo Nome" },
      });

      expect(mockHandleChange).toHaveBeenCalledWith("nome", "Novo Nome");
    });

    it("deve chamar handleSubmit ao submeter formulário", () => {
      const mockHandleSubmit = jest.fn((e) => e.preventDefault());
      mockUseEditarEtapa.mockReturnValue({
        ...defaultMockReturn,
        handleSubmit: mockHandleSubmit,
      });

      renderWithRouter(<EditarEtapa />);

      fireEvent.click(screen.getByText("Salvar Alterações"));

      expect(mockHandleSubmit).toHaveBeenCalled();
    });

    it("deve navegar ao clicar em Voltar", () => {
      renderWithRouter(<EditarEtapa />);

      fireEvent.click(screen.getByText("← Voltar"));

      expect(mockNavigate).toHaveBeenCalledWith("/admin/etapas/1");
    });

    it("deve navegar ao clicar em Cancelar", () => {
      renderWithRouter(<EditarEtapa />);

      fireEvent.click(screen.getByText("Cancelar"));

      expect(mockNavigate).toHaveBeenCalledWith("/admin/etapas/1");
    });
  });

  describe("Valores do formulário", () => {
    it("deve exibir formato da etapa", () => {
      renderWithRouter(<EditarEtapa />);

      expect(screen.getByTestId("formato-display")).toHaveTextContent(
        `Formato: ${FormatoEtapa.DUPLA_FIXA}`
      );
    });

    it("deve exibir gênero e nível", () => {
      renderWithRouter(<EditarEtapa />);

      expect(screen.getByTestId("informacoes-basicas")).toHaveTextContent(
        `Gênero: ${GeneroJogador.MASCULINO}`
      );
      expect(screen.getByTestId("informacoes-basicas")).toHaveTextContent(
        `Nível: ${NivelJogador.INTERMEDIARIO}`
      );
    });

    it("deve exibir total de inscritos", () => {
      mockUseEditarEtapa.mockReturnValue({
        ...defaultMockReturn,
        etapa: { ...mockEtapa, totalInscritos: 8 },
      });

      renderWithRouter(<EditarEtapa />);

      expect(screen.getByTestId("configuracoes-jogadores-edit")).toHaveTextContent(
        "Total inscritos: 8"
      );
    });
  });

  describe("Callbacks dos componentes", () => {
    it("deve chamar handleChange ao mudar tipo de chaveamento", () => {
      const mockHandleChange = jest.fn();
      mockUseEditarEtapa.mockReturnValue({
        ...defaultMockReturn,
        handleChange: mockHandleChange,
      });

      renderWithRouter(<EditarEtapa />);

      fireEvent.click(screen.getByTestId("mudar-chaveamento-btn"));

      expect(mockHandleChange).toHaveBeenCalledWith("tipoChaveamento", "fase_grupos_eliminatoria");
    });

    it("deve chamar handleChange ao mudar descrição", () => {
      const mockHandleChange = jest.fn();
      mockUseEditarEtapa.mockReturnValue({
        ...defaultMockReturn,
        handleChange: mockHandleChange,
      });

      renderWithRouter(<EditarEtapa />);

      fireEvent.change(screen.getByTestId("descricao-input"), {
        target: { value: "Nova descrição" },
      });

      expect(mockHandleChange).toHaveBeenCalledWith("descricao", "Nova descrição");
    });

    it("deve chamar handleChange ao mudar gênero", () => {
      const mockHandleChange = jest.fn();
      mockUseEditarEtapa.mockReturnValue({
        ...defaultMockReturn,
        temInscritos: false,
        chavesGeradas: false,
        handleChange: mockHandleChange,
      });

      renderWithRouter(<EditarEtapa />);

      fireEvent.click(screen.getByTestId("genero-btn"));

      expect(mockHandleChange).toHaveBeenCalledWith("genero", "feminino");
    });

    it("deve chamar handleChange ao mudar nível", () => {
      const mockHandleChange = jest.fn();
      mockUseEditarEtapa.mockReturnValue({
        ...defaultMockReturn,
        temInscritos: false,
        chavesGeradas: false,
        handleChange: mockHandleChange,
      });

      renderWithRouter(<EditarEtapa />);

      fireEvent.click(screen.getByTestId("nivel-btn"));

      expect(mockHandleChange).toHaveBeenCalledWith("nivel", "avancado");
    });

    it("deve chamar handleChange ao mudar local", () => {
      const mockHandleChange = jest.fn();
      mockUseEditarEtapa.mockReturnValue({
        ...defaultMockReturn,
        handleChange: mockHandleChange,
      });

      renderWithRouter(<EditarEtapa />);

      fireEvent.change(screen.getByTestId("local-input"), {
        target: { value: "Quadra 2" },
      });

      expect(mockHandleChange).toHaveBeenCalledWith("local", "Quadra 2");
    });

    it("deve chamar handleChange ao mudar data de início", () => {
      const mockHandleChange = jest.fn();
      mockUseEditarEtapa.mockReturnValue({
        ...defaultMockReturn,
        handleChange: mockHandleChange,
      });

      renderWithRouter(<EditarEtapa />);

      fireEvent.change(screen.getByTestId("data-inicio-input"), {
        target: { value: "2024-02-01" },
      });

      expect(mockHandleChange).toHaveBeenCalledWith("dataInicio", "2024-02-01");
    });

    it("deve chamar handleChange ao mudar data fim", () => {
      const mockHandleChange = jest.fn();
      mockUseEditarEtapa.mockReturnValue({
        ...defaultMockReturn,
        handleChange: mockHandleChange,
      });

      renderWithRouter(<EditarEtapa />);

      fireEvent.change(screen.getByTestId("data-fim-input"), {
        target: { value: "2024-02-10" },
      });

      expect(mockHandleChange).toHaveBeenCalledWith("dataFim", "2024-02-10");
    });

    it("deve chamar handleChange ao mudar data de realização", () => {
      const mockHandleChange = jest.fn();
      mockUseEditarEtapa.mockReturnValue({
        ...defaultMockReturn,
        handleChange: mockHandleChange,
      });

      renderWithRouter(<EditarEtapa />);

      fireEvent.change(screen.getByTestId("data-realizacao-input"), {
        target: { value: "2024-02-15" },
      });

      expect(mockHandleChange).toHaveBeenCalledWith("dataRealizacao", "2024-02-15");
    });

    it("deve chamar handleChange ao mudar max jogadores", () => {
      const mockHandleChange = jest.fn();
      mockUseEditarEtapa.mockReturnValue({
        ...defaultMockReturn,
        handleChange: mockHandleChange,
      });

      renderWithRouter(<EditarEtapa />);

      fireEvent.change(screen.getByTestId("max-jogadores-input"), {
        target: { value: "32" },
      });

      expect(mockHandleChange).toHaveBeenCalledWith("maxJogadores", 32);
    });

    it("deve chamar ajustarValorJogadores no onBlur do max jogadores", () => {
      const mockHandleChange = jest.fn();
      const mockAjustarValorJogadores = jest.fn((v) => v);
      mockUseEditarEtapa.mockReturnValue({
        ...defaultMockReturn,
        handleChange: mockHandleChange,
        ajustarValorJogadores: mockAjustarValorJogadores,
      });

      renderWithRouter(<EditarEtapa />);

      fireEvent.blur(screen.getByTestId("max-jogadores-input"), {
        target: { value: "24" },
      });

      expect(mockAjustarValorJogadores).toHaveBeenCalledWith(24);
      expect(mockHandleChange).toHaveBeenCalledWith("maxJogadores", 24);
    });

    it("deve exibir mínimo de jogadores calculado", () => {
      const mockCalcularMinimoJogadores = jest.fn(() => 8);
      mockUseEditarEtapa.mockReturnValue({
        ...defaultMockReturn,
        calcularMinimoJogadores: mockCalcularMinimoJogadores,
      });

      renderWithRouter(<EditarEtapa />);

      expect(mockCalcularMinimoJogadores).toHaveBeenCalled();
      expect(screen.getByTestId("configuracoes-jogadores-edit")).toHaveTextContent("Mínimo: 8");
    });
  });

  describe("Helper texts para campos desabilitados", () => {
    it("deve exibir helper de gênero quando tem inscritos", () => {
      mockUseEditarEtapa.mockReturnValue({
        ...defaultMockReturn,
        temInscritos: true,
      });

      renderWithRouter(<EditarEtapa />);

      expect(screen.getByTestId("helper-genero")).toHaveTextContent(
        "Não é possível alterar o gênero pois já existem jogadores inscritos"
      );
    });

    it("deve exibir helper de nível quando tem inscritos", () => {
      mockUseEditarEtapa.mockReturnValue({
        ...defaultMockReturn,
        temInscritos: true,
      });

      renderWithRouter(<EditarEtapa />);

      expect(screen.getByTestId("helper-nivel")).toHaveTextContent(
        "Não é possível alterar o nível pois já existem jogadores inscritos"
      );
    });

    it("não deve exibir helpers quando não tem inscritos", () => {
      mockUseEditarEtapa.mockReturnValue({
        ...defaultMockReturn,
        temInscritos: false,
      });

      renderWithRouter(<EditarEtapa />);

      expect(screen.queryByTestId("helper-genero")).not.toBeInTheDocument();
      expect(screen.queryByTestId("helper-nivel")).not.toBeInTheDocument();
    });
  });

  describe("Retorno null quando etapa é undefined", () => {
    it("deve retornar null quando etapa é undefined e não há erro nem loading", () => {
      mockUseEditarEtapa.mockReturnValue({
        ...defaultMockReturn,
        etapa: undefined,
        loading: false,
        error: null,
      });

      const { container } = renderWithRouter(<EditarEtapa />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe("Scroll para erro", () => {
    it("deve fazer scroll para o erro quando aparece", () => {
      const scrollIntoViewMock = jest.fn();
      window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;

      mockUseEditarEtapa.mockReturnValue({
        ...defaultMockReturn,
        error: "Erro de validação",
      });

      renderWithRouter(<EditarEtapa />);

      expect(scrollIntoViewMock).toHaveBeenCalledWith({
        behavior: "smooth",
        block: "center",
      });
    });
  });
});
