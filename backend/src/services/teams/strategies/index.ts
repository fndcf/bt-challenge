/**
 * Exportações centralizadas do módulo de estratégias de eliminatória
 */

// Interface e classe base
export {
  IEliminatoriaStrategy,
  BaseEliminatoriaStrategy,
  EliminatoriaContext,
  ConfrontoEliminatorioDTO,
} from "./IEliminatoriaStrategy";

// Factory
export {
  EliminatoriaStrategyFactory,
  eliminatoriaStrategyFactory,
} from "./EliminatoriaStrategyFactory";

// Estratégias individuais (para extensão ou testes)
export { Eliminatoria2GruposStrategy } from "./Eliminatoria2GruposStrategy";
export { Eliminatoria3GruposStrategy } from "./Eliminatoria3GruposStrategy";
export { Eliminatoria4GruposStrategy } from "./Eliminatoria4GruposStrategy";
export { Eliminatoria5GruposStrategy } from "./Eliminatoria5GruposStrategy";
export { Eliminatoria6GruposStrategy } from "./Eliminatoria6GruposStrategy";
export { Eliminatoria7GruposStrategy } from "./Eliminatoria7GruposStrategy";
export { Eliminatoria8GruposStrategy } from "./Eliminatoria8GruposStrategy";
