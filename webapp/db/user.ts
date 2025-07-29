"use server";

import { logger } from "@/lib/logger";
import { pool } from "./connect";

export async function createGuestUser() {
  try {
    logger.database("info", "Creating new guest user", {
      metadata: { operation: "createGuestUser" },
    });

    const userInsert = await pool.query<{ id: string }>(
      `INSERT INTO task_manager."user" (is_guest) VALUES (true) RETURNING id;`
    );

    const guestId = userInsert.rows[0].id;

    return guestId;
  } catch (error) {
    logger.database("error", "Failed to create guest user", {
      metadata: {
        operation: "createGuestUser",
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });
    throw error;
  }
}
