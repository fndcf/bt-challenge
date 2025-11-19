/**
 * Error Handler
 * Tratamento centralizado de erros da aplicação
 */

import { AxiosError } from 'axios';

export interface AppError {
  message: string;
  code?: string;
  status?: number;
  field?: string;
  details?: any;
}

/**
 * Classe de erro customizada
 */
export class ApplicationError extends Error {
  public code?: string;
  public status?: number;
  public field?: string;
  public details?: any;

  constructor(error: AppError) {
    super(error.message);
    this.name = 'ApplicationError';
    this.code = error.code;
    this.status = error.status;
    this.field = error.field;
    this.details = error.details;
  }
}

/**
 * Tradução de mensagens de erro
 */
const errorMessages: Record<string, string> = {
  // Erros de autenticação
  'auth/user-not-found': 'Usuário não encontrado',
  'auth/wrong-password': 'Senha incorreta',
  'auth/email-already-in-use': 'Email já está em uso',
  'auth/weak-password': 'Senha muito fraca. Use no mínimo 6 caracteres',
  'auth/invalid-email': 'Email inválido',
  'auth/user-disabled': 'Usuário desabilitado',
  'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde',
  'auth/network-request-failed': 'Erro de conexão. Verifique sua internet',
  'auth/invalid-credential': 'Email ou senha incorretos',
  'auth/requires-recent-login': 'Por segurança, faça login novamente',

  // Erros de validação
  'validation/required-field': 'Campo obrigatório',
  'validation/invalid-email': 'Email inválido',
  'validation/invalid-phone': 'Telefone inválido',
  'validation/invalid-date': 'Data inválida',
  'validation/min-length': 'Mínimo de caracteres não atingido',
  'validation/max-length': 'Máximo de caracteres excedido',

  // Erros de negócio
  'business/inscricoes-encerradas': 'Inscrições encerradas',
  'business/vagas-esgotadas': 'Vagas esgotadas',
  'business/jogador-ja-inscrito': 'Jogador já está inscrito',
  'business/chaves-ja-geradas': 'Chaves já foram geradas',
  'business/etapa-nao-encontrada': 'Etapa não encontrada',
  'business/jogador-nao-encontrado': 'Jogador não encontrado',

  // Erros HTTP genéricos
  400: 'Requisição inválida',
  401: 'Não autorizado. Faça login novamente',
  403: 'Acesso negado',
  404: 'Recurso não encontrado',
  409: 'Conflito de dados',
  422: 'Dados inválidos',
  429: 'Muitas requisições. Aguarde um momento',
  500: 'Erro interno do servidor',
  502: 'Servidor indisponível',
  503: 'Serviço temporariamente indisponível',
};

/**
 * Extrai mensagem de erro amigável
 */
export const getErrorMessage = (error: any): string => {
  // Erro customizado
  if (error instanceof ApplicationError) {
    return error.message;
  }

  // Erro do Firebase
  if (error?.code && errorMessages[error.code]) {
    return errorMessages[error.code];
  }

  // Erro do Axios
  if (error?.isAxiosError) {
    const axiosError = error as AxiosError<any>;
    
    // Mensagem do backend
    if (axiosError.response?.data?.error) {
      return axiosError.response.data.error;
    }

    // Status HTTP
    if (axiosError.response?.status) {
      return errorMessages[axiosError.response.status] || 'Erro na requisição';
    }

    // Erro de rede
    if (axiosError.message === 'Network Error') {
      return 'Erro de conexão. Verifique sua internet';
    }
  }

  // Erro genérico
  if (error?.message) {
    return error.message;
  }

  return 'Erro desconhecido. Tente novamente';
};

/**
 * Log de erro (pode ser enviado para serviço de monitoramento)
 */
export const logError = (error: any, context?: string) => {
  const errorInfo = {
    message: getErrorMessage(error),
    context,
    timestamp: new Date().toISOString(),
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : error,
  };

  console.error('🚨 Error:', errorInfo);

  // TODO: Enviar para serviço de monitoramento (Sentry, LogRocket, etc)
  // if (import.meta.env.PROD) {
  //   Sentry.captureException(error, { contexts: { custom: errorInfo } });
  // }
};

/**
 * Trata erro e retorna mensagem formatada
 */
export const handleError = (error: any, context?: string): AppError => {
  logError(error, context);

  let appError: AppError = {
    message: getErrorMessage(error),
  };

  // Adicionar informações extras se disponível
  if (error instanceof ApplicationError) {
    appError = {
      message: error.message,
      code: error.code,
      status: error.status,
      field: error.field,
      details: error.details,
    };
  } else if (error?.isAxiosError) {
    const axiosError = error as AxiosError<any>;
    appError = {
      message: getErrorMessage(error),
      status: axiosError.response?.status,
      code: axiosError.response?.data?.code,
      details: axiosError.response?.data,
    };
  }

  return appError;
};

/**
 * Verifica se é erro de autenticação
 */
export const isAuthError = (error: any): boolean => {
  if (error?.code?.startsWith('auth/')) return true;
  if (error?.status === 401) return true;
  if (error?.isAxiosError && error?.response?.status === 401) return true;
  return false;
};

/**
 * Verifica se é erro de validação
 */
export const isValidationError = (error: any): boolean => {
  if (error?.code?.startsWith('validation/')) return true;
  if (error?.status === 422) return true;
  return false;
};

/**
 * Verifica se é erro de rede
 */
export const isNetworkError = (error: any): boolean => {
  if (error?.message === 'Network Error') return true;
  if (error?.code === 'ECONNABORTED') return true;
  return false;
};
