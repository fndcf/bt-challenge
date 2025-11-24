/**
 * Form Validators - VERSÃO ATUALIZADA COM REI DA PRAIA
 * Sistema de validação de formulários
 */

export interface ValidationRule {
  validate: (value: any) => boolean;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Validadores básicos
 */
export const validators = {
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
   * Gênero válido (masculino ou feminino)
   */
  genero: (
    message: string = "Gênero inválido. Deve ser 'masculino' ou 'feminino'"
  ): ValidationRule => ({
    validate: (value: string) => {
      if (!value) return true;
      const generosValidos = ["masculino", "feminino"];
      return generosValidos.includes(value.toLowerCase());
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

  // ============== VALIDADORES REI DA PRAIA ==============

  /**
   * Múltiplo de 4 (para Rei da Praia)
   */
  multiploQuatro: (
    message: string = "Número de jogadores deve ser múltiplo de 4"
  ): ValidationRule => ({
    validate: (value: number) => {
      if (value === null || value === undefined) return true;
      return value % 4 === 0;
    },
    message,
  }),

  /**
   * Mínimo 8 jogadores (para Rei da Praia)
   */
  minimoReiDaPraia: (
    message: string = "Rei da Praia necessita de no mínimo 8 jogadores"
  ): ValidationRule => ({
    validate: (value: number) => {
      if (value === null || value === undefined) return true;
      return value >= 8;
    },
    message,
  }),

  /**
   * Número par (para duplas)
   */
  numeroPar: (
    message: string = "Número de jogadores deve ser par"
  ): ValidationRule => ({
    validate: (value: number) => {
      if (value === null || value === undefined) return true;
      return value % 2 === 0;
    },
    message,
  }),

  /**
   * Validar formato de etapa (Rei da Praia ou Dupla Fixa)
   */
  formatoEtapa: (
    message: string = "Formato inválido. Deve ser 'rei_da_praia' ou 'dupla_fixa'"
  ): ValidationRule => ({
    validate: (value: string) => {
      if (!value) return true;
      const formatosValidos = ["rei_da_praia", "dupla_fixa"];
      return formatosValidos.includes(value.toLowerCase());
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

/**
 * Schema de validação
 */
export type ValidationSchema<T> = {
  [K in keyof T]?: ValidationRule[];
};

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

/**
 * Exemplos de schemas de validação
 */

// Schema para login
export const loginSchema: ValidationSchema<{
  email: string;
  password: string;
}> = {
  email: [validators.required("Email é obrigatório"), validators.email()],
  password: [
    validators.required("Senha é obrigatória"),
    validators.minLength(6),
  ],
};

// Schema para criar jogador
export const createJogadorSchema: ValidationSchema<any> = {
  nome: [
    validators.required("Nome é obrigatório"),
    validators.minLength(3, "Nome deve ter no mínimo 3 caracteres"),
    validators.maxLength(100, "Nome deve ter no máximo 100 caracteres"),
  ],
  email: [validators.email()],
  telefone: [validators.phone()],
  nivel: [validators.required("Nível é obrigatório")],
  genero: [validators.required("Gênero é obrigatório")],
};

// Schema para criar etapa DUPLA FIXA (formato tradicional)
export const createEtapaDuplaFixaSchema: ValidationSchema<any> = {
  nome: [
    validators.required("Nome é obrigatório"),
    validators.minLength(3),
    validators.maxLength(100),
  ],
  dataInicio: [
    validators.required("Data de início é obrigatória"),
    validators.date(),
  ],
  dataFim: [
    validators.required("Data de fim é obrigatória"),
    validators.date(),
  ],
  dataRealizacao: [
    validators.required("Data de realização é obrigatória"),
    validators.date(),
    validators.futureDate(),
  ],
  maxJogadores: [
    validators.required("Número máximo de jogadores é obrigatório"),
    validators.numeroPar(
      "Número de jogadores deve ser par para formato Dupla Fixa"
    ),
    validators.min(4, "Mínimo de 4 jogadores"),
    validators.max(100, "Máximo de 100 jogadores"),
  ],
  jogadoresPorGrupo: [
    validators.required("Jogadores por grupo é obrigatório"),
    validators.min(2, "Mínimo de 2 jogadores por grupo"),
    validators.max(6, "Máximo de 6 jogadores por grupo"),
  ],
  nivel: [validators.required("Nível da etapa é obrigatório")],
  genero: [validators.required("Gênero é obrigatório")],
  formato: [validators.formatoEtapa()],
};

// ============== NOVO: Schema para criar etapa REI DA PRAIA ==============
export const createEtapaReiDaPraiaSchema: ValidationSchema<any> = {
  nome: [
    validators.required("Nome é obrigatório"),
    validators.minLength(3, "Nome deve ter no mínimo 3 caracteres"),
    validators.maxLength(100, "Nome deve ter no máximo 100 caracteres"),
  ],
  dataInicio: [
    validators.required("Data de início é obrigatória"),
    validators.date(),
  ],
  dataFim: [
    validators.required("Data de fim é obrigatória"),
    validators.date(),
  ],
  dataRealizacao: [
    validators.required("Data de realização é obrigatória"),
    validators.date(),
    validators.futureDate(),
  ],
  maxJogadores: [
    validators.required("Número máximo de jogadores é obrigatório"),
    validators.minimoReiDaPraia(
      "Rei da Praia necessita de no mínimo 8 jogadores"
    ),
    validators.multiploQuatro(
      "Número de jogadores deve ser múltiplo de 4 para Rei da Praia"
    ),
    validators.max(100, "Máximo de 100 jogadores"),
  ],
  // REI DA PRAIA NÃO USA jogadoresPorGrupo - sempre 4 jogadores
  nivel: [validators.required("Nível da etapa é obrigatório")],
  genero: [validators.required("Gênero é obrigatório")],
  formato: [
    validators.required("Formato é obrigatório"),
    validators.formatoEtapa(),
  ],
};

/**
 * Helper: Validar etapa baseado no formato
 */
export const getEtapaSchema = (formato: string): ValidationSchema<any> => {
  if (formato === "rei_da_praia") {
    return createEtapaReiDaPraiaSchema;
  }
  return createEtapaDuplaFixaSchema;
};

/**
 * Validar número de jogadores vs inscritos (específico para Rei da Praia)
 */
export const validateReiDaPraiaInscritos = (
  totalInscritos: number,
  maxJogadores: number
): { isValid: boolean; message?: string } => {
  if (totalInscritos !== maxJogadores) {
    return {
      isValid: false,
      message: `Esta etapa está configurada para ${maxJogadores} jogadores, mas possui apenas ${totalInscritos} inscrito(s). Para gerar chaves com menos jogadores, primeiro edite a etapa e ajuste o número máximo de jogadores para ${totalInscritos}.`,
    };
  }

  if (totalInscritos < 8) {
    return {
      isValid: false,
      message: "Necessário no mínimo 8 jogadores inscritos",
    };
  }

  if (totalInscritos % 4 !== 0) {
    return {
      isValid: false,
      message: "Número de jogadores deve ser múltiplo de 4",
    };
  }

  return { isValid: true };
};
