import { pool } from "@/db/connect";
import { validateApiKeys } from "@/lib/agent/setup";
import { getUserId } from "@/lib/auth/utils";
import { logger } from "@/lib/logger";
import { ApiKeyValidity, ApiKeys, SelectedModels } from "@/types/agent";

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
            VALUES ($1, $2, $3, $4)
            ON CONFLICT(user_id)
            DO UPDATE SET
              provider = EXCLUDED.provider,
              key = EXCLUDED.key,
              model = EXCLUDED.model;
            `,
      [userId, "deepgram", sttKey, sttModel]
    );

    await client.query(
      `
            INSERT INTO task_manager.llm (user_id, provider, key, model)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT(user_id)
            DO UPDATE SET
              provider = EXCLUDED.provider,
              key = EXCLUDED.key,
              model = EXCLUDED.model;
            `,
      [userId, "openai", llmKey, llmModel]
    );

    if (ttsModel) {
      await client.query(
        `
            INSERT INTO task_manager.tts (user_id, provider, key, model, active)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT(user_id)
            DO UPDATE SET
              provider = EXCLUDED.provider,
              key = EXCLUDED.key,
              model = EXCLUDED.model;
            `,
        [userId, "cartesia", ttsKey, ttsModel, true]
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

export async function updateSelectedModels(userId: string, newModelSelections: SelectedModels) {
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
      SELECT stt.model AS stt_model, stt.key AS stt_key, llm.model AS llm_model, llm.key AS llm_key, tts.model AS tts_model, tts.key AS tts_key
      FROM stt FULL OUTER JOIN llm ON stt.user_id = llm.user_id
      FULL OUTER JOIN tts ON stt.user_id = tts.user_id
      WHERE stt.user_id = $1;
      `,
      [userId]
    );

    const modelSelections = rows[0];

    if (!modelSelections) {
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
      SELECT stt.key as stt_key, llm.key as llm_key, tts.key as tts_key
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
      stt: result.stt_key ? true : false,
      llm: result.llm_key ? true : false,
      tts: result.tts_key ? true : false,
    } as ApiKeyValidity;
  } catch (error) {
    throw error;
  }
}

export async function validateConfigByUserId(userId: string) {
  try {
    const { rows } = await pool.query(
      `
      SELECT stt.model AS stt_model, stt.key AS stt_key, llm.model AS llm_model, llm.key AS llm_key, tts.model AS tts_model, tts.key AS tts_key
      FROM stt JOIN llm ON stt.user_id = llm.user_id
      LEFT JOIN tts ON stt.user_id = tts.user_id
      WHERE stt.user_id = $1;
      `,
      [userId]
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
        VALUES ($1, $2, $3)
        ON CONFLICT(user_id)
        DO UPDATE SET
          key = EXCLUDED.key
      `,
        [userId, "deepgram", apiKeys.deepgram]
      );
    }

    if (apiKeys.openai) {
      await client.query(
        `
        INSERT INTO llm (user_id, provider, key)
        VALUES ($1, $2, $3)
        ON CONFLICT(user_id)
        DO UPDATE SET
          key = EXCLUDED.key
      `,
        [userId, "openai", apiKeys.openai]
      );
    }

    if (apiKeys.cartesia) {
      await client.query(
        `
        INSERT INTO tts (user_id, provider, key)
        VALUES ($1, $2, $3)
        ON CONFLICT(user_id)
        DO UPDATE SET
          key = EXCLUDED.key
      `,
        [userId, "cartesia", apiKeys.cartesia]
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
