import { pool } from "@/db/connect";
import { validateApiKeys } from "@/lib/agent/setup";
import { getUserId } from "@/lib/auth/utils";
import { ApiKeyValidity, ApiKeys, SelectedModels } from "@/types/agent";

export async function getSelectedModels(userId: string) {
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
    return null;
  }

  const { stt_model: stt, llm_model: llm, tts_model: tts } = selectedModels;

  return { stt, llm, tts };
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
            INSERT INTO stt (user_id, provider, key, model)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT(user_id)
            DO UPDATE SET
              provider = EXCLUDED.provider
              key = EXCLUDED.key
              model = EXCLUDED.model;
            `,
      [userId, "deepgram", sttKey, sttModel]
    );

    await client.query(
      `
            INSERT INTO llm (user_id, provider, key, model)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT(user_id)
            DO UPDATE SET
              proivder = EXCLUDED.provider
              key = EXCLUDED.key
              model = EXCLUDED.model;
            `,
      [userId, "openai", llmKey, llmModel]
    );

    if (ttsModel) {
      await client.query(
        `
            INSERT INTO tts (user_id, provider, key, model, active)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT(user_id)
            DO UPDATE SET
              provider = EXCLUDED.provider
              key = EXCLUDED.key
              model = EXCLUDED.model;
            `,
        [userId, "cartesia", ttsKey, ttsModel, true]
      );
    }
    await client.query("COMMIT");
    return { success: true };
  } catch (error) {
    console.error("Error while adding model keys and prefs to database.", error);
    await client.query("ROLLBACK");
  } finally {
    client.release();
  }
}

export async function updateSelectedModels(userId: string, newModelSelections: SelectedModels) {
  const client = await pool.connect();
  const { stt: newSttModel, llm: newLlmModel, tts: newTtsModel } = newModelSelections;

  // check if this user has entries for the particular model types
  const { rows } = await client.query(
    `
    SELECT stt.provider AS stt_provider, llm.provider AS llm_provider, tts.provider AS tts_provider
      FROM stt FULL OUTER JOIN llm ON stt.user_id = llm.user_id FULL OUTER JOIN tts ON stt.user_id = tts.user_id 
    WHERE stt.user_id = $1;
  `,
    [userId]
  );

  const modelSelections = rows[0];
  let hasStt: boolean, hasLlm: boolean, hasTts: boolean;
  if (!modelSelections) {
    hasStt = false;
    hasLlm = false;
    hasTts = false;
  } else {
    hasStt = !!modelSelections.stt_provider;
    hasLlm = !!modelSelections.llm_provider;
    hasTts = !!modelSelections.tts_provider;
  }

  try {
    await client.query("BEGIN");

    if (newSttModel) {
      if (hasStt) {
        // Update STT model
        await client.query(`UPDATE stt SET model = $1 WHERE user_id = $2`, [newSttModel, userId]);
      } else {
        // Insert STT model
        await client.query(
          `INSERT INTO stt (user_id, provider, key, model) VALUES ($1, $2, $3, $4);`,
          [userId, "deepgram", null, newSttModel]
        );
      }
    }

    if (newLlmModel) {
      if (hasLlm) {
        // Update LLM model
        await client.query(`UPDATE llm SET model = $1 WHERE user_id = $2`, [newLlmModel, userId]);
      } else {
        // Insert LLM model
        await client.query(
          `INSERT INTO llm (user_id, provider, key, model) VALUES ($1, $2, $3, $4);`,
          [userId, "openai", null, newLlmModel]
        );
      }
    }

    if (newTtsModel || newTtsModel === null) {
      if (hasTts) {
        // Update TTS model
        await client.query(`UPDATE tts SET model = $1 WHERE user_id = $2`, [newTtsModel, userId]);
      } else {
        // Insert TTS model
        await client.query(
          `INSERT INTO tts (user_id, provider, key, model) VALUES ($1, $2, $3, $4);`,
          [userId, "cartesia", null, newTtsModel]
        );
      }
    }
    await client.query("COMMIT");
    return { success: true };
  } catch (error) {
    console.error("Error while updating model selections in database.", error);
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
    console.error(error);
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
    console.error("Error while saving API keys to database.", error);
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
