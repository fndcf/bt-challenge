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
export * from "./ConfigRepository";
export * from "./AdminRepository";
export * from "./CabecaDeChaveRepository";
export * from "./HistoricoDuplaRepository";

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
export { configRepository } from "./ConfigRepository";
export { adminRepository } from "./AdminRepository";
export { cabecaDeChaveRepository } from "./CabecaDeChaveRepository";
export { historicoDuplaRepository } from "./HistoricoDuplaRepository";
