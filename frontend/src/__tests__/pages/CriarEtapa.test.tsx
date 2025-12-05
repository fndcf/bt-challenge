/**
 * Testes de renderização da página CriarEtapa
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { useCriarEtapa } from "@/pages/CriarEtapa/hooks/useCriarEtapa";
import CriarEtapa from "@/pages/CriarEtapa";
import { FormatoEtapa } from "@/types/etapa";
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
}));

// Mock do service
jest.mock("@/services", () => ({
  getEtapaService: () => ({
    criar: jest.fn(),
  }),
}));

// Mock do hook useCriarEtapa para testes de componente
jest.mock("@/pages/CriarEtapa/hooks/useCriarEtapa", () => ({
  useCriarEtapa: jest.fn(),
}));

// Mock dos componentes filhos
jest.mock("@/pages/CriarEtapa/components/FormatoSelector", () => ({
  FormatoSelector: ({ formatoAtual, onFormatoChange }: any) => (
    <div data-testid="formato-selector">
      <span>Formato: {formatoAtual}</span>
      <button onClick={() => onFormatoChange(FormatoEtapa.REI_DA_PRAIA)}>
        Mudar Formato
      </button>
    </div>
  ),
}));

jest.mock("@/pages/CriarEtapa/components/ChaveamentoSelector", () => ({
  ChaveamentoSelector: ({ tipoChaveamento, onTipoChange }: any) => (
    <div data-testid="chaveamento-selector">
      <span>Chaveamento: {tipoChaveamento}</span>
      <button onClick={() => onTipoChange("eliminatoria_direta")}>Mudar Chaveamento</button>
    </div>
  ),
}));

jest.mock("@/pages/CriarEtapa/components/InformacoesBasicas", () => ({
  InformacoesBasicas: ({ nome, descricao, genero, nivel, local, onNomeChange, onDescricaoChange, onGeneroChange, onNivelChange, onLocalChange }: any) => (
    <div data-testid="informacoes-basicas">
      <span>Nome: {nome}</span>
      <span>Descrição: {descricao}</span>
      <span>Gênero: {genero}</span>
      <span>Nível: {nivel}</span>
      <span>Local: {local}</span>
      <button onClick={() => onNomeChange("Novo Nome")}>Mudar Nome</button>
      <button onClick={() => onDescricaoChange("Nova Descrição")}>Mudar Descrição</button>
      <button onClick={() => onGeneroChange("feminino")}>Mudar Gênero</button>
      <button onClick={() => onNivelChange("avancado")}>Mudar Nível</button>
      <button onClick={() => onLocalChange("Novo Local")}>Mudar Local</button>
    </div>
  ),
}));

jest.mock("@/pages/CriarEtapa/components/ConfiguracoesDatas", () => ({
  ConfiguracoesDatas: ({ dataInicio, dataFim, dataRealizacao, errosDatas, onDataInicioChange, onDataFimChange, onDataRealizacaoChange }: any) => (
    <div data-testid="configuracoes-datas">
      <span>Início: {dataInicio}</span>
      <span>Fim: {dataFim}</span>
      <span>Realização: {dataRealizacao}</span>
      {Object.keys(errosDatas).length > 0 && (
        <span data-testid="erros-datas">Há erros de datas</span>
      )}
      <button onClick={() => onDataInicioChange("2025-01-01")}>Mudar Data Início</button>
      <button onClick={() => onDataFimChange("2025-01-15")}>Mudar Data Fim</button>
      <button onClick={() => onDataRealizacaoChange("2025-01-20")}>Mudar Data Realização</button>
    </div>
  ),
}));

jest.mock("@/pages/CriarEtapa/components/ConfiguracoesJogadores", () => ({
  ConfiguracoesJogadores: ({ maxJogadores, formato, onMaxJogadoresChange }: any) => (
    <div data-testid="configuracoes-jogadores">
      <span>Max: {maxJogadores}</span>
      <span>Formato: {formato}</span>
      <button onClick={() => onMaxJogadoresChange(32)}>Mudar Max Jogadores</button>
    </div>
  ),
}));

jest.mock("@/pages/CriarEtapa/components/DistribuicaoPreview", () => ({
  DistribuicaoPreview: ({ formato, infoDuplaFixa, infoReiDaPraia }: any) => (
    <div data-testid="distribuicao-preview">
      <span>Preview do Formato: {formato}</span>
    </div>
  ),
}));

jest.mock("@/components/layout/Footer", () => ({
  Footer: () => <footer data-testid="footer">Footer</footer>,
}));

// Mock do scrollIntoView
window.HTMLElement.prototype.scrollIntoView = jest.fn();

// ============================================
// TESTES DE RENDERIZAÇÃO DO COMPONENTE
// ============================================

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe("CriarEtapa - Renderização", () => {
  const mockUseCriarEtapa = useCriarEtapa as jest.Mock;

  const defaultMockReturn = {
    loading: false,
    error: null,
    errosDatas: {},
    formData: {
      nome: "",
      descricao: "",
      formato: FormatoEtapa.DUPLA_FIXA,
      genero: GeneroJogador.MASCULINO,
      nivel: NivelJogador.INTERMEDIARIO,
      maxJogadores: 16,
      local: "",
      dataInicio: "",
      dataFim: "",
      dataRealizacao: "",
      tipoChaveamento: TipoChaveamentoReiDaPraia.MELHORES_COM_MELHORES,
    },
    infoDuplaFixa: {
      valido: true,
      totalDuplas: 8,
      qtdGrupos: 2,
      distribuicao: [4, 4],
      descricao: "8 duplas em 2 grupos",
    },
    infoReiDaPraia: {
      valido: true,
      qtdGrupos: 4,
      jogadoresPorGrupo: 4,
      descricao: "16 jogadores em 4 grupos",
    },
    infoAtual: {
      valido: true,
      descricao: "8 duplas em 2 grupos",
    },
    handleChange: jest.fn(),
    handleSubmit: jest.fn((e) => e.preventDefault()),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCriarEtapa.mockReturnValue(defaultMockReturn);
  });

  describe("Estrutura básica", () => {
    it("deve renderizar o header com título", () => {
      renderWithRouter(<CriarEtapa />);

      expect(screen.getByText("Criar Nova Etapa")).toBeInTheDocument();
    });

    it("deve renderizar o subtítulo", () => {
      renderWithRouter(<CriarEtapa />);

      expect(
        screen.getByText("Preencha os dados para criar uma nova etapa do torneio")
      ).toBeInTheDocument();
    });

    it("deve renderizar botão de voltar", () => {
      renderWithRouter(<CriarEtapa />);

      expect(screen.getByText("← Voltar")).toBeInTheDocument();
    });

    it("deve renderizar footer", () => {
      renderWithRouter(<CriarEtapa />);

      expect(screen.getByTestId("footer")).toBeInTheDocument();
    });
  });

  describe("Componentes do formulário", () => {
    it("deve renderizar FormatoSelector", () => {
      renderWithRouter(<CriarEtapa />);

      expect(screen.getByTestId("formato-selector")).toBeInTheDocument();
    });

    it("deve renderizar InformacoesBasicas", () => {
      renderWithRouter(<CriarEtapa />);

      expect(screen.getByTestId("informacoes-basicas")).toBeInTheDocument();
    });

    it("deve renderizar ConfiguracoesDatas", () => {
      renderWithRouter(<CriarEtapa />);

      expect(screen.getByTestId("configuracoes-datas")).toBeInTheDocument();
    });

    it("deve renderizar ConfiguracoesJogadores", () => {
      renderWithRouter(<CriarEtapa />);

      expect(screen.getByTestId("configuracoes-jogadores")).toBeInTheDocument();
    });

    it("deve renderizar DistribuicaoPreview", () => {
      renderWithRouter(<CriarEtapa />);

      expect(screen.getByTestId("distribuicao-preview")).toBeInTheDocument();
    });

    it("não deve renderizar ChaveamentoSelector para Dupla Fixa", () => {
      renderWithRouter(<CriarEtapa />);

      expect(screen.queryByTestId("chaveamento-selector")).not.toBeInTheDocument();
    });

    it("deve renderizar ChaveamentoSelector para Rei da Praia", () => {
      mockUseCriarEtapa.mockReturnValue({
        ...defaultMockReturn,
        formData: {
          ...defaultMockReturn.formData,
          formato: FormatoEtapa.REI_DA_PRAIA,
        },
      });

      renderWithRouter(<CriarEtapa />);

      expect(screen.getByTestId("chaveamento-selector")).toBeInTheDocument();
    });
  });

  describe("Botões de ação", () => {
    it("deve renderizar botão Cancelar", () => {
      renderWithRouter(<CriarEtapa />);

      expect(screen.getByText("Cancelar")).toBeInTheDocument();
    });

    it("deve renderizar botão Criar Etapa", () => {
      renderWithRouter(<CriarEtapa />);

      expect(screen.getByText("Criar Etapa")).toBeInTheDocument();
    });

    it("deve mostrar Criando... quando loading", () => {
      mockUseCriarEtapa.mockReturnValue({
        ...defaultMockReturn,
        loading: true,
      });

      renderWithRouter(<CriarEtapa />);

      expect(screen.getByText("Criando...")).toBeInTheDocument();
    });

    it("deve desabilitar botão submit quando loading", () => {
      mockUseCriarEtapa.mockReturnValue({
        ...defaultMockReturn,
        loading: true,
      });

      renderWithRouter(<CriarEtapa />);

      const submitButton = screen.getByText("Criando...");
      expect(submitButton).toBeDisabled();
    });

    it("deve desabilitar botão submit quando infoAtual não é válido", () => {
      mockUseCriarEtapa.mockReturnValue({
        ...defaultMockReturn,
        infoAtual: {
          valido: false,
          descricao: "Configuração inválida",
        },
      });

      renderWithRouter(<CriarEtapa />);

      const submitButton = screen.getByText("Criar Etapa");
      expect(submitButton).toBeDisabled();
    });

    it("deve desabilitar botão submit quando há erros de datas", () => {
      mockUseCriarEtapa.mockReturnValue({
        ...defaultMockReturn,
        errosDatas: {
          dataFim: "Data fim deve ser após data início",
        },
      });

      renderWithRouter(<CriarEtapa />);

      const submitButton = screen.getByText("Criar Etapa");
      expect(submitButton).toBeDisabled();
    });

    it("deve habilitar botão submit quando formulário é válido", () => {
      renderWithRouter(<CriarEtapa />);

      const submitButton = screen.getByText("Criar Etapa");
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe("Exibição de erro", () => {
    it("não deve renderizar alerta quando não há erro", () => {
      renderWithRouter(<CriarEtapa />);

      expect(screen.queryByText("Erro ao criar etapa")).not.toBeInTheDocument();
    });

    it("deve renderizar alerta quando há erro", () => {
      mockUseCriarEtapa.mockReturnValue({
        ...defaultMockReturn,
        error: "Nome deve ter no mínimo 3 caracteres",
      });

      renderWithRouter(<CriarEtapa />);

      expect(screen.getByText("Erro ao criar etapa")).toBeInTheDocument();
      expect(
        screen.getByText("Nome deve ter no mínimo 3 caracteres")
      ).toBeInTheDocument();
    });

    it("deve fazer scroll para o erro quando ele aparece", () => {
      const scrollIntoViewMock = jest.fn();
      window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;

      mockUseCriarEtapa.mockReturnValue({
        ...defaultMockReturn,
        error: "Erro de teste para scroll",
      });

      renderWithRouter(<CriarEtapa />);

      expect(scrollIntoViewMock).toHaveBeenCalledWith({
        behavior: "smooth",
        block: "center",
      });
    });
  });

  describe("Navegação", () => {
    it("deve chamar navigate ao clicar em Voltar", () => {
      renderWithRouter(<CriarEtapa />);

      fireEvent.click(screen.getByText("← Voltar"));

      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    it("deve chamar navigate ao clicar em Cancelar", () => {
      renderWithRouter(<CriarEtapa />);

      fireEvent.click(screen.getByText("Cancelar"));

      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
  });

  describe("Submissão do formulário", () => {
    it("deve chamar handleSubmit ao submeter formulário", () => {
      const mockHandleSubmit = jest.fn((e) => e.preventDefault());
      mockUseCriarEtapa.mockReturnValue({
        ...defaultMockReturn,
        handleSubmit: mockHandleSubmit,
      });

      renderWithRouter(<CriarEtapa />);

      fireEvent.click(screen.getByText("Criar Etapa"));

      expect(mockHandleSubmit).toHaveBeenCalled();
    });
  });

  describe("Dados do formulário", () => {
    it("deve exibir formato atual", () => {
      renderWithRouter(<CriarEtapa />);

      // O FormatoSelector exibe o valor do enum (dupla_fixa)
      expect(screen.getByTestId("formato-selector")).toHaveTextContent(FormatoEtapa.DUPLA_FIXA);
    });

    it("deve exibir max jogadores", () => {
      renderWithRouter(<CriarEtapa />);

      expect(screen.getByTestId("configuracoes-jogadores")).toHaveTextContent("Max: 16");
    });

    it("deve exibir gênero e nível", () => {
      renderWithRouter(<CriarEtapa />);

      expect(screen.getByTestId("informacoes-basicas")).toHaveTextContent(GeneroJogador.MASCULINO);
      expect(screen.getByTestId("informacoes-basicas")).toHaveTextContent(NivelJogador.INTERMEDIARIO);
    });
  });

  describe("Callbacks dos componentes", () => {
    it("deve chamar handleChange ao mudar formato", () => {
      const mockHandleChange = jest.fn();
      mockUseCriarEtapa.mockReturnValue({
        ...defaultMockReturn,
        handleChange: mockHandleChange,
      });

      renderWithRouter(<CriarEtapa />);

      fireEvent.click(screen.getByText("Mudar Formato"));

      expect(mockHandleChange).toHaveBeenCalledWith("formato", FormatoEtapa.REI_DA_PRAIA);
    });

    it("deve chamar handleChange ao mudar nome", () => {
      const mockHandleChange = jest.fn();
      mockUseCriarEtapa.mockReturnValue({
        ...defaultMockReturn,
        handleChange: mockHandleChange,
      });

      renderWithRouter(<CriarEtapa />);

      fireEvent.click(screen.getByText("Mudar Nome"));

      expect(mockHandleChange).toHaveBeenCalledWith("nome", "Novo Nome");
    });

    it("deve chamar handleChange ao mudar descrição", () => {
      const mockHandleChange = jest.fn();
      mockUseCriarEtapa.mockReturnValue({
        ...defaultMockReturn,
        handleChange: mockHandleChange,
      });

      renderWithRouter(<CriarEtapa />);

      fireEvent.click(screen.getByText("Mudar Descrição"));

      expect(mockHandleChange).toHaveBeenCalledWith("descricao", "Nova Descrição");
    });

    it("deve chamar handleChange ao mudar gênero", () => {
      const mockHandleChange = jest.fn();
      mockUseCriarEtapa.mockReturnValue({
        ...defaultMockReturn,
        handleChange: mockHandleChange,
      });

      renderWithRouter(<CriarEtapa />);

      fireEvent.click(screen.getByText("Mudar Gênero"));

      expect(mockHandleChange).toHaveBeenCalledWith("genero", "feminino");
    });

    it("deve chamar handleChange ao mudar nível", () => {
      const mockHandleChange = jest.fn();
      mockUseCriarEtapa.mockReturnValue({
        ...defaultMockReturn,
        handleChange: mockHandleChange,
      });

      renderWithRouter(<CriarEtapa />);

      fireEvent.click(screen.getByText("Mudar Nível"));

      expect(mockHandleChange).toHaveBeenCalledWith("nivel", "avancado");
    });

    it("deve chamar handleChange ao mudar local", () => {
      const mockHandleChange = jest.fn();
      mockUseCriarEtapa.mockReturnValue({
        ...defaultMockReturn,
        handleChange: mockHandleChange,
      });

      renderWithRouter(<CriarEtapa />);

      fireEvent.click(screen.getByText("Mudar Local"));

      expect(mockHandleChange).toHaveBeenCalledWith("local", "Novo Local");
    });

    it("deve chamar handleChange ao mudar data de início", () => {
      const mockHandleChange = jest.fn();
      mockUseCriarEtapa.mockReturnValue({
        ...defaultMockReturn,
        handleChange: mockHandleChange,
      });

      renderWithRouter(<CriarEtapa />);

      fireEvent.click(screen.getByText("Mudar Data Início"));

      expect(mockHandleChange).toHaveBeenCalledWith("dataInicio", "2025-01-01");
    });

    it("deve chamar handleChange ao mudar data fim", () => {
      const mockHandleChange = jest.fn();
      mockUseCriarEtapa.mockReturnValue({
        ...defaultMockReturn,
        handleChange: mockHandleChange,
      });

      renderWithRouter(<CriarEtapa />);

      fireEvent.click(screen.getByText("Mudar Data Fim"));

      expect(mockHandleChange).toHaveBeenCalledWith("dataFim", "2025-01-15");
    });

    it("deve chamar handleChange ao mudar data realização", () => {
      const mockHandleChange = jest.fn();
      mockUseCriarEtapa.mockReturnValue({
        ...defaultMockReturn,
        handleChange: mockHandleChange,
      });

      renderWithRouter(<CriarEtapa />);

      fireEvent.click(screen.getByText("Mudar Data Realização"));

      expect(mockHandleChange).toHaveBeenCalledWith("dataRealizacao", "2025-01-20");
    });

    it("deve chamar handleChange ao mudar max jogadores", () => {
      const mockHandleChange = jest.fn();
      mockUseCriarEtapa.mockReturnValue({
        ...defaultMockReturn,
        handleChange: mockHandleChange,
      });

      renderWithRouter(<CriarEtapa />);

      fireEvent.click(screen.getByText("Mudar Max Jogadores"));

      expect(mockHandleChange).toHaveBeenCalledWith("maxJogadores", 32);
    });

    it("deve chamar handleChange ao mudar chaveamento no modo Rei da Praia", () => {
      const mockHandleChange = jest.fn();
      mockUseCriarEtapa.mockReturnValue({
        ...defaultMockReturn,
        formData: {
          ...defaultMockReturn.formData,
          formato: FormatoEtapa.REI_DA_PRAIA,
        },
        handleChange: mockHandleChange,
      });

      renderWithRouter(<CriarEtapa />);

      fireEvent.click(screen.getByText("Mudar Chaveamento"));

      expect(mockHandleChange).toHaveBeenCalledWith("tipoChaveamento", "eliminatoria_direta");
    });

    it("deve passar errosDatas para ConfiguracoesDatas", () => {
      mockUseCriarEtapa.mockReturnValue({
        ...defaultMockReturn,
        errosDatas: { dataFim: "Data inválida" },
      });

      renderWithRouter(<CriarEtapa />);

      expect(screen.getByTestId("erros-datas")).toBeInTheDocument();
    });

    it("deve passar formData completo para componentes", () => {
      mockUseCriarEtapa.mockReturnValue({
        ...defaultMockReturn,
        formData: {
          ...defaultMockReturn.formData,
          nome: "Etapa Teste",
          maxJogadores: 32,
        },
      });

      renderWithRouter(<CriarEtapa />);

      expect(screen.getByTestId("informacoes-basicas")).toHaveTextContent("Nome: Etapa Teste");
      expect(screen.getByTestId("configuracoes-jogadores")).toHaveTextContent("Max: 32");
    });

    it("deve passar tipoChaveamento para ChaveamentoSelector no modo Rei da Praia", () => {
      mockUseCriarEtapa.mockReturnValue({
        ...defaultMockReturn,
        formData: {
          ...defaultMockReturn.formData,
          formato: FormatoEtapa.REI_DA_PRAIA,
          tipoChaveamento: TipoChaveamentoReiDaPraia.MELHORES_COM_MELHORES,
        },
      });

      renderWithRouter(<CriarEtapa />);

      expect(screen.getByTestId("chaveamento-selector")).toHaveTextContent(
        TipoChaveamentoReiDaPraia.MELHORES_COM_MELHORES
      );
    });

    it("deve passar datas para ConfiguracoesDatas", () => {
      mockUseCriarEtapa.mockReturnValue({
        ...defaultMockReturn,
        formData: {
          ...defaultMockReturn.formData,
          dataInicio: "2025-01-01",
          dataFim: "2025-01-15",
          dataRealizacao: "2025-01-20",
        },
      });

      renderWithRouter(<CriarEtapa />);

      expect(screen.getByTestId("configuracoes-datas")).toHaveTextContent("Início: 2025-01-01");
      expect(screen.getByTestId("configuracoes-datas")).toHaveTextContent("Fim: 2025-01-15");
      expect(screen.getByTestId("configuracoes-datas")).toHaveTextContent("Realização: 2025-01-20");
    });
  });
});
