import { pool } from "@/db/connect";
import { validateApiKeys } from "@/lib/agent/setup";
import { ApiKeys, SelectedModels } from "@/types/agent";

export async function saveModelKeysAndPreferences(
  userId: string,
  apiKeys: ApiKeys,
  modelSelections: SelectedModels
) {
  const client = await pool.connect();
  const { deepgram: sttKey, openai: llmKey, cartesia: cartesiaKey } = apiKeys;
  const { deepgram: sttModel, openai: llmModel, cartesia: cartesiaModel } = modelSelections;
  try {
    await client.query("BEGIN");

    await client.query(
      `
            INSERT INTO stt (user_id, provider, key, model)
            VALUES ($1, $2, $3, $4)
            `,
      [userId, "deepgram", sttKey, sttModel]
    );

    await client.query(
      `
            INSERT INTO llm (user_id, provider, key, model)
            VALUES ($1, $2, $3, $4)
            `,
      [userId, "openai", llmKey, llmModel]
    );

    if (cartesiaModel) {
      await client.query(
        `
            INSERT INTO tts (user_id, provider, key, model, active)
            VALUES ($1, $2, $3, $4, $5)
            `,
        [userId, "cartesia", cartesiaKey, cartesiaModel, true]
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

export async function getSelectedModelsAndValidateApiKeys(userId: string) {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `
      SELECT stt.model AS stt_model, stt.key AS stt_key, llm.model AS llm_model, llm.key AS llm_key, tts.model AS tts_model, tts.key AS tts_key
      FROM stt JOIN llm ON stt.user_id = llm.user_id
      LEFT JOIN tts ON stt.user_id = tts.user_id
      WHERE stt.user_id = $1;
      `,
      [userId]
    );

    const {
      stt_model: sttModel,
      stt_key: sttKey,
      llm_model: llmModel,
      llm_key: llmKey,
      tts_model: ttsModel,
      tts_key: ttsKey,
    } = rows[0];
    const { isValid } = await validateApiKeys({
      deepgram: sttKey,
      openai: llmKey,
      cartesia: ttsKey ?? "",
    });

    if (isValid) {
      return { deepgram: sttModel, openai: llmModel, cartesia: ttsModel } as SelectedModels;
    }

    return null;
  } catch (error) {
    throw error;
  }
}
