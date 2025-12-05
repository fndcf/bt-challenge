// Níveis de log
export enum LogLevel {
  ERROR = "ERROR",
  WARN = "WARN",
  INFO = "INFO",
  DEBUG = "DEBUG",
}

// Configuração
const config = {
  // Logs só aparecem em desenvolvimento
  enabled: import.meta.env.MODE === "development",

  // Nível mínimo a ser exibido
  level: (import.meta.env.VITE_LOG_LEVEL as LogLevel) || LogLevel.INFO,

  // Enviar erros para Sentry (produção)
  sendToSentry: import.meta.env.MODE === "production",
};

// Hierarquia de níveis
const levelPriority = {
  [LogLevel.ERROR]: 0,
  [LogLevel.WARN]: 1,
  [LogLevel.INFO]: 2,
  [LogLevel.DEBUG]: 3,
};

// Verificar se deve logar
const shouldLog = (level: LogLevel): boolean => {
  if (!config.enabled && level !== LogLevel.ERROR) {
    return false;
  }
  return levelPriority[level] <= levelPriority[config.level];
};

// Formatar timestamp
const getTimestamp = (): string => {
  const now = new Date();
  return now.toISOString().split("T")[1].slice(0, -1); // HH:mm:ss.SSS
};

// ============================================
// LOGGER CLASS
// ============================================

class Logger {
  /**
   * 🔴 ERROR - Erros críticos
   */
  error(message: string, context?: Record<string, any>, error?: Error): void {
    if (!shouldLog(LogLevel.ERROR)) return;

    const timestamp = getTimestamp();

    console.error(
      `%c[${timestamp}] ERROR`,
      "color: #ef4444; font-weight: bold",
      message
    );

    if (context) {
      console.error("Context:", context);
    }

    if (error) {
      console.error("Stack:", error.stack);
    }

    // Enviar para Sentry (produção)
    if (config.sendToSentry && typeof window !== "undefined") {
      // @ts-ignore
      window.Sentry?.captureException(error || new Error(message), {
        extra: context,
      });
    }
  }

  /**
   * 🟡 WARN - Avisos importantes
   */
  warn(message: string, context?: Record<string, any>): void {
    if (!shouldLog(LogLevel.WARN)) return;

    const timestamp = getTimestamp();

    console.warn(
      `%c[${timestamp}] WARN`,
      "color: #f59e0b; font-weight: bold",
      message
    );

    if (context) {
      console.warn("Context:", context);
    }
  }

  /**
   * 🟢 INFO - Informações importantes
   */
  info(message: string, context?: Record<string, any>): void {
    if (!shouldLog(LogLevel.INFO)) return;

    const timestamp = getTimestamp();

    console.log(
      `%c[${timestamp}] INFO`,
      "color: #10b981; font-weight: bold",
      message
    );

    if (context) {
      console.log("Context:", context);
    }
  }

  /**
   * 🔵 DEBUG - Detalhes técnicos (só desenvolvimento)
   */
  debug(message: string, context?: Record<string, any>): void {
    if (!shouldLog(LogLevel.DEBUG)) return;

    const timestamp = getTimestamp();

    console.log(
      `%c[${timestamp}] DEBUG`,
      "color: #3b82f6; font-weight: bold",
      message
    );

    if (context) {
      console.log("Context:", context);
    }
  }

  /**
   * Grupo de logs (expansível no console)
   */
  group(title: string, callback: () => void): void {
    if (!config.enabled) return;

    console.group(`📦 ${title}`);
    callback();
    console.groupEnd();
  }

  /**
   * Timer (medir performance)
   */
  time(label: string): void {
    if (!config.enabled) return;
    console.time(`⏱️ ${label}`);
  }

  timeEnd(label: string): void {
    if (!config.enabled) return;
    console.timeEnd(`⏱️ ${label}`);
  }

  /**
   * Tabela (visualizar dados estruturados)
   */
  table(data: any[], columns?: string[]): void {
    if (!config.enabled) return;
    console.table(data, columns);
  }
}

// Exportar instância única
export const logger = new Logger();

export default logger;
