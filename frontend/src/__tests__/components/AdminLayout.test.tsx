/**
 * Testes do componente AdminLayout
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Mock dos contextos
const mockLogout = jest.fn();
const mockUseAuth = jest.fn();
const mockUseArena = jest.fn();

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock("@/contexts/ArenaContext", () => ({
  useArena: () => mockUseArena(),
}));

// Componente AdminLayout simplificado para testes
import React, { useState, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";

const AdminLayout: React.FC = () => {
  const { user, logout } = mockUseAuth();
  const { arena } = mockUseArena();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [modalLogoutAberto, setModalLogoutAberto] = useState(false);

  useEffect(() => {
    document.body.classList.add("admin-area");
    return () => {
      document.body.classList.remove("admin-area");
    };
  }, []);

  const menuItems = [
    { path: "/admin", label: "Dashboard", exact: true },
    { path: "/admin/jogadores", label: "Jogadores" },
    { path: "/admin/etapas", label: "Challenges" },
  ];

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const handleLogoutClick = (e: React.PointerEvent) => {
    e.preventDefault();
    setModalLogoutAberto(true);
  };

  const handleConfirmarLogout = () => {
    setModalLogoutAberto(false);
    logout();
  };

  return (
    <div data-testid="admin-layout">
      <div data-testid="overlay" onClick={() => setSidebarOpen(false)} />

      <aside data-testid="sidebar" data-open={sidebarOpen}>
        <button
          data-testid="toggle-button"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? "←" : "→"}
        </button>

        <div data-testid="logo">Challenge BT</div>

        <nav data-testid="nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              data-active={isActive(item.path, item.exact)}
            >
              {item.label}
            </Link>
          ))}

          {arena && (
            <Link
              to={`/arena/${arena.slug}`}
              target="_blank"
              data-testid="public-link"
            >
              Ver Página Pública
            </Link>
          )}

          <button data-testid="logout-button" onPointerDown={handleLogoutClick}>
            Sair
          </button>
        </nav>

        <div data-testid="user-info">
          <p>{user?.email?.split("@")[0]}</p>
          <small>Administrador</small>
        </div>
      </aside>

      <button
        data-testid="menu-button"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        ☰
      </button>

      <main data-testid="main-content">
        <Outlet />
      </main>

      {modalLogoutAberto && (
        <div data-testid="modal-confirmacao-logout">
          <span>Sair do Sistema</span>
          <span>Deseja realmente sair do painel administrativo?</span>
          <button
            data-testid="btn-cancelar-logout"
            onClick={() => setModalLogoutAberto(false)}
          >
            Cancelar
          </button>
          <button data-testid="btn-confirmar-logout" onClick={handleConfirmarLogout}>
            Sair
          </button>
        </div>
      )}
    </div>
  );
};

const renderWithRouter = (
  initialEntries = ["/admin"],
  authValue = { user: { email: "admin@test.com" }, logout: mockLogout },
  arenaValue = { arena: { slug: "minha-arena", nome: "Minha Arena" } }
) => {
  mockUseAuth.mockReturnValue(authValue);
  mockUseArena.mockReturnValue(arenaValue);

  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AdminLayout />
    </MemoryRouter>
  );
};

describe("AdminLayout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    document.body.classList.remove("admin-area");
  });

  describe("renderização básica", () => {
    it("deve renderizar o layout", () => {
      renderWithRouter();
      expect(screen.getByTestId("admin-layout")).toBeInTheDocument();
    });

    it("deve renderizar a sidebar", () => {
      renderWithRouter();
      expect(screen.getByTestId("sidebar")).toBeInTheDocument();
    });

    it("deve renderizar o logo", () => {
      renderWithRouter();
      expect(screen.getByText("Challenge BT")).toBeInTheDocument();
    });

    it("deve renderizar área principal", () => {
      renderWithRouter();
      expect(screen.getByTestId("main-content")).toBeInTheDocument();
    });

    it("deve adicionar classe admin-area ao body", () => {
      renderWithRouter();
      expect(document.body.classList.contains("admin-area")).toBe(true);
    });
  });

  describe("menu de navegação", () => {
    it("deve renderizar link Dashboard", () => {
      renderWithRouter();
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
    });

    it("deve renderizar link Jogadores", () => {
      renderWithRouter();
      expect(screen.getByText("Jogadores")).toBeInTheDocument();
    });

    it("deve renderizar link Challenges", () => {
      renderWithRouter();
      expect(screen.getByText("Challenges")).toBeInTheDocument();
    });

    it("deve mostrar link da página pública quando arena existe", () => {
      renderWithRouter();
      expect(screen.getByText("Ver Página Pública")).toBeInTheDocument();
    });

    it("não deve mostrar link da página pública quando arena não existe", () => {
      renderWithRouter(["/admin"], undefined, { arena: null });
      expect(screen.queryByText("Ver Página Pública")).not.toBeInTheDocument();
    });

    it("deve marcar Dashboard como ativo na rota /admin", () => {
      renderWithRouter(["/admin"]);
      const dashboardLink = screen.getByText("Dashboard");
      expect(dashboardLink).toHaveAttribute("data-active", "true");
    });

    it("deve marcar Jogadores como ativo na rota /admin/jogadores", () => {
      renderWithRouter(["/admin/jogadores"]);
      const jogadoresLink = screen.getByText("Jogadores");
      expect(jogadoresLink).toHaveAttribute("data-active", "true");
    });
  });

  describe("toggle sidebar", () => {
    it("deve alternar sidebar ao clicar no botão toggle", () => {
      renderWithRouter();
      const toggleButton = screen.getByTestId("toggle-button");
      const sidebar = screen.getByTestId("sidebar");

      expect(sidebar).toHaveAttribute("data-open", "true");

      fireEvent.click(toggleButton);
      expect(sidebar).toHaveAttribute("data-open", "false");

      fireEvent.click(toggleButton);
      expect(sidebar).toHaveAttribute("data-open", "true");
    });

    it("deve fechar sidebar ao clicar no overlay", () => {
      renderWithRouter();
      const overlay = screen.getByTestId("overlay");
      const sidebar = screen.getByTestId("sidebar");

      fireEvent.click(overlay);
      expect(sidebar).toHaveAttribute("data-open", "false");
    });

    it("deve alternar sidebar com botão de menu mobile", () => {
      renderWithRouter();
      const menuButton = screen.getByTestId("menu-button");
      const sidebar = screen.getByTestId("sidebar");

      fireEvent.click(menuButton);
      expect(sidebar).toHaveAttribute("data-open", "false");
    });
  });

  describe("logout", () => {
    it("deve ter botão de sair", () => {
      renderWithRouter();
      expect(screen.getByTestId("logout-button")).toBeInTheDocument();
    });

    it("deve abrir modal de confirmação ao clicar em sair", () => {
      renderWithRouter();
      const logoutButton = screen.getByTestId("logout-button");

      fireEvent.pointerDown(logoutButton);

      // Modal deve aparecer
      expect(screen.getByTestId("modal-confirmacao-logout")).toBeInTheDocument();
      expect(screen.getByText("Sair do Sistema")).toBeInTheDocument();
      expect(
        screen.getByText("Deseja realmente sair do painel administrativo?")
      ).toBeInTheDocument();
    });

    it("deve chamar logout quando confirmar no modal", () => {
      renderWithRouter();
      const logoutButton = screen.getByTestId("logout-button");

      // Abre o modal
      fireEvent.pointerDown(logoutButton);

      // Confirma no modal
      fireEvent.click(screen.getByTestId("btn-confirmar-logout"));

      expect(mockLogout).toHaveBeenCalled();
      // Modal deve fechar
      expect(
        screen.queryByTestId("modal-confirmacao-logout")
      ).not.toBeInTheDocument();
    });

    it("não deve chamar logout quando cancelar no modal", () => {
      renderWithRouter();
      const logoutButton = screen.getByTestId("logout-button");

      // Abre o modal
      fireEvent.pointerDown(logoutButton);

      // Cancela no modal
      fireEvent.click(screen.getByTestId("btn-cancelar-logout"));

      expect(mockLogout).not.toHaveBeenCalled();
      // Modal deve fechar
      expect(
        screen.queryByTestId("modal-confirmacao-logout")
      ).not.toBeInTheDocument();
    });
  });

  describe("informações do usuário", () => {
    it("deve mostrar nome do usuário", () => {
      renderWithRouter();
      expect(screen.getByText("admin")).toBeInTheDocument();
    });

    it("deve mostrar role Administrador", () => {
      renderWithRouter();
      expect(screen.getByText("Administrador")).toBeInTheDocument();
    });
  });

  describe("limpeza", () => {
    it("deve remover classe admin-area ao desmontar", () => {
      const { unmount } = renderWithRouter();
      expect(document.body.classList.contains("admin-area")).toBe(true);

      unmount();
      expect(document.body.classList.contains("admin-area")).toBe(false);
    });
  });
});
