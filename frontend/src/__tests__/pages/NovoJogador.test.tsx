/**
 * Testes de renderização da página NovoJogador
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { useNovoJogador } from "@/pages/NovoJogador/hooks/useNovoJogador";
import NovoJogador from "@/pages/NovoJogador";
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

// Mock do hook useNovoJogador
jest.mock("@/pages/NovoJogador/hooks/useNovoJogador", () => ({
  useNovoJogador: jest.fn(),
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
      <input
        data-testid="telefone-input"
        value={telefone}
        onChange={(e) =>
          onChange({ target: { name: "telefone", value: e.target.value } })
        }
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
      <button
        onClick={() => onChange({ target: { name: "nivel", value: "A" } })}
        data-testid="nivel-btn"
      >
        Mudar Nível
      </button>
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

describe("NovoJogador - Renderização", () => {
  const mockUseNovoJogador = useNovoJogador as jest.Mock;

  const defaultMockReturn = {
    formData: {
      nome: "",
      email: "",
      telefone: "",
      dataNascimento: "",
      genero: GeneroJogador.MASCULINO,
      nivel: NivelJogador.INICIANTE,
      status: StatusJogador.ATIVO,
      observacoes: "",
    },
    errors: {},
    loading: false,
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
    mockUseNovoJogador.mockReturnValue(defaultMockReturn);
  });

  describe("Estrutura básica", () => {
    it("deve renderizar o título", () => {
      renderWithRouter(<NovoJogador />);

      expect(screen.getByText("Novo Jogador")).toBeInTheDocument();
    });

    it("deve renderizar o subtítulo", () => {
      renderWithRouter(<NovoJogador />);

      expect(
        screen.getByText("Cadastre um novo jogador na sua arena")
      ).toBeInTheDocument();
    });

    it("deve renderizar botão de voltar", () => {
      renderWithRouter(<NovoJogador />);

      expect(screen.getByText("← Voltar")).toBeInTheDocument();
    });

    it("deve renderizar footer", () => {
      renderWithRouter(<NovoJogador />);

      expect(screen.getByTestId("footer")).toBeInTheDocument();
    });
  });

  describe("Componentes do formulário", () => {
    it("deve renderizar InformacoesBasicas", () => {
      renderWithRouter(<NovoJogador />);

      expect(screen.getByTestId("informacoes-basicas")).toBeInTheDocument();
    });

    it("deve renderizar NivelStatus", () => {
      renderWithRouter(<NovoJogador />);

      expect(screen.getByTestId("nivel-status")).toBeInTheDocument();
    });

    it("deve renderizar ObservacoesField", () => {
      renderWithRouter(<NovoJogador />);

      expect(screen.getByTestId("observacoes-field")).toBeInTheDocument();
    });
  });

  describe("Botões de ação", () => {
    it("deve renderizar botão Cancelar", () => {
      renderWithRouter(<NovoJogador />);

      expect(screen.getByText("Cancelar")).toBeInTheDocument();
    });

    it("deve renderizar botão Cadastrar Jogador", () => {
      renderWithRouter(<NovoJogador />);

      expect(screen.getByText("Cadastrar Jogador")).toBeInTheDocument();
    });

    it("deve mostrar Cadastrando... quando loading", () => {
      mockUseNovoJogador.mockReturnValue({
        ...defaultMockReturn,
        loading: true,
      });

      renderWithRouter(<NovoJogador />);

      expect(screen.getByText("Cadastrando...")).toBeInTheDocument();
    });

    it("deve desabilitar botão submit quando loading", () => {
      mockUseNovoJogador.mockReturnValue({
        ...defaultMockReturn,
        loading: true,
      });

      renderWithRouter(<NovoJogador />);

      const submitButton = screen.getByRole("button", { name: /Cadastrando/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe("Alertas", () => {
    it("não deve renderizar alertas quando não há mensagens", () => {
      renderWithRouter(<NovoJogador />);

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("deve renderizar alerta de erro quando há errorMessage", () => {
      mockUseNovoJogador.mockReturnValue({
        ...defaultMockReturn,
        errorMessage: "Nome é obrigatório",
      });

      renderWithRouter(<NovoJogador />);

      expect(screen.getByText("Nome é obrigatório")).toBeInTheDocument();
    });

    it("deve renderizar alerta de sucesso quando há successMessage", () => {
      mockUseNovoJogador.mockReturnValue({
        ...defaultMockReturn,
        successMessage: "Jogador cadastrado com sucesso!",
      });

      renderWithRouter(<NovoJogador />);

      expect(
        screen.getByText("Jogador cadastrado com sucesso!")
      ).toBeInTheDocument();
    });

    it("deve chamar setErrorMessage ao fechar alerta de erro", () => {
      const mockSetErrorMessage = jest.fn();
      mockUseNovoJogador.mockReturnValue({
        ...defaultMockReturn,
        errorMessage: "Erro ao cadastrar",
        setErrorMessage: mockSetErrorMessage,
      });

      renderWithRouter(<NovoJogador />);

      // Clicar no botão de fechar
      const closeButtons = screen.getAllByText("×");
      fireEvent.click(closeButtons[0]);

      expect(mockSetErrorMessage).toHaveBeenCalledWith("");
    });

    it("deve chamar setSuccessMessage ao fechar alerta de sucesso", () => {
      const mockSetSuccessMessage = jest.fn();
      mockUseNovoJogador.mockReturnValue({
        ...defaultMockReturn,
        successMessage: "Cadastrado!",
        setSuccessMessage: mockSetSuccessMessage,
      });

      renderWithRouter(<NovoJogador />);

      // Clicar no botão de fechar
      const closeButtons = screen.getAllByText("×");
      fireEvent.click(closeButtons[0]);

      expect(mockSetSuccessMessage).toHaveBeenCalledWith("");
    });
  });

  describe("Erros de validação", () => {
    it("deve exibir erro do campo nome", () => {
      mockUseNovoJogador.mockReturnValue({
        ...defaultMockReturn,
        errors: { nome: "Nome deve ter no mínimo 3 caracteres" },
      });

      renderWithRouter(<NovoJogador />);

      expect(screen.getByTestId("nome-error")).toHaveTextContent(
        "Nome deve ter no mínimo 3 caracteres"
      );
    });

    it("deve exibir erro do campo email", () => {
      mockUseNovoJogador.mockReturnValue({
        ...defaultMockReturn,
        errors: { email: "Email inválido" },
      });

      renderWithRouter(<NovoJogador />);

      expect(screen.getByTestId("email-error")).toHaveTextContent("Email inválido");
    });
  });

  describe("Interações", () => {
    it("deve chamar handleChange ao digitar no nome", () => {
      const mockHandleChange = jest.fn();
      mockUseNovoJogador.mockReturnValue({
        ...defaultMockReturn,
        handleChange: mockHandleChange,
      });

      renderWithRouter(<NovoJogador />);

      fireEvent.change(screen.getByTestId("nome-input"), {
        target: { value: "João Silva" },
      });

      expect(mockHandleChange).toHaveBeenCalled();
    });

    it("deve chamar handleChange ao digitar no email", () => {
      const mockHandleChange = jest.fn();
      mockUseNovoJogador.mockReturnValue({
        ...defaultMockReturn,
        handleChange: mockHandleChange,
      });

      renderWithRouter(<NovoJogador />);

      fireEvent.change(screen.getByTestId("email-input"), {
        target: { value: "joao@email.com" },
      });

      expect(mockHandleChange).toHaveBeenCalled();
    });

    it("deve chamar handleSubmit ao submeter formulário", () => {
      const mockHandleSubmit = jest.fn((e) => e.preventDefault());
      mockUseNovoJogador.mockReturnValue({
        ...defaultMockReturn,
        handleSubmit: mockHandleSubmit,
      });

      renderWithRouter(<NovoJogador />);

      fireEvent.click(screen.getByText("Cadastrar Jogador"));

      expect(mockHandleSubmit).toHaveBeenCalled();
    });

    it("deve chamar handleCancel ao clicar em Voltar", () => {
      const mockHandleCancel = jest.fn();
      mockUseNovoJogador.mockReturnValue({
        ...defaultMockReturn,
        handleCancel: mockHandleCancel,
      });

      renderWithRouter(<NovoJogador />);

      fireEvent.click(screen.getByText("← Voltar"));

      expect(mockHandleCancel).toHaveBeenCalled();
    });

    it("deve chamar handleCancel ao clicar em Cancelar", () => {
      const mockHandleCancel = jest.fn();
      mockUseNovoJogador.mockReturnValue({
        ...defaultMockReturn,
        handleCancel: mockHandleCancel,
      });

      renderWithRouter(<NovoJogador />);

      fireEvent.click(screen.getByText("Cancelar"));

      expect(mockHandleCancel).toHaveBeenCalled();
    });
  });

  describe("Valores do formulário", () => {
    it("deve exibir valor do nome", () => {
      mockUseNovoJogador.mockReturnValue({
        ...defaultMockReturn,
        formData: {
          ...defaultMockReturn.formData,
          nome: "João Silva",
        },
      });

      renderWithRouter(<NovoJogador />);

      expect(screen.getByTestId("nome-input")).toHaveValue("João Silva");
    });

    it("deve exibir valor do email", () => {
      mockUseNovoJogador.mockReturnValue({
        ...defaultMockReturn,
        formData: {
          ...defaultMockReturn.formData,
          email: "joao@email.com",
        },
      });

      renderWithRouter(<NovoJogador />);

      expect(screen.getByTestId("email-input")).toHaveValue("joao@email.com");
    });

    it("deve exibir nível e status", () => {
      renderWithRouter(<NovoJogador />);

      expect(screen.getByTestId("nivel-status")).toHaveTextContent(
        `Nível: ${NivelJogador.INICIANTE}`
      );
      expect(screen.getByTestId("nivel-status")).toHaveTextContent(
        `Status: ${StatusJogador.ATIVO}`
      );
    });

    it("deve exibir gênero", () => {
      renderWithRouter(<NovoJogador />);

      expect(screen.getByTestId("informacoes-basicas")).toHaveTextContent(
        `Gênero: ${GeneroJogador.MASCULINO}`
      );
    });
  });
});
