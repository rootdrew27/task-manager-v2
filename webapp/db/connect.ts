import { logger } from "@/lib/logger";
import { Pool } from "pg";

// Create pool with connection logging
export const pool = new Pool({
  idleTimeoutMillis: 30000,
  log: (message: string) => {
    logger.database("debug", "PostgreSQL connection pool message", {
      metadata: { message },
    });
  },
});

// Log pool events
pool.on("connect", (client) => {
  logger.database("debug", "New database connection established", {
    metadata: {
      processID: client.processID,
      secretKey: client.secretKey ? "[REDACTED]" : "none",
    },
  });
});

pool.on("error", (error, client) => {
  logger.database("error", "Database connection error", {
    metadata: {
      error: error.message,
      processID: client?.processID,
    },
  });
});

pool.on("remove", (client) => {
  logger.database("debug", "Database connection removed from pool", {
    metadata: { processID: client.processID },
  });
});
