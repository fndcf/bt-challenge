/**
 * Mock do logger para testes
 */

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  critical: jest.fn(),
};

export default mockLogger;
export const logger = mockLogger;
