/**
 * Types do Frontend
 * Importa types compartilhados e adiciona types específicos do frontend
 */

// Re-exportar types compartilhados
export * from "../../../shared/types";

// Types específicos do frontend

export interface User {
  uid: string;
  email: string;
  arenaId?: string;
  role?: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface ArenaContextType {
  arena: any | null; // Será tipado corretamente depois
  loading: boolean;
  error: string | null;
  setArena: (arena: any) => void;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface LoadingState {
  [key: string]: boolean;
}

export interface FormErrors {
  [key: string]: string;
}

// Route types
export interface RouteConfig {
  path: string;
  element: React.ReactNode;
  protected?: boolean;
  adminOnly?: boolean;
}
