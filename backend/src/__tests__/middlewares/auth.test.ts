/**
 * Testes dos Middlewares de Autenticação
 */

jest.mock("../../config/firebase", () => ({
  auth: {
    verifyIdToken: jest.fn(),
  },
  __esModule: true,
  default: {
    firestore: jest.fn(() => ({
      collection: jest.fn(() => ({
        doc: jest.fn(() => ({
          get: jest.fn(),
        })),
      })),
    })),
  },
}));

import { Response, NextFunction } from "express";
import admin, { auth } from "../../config/firebase";
import {
  requireAuth,
  optionalAuth,
  requireRole,
  requireArenaAccess,
  AuthRequest,
} from "../../middlewares/auth";

describe("Auth Middlewares", () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      headers: {},
      params: {},
      body: {},
      query: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe("requireAuth", () => {
    it("deve lançar erro se não houver header Authorization", async () => {
      mockRequest.headers = {};

      await requireAuth(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Token de autenticação não fornecido",
        })
      );
    });

    it("deve lançar erro se header Authorization não começar com Bearer", async () => {
      mockRequest.headers = { authorization: "Basic token123" };

      await requireAuth(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Token de autenticação não fornecido",
        })
      );
    });

    it("deve lançar erro se token for inválido", async () => {
      mockRequest.headers = { authorization: "Bearer invalid-token" };

      (auth.verifyIdToken as jest.Mock).mockRejectedValue({
        code: "auth/argument-error",
      });

      await requireAuth(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Token inválido",
        })
      );
    });

    it("deve lançar erro se token estiver expirado", async () => {
      mockRequest.headers = { authorization: "Bearer expired-token" };

      (auth.verifyIdToken as jest.Mock).mockRejectedValue({
        code: "auth/id-token-expired",
      });

      await requireAuth(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Token expirado",
        })
      );
    });

    it("deve lançar erro se usuário não encontrado no Firestore", async () => {
      mockRequest.headers = { authorization: "Bearer valid-token" };

      (auth.verifyIdToken as jest.Mock).mockResolvedValue({
        uid: "user-123",
        email: "test@example.com",
      });

      const mockGet = jest.fn().mockResolvedValue({ exists: false });
      const mockDoc = jest.fn(() => ({ get: mockGet }));
      const mockCollection = jest.fn(() => ({ doc: mockDoc }));
      (admin.firestore as unknown as jest.Mock).mockReturnValue({
        collection: mockCollection,
      });

      await requireAuth(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Usuário não encontrado",
        })
      );
    });

    it("deve autenticar usuário com sucesso", async () => {
      mockRequest.headers = { authorization: "Bearer valid-token" };

      (auth.verifyIdToken as jest.Mock).mockResolvedValue({
        uid: "user-123",
        email: "test@example.com",
      });

      const mockGet = jest.fn().mockResolvedValue({
        exists: true,
        data: () => ({
          arenaId: "arena-123",
          role: "admin",
        }),
      });
      const mockDoc = jest.fn(() => ({ get: mockGet }));
      const mockCollection = jest.fn(() => ({ doc: mockDoc }));
      (admin.firestore as unknown as jest.Mock).mockReturnValue({
        collection: mockCollection,
      });

      await requireAuth(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.user).toEqual({
        uid: "user-123",
        email: "test@example.com",
        arenaId: "arena-123",
        role: "admin",
      });
      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe("optionalAuth", () => {
    it("deve continuar sem autenticação se não houver token", async () => {
      mockRequest.headers = {};

      await optionalAuth(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalledWith();
    });

    it("deve continuar sem autenticação se header não começar com Bearer", async () => {
      mockRequest.headers = { authorization: "Basic token" };

      await optionalAuth(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalledWith();
    });

    it("deve continuar sem erro se token for inválido", async () => {
      mockRequest.headers = { authorization: "Bearer invalid-token" };

      (auth.verifyIdToken as jest.Mock).mockRejectedValue(new Error("Invalid"));

      await optionalAuth(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalledWith();
    });

    it("deve autenticar usuário se token for válido", async () => {
      mockRequest.headers = { authorization: "Bearer valid-token" };

      (auth.verifyIdToken as jest.Mock).mockResolvedValue({
        uid: "user-123",
        email: "test@example.com",
      });

      const mockGet = jest.fn().mockResolvedValue({
        exists: true,
        data: () => ({
          arenaId: "arena-123",
          role: "admin",
        }),
      });
      const mockDoc = jest.fn(() => ({ get: mockGet }));
      const mockCollection = jest.fn(() => ({ doc: mockDoc }));
      (admin.firestore as unknown as jest.Mock).mockReturnValue({
        collection: mockCollection,
      });

      await optionalAuth(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.user).toEqual({
        uid: "user-123",
        email: "test@example.com",
        arenaId: "arena-123",
        role: "admin",
      });
      expect(mockNext).toHaveBeenCalledWith();
    });

    it("deve continuar sem user se admin não existir no Firestore", async () => {
      mockRequest.headers = { authorization: "Bearer valid-token" };

      (auth.verifyIdToken as jest.Mock).mockResolvedValue({
        uid: "user-123",
        email: "test@example.com",
      });

      const mockGet = jest.fn().mockResolvedValue({ exists: false });
      const mockDoc = jest.fn(() => ({ get: mockGet }));
      const mockCollection = jest.fn(() => ({ doc: mockDoc }));
      (admin.firestore as unknown as jest.Mock).mockReturnValue({
        collection: mockCollection,
      });

      await optionalAuth(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe("requireRole", () => {
    it("deve lançar erro se usuário não autenticado", () => {
      mockRequest.user = undefined;

      const middleware = requireRole(["admin"]);
      middleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Usuário não autenticado",
        })
      );
    });

    it("deve lançar erro se usuário não tem role permitida", () => {
      mockRequest.user = {
        uid: "user-123",
        email: "test@example.com",
        arenaId: "arena-123",
        role: "user",
      };

      const middleware = requireRole(["admin", "superadmin"]);
      middleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Você não tem permissão para acessar este recurso",
        })
      );
    });

    it("deve permitir acesso se usuário tem role permitida", () => {
      mockRequest.user = {
        uid: "user-123",
        email: "test@example.com",
        arenaId: "arena-123",
        role: "admin",
      };

      const middleware = requireRole(["admin", "superadmin"]);
      middleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it("deve permitir acesso com role única", () => {
      mockRequest.user = {
        uid: "user-123",
        email: "test@example.com",
        arenaId: "arena-123",
        role: "superadmin",
      };

      const middleware = requireRole(["superadmin"]);
      middleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe("requireArenaAccess", () => {
    it("deve lançar erro se usuário não autenticado", () => {
      mockRequest.user = undefined;

      requireArenaAccess(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Usuário não autenticado",
        })
      );
    });

    it("deve lançar erro se arena não especificada", () => {
      mockRequest.user = {
        uid: "user-123",
        email: "test@example.com",
        arenaId: "arena-123",
        role: "admin",
      };
      mockRequest.params = {};
      mockRequest.body = {};
      mockRequest.query = {};

      requireArenaAccess(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Arena não especificada",
        })
      );
    });

    it("deve lançar erro se usuário não tem acesso à arena", () => {
      mockRequest.user = {
        uid: "user-123",
        email: "test@example.com",
        arenaId: "arena-123",
        role: "admin",
      };
      mockRequest.params = { arenaId: "arena-456" };

      requireArenaAccess(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Você não tem acesso a esta arena",
        })
      );
    });

    it("deve permitir acesso se arenaId está em params", () => {
      mockRequest.user = {
        uid: "user-123",
        email: "test@example.com",
        arenaId: "arena-123",
        role: "admin",
      };
      mockRequest.params = { arenaId: "arena-123" };

      requireArenaAccess(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith();
    });

    it("deve permitir acesso se arenaId está em body", () => {
      mockRequest.user = {
        uid: "user-123",
        email: "test@example.com",
        arenaId: "arena-123",
        role: "admin",
      };
      mockRequest.params = {};
      mockRequest.body = { arenaId: "arena-123" };

      requireArenaAccess(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith();
    });

    it("deve permitir acesso se arenaId está em query", () => {
      mockRequest.user = {
        uid: "user-123",
        email: "test@example.com",
        arenaId: "arena-123",
        role: "admin",
      };
      mockRequest.params = {};
      mockRequest.body = {};
      mockRequest.query = { arenaId: "arena-123" };

      requireArenaAccess(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith();
    });
  });
});
