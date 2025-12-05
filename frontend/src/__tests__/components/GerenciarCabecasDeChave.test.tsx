/**
 * Testes do componente GerenciarCabecasDeChave
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { FormatoEtapa } from "@/types/etapa";

// Mock do service
const mockListarAtivas = jest.fn();
const mockCriar = jest.fn();
const mockRemover = jest.fn();
const mockReordenar = jest.fn();

jest.mock("@/services", () => ({
  getCabecaDeChaveService: () => ({
    listarAtivas: mockListarAtivas,
    criar: mockCriar,
    remover: mockRemover,
    reordenar: mockReordenar,
  }),
}));

// Mock do Pagination
jest.mock("@/components/ui", () => ({
  Pagination: ({
    currentPage,
    totalPages,
    onPageChange,
  }: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
  }) => (
    <div data-testid="pagination">
      <span>Página {currentPage} de {totalPages}</span>
      <button onClick={() => onPageChange(currentPage + 1)}>Próxima</button>
    </div>
  ),
}));

import { GerenciarCabecasDeChave } from "@/components/etapas/GerenciarCabecasDeChave/GerenciarCabecasDeChave";

const mockInscricoes = [
  {
    id: "insc-1",
    jogadorId: "jog-1",
    jogadorNome: "João Silva",
    jogadorNivel: "avancado",
    etapaId: "etapa-1",
    status: "confirmada",
  },
  {
    id: "insc-2",
    jogadorId: "jog-2",
    jogadorNome: "Maria Santos",
    jogadorNivel: "intermediario",
    etapaId: "etapa-1",
    status: "confirmada",
  },
  {
    id: "insc-3",
    jogadorId: "jog-3",
    jogadorNome: "Pedro Oliveira",
    jogadorNivel: "iniciante",
    etapaId: "etapa-1",
    status: "confirmada",
  },
  {
    id: "insc-4",
    jogadorId: "jog-4",
    jogadorNome: "Ana Costa",
    jogadorNivel: "avancado",
    etapaId: "etapa-1",
    status: "confirmada",
  },
];

const mockCabecas = [
  {
    id: "cab-1",
    jogadorId: "jog-1",
    jogadorNome: "João Silva",
    ordem: 1,
    arenaId: "arena-1",
    etapaId: "etapa-1",
  },
  {
    id: "cab-2",
    jogadorId: "jog-2",
    jogadorNome: "Maria Santos",
    ordem: 2,
    arenaId: "arena-1",
    etapaId: "etapa-1",
  },
];

const defaultProps = {
  arenaId: "arena-1",
  etapaId: "etapa-1",
  inscricoes: mockInscricoes,
  formato: FormatoEtapa.DUPLA_FIXA,
  totalInscritos: 16,
  qtdGrupos: 4,
  onUpdate: jest.fn(),
  readOnly: false,
};

describe("GerenciarCabecasDeChave", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockListarAtivas.mockResolvedValue([]);
  });

  describe("renderização inicial", () => {
    it("deve retornar null quando não há inscrições", () => {
      const { container } = render(
        <GerenciarCabecasDeChave {...defaultProps} inscricoes={[]} />
      );

      expect(container.firstChild).toBeNull();
    });

    it("deve mostrar título 'Cabeças de Chave'", async () => {
      render(<GerenciarCabecasDeChave {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Cabeças de Chave")).toBeInTheDocument();
      });
    });

    it("deve mostrar contador de cabeças selecionadas", async () => {
      render(<GerenciarCabecasDeChave {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/0 \/ 8 selecionado/)).toBeInTheDocument();
      });
    });

    it("deve carregar cabeças existentes ao montar", async () => {
      mockListarAtivas.mockResolvedValue(mockCabecas);

      render(<GerenciarCabecasDeChave {...defaultProps} />);

      await waitFor(() => {
        expect(mockListarAtivas).toHaveBeenCalledWith("arena-1", "etapa-1");
      });
    });
  });

  describe("formato Dupla Fixa", () => {
    it("deve mostrar informação sobre Dupla Fixa", async () => {
      render(<GerenciarCabecasDeChave {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/Dupla Fixa:/)).toBeInTheDocument();
        expect(
          screen.getByText(/Cabeças de chave não podem formar dupla juntas/)
        ).toBeInTheDocument();
      });
    });

    it("deve calcular limite correto (2 por grupo)", async () => {
      render(
        <GerenciarCabecasDeChave {...defaultProps} qtdGrupos={4} />
      );

      await waitFor(() => {
        expect(screen.getByText(/0 \/ 8 selecionado/)).toBeInTheDocument();
      });
    });
  });

  describe("formato Rei da Praia", () => {
    it("deve mostrar informação sobre Rei da Praia", async () => {
      render(
        <GerenciarCabecasDeChave
          {...defaultProps}
          formato={FormatoEtapa.REI_DA_PRAIA}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Rei da Praia:/)).toBeInTheDocument();
        expect(
          screen.getByText(/Cabeças de chave ficam em grupos separados/)
        ).toBeInTheDocument();
      });
    });

    it("deve calcular limite correto (1 por grupo = totalInscritos/4)", async () => {
      render(
        <GerenciarCabecasDeChave
          {...defaultProps}
          formato={FormatoEtapa.REI_DA_PRAIA}
          totalInscritos={16}
        />
      );

      await waitFor(() => {
        // 16 inscritos / 4 = 4 cabeças máximo
        expect(screen.getByText(/0 \/ 4 selecionado/)).toBeInTheDocument();
      });
    });
  });

  describe("lista de jogadores", () => {
    it("deve mostrar lista de jogadores para selecionar", async () => {
      render(<GerenciarCabecasDeChave {...defaultProps} />);

      await waitFor(() => {
        expect(
          screen.getByText("Selecione Jogadores como Cabeças:")
        ).toBeInTheDocument();
        expect(screen.getByText("João Silva")).toBeInTheDocument();
        expect(screen.getByText("Maria Santos")).toBeInTheDocument();
      });
    });

    it("deve mostrar nível do jogador", async () => {
      render(<GerenciarCabecasDeChave {...defaultProps} />);

      await waitFor(() => {
        // Há 2 jogadores avançados
        expect(screen.getAllByText("Avançado").length).toBeGreaterThan(0);
        expect(screen.getByText("Intermediário")).toBeInTheDocument();
        expect(screen.getByText("Iniciante")).toBeInTheDocument();
      });
    });

    it("deve mostrar checkboxes para seleção", async () => {
      render(<GerenciarCabecasDeChave {...defaultProps} />);

      await waitFor(() => {
        const checkboxes = screen.getAllByRole("checkbox");
        expect(checkboxes.length).toBe(4);
      });
    });
  });

  describe("seleção de cabeças de chave", () => {
    it("deve selecionar jogador como cabeça ao clicar", async () => {
      const onUpdate = jest.fn();
      mockCriar.mockResolvedValue({
        id: "cab-novo",
        jogadorId: "jog-1",
        jogadorNome: "João Silva",
        ordem: 1,
      });

      render(
        <GerenciarCabecasDeChave {...defaultProps} onUpdate={onUpdate} />
      );

      await waitFor(() => {
        expect(screen.getByText("João Silva")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("João Silva"));

      await waitFor(() => {
        expect(mockCriar).toHaveBeenCalledWith({
          arenaId: "arena-1",
          etapaId: "etapa-1",
          jogadorId: "jog-1",
          jogadorNome: "João Silva",
          ordem: 1,
        });
        expect(onUpdate).toHaveBeenCalled();
      });
    });

    it("deve remover jogador ao clicar novamente", async () => {
      mockListarAtivas.mockResolvedValue([mockCabecas[0]]);
      const onUpdate = jest.fn();
      mockRemover.mockResolvedValue(undefined);

      render(
        <GerenciarCabecasDeChave {...defaultProps} onUpdate={onUpdate} />
      );

      await waitFor(() => {
        // João Silva aparece tanto na lista de cabeças quanto na lista de jogadores
        expect(screen.getAllByText("João Silva").length).toBeGreaterThan(0);
      });

      // Clica no primeiro João Silva (na lista de jogadores para seleção)
      const joaoElements = screen.getAllByText("João Silva");
      fireEvent.click(joaoElements[joaoElements.length - 1]);

      await waitFor(() => {
        expect(mockRemover).toHaveBeenCalledWith("arena-1", "etapa-1", "jog-1");
        expect(onUpdate).toHaveBeenCalled();
      });
    });
  });

  describe("lista de cabeças selecionadas", () => {
    it("deve mostrar cabeças selecionadas com ordem", async () => {
      mockListarAtivas.mockResolvedValue(mockCabecas);

      render(<GerenciarCabecasDeChave {...defaultProps} />);

      await waitFor(() => {
        expect(
          screen.getByText("Ordem das Cabeças de Chave:")
        ).toBeInTheDocument();
        // Há múltiplas ocorrências de #1 e #2 (na lista de cabeças e nos badges)
        expect(screen.getAllByText("#1").length).toBeGreaterThan(0);
        expect(screen.getAllByText("#2").length).toBeGreaterThan(0);
      });
    });

    it("deve mostrar botões de reordenar", async () => {
      mockListarAtivas.mockResolvedValue(mockCabecas);

      render(<GerenciarCabecasDeChave {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getAllByText("▲").length).toBe(2);
        expect(screen.getAllByText("▼").length).toBe(2);
      });
    });

    it("deve mostrar botão de remover", async () => {
      mockListarAtivas.mockResolvedValue(mockCabecas);

      render(<GerenciarCabecasDeChave {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getAllByText("✕").length).toBe(2);
      });
    });
  });

  describe("reordenação", () => {
    it("deve mover cabeça para cima", async () => {
      mockListarAtivas.mockResolvedValue(mockCabecas);
      mockReordenar.mockResolvedValue(undefined);

      render(<GerenciarCabecasDeChave {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getAllByText("▲").length).toBe(2);
      });

      // Clica no botão de subir do segundo item
      const upButtons = screen.getAllByText("▲");
      fireEvent.click(upButtons[1]);

      await waitFor(() => {
        expect(mockReordenar).toHaveBeenCalled();
      });
    });

    it("deve desabilitar subir no primeiro item", async () => {
      mockListarAtivas.mockResolvedValue(mockCabecas);

      render(<GerenciarCabecasDeChave {...defaultProps} />);

      await waitFor(() => {
        const upButtons = screen.getAllByTitle("Mover para cima");
        expect(upButtons[0]).toBeDisabled();
      });
    });

    it("deve desabilitar descer no último item", async () => {
      mockListarAtivas.mockResolvedValue(mockCabecas);

      render(<GerenciarCabecasDeChave {...defaultProps} />);

      await waitFor(() => {
        const downButtons = screen.getAllByTitle("Mover para baixo");
        expect(downButtons[downButtons.length - 1]).toBeDisabled();
      });
    });
  });

  describe("remoção de cabeça", () => {
    it("deve remover cabeça ao clicar no X", async () => {
      mockListarAtivas.mockResolvedValue([mockCabecas[0]]);
      mockRemover.mockResolvedValue(undefined);
      const onUpdate = jest.fn();

      render(
        <GerenciarCabecasDeChave {...defaultProps} onUpdate={onUpdate} />
      );

      await waitFor(() => {
        expect(screen.getByText("✕")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTitle("Remover"));

      await waitFor(() => {
        expect(mockRemover).toHaveBeenCalledWith("arena-1", "etapa-1", "jog-1");
        expect(onUpdate).toHaveBeenCalled();
      });
    });
  });

  describe("modo somente leitura", () => {
    it("deve mostrar indicação de somente visualização", async () => {
      mockListarAtivas.mockResolvedValue(mockCabecas);

      render(<GerenciarCabecasDeChave {...defaultProps} readOnly={true} />);

      await waitFor(() => {
        expect(screen.getByText(/\(Somente visualização\)/)).toBeInTheDocument();
      });
    });

    it("deve mostrar título diferente para lista de cabeças", async () => {
      mockListarAtivas.mockResolvedValue(mockCabecas);

      render(<GerenciarCabecasDeChave {...defaultProps} readOnly={true} />);

      await waitFor(() => {
        expect(
          screen.getByText("Cabeças de Chave Definidas:")
        ).toBeInTheDocument();
      });
    });

    it("não deve mostrar botões de ação quando readOnly", async () => {
      mockListarAtivas.mockResolvedValue(mockCabecas);

      render(<GerenciarCabecasDeChave {...defaultProps} readOnly={true} />);

      await waitFor(() => {
        expect(screen.queryByText("▲")).not.toBeInTheDocument();
        expect(screen.queryByText("▼")).not.toBeInTheDocument();
        expect(screen.queryByText("✕")).not.toBeInTheDocument();
      });
    });

    it("não deve mostrar lista de seleção quando readOnly", async () => {
      mockListarAtivas.mockResolvedValue(mockCabecas);

      render(<GerenciarCabecasDeChave {...defaultProps} readOnly={true} />);

      await waitFor(() => {
        expect(
          screen.queryByText("Selecione Jogadores como Cabeças:")
        ).not.toBeInTheDocument();
      });
    });

    it("deve mostrar mensagem vazia quando readOnly e sem cabeças", async () => {
      mockListarAtivas.mockResolvedValue([]);

      render(<GerenciarCabecasDeChave {...defaultProps} readOnly={true} />);

      await waitFor(() => {
        expect(
          screen.getByText(
            "Nenhuma cabeça de chave foi definida para esta etapa."
          )
        ).toBeInTheDocument();
      });
    });
  });

  describe("limite de cabeças", () => {
    it("deve mostrar alerta quando limite é atingido", async () => {
      const alertMock = jest.spyOn(window, "alert").mockImplementation(() => {});

      // Já tem 8 cabeças (limite para 4 grupos)
      const cabecasCheias = Array.from({ length: 8 }, (_, i) => ({
        id: `cab-${i}`,
        jogadorId: `jog-${i}`,
        jogadorNome: `Jogador ${i}`,
        ordem: i + 1,
        arenaId: "arena-1",
        etapaId: "etapa-1",
      }));

      mockListarAtivas.mockResolvedValue(cabecasCheias);

      // Adiciona mais inscrições para ter alguém não selecionado
      const maisInscricoes = [
        ...mockInscricoes,
        {
          id: "insc-extra",
          jogadorId: "jog-extra",
          jogadorNome: "Jogador Extra",
          jogadorNivel: "avancado",
          etapaId: "etapa-1",
          status: "confirmada",
        },
      ];

      render(
        <GerenciarCabecasDeChave {...defaultProps} inscricoes={maisInscricoes} />
      );

      await waitFor(() => {
        expect(screen.getByText("Jogador Extra")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Jogador Extra"));

      await waitFor(() => {
        expect(alertMock).toHaveBeenCalledWith(
          expect.stringContaining("Limite atingido")
        );
      });

      alertMock.mockRestore();
    });
  });

  describe("paginação", () => {
    it("deve mostrar paginação quando há mais de 12 inscrições", async () => {
      const muitasInscricoes = Array.from({ length: 15 }, (_, i) => ({
        id: `insc-${i}`,
        jogadorId: `jog-${i}`,
        jogadorNome: `Jogador ${i}`,
        jogadorNivel: "avancado",
        etapaId: "etapa-1",
        status: "confirmada",
      }));

      render(
        <GerenciarCabecasDeChave {...defaultProps} inscricoes={muitasInscricoes} />
      );

      await waitFor(() => {
        expect(screen.getByTestId("pagination")).toBeInTheDocument();
      });
    });

    it("não deve mostrar paginação quando há 12 ou menos inscrições", async () => {
      render(<GerenciarCabecasDeChave {...defaultProps} />);

      await waitFor(() => {
        expect(screen.queryByTestId("pagination")).not.toBeInTheDocument();
      });
    });
  });

  describe("tratamento de erros", () => {
    it("deve mostrar alerta em erro ao criar cabeça", async () => {
      const alertMock = jest.spyOn(window, "alert").mockImplementation(() => {});
      mockCriar.mockRejectedValue(new Error("Erro ao criar"));

      render(<GerenciarCabecasDeChave {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("João Silva")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("João Silva"));

      await waitFor(() => {
        expect(alertMock).toHaveBeenCalledWith("Erro ao criar");
      });

      alertMock.mockRestore();
    });

    it("deve mostrar alerta em erro ao reordenar", async () => {
      const alertMock = jest.spyOn(window, "alert").mockImplementation(() => {});
      mockListarAtivas.mockResolvedValue(mockCabecas);
      mockReordenar.mockRejectedValue(new Error("Erro ao reordenar"));

      render(<GerenciarCabecasDeChave {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getAllByText("▲").length).toBe(2);
      });

      const upButtons = screen.getAllByText("▲");
      fireEvent.click(upButtons[1]);

      await waitFor(() => {
        expect(alertMock).toHaveBeenCalledWith("Erro ao reordenar cabeças");
      });

      alertMock.mockRestore();
    });

    it("deve limpar cabeças em caso de erro ao carregar", async () => {
      mockListarAtivas.mockRejectedValue(new Error("Erro de rede"));

      render(<GerenciarCabecasDeChave {...defaultProps} />);

      await waitFor(() => {
        // Componente deve renderizar sem cabeças
        expect(screen.getByText("Cabeças de Chave")).toBeInTheDocument();
        expect(screen.getByText(/0 \//)).toBeInTheDocument();
      });
    });
  });

  describe("badge de ordem", () => {
    it("deve mostrar badge com ordem na lista de jogadores", async () => {
      mockListarAtivas.mockResolvedValue([mockCabecas[0]]);

      render(<GerenciarCabecasDeChave {...defaultProps} />);

      await waitFor(() => {
        // Badge na lista de jogadores
        const badges = screen.getAllByText("#1");
        expect(badges.length).toBeGreaterThan(0);
      });
    });
  });
});
