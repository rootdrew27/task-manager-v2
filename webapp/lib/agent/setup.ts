"use server";

import { OpenAI } from "openai";

interface ApiKeys {
  deepgram: string;
  openai: string;
  cartesia: string;
}

interface SelectedModels {
  deepgram: string;
  openai: string;
  cartesia?: string;
}

interface SetupData {
  apiKeys: ApiKeys;
  selectedModels: SelectedModels;
}

interface ValidationResult {
  isValid: boolean;
  errors?: string[];
  validatedServices?: string[];
  availableModels?: {
    openai: boolean;
    deepgram: boolean;
    cartesia: boolean;
  };
}

interface ConfigurationResult {
  isValid: boolean;
  errors?: string[];
}

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

function validateModelSelection(selectedModels: SelectedModels): {
  isValid: boolean;
  errors?: string[];
} {
  const errors: string[] = [];

  if (!selectedModels.openai || !VALID_MODELS.openai.includes(selectedModels.openai)) {
    errors.push(`Invalid OpenAI model`);
  }

  if (!selectedModels.deepgram || !VALID_MODELS.deepgram.includes(selectedModels.deepgram)) {
    errors.push(`Invalid Deepgram model`);
  }
  if (selectedModels.cartesia && !VALID_MODELS.cartesia.includes(selectedModels.cartesia)) {
    errors.push(`Invalid Cartesia model`);
  }

  return { isValid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
}

export async function validateApiKeys(apiKeys: ApiKeys): Promise<ValidationResult> {
  const errors: string[] = [];
  const validatedServices: string[] = [];

  // Validate API keys
  const validationPromises = [];

  if (apiKeys.openai.trim()) {
    validationPromises.push(
      validateOpenAIKey(apiKeys.openai).then((result) => ({
        service: "openai",
        ...result,
      }))
    );
  } else {
    validationPromises.push({
      service: "openai",
      isValid: false,
      error: "OpenAI API Key Required",
    });
  }

  if (apiKeys.deepgram.trim()) {
    validationPromises.push(
      validateDeepgramKey(apiKeys.deepgram).then((result) => ({
        service: "deepgram",
        ...result,
      }))
    );
  } else {
    validationPromises.push({
      service: "deepgram",
      isValid: false,
      error: "Deepgram API Key Required",
    });
  }

  if (apiKeys.cartesia.trim()) {
    validationPromises.push(
      validateCartesiaKey(apiKeys.cartesia).then((result) => ({
        service: "cartesia",
        ...result,
      }))
    );
  }

  const validationResults = await Promise.all(validationPromises);

  validationResults.forEach((result) => {
    if (result.isValid) {
      validatedServices.push(result.service);
    } else if (result.error) {
      errors.push(result.error);
    }
  });

  const isValid = errors.length === 0;

  const availableModels = {
    openai: validatedServices.includes("openai"),
    deepgram: validatedServices.includes("deepgram"),
    cartesia: validatedServices.includes("cartesia"),
  };

  return {
    isValid,
    errors: errors.length > 0 ? errors : undefined,
    validatedServices,
    availableModels,
  };
}

export async function saveConfiguration(data: SetupData): Promise<ConfigurationResult> {
  const { apiKeys, selectedModels } = data;
  const errors: string[] = [];

  // Validate model selections
  const modelValidation = validateModelSelection(selectedModels);
  if (!modelValidation.isValid && modelValidation.errors) {
    errors.push(...modelValidation.errors);
  }

  const isValid = errors.length === 0;

  if (isValid) {
    // TODO: Store validated keys and models in session/database
    console.log('Configuration "saved" successfully');
    console.log(
      "API Keys validated for:",
      Object.keys(apiKeys).filter((key) => apiKeys[key as keyof ApiKeys].trim())
    );
    console.log("Selected models:", selectedModels);
  }

  return {
    isValid,
    errors: errors.length > 0 ? errors : undefined,
  };
}
