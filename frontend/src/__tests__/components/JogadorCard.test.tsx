/**
 * Testes do componente JogadorCard
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import JogadorCard from "@/components/jogadores/JogadorCard/JogadorCard";
import {
  Jogador,
  NivelJogador,
  StatusJogador,
  GeneroJogador,
} from "@/types/jogador";

const mockJogador: Jogador = {
  id: "jogador-1",
  arenaId: "arena-1",
  nome: "João Silva",
  email: "joao@email.com",
  telefone: "(11) 99999-9999",
  genero: GeneroJogador.MASCULINO,
  nivel: NivelJogador.INTERMEDIARIO,
  status: StatusJogador.ATIVO,
  vitorias: 10,
  derrotas: 5,
  pontos: 150,
  criadoEm: "2024-01-01T00:00:00Z",
  atualizadoEm: "2024-01-01T00:00:00Z",
  criadoPor: "admin-1",
};

const renderWithRouter = (component: React.ReactNode) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe("JogadorCard", () => {
  describe("renderização básica", () => {
    it("deve renderizar o nome do jogador", () => {
      renderWithRouter(<JogadorCard jogador={mockJogador} />);
      expect(screen.getByText("João Silva")).toBeInTheDocument();
    });

    it("deve renderizar o avatar com a inicial do nome", () => {
      renderWithRouter(<JogadorCard jogador={mockJogador} />);
      expect(screen.getByText("J")).toBeInTheDocument();
    });

    it("deve renderizar o email quando fornecido", () => {
      renderWithRouter(<JogadorCard jogador={mockJogador} />);
      expect(screen.getByText("joao@email.com")).toBeInTheDocument();
    });

    it("deve renderizar o telefone quando fornecido", () => {
      renderWithRouter(<JogadorCard jogador={mockJogador} />);
      expect(screen.getByText("(11) 99999-9999")).toBeInTheDocument();
    });

    it("não deve renderizar contato quando email e telefone estão vazios", () => {
      const jogadorSemContato = { ...mockJogador, email: undefined, telefone: undefined };
      renderWithRouter(<JogadorCard jogador={jogadorSemContato} />);
      expect(screen.queryByText("joao@email.com")).not.toBeInTheDocument();
    });
  });

  describe("nível do jogador", () => {
    it("deve mostrar badge Iniciante", () => {
      const jogadorIniciante = { ...mockJogador, nivel: NivelJogador.INICIANTE };
      renderWithRouter(<JogadorCard jogador={jogadorIniciante} />);
      expect(screen.getByText("Iniciante")).toBeInTheDocument();
    });

    it("deve mostrar badge Intermediário", () => {
      renderWithRouter(<JogadorCard jogador={mockJogador} />);
      expect(screen.getByText("Intermediário")).toBeInTheDocument();
    });

    it("deve mostrar badge Avançado", () => {
      const jogadorAvancado = { ...mockJogador, nivel: NivelJogador.AVANCADO };
      renderWithRouter(<JogadorCard jogador={jogadorAvancado} />);
      expect(screen.getByText("Avançado")).toBeInTheDocument();
    });
  });

  describe("status do jogador", () => {
    it("deve mostrar badge Ativo", () => {
      renderWithRouter(<JogadorCard jogador={mockJogador} />);
      expect(screen.getByText("Ativo")).toBeInTheDocument();
    });

    it("deve mostrar badge Inativo", () => {
      const jogadorInativo = { ...mockJogador, status: StatusJogador.INATIVO };
      renderWithRouter(<JogadorCard jogador={jogadorInativo} />);
      expect(screen.getByText("Inativo")).toBeInTheDocument();
    });

    it("deve mostrar badge Suspenso", () => {
      const jogadorSuspenso = { ...mockJogador, status: StatusJogador.SUSPENSO };
      renderWithRouter(<JogadorCard jogador={jogadorSuspenso} />);
      expect(screen.getByText("Suspenso")).toBeInTheDocument();
    });
  });

  describe("botão Ver", () => {
    it("deve mostrar link Ver quando arenaSlug é fornecido", () => {
      renderWithRouter(
        <JogadorCard jogador={mockJogador} arenaSlug="minha-arena" />
      );
      const linkVer = screen.getByText("Ver");
      expect(linkVer).toBeInTheDocument();
      expect(linkVer.closest("a")).toHaveAttribute(
        "href",
        "/arena/minha-arena/jogador/jogador-1"
      );
    });

    it("não deve mostrar link Ver quando arenaSlug não é fornecido", () => {
      renderWithRouter(<JogadorCard jogador={mockJogador} />);
      expect(screen.queryByText("Ver")).not.toBeInTheDocument();
    });
  });

  describe("botão Editar", () => {
    it("deve mostrar botão Editar quando onEdit é fornecido", () => {
      const onEdit = jest.fn();
      renderWithRouter(<JogadorCard jogador={mockJogador} onEdit={onEdit} />);
      expect(screen.getByText("Editar")).toBeInTheDocument();
    });

    it("não deve mostrar botão Editar quando onEdit não é fornecido", () => {
      renderWithRouter(<JogadorCard jogador={mockJogador} />);
      expect(screen.queryByText("Editar")).not.toBeInTheDocument();
    });

    it("deve chamar onEdit com o jogador ao clicar", () => {
      const onEdit = jest.fn();
      renderWithRouter(<JogadorCard jogador={mockJogador} onEdit={onEdit} />);

      fireEvent.click(screen.getByText("Editar"));
      expect(onEdit).toHaveBeenCalledWith(mockJogador);
    });
  });

  describe("botão Deletar", () => {
    it("deve mostrar botão Deletar quando onDelete é fornecido", () => {
      const onDelete = jest.fn();
      renderWithRouter(
        <JogadorCard jogador={mockJogador} onDelete={onDelete} />
      );
      expect(screen.getByText("Deletar")).toBeInTheDocument();
    });

    it("não deve mostrar botão Deletar quando onDelete não é fornecido", () => {
      renderWithRouter(<JogadorCard jogador={mockJogador} />);
      expect(screen.queryByText("Deletar")).not.toBeInTheDocument();
    });

    it("deve chamar onDelete com o jogador ao clicar", () => {
      const onDelete = jest.fn();
      renderWithRouter(
        <JogadorCard jogador={mockJogador} onDelete={onDelete} />
      );

      fireEvent.click(screen.getByText("Deletar"));
      expect(onDelete).toHaveBeenCalledWith(mockJogador);
    });
  });

  describe("combinações de ações", () => {
    it("deve mostrar todos os botões quando todas as props são fornecidas", () => {
      const onEdit = jest.fn();
      const onDelete = jest.fn();
      renderWithRouter(
        <JogadorCard
          jogador={mockJogador}
          arenaSlug="minha-arena"
          onEdit={onEdit}
          onDelete={onDelete}
        />
      );

      expect(screen.getByText("Ver")).toBeInTheDocument();
      expect(screen.getByText("Editar")).toBeInTheDocument();
      expect(screen.getByText("Deletar")).toBeInTheDocument();
    });

    it("não deve mostrar nenhum botão quando nenhuma prop de ação é fornecida", () => {
      renderWithRouter(<JogadorCard jogador={mockJogador} />);

      expect(screen.queryByText("Ver")).not.toBeInTheDocument();
      expect(screen.queryByText("Editar")).not.toBeInTheDocument();
      expect(screen.queryByText("Deletar")).not.toBeInTheDocument();
    });
  });

  describe("jogador sem email", () => {
    it("deve renderizar normalmente sem email", () => {
      const jogadorSemEmail = { ...mockJogador, email: undefined };
      renderWithRouter(<JogadorCard jogador={jogadorSemEmail} />);
      expect(screen.getByText("João Silva")).toBeInTheDocument();
      expect(screen.getByText("(11) 99999-9999")).toBeInTheDocument();
    });
  });

  describe("jogador sem telefone", () => {
    it("deve renderizar normalmente sem telefone", () => {
      const jogadorSemTelefone = { ...mockJogador, telefone: undefined };
      renderWithRouter(<JogadorCard jogador={jogadorSemTelefone} />);
      expect(screen.getByText("João Silva")).toBeInTheDocument();
      expect(screen.getByText("joao@email.com")).toBeInTheDocument();
    });
  });
});
