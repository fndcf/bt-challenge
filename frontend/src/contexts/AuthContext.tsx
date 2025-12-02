/**
 * AuthContext.tsx - VERSÃO REFATORADA
 * 
 * Responsabilidade única: Gerenciar estado de autenticação
 * 
 * ✅ Funções de tradução de erro movidas para errorHandler.ts
 */

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
import { getErrorMessage } from "../utils/errorHandler";
import logger from "../utils/logger";

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
 * Converter Firebase User para nosso User type
 */
const convertFirebaseUser = (firebaseUser: FirebaseUser): User => {
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email || "",
    role: "admin",
  };
};

/**
 * Provider de Autenticação
 * Gerencia o estado de autenticação do usuário com Firebase
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
      const token = await userCredential.user.getIdToken();
      localStorage.setItem("authToken", token);

      setUser(convertFirebaseUser(userCredential.user));

      logger.info("Login realizado com sucesso", {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        rememberMe,
      });
    } catch (err: any) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);

      logger.error(
        "Falha no login",
        {
          email,
          errorCode: err.code,
        },
        err
      );

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

      // Capturar uid antes de fazer logout
      const uid = user?.uid;
      const email = user?.email;

      await signOut(auth);
      localStorage.removeItem("authToken");
      setUser(null);

      logger.info("Logout realizado", { uid, email });
    } catch (err: any) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);

      logger.error("Erro ao fazer logout", {}, err);

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

      const token = await userCredential.user.getIdToken();
      localStorage.setItem("authToken", token);

      setUser(convertFirebaseUser(userCredential.user));

      logger.info("Conta criada com sucesso", {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
      });
    } catch (err: any) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);

      logger.error(
        "Falha no registro",
        {
          email,
          errorCode: err.code,
        },
        err
      );

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

      logger.info("Email de recuperação enviado", { email });
    } catch (err: any) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);

      logger.error(
        "Falha ao enviar email de recuperação",
        {
          email,
          errorCode: err.code,
        },
        err
      );

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
        setUser(convertFirebaseUser(firebaseUser));
      } else {
        // Usuário não autenticado
        localStorage.removeItem("authToken");
        setUser(null);
      }
      setLoading(false);
    });

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
