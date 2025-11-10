import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "../config/firebase";
import { User, AuthState } from "../types";

interface AuthContextType extends AuthState {
  login: (
    email: string,
    password: string,
    rememberMe?: boolean
  ) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Provider de Autenticação
 * Gerencia o estado de autenticação do usuário com Firebase
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Converter Firebase User para nosso User type
   */
  const convertFirebaseUser = (firebaseUser: FirebaseUser): User => {
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email || "",
      role: "admin", // Por padrão, todos os usuários autenticados são admins de arena
      // arenaId será buscado do backend depois
    };
  };

  /**
   * Login com email e senha
   */
  const login = async (
    email: string,
    password: string,
    rememberMe: boolean = false
  ): Promise<void> => {
    try {
      setError(null);
      setLoading(true);

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Salvar preferência de "lembrar"
      if (rememberMe) {
        localStorage.setItem("rememberMe", "true");
        localStorage.setItem("userEmail", email);
      } else {
        localStorage.removeItem("rememberMe");
        localStorage.removeItem("userEmail");
      }

      // Buscar dados adicionais do backend (arenaId, role)
      // TODO: Implementar chamada ao backend para buscar dados completos
      const token = await userCredential.user.getIdToken();
      localStorage.setItem("authToken", token);

      setUser(convertFirebaseUser(userCredential.user));
    } catch (err: any) {
      const errorMessage = getAuthErrorMessage(err.code);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout
   */
  const logout = async (): Promise<void> => {
    try {
      setError(null);
      await signOut(auth);
      localStorage.removeItem("authToken");
      setUser(null);
    } catch (err: any) {
      const errorMessage = "Erro ao fazer logout";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  /**
   * Registrar novo usuário
   */
  const register = async (email: string, password: string): Promise<void> => {
    try {
      setError(null);
      setLoading(true);

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // TODO: Criar registro no backend (admin, arena, etc)
      const token = await userCredential.user.getIdToken();
      localStorage.setItem("authToken", token);

      setUser(convertFirebaseUser(userCredential.user));
    } catch (err: any) {
      const errorMessage = getAuthErrorMessage(err.code);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Resetar senha (enviar email de recuperação)
   */
  const resetPassword = async (email: string): Promise<void> => {
    try {
      setError(null);
      await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
      const errorMessage = getPasswordResetErrorMessage(err.code);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  /**
   * Observar mudanças no estado de autenticação
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Usuário autenticado
        const token = await firebaseUser.getIdToken();
        localStorage.setItem("authToken", token);

        // TODO: Buscar dados completos do backend
        setUser(convertFirebaseUser(firebaseUser));
      } else {
        // Usuário não autenticado
        localStorage.removeItem("authToken");
        setUser(null);
      }
      setLoading(false);
    });

    // Cleanup
    return () => unsubscribe();
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    error,
    login,
    logout,
    register,
    resetPassword,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook para usar o contexto de autenticação
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};

/**
 * Traduzir erros do Firebase para mensagens amigáveis
 */
const getAuthErrorMessage = (errorCode: string): string => {
  const errorMessages: { [key: string]: string } = {
    "auth/user-not-found": "Usuário não encontrado",
    "auth/wrong-password": "Senha incorreta",
    "auth/email-already-in-use": "Email já está em uso",
    "auth/weak-password": "Senha muito fraca. Use no mínimo 6 caracteres",
    "auth/invalid-email": "Email inválido",
    "auth/user-disabled": "Usuário desabilitado",
    "auth/too-many-requests": "Muitas tentativas. Tente novamente mais tarde",
    "auth/network-request-failed": "Erro de conexão. Verifique sua internet",
    "auth/invalid-credential": "Email ou senha incorretos",
  };

  return errorMessages[errorCode] || "Erro ao autenticar. Tente novamente";
};

/**
 * Traduzir erros de reset de senha
 */
const getPasswordResetErrorMessage = (errorCode: string): string => {
  const errorMessages: { [key: string]: string } = {
    "auth/user-not-found": "Email não encontrado",
    "auth/invalid-email": "Email inválido",
    "auth/network-request-failed": "Erro de conexão. Verifique sua internet",
    "auth/too-many-requests": "Muitas tentativas. Aguarde alguns minutos",
  };

  return errorMessages[errorCode] || "Erro ao enviar email de recuperação";
};
