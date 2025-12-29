/**
 * Testes da página Home e seus componentes
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HeroSection } from "@/pages/Home/components/HeroSection";
import { FeaturesSection } from "@/pages/Home/components/FeaturesSection";
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

// Mock dos componentes pesados para testes isolados
jest.mock("@/pages/Home/components/FormatosSection", () => ({
  FormatosSection: () => (
    <div data-testid="formatos-section">FormatosSection</div>
  ),
}));

jest.mock("@/pages/Home/components/GaleriaSection", () => ({
  GaleriaSection: () => <div data-testid="galeria-section">GaleriaSection</div>,
}));

// Wrapper para componentes que usam react-router
const renderWithRouter = (component: React.ReactElement) => {
  return render(<MemoryRouter>{component}</MemoryRouter>);
};

// ============================================
// TESTES DO COMPONENTE HeroSection
// ============================================

describe("HeroSection", () => {
  it("deve renderizar o título Dupley", () => {
    renderWithRouter(<HeroSection />);

    expect(screen.getByText("Dupley")).toBeInTheDocument();
  });

  it("deve renderizar o subtítulo", () => {
    renderWithRouter(<HeroSection />);

    expect(
      screen.getByText(/A plataforma completa para gerenciar seus torneios/)
    ).toBeInTheDocument();
  });

  it("deve renderizar botão de criar arena", () => {
    renderWithRouter(<HeroSection />);

    expect(screen.getByText("Criar Minha Arena")).toBeInTheDocument();
  });

  it("deve renderizar botão de login", () => {
    renderWithRouter(<HeroSection />);

    expect(screen.getByText("Fazer Login")).toBeInTheDocument();
  });

  it("deve ter link correto para criar arena", () => {
    renderWithRouter(<HeroSection />);

    const criarArenaLink = screen.getByText("Criar Minha Arena").closest("a");
    expect(criarArenaLink).toHaveAttribute("href", "/register");
  });

  it("deve ter link correto para login", () => {
    renderWithRouter(<HeroSection />);

    const loginLink = screen.getByText("Fazer Login").closest("a");
    expect(loginLink).toHaveAttribute("href", "/login");
  });
});

// ============================================
// TESTES DO COMPONENTE FeaturesSection
// ============================================

describe("FeaturesSection", () => {
  it("deve renderizar o título da seção", () => {
    render(<FeaturesSection />);

    expect(screen.getByText("Funcionalidades")).toBeInTheDocument();
  });

  it("deve renderizar todas as 6 funcionalidades", () => {
    render(<FeaturesSection />);

    expect(screen.getByText("Gestão de Jogadores")).toBeInTheDocument();
    expect(screen.getByText("Geração Automática")).toBeInTheDocument();
    expect(screen.getByText("Rankings Dinâmicos")).toBeInTheDocument();
    expect(screen.getByText("Multi-Arena")).toBeInTheDocument();
    expect(screen.getByText("Página Pública")).toBeInTheDocument();
    expect(screen.getByText("Estatísticas")).toBeInTheDocument();
  });

  it("deve renderizar as descrições das funcionalidades", () => {
    render(<FeaturesSection />);

    expect(screen.getByText(/Cadastre jogadores por nível/)).toBeInTheDocument();
    expect(
      screen.getByText(/Grupos e chaves eliminatórias gerados automaticamente/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Sistema de pontuação automático/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Gerencie várias arenas independentes/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Cada arena tem sua página pública/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Histórico completo de participações/)
    ).toBeInTheDocument();
  });

  it("deve renderizar os cards de funcionalidades", () => {
    render(<FeaturesSection />);

    // Verifica que os 6 cards são renderizados verificando os títulos
    expect(screen.getByText("Gestão de Jogadores")).toBeInTheDocument();
    expect(screen.getByText("Geração Automática")).toBeInTheDocument();
    expect(screen.getByText("Rankings Dinâmicos")).toBeInTheDocument();
    expect(screen.getByText("Multi-Arena")).toBeInTheDocument();
    expect(screen.getByText("Página Pública")).toBeInTheDocument();
    expect(screen.getByText("Estatísticas")).toBeInTheDocument();
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

      expect(screen.getByText("Dupley")).toBeInTheDocument();
    });

    it("deve renderizar HeroSection com subtítulo", () => {
      renderPage();

      expect(
        screen.getByText(/A plataforma completa para gerenciar seus torneios/)
      ).toBeInTheDocument();
    });

    it("deve renderizar FeaturesSection com funcionalidades", () => {
      renderPage();

      expect(screen.getByText("Gestão de Jogadores")).toBeInTheDocument();
      expect(screen.getByText("Multi-Arena")).toBeInTheDocument();
    });

    it("deve renderizar botões CTA", () => {
      renderPage();

      expect(screen.getByText("Criar Minha Arena")).toBeInTheDocument();
      expect(screen.getByText("Fazer Login")).toBeInTheDocument();
    });

    it("deve renderizar HowItWorks", () => {
      renderPage();

      expect(screen.getByText("Como Funciona?")).toBeInTheDocument();
    });

    it("deve renderizar Footer", () => {
      renderPage();

      expect(screen.getByTestId("footer")).toBeInTheDocument();
    });

    it("deve renderizar FormatosSection (mockado)", () => {
      renderPage();

      expect(screen.getByTestId("formatos-section")).toBeInTheDocument();
    });

    it("deve renderizar GaleriaSection (mockado)", () => {
      renderPage();

      expect(screen.getByTestId("galeria-section")).toBeInTheDocument();
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

      const loginLink = screen.getByText("Fazer Login").closest("a");
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
