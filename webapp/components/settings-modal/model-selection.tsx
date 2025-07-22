import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateUserConfiguration } from "@/lib/agent/user-config";
import { SelectedModels } from "@/types/agent";
import { useEffect, useState } from "react";

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

interface ModelSelectionProps {
  selectedModels: SelectedModels | null;
  setSelectedModels: (models: SelectedModels | null) => void;
}

export function ModelSelection({ selectedModels, setSelectedModels }: ModelSelectionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Local state for temporary selections (resets when modal closes)
  const [localSelectedModels, setLocalSelectedModels] = useState<SelectedModels>({
    llm: selectedModels?.llm || "",
    stt: selectedModels?.stt || "",
    tts: selectedModels?.tts || null,
  });

  // Reset local state when parent selectedModels changes (modal reopens)
  useEffect(() => {
    setLocalSelectedModels({
      llm: selectedModels?.llm || "",
      stt: selectedModels?.stt || "",
      tts: selectedModels?.tts || null,
    });
  }, [selectedModels]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setErrors([]);

    try {
      const updatedModels: SelectedModels = {
        llm: localSelectedModels.llm || "",
        stt: localSelectedModels.stt || "",
        tts: localSelectedModels.tts === "none" ? null : localSelectedModels.tts,
      };

      const result = await updateUserConfiguration(updatedModels);

      if (!result.success) {
        setErrors(result.errors || ["Failed to update configuration"]);
      } else {
        // Only update parent state on successful save
        setSelectedModels(updatedModels);
      }
    } catch (error) {
      console.error(error);
      setErrors(["Failed to save configuration. Please try again."]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
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
        <div className="pr-6">
          <Label htmlFor="deepgram-model">Speech-to-Text Model</Label>
          <Select
            value={localSelectedModels.stt || ""}
            onValueChange={(value) =>
              setLocalSelectedModels({ ...localSelectedModels, stt: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a Deepgram model" />
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

        <div className="pr-6">
          <Label htmlFor="openai-model">Language Model</Label>
          <Select
            value={localSelectedModels.llm || ""}
            onValueChange={(value) =>
              setLocalSelectedModels({ ...localSelectedModels, llm: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an OpenAI model" />
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

        <div className="pr-6">
          <Label htmlFor="cartesia-model">Text-to-Speech Model (Optional)</Label>
          <Select
            value={localSelectedModels.tts || "none"}
            onValueChange={(value) =>
              setLocalSelectedModels({
                ...localSelectedModels,
                tts: value === "none" ? null : value,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a Cartesia model or none" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {CARTESIA_MODELS.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  {model.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2 justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-md transition-colors"
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </>
  );
}
