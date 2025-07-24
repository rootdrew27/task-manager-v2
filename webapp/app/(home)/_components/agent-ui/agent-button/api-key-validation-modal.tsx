import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validateAndSaveApiKeys } from "@/lib/agent/setup";
import { ApiKeyValidity } from "@/types/agent";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { ChangeEvent, Dispatch, SetStateAction, useState } from "react";

// NOTE: This modal requires that all API Keys be submitted, and all must be valid to continue (this behavior differs from the settings modal).

export function APIKeyValidationModal({
  setApiKeyValidity,
  apiKeyValidity,
  onClose,
}: {
  setApiKeyValidity: Dispatch<SetStateAction<ApiKeyValidity | null>>;
  apiKeyValidity: ApiKeyValidity | null;
  onClose: () => void;
}) {
  const [apiKeys, setApiKeys] = useState({
    deepgram: apiKeyValidity?.stt ? undefined : "",
    openai: apiKeyValidity?.llm ? undefined : "",
    cartesia: apiKeyValidity?.tts ? undefined : "",
  });
  const [showPasswords, setShowPasswords] = useState({
    deepgram: false,
    openai: false,
    cartesia: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const handleChangeOpenAI = (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setApiKeys((prev) => ({ ...prev, openai: value }));
  };

  const handleChangeDeepgram = (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setApiKeys((prev) => ({ ...prev, deepgram: value }));
  };

  const handleChangeCartesia = (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setApiKeys((prev) => ({ ...prev, cartesia: value }));
  };

  const togglePasswordVisibility = (field: "deepgram" | "openai" | "cartesia") => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setErrors([]);

    // Validate required fields only if they're displayed (i.e. only if they're not already valid)
    const newErrors: string[] = [];
    if (!apiKeyValidity?.stt && (!apiKeys.deepgram || !apiKeys.deepgram.trim())) {
      newErrors.push("Deepgram API Key is required");
    }
    if (!apiKeyValidity?.llm && (!apiKeys.openai || !apiKeys.openai.trim())) {
      newErrors.push("OpenAI API Key is required");
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    try {
      const result = await validateAndSaveApiKeys(apiKeys);

      if (!result.isValid) {
        setErrors(result.errors || ["Unknown validation error"]);
      } else {
        setApiKeyValidity({ stt: true, llm: true, tts: apiKeys.cartesia ? true : false });
      }
    } catch (error) {
      console.error(error);
      setErrors(["Failed to validate API keys. Please try again."]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setErrors([]); // clear errors when opening modal
    onClose();
  };

  return (
    <>
      <Dialog open={true} onOpenChange={handleClose}>
        <DialogContent className="bg-secondary border-primary border-2 shadow-xl">
          <DialogHeader className="border-b border-white/90 pb-2">
            <DialogTitle className="text-primary text-xl font-semibold">
              Paste your API Keys
            </DialogTitle>
          </DialogHeader>

          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-md p-2 mb-2 mx-auto w-full">
              <ul className="text-red-700 text-sm space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid gap-4">
            {!apiKeyValidity?.stt && (
              <div className="grid gap-3">
                <Label htmlFor="deepgram-api-key" className="text-primary-text font-medium">
                  Deepgram API Key
                </Label>
                <div className="relative">
                  <Input
                    id="deepgram-api-key"
                    name="deepgram-api-key"
                    type={showPasswords.deepgram ? "text" : "password"}
                    placeholder=""
                    onChange={handleChangeDeepgram}
                    required
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
            )}
            {!apiKeyValidity?.llm && (
              <div className="grid gap-3">
                <Label htmlFor="openai-api-key" className="text-primary-text font-medium">
                  OpenAI API Key
                </Label>
                <div className="relative">
                  <Input
                    id="openai-api-key"
                    name="openai-api-key"
                    type={showPasswords.openai ? "text" : "password"}
                    placeholder=""
                    onChange={handleChangeOpenAI}
                    required
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
            )}
            {!apiKeyValidity?.tts && (
              <div className="grid gap-3">
                <Label htmlFor="cartesia-api-key" className="text-primary-text font-medium">
                  Cartesia API Key (Optional)
                </Label>
                <div className="relative">
                  <Input
                    id="cartesia-api-key"
                    name="cartesia-api-key"
                    type={showPasswords.cartesia ? "text" : "password"}
                    placeholder=""
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
            )}
            <div>
              <p className="pb-1 text-muted-dark text-xs">
                Note: Obtain each API Key from the respective provider&apos;s site.
              </p>
            </div>
            <div className="w-full">
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-primary hover:bg-primary/90 disabled:bg-battleship-gray disabled:cursor-not-allowed float-end text-secondary font-medium transition-colors h-8"
              >
                {isLoading ? "Validating..." : "Validate API Keys"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
