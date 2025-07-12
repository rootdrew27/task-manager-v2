import { pool } from "@/db/connect";
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
