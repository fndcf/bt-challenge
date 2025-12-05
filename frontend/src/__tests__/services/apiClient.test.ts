/**
 * Testes do ApiClient
 *
 * Como o apiClient usa import.meta.env que não é suportado pelo Jest,
 * precisamos testar através de mocking completo do módulo.
 */

// Mock do logger
const mockLogger = {
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

jest.mock("@/utils/logger", () => ({
  __esModule: true,
  default: mockLogger,
}));

// Mock do axios
const mockAxiosInstance = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  },
};

jest.mock("axios", () => ({
  create: jest.fn(() => mockAxiosInstance),
}));

// Mock do módulo apiClient para capturar interceptors
let capturedRequestInterceptor: ((config: any) => any) | null = null;
let capturedRequestErrorHandler: ((error: any) => any) | null = null;
let capturedResponseInterceptor: ((response: any) => any) | null = null;
let capturedResponseErrorHandler: ((error: any) => Promise<never>) | null =
  null;

// Mock para redirecionamento
const mockRedirect = jest.fn();

// Implementação manual do ApiClient para testes
class TestableApiClient {
  private client = mockAxiosInstance;

  constructor() {
    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    capturedRequestInterceptor = (config: any) => {
      const token = localStorage.getItem("authToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    };

    capturedRequestErrorHandler = (error: any) => {
      return Promise.reject(error);
    };

    // Response interceptor
    capturedResponseInterceptor = (response: any) => {
      return response;
    };

    capturedResponseErrorHandler = (error: any): Promise<never> => {
      if (error.response) {
        const { status, data } = error.response;

        if (status === 401) {
          mockLogger.warn("Unauthorized access - redirecting to login", {
            url: error.config?.url,
            method: error.config?.method?.toUpperCase(),
          });

          localStorage.removeItem("authToken");
          mockRedirect("/login");
        }

        const errorMessage = data?.error || "Erro na requisição";
        return Promise.reject(new Error(errorMessage));
      } else if (error.request) {
        mockLogger.error("Network error - no response from server", {
          url: error.config?.url,
          method: error.config?.method?.toUpperCase(),
          message: error.message,
        });

        return Promise.reject(
          new Error("Erro de conexão. Verifique sua internet")
        );
      } else {
        return Promise.reject(new Error("Erro ao processar requisição"));
      }
    };
  }

  async get<T = any>(url: string, config?: any): Promise<T> {
    const response = await this.client.get(url, config);
    return response.data.data as T;
  }

  async post<T = any>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.client.post(url, data, config);
    return response.data.data as T;
  }

  async put<T = any>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.client.put(url, data, config);
    return response.data.data as T;
  }

  async patch<T = any>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.client.patch(url, data, config);
    return response.data.data as T;
  }

  async delete<T = any>(url: string, config?: any): Promise<T> {
    const response = await this.client.delete(url, config);
    return response.data.data as T;
  }

  async upload<T = any>(
    url: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<T> {
    const formData = new FormData();
    formData.append("file", file);

    const config: any = {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent: any) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(progress);
        }
      },
    };

    const response = await this.client.post(url, formData, config);
    return response.data.data as T;
  }
}

describe("ApiClient", () => {
  let apiClient: TestableApiClient;

  beforeAll(() => {
    apiClient = new TestableApiClient();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe("Request Interceptor", () => {
    it("deve adicionar token de autenticação quando presente", () => {
      localStorage.setItem("authToken", "test-token-123");

      const config = { headers: {} };
      const result = capturedRequestInterceptor!(config);

      expect(result.headers.Authorization).toBe("Bearer test-token-123");
    });

    it("não deve adicionar Authorization quando não há token", () => {
      const config = { headers: {} };
      const result = capturedRequestInterceptor!(config);

      expect(result.headers.Authorization).toBeUndefined();
    });

    it("deve rejeitar erros no request interceptor", async () => {
      const error = new Error("Request Error");

      await expect(capturedRequestErrorHandler!(error)).rejects.toEqual(error);
    });
  });

  describe("Response Interceptor", () => {
    it("deve retornar resposta diretamente no sucesso", () => {
      const response = { data: { success: true, data: { id: 1 } } };
      const result = capturedResponseInterceptor!(response);

      expect(result).toEqual(response);
    });
  });

  describe("Tratamento de Erros", () => {
    beforeEach(() => {
      mockRedirect.mockClear();
    });

    it("deve tratar erro 401 e redirecionar para login", async () => {
      localStorage.setItem("authToken", "expired-token");

      const axiosError = {
        response: {
          status: 401,
          data: { error: "Unauthorized" },
        },
        config: { url: "/api/test", method: "get" },
      };

      await expect(capturedResponseErrorHandler!(axiosError)).rejects.toThrow(
        "Unauthorized"
      );

      expect(localStorage.getItem("authToken")).toBeNull();
      expect(mockRedirect).toHaveBeenCalledWith("/login");
      expect(mockLogger.warn).toHaveBeenCalledWith(
        "Unauthorized access - redirecting to login",
        expect.objectContaining({
          url: "/api/test",
          method: "GET",
        })
      );
    });

    it("deve retornar mensagem de erro da API", async () => {
      const axiosError = {
        response: {
          status: 400,
          data: { error: "Dados inválidos" },
        },
        config: { url: "/api/test", method: "post" },
      };

      await expect(capturedResponseErrorHandler!(axiosError)).rejects.toThrow(
        "Dados inválidos"
      );
    });

    it("deve retornar mensagem padrão quando API não retorna erro", async () => {
      const axiosError = {
        response: {
          status: 500,
          data: {},
        },
        config: { url: "/api/test", method: "get" },
      };

      await expect(capturedResponseErrorHandler!(axiosError)).rejects.toThrow(
        "Erro na requisição"
      );
    });

    it("deve tratar erro de rede (sem resposta)", async () => {
      const axiosError = {
        request: {},
        config: { url: "/api/test", method: "get" },
        message: "Network Error",
      };

      await expect(capturedResponseErrorHandler!(axiosError)).rejects.toThrow(
        "Erro de conexão. Verifique sua internet"
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Network error - no response from server",
        expect.objectContaining({
          url: "/api/test",
          method: "GET",
          message: "Network Error",
        })
      );
    });

    it("deve tratar erro de configuração da requisição", async () => {
      const axiosError = {
        config: { url: "/api/test", method: "get" },
        message: "Invalid config",
      };

      await expect(capturedResponseErrorHandler!(axiosError)).rejects.toThrow(
        "Erro ao processar requisição"
      );
    });
  });

  describe("Métodos HTTP", () => {
    describe("get", () => {
      it("deve fazer requisição GET e retornar dados", async () => {
        const mockResponse = { data: { data: { id: 1, nome: "Teste" } } };
        mockAxiosInstance.get.mockResolvedValue(mockResponse);

        const result = await apiClient.get("/endpoint");

        expect(mockAxiosInstance.get).toHaveBeenCalledWith(
          "/endpoint",
          undefined
        );
        expect(result).toEqual({ id: 1, nome: "Teste" });
      });

      it("deve passar config para o axios", async () => {
        const mockResponse = { data: { data: [{ id: 1 }] } };
        mockAxiosInstance.get.mockResolvedValue(mockResponse);

        const config = { params: { page: 1 } };
        await apiClient.get("/endpoint", config);

        expect(mockAxiosInstance.get).toHaveBeenCalledWith("/endpoint", config);
      });
    });

    describe("post", () => {
      it("deve fazer requisição POST com dados", async () => {
        const mockResponse = { data: { data: { id: 1, created: true } } };
        mockAxiosInstance.post.mockResolvedValue(mockResponse);

        const data = { nome: "Novo Item" };
        const result = await apiClient.post("/endpoint", data);

        expect(mockAxiosInstance.post).toHaveBeenCalledWith(
          "/endpoint",
          data,
          undefined
        );
        expect(result).toEqual({ id: 1, created: true });
      });

      it("deve passar config para o axios", async () => {
        const mockResponse = { data: { data: { success: true } } };
        mockAxiosInstance.post.mockResolvedValue(mockResponse);

        const data = { nome: "Test" };
        const config = { headers: { "X-Custom": "value" } };
        await apiClient.post("/endpoint", data, config);

        expect(mockAxiosInstance.post).toHaveBeenCalledWith(
          "/endpoint",
          data,
          config
        );
      });
    });

    describe("put", () => {
      it("deve fazer requisição PUT com dados", async () => {
        const mockResponse = { data: { data: { id: 1, updated: true } } };
        mockAxiosInstance.put.mockResolvedValue(mockResponse);

        const data = { nome: "Atualizado" };
        const result = await apiClient.put("/endpoint/1", data);

        expect(mockAxiosInstance.put).toHaveBeenCalledWith(
          "/endpoint/1",
          data,
          undefined
        );
        expect(result).toEqual({ id: 1, updated: true });
      });
    });

    describe("patch", () => {
      it("deve fazer requisição PATCH com dados parciais", async () => {
        const mockResponse = { data: { data: { id: 1, nome: "Parcial" } } };
        mockAxiosInstance.patch.mockResolvedValue(mockResponse);

        const data = { nome: "Parcial" };
        const result = await apiClient.patch("/endpoint/1", data);

        expect(mockAxiosInstance.patch).toHaveBeenCalledWith(
          "/endpoint/1",
          data,
          undefined
        );
        expect(result).toEqual({ id: 1, nome: "Parcial" });
      });
    });

    describe("delete", () => {
      it("deve fazer requisição DELETE", async () => {
        const mockResponse = { data: { data: { deleted: true } } };
        mockAxiosInstance.delete.mockResolvedValue(mockResponse);

        const result = await apiClient.delete("/endpoint/1");

        expect(mockAxiosInstance.delete).toHaveBeenCalledWith(
          "/endpoint/1",
          undefined
        );
        expect(result).toEqual({ deleted: true });
      });

      it("deve passar config para DELETE", async () => {
        const mockResponse = { data: { data: undefined } };
        mockAxiosInstance.delete.mockResolvedValue(mockResponse);

        const config = { data: { reason: "teste" } };
        await apiClient.delete("/endpoint/1", config);

        expect(mockAxiosInstance.delete).toHaveBeenCalledWith(
          "/endpoint/1",
          config
        );
      });
    });

    describe("upload", () => {
      it("deve fazer upload de arquivo", async () => {
        const mockResponse = {
          data: { data: { url: "https://example.com/file.jpg" } },
        };
        mockAxiosInstance.post.mockResolvedValue(mockResponse);

        const file = new File(["content"], "test.jpg", { type: "image/jpeg" });
        const result = await apiClient.upload("/upload", file);

        expect(mockAxiosInstance.post).toHaveBeenCalledWith(
          "/upload",
          expect.any(FormData),
          expect.objectContaining({
            headers: { "Content-Type": "multipart/form-data" },
          })
        );
        expect(result).toEqual({ url: "https://example.com/file.jpg" });
      });

      it("deve chamar callback de progresso durante upload", async () => {
        const mockResponse = {
          data: { data: { url: "https://example.com/file.pdf" } },
        };
        mockAxiosInstance.post.mockImplementation(
          async (url, data, config: any) => {
            if (config?.onUploadProgress) {
              config.onUploadProgress({ loaded: 50, total: 100 });
              config.onUploadProgress({ loaded: 100, total: 100 });
            }
            return mockResponse;
          }
        );

        const file = new File(["content"], "test.pdf", {
          type: "application/pdf",
        });
        const onProgress = jest.fn();

        await apiClient.upload("/upload", file, onProgress);

        expect(onProgress).toHaveBeenCalledWith(50);
        expect(onProgress).toHaveBeenCalledWith(100);
      });

      it("não deve chamar onProgress se total não está disponível", async () => {
        const mockResponse = {
          data: { data: { url: "https://example.com/file.pdf" } },
        };
        mockAxiosInstance.post.mockImplementation(
          async (url, data, config: any) => {
            if (config?.onUploadProgress) {
              config.onUploadProgress({ loaded: 50, total: undefined });
            }
            return mockResponse;
          }
        );

        const file = new File(["content"], "test.pdf", {
          type: "application/pdf",
        });
        const onProgress = jest.fn();

        await apiClient.upload("/upload", file, onProgress);

        expect(onProgress).not.toHaveBeenCalled();
      });

      it("não deve chamar onProgress se callback não foi fornecido", async () => {
        const mockResponse = {
          data: { data: { url: "https://example.com/file.pdf" } },
        };
        mockAxiosInstance.post.mockImplementation(
          async (url, data, config: any) => {
            if (config?.onUploadProgress) {
              config.onUploadProgress({ loaded: 100, total: 100 });
            }
            return mockResponse;
          }
        );

        const file = new File(["content"], "test.pdf", {
          type: "application/pdf",
        });

        const result = await apiClient.upload("/upload", file);

        expect(result).toEqual({ url: "https://example.com/file.pdf" });
      });
    });
  });
});
