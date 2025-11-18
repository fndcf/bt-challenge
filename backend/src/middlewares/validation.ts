import { Request, Response, NextFunction } from "express";
import { validationResult, ValidationChain } from "express-validator";
import { ValidationError } from "../utils/errors";

/**
 * Middleware para processar resultados da validação
 */
export const validate = (req: Request, _res: Response, next: NextFunction) => {
  // ✅ CORRIGIDO: _res
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((error) => ({
      field: error.type === "field" ? error.path : "unknown",
      message: error.msg,
    }));

    throw new ValidationError("Erro de validação", formattedErrors);
  }

  next();
};

/**
 * Helper para executar validações em sequência
 */
export const runValidations = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Executar todas as validações
    for (const validation of validations) {
      await validation.run(req);
    }

    // Verificar se houve erros
    validate(req, res, next);
  };
};

/**
 * Validação customizada para verificar se é número par
 */
export const isEvenNumber = (value: any) => {
  const num = parseInt(value);
  if (isNaN(num)) {
    throw new Error("Deve ser um número");
  }
  if (num % 2 !== 0) {
    throw new Error("Deve ser um número par");
  }
  return true;
};

/**
 * Validação customizada para verificar se atende o mínimo de jogadores
 */
export const meetsMinimumPlayers = (value: any, _meta: any) => {
  // ✅ CORRIGIDO: { req } renomeado para _meta
  const num = parseInt(value);
  if (isNaN(num)) {
    throw new Error("Deve ser um número");
  }
  if (num < 12) {
    throw new Error("Mínimo de 12 jogadores necessários");
  }
  return true;
};

/**
 * Validação customizada para slug (URL amigável)
 */
export const isValidSlug = (value: string) => {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  if (!slugRegex.test(value)) {
    throw new Error(
      "Slug deve conter apenas letras minúsculas, números e hífens"
    );
  }
  return true;
};

/**
 * Validação customizada para verificar valores do enum
 */
export const isInEnum = (enumObj: any) => {
  return (value: any) => {
    const values = Object.values(enumObj);
    if (!values.includes(value)) {
      throw new Error(`Deve ser um dos valores: ${values.join(", ")}`);
    }
    return true;
  };
};

/**
 * Sanitização de dados
 */
export const sanitizeData = (data: any): any => {
  if (typeof data === "string") {
    return data.trim();
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeData);
  }

  if (typeof data === "object" && data !== null) {
    const sanitized: any = {};
    for (const key in data) {
      sanitized[key] = sanitizeData(data[key]);
    }
    return sanitized;
  }

  return data;
};

/**
 * Middleware para sanitizar body, query e params
 */
export const sanitizeRequest = (
  req: Request,
  _res: Response, // ✅ CORRIGIDO: _res (não usado mas necessário na assinatura)
  next: NextFunction
) => {
  if (req.body) {
    req.body = sanitizeData(req.body);
  }
  if (req.query) {
    req.query = sanitizeData(req.query);
  }
  if (req.params) {
    req.params = sanitizeData(req.params);
  }
  next();
};
