import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { saveConfiguration } from "@/lib/agent/setup";
import { useState } from "react";

// Predetermined model options
const OPENAI_MODELS = [
  { id: "gpt-4o", name: "GPT-4o" },
  { id: "gpt-4o-mini", name: "GPT-4o Mini" },
  { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo" },
];

const DEEPGRAM_MODELS = [
  { id: "nova-3", name: "Nova-3" },
  { id: "nova-2", name: "Nova-2" },
  { id: "nova", name: "Nova" },
  { id: "whisper-large", name: "Whisper Large" },
];

const CARTESIA_MODELS = [
  { id: "sonic-english", name: "Sonic English" },
  { id: "sonic-multilingual", name: "Sonic Multilingual" },
];

export function ModelSelectionModal({
  availableModels,
  apiKeys,
  onComplete,
}: {
  availableModels: { openai: boolean; deepgram: boolean; cartesia: boolean };
  apiKeys: { deepgram: string; openai: string; cartesia: string };
  onComplete: (isSuccess: boolean) => void;
}) {
  const [selectedOpenaiModel, setSelectedOpenaiModel] = useState<string>("");
  const [selectedDeepgramModel, setSelectedDeepgramModel] = useState<string>("");
  const [selectedCartesiaModel, setSelectedCartesiaModel] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setErrors([]);

    try {
      const result = await saveConfiguration({
        apiKeys,
        selectedModels: {
          deepgram: selectedDeepgramModel,
          openai: selectedOpenaiModel,
          cartesia: availableModels.cartesia ? selectedCartesiaModel : "",
        },
      });

      if (result.isValid) {
        onComplete(true);
      } else {
        setErrors(result.errors || ["Unknown validation error"]);
      }
    } catch (error) {
      console.error(error);
      setErrors(["Failed to save configuration. Please try again."]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={true}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Models</DialogTitle>
          <DialogDescription className="muted">
            Choose the models you want to use for each service.
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
          {availableModels.deepgram && (
            <div className="pr-6">
              <Label htmlFor="deepgram-model">Select Deepgram Model</Label>
              <Select value={selectedDeepgramModel} onValueChange={setSelectedDeepgramModel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {DEEPGRAM_MODELS.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {availableModels.openai && (
            <div className="pr-6">
              <Label htmlFor="openai-model">Select OpenAI Model</Label>
              <Select value={selectedOpenaiModel} onValueChange={setSelectedOpenaiModel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {OPENAI_MODELS.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {availableModels.cartesia && (
            <div className="pr-6">
              <Label htmlFor="cartesia-model">Select Cartesia Model</Label>
              <Select value={selectedCartesiaModel} onValueChange={setSelectedCartesiaModel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {CARTESIA_MODELS.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            {isLoading ? "Saving..." : "Save Configuration"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
