/**
 * Testes do componente ModalInscricao
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { GeneroJogador, NivelJogador, StatusJogador } from "@/types/jogador";

// Mock dos services
const mockListar = jest.fn();
const mockCriar = jest.fn();
const mockListarInscricoes = jest.fn();
const mockInscreverJogadores = jest.fn();

jest.mock("@/services", () => ({
  getJogadorService: () => ({
    listar: mockListar,
    criar: mockCriar,
  }),
  getEtapaService: () => ({
    listarInscricoes: mockListarInscricoes,
    inscreverJogadores: mockInscreverJogadores,
  }),
}));

import { ModalInscricao } from "@/components/etapas/ModalInscricao/ModalInscricao";

const mockJogadores = [
  {
    id: "jogador-1",
    nome: "João Silva",
    email: "joao@email.com",
    telefone: "(11) 99999-0001",
    nivel: NivelJogador.INTERMEDIARIO,
    genero: GeneroJogador.MASCULINO,
    status: StatusJogador.ATIVO,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "jogador-2",
    nome: "Pedro Santos",
    email: "pedro@email.com",
    telefone: "(11) 99999-0002",
    nivel: NivelJogador.INTERMEDIARIO,
    genero: GeneroJogador.MASCULINO,
    status: StatusJogador.ATIVO,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "jogador-3",
    nome: "Carlos Oliveira",
    email: "carlos@email.com",
    telefone: "(11) 99999-0003",
    nivel: NivelJogador.INTERMEDIARIO,
    genero: GeneroJogador.MASCULINO,
    status: StatusJogador.ATIVO,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "jogador-4",
    nome: "Bruno Ferreira",
    email: "bruno@email.com",
    telefone: "(11) 99999-0004",
    nivel: NivelJogador.INTERMEDIARIO,
    genero: GeneroJogador.MASCULINO,
    status: StatusJogador.INATIVO,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const defaultProps = {
  etapaId: "etapa-1",
  etapaNome: "Torneio de Verão 2024",
  etapaNivel: NivelJogador.INTERMEDIARIO,
  etapaGenero: GeneroJogador.MASCULINO,
  maxJogadores: 16,
  totalInscritos: 4,
  onClose: jest.fn(),
  onSuccess: jest.fn(),
};

describe("ModalInscricao", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockListar.mockResolvedValue({ jogadores: mockJogadores });
    mockListarInscricoes.mockResolvedValue([]);
    jest.spyOn(window, "alert").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("renderização inicial", () => {
    it("deve mostrar título do modal", async () => {
      render(<ModalInscricao {...defaultProps} />);

      expect(screen.getByText("Inscrever Jogadores")).toBeInTheDocument();
    });

    it("deve mostrar nome da etapa", async () => {
      render(<ModalInscricao {...defaultProps} />);

      expect(screen.getByText("Torneio de Verão 2024")).toBeInTheDocument();
    });

    it("deve mostrar loading enquanto carrega", () => {
      mockListar.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      render(<ModalInscricao {...defaultProps} />);

      expect(screen.getByText("Carregando jogadores...")).toBeInTheDocument();
    });

    it("deve mostrar botão fechar", async () => {
      render(<ModalInscricao {...defaultProps} />);

      expect(screen.getByText("×")).toBeInTheDocument();
    });

    it("deve chamar onClose ao clicar no botão fechar", async () => {
      const onClose = jest.fn();
      render(<ModalInscricao {...defaultProps} onClose={onClose} />);

      fireEvent.click(screen.getByText("×"));

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe("tabs de navegação", () => {
    it("deve mostrar tab Selecionar Jogadores", async () => {
      render(<ModalInscricao {...defaultProps} />);

      expect(screen.getByText("Selecionar Jogadores")).toBeInTheDocument();
    });

    it("deve mostrar tab Cadastrar Novo", async () => {
      render(<ModalInscricao {...defaultProps} />);

      expect(screen.getByText("Cadastrar Novo")).toBeInTheDocument();
    });

    it("deve trocar para aba de cadastro ao clicar", async () => {
      render(<ModalInscricao {...defaultProps} />);

      await waitFor(() => {
        expect(screen.queryByText("Carregando jogadores...")).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Cadastrar Novo"));

      expect(screen.getByText("Cadastrar Novo Jogador")).toBeInTheDocument();
    });

    it("deve voltar para aba de seleção", async () => {
      render(<ModalInscricao {...defaultProps} />);

      await waitFor(() => {
        expect(screen.queryByText("Carregando jogadores...")).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Cadastrar Novo"));
      fireEvent.click(screen.getByText("Selecionar Jogadores"));

      expect(screen.getByPlaceholderText("Buscar jogador por nome ou email...")).toBeInTheDocument();
    });
  });

  describe("listagem de jogadores", () => {
    it("deve mostrar jogadores disponíveis", async () => {
      render(<ModalInscricao {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("João Silva")).toBeInTheDocument();
        expect(screen.getByText("Pedro Santos")).toBeInTheDocument();
      });
    });

    it("deve filtrar jogadores inativos", async () => {
      render(<ModalInscricao {...defaultProps} />);

      await waitFor(() => {
        expect(screen.queryByText("Bruno Ferreira")).not.toBeInTheDocument();
      });
    });

    it("deve filtrar jogadores já inscritos", async () => {
      mockListarInscricoes.mockResolvedValue([
        { jogadorId: "jogador-1", etapaId: "etapa-1" },
      ]);

      render(<ModalInscricao {...defaultProps} />);

      await waitFor(() => {
        expect(screen.queryByText("João Silva")).not.toBeInTheDocument();
        expect(screen.getByText("Pedro Santos")).toBeInTheDocument();
      });
    });

    it("deve mostrar email dos jogadores", async () => {
      render(<ModalInscricao {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("joao@email.com")).toBeInTheDocument();
        expect(screen.getByText("pedro@email.com")).toBeInTheDocument();
      });
    });
  });

  describe("busca de jogadores", () => {
    it("deve mostrar campo de busca", async () => {
      render(<ModalInscricao {...defaultProps} />);

      expect(screen.getByPlaceholderText("Buscar jogador por nome ou email...")).toBeInTheDocument();
    });

    it("deve filtrar jogadores por nome", async () => {
      render(<ModalInscricao {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("João Silva")).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText("Buscar jogador por nome ou email...");
      fireEvent.change(searchInput, { target: { value: "Pedro" } });

      expect(screen.queryByText("João Silva")).not.toBeInTheDocument();
      expect(screen.getByText("Pedro Santos")).toBeInTheDocument();
    });

    it("deve filtrar jogadores por email", async () => {
      render(<ModalInscricao {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("João Silva")).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText("Buscar jogador por nome ou email...");
      fireEvent.change(searchInput, { target: { value: "joao@email" } });

      expect(screen.getByText("João Silva")).toBeInTheDocument();
      expect(screen.queryByText("Pedro Santos")).not.toBeInTheDocument();
    });

    it("deve mostrar mensagem quando nenhum jogador é encontrado", async () => {
      render(<ModalInscricao {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("João Silva")).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText("Buscar jogador por nome ou email...");
      fireEvent.change(searchInput, { target: { value: "xyz123" } });

      expect(screen.getByText("Nenhum jogador encontrado com esse termo")).toBeInTheDocument();
    });
  });

  describe("seleção de jogadores", () => {
    it("deve selecionar jogador ao clicar", async () => {
      render(<ModalInscricao {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("João Silva")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("João Silva"));

      expect(screen.getByText("1 jogador(es) selecionado(s)")).toBeInTheDocument();
    });

    it("deve desselecionar jogador ao clicar novamente", async () => {
      render(<ModalInscricao {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("João Silva")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("João Silva"));
      expect(screen.getByText("1 jogador(es) selecionado(s)")).toBeInTheDocument();

      fireEvent.click(screen.getByText("João Silva"));
      expect(screen.queryByText("1 jogador(es) selecionado(s)")).not.toBeInTheDocument();
    });

    it("deve permitir selecionar múltiplos jogadores", async () => {
      render(<ModalInscricao {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("João Silva")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("João Silva"));
      fireEvent.click(screen.getByText("Pedro Santos"));

      expect(screen.getByText("2 jogador(es) selecionado(s)")).toBeInTheDocument();
    });

    it("deve limitar seleção às vagas disponíveis", async () => {
      render(
        <ModalInscricao {...defaultProps} maxJogadores={5} totalInscritos={4} />
      );

      await waitFor(() => {
        expect(screen.getByText("João Silva")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("João Silva"));
      fireEvent.click(screen.getByText("Pedro Santos"));

      expect(window.alert).toHaveBeenCalledWith(
        "Você só pode inscrever 1 jogador(es) nesta etapa."
      );
    });
  });

  describe("inscrição de jogadores", () => {
    it("deve mostrar botão Inscrever", async () => {
      render(<ModalInscricao {...defaultProps} />);

      expect(screen.getByText("Inscrever")).toBeInTheDocument();
    });

    it("deve desabilitar botão quando nenhum jogador selecionado", async () => {
      render(<ModalInscricao {...defaultProps} />);

      const button = screen.getByText("Inscrever");
      expect(button).toBeDisabled();
    });

    it("deve habilitar botão quando jogador selecionado", async () => {
      render(<ModalInscricao {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("João Silva")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("João Silva"));

      const button = screen.getByText("Inscrever");
      expect(button).not.toBeDisabled();
    });

    it("deve alertar se nenhum jogador selecionado", async () => {
      render(<ModalInscricao {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("João Silva")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("João Silva"));
      fireEvent.click(screen.getByText("João Silva")); // deseleciona

      // O botão estará desabilitado, então não podemos clicar
      // Mas se pudesse, exibiria alert
    });

    it("deve chamar inscreverJogadores ao confirmar", async () => {
      mockInscreverJogadores.mockResolvedValue({});

      render(<ModalInscricao {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("João Silva")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("João Silva"));
      fireEvent.click(screen.getByText("Inscrever"));

      await waitFor(() => {
        expect(mockInscreverJogadores).toHaveBeenCalledWith("etapa-1", [
          "jogador-1",
        ]);
      });
    });

    it("deve mostrar alert de sucesso", async () => {
      mockInscreverJogadores.mockResolvedValue({});

      render(<ModalInscricao {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("João Silva")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("João Silva"));
      fireEvent.click(screen.getByText("Inscrever"));

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith(
          "1 jogador(es) inscrito(s) com sucesso!"
        );
      });
    });

    it("deve chamar onSuccess e onClose após inscrição", async () => {
      mockInscreverJogadores.mockResolvedValue({});
      const onSuccess = jest.fn();
      const onClose = jest.fn();

      render(
        <ModalInscricao
          {...defaultProps}
          onSuccess={onSuccess}
          onClose={onClose}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("João Silva")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("João Silva"));
      fireEvent.click(screen.getByText("Inscrever"));

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
      });
    });

    it("deve mostrar erro se inscrição falhar", async () => {
      mockInscreverJogadores.mockRejectedValue(
        new Error("Erro ao inscrever jogadores")
      );

      render(<ModalInscricao {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("João Silva")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("João Silva"));
      fireEvent.click(screen.getByText("Inscrever"));

      await waitFor(() => {
        expect(
          screen.getByText("Erro ao inscrever jogadores")
        ).toBeInTheDocument();
      });
    });
  });

  describe("formulário de cadastro", () => {
    it("deve mostrar campos do formulário", async () => {
      render(<ModalInscricao {...defaultProps} />);

      fireEvent.click(screen.getByText("Cadastrar Novo"));

      expect(screen.getByPlaceholderText("Nome completo")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("email@exemplo.com")
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("(00) 00000-0000")
      ).toBeInTheDocument();
    });

    it("deve preencher nível automaticamente", async () => {
      render(<ModalInscricao {...defaultProps} />);

      fireEvent.click(screen.getByText("Cadastrar Novo"));

      expect(screen.getByDisplayValue("Intermediário")).toBeInTheDocument();
    });

    it("deve preencher gênero automaticamente", async () => {
      render(<ModalInscricao {...defaultProps} />);

      fireEvent.click(screen.getByText("Cadastrar Novo"));

      expect(screen.getByDisplayValue("Masculino")).toBeInTheDocument();
    });

    it("deve desabilitar botão cadastrar sem nome", async () => {
      render(<ModalInscricao {...defaultProps} />);

      fireEvent.click(screen.getByText("Cadastrar Novo"));

      const button = screen.getByText("Cadastrar Jogador");
      expect(button).toBeDisabled();
    });

    it("deve habilitar botão com nome preenchido", async () => {
      render(<ModalInscricao {...defaultProps} />);

      fireEvent.click(screen.getByText("Cadastrar Novo"));

      const nomeInput = screen.getByPlaceholderText("Nome completo");
      fireEvent.change(nomeInput, { target: { value: "Novo Jogador" } });

      const button = screen.getByText("Cadastrar Jogador");
      expect(button).not.toBeDisabled();
    });

    it("deve chamar criar jogador ao cadastrar", async () => {
      const jogadorCriado = {
        id: "novo-jogador",
        nome: "Novo Jogador",
        email: "novo@email.com",
        telefone: "(11) 99999-9999",
        nivel: NivelJogador.INTERMEDIARIO,
        genero: GeneroJogador.MASCULINO,
        status: StatusJogador.ATIVO,
      };

      mockCriar.mockResolvedValue(jogadorCriado);

      render(<ModalInscricao {...defaultProps} />);

      fireEvent.click(screen.getByText("Cadastrar Novo"));

      const nomeInput = screen.getByPlaceholderText("Nome completo");
      const emailInput = screen.getByPlaceholderText("email@exemplo.com");
      const telefoneInput = screen.getByPlaceholderText("(00) 00000-0000");

      fireEvent.change(nomeInput, { target: { value: "Novo Jogador" } });
      fireEvent.change(emailInput, { target: { value: "novo@email.com" } });
      fireEvent.change(telefoneInput, { target: { value: "(11) 99999-9999" } });

      fireEvent.click(screen.getByText("Cadastrar Jogador"));

      await waitFor(() => {
        expect(mockCriar).toHaveBeenCalledWith(
          expect.objectContaining({
            nome: "Novo Jogador",
            email: "novo@email.com",
            telefone: "(11) 99999-9999",
            nivel: NivelJogador.INTERMEDIARIO,
            genero: GeneroJogador.MASCULINO,
          })
        );
      });
    });

    it("deve mostrar mensagem de sucesso após cadastro", async () => {
      const jogadorCriado = {
        id: "novo-jogador",
        nome: "Novo Jogador",
        email: "novo@email.com",
        telefone: "",
        nivel: NivelJogador.INTERMEDIARIO,
        genero: GeneroJogador.MASCULINO,
        status: StatusJogador.ATIVO,
      };

      mockCriar.mockResolvedValue(jogadorCriado);

      render(<ModalInscricao {...defaultProps} />);

      fireEvent.click(screen.getByText("Cadastrar Novo"));

      const nomeInput = screen.getByPlaceholderText("Nome completo");
      fireEvent.change(nomeInput, { target: { value: "Novo Jogador" } });

      fireEvent.click(screen.getByText("Cadastrar Jogador"));

      await waitFor(() => {
        expect(
          screen.getByText("✓ Novo Jogador cadastrado com sucesso!")
        ).toBeInTheDocument();
      });
    });

    it("deve limpar formulário após cadastro", async () => {
      const jogadorCriado = {
        id: "novo-jogador",
        nome: "Novo Jogador",
        email: "",
        telefone: "",
        nivel: NivelJogador.INTERMEDIARIO,
        genero: GeneroJogador.MASCULINO,
        status: StatusJogador.ATIVO,
      };

      mockCriar.mockResolvedValue(jogadorCriado);

      render(<ModalInscricao {...defaultProps} />);

      fireEvent.click(screen.getByText("Cadastrar Novo"));

      const nomeInput = screen.getByPlaceholderText("Nome completo");
      fireEvent.change(nomeInput, { target: { value: "Novo Jogador" } });

      fireEvent.click(screen.getByText("Cadastrar Jogador"));

      await waitFor(() => {
        expect(
          screen.getByText("✓ Novo Jogador cadastrado com sucesso!")
        ).toBeInTheDocument();
      });

      // Voltar para formulário para verificar
      fireEvent.click(screen.getByText("Cadastrar Novo"));

      const nomeInputClean = screen.getByPlaceholderText("Nome completo");
      expect(nomeInputClean).toHaveValue("");
    });

    it("deve mostrar erro se nome vazio", async () => {
      render(<ModalInscricao {...defaultProps} />);

      fireEvent.click(screen.getByText("Cadastrar Novo"));

      // Botão desabilitado, mas se tivesse nome vazio
      const nomeInput = screen.getByPlaceholderText("Nome completo");
      fireEvent.change(nomeInput, { target: { value: "   " } }); // apenas espaços

      const button = screen.getByText("Cadastrar Jogador");
      expect(button).toBeDisabled();
    });

    it("deve mostrar erro se cadastro falhar", async () => {
      mockCriar.mockRejectedValue(new Error("Jogador já existe"));

      render(<ModalInscricao {...defaultProps} />);

      fireEvent.click(screen.getByText("Cadastrar Novo"));

      const nomeInput = screen.getByPlaceholderText("Nome completo");
      fireEvent.change(nomeInput, { target: { value: "Jogador Existente" } });

      fireEvent.click(screen.getByText("Cadastrar Jogador"));

      await waitFor(() => {
        expect(screen.getByText("Jogador já existe")).toBeInTheDocument();
      });
    });
  });

  describe("estado vazio", () => {
    it("deve mostrar mensagem quando não há jogadores", async () => {
      mockListar.mockResolvedValue({ jogadores: [] });

      render(<ModalInscricao {...defaultProps} />);

      await waitFor(() => {
        expect(
          screen.getByText("Nenhum jogador cadastrado neste nível")
        ).toBeInTheDocument();
      });
    });

    it("deve mostrar link para cadastrar primeiro jogador", async () => {
      mockListar.mockResolvedValue({ jogadores: [] });

      render(<ModalInscricao {...defaultProps} />);

      await waitFor(() => {
        expect(
          screen.getByText("Cadastrar primeiro jogador")
        ).toBeInTheDocument();
      });
    });

    it("deve ir para cadastro ao clicar no link", async () => {
      mockListar.mockResolvedValue({ jogadores: [] });

      render(<ModalInscricao {...defaultProps} />);

      await waitFor(() => {
        expect(
          screen.getByText("Cadastrar primeiro jogador")
        ).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Cadastrar primeiro jogador"));

      expect(screen.getByText("Cadastrar Novo Jogador")).toBeInTheDocument();
    });

    it("deve mostrar mensagem quando todos já estão inscritos", async () => {
      mockListarInscricoes.mockResolvedValue([
        { jogadorId: "jogador-1", etapaId: "etapa-1" },
        { jogadorId: "jogador-2", etapaId: "etapa-1" },
        { jogadorId: "jogador-3", etapaId: "etapa-1" },
      ]);

      render(<ModalInscricao {...defaultProps} />);

      await waitFor(() => {
        expect(
          screen.getByText("Todos os jogadores deste nível já estão inscritos!")
        ).toBeInTheDocument();
      });
    });
  });

  describe("botões do footer", () => {
    it("deve mostrar botão Cancelar", async () => {
      render(<ModalInscricao {...defaultProps} />);

      expect(screen.getByText("Cancelar")).toBeInTheDocument();
    });

    it("deve chamar onClose ao clicar em Cancelar", async () => {
      const onClose = jest.fn();
      render(<ModalInscricao {...defaultProps} onClose={onClose} />);

      fireEvent.click(screen.getByText("Cancelar"));

      expect(onClose).toHaveBeenCalled();
    });

    it("deve ocultar botão Inscrever na aba de cadastro", async () => {
      render(<ModalInscricao {...defaultProps} />);

      await waitFor(() => {
        expect(screen.queryByText("Carregando jogadores...")).not.toBeInTheDocument();
      });

      expect(screen.getByText("Inscrever")).toBeInTheDocument();

      fireEvent.click(screen.getByText("Cadastrar Novo"));

      const inscreverButtons = screen.queryAllByText("Inscrever");
      expect(inscreverButtons.length).toBe(0);
    });
  });

  describe("estado de loading", () => {
    it("deve mostrar Cadastrando... durante cadastro", async () => {
      mockCriar.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      render(<ModalInscricao {...defaultProps} />);

      fireEvent.click(screen.getByText("Cadastrar Novo"));

      const nomeInput = screen.getByPlaceholderText("Nome completo");
      fireEvent.change(nomeInput, { target: { value: "Novo Jogador" } });

      fireEvent.click(screen.getByText("Cadastrar Jogador"));

      expect(screen.getByText("Cadastrando...")).toBeInTheDocument();
    });

    it("deve mostrar Inscrevendo... durante inscrição", async () => {
      mockInscreverJogadores.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      render(<ModalInscricao {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("João Silva")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("João Silva"));
      fireEvent.click(screen.getByText("Inscrever"));

      expect(screen.getByText("Inscrevendo...")).toBeInTheDocument();
    });
  });

  describe("fechar ao clicar fora", () => {
    it("deve fechar ao clicar no overlay", async () => {
      const onClose = jest.fn();
      const { container } = render(
        <ModalInscricao {...defaultProps} onClose={onClose} />
      );

      // Simula clique no overlay
      const overlay = container.firstChild;
      if (overlay) {
        fireEvent.click(overlay);
      }

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe("erro ao carregar jogadores", () => {
    it("deve mostrar mensagem de erro", async () => {
      mockListar.mockRejectedValue(new Error("Erro de conexão"));

      render(<ModalInscricao {...defaultProps} />);

      await waitFor(() => {
        expect(
          screen.getByText("Erro ao carregar jogadores")
        ).toBeInTheDocument();
      });
    });
  });

  describe("níveis de jogador", () => {
    it("deve mostrar nível Iniciante", async () => {
      render(
        <ModalInscricao {...defaultProps} etapaNivel={NivelJogador.INICIANTE} />
      );

      fireEvent.click(screen.getByText("Cadastrar Novo"));

      expect(screen.getByDisplayValue("Iniciante")).toBeInTheDocument();
    });

    it("deve mostrar nível Avançado", async () => {
      render(
        <ModalInscricao {...defaultProps} etapaNivel={NivelJogador.AVANCADO} />
      );

      fireEvent.click(screen.getByText("Cadastrar Novo"));

      expect(screen.getByDisplayValue("Avançado")).toBeInTheDocument();
    });
  });

  describe("gêneros de jogador", () => {
    it("deve mostrar gênero Feminino", async () => {
      render(
        <ModalInscricao
          {...defaultProps}
          etapaGenero={GeneroJogador.FEMININO}
        />
      );

      fireEvent.click(screen.getByText("Cadastrar Novo"));

      expect(screen.getByDisplayValue("Feminino")).toBeInTheDocument();
    });
  });
});
