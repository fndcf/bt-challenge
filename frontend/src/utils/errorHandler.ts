import { isAxiosError } from "axios";
import logger from "./logger";

export interface AppError {
  message: string;
  code?: string;
  status?: number;
  details?: unknown;
}

/** Corpo de erro que a API devolve */
interface RespostaDeErro {
  error?: string;
  code?: string;
}

/**
 * Tradução de mensagens de erro
 */
const errorMessages: Record<string, string> = {
  // ============================================
  // ERROS DE AUTENTICAÇÃO (Firebase Auth)
  // ============================================
  "auth/user-not-found": "Usuário não encontrado",
  "auth/wrong-password": "Senha incorreta",
  "auth/email-already-in-use": "Email já está em uso",
  "auth/weak-password": "Senha muito fraca. Use no mínimo 6 caracteres",
  "auth/invalid-email": "Email inválido",
  "auth/user-disabled": "Sua conta está aguardando ativação pelo administrador",
  "auth/too-many-requests": "Muitas tentativas. Tente novamente mais tarde",
  "auth/network-request-failed": "Erro de conexão. Verifique sua internet",
  "auth/invalid-credential": "Email ou senha incorretos",
  "auth/requires-recent-login": "Por segurança, faça login novamente",
  "auth/operation-not-allowed": "Operação não permitida",
  "auth/account-exists-with-different-credential":
    "Conta já existe com credencial diferente",
  "auth/popup-closed-by-user": "Login cancelado pelo usuário",
  "auth/expired-action-code": "Link expirado. Solicite novamente",
  "auth/invalid-action-code": "Link inválido ou já utilizado",

  // ============================================
  // ERROS HTTP
  // ============================================
  400: "Requisição inválida",
  401: "Não autorizado. Faça login novamente",
  403: "Acesso negado",
  404: "Recurso não encontrado",
  409: "Conflito de dados",
  422: "Dados inválidos",
  429: "Muitas requisições. Aguarde um momento",
  500: "Erro interno do servidor",
  502: "Servidor indisponível",
  503: "Serviço temporariamente indisponível",
};

const lerTexto = (erro: unknown, campo: "code" | "message") => {
  if (typeof erro !== "object" || erro === null) return undefined;
  const valor = (erro as Record<string, unknown>)[campo];
  return typeof valor === "string" ? valor : undefined;
};

/**
 * Extrai mensagem de erro amigável
 */
export const getErrorMessage = (error: unknown): string => {
  // Erro do Firebase (código específico)
  const traduzida = errorMessages[lerTexto(error, "code") ?? ""];
  if (traduzida) return traduzida;

  if (isAxiosError<RespostaDeErro>(error)) {
    // Mensagem do backend
    if (error.response?.data?.error) return error.response.data.error;

    // Status HTTP
    if (error.response?.status) {
      return errorMessages[error.response.status] || "Erro na requisição";
    }

    if (error.message === "Network Error") {
      return "Erro de conexão. Verifique sua internet";
    }
  }

  return lerTexto(error, "message") || "Erro desconhecido. Tente novamente";
};

/**
 * Log de erro
 */
export const logError = (error: unknown, context?: string) => {
  logger.error(
    getErrorMessage(error),
    {
      context,
      errorDetails:
        error instanceof Error
          ? { name: error.name, message: error.message }
          : error,
    },
    error instanceof Error ? error : undefined
  );
};

/**
 * Trata erro e retorna mensagem formatada
 */
export const handleError = (error: unknown, context?: string): AppError => {
  logError(error, context);

  const message = getErrorMessage(error);

  if (isAxiosError<RespostaDeErro>(error)) {
    return {
      message,
      status: error.response?.status,
      code: error.response?.data?.code,
      details: error.response?.data,
    };
  }

  return { message };
};
