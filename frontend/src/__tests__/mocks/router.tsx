/**
 * Mock do React Router
 */

import React from "react";
import { BrowserRouter } from "react-router-dom";

export const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  useParams: () => ({}),
  useLocation: () => ({
    pathname: "/",
    search: "",
    hash: "",
    state: null,
  }),
}));

/**
 * Wrapper para testes que precisam de Router
 */
export const RouterWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <BrowserRouter>{children}</BrowserRouter>;
};

/**
 * Limpar mocks entre testes
 */
export const resetRouterMocks = () => {
  mockNavigate.mockReset();
};
