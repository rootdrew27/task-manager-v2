import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validateApiKeys } from "@/lib/agent/setup";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { ChangeEvent, useState } from "react";
import { ModelSelectionModal } from "./model-selection-modal";

export function APIKeyValidationModal({
  children,
  setConfigStatus,
}: {
  children: React.ReactNode;
  setConfigStatus: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const [apiKeys, setApiKeys] = useState({
    deepgram: "",
    openai: "",
    cartesia: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    deepgram: false,
    openai: false,
    cartesia: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [showModelSelection, setShowModelSelection] = useState(false);
  const [availableModels, setAvailableModels] = useState<{
    openai: boolean;
    deepgram: boolean;
    cartesia: boolean;
  }>();

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

    // Validate required fields
    const newErrors: string[] = [];
    if (!apiKeys.deepgram.trim()) {
      newErrors.push("Deepgram API Key is required");
    }
    if (!apiKeys.openai.trim()) {
      newErrors.push("OpenAI API Key is required");
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    try {
      const result = await validateApiKeys(apiKeys);

      if (result.isValid) {
        setAvailableModels(result.availableModels);
        setShowModelSelection(true);
      } else {
        setErrors(result.errors || ["Unknown validation error"]);
      }
    } catch (error) {
      console.error(error);
      setErrors(["Failed to validate API keys. Please try again."]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModelSelectionComplete = (isSuccess: boolean) => {
    setConfigStatus(isSuccess);
  };

  return (
    <>
      <Dialog>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Paste your API Keys</DialogTitle>
            <DialogDescription className="muted">
              Note: Obtain your API Keys from the respective sites.
            </DialogDescription>
          </DialogHeader>

          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <ul className="text-red-700 text-sm space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-3">
              <Label htmlFor="deepgram-api-key">Deepgram API Key *</Label>
              <div className="relative">
                <Input
                  id="deepgram-api-key"
                  name="deepgram-api-key"
                  type={showPasswords.deepgram ? "text" : "password"}
                  placeholder=""
                  onChange={handleChangeDeepgram}
                  required
                  className="pr-10"
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
              <Label htmlFor="openai-api-key">OpenAI API Key *</Label>
              <div className="relative">
                <Input
                  id="openai-api-key"
                  name="openai-api-key"
                  type={showPasswords.openai ? "text" : "password"}
                  placeholder=""
                  onChange={handleChangeOpenAI}
                  required
                  className="pr-10"
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
              <Label htmlFor="cartesia-api-key">Cartesia API Key (Optional)</Label>
              <div className="relative">
                <Input
                  id="cartesia-api-key"
                  name="cartesia-api-key"
                  type={showPasswords.cartesia ? "text" : "password"}
                  placeholder=""
                  onChange={handleChangeCartesia}
                  className="pr-10"
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
            <button
              type="submit"
              disabled={isLoading}
              className="w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              {isLoading ? "Validating..." : "Validate API Keys"}
            </button>
          </form>
        </DialogContent>
      </Dialog>

      {showModelSelection && availableModels && (
        <ModelSelectionModal
          availableModels={availableModels}
          apiKeys={apiKeys}
          onComplete={handleModelSelectionComplete}
        />
      )}
    </>
  );
}
