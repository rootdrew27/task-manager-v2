"use server";

import { pool } from "./connect";

export async function createGuestUser() {
  try {
    const userInsert = await pool.query<{ id: string }>(
      `INSERT INTO "user" DEFAULT VALUES RETURNING id;`
    );

    const guestId = userInsert.rows[0].id;

    return guestId;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
