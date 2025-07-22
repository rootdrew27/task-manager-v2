"use server";

import {
  saveApiKeys,
  saveModelKeysAndPreferences,
  updateSelectedModels,
  validateConfigByUserId,
} from "@/db/agent-config";
import { pool } from "@/db/connect";
import { ApiKeys, ConfigurationResult, SelectedModels, SetupData } from "@/types/agent";
import { OpenAI } from "openai";
import { getUserId } from "../auth/utils";

const VALID_MODELS = {
  openai: ["gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"],
  deepgram: ["nova-3", "nova-2", "nova", "whisper-large"],
  cartesia: ["sonic-english", "sonic-multilingual"],
};

async function validateOpenAIKey(apiKey: string): Promise<{ isValid: boolean; error?: string }> {
  try {
    const client = new OpenAI({ apiKey });
    await client.models.list();
    return { isValid: true };
  } catch (error) {
    console.error("Error while validating OpenAI API Key. ", error);
    return { isValid: false, error: "Invalid OpenAI API key" };
  }
}

async function validateDeepgramKey(apiKey: string): Promise<{ isValid: boolean; error?: string }> {
  try {
    const response = await fetch("https://api.deepgram.com/v1/auth/token", {
      headers: {
        Authorization: `Token ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return { isValid: false, error: "Invalid Deepgram API key" };
    }

    return { isValid: true };
  } catch (error) {
    console.error("Error while validating Deepgram API Key. ", error);
    return { isValid: false, error: "Failed to validate Deepgram API key" };
  }
}

async function validateCartesiaKey(apiKey: string): Promise<{ isValid: boolean; error?: string }> {
  try {
    const response = await fetch("https://api.cartesia.ai/voices", {
      headers: {
        "X-API-Key": apiKey,
        "Content-Type": "application/json",
        "Cartesia-Version": "2025-04-16",
      },
    });

    if (!response.ok) {
      return { isValid: false, error: "Invalid Cartesia API key" };
    }

    return { isValid: true };
  } catch (error) {
    console.error("Error while validating Cartesia API Key. ", error);
    return { isValid: false, error: "Failed to validate Cartesia API key" };
  }
}

function validateSelectedModels(selectedModels: SelectedModels): {
  isValid: boolean;
  errors?: string[];
} {
  const errors: string[] = [];

  if (!selectedModels.llm || !VALID_MODELS.openai.includes(selectedModels.llm)) {
    errors.push(`Invalid OpenAI model`);
  }

  if (!selectedModels.stt || !VALID_MODELS.deepgram.includes(selectedModels.stt)) {
    errors.push(`Invalid Deepgram model`);
  }
  if (selectedModels.tts && !VALID_MODELS.cartesia.includes(selectedModels.tts ?? "")) {
    errors.push(`Invalid Cartesia model`);
  }

  return { isValid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
}

export async function validateAndSaveApiKeys(apiKeys: ApiKeys) {
  try {
    const { validatedServices, errors } = await validateApiKeys(apiKeys);

    if (errors) {
      return { isValid: false, errors: errors };
    }

    const deepgramKeyToSave = validatedServices.includes("deepgram") ? apiKeys.deepgram : undefined;
    const openaiKeyToSave = validatedServices.includes("openai") ? apiKeys.openai : undefined;
    const cartesiaKeyToSave = validatedServices.includes("cartesia") ? apiKeys.cartesia : undefined;

    const userId = await getUserId();

    const apiKeysToSave: ApiKeys = {
      deepgram: deepgramKeyToSave,
      openai: openaiKeyToSave,
      cartesia: cartesiaKeyToSave,
    };

    await saveApiKeys(apiKeysToSave, userId);

    return { isValid: true, validatedServices };
  } catch (error) {
    console.error(error);
    return { isValid: false, errors: ["Unknown error occurred."] };
  }
}

type Service = "deepgram" | "openai" | "cartesia";
interface ValidationResult {
  service: Service;
  isValid: boolean;
  error?: string;
}

type ValidationPromise =
  | Promise<{
      service: Service;
      isValid: boolean;
      error?: string;
    }>
  | {
      service: Service;
      isValid: boolean;
      error?: string;
    };

export async function validateApiKeys(apiKeys: ApiKeys) {
  const errors: string[] = [];
  const validatedServices: Service[] = [];

  // Validate API keys
  const validationPromises: ValidationPromise[] = [];

  if (typeof apiKeys.openai === "string") {
    validationPromises.push(
      validateOpenAIKey(apiKeys.openai).then((result) => ({
        service: "openai",
        ...result,
      }))
    );
  }

  if (typeof apiKeys.deepgram === "string") {
    validationPromises.push(
      validateDeepgramKey(apiKeys.deepgram).then((result) => ({
        service: "deepgram",
        ...result,
      }))
    );
  }

  if (typeof apiKeys.cartesia === "string" && apiKeys.cartesia !== "") {
    validationPromises.push(
      validateCartesiaKey(apiKeys.cartesia).then((result) => ({
        service: "cartesia",
        ...result,
      }))
    );
  }

  const validationResults: ValidationResult[] = await Promise.all(validationPromises);

  validationResults.forEach((result) => {
    if (result.isValid) {
      validatedServices.push(result.service);
    } else if (result.error) {
      errors.push(result.error);
    }
  });

  const isValid = errors.length === 0;

  return {
    isValid,
    errors: errors.length > 0 ? errors : undefined,
    validatedServices,
  };
}

export async function saveSelectedModels(selectedModels: SelectedModels) {
  try {
    const result = validateSelectedModels(selectedModels);

    if (!result.isValid) {
      return result;
    }

    const userId = await getUserId();

    await updateSelectedModels(userId, selectedModels);

    return result;
  } catch (error) {
    console.error(error);
    return { isValid: false, errors: ["Unknown error occurred."] };
  }
}

export async function saveConfiguration(data: SetupData): Promise<ConfigurationResult> {
  const { apiKeys, selectedModels } = data;
  const errors: string[] = [];

  // Validate model selections
  const modelValidation = validateSelectedModels(selectedModels);
  if (!modelValidation.isValid && modelValidation.errors) {
    errors.push(...modelValidation.errors);
  }

  const isValid = errors.length === 0;

  if (isValid) {
    const userId = await getUserId();
    await saveModelKeysAndPreferences(userId, apiKeys, selectedModels);
    console.log('Configuration "saved" successfully');
    console.log("Selected models:", selectedModels);
  }

  return {
    isValid,
    errors: errors.length > 0 ? errors : undefined,
  };
}

export async function validateConfig(userId?: string) {
  try {
    if (!userId) {
      userId = await getUserId();
      if (!userId) {
        throw new Error("No user!");
      }
    }

    return await validateConfigByUserId(userId);
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function clearAllApiKeys(): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getUserId();
    if (!userId) {
      return { success: false, error: "User not found" };
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Clear API keys by setting them to NULL
      await client.query(`UPDATE stt SET key = NULL WHERE user_id = $1`, [userId]);
      await client.query(`UPDATE llm SET key = NULL WHERE user_id = $1`, [userId]);
      await client.query(`UPDATE tts SET key = NULL WHERE user_id = $1`, [userId]);

      await client.query("COMMIT");
      return { success: true };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error clearing API keys:", error);
    return { success: false, error: "Failed to clear API keys" };
  }
}
