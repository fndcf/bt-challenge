/**
 * Testes dos componentes EtapaCardList e EtapaCardItem
 */

import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { EtapaCardList } from "@/components/arena/EtapaCardList/EtapaCardList";
import { EtapaCardItem } from "@/components/arena/EtapaCardList/EtapaCardItem";
import { EtapaPublica } from "@/services/arenaPublicService";

const mockEtapa: EtapaPublica = {
  id: "etapa-1",
  numero: 1,
  nome: "Etapa Teste",
  status: "em_andamento",
  dataRealizacao: "2024-12-15",
  formato: "dupla_fixa",
  nivel: "intermediario",
  genero: "masculino",
  totalJogadores: 16,
  descricao: "Descrição da etapa teste",
};

const renderWithRouter = (component: React.ReactNode) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe("EtapaCardItem", () => {
  describe("renderização básica", () => {
    it("deve renderizar número da etapa", () => {
      renderWithRouter(
        <EtapaCardItem etapa={mockEtapa} arenaSlug="minha-arena" />
      );
      expect(screen.getByText("#1")).toBeInTheDocument();
    });

    it("deve renderizar nome da etapa", () => {
      renderWithRouter(
        <EtapaCardItem etapa={mockEtapa} arenaSlug="minha-arena" />
      );
      expect(screen.getByText("Etapa Teste")).toBeInTheDocument();
    });

    it("deve renderizar status da etapa", () => {
      renderWithRouter(
        <EtapaCardItem etapa={mockEtapa} arenaSlug="minha-arena" />
      );
      expect(screen.getByText("Em Andamento")).toBeInTheDocument();
    });

    it("deve renderizar data de realização", () => {
      renderWithRouter(
        <EtapaCardItem etapa={mockEtapa} arenaSlug="minha-arena" />
      );
      expect(screen.getByText(/Data:/)).toBeInTheDocument();
    });

    it("deve renderizar nível quando fornecido", () => {
      renderWithRouter(
        <EtapaCardItem etapa={mockEtapa} arenaSlug="minha-arena" />
      );
      expect(screen.getByText(/Nível:/)).toBeInTheDocument();
      expect(screen.getByText("Intermediário")).toBeInTheDocument();
    });

    it("deve renderizar gênero quando fornecido", () => {
      renderWithRouter(
        <EtapaCardItem etapa={mockEtapa} arenaSlug="minha-arena" />
      );
      expect(screen.getByText(/Gênero:/)).toBeInTheDocument();
      expect(screen.getByText("Masculino")).toBeInTheDocument();
    });

    it("deve renderizar total de jogadores quando fornecido", () => {
      renderWithRouter(
        <EtapaCardItem etapa={mockEtapa} arenaSlug="minha-arena" />
      );
      expect(screen.getByText(/Jogadores:/)).toBeInTheDocument();
      expect(screen.getByText("16")).toBeInTheDocument();
    });

    it("deve renderizar formato da etapa", () => {
      renderWithRouter(
        <EtapaCardItem etapa={mockEtapa} arenaSlug="minha-arena" />
      );
      expect(screen.getByText(/Formato:/)).toBeInTheDocument();
      expect(screen.getByText("Dupla Fixa")).toBeInTheDocument();
    });

    it("deve renderizar descrição quando fornecida", () => {
      renderWithRouter(
        <EtapaCardItem etapa={mockEtapa} arenaSlug="minha-arena" />
      );
      expect(screen.getByText("Descrição da etapa teste")).toBeInTheDocument();
    });

    it("não deve renderizar descrição quando não fornecida", () => {
      const etapaSemDescricao = { ...mockEtapa, descricao: undefined };
      renderWithRouter(
        <EtapaCardItem etapa={etapaSemDescricao} arenaSlug="minha-arena" />
      );
      expect(
        screen.queryByText("Descrição da etapa teste")
      ).not.toBeInTheDocument();
    });

    it("deve renderizar link para detalhes", () => {
      renderWithRouter(
        <EtapaCardItem etapa={mockEtapa} arenaSlug="minha-arena" />
      );
      const link = screen.getByText("Ver Detalhes");
      expect(link).toBeInTheDocument();
      expect(link.closest("a")).toHaveAttribute(
        "href",
        "/arena/minha-arena/etapa/etapa-1"
      );
    });
  });

  describe("campos opcionais", () => {
    it("não deve renderizar nível quando não fornecido", () => {
      const etapaSemNivel = { ...mockEtapa, nivel: undefined };
      renderWithRouter(
        <EtapaCardItem etapa={etapaSemNivel} arenaSlug="minha-arena" />
      );
      expect(screen.queryByText(/Nível:/)).not.toBeInTheDocument();
    });

    it("não deve renderizar gênero quando não fornecido", () => {
      const etapaSemGenero = { ...mockEtapa, genero: undefined };
      renderWithRouter(
        <EtapaCardItem etapa={etapaSemGenero} arenaSlug="minha-arena" />
      );
      expect(screen.queryByText(/Gênero:/)).not.toBeInTheDocument();
    });

    it("não deve renderizar total de jogadores quando não fornecido", () => {
      const etapaSemJogadores = { ...mockEtapa, totalJogadores: undefined };
      renderWithRouter(
        <EtapaCardItem etapa={etapaSemJogadores} arenaSlug="minha-arena" />
      );
      expect(screen.queryByText(/Jogadores:/)).not.toBeInTheDocument();
    });
  });
});

describe("EtapaCardList", () => {
  describe("lista vazia", () => {
    it("deve mostrar estado vazio quando não há etapas", () => {
      renderWithRouter(<EtapaCardList etapas={[]} arenaSlug="minha-arena" />);
      expect(
        screen.getByText("Nenhuma Etapa Disponível")
      ).toBeInTheDocument();
    });

    it("deve mostrar mensagem explicativa no estado vazio", () => {
      renderWithRouter(<EtapaCardList etapas={[]} arenaSlug="minha-arena" />);
      expect(
        screen.getByText(/Não há etapas cadastradas no momento/)
      ).toBeInTheDocument();
    });
  });

  describe("lista com etapas", () => {
    it("deve renderizar todas as etapas", () => {
      const etapas = [
        { ...mockEtapa, id: "etapa-1", nome: "Etapa 1" },
        { ...mockEtapa, id: "etapa-2", nome: "Etapa 2" },
        { ...mockEtapa, id: "etapa-3", nome: "Etapa 3" },
      ];
      renderWithRouter(
        <EtapaCardList etapas={etapas} arenaSlug="minha-arena" />
      );

      expect(screen.getByText("Etapa 1")).toBeInTheDocument();
      expect(screen.getByText("Etapa 2")).toBeInTheDocument();
      expect(screen.getByText("Etapa 3")).toBeInTheDocument();
    });

    it("deve passar arenaSlug corretamente para os cards", () => {
      const etapas = [mockEtapa];
      renderWithRouter(
        <EtapaCardList etapas={etapas} arenaSlug="arena-teste" />
      );

      const link = screen.getByText("Ver Detalhes");
      expect(link.closest("a")).toHaveAttribute(
        "href",
        "/arena/arena-teste/etapa/etapa-1"
      );
    });
  });
});
