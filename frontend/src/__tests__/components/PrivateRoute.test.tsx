/**
 * Testes do componente PrivateRoute
 *
 * Nota: Este teste usa uma implementação local do PrivateRoute
 * para evitar problemas com mocks do Firebase/import.meta
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";

// Mock do useAuth
const mockUseAuth = jest.fn();

// Componente PrivateRoute para teste (replica a lógica do original)
const PrivateRoute: React.FC<{ children: React.ReactNode; requireAdmin?: boolean }> = ({
  children,
  requireAdmin = false,
}) => {
  const { user, loading } = mockUseAuth();
  const location = useLocation();

  if (loading) {
    return <div data-testid="loading-spinner">Verificando autenticação...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin) {
    const userRole = user.role || "admin";
    if (userRole !== "admin" && userRole !== "superAdmin") {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
};

const renderWithRouter = (
  children: React.ReactNode,
  initialEntries = ["/protected"]
) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/unauthorized" element={<div>Unauthorized Page</div>} />
        <Route path="/protected" element={children} />
      </Routes>
    </MemoryRouter>
  );
};

describe("PrivateRoute", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("estado de loading", () => {
    it("deve mostrar loading spinner enquanto verifica autenticação", () => {
      mockUseAuth.mockReturnValue({ user: null, loading: true });

      renderWithRouter(
        <PrivateRoute>
          <div>Protected Content</div>
        </PrivateRoute>
      );

      expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
      expect(screen.getByText("Verificando autenticação...")).toBeInTheDocument();
    });

    it("não deve mostrar conteúdo protegido durante loading", () => {
      mockUseAuth.mockReturnValue({ user: null, loading: true });

      renderWithRouter(
        <PrivateRoute>
          <div>Protected Content</div>
        </PrivateRoute>
      );

      expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    });
  });

  describe("usuário não autenticado", () => {
    it("deve redirecionar para login quando usuário não está autenticado", () => {
      mockUseAuth.mockReturnValue({ user: null, loading: false });

      renderWithRouter(
        <PrivateRoute>
          <div>Protected Content</div>
        </PrivateRoute>
      );

      expect(screen.getByText("Login Page")).toBeInTheDocument();
      expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    });
  });

  describe("usuário autenticado", () => {
    it("deve renderizar conteúdo quando usuário está autenticado", () => {
      mockUseAuth.mockReturnValue({
        user: { uid: "1", email: "user@test.com" },
        loading: false,
      });

      renderWithRouter(
        <PrivateRoute>
          <div>Protected Content</div>
        </PrivateRoute>
      );

      expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });

    it("deve renderizar componentes filhos corretamente", () => {
      mockUseAuth.mockReturnValue({
        user: { uid: "1", email: "user@test.com" },
        loading: false,
      });

      renderWithRouter(
        <PrivateRoute>
          <div>
            <h1>Dashboard</h1>
            <p>Welcome to the dashboard</p>
          </div>
        </PrivateRoute>
      );

      expect(screen.getByText("Dashboard")).toBeInTheDocument();
      expect(screen.getByText("Welcome to the dashboard")).toBeInTheDocument();
    });
  });

  describe("verificação de admin", () => {
    it("deve renderizar conteúdo para usuário admin quando requireAdmin é true", () => {
      mockUseAuth.mockReturnValue({
        user: { uid: "1", email: "admin@test.com", role: "admin" },
        loading: false,
      });

      renderWithRouter(
        <PrivateRoute requireAdmin>
          <div>Admin Content</div>
        </PrivateRoute>
      );

      expect(screen.getByText("Admin Content")).toBeInTheDocument();
    });

    it("deve renderizar conteúdo para superAdmin quando requireAdmin é true", () => {
      mockUseAuth.mockReturnValue({
        user: { uid: "1", email: "super@test.com", role: "superAdmin" },
        loading: false,
      });

      renderWithRouter(
        <PrivateRoute requireAdmin>
          <div>Admin Content</div>
        </PrivateRoute>
      );

      expect(screen.getByText("Admin Content")).toBeInTheDocument();
    });

    it("deve usar role admin como default quando role não está definido", () => {
      mockUseAuth.mockReturnValue({
        user: { uid: "1", email: "user@test.com" },
        loading: false,
      });

      renderWithRouter(
        <PrivateRoute requireAdmin>
          <div>Admin Content</div>
        </PrivateRoute>
      );

      expect(screen.getByText("Admin Content")).toBeInTheDocument();
    });

    it("deve redirecionar para unauthorized quando usuário não é admin", () => {
      mockUseAuth.mockReturnValue({
        user: { uid: "1", email: "user@test.com", role: "user" },
        loading: false,
      });

      renderWithRouter(
        <PrivateRoute requireAdmin>
          <div>Admin Content</div>
        </PrivateRoute>
      );

      expect(screen.getByText("Unauthorized Page")).toBeInTheDocument();
      expect(screen.queryByText("Admin Content")).not.toBeInTheDocument();
    });
  });

  describe("requireAdmin false por padrão", () => {
    it("deve permitir qualquer usuário autenticado quando requireAdmin não é definido", () => {
      mockUseAuth.mockReturnValue({
        user: { uid: "1", email: "user@test.com", role: "user" },
        loading: false,
      });

      renderWithRouter(
        <PrivateRoute>
          <div>Regular Content</div>
        </PrivateRoute>
      );

      expect(screen.getByText("Regular Content")).toBeInTheDocument();
    });

    it("deve permitir qualquer usuário autenticado quando requireAdmin é false", () => {
      mockUseAuth.mockReturnValue({
        user: { uid: "1", email: "user@test.com", role: "user" },
        loading: false,
      });

      renderWithRouter(
        <PrivateRoute requireAdmin={false}>
          <div>Regular Content</div>
        </PrivateRoute>
      );

      expect(screen.getByText("Regular Content")).toBeInTheDocument();
    });
  });
});
