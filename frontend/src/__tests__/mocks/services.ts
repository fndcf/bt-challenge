/**
 * Mocks dos Services
 */

// Mock do jogadorService
export const mockJogadorService = {
  listar: jest.fn(),
  buscarPorId: jest.fn(),
  criar: jest.fn(),
  atualizar: jest.fn(),
  excluir: jest.fn(),
};

// Mock do etapaService
export const mockEtapaService = {
  listar: jest.fn(),
  buscarPorId: jest.fn(),
  criar: jest.fn(),
  atualizar: jest.fn(),
  excluir: jest.fn(),
  listarInscricoes: jest.fn(),
  inscreverJogadores: jest.fn(),
  removerInscricao: jest.fn(),
  gerarChaves: jest.fn(),
};

// Mock do partidaService
export const mockPartidaService = {
  listar: jest.fn(),
  buscarPorId: jest.fn(),
  registrarResultado: jest.fn(),
};

// Mock do chaveService
export const mockChaveService = {
  buscarPorEtapa: jest.fn(),
  buscarGrupos: jest.fn(),
};

// Mock do arenaService
export const mockArenaService = {
  buscarPorSlug: jest.fn(),
  buscarPorId: jest.fn(),
};

/**
 * Resetar todos os mocks de services
 */
export const resetServiceMocks = () => {
  Object.values(mockJogadorService).forEach((fn) => fn.mockReset());
  Object.values(mockEtapaService).forEach((fn) => fn.mockReset());
  Object.values(mockPartidaService).forEach((fn) => fn.mockReset());
  Object.values(mockChaveService).forEach((fn) => fn.mockReset());
  Object.values(mockArenaService).forEach((fn) => fn.mockReset());
};
