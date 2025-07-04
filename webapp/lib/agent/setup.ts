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
  cartesia: string;
}

interface SetupData {
  apiKeys: ApiKeys;
  selectedModels: SelectedModels;
}

interface ValidationResult {
  isValid: boolean;
  errors?: string[];
  validatedServices?: string[];
}

const VALID_MODELS = {
  openai: ["gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"],
  deepgram: ["nova-2", "nova", "whisper-large"],
  cartesia: ["sonic-english", "sonic-multilingual"]
};

async function validateOpenAIKey(apiKey: string): Promise<{ isValid: boolean; error?: string }> {
  try {
    const client = new OpenAI({ apiKey });
    await client.models.list();
    return { isValid: true };
  } catch (error) {
    return { isValid: false, error: "Invalid OpenAI API key" };
  }
}

async function validateDeepgramKey(apiKey: string): Promise<{ isValid: boolean; error?: string }> {
  try {
    const response = await fetch('https://api.deepgram.com/v1/models', {
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      return { isValid: false, error: "Invalid Deepgram API key" };
    }
    
    return { isValid: true };
  } catch (error) {
    return { isValid: false, error: "Failed to validate Deepgram API key" };
  }
}

async function validateCartesiaKey(apiKey: string): Promise<{ isValid: boolean; error?: string }> {
  try {
    const response = await fetch('https://api.cartesia.ai/voices', {
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      return { isValid: false, error: "Invalid Cartesia API key" };
    }
    
    return { isValid: true };
  } catch (error) {
    return { isValid: false, error: "Failed to validate Cartesia API key" };
  }
}

function validateModelSelection(selectedModels: SelectedModels): { isValid: boolean; errors?: string[] } {
  const errors: string[] = [];
  
  if (selectedModels.openai && !VALID_MODELS.openai.includes(selectedModels.openai)) {
    errors.push(`Invalid OpenAI model: ${selectedModels.openai}`);
  }
  
  if (selectedModels.deepgram && !VALID_MODELS.deepgram.includes(selectedModels.deepgram)) {
    errors.push(`Invalid Deepgram model: ${selectedModels.deepgram}`);
  }
  
  if (selectedModels.cartesia && !VALID_MODELS.cartesia.includes(selectedModels.cartesia)) {
    errors.push(`Invalid Cartesia model: ${selectedModels.cartesia}`);
  }
  
  return { isValid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
}

export async function handleKeysAndModels(data: SetupData): Promise<ValidationResult> {
  const { apiKeys, selectedModels } = data;
  const errors: string[] = [];
  const validatedServices: string[] = [];
  
  // Validate model selections first
  const modelValidation = validateModelSelection(selectedModels);
  if (!modelValidation.isValid && modelValidation.errors) {
    errors.push(...modelValidation.errors);
  }
  
  // Validate API keys
  const validationPromises = [];
  
  if (apiKeys.openai.trim()) {
    validationPromises.push(
      validateOpenAIKey(apiKeys.openai).then(result => ({
        service: 'openai',
        ...result
      }))
    );
  }
  
  if (apiKeys.deepgram.trim()) {
    validationPromises.push(
      validateDeepgramKey(apiKeys.deepgram).then(result => ({
        service: 'deepgram',
        ...result
      }))
    );
  }
  
  if (apiKeys.cartesia.trim()) {
    validationPromises.push(
      validateCartesiaKey(apiKeys.cartesia).then(result => ({
        service: 'cartesia',
        ...result
      }))
    );
  }
  
  const validationResults = await Promise.all(validationPromises);
  
  validationResults.forEach(result => {
    if (result.isValid) {
      validatedServices.push(result.service);
    } else if (result.error) {
      errors.push(result.error);
    }
  });
  
  // Check if at least OpenAI and Deepgram are valid (required services)
  const hasRequiredServices = validatedServices.includes('openai') && validatedServices.includes('deepgram');
  
  if (!hasRequiredServices) {
    if (!validatedServices.includes('openai')) {
      errors.push('Valid OpenAI API key is required');
    }
    if (!validatedServices.includes('deepgram')) {
      errors.push('Valid Deepgram API key is required');
    }
  }
  
  const isValid = errors.length === 0 && hasRequiredServices;
  
  if (isValid) {
    // TODO: Store validated keys and models in session/database
    console.log('Validated services:', validatedServices);
    console.log('Selected models:', selectedModels);
  }
  
  return {
    isValid,
    errors: errors.length > 0 ? errors : undefined,
    validatedServices
  };
}