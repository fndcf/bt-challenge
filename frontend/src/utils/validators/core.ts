/**
 * core.ts
 *
 * Validadores básicos e genéricos
 *
 * SOLID aplicado:
 * - SRP: Validadores básicos reutilizáveis
 * - OCP: Aberto para extensão (pode criar novos validadores)
 * - DIP: Depende de abstrações (ValidationRule)
 */

import { ValidationRule } from "./types";

/**
 * Validadores básicos de formulário
 */
export const coreValidators = {
  /**
   * Campo obrigatório
   */
  required: (message: string = "Campo obrigatório"): ValidationRule => ({
    validate: (value: any) => {
      if (typeof value === "string") return value.trim().length > 0;
      if (Array.isArray(value)) return value.length > 0;
      return value !== null && value !== undefined;
    },
    message,
  }),

  /**
   * Email válido
   */
  email: (message: string = "Email inválido"): ValidationRule => ({
    validate: (value: string) => {
      if (!value) return true;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    },
    message,
  }),

  /**
   * Telefone válido (Brasil)
   */
  phone: (message: string = "Telefone inválido"): ValidationRule => ({
    validate: (value: string) => {
      if (!value) return true;
      const phoneRegex = /^\(?[1-9]{2}\)?\s?9?\d{4}-?\d{4}$/;
      return phoneRegex.test(value.replace(/\s/g, ""));
    },
    message,
  }),

  /**
   * Tamanho mínimo
   */
  minLength: (min: number, message?: string): ValidationRule => ({
    validate: (value: string) => {
      if (!value) return true;
      return value.length >= min;
    },
    message: message || `Mínimo de ${min} caracteres`,
  }),

  /**
   * Tamanho máximo
   */
  maxLength: (max: number, message?: string): ValidationRule => ({
    validate: (value: string) => {
      if (!value) return true;
      return value.length <= max;
    },
    message: message || `Máximo de ${max} caracteres`,
  }),

  /**
   * Valor mínimo (numérico)
   */
  min: (min: number, message?: string): ValidationRule => ({
    validate: (value: number) => {
      if (value === null || value === undefined) return true;
      return value >= min;
    },
    message: message || `Valor mínimo: ${min}`,
  }),

  /**
   * Valor máximo (numérico)
   */
  max: (max: number, message?: string): ValidationRule => ({
    validate: (value: number) => {
      if (value === null || value === undefined) return true;
      return value <= max;
    },
    message: message || `Valor máximo: ${max}`,
  }),

  /**
   * Padrão regex customizado
   */
  pattern: (regex: RegExp, message: string): ValidationRule => ({
    validate: (value: string) => {
      if (!value) return true;
      return regex.test(value);
    },
    message,
  }),

  /**
   * Data válida
   */
  date: (message: string = "Data inválida"): ValidationRule => ({
    validate: (value: string) => {
      if (!value) return true;
      const date = new Date(value);
      return date instanceof Date && !isNaN(date.getTime());
    },
    message,
  }),

  /**
   * Data futura
   */
  futureDate: (message: string = "Data deve ser futura"): ValidationRule => ({
    validate: (value: string) => {
      if (!value) return true;
      const date = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date >= today;
    },
    message,
  }),

  /**
   * Data passada
   */
  pastDate: (message: string = "Data deve ser passada"): ValidationRule => ({
    validate: (value: string) => {
      if (!value) return true;
      const date = new Date(value);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      return date <= today;
    },
    message,
  }),

  /**
   * Senha forte
   */
  strongPassword: (
    message: string = "Senha deve ter no mínimo 8 caracteres, incluindo maiúscula, minúscula e número"
  ): ValidationRule => ({
    validate: (value: string) => {
      if (!value) return true;
      const hasMinLength = value.length >= 8;
      const hasUpperCase = /[A-Z]/.test(value);
      const hasLowerCase = /[a-z]/.test(value);
      const hasNumber = /[0-9]/.test(value);
      return hasMinLength && hasUpperCase && hasLowerCase && hasNumber;
    },
    message,
  }),

  /**
   * Confirmação de senha
   */
  passwordMatch: (
    passwordField: string,
    message: string = "Senhas não conferem"
  ): ValidationRule => ({
    validate: (value: string, formData: any) => {
      if (!value) return true;
      return value === formData[passwordField];
    },
    message,
  }),

  /**
   * URL válida
   */
  url: (message: string = "URL inválida"): ValidationRule => ({
    validate: (value: string) => {
      if (!value) return true;
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    message,
  }),

  /**
   * Validador customizado
   */
  custom: (
    validateFn: (value: any, formData?: any) => boolean,
    message: string
  ): ValidationRule => ({
    validate: validateFn,
    message,
  }),
};
