export interface ApiKeys {
  deepgram: string;
  openai: string;
  cartesia: string;
}

export interface SelectedModels {
  deepgram: string;
  openai: string;
  cartesia?: string;
}

export interface SetupData {
  apiKeys: ApiKeys;
  selectedModels: SelectedModels;
}

export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
  validatedServices?: string[];
  availableModels?: {
    openai: boolean;
    deepgram: boolean;
    cartesia: boolean;
  };
}

export interface ConfigurationResult {
  isValid: boolean;
  errors?: string[];
}
