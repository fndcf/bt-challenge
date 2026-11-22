/**
 * Testes dos componentes EtapaCardList e EtapaCardItem
 */

import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { EtapaCardList } from "@/components/arena/EtapaCardList/EtapaCardList";
import { EtapaCardItem } from "@/components/arena/EtapaCardList/EtapaCardItem";
import { EtapaPublica } from "@/services/arenaPublicService";
import { FormatoEtapa, StatusEtapa, VarianteTeams } from "@/types/etapa";
import { GeneroJogador, NivelJogador } from "@/types/jogador";

const mockEtapa: EtapaPublica = {
  id: "etapa-1",
  arenaId: "arena-1",
  nome: "Etapa Teste",
  status: StatusEtapa.CHAVES_GERADAS,
  dataRealizacao: "2024-12-15",
  formato: FormatoEtapa.TEAMS,
  varianteTeams: VarianteTeams.TEAMS_6,
  nivel: NivelJogador.INTERMEDIARIO,
  genero: GeneroJogador.MASCULINO,
  totalInscritos: 12,
  maxJogadores: 16,
  descricao: "Descrição da etapa teste",
};

const renderWithRouter = (component: React.ReactNode) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe("EtapaCardItem", () => {
  describe("renderização básica", () => {
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
      expect(screen.getByText("Chaves Geradas")).toBeInTheDocument();
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

    it("deve renderizar inscritos e vagas", () => {
      renderWithRouter(
        <EtapaCardItem etapa={mockEtapa} arenaSlug="minha-arena" />
      );
      expect(screen.getByText(/Jogadores:/)).toBeInTheDocument();
      expect(screen.getByText("12 / 16")).toBeInTheDocument();
    });

    it("deve renderizar formato da etapa", () => {
      renderWithRouter(
        <EtapaCardItem etapa={mockEtapa} arenaSlug="minha-arena" />
      );
      expect(screen.getByText("Teams 6")).toBeInTheDocument();
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
