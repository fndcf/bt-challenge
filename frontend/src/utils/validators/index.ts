/**
 * validators/index.ts
 *
 * Exportações centralizadas do sistema de validação
 *
 * Estrutura organizada com SOLID:
 * ├── types.ts          - Interfaces e tipos
 * ├── core.ts           - Validadores básicos
 * ├── business.ts       - Validadores de negócio
 * ├── schemas.ts        - Schemas pré-definidos
 * └── utils.ts          - Funções utilitárias
 */

// Types
export type { ValidationRule, ValidationResult, ValidationSchema } from "./types";

// Validadores básicos
export { coreValidators } from "./core";

// Validadores de negócio
export { businessValidators, validateReiDaPraiaInscritos } from "./business";

// Validadores combinados (para backward compatibility)
import { coreValidators } from "./core";
import { businessValidators } from "./business";

export const validators = {
  ...coreValidators,
  ...businessValidators,
};

// Schemas
export {
  loginSchema,
  createJogadorSchema,
  createEtapaDuplaFixaSchema,
  createEtapaReiDaPraiaSchema,
  getEtapaSchema,
} from "./schemas";

// Funções utilitárias
export { validateForm, validateField } from "./utils";
