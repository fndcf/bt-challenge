/**
 * Testes dos componentes da página Dashboard
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { StatsCards } from "@/pages/Dashboard/components/StatsCards";
import { WelcomeBanner } from "@/pages/Dashboard/components/WelcomeBanner";
import { QuickActions } from "@/pages/Dashboard/components/QuickActions";

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

// ============================================
// TESTES DO COMPONENTE StatsCards
// ============================================

describe("StatsCards", () => {
  const defaultStats = {
    totalJogadores: 100,
    totalEtapas: 20,
    inscricoesAbertas: 5,
    emAndamento: 3,
    finalizadas: 12,
  };

  it("deve renderizar todos os cards de estatísticas", () => {
    render(<StatsCards stats={defaultStats} />);

    expect(screen.getByText("Total de Jogadores")).toBeInTheDocument();
    expect(screen.getByText("Total de Etapas")).toBeInTheDocument();
    expect(screen.getByText("Inscrições Abertas")).toBeInTheDocument();
    expect(screen.getByText("Em Andamento")).toBeInTheDocument();
    expect(screen.getByText("Finalizadas")).toBeInTheDocument();
  });

  it("deve exibir valores corretos", () => {
    render(<StatsCards stats={defaultStats} />);

    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("deve renderizar corretamente com valores zerados", () => {
    const zeroStats = {
      totalJogadores: 0,
      totalEtapas: 0,
      inscricoesAbertas: 0,
      emAndamento: 0,
      finalizadas: 0,
    };

    render(<StatsCards stats={zeroStats} />);

    const zeros = screen.getAllByText("0");
    expect(zeros).toHaveLength(5);
  });

  it("deve renderizar corretamente com valores grandes", () => {
    const largeStats = {
      totalJogadores: 10000,
      totalEtapas: 500,
      inscricoesAbertas: 100,
      emAndamento: 50,
      finalizadas: 350,
    };

    render(<StatsCards stats={largeStats} />);

    expect(screen.getByText("10000")).toBeInTheDocument();
    expect(screen.getByText("500")).toBeInTheDocument();
  });
});

// ============================================
// TESTES DO COMPONENTE WelcomeBanner
// ============================================

describe("WelcomeBanner", () => {
  it("deve renderizar mensagem de boas-vindas com nome do usuário", () => {
    render(<WelcomeBanner userName="João" />);

    expect(screen.getByText("Bem-vindo(a), João!")).toBeInTheDocument();
  });

  it("deve renderizar nome da arena quando fornecido", () => {
    render(
      <WelcomeBanner
        userName="Maria"
        arenaName="Arena Teste"
        arenaSlug="arena-teste"
      />
    );

    expect(screen.getByText("Bem-vindo(a), Maria!")).toBeInTheDocument();
    expect(screen.getByText("Arena Teste")).toBeInTheDocument();
  });

  it("deve renderizar link correto quando arenaSlug é fornecido", () => {
    render(
      <WelcomeBanner
        userName="Pedro"
        arenaName="Minha Arena"
        arenaSlug="minha-arena"
      />
    );

    expect(screen.getByText("/minha-arena")).toBeInTheDocument();
  });

  it("deve renderizar sem arena quando arenaName não é fornecido", () => {
    render(<WelcomeBanner userName="Carlos" arenaSlug="teste-slug" />);

    expect(screen.getByText("Bem-vindo(a), Carlos!")).toBeInTheDocument();
    expect(screen.queryByText("/teste-slug")).not.toBeInTheDocument();
  });

  it("não deve renderizar badge da arena quando arenaSlug não é fornecido", () => {
    render(<WelcomeBanner userName="Ana" arenaName="Minha Arena" />);

    expect(screen.getByText("Bem-vindo(a), Ana!")).toBeInTheDocument();
    expect(screen.queryByText("Minha Arena")).not.toBeInTheDocument();
  });
});

// ============================================
// TESTES DO COMPONENTE QuickActions
// ============================================

describe("QuickActions", () => {
  const renderWithRouter = (component: React.ReactElement) => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
  };

  it("deve renderizar todas as ações rápidas", () => {
    renderWithRouter(<QuickActions arenaSlug="minha-arena" />);

    expect(screen.getByText("Cadastrar Jogador")).toBeInTheDocument();
    expect(
      screen.getByText("Adicione novos jogadores à arena")
    ).toBeInTheDocument();

    expect(screen.getByText("Criar Etapa")).toBeInTheDocument();
    expect(
      screen.getByText("Inicie uma nova etapa de torneio")
    ).toBeInTheDocument();

    expect(screen.getByText("Página Pública")).toBeInTheDocument();
    expect(screen.getByText("Link público para jogadores")).toBeInTheDocument();
  });

  it("deve ter links corretos para as ações", () => {
    renderWithRouter(<QuickActions arenaSlug="minha-arena" />);

    const cadastrarLink = screen.getByText("Cadastrar Jogador").closest("a");
    expect(cadastrarLink).toHaveAttribute("href", "/admin/jogadores/novo");

    const criarChallengeLink = screen.getByText("Criar Etapa").closest("a");
    expect(criarChallengeLink).toHaveAttribute("href", "/admin/etapas/criar");

    const paginaPublicaLink = screen.getByText("Página Pública").closest("a");
    expect(paginaPublicaLink).toHaveAttribute("href", "/arena/minha-arena");
  });

  it("deve usar slug vazio quando arenaSlug não é fornecido", () => {
    renderWithRouter(<QuickActions />);

    const paginaPublicaLink = screen.getByText("Página Pública").closest("a");
    expect(paginaPublicaLink).toHaveAttribute("href", "/arena/");
  });

  it("deve renderizar setas em cada action card", () => {
    renderWithRouter(<QuickActions arenaSlug="teste" />);

    const arrows = screen.getAllByText("→");
    expect(arrows).toHaveLength(3);
  });
});
