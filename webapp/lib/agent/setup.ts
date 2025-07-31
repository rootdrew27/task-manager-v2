"use server";

import {
  saveApiKeys,
  saveModelKeysAndPreferences,
  validateConfigByUserId,
} from "@/db/agent-config";
import { upsertSelectedModels } from "@/db/agent-config";
import * as agentConfigDB from "@/db/agent-config";
import { pool } from "@/db/connect";
import { logger } from "@/lib/logger";
import { ApiKeys, ConfigurationResult, SelectedModels, SetupData } from "@/types/agent";
import { OpenAI } from "openai";
import { getUserId } from "../auth/utils";

const VALID_MODELS = {
  openai: ["gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"],
  deepgram: ["nova-3", "nova-2", "nova", "whisper-large"],
  cartesia: ["sonic-english"],
};

async function validateOpenAIKey(apiKey: string): Promise<{ isValid: boolean; error?: string }> {
  try {
    const client = new OpenAI({ apiKey });
    await client.models.list();
    return { isValid: true };
  } catch (error) {
    logger.agentConfig("error", "Error while validating OpenAI API Key", {
      metadata: {
        operation: "validateOpenAIKey",
        error: error instanceof Error ? error.message : String(error),
      },
    });
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
    logger.agentConfig("error", "Error while validating Deepgram API Key", {
      metadata: {
        operation: "validateDeepgramKey",
        error: error instanceof Error ? error.message : String(error),
      },
    });
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
    logger.agentConfig("error", "Error while validating Cartesia API Key", {
      metadata: {
        operation: "validateCartesiaKey",
        error: error instanceof Error ? error.message : String(error),
      },
    });
    return { isValid: false, error: "Failed to validate Cartesia API key" };
  }
}

export async function validateSelectedModels(selectedModels: SelectedModels): Promise<{
  success: boolean;
  errors?: string[];
}> {
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

  return { success: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
}

export async function validateAndSaveApiKeys(apiKeys: ApiKeys) {
  const userId = await getUserId();
  try {
    const { validatedServices, errors } = await validateApiKeys(apiKeys);

    if (errors) {
      return { isValid: false, errors: errors };
    }

    const deepgramKeyToSave = validatedServices.includes("deepgram") ? apiKeys.deepgram : undefined;
    const openaiKeyToSave = validatedServices.includes("openai") ? apiKeys.openai : undefined;
    const cartesiaKeyToSave = validatedServices.includes("cartesia") ? apiKeys.cartesia : undefined;

    const apiKeysToSave: ApiKeys = {
      deepgram: deepgramKeyToSave,
      openai: openaiKeyToSave,
      cartesia: cartesiaKeyToSave,
    };

    await saveApiKeys(apiKeysToSave, userId);

    return { isValid: true, validatedServices };
  } catch (error) {
    logger.agentConfig("error", "Error during API key validation and saving", {
      metadata: {
        operation: "validateAndSaveApiKeys",
        userId: userId,
        error: error instanceof Error ? error.message : String(error),
      },
    });
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

export async function saveConfiguration(data: SetupData): Promise<ConfigurationResult> {
  const { apiKeys, selectedModels } = data;
  const errors: string[] = [];

  // Validate model selections
  const modelValidation = await validateSelectedModels(selectedModels);
  if (!modelValidation.success && modelValidation.errors) {
    errors.push(...modelValidation.errors);
  }

  const isValid = errors.length === 0;

  if (isValid) {
    const userId = await getUserId();
    await saveModelKeysAndPreferences(userId, apiKeys, selectedModels);
    logger.agentConfig("info", "Configuration saved successfully", {
      userId,
      metadata: {
        operation: "saveConfiguration",
        selectedModels,
      },
    });
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
    logger.agentConfig("error", "Error during config validation", {
      metadata: {
        operation: "validateConfig",
        userId,
        error: error instanceof Error ? error.message : String(error),
      },
    });
    throw error;
  }
}

export async function clearAllApiKeys(): Promise<{ success: boolean; error?: string }> {
  const userId = await getUserId();
  if (!userId) {
    return { success: false, error: "User not found" };
  }
  try {
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
    logger.agentConfig("error", "Error clearing API keys", {
      metadata: {
        operation: "clearAllApiKeys",
        userId: userId,
        error: error instanceof Error ? error.message : String(error),
      },
    });
    return { success: false, error: "Failed to clear API keys" };
  }
}

export async function getSelectedModels(userId?: string): Promise<SelectedModels | null> {
  try {
    if (!userId) {
      userId = await getUserId();
      if (!userId) {
        throw new Error("No user!");
      }
    }
    return await agentConfigDB.getSelectedModels(userId);
  } catch (error) {
    logger.agentConfig("error", "Error getting selected models", {
      metadata: {
        operation: "getSelectedModels",
        userId,
        error: error instanceof Error ? error.message : String(error),
      },
    });
    throw error;
  }
}

export async function updateUserConfiguration(
  selectedModels: SelectedModels
): Promise<{ success: boolean; errors?: string[] }> {
  const userId = await getUserId();
  try {
    const result = await upsertSelectedModels(userId, selectedModels);

    return { success: result.success };
  } catch (error) {
    logger.agentConfig("error", "Failed to update user configuration", {
      metadata: {
        operation: "updateUserConfiguration",
        userId,
        selectedModels,
        error: error instanceof Error ? error.message : String(error),
      },
    });
    return {
      success: false,
      errors: ["Failed to update configuration. Please try again."],
    };
  }
}

export async function validateCurrentApiKeys() {
  const userId = await getUserId();

  try {
    return agentConfigDB.validateCurrentApiKeys(userId);
  } catch (error) {
    throw error;
  }
}
