/**
 * Testes do AuthContext
 */

import { render, screen, waitFor, act } from "@testing-library/react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

// Mock do Firebase Auth
const mockSignInWithEmailAndPassword = jest.fn();
const mockSignOut = jest.fn();
const mockCreateUserWithEmailAndPassword = jest.fn();
const mockSendPasswordResetEmail = jest.fn();
const mockOnAuthStateChanged = jest.fn();

jest.mock("firebase/auth", () => ({
  signInWithEmailAndPassword: (...args: any[]) =>
    mockSignInWithEmailAndPassword(...args),
  signOut: (...args: any[]) => mockSignOut(...args),
  createUserWithEmailAndPassword: (...args: any[]) =>
    mockCreateUserWithEmailAndPassword(...args),
  sendPasswordResetEmail: (...args: any[]) =>
    mockSendPasswordResetEmail(...args),
  onAuthStateChanged: (...args: any[]) => mockOnAuthStateChanged(...args),
}));

// Mock do Firebase config
jest.mock("@/config/firebase", () => ({
  auth: {},
}));

// Mock do logger
jest.mock("@/utils/logger", () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock do errorHandler
jest.mock("@/utils/errorHandler", () => ({
  getErrorMessage: (err: any) => err.message || "Erro desconhecido",
}));

// Componente de teste para usar o hook useAuth
const TestComponent: React.FC<{
  onAuth?: (auth: ReturnType<typeof useAuth>) => void;
}> = ({ onAuth }) => {
  const auth = useAuth();

  if (onAuth) {
    onAuth(auth);
  }

  return (
    <div>
      <span data-testid="loading">{auth.loading.toString()}</span>
      <span data-testid="authenticated">{auth.isAuthenticated.toString()}</span>
      <span data-testid="user">{auth.user?.email || "null"}</span>
      <span data-testid="error">{auth.error || "null"}</span>
    </div>
  );
};

describe("AuthContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();

    // Mock padrão do onAuthStateChanged
    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      // Simular usuário não autenticado inicialmente
      callback(null);
      // Retornar função de unsubscribe
      return jest.fn();
    });
  });

  describe("AuthProvider", () => {
    it("deve renderizar children", async () => {
      render(
        <AuthProvider>
          <div data-testid="child">Child</div>
        </AuthProvider>
      );

      expect(screen.getByTestId("child")).toBeInTheDocument();
    });

    it("deve iniciar com usuário não autenticado", async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
      });
    });

    it("deve carregar usuário autenticado do Firebase", async () => {
      const mockUser = {
        uid: "test-uid",
        email: "test@email.com",
        getIdToken: jest.fn().mockResolvedValue("mock-token"),
      };

      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("authenticated")).toHaveTextContent("true");
        expect(screen.getByTestId("user")).toHaveTextContent("test@email.com");
      });
    });
  });

  describe("useAuth", () => {
    it("deve lançar erro quando usado fora do AuthProvider", () => {
      // Suprimir console.error do React para este teste
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow("useAuth deve ser usado dentro de um AuthProvider");

      consoleSpy.mockRestore();
    });
  });

  describe("login", () => {
    it("deve fazer login com sucesso", async () => {
      const mockUser = {
        uid: "test-uid",
        email: "test@email.com",
        getIdToken: jest.fn().mockResolvedValue("mock-token"),
      };

      mockSignInWithEmailAndPassword.mockResolvedValue({ user: mockUser });

      let authRef: ReturnType<typeof useAuth>;

      render(
        <AuthProvider>
          <TestComponent
            onAuth={(auth) => {
              authRef = auth;
            }}
          />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("false");
      });

      await act(async () => {
        await authRef!.login("test@email.com", "password123");
      });

      expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        "test@email.com",
        "password123"
      );
    });

    it("deve salvar rememberMe no localStorage quando true", async () => {
      const mockUser = {
        uid: "test-uid",
        email: "test@email.com",
        getIdToken: jest.fn().mockResolvedValue("mock-token"),
      };

      mockSignInWithEmailAndPassword.mockResolvedValue({ user: mockUser });

      let authRef: ReturnType<typeof useAuth>;

      render(
        <AuthProvider>
          <TestComponent
            onAuth={(auth) => {
              authRef = auth;
            }}
          />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("false");
      });

      await act(async () => {
        await authRef!.login("test@email.com", "password123", true);
      });

      expect(localStorage.getItem("rememberMe")).toBe("true");
      expect(localStorage.getItem("userEmail")).toBe("test@email.com");
    });

    it("deve remover rememberMe do localStorage quando false", async () => {
      localStorage.setItem("rememberMe", "true");
      localStorage.setItem("userEmail", "old@email.com");

      const mockUser = {
        uid: "test-uid",
        email: "test@email.com",
        getIdToken: jest.fn().mockResolvedValue("mock-token"),
      };

      mockSignInWithEmailAndPassword.mockResolvedValue({ user: mockUser });

      let authRef: ReturnType<typeof useAuth>;

      render(
        <AuthProvider>
          <TestComponent
            onAuth={(auth) => {
              authRef = auth;
            }}
          />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("false");
      });

      await act(async () => {
        await authRef!.login("test@email.com", "password123", false);
      });

      expect(localStorage.getItem("rememberMe")).toBeNull();
      expect(localStorage.getItem("userEmail")).toBeNull();
    });

    it("deve lançar erro quando login falha", async () => {
      const error = { message: "Credenciais inválidas", code: "auth/invalid" };
      mockSignInWithEmailAndPassword.mockRejectedValue(error);

      let authRef: ReturnType<typeof useAuth>;

      render(
        <AuthProvider>
          <TestComponent
            onAuth={(auth) => {
              authRef = auth;
            }}
          />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("false");
      });

      await expect(
        act(async () => {
          await authRef!.login("test@email.com", "wrongpassword");
        })
      ).rejects.toThrow("Credenciais inválidas");
    });
  });

  describe("logout", () => {
    it("deve fazer logout com sucesso", async () => {
      const mockUser = {
        uid: "test-uid",
        email: "test@email.com",
        getIdToken: jest.fn().mockResolvedValue("mock-token"),
      };

      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });

      mockSignOut.mockResolvedValue(undefined);

      let authRef: ReturnType<typeof useAuth>;

      render(
        <AuthProvider>
          <TestComponent
            onAuth={(auth) => {
              authRef = auth;
            }}
          />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("authenticated")).toHaveTextContent("true");
      });

      await act(async () => {
        await authRef!.logout();
      });

      expect(mockSignOut).toHaveBeenCalled();
      expect(localStorage.getItem("authToken")).toBeNull();
    });

    it("deve lançar erro quando logout falha", async () => {
      const error = { message: "Erro no logout" };
      mockSignOut.mockRejectedValue(error);

      let authRef: ReturnType<typeof useAuth>;

      render(
        <AuthProvider>
          <TestComponent
            onAuth={(auth) => {
              authRef = auth;
            }}
          />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("false");
      });

      await expect(
        act(async () => {
          await authRef!.logout();
        })
      ).rejects.toThrow("Erro no logout");
    });
  });

  describe("register", () => {
    it("deve registrar novo usuário com sucesso", async () => {
      const mockUser = {
        uid: "new-uid",
        email: "new@email.com",
        getIdToken: jest.fn().mockResolvedValue("mock-token"),
      };

      mockCreateUserWithEmailAndPassword.mockResolvedValue({ user: mockUser });

      let authRef: ReturnType<typeof useAuth>;

      render(
        <AuthProvider>
          <TestComponent
            onAuth={(auth) => {
              authRef = auth;
            }}
          />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("false");
      });

      await act(async () => {
        await authRef!.register("new@email.com", "password123");
      });

      expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        "new@email.com",
        "password123"
      );
    });

    it("deve lançar erro quando registro falha", async () => {
      const error = { message: "Email já cadastrado", code: "auth/email-in-use" };
      mockCreateUserWithEmailAndPassword.mockRejectedValue(error);

      let authRef: ReturnType<typeof useAuth>;

      render(
        <AuthProvider>
          <TestComponent
            onAuth={(auth) => {
              authRef = auth;
            }}
          />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("false");
      });

      await expect(
        act(async () => {
          await authRef!.register("existing@email.com", "password123");
        })
      ).rejects.toThrow("Email já cadastrado");
    });
  });

  describe("resetPassword", () => {
    it("deve enviar email de recuperação com sucesso", async () => {
      mockSendPasswordResetEmail.mockResolvedValue(undefined);

      let authRef: ReturnType<typeof useAuth>;

      render(
        <AuthProvider>
          <TestComponent
            onAuth={(auth) => {
              authRef = auth;
            }}
          />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("false");
      });

      await act(async () => {
        await authRef!.resetPassword("test@email.com");
      });

      expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(
        expect.anything(),
        "test@email.com"
      );
    });

    it("deve lançar erro quando reset falha", async () => {
      const error = { message: "Email não encontrado", code: "auth/user-not-found" };
      mockSendPasswordResetEmail.mockRejectedValue(error);

      let authRef: ReturnType<typeof useAuth>;

      render(
        <AuthProvider>
          <TestComponent
            onAuth={(auth) => {
              authRef = auth;
            }}
          />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("false");
      });

      await expect(
        act(async () => {
          await authRef!.resetPassword("nonexistent@email.com");
        })
      ).rejects.toThrow("Email não encontrado");
    });
  });

  describe("onAuthStateChanged", () => {
    it("deve salvar token quando usuário está autenticado", async () => {
      const mockUser = {
        uid: "test-uid",
        email: "test@email.com",
        getIdToken: jest.fn().mockResolvedValue("firebase-token"),
      };

      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(localStorage.getItem("authToken")).toBe("firebase-token");
      });
    });

    it("deve remover token quando usuário não está autenticado", async () => {
      localStorage.setItem("authToken", "old-token");

      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        callback(null);
        return jest.fn();
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(localStorage.getItem("authToken")).toBeNull();
      });
    });

    it("deve chamar unsubscribe ao desmontar", async () => {
      const unsubscribe = jest.fn();
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        callback(null);
        return unsubscribe;
      });

      const { unmount } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      unmount();

      expect(unsubscribe).toHaveBeenCalled();
    });
  });
});
