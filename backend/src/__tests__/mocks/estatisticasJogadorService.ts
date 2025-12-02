/**
 * Mock do EstatisticasJogadorService para testes
 */

const mockEstatisticasJogadorService = {
  atualizarAposPartida: jest.fn().mockResolvedValue(undefined),
  reverterAposPartida: jest.fn().mockResolvedValue(undefined),
  buscarPorJogadorEEtapa: jest.fn().mockResolvedValue(null),
  criar: jest.fn().mockResolvedValue({}),
  atualizar: jest.fn().mockResolvedValue({}),
};

export default mockEstatisticasJogadorService;
