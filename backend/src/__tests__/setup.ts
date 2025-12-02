/**
 * setup.ts
 * Configuração global dos testes Jest
 */

// Timeout maior para testes assíncronos
jest.setTimeout(10000);

// Limpa todos os mocks após cada teste
afterEach(() => {
  jest.clearAllMocks();
});

// Limpa todos os mocks após todos os testes
afterAll(() => {
  jest.restoreAllMocks();
});
