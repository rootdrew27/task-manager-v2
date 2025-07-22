export interface ApiKeys {
  deepgram?: string;
  openai?: string;
  cartesia?: string;
}

export interface ApiKeyValidity {
  stt: boolean;
  llm: boolean;
  tts: boolean;
}

export interface SelectedModels {
  stt?: string;
  llm?: string;
  tts?: string | null;
}

export interface SetupData {
  apiKeys: ApiKeys;
  selectedModels: SelectedModels;
}

export interface ConfigurationResult {
  isValid: boolean;
  errors?: string[];
}
