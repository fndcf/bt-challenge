import { ValidationRule, ValidationResult, ValidationSchema } from "./types";

/**
 * Validar formulário completo
 */
export const validateForm = <T extends Record<string, any>>(
  data: T,
  schema: ValidationSchema<T>
): ValidationResult => {
  const errors: Record<string, string> = {};

  Object.keys(schema).forEach((field) => {
    const rules = schema[field as keyof T];
    if (!rules) return;

    for (const rule of rules) {
      const isValid = rule.validate(data[field], data);
      if (!isValid) {
        errors[field] = rule.message;
        break;
      }
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validar campo único
 */
export const validateField = (
  value: any,
  rules: ValidationRule[],
  formData?: any
): string | null => {
  for (const rule of rules) {
    const isValid = rule.validate(value, formData);
    if (!isValid) {
      return rule.message;
    }
  }
  return null;
};
