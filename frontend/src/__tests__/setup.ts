/**
 * Jest Setup File
 * Configurações globais para os testes
 */

import "@testing-library/jest-dom";

// Mock do matchMedia (necessário para styled-components)
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock do ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock do scrollTo
Object.defineProperty(window, "scrollTo", {
  writable: true,
  value: jest.fn(),
});

// Silenciar console.error em testes (opcional)
// beforeAll(() => {
//   jest.spyOn(console, 'error').mockImplementation(() => {});
// });

// afterAll(() => {
//   jest.restoreAllMocks();
// });
