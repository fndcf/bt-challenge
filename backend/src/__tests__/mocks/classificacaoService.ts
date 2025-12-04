const mockClassificacaoService = {
  recalcularClassificacaoGrupo: jest.fn().mockResolvedValue(undefined),
  calcularClassificacao: jest.fn().mockResolvedValue([]),
};

export default mockClassificacaoService;
