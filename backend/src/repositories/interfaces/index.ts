/**
 * index.ts
 * Exporta todas as interfaces de repository
 */

// Base
export * from "./IBaseRepository";

// Entidades principais
export * from "./IEtapaRepository";
export * from "./IJogadorRepository";
export * from "./IDuplaRepository";
export * from "./IGrupoRepository";
export * from "./IPartidaRepository";
export * from "./IInscricaoRepository";
export * from "./IConfrontoEliminatorioRepository";

// Novos repositories (Fase 5)
export * from "./IEstatisticasJogadorRepository";
export * from "./IPartidaReiDaPraiaRepository";
export * from "./ICabecaDeChaveRepository";
export * from "./IConfigRepository";
