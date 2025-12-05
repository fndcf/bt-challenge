/**
 * Testes do hook useArenaLoader
 */

import { renderHook } from "@testing-library/react";
import {
  useArenaLoader,
  extractArenaSlug,
  isAdminRoute,
} from "@/hooks/useArenaLoader";

// Mock do react-router-dom
const mockLocation = { pathname: "/" };
jest.mock("react-router-dom", () => ({
  useLocation: () => mockLocation,
}));

// Mock do AuthContext
const mockUser = { uid: "test-uid", email: "test@email.com" };
jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: mockUser }),
}));

describe("useArenaLoader", () => {
  describe("extractArenaSlug", () => {
    it("deve extrair slug de URL de arena", () => {
      expect(extractArenaSlug("/arena/arenaazul")).toBe("arenaazul");
    });

    it("deve extrair slug com subpaths", () => {
      expect(extractArenaSlug("/arena/arenaazul/etapas")).toBe("arenaazul");
    });

    it("deve retornar null para URL sem arena", () => {
      expect(extractArenaSlug("/admin/dashboard")).toBeNull();
    });

    it("deve retornar null para URL raiz", () => {
      expect(extractArenaSlug("/")).toBeNull();
    });

    it("deve retornar null para URL de arena sem slug", () => {
      expect(extractArenaSlug("/arena/")).toBeNull();
    });
  });

  describe("isAdminRoute", () => {
    it("deve retornar true para rotas admin", () => {
      expect(isAdminRoute("/admin")).toBe(true);
      expect(isAdminRoute("/admin/dashboard")).toBe(true);
      expect(isAdminRoute("/admin/etapas/123")).toBe(true);
    });

    it("deve retornar false para rotas não admin", () => {
      expect(isAdminRoute("/")).toBe(false);
      expect(isAdminRoute("/arena/teste")).toBe(false);
      expect(isAdminRoute("/login")).toBe(false);
    });
  });

  describe("useArenaLoader hook", () => {
    const mockConfig = {
      onPublicArena: jest.fn(),
      onAdminArena: jest.fn(),
      onNoArena: jest.fn(),
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("deve chamar onPublicArena para rota de arena pública", () => {
      mockLocation.pathname = "/arena/arenaazul";

      renderHook(() => useArenaLoader(mockConfig));

      expect(mockConfig.onPublicArena).toHaveBeenCalledWith("arenaazul");
      expect(mockConfig.onAdminArena).not.toHaveBeenCalled();
      expect(mockConfig.onNoArena).not.toHaveBeenCalled();
    });

    it("deve chamar onAdminArena para rota admin com usuário autenticado", () => {
      mockLocation.pathname = "/admin/dashboard";

      renderHook(() => useArenaLoader(mockConfig));

      expect(mockConfig.onAdminArena).toHaveBeenCalled();
      expect(mockConfig.onPublicArena).not.toHaveBeenCalled();
      expect(mockConfig.onNoArena).not.toHaveBeenCalled();
    });

    it("deve chamar onNoArena para rota sem arena", () => {
      mockLocation.pathname = "/login";

      renderHook(() => useArenaLoader(mockConfig));

      expect(mockConfig.onNoArena).toHaveBeenCalled();
      expect(mockConfig.onPublicArena).not.toHaveBeenCalled();
      expect(mockConfig.onAdminArena).not.toHaveBeenCalled();
    });

    it("deve retornar currentPath corretamente", () => {
      mockLocation.pathname = "/arena/teste";

      const { result } = renderHook(() => useArenaLoader(mockConfig));

      expect(result.current.currentPath).toBe("/arena/teste");
    });

    it("deve retornar currentSlug corretamente", () => {
      mockLocation.pathname = "/arena/minhaArena";

      const { result } = renderHook(() => useArenaLoader(mockConfig));

      expect(result.current.currentSlug).toBe("minhaArena");
    });

    it("deve retornar isAdmin corretamente", () => {
      mockLocation.pathname = "/admin/etapas";

      const { result } = renderHook(() => useArenaLoader(mockConfig));

      expect(result.current.isAdmin).toBe(true);
    });

    it("deve retornar isAuthenticated corretamente", () => {
      mockLocation.pathname = "/";

      const { result } = renderHook(() => useArenaLoader(mockConfig));

      expect(result.current.isAuthenticated).toBe(true);
    });
  });
});
