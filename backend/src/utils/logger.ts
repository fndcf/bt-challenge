// Níveis de severidade do Cloud Logging
type LogSeverity =
  | "DEBUG"
  | "INFO"
  | "NOTICE"
  | "WARNING"
  | "ERROR"
  | "CRITICAL"
  | "ALERT"
  | "EMERGENCY";

// Configuração
const config = {
  // Em desenvolvimento local, mostrar logs coloridos
  isDevelopment:
    process.env.FUNCTIONS_EMULATOR === "true" ||
    process.env.NODE_ENV === "development",

  // Em produção, usar structured logging para Cloud Logging
  isProduction:
    process.env.GCLOUD_PROJECT !== undefined ||
    process.env.NODE_ENV === "production",

  // Nível mínimo (pode ser configurado)
  minLevel: (process.env.LOG_LEVEL as LogSeverity) || "INFO",
};

// Hierarquia de níveis
const severityLevels: Record<LogSeverity, number> = {
  DEBUG: 0,
  INFO: 1,
  NOTICE: 2,
  WARNING: 3,
  ERROR: 4,
  CRITICAL: 5,
  ALERT: 6,
  EMERGENCY: 7,
};

// Verificar se deve logar
const shouldLog = (severity: LogSeverity): boolean => {
  return severityLevels[severity] >= severityLevels[config.minLevel];
};

/**
 * Logger Profissional para Cloud Functions
 *
 * IMPORTANTE:
 * - Em produção: Usa structured logging (JSON) para Cloud Logging
 * - Em desenvolvimento: Usa console colorido
 * - Logs são AUTOMATICAMENTE capturados pelo Firebase
 */
class CloudLogger {
  /**
   * Logar com structured logging (Cloud Logging format)
   */
  private log(
    severity: LogSeverity,
    message: string,
    context?: Record<string, any>
  ): void {
    if (!shouldLog(severity)) return;

    if (config.isDevelopment) {
      // Desenvolvimento: Console colorido
      this.logDevelopment(severity, message, context);
    } else {
      // Produção: Structured logging (JSON)
      this.logProduction(severity, message, context);
    }
  }

  /**
   * Logs coloridos para desenvolvimento local
   */
  private logDevelopment(
    severity: LogSeverity,
    message: string,
    context?: Record<string, any>
  ): void {
    const colors: Record<LogSeverity, string> = {
      DEBUG: "\x1b[36m", // Cyan
      INFO: "\x1b[32m", // Green
      NOTICE: "\x1b[34m", // Blue
      WARNING: "\x1b[33m", // Yellow
      ERROR: "\x1b[31m", // Red
      CRITICAL: "\x1b[35m", // Magenta
      ALERT: "\x1b[41m", // Red background
      EMERGENCY: "\x1b[41m\x1b[37m", // Red bg + white text
    };
    const reset = "\x1b[0m";
    const timestamp = new Date().toISOString();

    console.log(
      `${colors[severity]}[${timestamp}] ${severity}${reset}: ${message}`
    );
    if (context) {
      console.log("Context:", context);
    }
  }

  /**
   * Structured logging para Cloud Logging
   * Formato: https://cloud.google.com/logging/docs/structured-logging
   */
  private logProduction(
    severity: LogSeverity,
    message: string,
    context?: Record<string, any>
  ): void {
    const entry = {
      severity,
      message,
      timestamp: new Date().toISOString(),
      ...context,
    };

    // Cloud Logging detecta automaticamente structured logs em JSON
    console.log(JSON.stringify(entry));
  }

  /**
   * 🔵 DEBUG - Detalhes técnicos (desenvolvimento)
   */
  debug(message: string, context?: Record<string, any>): void {
    this.log("DEBUG", message, context);
  }

  /**
   * 🟢 INFO - Informações importantes do fluxo
   */
  info(message: string, context?: Record<string, any>): void {
    this.log("INFO", message, context);
  }

  /**
   * 🟣 NOTICE - Eventos significativos (normais mas importantes)
   */
  notice(message: string, context?: Record<string, any>): void {
    this.log("NOTICE", message, context);
  }

  /**
   * 🟡 WARNING - Avisos (não são erros)
   */
  warn(message: string, context?: Record<string, any>): void {
    this.log("WARNING", message, context);
  }

  /**
   * 🔴 ERROR - Erros que precisam atenção
   */
  error(message: string, context?: Record<string, any>, error?: Error): void {
    this.log("ERROR", message, {
      ...context,
      error: error?.message,
      stack: error?.stack,
    });
  }

  /**
   * 🔥 CRITICAL - Erros críticos (sistema comprometido)
   */
  critical(
    message: string,
    context?: Record<string, any>,
    error?: Error
  ): void {
    this.log("CRITICAL", message, {
      ...context,
      error: error?.message,
      stack: error?.stack,
    });
  }

  /**
   * Logar performance de funções
   */
  logPerformance(
    functionName: string,
    durationMs: number,
    context?: Record<string, any>
  ): void {
    this.info(`Function ${functionName} completed`, {
      ...context,
      durationMs,
      performance:
        durationMs > 5000 ? "slow" : durationMs > 2000 ? "moderate" : "fast",
    });
  }

  /**
   * Logar requisições HTTP (para HTTPS functions)
   */
  logRequest(
    method: string,
    path: string,
    statusCode: number,
    durationMs: number,
    context?: Record<string, any>
  ): void {
    const severity =
      statusCode >= 500 ? "ERROR" : statusCode >= 400 ? "WARNING" : "INFO";

    this.log(severity, `${method} ${path} ${statusCode}`, {
      ...context,
      httpRequest: {
        requestMethod: method,
        requestUrl: path,
        status: statusCode,
        latency: `${durationMs}ms`,
      },
    });
  }

  /**
   * Logar eventos de auditoria (ações importantes)
   */
  audit(
    action: string,
    actor: string,
    resource: string,
    context?: Record<string, any>
  ): void {
    this.notice("Audit event", {
      ...context,
      audit: {
        action,
        actor,
        resource,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

// Exportar instância única
export const logger = new CloudLogger();

// Exportar também funções diretas para compatibilidade
export const debug = (msg: string, ctx?: Record<string, any>) =>
  logger.debug(msg, ctx);
export const info = (msg: string, ctx?: Record<string, any>) =>
  logger.info(msg, ctx);
export const warn = (msg: string, ctx?: Record<string, any>) =>
  logger.warn(msg, ctx);
export const error = (msg: string, ctx?: Record<string, any>, err?: Error) =>
  logger.error(msg, ctx, err);

export default logger;
