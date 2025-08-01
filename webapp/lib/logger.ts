/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from "fs";
import path from "path";

export type LogLevel = "info" | "warn" | "error" | "debug";

export type LogCategory =
  | "auth"
  | "rate-limit"
  | "livekit"
  | "database"
  | "security"
  | "errors"
  | "performance"
  | "audit"
  | "agent-config";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  metadata?: Record<string, any>;
  userId?: string;
  requestId?: string;
}

class Logger {
  private logDir: string;
  private isDevelopment: boolean;

  constructor() {
    this.logDir = "/tmp/webapp/logs";
    this.isDevelopment = process.env.NODE_ENV === "development";
    this.ensureLogDirectory();
  }

  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private getLogFilePath(category: LogCategory): string {
    return path.join(this.logDir, `${category}.log`);
  }

  private formatLogEntry(entry: LogEntry): string {
    const { timestamp, level, category, message, metadata, userId, requestId } = entry;

    const baseLog = `[${timestamp}] [${level.toUpperCase()}] [${category}] ${message}`;

    const extras: string[] = [];
    if (userId) extras.push(`userId=${userId}`);
    if (requestId) extras.push(`requestId=${requestId}`);
    if (metadata && Object.keys(metadata).length > 0) {
      extras.push(`metadata=${JSON.stringify(metadata)}`);
    }

    return extras.length > 0 ? `${baseLog} | ${extras.join(" | ")}` : baseLog;
  }

  private writeToFile(category: LogCategory, logEntry: string): void {
    try {
      const filePath = this.getLogFilePath(category);
      fs.appendFileSync(filePath, logEntry + "\n", "utf8");
    } catch (error) {
      console.error(`Failed to write to log file ${category}:`, error);
    }
  }

  public log(
    level: LogLevel,
    category: LogCategory,
    message: string,
    options?: {
      metadata?: Record<string, any>;
      userId?: string;
      requestId?: string;
    }
  ): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      ...options,
    };

    const formattedEntry = this.formatLogEntry(entry);

    // Always write to file in production
    if (!this.isDevelopment) {
      this.writeToFile(category, formattedEntry);
    }

    // Also log to console in development or for errors/warnings
    if (this.isDevelopment || level === "error" || level === "warn") {
      const consoleLevel = level === "debug" ? "log" : level;
      console[consoleLevel](formattedEntry);
    }
  }

  // Convenience methods for each category
  public auth(
    level: LogLevel,
    message: string,
    options?: { metadata?: Record<string, any>; userId?: string; requestId?: string }
  ) {
    this.log(level, "auth", message, options);
  }

  public rateLimit(
    level: LogLevel,
    message: string,
    options?: { metadata?: Record<string, any>; userId?: string; requestId?: string }
  ) {
    this.log(level, "rate-limit", message, options);
  }

  public livekit(
    level: LogLevel,
    message: string,
    options?: { metadata?: Record<string, any>; userId?: string; requestId?: string }
  ) {
    this.log(level, "livekit", message, options);
  }

  public database(
    level: LogLevel,
    message: string,
    options?: { metadata?: Record<string, any>; userId?: string; requestId?: string }
  ) {
    this.log(level, "database", message, options);
  }

  public security(
    level: LogLevel,
    message: string,
    options?: { metadata?: Record<string, any>; userId?: string; requestId?: string }
  ) {
    this.log(level, "security", message, options);
  }

  public error(
    message: string,
    options?: { metadata?: Record<string, any>; userId?: string; requestId?: string }
  ) {
    this.log("error", "errors", message, options);
  }

  public performance(
    level: LogLevel,
    message: string,
    options?: { metadata?: Record<string, any>; userId?: string; requestId?: string }
  ) {
    this.log(level, "performance", message, options);
  }

  public audit(
    level: LogLevel,
    message: string,
    options?: { metadata?: Record<string, any>; userId?: string; requestId?: string }
  ) {
    this.log(level, "audit", message, options);
  }

  public agentConfig(
    level: LogLevel,
    message: string,
    options?: { metadata?: Record<string, any>; userId?: string; requestId?: string }
  ) {
    this.log(level, "agent-config", message, options);
  }
}

// Export singleton instance
export const logger = new Logger();
