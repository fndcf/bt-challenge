/**
 * Testes do componente PrivateRoute (testando o componente real)
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

// Mock do AuthContext
const mockUseAuth = jest.fn();
jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock do LoadingSpinner
jest.mock("@/components/common/LoadingSpinner", () => ({
  LoadingSpinner: ({ message }: { message?: string }) => (
    <div data-testid="loading-spinner">{message}</div>
  ),
}));

import PrivateRoute from "@/components/auth/PrivateRoute/PrivateRoute";

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

describe("PrivateRoute (actual component)", () => {
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
