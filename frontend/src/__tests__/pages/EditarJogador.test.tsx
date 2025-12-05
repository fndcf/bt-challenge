/**
 * Testes de renderização da página EditarJogador
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { useEditarJogador } from "@/pages/EditarJogador/hooks/useEditarJogador";
import EditarJogador from "@/pages/EditarJogador";
import { GeneroJogador, NivelJogador, StatusJogador } from "@/types/jogador";

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
  useNavigate: () => mockNavigate,
}));

// Mock do hook useEditarJogador
jest.mock("@/pages/EditarJogador/hooks/useEditarJogador", () => ({
  useEditarJogador: jest.fn(),
}));

// Mock dos componentes filhos
jest.mock("@/pages/NovoJogador/components/InformacoesBasicas", () => ({
  InformacoesBasicas: ({
    nome,
    email,
    telefone,
    dataNascimento,
    genero,
    errors,
    onChange,
  }: any) => (
    <div data-testid="informacoes-basicas">
      <input
        data-testid="nome-input"
        value={nome}
        onChange={(e) => onChange({ target: { name: "nome", value: e.target.value } })}
      />
      <input
        data-testid="email-input"
        value={email}
        onChange={(e) => onChange({ target: { name: "email", value: e.target.value } })}
      />
      <span>Gênero: {genero}</span>
      {errors.nome && <span data-testid="nome-error">{errors.nome}</span>}
      {errors.email && <span data-testid="email-error">{errors.email}</span>}
    </div>
  ),
}));

jest.mock("@/pages/NovoJogador/components/NivelStatus", () => ({
  NivelStatus: ({ nivel, status, onChange }: any) => (
    <div data-testid="nivel-status">
      <span>Nível: {nivel}</span>
      <span>Status: {status}</span>
    </div>
  ),
}));

jest.mock("@/pages/NovoJogador/components/ObservacoesField", () => ({
  ObservacoesField: ({ observacoes, onChange }: any) => (
    <div data-testid="observacoes-field">
      <textarea
        data-testid="observacoes-input"
        value={observacoes}
        onChange={(e) =>
          onChange({ target: { name: "observacoes", value: e.target.value } })
        }
      />
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

describe("EditarJogador - Renderização", () => {
  const mockUseEditarJogador = useEditarJogador as jest.Mock;

  const mockJogador = {
    id: "1",
    nome: "João Silva",
    email: "joao@email.com",
    telefone: "(11) 99999-8888",
    dataNascimento: "1990-05-15",
    genero: GeneroJogador.MASCULINO,
    nivel: NivelJogador.INTERMEDIARIO,
    status: StatusJogador.ATIVO,
    observacoes: "Jogador experiente",
  };

  const defaultMockReturn = {
    jogador: mockJogador,
    loading: false,
    formData: {
      nome: "João Silva",
      email: "joao@email.com",
      telefone: "(11) 99999-8888",
      dataNascimento: "1990-05-15",
      genero: GeneroJogador.MASCULINO,
      nivel: NivelJogador.INTERMEDIARIO,
      status: StatusJogador.ATIVO,
      observacoes: "Jogador experiente",
    },
    errors: {},
    saving: false,
    errorMessage: "",
    successMessage: "",
    handleChange: jest.fn(),
    handleSubmit: jest.fn((e) => e.preventDefault()),
    handleCancel: jest.fn(),
    setErrorMessage: jest.fn(),
    setSuccessMessage: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseEditarJogador.mockReturnValue(defaultMockReturn);
  });

  describe("Estado de Loading", () => {
    it("deve renderizar loading quando carregando", () => {
      mockUseEditarJogador.mockReturnValue({
        ...defaultMockReturn,
        loading: true,
        jogador: null,
      });

      renderWithRouter(<EditarJogador />);

      expect(screen.getByText("Carregando jogador...")).toBeInTheDocument();
    });
  });

  describe("Jogador não encontrado", () => {
    it("deve renderizar mensagem quando jogador não encontrado", () => {
      mockUseEditarJogador.mockReturnValue({
        ...defaultMockReturn,
        jogador: null,
      });

      renderWithRouter(<EditarJogador />);

      expect(screen.getByText("Jogador não encontrado")).toBeInTheDocument();
    });

    it("deve navegar ao clicar no botão fechar", () => {
      mockUseEditarJogador.mockReturnValue({
        ...defaultMockReturn,
        jogador: null,
      });

      renderWithRouter(<EditarJogador />);

      fireEvent.click(screen.getByText("×"));

      expect(mockNavigate).toHaveBeenCalledWith("/admin/jogadores");
    });
  });

  describe("Estrutura básica", () => {
    it("deve renderizar o título", () => {
      renderWithRouter(<EditarJogador />);

      expect(screen.getByText("Editar Jogador")).toBeInTheDocument();
    });

    it("deve renderizar o subtítulo", () => {
      renderWithRouter(<EditarJogador />);

      expect(
        screen.getByText("Atualize as informações do jogador")
      ).toBeInTheDocument();
    });

    it("deve renderizar botão de voltar", () => {
      renderWithRouter(<EditarJogador />);

      expect(screen.getByText("← Voltar")).toBeInTheDocument();
    });

    it("deve renderizar footer", () => {
      renderWithRouter(<EditarJogador />);

      expect(screen.getByTestId("footer")).toBeInTheDocument();
    });
  });

  describe("Componentes do formulário", () => {
    it("deve renderizar InformacoesBasicas", () => {
      renderWithRouter(<EditarJogador />);

      expect(screen.getByTestId("informacoes-basicas")).toBeInTheDocument();
    });

    it("deve renderizar NivelStatus", () => {
      renderWithRouter(<EditarJogador />);

      expect(screen.getByTestId("nivel-status")).toBeInTheDocument();
    });

    it("deve renderizar ObservacoesField", () => {
      renderWithRouter(<EditarJogador />);

      expect(screen.getByTestId("observacoes-field")).toBeInTheDocument();
    });
  });

  describe("Botões de ação", () => {
    it("deve renderizar botão Cancelar", () => {
      renderWithRouter(<EditarJogador />);

      expect(screen.getByText("Cancelar")).toBeInTheDocument();
    });

    it("deve renderizar botão Salvar Alterações", () => {
      renderWithRouter(<EditarJogador />);

      expect(screen.getByText("Salvar Alterações")).toBeInTheDocument();
    });

    it("deve mostrar Salvando... quando salvando", () => {
      mockUseEditarJogador.mockReturnValue({
        ...defaultMockReturn,
        saving: true,
      });

      renderWithRouter(<EditarJogador />);

      expect(screen.getByText("Salvando...")).toBeInTheDocument();
    });

    it("deve desabilitar botão submit quando salvando", () => {
      mockUseEditarJogador.mockReturnValue({
        ...defaultMockReturn,
        saving: true,
      });

      renderWithRouter(<EditarJogador />);

      const submitButton = screen.getByRole("button", { name: /Salvando/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe("Alertas", () => {
    it("deve renderizar alerta de erro quando há errorMessage", () => {
      mockUseEditarJogador.mockReturnValue({
        ...defaultMockReturn,
        errorMessage: "Erro ao atualizar jogador",
      });

      renderWithRouter(<EditarJogador />);

      expect(screen.getByText("Erro ao atualizar jogador")).toBeInTheDocument();
    });

    it("deve renderizar alerta de sucesso quando há successMessage", () => {
      mockUseEditarJogador.mockReturnValue({
        ...defaultMockReturn,
        successMessage: "Jogador atualizado com sucesso!",
      });

      renderWithRouter(<EditarJogador />);

      expect(
        screen.getByText("Jogador atualizado com sucesso!")
      ).toBeInTheDocument();
    });

    it("deve chamar setErrorMessage ao fechar alerta de erro", () => {
      const mockSetErrorMessage = jest.fn();
      mockUseEditarJogador.mockReturnValue({
        ...defaultMockReturn,
        errorMessage: "Erro ao atualizar",
        setErrorMessage: mockSetErrorMessage,
      });

      renderWithRouter(<EditarJogador />);

      const closeButtons = screen.getAllByText("×");
      fireEvent.click(closeButtons[0]);

      expect(mockSetErrorMessage).toHaveBeenCalledWith("");
    });

    it("deve chamar setSuccessMessage ao fechar alerta de sucesso", () => {
      const mockSetSuccessMessage = jest.fn();
      mockUseEditarJogador.mockReturnValue({
        ...defaultMockReturn,
        successMessage: "Atualizado!",
        setSuccessMessage: mockSetSuccessMessage,
      });

      renderWithRouter(<EditarJogador />);

      const closeButtons = screen.getAllByText("×");
      fireEvent.click(closeButtons[0]);

      expect(mockSetSuccessMessage).toHaveBeenCalledWith("");
    });
  });

  describe("Erros de validação", () => {
    it("deve exibir erro do campo nome", () => {
      mockUseEditarJogador.mockReturnValue({
        ...defaultMockReturn,
        errors: { nome: "Nome deve ter no mínimo 3 caracteres" },
      });

      renderWithRouter(<EditarJogador />);

      expect(screen.getByTestId("nome-error")).toHaveTextContent(
        "Nome deve ter no mínimo 3 caracteres"
      );
    });

    it("deve exibir erro do campo email", () => {
      mockUseEditarJogador.mockReturnValue({
        ...defaultMockReturn,
        errors: { email: "Email inválido" },
      });

      renderWithRouter(<EditarJogador />);

      expect(screen.getByTestId("email-error")).toHaveTextContent("Email inválido");
    });
  });

  describe("Interações", () => {
    it("deve chamar handleChange ao digitar no nome", () => {
      const mockHandleChange = jest.fn();
      mockUseEditarJogador.mockReturnValue({
        ...defaultMockReturn,
        handleChange: mockHandleChange,
      });

      renderWithRouter(<EditarJogador />);

      fireEvent.change(screen.getByTestId("nome-input"), {
        target: { value: "Maria Silva" },
      });

      expect(mockHandleChange).toHaveBeenCalled();
    });

    it("deve chamar handleSubmit ao submeter formulário", () => {
      const mockHandleSubmit = jest.fn((e) => e.preventDefault());
      mockUseEditarJogador.mockReturnValue({
        ...defaultMockReturn,
        handleSubmit: mockHandleSubmit,
      });

      renderWithRouter(<EditarJogador />);

      fireEvent.click(screen.getByText("Salvar Alterações"));

      expect(mockHandleSubmit).toHaveBeenCalled();
    });

    it("deve chamar handleCancel ao clicar em Voltar", () => {
      const mockHandleCancel = jest.fn();
      mockUseEditarJogador.mockReturnValue({
        ...defaultMockReturn,
        handleCancel: mockHandleCancel,
      });

      renderWithRouter(<EditarJogador />);

      fireEvent.click(screen.getByText("← Voltar"));

      expect(mockHandleCancel).toHaveBeenCalled();
    });

    it("deve chamar handleCancel ao clicar em Cancelar", () => {
      const mockHandleCancel = jest.fn();
      mockUseEditarJogador.mockReturnValue({
        ...defaultMockReturn,
        handleCancel: mockHandleCancel,
      });

      renderWithRouter(<EditarJogador />);

      fireEvent.click(screen.getByText("Cancelar"));

      expect(mockHandleCancel).toHaveBeenCalled();
    });
  });

  describe("Valores do formulário", () => {
    it("deve exibir valor do nome", () => {
      renderWithRouter(<EditarJogador />);

      expect(screen.getByTestId("nome-input")).toHaveValue("João Silva");
    });

    it("deve exibir valor do email", () => {
      renderWithRouter(<EditarJogador />);

      expect(screen.getByTestId("email-input")).toHaveValue("joao@email.com");
    });

    it("deve exibir nível e status", () => {
      renderWithRouter(<EditarJogador />);

      expect(screen.getByTestId("nivel-status")).toHaveTextContent(
        `Nível: ${NivelJogador.INTERMEDIARIO}`
      );
      expect(screen.getByTestId("nivel-status")).toHaveTextContent(
        `Status: ${StatusJogador.ATIVO}`
      );
    });

    it("deve exibir gênero", () => {
      renderWithRouter(<EditarJogador />);

      expect(screen.getByTestId("informacoes-basicas")).toHaveTextContent(
        `Gênero: ${GeneroJogador.MASCULINO}`
      );
    });
  });
});
