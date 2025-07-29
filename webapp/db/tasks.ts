import { logger } from "@/lib/logger";
import { build_task_obj } from "@/lib/task";
import { pool } from "./connect";

export async function getTasksByUserId(userId: string) {
  try {
    logger.database("info", "Fetching tasks for user", {
      userId,
      metadata: { operation: "getTasksByUserId" },
    });

    const query = `
      SELECT t.name, t.description, t.deadline, t.is_complete, u.name as user_name, u.is_guest
      FROM task_manager.task t
      JOIN task_manager."user" u ON t.user_id = u.id
      WHERE t.user_id = $1;
    `;
    const values = [userId];
    const { rows } = await pool.query<TaskInfoFromDB>(query, values);

    const tasks = [];
    for (const row of rows) {
      tasks.push(build_task_obj(row));
    }
    return tasks;
  } catch (error) {
    logger.database("error", "Failed to fetch tasks for user", {
      userId,
      metadata: {
        operation: "getTasksByUserId",
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });
    throw error;
  }
}
