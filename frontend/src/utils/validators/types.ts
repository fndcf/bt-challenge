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
