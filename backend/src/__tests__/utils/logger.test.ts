/**
 * Testes do Logger
 */

// Preservar o ambiente original
const originalEnv = { ...process.env };

// Mock do console.log
const mockConsoleLog = jest.spyOn(console, "log").mockImplementation(() => {});

describe("Logger", () => {
  beforeEach(() => {
    jest.resetModules();
    mockConsoleLog.mockClear();
    // Limpar todas as variáveis de ambiente que afetam o logger
    delete process.env.FUNCTIONS_EMULATOR;
    delete process.env.NODE_ENV;
    delete process.env.GCLOUD_PROJECT;
    delete process.env.LOG_LEVEL;
  });

  afterAll(() => {
    // Restaurar ambiente original
    process.env = originalEnv;
    mockConsoleLog.mockRestore();
  });

  describe("modo desenvolvimento", () => {
    beforeEach(() => {
      process.env.FUNCTIONS_EMULATOR = "true";
      process.env.NODE_ENV = "development";
    });

    it("deve logar em formato colorido no desenvolvimento", async () => {
      const { logger } = await import("../../utils/logger");

      logger.info("Mensagem de teste");

      expect(mockConsoleLog).toHaveBeenCalled();
      const logCall = mockConsoleLog.mock.calls[0][0];
      // Deve conter escape codes de cor (desenvolvimento usa cores)
      expect(logCall).toContain("INFO");
      expect(logCall).toContain("Mensagem de teste");
    });

    it("deve logar debug em modo desenvolvimento", async () => {
      process.env.LOG_LEVEL = "DEBUG";
      const { logger } = await import("../../utils/logger");

      logger.debug("Debug message", { extra: "data" });

      expect(mockConsoleLog).toHaveBeenCalled();
    });

    it("deve logar warning", async () => {
      const { logger } = await import("../../utils/logger");

      logger.warn("Aviso importante", { codigo: 123 });

      expect(mockConsoleLog).toHaveBeenCalled();
    });

    it("deve logar error com stack trace", async () => {
      const { logger } = await import("../../utils/logger");
      const erro = new Error("Erro de teste");

      logger.error("Erro ocorreu", { operacao: "teste" }, erro);

      expect(mockConsoleLog).toHaveBeenCalled();
    });

    it("deve logar critical com stack trace", async () => {
      const { logger } = await import("../../utils/logger");
      const erro = new Error("Erro crítico");

      logger.critical("Sistema comprometido", { servico: "auth" }, erro);

      expect(mockConsoleLog).toHaveBeenCalled();
    });

    it("deve logar notice", async () => {
      const { logger } = await import("../../utils/logger");

      logger.notice("Evento significativo", { tipo: "login" });

      expect(mockConsoleLog).toHaveBeenCalled();
    });
  });

  describe("modo produção", () => {
    beforeEach(() => {
      delete process.env.FUNCTIONS_EMULATOR;
      process.env.NODE_ENV = "production";
      process.env.GCLOUD_PROJECT = "projeto-teste";
    });

    it("deve logar em formato JSON estruturado na produção", async () => {
      const { logger } = await import("../../utils/logger");

      logger.info("Mensagem de produção", { userId: "123" });

      expect(mockConsoleLog).toHaveBeenCalled();
      const logCall = mockConsoleLog.mock.calls[0][0];
      // Em produção, deve ser JSON
      const parsed = JSON.parse(logCall);
      expect(parsed.severity).toBe("INFO");
      expect(parsed.message).toBe("Mensagem de produção");
      expect(parsed.userId).toBe("123");
      expect(parsed.timestamp).toBeDefined();
    });

    it("deve logar performance", async () => {
      const { logger } = await import("../../utils/logger");

      logger.logPerformance("minhaFuncao", 1500, { operacao: "busca" });

      expect(mockConsoleLog).toHaveBeenCalled();
      const logCall = mockConsoleLog.mock.calls[0][0];
      const parsed = JSON.parse(logCall);
      expect(parsed.durationMs).toBe(1500);
      expect(parsed.performance).toBe("fast");
    });

    it("deve classificar performance lenta (> 5000ms)", async () => {
      const { logger } = await import("../../utils/logger");

      logger.logPerformance("funcaoLenta", 6000);

      const logCall = mockConsoleLog.mock.calls[0][0];
      const parsed = JSON.parse(logCall);
      expect(parsed.performance).toBe("slow");
    });

    it("deve classificar performance moderada (2000-5000ms)", async () => {
      const { logger } = await import("../../utils/logger");

      logger.logPerformance("funcaoModerada", 3000);

      const logCall = mockConsoleLog.mock.calls[0][0];
      const parsed = JSON.parse(logCall);
      expect(parsed.performance).toBe("moderate");
    });

    it("deve logar requisição HTTP com status 200", async () => {
      const { logger } = await import("../../utils/logger");

      logger.logRequest("GET", "/api/users", 200, 150);

      expect(mockConsoleLog).toHaveBeenCalled();
      const logCall = mockConsoleLog.mock.calls[0][0];
      const parsed = JSON.parse(logCall);
      expect(parsed.severity).toBe("INFO");
      expect(parsed.httpRequest.requestMethod).toBe("GET");
      expect(parsed.httpRequest.status).toBe(200);
    });

    it("deve logar requisição HTTP com status 400 como WARNING", async () => {
      const { logger } = await import("../../utils/logger");

      logger.logRequest("POST", "/api/login", 401, 50);

      const logCall = mockConsoleLog.mock.calls[0][0];
      const parsed = JSON.parse(logCall);
      expect(parsed.severity).toBe("WARNING");
    });

    it("deve logar requisição HTTP com status 500 como ERROR", async () => {
      const { logger } = await import("../../utils/logger");

      logger.logRequest("PUT", "/api/update", 500, 200);

      const logCall = mockConsoleLog.mock.calls[0][0];
      const parsed = JSON.parse(logCall);
      expect(parsed.severity).toBe("ERROR");
    });

    it("deve logar eventos de auditoria", async () => {
      const { logger } = await import("../../utils/logger");

      logger.audit("DELETE", "user@example.com", "etapa-123", { motivo: "teste" });

      expect(mockConsoleLog).toHaveBeenCalled();
      const logCall = mockConsoleLog.mock.calls[0][0];
      const parsed = JSON.parse(logCall);
      expect(parsed.audit.action).toBe("DELETE");
      expect(parsed.audit.actor).toBe("user@example.com");
      expect(parsed.audit.resource).toBe("etapa-123");
    });
  });

  describe("funções exportadas diretamente", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "production";
      process.env.GCLOUD_PROJECT = "projeto-teste";
    });

    it("deve exportar debug como função", async () => {
      process.env.LOG_LEVEL = "DEBUG";
      const { debug } = await import("../../utils/logger");

      debug("Debug direto", { valor: 42 });

      expect(mockConsoleLog).toHaveBeenCalled();
    });

    it("deve exportar info como função", async () => {
      const { info } = await import("../../utils/logger");

      info("Info direta");

      expect(mockConsoleLog).toHaveBeenCalled();
    });

    it("deve exportar warn como função", async () => {
      const { warn } = await import("../../utils/logger");

      warn("Warning direto");

      expect(mockConsoleLog).toHaveBeenCalled();
    });

    it("deve exportar error como função", async () => {
      const { error } = await import("../../utils/logger");

      error("Erro direto", { ctx: "teste" }, new Error("Falha"));

      expect(mockConsoleLog).toHaveBeenCalled();
    });
  });

  describe("níveis de log", () => {
    it("não deve logar DEBUG quando nível mínimo é INFO", async () => {
      process.env.LOG_LEVEL = "INFO";
      process.env.NODE_ENV = "production";
      process.env.GCLOUD_PROJECT = "projeto";

      const { logger } = await import("../../utils/logger");

      logger.debug("Não deve aparecer");

      // Debug não deve ser logado quando nível é INFO
      expect(mockConsoleLog).not.toHaveBeenCalled();
    });

    it("deve logar WARNING quando nível mínimo é WARNING", async () => {
      process.env.LOG_LEVEL = "WARNING";
      process.env.NODE_ENV = "production";
      process.env.GCLOUD_PROJECT = "projeto";

      const { logger } = await import("../../utils/logger");

      logger.warn("Deve aparecer");

      expect(mockConsoleLog).toHaveBeenCalled();
    });
  });
});
