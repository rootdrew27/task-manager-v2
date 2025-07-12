import { pool } from "@/db/connect";
import { ProviderProfile } from "@/types/auth";

export async function getUser(profile: ProviderProfile, provider: "google") {
  try {
    if (provider === "google") {
      const query = `
        SELECT u.id
        FROM "user" u
        JOIN google_account g ON g.user_id = u.id
        WHERE g.sub = $1;
      `;

      const values = [profile.sub];

      const { rows } = await pool.query<{ id: string }>(query, values);
      return rows[0] ?? null; // return user or null if not found
    } else {
      throw new Error(`Unsupported provider: ${provider}`);
    }
  } catch (error) {
    const msg = "Error getting user.";
    console.error(msg, error);
    return;
  }
}

export async function createNewUser(profile: ProviderProfile, provider: "google") {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Insert User
    const userInsert = await client.query<{ id: string }>(
      `INSERT INTO "user" DEFAULT VALUES RETURNING id;`
    );
    const userId = userInsert.rows[0].id;

    // 2. Insert Account
    if (provider === "google") {
      const { sub, email, email_verified, family_name, given_name, picture } = profile;

      await client.query(
        `
        INSERT INTO google_account (
          sub, email, email_verified, family_name, given_name, picture, user_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7);
        `,
        [sub, email, email_verified, family_name, given_name, picture, userId]
      );
    } else {
      throw new Error(`Invalid provider (${provider})!`);
    }

    await client.query("COMMIT");
    return { userId };
  } catch (error) {
    console.error(error);
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
