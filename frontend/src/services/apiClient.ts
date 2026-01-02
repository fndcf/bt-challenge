import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";
import { ApiResponse } from "../types";
import logger from "../utils/logger";
import { refreshTokenManually } from "../hooks/useTokenRefresh";

// Flag para evitar múltiplas tentativas de refresh simultâneas
let isRefreshing = false;
// Fila de requisições aguardando o refresh do token
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}> = [];

/**
 * Processa a fila de requisições após o refresh do token
 */
const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

/**
 * Cliente HTTP configurado para a API
 * Com suporte a refresh automático de token e retry de requisições
 */
class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
      timeout: 60000, // 60 segundos
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.setupInterceptors();
  }

  /**
   * Configurar interceptors
   */
  private setupInterceptors() {
    // Request interceptor - adicionar token de autenticação
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("authToken");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - tratar respostas e erros com retry automático
    this.client.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        return response;
      },
      async (error: AxiosError<ApiResponse>) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean;
        };

        // Se não for erro 401 ou já tentou retry, trata normalmente
        if (error.response?.status !== 401 || originalRequest._retry) {
          return this.handleError(error);
        }

        // Marcar que já estamos tentando retry
        originalRequest._retry = true;

        // Se já está fazendo refresh, aguardar na fila
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({
              resolve: (token: string) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                resolve(this.client(originalRequest));
              },
              reject: (err: Error) => {
                reject(err);
              },
            });
          });
        }

        isRefreshing = true;

        try {
          logger.info("Token expired, attempting refresh...");

          const newToken = await refreshTokenManually();

          if (newToken) {
            logger.info("Token refreshed, retrying original request");

            // Atualizar header da requisição original
            originalRequest.headers.Authorization = `Bearer ${newToken}`;

            // Processar fila de requisições pendentes
            processQueue(null, newToken);

            // Retry da requisição original
            return this.client(originalRequest);
          } else {
            // Não conseguiu renovar o token - usuário precisa fazer login
            logger.warn("Could not refresh token, redirecting to login");
            processQueue(new Error("Failed to refresh token"));
            this.redirectToLogin();
            return Promise.reject(new Error("Sessão expirada"));
          }
        } catch (refreshError: any) {
          logger.error("Token refresh failed", {
            error: refreshError.message,
          });

          processQueue(refreshError);
          this.redirectToLogin();
          return Promise.reject(new Error("Sessão expirada"));
        } finally {
          isRefreshing = false;
        }
      }
    );
  }

  /**
   * Redireciona para a página de login
   */
  private redirectToLogin() {
    localStorage.removeItem("authToken");
    // Evitar redirecionamento se já estiver na página de login
    if (!window.location.pathname.includes("/login")) {
      window.location.href = "/login";
    }
  }

  /**
   * Tratar erros da API (para erros que não são 401)
   */
  private handleError(error: AxiosError<ApiResponse>): Promise<never> {
    if (error.response) {
      // Erro com resposta do servidor
      const { status, data } = error.response;

      // Token expirado e retry falhou - fazer logout
      if (status === 401) {
        logger.warn("Unauthorized access after retry - redirecting to login", {
          url: error.config?.url,
          method: error.config?.method?.toUpperCase(),
        });

        this.redirectToLogin();
        return Promise.reject(new Error("Sessão expirada"));
      }

      // Retornar mensagem de erro da API
      const errorMessage = data?.error || "Erro na requisição";
      return Promise.reject(new Error(errorMessage));
    } else if (error.request) {
      logger.error("Network error - no response from server", {
        url: error.config?.url,
        method: error.config?.method?.toUpperCase(),
        message: error.message,
      });

      return Promise.reject(
        new Error("Erro de conexão. Verifique sua internet")
      );
    } else {
      // Erro ao configurar requisição (raro)
      return Promise.reject(new Error("Erro ao processar requisição"));
    }
  }

  /**
   * GET request
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<ApiResponse<T>>(url, config);
    return response.data.data as T;
  }

  /**
   * POST request
   */
  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.post<ApiResponse<T>>(url, data, config);
    return response.data.data as T;
  }

  /**
   * PUT request
   */
  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.put<ApiResponse<T>>(url, data, config);
    return response.data.data as T;
  }

  /**
   * PATCH request
   */
  async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.patch<ApiResponse<T>>(url, data, config);
    return response.data.data as T;
  }

  /**
   * DELETE request
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<ApiResponse<T>>(url, config);
    return response.data.data as T;
  }

  /**
   * Upload de arquivo
   */
  async upload<T = any>(
    url: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<T> {
    const formData = new FormData();
    formData.append("file", file);

    const config: AxiosRequestConfig = {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(progress);
        }
      },
    };

    const response = await this.client.post<ApiResponse<T>>(
      url,
      formData,
      config
    );
    return response.data.data as T;
  }
}

// Exportar instância única
export const apiClient = new ApiClient();
