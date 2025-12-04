/**
 * Exporta todas as implementações Firebase de repositories
 */

// Repositories principais
export * from "./EtapaRepository";
export * from "./JogadorRepository";
export * from "./DuplaRepository";
export * from "./GrupoRepository";
export * from "./PartidaRepository";
export * from "./InscricaoRepository";
export * from "./ConfrontoEliminatorioRepository";

// Novos repositories (Fase 5)
export * from "./EstatisticasJogadorRepository";
export * from "./PartidaReiDaPraiaRepository";
export * from "./CabecaDeChaveRepository";
export * from "./ConfigRepository";

// Instâncias prontas para uso
export { etapaRepository } from "./EtapaRepository";
export { jogadorRepository } from "./JogadorRepository";
export { duplaRepository } from "./DuplaRepository";
export { grupoRepository } from "./GrupoRepository";
export { partidaRepository } from "./PartidaRepository";
export { inscricaoRepository } from "./InscricaoRepository";
export { confrontoEliminatorioRepository } from "./ConfrontoEliminatorioRepository";
export { estatisticasJogadorRepository } from "./EstatisticasJogadorRepository";
export { partidaReiDaPraiaRepository } from "./PartidaReiDaPraiaRepository";
export { cabecaDeChaveRepository } from "./CabecaDeChaveRepository";
export { configRepository } from "./ConfigRepository";
