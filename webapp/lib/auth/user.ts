import { pool } from "@/db/connect";
import { logger } from "@/lib/logger";
import { ProviderProfile } from "@/types/auth";

export async function getUser(profile: ProviderProfile, provider: "google") {
  try {
    logger.database("info", "Looking up existing user", {
      metadata: {
        operation: "getUser",
        provider,
        profile,
      },
    });

    if (provider === "google") {
      const query = `
        SELECT u.id, u.name
        FROM task_manager."user" u
        JOIN task_manager.google_account g ON g.user_id = u.id
        WHERE g.sub = $1;
      `;

      const values = [profile.sub];

      const { rows } = await pool.query<{ id: string; name: string | null }>(query, values);
      const user = rows[0] ?? null;

      return user;
    } else {
      throw new Error(`Unsupported provider: ${provider}`);
    }
  } catch (error) {
    logger.database("error", "Error getting user", {
      metadata: {
        operation: "getUser",
        provider,
        profile,
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });
    return;
  }
}

export async function createNewUser(profile: ProviderProfile, provider: "google") {
  const client = await pool.connect();
  try {
    logger.database("info", "Creating new authenticated user", {
      metadata: {
        operation: "createNewUser",
        provider,
        profile,
      },
    });

    await client.query("BEGIN");

    // 1. Insert User with name from profile
    const userName =
      profile.given_name && profile.family_name
        ? `${profile.given_name} ${profile.family_name}`
        : profile.given_name || profile.email || null;

    const userInsert = await client.query<{ id: string }>(
      `INSERT INTO task_manager."user" (name, is_guest) VALUES ($1, false) RETURNING id;`,
      [userName]
    );
    const userId = userInsert.rows[0].id;

    // 2. Insert Account
    if (provider === "google") {
      const { sub, email, email_verified, family_name, given_name, picture } = profile;

      await client.query(
        `
        INSERT INTO task_manager.google_account (
          sub, email, email_verified, family_name, given_name, picture, user_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7);
        `,
        [sub, email, email_verified, family_name, given_name, picture, userId]
      );
    } else {
      logger.database("error", "Invalid provider for user creation", {
        metadata: { operation: "createNewUser", provider },
      });
      throw new Error(`Invalid provider (${provider})!`);
    }

    await client.query("COMMIT");

    logger.database("info", "Successfully created new authenticated user", {
      userId,
      metadata: {
        operation: "createNewUser",
        provider,
        email: profile.email,
      },
    });

    logger.audit("info", "New authenticated user created", {
      userId,
      metadata: {
        userType: "authenticated",
        provider,
        email: profile.email,
      },
    });

    return { userId };
  } catch (error) {
    logger.database("error", "Failed to create new authenticated user", {
      metadata: {
        operation: "createNewUser",
        provider,
        email: profile.email,
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
