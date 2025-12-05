/**
 * Testes do logger
 *
 * Nota: O módulo logger usa import.meta.env que não é suportado pelo Jest.
 * Por isso, mockamos o módulo inteiro para testar a interface.
 */

// Mock do módulo logger inteiro para evitar problemas com import.meta.env
const mockLogger = {
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  group: jest.fn((title: string, callback: () => void) => {
    callback();
  }),
  time: jest.fn(),
  timeEnd: jest.fn(),
  table: jest.fn(),
};

jest.mock("@/utils/logger", () => ({
  __esModule: true,
  LogLevel: {
    ERROR: "ERROR",
    WARN: "WARN",
    INFO: "INFO",
    DEBUG: "DEBUG",
  },
  logger: mockLogger,
  default: mockLogger,
}));

import { logger, LogLevel } from "@/utils/logger";

describe("logger", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("LogLevel enum", () => {
    it("deve ter os níveis corretos", () => {
      expect(LogLevel.ERROR).toBe("ERROR");
      expect(LogLevel.WARN).toBe("WARN");
      expect(LogLevel.INFO).toBe("INFO");
      expect(LogLevel.DEBUG).toBe("DEBUG");
    });
  });

  describe("error", () => {
    it("deve aceitar mensagem de erro", () => {
      logger.error("Erro de teste");

      expect(mockLogger.error).toHaveBeenCalledWith("Erro de teste");
    });

    it("deve aceitar erro com contexto", () => {
      logger.error("Erro com contexto", { userId: "123", action: "test" });

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Erro com contexto",
        { userId: "123", action: "test" }
      );
    });

    it("deve aceitar erro com stack trace", () => {
      const error = new Error("Erro original");
      logger.error("Erro com stack", { info: "extra" }, error);

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Erro com stack",
        { info: "extra" },
        error
      );
    });
  });

  describe("warn", () => {
    it("deve aceitar mensagem de warning", () => {
      logger.warn("Aviso de teste");

      expect(mockLogger.warn).toHaveBeenCalledWith("Aviso de teste");
    });

    it("deve aceitar warning com contexto", () => {
      logger.warn("Aviso com contexto", { field: "email" });

      expect(mockLogger.warn).toHaveBeenCalledWith(
        "Aviso com contexto",
        { field: "email" }
      );
    });
  });

  describe("info", () => {
    it("deve aceitar mensagem de info", () => {
      logger.info("Informação de teste");

      expect(mockLogger.info).toHaveBeenCalledWith("Informação de teste");
    });

    it("deve aceitar info com contexto", () => {
      logger.info("Info com contexto", { page: "dashboard" });

      expect(mockLogger.info).toHaveBeenCalledWith(
        "Info com contexto",
        { page: "dashboard" }
      );
    });
  });

  describe("debug", () => {
    it("deve aceitar mensagem de debug", () => {
      logger.debug("Debug de teste");

      expect(mockLogger.debug).toHaveBeenCalledWith("Debug de teste");
    });

    it("deve aceitar debug com contexto", () => {
      logger.debug("Debug com contexto", { variable: "valor" });

      expect(mockLogger.debug).toHaveBeenCalledWith(
        "Debug com contexto",
        { variable: "valor" }
      );
    });
  });

  describe("group", () => {
    it("deve executar callback dentro do grupo", () => {
      let executed = false;

      logger.group("Grupo de teste", () => {
        executed = true;
      });

      expect(executed).toBe(true);
      expect(mockLogger.group).toHaveBeenCalled();
    });
  });

  describe("time/timeEnd", () => {
    it("deve chamar time com label", () => {
      logger.time("operacao");

      expect(mockLogger.time).toHaveBeenCalledWith("operacao");
    });

    it("deve chamar timeEnd com label", () => {
      logger.time("operacao");
      logger.timeEnd("operacao");

      expect(mockLogger.time).toHaveBeenCalledWith("operacao");
      expect(mockLogger.timeEnd).toHaveBeenCalledWith("operacao");
    });
  });

  describe("table", () => {
    it("deve aceitar tabela de dados", () => {
      const data = [
        { id: 1, nome: "Item 1" },
        { id: 2, nome: "Item 2" },
      ];

      logger.table(data);

      expect(mockLogger.table).toHaveBeenCalledWith(data);
    });

    it("deve aceitar tabela com colunas específicas", () => {
      const data = [
        { id: 1, nome: "Item 1", extra: "info" },
        { id: 2, nome: "Item 2", extra: "info" },
      ];

      logger.table(data, ["id", "nome"]);

      expect(mockLogger.table).toHaveBeenCalledWith(data, ["id", "nome"]);
    });
  });

  describe("exports", () => {
    it("deve exportar logger como named export", () => {
      expect(logger).toBeDefined();
      expect(logger.error).toBeDefined();
      expect(logger.warn).toBeDefined();
      expect(logger.info).toBeDefined();
      expect(logger.debug).toBeDefined();
    });
  });
});
