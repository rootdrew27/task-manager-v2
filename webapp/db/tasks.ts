import { build_task_obj } from "@/lib/task";
import { pool } from "./connect";

export async function getTasksByUserId(userId: string) {
  try {
    const query = `
      SELECT name, description, deadline, is_complete
      FROM task
      WHERE user_id = $1;
    `;
    const values = [userId];
    const { rows } = await pool.query<TaskInfoFromDB>(query, values);

    const tasks = [];
    for (const row of rows) {
      tasks.push(build_task_obj(row));
    }
    return tasks;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
