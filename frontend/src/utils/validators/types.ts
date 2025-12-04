/**
 * types.ts
 *
 * Tipos e interfaces para sistema de validação
 *
 * SOLID aplicado:
 * - SRP: Arquivo focado apenas em definir tipos
 * - ISP: Interfaces segregadas por responsabilidade
 */

export interface ValidationRule {
  validate: (value: any, formData?: any) => boolean;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export type ValidationSchema<T> = {
  [K in keyof T]?: ValidationRule[];
};
