/**
 * Testes de renderização da página JogadorPerfil
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { useJogadorPerfil } from "@/pages/JogadorPerfil/hooks/useJogadorPerfil";
import JogadorPerfil from "@/pages/JogadorPerfil";

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
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: () => ({ slug: "arena-teste", jogadorId: "jogador-1" }),
}));

// Mock do hook useJogadorPerfil
jest.mock("@/pages/JogadorPerfil/hooks/useJogadorPerfil", () => ({
  useJogadorPerfil: jest.fn(),
}));

// Mock dos componentes filhos
jest.mock("@/pages/JogadorPerfil/components/PageHeader", () => ({
  PageHeader: ({ arenaSlug, arenaNome, jogadorNome }: any) => (
    <div data-testid="page-header">
      <span>Arena: {arenaNome}</span>
      <span>Jogador: {jogadorNome}</span>
      <span>Slug: {arenaSlug}</span>
    </div>
  ),
}));

jest.mock("@/pages/JogadorPerfil/components/ProfileHeader", () => ({
  ProfileHeader: ({
    nomeJogador,
    arenaNome,
    nivelJogador,
    generoJogador,
    posicaoAtual,
    getInitials,
  }: any) => (
    <div data-testid="profile-header">
      <span>Nome: {nomeJogador}</span>
      <span>Arena: {arenaNome}</span>
      <span>Nível: {nivelJogador}</span>
      <span>Gênero: {generoJogador}</span>
      <span>Posição: {posicaoAtual}</span>
      <span data-testid="initials">{getInitials(nomeJogador)}</span>
    </div>
  ),
}));

jest.mock("@/pages/JogadorPerfil/components/StatsGrid", () => ({
  StatsGrid: ({ totalVitorias, totalDerrotas, totalEtapas }: any) => (
    <div data-testid="stats-grid">
      <span>Vitórias: {totalVitorias}</span>
      <span>Derrotas: {totalDerrotas}</span>
      <span>Etapas: {totalEtapas}</span>
    </div>
  ),
}));

jest.mock("@/pages/JogadorPerfil/components/HistoricoCard", () => ({
  HistoricoCard: ({ historico, slug }: any) => (
    <div data-testid="historico-card">
      <span>Histórico: {historico.length} itens</span>
      <span>Slug: {slug}</span>
    </div>
  ),
}));

jest.mock("@/components/layout/Footer", () => ({
  Footer: () => <footer data-testid="footer">Footer</footer>,
}));

// Mock window.history.back
const mockHistoryBack = jest.fn();
Object.defineProperty(window, "history", {
  value: { back: mockHistoryBack },
  writable: true,
});

// ============================================
// TESTES DE RENDERIZAÇÃO DO COMPONENTE
// ============================================

const renderWithRouter = (component: React.ReactElement) => {
  return render(<MemoryRouter>{component}</MemoryRouter>);
};

describe("JogadorPerfil - Renderização", () => {
  const mockUseJogadorPerfil = useJogadorPerfil as jest.Mock;

  const mockArena = {
    id: "arena-1",
    nome: "Arena Teste",
    slug: "arena-teste",
  };

  const mockJogador = {
    id: "jogador-1",
    nome: "João Silva",
    nivel: "A",
    genero: "M",
  };

  const defaultMockReturn = {
    loading: false,
    error: "",
    arena: mockArena,
    jogador: mockJogador,
    historico: [
      { etapa: "Etapa 1", posicao: 1 },
      { etapa: "Etapa 2", posicao: 2 },
    ],
    nomeJogador: "João Silva",
    nivelJogador: "A",
    generoJogador: "M",
    totalEtapas: 10,
    totalVitorias: 25,
    totalDerrotas: 5,
    posicaoAtual: 3,
    getInitials: (name: string) => {
      const parts = name.split(" ");
      if (parts.length === 1) {
        return name.substring(0, 2).toUpperCase();
      }
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseJogadorPerfil.mockReturnValue(defaultMockReturn);
  });

  describe("Estado de Loading", () => {
    it("deve renderizar loading quando carregando", () => {
      mockUseJogadorPerfil.mockReturnValue({
        ...defaultMockReturn,
        loading: true,
        arena: null,
        jogador: null,
      });

      renderWithRouter(<JogadorPerfil />);

      expect(screen.getByText("Carregando perfil...")).toBeInTheDocument();
    });
  });

  describe("Estado de Erro / Não encontrado", () => {
    it("deve renderizar erro quando há erro", () => {
      mockUseJogadorPerfil.mockReturnValue({
        ...defaultMockReturn,
        error: "Jogador não encontrado",
        arena: null,
        jogador: null,
      });

      renderWithRouter(<JogadorPerfil />);

      expect(screen.getByText("Jogador Não Encontrado")).toBeInTheDocument();
      expect(screen.getByText("Jogador não encontrado")).toBeInTheDocument();
    });

    it("deve renderizar mensagem padrão quando não tem jogador", () => {
      mockUseJogadorPerfil.mockReturnValue({
        ...defaultMockReturn,
        arena: mockArena,
        jogador: null,
        error: "",
      });

      renderWithRouter(<JogadorPerfil />);

      expect(screen.getByText("Jogador Não Encontrado")).toBeInTheDocument();
      expect(
        screen.getByText("O jogador que você está procurando não existe.")
      ).toBeInTheDocument();
    });

    it("deve chamar history.back ao clicar no botão Voltar", () => {
      mockUseJogadorPerfil.mockReturnValue({
        ...defaultMockReturn,
        error: "Jogador não encontrado",
        arena: null,
        jogador: null,
      });

      renderWithRouter(<JogadorPerfil />);

      fireEvent.click(screen.getByText("Voltar"));

      expect(mockHistoryBack).toHaveBeenCalled();
    });
  });

  describe("Estrutura básica", () => {
    it("deve renderizar PageHeader", () => {
      renderWithRouter(<JogadorPerfil />);

      expect(screen.getByTestId("page-header")).toBeInTheDocument();
    });

    it("deve renderizar ProfileHeader", () => {
      renderWithRouter(<JogadorPerfil />);

      expect(screen.getByTestId("profile-header")).toBeInTheDocument();
    });

    it("deve renderizar StatsGrid", () => {
      renderWithRouter(<JogadorPerfil />);

      expect(screen.getByTestId("stats-grid")).toBeInTheDocument();
    });

    it("deve renderizar HistoricoCard", () => {
      renderWithRouter(<JogadorPerfil />);

      expect(screen.getByTestId("historico-card")).toBeInTheDocument();
    });

    it("deve renderizar footer", () => {
      renderWithRouter(<JogadorPerfil />);

      expect(screen.getByTestId("footer")).toBeInTheDocument();
    });
  });

  describe("Dados do jogador", () => {
    it("deve exibir nome do jogador no PageHeader", () => {
      renderWithRouter(<JogadorPerfil />);

      expect(screen.getByTestId("page-header")).toHaveTextContent(
        "Jogador: João Silva"
      );
    });

    it("deve exibir nome da arena no PageHeader", () => {
      renderWithRouter(<JogadorPerfil />);

      expect(screen.getByTestId("page-header")).toHaveTextContent(
        "Arena: Arena Teste"
      );
    });

    it("deve exibir estatísticas do jogador", () => {
      renderWithRouter(<JogadorPerfil />);

      expect(screen.getByTestId("stats-grid")).toHaveTextContent("Vitórias: 25");
      expect(screen.getByTestId("stats-grid")).toHaveTextContent("Derrotas: 5");
      expect(screen.getByTestId("stats-grid")).toHaveTextContent("Etapas: 10");
    });

    it("deve exibir nível e gênero no ProfileHeader", () => {
      renderWithRouter(<JogadorPerfil />);

      expect(screen.getByTestId("profile-header")).toHaveTextContent("Nível: A");
      expect(screen.getByTestId("profile-header")).toHaveTextContent("Gênero: M");
    });

    it("deve exibir posição atual no ProfileHeader", () => {
      renderWithRouter(<JogadorPerfil />);

      expect(screen.getByTestId("profile-header")).toHaveTextContent("Posição: 3");
    });

    it("deve exibir histórico", () => {
      renderWithRouter(<JogadorPerfil />);

      expect(screen.getByTestId("historico-card")).toHaveTextContent(
        "Histórico: 2 itens"
      );
    });
  });

  describe("Função getInitials", () => {
    it("deve gerar iniciais corretamente", () => {
      renderWithRouter(<JogadorPerfil />);

      expect(screen.getByTestId("initials")).toHaveTextContent("JS");
    });
  });
});
