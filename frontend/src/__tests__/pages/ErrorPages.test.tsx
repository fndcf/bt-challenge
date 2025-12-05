/**
 * Testes das páginas de erro (NotFound e Unauthorized)
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { NotFound } from "@/pages/NotFound";
import { Unauthorized } from "@/pages/Unauthorized";

// Mock do useDocumentTitle
jest.mock("@/hooks", () => ({
  useDocumentTitle: jest.fn(),
}));

// Wrapper para componentes que usam react-router
const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

// ============================================
// TESTES DO COMPONENTE NotFound
// ============================================

describe("NotFound", () => {
  it("deve renderizar código de erro 404", () => {
    renderWithRouter(<NotFound />);

    expect(screen.getByText("404")).toBeInTheDocument();
  });

  it("deve renderizar título da página", () => {
    renderWithRouter(<NotFound />);

    expect(screen.getByText("Página não encontrada")).toBeInTheDocument();
  });

  it("deve renderizar descrição", () => {
    renderWithRouter(<NotFound />);

    expect(
      screen.getByText(
        "Desculpe, a página que você está procurando não existe ou foi movida."
      )
    ).toBeInTheDocument();
  });

  it("deve renderizar botão para voltar ao início", () => {
    renderWithRouter(<NotFound />);

    expect(screen.getByText("Voltar para o Início")).toBeInTheDocument();
  });

  it("deve ter link correto no botão de voltar", () => {
    renderWithRouter(<NotFound />);

    const homeLink = screen.getByText("Voltar para o Início").closest("a");
    expect(homeLink).toHaveAttribute("href", "/");
  });
});

// ============================================
// TESTES DO COMPONENTE Unauthorized
// ============================================

describe("Unauthorized", () => {
  it("deve renderizar código de erro 403", () => {
    renderWithRouter(<Unauthorized />);

    expect(screen.getByText("403")).toBeInTheDocument();
  });

  it("deve renderizar título da página", () => {
    renderWithRouter(<Unauthorized />);

    expect(screen.getByText("Acesso Negado")).toBeInTheDocument();
  });

  it("deve renderizar descrição", () => {
    renderWithRouter(<Unauthorized />);

    expect(
      screen.getByText("Você não tem permissão para acessar esta página.")
    ).toBeInTheDocument();
  });

  it("deve renderizar botão para voltar ao início", () => {
    renderWithRouter(<Unauthorized />);

    expect(screen.getByText("Voltar para o Início")).toBeInTheDocument();
  });

  it("deve ter link correto no botão de voltar", () => {
    renderWithRouter(<Unauthorized />);

    const homeLink = screen.getByText("Voltar para o Início").closest("a");
    expect(homeLink).toHaveAttribute("href", "/");
  });
});
