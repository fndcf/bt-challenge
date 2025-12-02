/**
 * IConfigRepository.ts
 * Interface do repository de Config (configurações globais)
 */

/**
 * Estrutura de pontuação por colocação
 */
export interface PontuacaoColocacao {
  campeao: number;
  vice: number;
  semifinalista: number;
  quartas: number;
  oitavas: number;
  participacao: number;
}

/**
 * Estrutura de configuração global
 */
export interface ConfigGlobal {
  pontuacaoColocacao: PontuacaoColocacao;
  maxJogadoresPorEtapa?: number;
  maxEtapasPorArena?: number;
  tempoLimitePartida?: number; // em minutos
  // Outras configurações globais
  [key: string]: any;
}

/**
 * Interface do repository de Config
 */
export interface IConfigRepository {
  /**
   * Buscar configuração global
   */
  buscarConfigGlobal(): Promise<ConfigGlobal>;

  /**
   * Buscar pontuação por colocação
   */
  buscarPontuacao(): Promise<PontuacaoColocacao>;

  /**
   * Buscar valor específico da configuração
   */
  buscarValor<T>(chave: string, valorPadrao: T): Promise<T>;

  /**
   * Atualizar configuração global
   */
  atualizarConfig(dados: Partial<ConfigGlobal>): Promise<void>;

  /**
   * Atualizar pontuação
   */
  atualizarPontuacao(pontuacao: Partial<PontuacaoColocacao>): Promise<void>;

  /**
   * Definir valor específico
   */
  definirValor<T>(chave: string, valor: T): Promise<void>;
}
