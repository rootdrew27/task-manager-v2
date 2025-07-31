import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateUserConfiguration } from "@/lib/agent/setup";
import { SelectedModels } from "@/types/agent";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";

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
  const [successMessages, setSuccessMessages] = useState<string[]>([]);

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
        setSuccessMessages([`Your model selections were saved.`]);
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
        <div className="bg-red-50 border border-red-200 rounded-md p-2 mx-auto mb-2">
          <ul className="text-red-700 text-sm space-y-1">
            {errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {successMessages.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-md p-2 mr-auto w-[95%] mb-2">
          <ul className="text-green-700 text-sm space-y-1">
            {successMessages.map((msg, index) => (
              <li key={index}>• {msg}</li>
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
            <SelectTrigger className="bg-primary text-secondary">
              <SelectValue placeholder="Select a Deepgram model" />
            </SelectTrigger>
            <SelectContent className="bg-primary border-secondary text-secondary">
              {DEEPGRAM_MODELS.map((model) => (
                <SelectItem
                  key={model.id}
                  value={model.id}
                  className={
                    localSelectedModels.stt === model.id ? "bg-secondary/30 text-oxford-blue" : ""
                  }
                >
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
            <SelectTrigger className="bg-primary text-secondary">
              <SelectValue placeholder="Select an OpenAI model" />
            </SelectTrigger>
            <SelectContent className="bg-primary border-secondary text-secondary">
              {OPENAI_MODELS.map((model) => (
                <SelectItem
                  key={model.id}
                  value={model.id}
                  className={
                    localSelectedModels.llm === model.id ? "bg-secondary/30 text-oxford-blue" : ""
                  }
                >
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
            <SelectTrigger className="bg-primary text-secondary">
              <SelectValue placeholder="Select a Cartesia model or none" />
            </SelectTrigger>
            <SelectContent className="bg-primary border-secondary text-secondary">
              <SelectItem
                value="none"
                className={
                  localSelectedModels.tts === null || localSelectedModels.tts === "none"
                    ? "bg-secondary/30 text-oxford-blue"
                    : ""
                }
              >
                None
              </SelectItem>
              {CARTESIA_MODELS.map((model) => (
                <SelectItem
                  key={model.id}
                  value={model.id}
                  className={
                    localSelectedModels.tts === model.id ? "bg-secondary/30 text-oxford-blue" : ""
                  }
                >
                  {model.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2 justify-end">
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-primary hover:bg-primary/90 disabled:bg-battleship-gray disabled:cursor-not-allowed float-end text-secondary font-medium transition-colors h-8"
          >
            Save Selections
          </Button>
        </div>
      </form>
    </>
  );
}
