/**
 * Testes de renderização da página Dashboard
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Dashboard from "@/pages/Dashboard";

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

// Mock do useAuth
const mockUser = { email: "admin@arena.com" };
jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: mockUser }),
}));

// Mock do useArena
const mockArena = { id: "arena-1", nome: "Arena Teste", slug: "arena-teste" };
jest.mock("@/contexts/ArenaContext", () => ({
  useArena: () => ({ arena: mockArena }),
}));

// Mock do useDashboard
const mockUseDashboard = jest.fn();
jest.mock("@/pages/Dashboard/hooks/useDashboard", () => ({
  useDashboard: () => mockUseDashboard(),
}));

// Mock dos componentes filhos para testes de renderização da página
jest.mock("@/pages/Dashboard/components/WelcomeBanner", () => ({
  WelcomeBanner: ({ userName, arenaName, arenaSlug }: any) => (
    <div data-testid="welcome-banner">
      <span>Usuário: {userName}</span>
      <span>Arena: {arenaName}</span>
      <span>Slug: {arenaSlug}</span>
    </div>
  ),
}));

jest.mock("@/pages/Dashboard/components/StatsCards", () => ({
  StatsCards: ({ stats }: any) => (
    <div data-testid="stats-cards">
      <span>Jogadores: {stats.totalJogadores}</span>
      <span>Etapas: {stats.totalEtapas}</span>
    </div>
  ),
}));

jest.mock("@/pages/Dashboard/components/QuickActions", () => ({
  QuickActions: ({ arenaSlug }: any) => (
    <div data-testid="quick-actions">
      <span>Arena: {arenaSlug}</span>
    </div>
  ),
}));

jest.mock("@/components/jogadores/RankingList", () => ({
  RankingList: ({ arenaSlug }: any) => (
    <div data-testid="ranking-list">
      <span>Ranking: {arenaSlug}</span>
    </div>
  ),
}));

jest.mock("@/components/layout/Footer", () => ({
  Footer: () => <footer data-testid="footer">Footer</footer>,
}));

describe("Dashboard - Renderização da Página", () => {
  const defaultStats = {
    totalJogadores: 100,
    totalEtapas: 20,
    inscricoesAbertas: 5,
    emAndamento: 3,
    finalizadas: 12,
  };

  const defaultMockReturn = {
    stats: defaultStats,
    loading: false,
    error: null,
    recarregar: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDashboard.mockReturnValue(defaultMockReturn);
  });

  const renderPage = () => {
    return render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
  };

  describe("Estado de loading", () => {
    it("deve renderizar spinner durante carregamento", () => {
      mockUseDashboard.mockReturnValue({
        ...defaultMockReturn,
        loading: true,
      });

      renderPage();

      // O componente de loading tem um Spinner, não texto
      expect(screen.queryByTestId("welcome-banner")).not.toBeInTheDocument();
      expect(screen.queryByTestId("stats-cards")).not.toBeInTheDocument();
    });
  });

  describe("Estado de erro", () => {
    it("deve renderizar mensagem de erro", () => {
      mockUseDashboard.mockReturnValue({
        ...defaultMockReturn,
        error: "Erro ao carregar dados",
      });

      renderPage();

      expect(screen.getByText("Erro ao carregar dados")).toBeInTheDocument();
    });

    it("deve renderizar botão de recarregar quando há erro", () => {
      mockUseDashboard.mockReturnValue({
        ...defaultMockReturn,
        error: "Erro ao carregar dados",
      });

      renderPage();

      expect(screen.getByText("Tentar Novamente")).toBeInTheDocument();
    });

    it("deve chamar recarregar ao clicar no botão", () => {
      const mockRecarregar = jest.fn();
      mockUseDashboard.mockReturnValue({
        ...defaultMockReturn,
        error: "Erro ao carregar dados",
        recarregar: mockRecarregar,
      });

      renderPage();

      fireEvent.click(screen.getByText("Tentar Novamente"));

      expect(mockRecarregar).toHaveBeenCalled();
    });
  });

  describe("Renderização com sucesso", () => {
    it("deve renderizar WelcomeBanner", () => {
      renderPage();

      expect(screen.getByTestId("welcome-banner")).toBeInTheDocument();
    });

    it("deve renderizar StatsCards", () => {
      renderPage();

      expect(screen.getByTestId("stats-cards")).toBeInTheDocument();
    });

    it("deve renderizar QuickActions", () => {
      renderPage();

      expect(screen.getByTestId("quick-actions")).toBeInTheDocument();
    });

    it("deve renderizar RankingList", () => {
      renderPage();

      expect(screen.getByTestId("ranking-list")).toBeInTheDocument();
    });

    it("deve renderizar Footer", () => {
      renderPage();

      expect(screen.getByTestId("footer")).toBeInTheDocument();
    });

    it("deve renderizar títulos das seções", () => {
      renderPage();

      expect(screen.getByText("Visão Geral")).toBeInTheDocument();
      expect(screen.getByText("Ações Rápidas")).toBeInTheDocument();
    });
  });

  describe("Dados do usuário e arena", () => {
    it("deve exibir nome do usuário do email", () => {
      renderPage();

      expect(screen.getByTestId("welcome-banner")).toHaveTextContent(
        "Usuário: admin"
      );
    });

    it("deve exibir nome da arena", () => {
      renderPage();

      expect(screen.getByTestId("welcome-banner")).toHaveTextContent(
        "Arena: Arena Teste"
      );
    });

    it("deve exibir slug da arena", () => {
      renderPage();

      expect(screen.getByTestId("welcome-banner")).toHaveTextContent(
        "Slug: arena-teste"
      );
    });
  });

  describe("Estatísticas", () => {
    it("deve passar stats para StatsCards", () => {
      renderPage();

      expect(screen.getByTestId("stats-cards")).toHaveTextContent(
        "Jogadores: 100"
      );
      expect(screen.getByTestId("stats-cards")).toHaveTextContent("Etapas: 20");
    });
  });
});
