import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { clearAllApiKeys, validateAndSaveApiKeys } from "@/lib/agent/setup";
import { ApiKeyValidity } from "@/types/agent";
import { EyeIcon, EyeOffIcon, TrashIcon } from "lucide-react";
import { ChangeEvent, useState } from "react";
import { IoCheckmarkCircleSharp } from "react-icons/io5";

interface APIKeySelectionProps {
  apiKeyValidity: ApiKeyValidity | null;
  setApiKeyValidity: (validity: ApiKeyValidity | null) => void;
}

export function APIKeySelection({ apiKeyValidity, setApiKeyValidity }: APIKeySelectionProps) {
  const [apiKeys, setApiKeys] = useState<{
    deepgram: string | undefined;
    openai: string | undefined;
    cartesia: string | undefined;
  }>({
    deepgram: undefined,
    openai: undefined,
    cartesia: undefined,
  });
  const [showPasswords, setShowPasswords] = useState({
    deepgram: false,
    openai: false,
    cartesia: false,
  });
  const [successMessages, setSuccessMessages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const handleChangeOpenAI = (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setApiKeys((prev) => ({ ...prev, openai: value ?? undefined }));
  };

  const handleChangeDeepgram = (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setApiKeys((prev) => ({ ...prev, deepgram: value ?? undefined }));
  };

  const handleChangeCartesia = (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setApiKeys((prev) => ({ ...prev, cartesia: value ?? undefined }));
  };

  const togglePasswordVisibility = (field: "deepgram" | "openai" | "cartesia") => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setErrors([]);
    setSuccessMessages([]);

    try {
      if (apiKeys.deepgram || apiKeys.openai || apiKeys.cartesia) {
        const result = await validateAndSaveApiKeys(apiKeys);

        if (!result.isValid) {
          setErrors(result.errors || ["Unknown validation error"]);
          setApiKeys({ deepgram: undefined, openai: undefined, cartesia: undefined });
        } else {
          setApiKeys({ deepgram: undefined, openai: undefined, cartesia: undefined });
          if (result.validatedServices) {
            setSuccessMessages([
              `The (${result.validatedServices.toString()}) API keys were validated.`,
            ]);
          }
          // Refresh API key validity after successful validation
          setApiKeyValidity({
            stt: !!apiKeys.deepgram || (apiKeyValidity?.stt ?? false),
            llm: !!apiKeys.openai || (apiKeyValidity?.llm ?? false),
            tts: !!apiKeys.cartesia || (apiKeyValidity?.tts ?? false),
          });
        }
      } else {
        setErrors(["At least one key must be specified."]);
      }
    } catch (error) {
      console.error(error);
      setErrors(["Failed to validate API keys. Please try again."]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAllApiKeys = async () => {
    setIsClearing(true);
    setErrors([]);
    setSuccessMessages([]);

    try {
      const result = await clearAllApiKeys();

      if (result.success) {
        setSuccessMessages(["All API keys have been cleared successfully."]);
        setApiKeyValidity(null);
        setApiKeys({ deepgram: undefined, openai: undefined, cartesia: undefined });
      } else {
        setErrors([result.error || "Failed to clear API keys."]);
      }
    } catch (error) {
      console.error(error);
      setErrors(["Failed to clear API keys. Please try again."]);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <>
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-2 mb-2 mx-auto">
          <ul className="text-red-700 text-sm space-y-1">
            {errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {successMessages.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-md p-2 mb-2 mx-auto">
          <ul className="text-green-700 text-sm space-y-1">
            {successMessages.map((msg, index) => (
              <li key={index}>• {msg}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-4">
        <div className="grid gap-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="deepgram-api-key">Deepgram API Key</Label>
            {apiKeyValidity?.stt && <IoCheckmarkCircleSharp className="h-4 w-4 text-white" />}
          </div>
          <div className="relative">
            <Input
              id="deepgram-api-key"
              name="deepgram-api-key"
              type={showPasswords.deepgram ? "text" : "password"}
              placeholder=""
              value={apiKeys.deepgram || ""}
              onChange={handleChangeDeepgram}
              className="pr-10 bg-primary text-secondary"
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility("deepgram")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPasswords.deepgram ? (
                <EyeOffIcon className="h-4 w-4" />
              ) : (
                <EyeIcon className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
        <div className="grid gap-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="openai-api-key">OpenAI API Key</Label>
            {apiKeyValidity?.llm && <IoCheckmarkCircleSharp className="h-4 w-4 text-white" />}
          </div>
          <div className="relative">
            <Input
              id="openai-api-key"
              name="openai-api-key"
              type={showPasswords.openai ? "text" : "password"}
              placeholder=""
              value={apiKeys.openai || ""}
              onChange={handleChangeOpenAI}
              className="pr-10 bg-primary text-secondary"
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility("openai")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPasswords.openai ? (
                <EyeOffIcon className="h-4 w-4" />
              ) : (
                <EyeIcon className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
        <div className="grid gap-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="cartesia-api-key">Cartesia API Key (Optional)</Label>
            {apiKeyValidity?.tts && <IoCheckmarkCircleSharp className="h-4 w-4 text-white" />}
          </div>
          <div className="relative">
            <Input
              id="cartesia-api-key"
              name="cartesia-api-key"
              type={showPasswords.cartesia ? "text" : "password"}
              placeholder=""
              value={apiKeys.cartesia || ""}
              onChange={handleChangeCartesia}
              className="pr-10 bg-primary text-secondary"
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility("cartesia")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPasswords.cartesia ? (
                <EyeOffIcon className="h-4 w-4" />
              ) : (
                <EyeIcon className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
        <div className="pb-1 text-muted-dark text-xs">
          <p>
            Note: Providers for which you have previously entered a valid key will have checkmark
            near the name.
          </p>
        </div>
        <div className="flex justify-between">
          <Button
            type="button"
            onClick={handleClearAllApiKeys}
            disabled={
              isClearing || (!apiKeyValidity?.stt && !apiKeyValidity?.llm && !apiKeyValidity?.tts)
            }
            className="flex items-center bg-oxford-blue hover:bg-oxford-blue/90 disabled:bg-battleship-gray disabled:cursor-not-allowed text-primary font-medium h-8 gap-1 transition-colors"
          >
            <TrashIcon className="h-4 w-4" />
            {isClearing ? "Clearing..." : "Clear All"}
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-primary hover:bg-primary/90 disabled:bg-battleship-gray disabled:cursor-not-allowed text-secondary font-medium h-8 transition-colors"
          >
            {isLoading ? "Validating..." : "Validate Keys"}
          </Button>
        </div>
      </form>
    </>
  );
}
