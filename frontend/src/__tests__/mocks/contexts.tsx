/**
 * Mocks dos Contexts
 */

import React from "react";

// Mock do AuthContext
export const mockAuthContext = {
  user: null,
  admin: null,
  loading: false,
  login: jest.fn(),
  logout: jest.fn(),
  isAuthenticated: false,
};

export const mockAuthenticatedContext = {
  user: {
    uid: "test-user-id",
    email: "test@example.com",
  },
  admin: {
    uid: "test-user-id",
    email: "test@example.com",
    arenaId: "test-arena-id",
    role: "admin",
  },
  loading: false,
  login: jest.fn(),
  logout: jest.fn(),
  isAuthenticated: true,
};

// Mock do ArenaContext
export const mockArenaContext = {
  arena: null,
  loading: false,
  error: null,
  setArena: jest.fn(),
};

export const mockArenaWithDataContext = {
  arena: {
    id: "test-arena-id",
    nome: "Arena Teste",
    slug: "arena-teste",
    endereco: "Rua Teste, 123",
    cidade: "São Paulo",
    estado: "SP",
  },
  loading: false,
  error: null,
  setArena: jest.fn(),
};

/**
 * Provider wrapper para testes
 */
export const createTestProviders = (
  authValue = mockAuthContext,
  arenaValue = mockArenaContext
) => {
  const TestProviders: React.FC<{ children: React.ReactNode }> = ({
    children,
  }) => {
    return <>{children}</>;
  };

  return TestProviders;
};
