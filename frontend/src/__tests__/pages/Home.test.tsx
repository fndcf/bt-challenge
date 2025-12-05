/**
 * Testes da página Home e seus componentes
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HeroSection } from "@/pages/Home/components/HeroSection";
import { FeaturesGrid } from "@/pages/Home/components/FeaturesGrid";
import { CTAButtons } from "@/pages/Home/components/CTAButtons";
import { HowItWorks } from "@/pages/Home/components/HowItWorks";
import Home from "@/pages/Home";

// Mock do useDocumentTitle
jest.mock("@/hooks", () => ({
  useDocumentTitle: jest.fn(),
}));

// Mock do Footer
jest.mock("@/components/layout/Footer", () => ({
  Footer: () => <footer data-testid="footer">Footer</footer>,
}));

// Wrapper para componentes que usam react-router
const renderWithRouter = (component: React.ReactElement) => {
  return render(<MemoryRouter>{component}</MemoryRouter>);
};

// ============================================
// TESTES DO COMPONENTE HeroSection
// ============================================

describe("HeroSection", () => {
  it("deve renderizar o título Challenge BT", () => {
    render(<HeroSection />);

    expect(screen.getByText("Challenge BT")).toBeInTheDocument();
  });

  it("deve renderizar o subtítulo", () => {
    render(<HeroSection />);

    expect(
      screen.getByText("Sistema de Gerenciamento de Torneios de Beach Tennis")
    ).toBeInTheDocument();
  });
});

// ============================================
// TESTES DO COMPONENTE FeaturesGrid
// ============================================

describe("FeaturesGrid", () => {
  it("deve renderizar todas as 4 funcionalidades", () => {
    render(<FeaturesGrid />);

    expect(screen.getByText("Gestão de Jogadores")).toBeInTheDocument();
    expect(screen.getByText("Torneios")).toBeInTheDocument();
    expect(screen.getByText("Rankings")).toBeInTheDocument();
    expect(screen.getByText("Multi-Arena")).toBeInTheDocument();
  });

  it("deve renderizar as descrições das funcionalidades", () => {
    render(<FeaturesGrid />);

    expect(
      screen.getByText("Cadastro e organização de jogadores por gênero e nível")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Criação automática de chaves e grupos")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Sistema de pontuação e estatísticas")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Suporte para múltiplas arenas")
    ).toBeInTheDocument();
  });

  it("deve renderizar os ícones das funcionalidades", () => {
    render(<FeaturesGrid />);

    expect(screen.getByText("👥")).toBeInTheDocument();
    expect(screen.getByText("🏆")).toBeInTheDocument();
    expect(screen.getByText("📊")).toBeInTheDocument();
    expect(screen.getByText("🏟️")).toBeInTheDocument();
  });
});

// ============================================
// TESTES DO COMPONENTE CTAButtons
// ============================================

describe("CTAButtons", () => {
  it("deve renderizar botão de criar arena", () => {
    renderWithRouter(<CTAButtons />);

    expect(screen.getByText("Criar Minha Arena")).toBeInTheDocument();
  });

  it("deve renderizar botão de login", () => {
    renderWithRouter(<CTAButtons />);

    expect(screen.getByText("Já tenho uma Arena")).toBeInTheDocument();
  });

  it("deve ter link correto para criar arena", () => {
    renderWithRouter(<CTAButtons />);

    const criarArenaLink = screen.getByText("Criar Minha Arena").closest("a");
    expect(criarArenaLink).toHaveAttribute("href", "/register");
  });

  it("deve ter link correto para login", () => {
    renderWithRouter(<CTAButtons />);

    const loginLink = screen.getByText("Já tenho uma Arena").closest("a");
    expect(loginLink).toHaveAttribute("href", "/login");
  });
});

// ============================================
// TESTES DO COMPONENTE HowItWorks
// ============================================

describe("HowItWorks", () => {
  it("deve renderizar o título da seção", () => {
    render(<HowItWorks />);

    expect(screen.getByText("Como Funciona?")).toBeInTheDocument();
  });

  it("deve renderizar todos os 5 passos", () => {
    render(<HowItWorks />);

    expect(screen.getByText("Cadastro de Jogadores")).toBeInTheDocument();
    expect(screen.getByText("Criação de Etapas")).toBeInTheDocument();
    expect(screen.getByText("Fase de Grupos")).toBeInTheDocument();
    expect(screen.getByText("Eliminatórias")).toBeInTheDocument();
    expect(screen.getByText("Ranking")).toBeInTheDocument();
  });

  it("deve renderizar os números dos passos", () => {
    render(<HowItWorks />);

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("deve renderizar as descrições dos passos", () => {
    render(<HowItWorks />);

    expect(
      screen.getByText(
        "Jogadores se cadastram individualmente por nível e gênero"
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Configure o formato (Rei da Praia ou Dupla Fixa) e organize os grupos"
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText("Todos jogam contra todos no grupo")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Os melhores avançam para a fase final")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Pontuação individual acumulada ao longo das etapas")
    ).toBeInTheDocument();
  });
});

// ============================================
// TESTES DE RENDERIZAÇÃO DA PÁGINA HOME
// ============================================

describe("Home - Renderização da Página", () => {
  const renderPage = () => {
    return renderWithRouter(<Home />);
  };

  describe("Estrutura básica", () => {
    it("deve renderizar HeroSection com título", () => {
      renderPage();

      expect(screen.getByText("Challenge BT")).toBeInTheDocument();
    });

    it("deve renderizar HeroSection com subtítulo", () => {
      renderPage();

      expect(
        screen.getByText("Sistema de Gerenciamento de Torneios de Beach Tennis")
      ).toBeInTheDocument();
    });

    it("deve renderizar FeaturesGrid com funcionalidades", () => {
      renderPage();

      expect(screen.getByText("Gestão de Jogadores")).toBeInTheDocument();
      expect(screen.getByText("Torneios")).toBeInTheDocument();
      expect(screen.getByText("Rankings")).toBeInTheDocument();
      expect(screen.getByText("Multi-Arena")).toBeInTheDocument();
    });

    it("deve renderizar CTAButtons", () => {
      renderPage();

      expect(screen.getByText("Criar Minha Arena")).toBeInTheDocument();
      expect(screen.getByText("Já tenho uma Arena")).toBeInTheDocument();
    });

    it("deve renderizar HowItWorks", () => {
      renderPage();

      expect(screen.getByText("Como Funciona?")).toBeInTheDocument();
    });

    it("deve renderizar Footer", () => {
      renderPage();

      expect(screen.getByTestId("footer")).toBeInTheDocument();
    });
  });

  describe("Navegação", () => {
    it("deve ter link correto para criar arena", () => {
      renderPage();

      const criarArenaLink = screen.getByText("Criar Minha Arena").closest("a");
      expect(criarArenaLink).toHaveAttribute("href", "/register");
    });

    it("deve ter link correto para login", () => {
      renderPage();

      const loginLink = screen.getByText("Já tenho uma Arena").closest("a");
      expect(loginLink).toHaveAttribute("href", "/login");
    });
  });

  describe("Passos do HowItWorks", () => {
    it("deve renderizar os 5 passos", () => {
      renderPage();

      expect(screen.getByText("Cadastro de Jogadores")).toBeInTheDocument();
      expect(screen.getByText("Criação de Etapas")).toBeInTheDocument();
      expect(screen.getByText("Fase de Grupos")).toBeInTheDocument();
      expect(screen.getByText("Eliminatórias")).toBeInTheDocument();
      expect(screen.getByText("Ranking")).toBeInTheDocument();
    });
  });
});
