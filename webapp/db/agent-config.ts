import { pool } from "@/db/connect";
import { validateApiKeys, validateSelectedModels } from "@/lib/agent/setup";
import { logger } from "@/lib/logger";
import { ApiKeyValidity, ApiKeys, SelectedModels } from "@/types/agent";

/**
 * Get the encryption key from environment variables
 */
function getEncryptionKey(): string {
  const key = process.env.PG_ENCRYPTION_KEY;
  if (!key) {
    throw new Error("PG_ENCRYPTION_KEY environment variable is required for API key encryption");
  }
  return key;
}

export async function getSelectedModels(userId: string) {
  try {
    logger.database("info", "Fetching selected models for user", {
      userId,
      metadata: { operation: "getSelectedModels" },
    });

    // check if this user has entries for the particular model types
    const { rows } = await pool.query(
      `
      SELECT stt.model AS stt_model, llm.model AS llm_model, tts.model AS tts_model
        FROM stt FULL OUTER JOIN llm ON stt.user_id = llm.user_id FULL OUTER JOIN tts ON stt.user_id = tts.user_id 
      WHERE stt.user_id = $1;
    `,
      [userId]
    );

    const selectedModels = rows[0];

    if (!selectedModels) {
      logger.database("info", "No selected models found for user", {
        userId,
        metadata: { operation: "getSelectedModels" },
      });
      return null;
    }

    const { stt_model: stt, llm_model: llm, tts_model: tts } = selectedModels;

    return { stt, llm, tts };
  } catch (error) {
    logger.database("error", "Failed to fetch selected models", {
      userId,
      metadata: {
        operation: "getSelectedModels",
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });
    throw error;
  }
}

export async function saveModelKeysAndPreferences(
  userId: string,
  apiKeys: ApiKeys,
  modelSelections: SelectedModels
) {
  const client = await pool.connect();
  const { deepgram: sttKey, openai: llmKey, cartesia: ttsKey } = apiKeys;
  const { stt: sttModel, llm: llmModel, tts: ttsModel } = modelSelections;
  try {
    await client.query("BEGIN");

    await client.query(
      `
            INSERT INTO task_manager.stt (user_id, provider, key, model)
            VALUES ($1, $2, task_manager.encrypt_api_key($3, $4), $5)
            ON CONFLICT(user_id)
            DO UPDATE SET
              provider = EXCLUDED.provider,
              key = EXCLUDED.key,
              model = EXCLUDED.model;
            `,
      [userId, "deepgram", sttKey, getEncryptionKey(), sttModel]
    );

    await client.query(
      `
            INSERT INTO task_manager.llm (user_id, provider, key, model)
            VALUES ($1, $2, task_manager.encrypt_api_key($3, $4), $5)
            ON CONFLICT(user_id)
            DO UPDATE SET
              provider = EXCLUDED.provider,
              key = EXCLUDED.key,
              model = EXCLUDED.model;
            `,
      [userId, "openai", llmKey, getEncryptionKey(), llmModel]
    );

    if (ttsModel) {
      await client.query(
        `
          INSERT INTO task_manager.tts (user_id, provider, key, model, active)
          VALUES ($1, $2, task_manager.encrypt_api_key($3, $4), $5, $6)
          ON CONFLICT(user_id)
          DO UPDATE SET
            provider = EXCLUDED.provider,
            key = EXCLUDED.key
            model = EXCLUDED.model;
        `,
        [userId, "cartesia", ttsKey, getEncryptionKey(), ttsModel, true]
      );
    }
    await client.query("COMMIT");
    return { success: true };
  } catch (error) {
    logger.database("error", "Failed to save model keys and preferences", {
      userId,
      metadata: {
        operation: "saveModelKeysAndPreferences",
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function upsertSelectedModels(userId: string, newModelSelections: SelectedModels) {
  const result = await validateSelectedModels(newModelSelections);

  if (!result.success) {
    return result;
  }

  const client = await pool.connect();
  const { stt: newSttModel, llm: newLlmModel, tts: newTtsModel } = newModelSelections;

  try {
    logger.database("info", "Updating selected models using upsert", {
      userId,
      metadata: {
        operation: "updateSelectedModels",
        models: { stt: newSttModel, llm: newLlmModel, tts: newTtsModel },
      },
    });

    await client.query("BEGIN");

    // Use upsert for STT model
    if (newSttModel) {
      await client.query(
        `
        INSERT INTO task_manager.stt (user_id, provider, key, model)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT(user_id)
        DO UPDATE SET
          model = EXCLUDED.model;
        `,
        [userId, "deepgram", null, newSttModel]
      );
    }

    // Use upsert for LLM model
    if (newLlmModel) {
      await client.query(
        `
        INSERT INTO task_manager.llm (user_id, provider, key, model)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT(user_id)
        DO UPDATE SET
          model = EXCLUDED.model;
        `,
        [userId, "openai", null, newLlmModel]
      );
    }

    // Use upsert for TTS model
    if (newTtsModel || newTtsModel === null) {
      await client.query(
        `
        INSERT INTO task_manager.tts (user_id, provider, key, model)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT(user_id)
        DO UPDATE SET
          model = EXCLUDED.model;
        `,
        [userId, "cartesia", null, newTtsModel]
      );
    }

    await client.query("COMMIT");
    return { success: true };
  } catch (error) {
    logger.database("error", "Failed to update model selections", {
      userId,
      metadata: {
        operation: "updateSelectedModels",
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });
    await client.query("ROLLBACK");
    return { success: false };
  } finally {
    client.release();
  }
}

export async function getSelectedModelsAndValidatedApiKeys(userId: string) {
  try {
    const { rows } = await pool.query(
      `
      SELECT stt.model AS stt_model, 
             task_manager.decrypt_api_key(stt.key, $2) AS stt_key, 
             llm.model AS llm_model, 
             task_manager.decrypt_api_key(llm.key, $2) AS llm_key, 
             tts.model AS tts_model, 
             task_manager.decrypt_api_key(tts.key, $2) AS tts_key
      FROM stt FULL OUTER JOIN llm ON stt.user_id = llm.user_id
      FULL OUTER JOIN tts ON stt.user_id = tts.user_id
      WHERE stt.user_id = $1;
      `,
      [userId, getEncryptionKey()]
    );

    const result = rows[0];

    if (!result) {
      return null;
    }

    const {
      stt_model: sttModel,
      stt_key: sttKey,
      llm_model: llmModel,
      llm_key: llmKey,
      tts_model: ttsModel = null,
      tts_key: ttsKey = null,
    } = rows[0];

    const { isValid, errors, validatedServices } = await validateApiKeys({
      deepgram: sttKey,
      openai: llmKey,
      cartesia: ttsKey ?? "",
    });

    const isSttApiKeyValid = validatedServices.includes("deepgram");
    const isLlmApiKeyValid = validatedServices.includes("openai");
    const isTtsApiKeyValid = validatedServices.includes("cartesia");

    return {
      selectedModels: { stt: sttModel, llm: llmModel, tts: ttsModel },
      apiKeyValidity: { stt: isSttApiKeyValid, llm: isLlmApiKeyValid, tts: isTtsApiKeyValid },
    } as { selectedModels: SelectedModels; apiKeyValidity: ApiKeyValidity };
  } catch (error) {
    throw error;
  }
}

export async function validateCurrentApiKeys(userId: string) {
  try {
    const { rows } = await pool.query(
      `
      SELECT CASE WHEN stt.key IS NOT NULL THEN 'true' ELSE 'false' END as stt_key, 
             CASE WHEN llm.key IS NOT NULL THEN 'true' ELSE 'false' END as llm_key, 
             CASE WHEN tts.key IS NOT NULL THEN 'true' ELSE 'false' END as tts_key
        FROM stt FULL OUTER JOIN llm ON stt.user_id = llm.user_id FULL OUTER JOIN tts ON stt.user_id = tts.user_id
      WHERE stt.user_id = $1;
    `,
      [userId]
    );

    const result = rows[0];

    if (!result) {
      return null;
    }

    return {
      stt: result.stt_key === "true",
      llm: result.llm_key === "true",
      tts: result.tts_key === "true",
    } as ApiKeyValidity;
  } catch (error) {
    throw error;
  }
}

export async function validateConfigByUserId(userId: string) {
  try {
    const { rows } = await pool.query(
      `
      SELECT stt.model AS stt_model, 
             task_manager.decrypt_api_key(stt.key, $2) AS stt_key, 
             llm.model AS llm_model, 
             task_manager.decrypt_api_key(llm.key, $2) AS llm_key, 
             tts.model AS tts_model, 
             task_manager.decrypt_api_key(tts.key, $2) AS tts_key
      FROM stt JOIN llm ON stt.user_id = llm.user_id
      LEFT JOIN tts ON stt.user_id = tts.user_id
      WHERE stt.user_id = $1;
      `,
      [userId, getEncryptionKey()]
    );

    const config = rows[0];

    if (!config) {
      return false;
    }

    const {
      stt_model: sttModel,
      llm_model: llmModel,
      tts_model: ttsModel,
      stt_key: sttKey,
      llm_key: llmKey,
      tts_key: ttsKey,
    } = config;

    if (!validateApiKeys({ deepgram: sttKey, openai: llmKey, cartesia: ttsKey })) {
      return false;
    }

    if (!(sttModel && llmModel && ttsModel)) {
      return false;
    }

    return true;
  } catch (error) {
    logger.database("error", "Failed to validate config by user ID", {
      userId,
      metadata: {
        operation: "validateConfigByUserId",
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });
    throw error;
  }
}

export async function saveApiKeys(apiKeys: ApiKeys, userId: string) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    if (apiKeys.deepgram) {
      await client.query(
        `
        INSERT INTO stt (user_id, provider, key)
        VALUES ($1, $2, task_manager.encrypt_api_key($3, $4))
        ON CONFLICT(user_id)
        DO UPDATE SET
          key = EXCLUDED.key
      `,
        [userId, "deepgram", apiKeys.deepgram, getEncryptionKey()]
      );
    }

    if (apiKeys.openai) {
      await client.query(
        `
        INSERT INTO llm (user_id, provider, key)
        VALUES ($1, $2, task_manager.encrypt_api_key($3, $4))
        ON CONFLICT(user_id)
        DO UPDATE SET
          key = EXCLUDED.key
      `,
        [userId, "openai", apiKeys.openai, getEncryptionKey()]
      );
    }

    if (apiKeys.cartesia) {
      await client.query(
        `
        INSERT INTO tts (user_id, provider, key)
        VALUES ($1, $2, task_manager.encrypt_api_key($3, $4))
        ON CONFLICT(user_id)
        DO UPDATE SET
          key = EXCLUDED.key
      `,
        [userId, "cartesia", apiKeys.cartesia, getEncryptionKey()]
      );
    }

    await client.query("COMMIT");
    return { success: true };
  } catch (error) {
    logger.database("error", "Failed to save API keys", {
      userId,
      metadata: {
        operation: "saveApiKeys",
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
