/**
 * Exportações centralizadas do sistema de tipos
 */

// ============================================
// IMPORTS (for internal use)
// ============================================
import type { Arena } from "./arena";

// ============================================
// DOMAIN TYPES (Business Logic)
// ============================================

// Arena
export * from "./arena";

// Jogadores
export * from "./jogador";

// Etapas
export * from "./etapa";

// Chaves e Partidas (Dupla Fixa)
export * from "./chave";

// Rei da Praia
export * from "./reiDaPraia";

// Cabeças de Chave
export * from "./cabecaDeChave";

// ============================================
// APPLICATION TYPES (Frontend-specific)
// ============================================

/**
 * User authentication
 */
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

/**
 * Arena context
 */
export interface ArenaContextType {
  arena: Arena | null;
  loading: boolean;
  error: string | null;
  setArena: (arena: Arena) => void;
}

/**
 * API Response
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

/**
 * UI State
 */
export interface LoadingState {
  [key: string]: boolean;
}

export interface FormErrors {
  [key: string]: string;
}

/**
 * Route configuration
 */
export interface RouteConfig {
  path: string;
  element: React.ReactNode;
  protected?: boolean;
  adminOnly?: boolean;
}
