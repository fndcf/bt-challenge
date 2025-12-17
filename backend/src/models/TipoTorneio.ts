/**
 * Tipos de torneio disponíveis
 */
export enum TipoTorneio {
  /**
   * Formato tradicional: duplas fixas durante toda a etapa
   * - Inscrição individual
   * - Duplas formadas no início e mantidas até o fim
   * - Pontuação por dupla
   */
  DUPLA_FIXA = "dupla_fixa",

  /**
   * Formato Rei/Rainha da Praia: duplas rotativas na fase de grupos
   * - Inscrição individual
   * - Fase de grupos: cada jogador joga com todos os parceiros possíveis
   * - Pontuação individual
   * - Fase eliminatória: duplas fixas formadas por ranking
   */
  REI_DA_PRAIA = "rei_da_praia",
}
