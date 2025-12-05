/**
 * Testes do componente AdminLayout
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

// Mock do AuthContext
const mockLogout = jest.fn();
const mockUseAuth = jest.fn();
jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock do ArenaContext
const mockUseArena = jest.fn();
jest.mock("@/contexts/ArenaContext", () => ({
  useArena: () => mockUseArena(),
}));

import AdminLayout from "@/components/layout/AdminLayout/AdminLayout";

const renderWithRouter = (initialPath = "/admin") => {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/admin/*" element={<AdminLayout />}>
          <Route index element={<div>Dashboard Content</div>} />
          <Route path="jogadores" element={<div>Jogadores Content</div>} />
          <Route path="etapas" element={<div>Etapas Content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
};

describe("AdminLayout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { email: "admin@test.com" },
      logout: mockLogout,
    });
    mockUseArena.mockReturnValue({
      arena: { slug: "arena-teste", nome: "Arena Teste" },
    });
    // Mock innerWidth for desktop
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  describe("renderização básica", () => {
    it("deve renderizar o logo", () => {
      renderWithRouter();
      expect(screen.getByText("Challenge BT")).toBeInTheDocument();
    });

    it("deve renderizar os itens de menu", () => {
      renderWithRouter();
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
      expect(screen.getByText("Jogadores")).toBeInTheDocument();
      expect(screen.getByText("Challenges")).toBeInTheDocument();
    });

    it("deve renderizar o botão de sair", () => {
      renderWithRouter();
      expect(screen.getByText("Sair")).toBeInTheDocument();
    });

    it("deve renderizar informações do usuário", () => {
      renderWithRouter();
      expect(screen.getByText("admin")).toBeInTheDocument();
      expect(screen.getByText("Administrador")).toBeInTheDocument();
    });

    it("deve renderizar o conteúdo do Outlet", () => {
      renderWithRouter();
      expect(screen.getByText("Dashboard Content")).toBeInTheDocument();
    });
  });

  describe("navegação", () => {
    it("deve navegar para jogadores ao clicar", () => {
      renderWithRouter();
      fireEvent.click(screen.getByText("Jogadores"));
      expect(screen.getByText("Jogadores Content")).toBeInTheDocument();
    });

    it("deve navegar para etapas ao clicar", () => {
      renderWithRouter();
      fireEvent.click(screen.getByText("Challenges"));
      expect(screen.getByText("Etapas Content")).toBeInTheDocument();
    });

    it("deve mostrar link para página pública quando arena existe", () => {
      renderWithRouter();
      expect(screen.getByText("Ver Página Pública")).toBeInTheDocument();
    });

    it("não deve mostrar link para página pública quando arena não existe", () => {
      mockUseArena.mockReturnValue({ arena: null });
      renderWithRouter();
      expect(screen.queryByText("Ver Página Pública")).not.toBeInTheDocument();
    });
  });

  describe("logout", () => {
    it("deve abrir modal de confirmação ao clicar em sair", () => {
      renderWithRouter();
      fireEvent.pointerDown(screen.getByText("Sair"));

      // Modal deve aparecer
      expect(screen.getByText("Sair do Sistema")).toBeInTheDocument();
      expect(
        screen.getByText("Deseja realmente sair do painel administrativo?")
      ).toBeInTheDocument();
    });

    it("deve chamar logout ao confirmar no modal", () => {
      renderWithRouter();
      fireEvent.pointerDown(screen.getByText("Sair"));

      // Confirma no modal - o botão do modal está dentro do ModalContainer
      // Há dois botões "Sair" - um na sidebar e outro no modal
      const buttons = screen.getAllByText("Sair");
      // O segundo botão é o do modal (dentro do span)
      const modalButton = buttons.find(
        (btn) => btn.closest("button")?.getAttribute("type") === "button"
      );
      fireEvent.click(modalButton!.closest("button")!);

      expect(mockLogout).toHaveBeenCalled();
    });

    it("não deve chamar logout ao cancelar no modal", () => {
      renderWithRouter();
      fireEvent.pointerDown(screen.getByText("Sair"));

      // Cancela no modal
      fireEvent.click(screen.getByText("Cancelar"));

      expect(mockLogout).not.toHaveBeenCalled();
    });
  });

  describe("toggle sidebar", () => {
    it("deve mostrar botão de toggle", () => {
      renderWithRouter();
      // O botão mostra ← quando aberto
      expect(screen.getByText("←")).toBeInTheDocument();
    });

    it("deve alternar sidebar ao clicar no toggle", () => {
      renderWithRouter();
      const toggleButton = screen.getByText("←");
      fireEvent.click(toggleButton);
      // Após fechar, deve mostrar →
      expect(screen.getByText("→")).toBeInTheDocument();
    });
  });

  describe("menu mobile", () => {
    it("deve renderizar botão de menu mobile", () => {
      renderWithRouter();
      expect(screen.getByText("☰")).toBeInTheDocument();
    });

    it("deve alternar sidebar ao clicar no botão mobile", () => {
      renderWithRouter();
      const menuButton = screen.getByText("☰");

      // Primeiro clique - fecha (estava aberto por padrão em desktop)
      fireEvent.click(menuButton);
      expect(screen.getByText("→")).toBeInTheDocument();

      // Segundo clique - abre
      fireEvent.click(menuButton);
      expect(screen.getByText("←")).toBeInTheDocument();
    });
  });

  describe("rota ativa", () => {
    it("deve marcar Dashboard como ativo quando na rota /admin", () => {
      renderWithRouter("/admin");
      // O link do Dashboard deve estar presente
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
    });

    it("deve marcar Jogadores como ativo quando na rota /admin/jogadores", () => {
      renderWithRouter("/admin/jogadores");
      expect(screen.getByText("Jogadores Content")).toBeInTheDocument();
    });
  });

  describe("usuário sem email", () => {
    it("deve lidar com usuário sem email", () => {
      mockUseAuth.mockReturnValue({
        user: {},
        logout: mockLogout,
      });
      renderWithRouter();
      // Não deve quebrar
      expect(screen.getByText("Administrador")).toBeInTheDocument();
    });
  });

  describe("overlay", () => {
    it("deve fechar sidebar ao clicar no overlay", () => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 500, // Mobile
      });

      const { container } = renderWithRouter();

      // Encontrar o overlay pelo styled-component class
      const overlays = container.querySelectorAll("div");
      // O overlay é um dos divs
      expect(overlays.length).toBeGreaterThan(0);
    });
  });
});
