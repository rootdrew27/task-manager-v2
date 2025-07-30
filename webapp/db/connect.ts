import { logger } from "@/lib/logger";
import { Pool } from "pg";

declare module "pg" {
  interface PoolClient {
    processID?: number;
  }
}

// Create pool with connection logging
export const pool = new Pool({
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  host: process.env.PG_HOST,
  port: parseInt(process.env.PG_PORT || "5432"),
  database: process.env.PG_DATABASE,
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
