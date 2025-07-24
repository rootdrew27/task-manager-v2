import { Button } from "@/components/ui/button";
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
import { saveSelectedModels } from "@/lib/agent/setup";
import { SelectedModels } from "@/types/agent";
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
  withCartesia,
  selectedModels,
  onComplete,
  onClose,
}: {
  withCartesia: boolean;
  selectedModels: SelectedModels | null;
  onComplete: () => void;
  onClose: () => void;
}) {
  const [selectedOpenaiModel, setSelectedOpenaiModel] = useState<string>(selectedModels?.llm ?? "");
  const [selectedDeepgramModel, setSelectedDeepgramModel] = useState<string>(
    selectedModels?.stt ?? ""
  );
  const [selectedCartesiaModel, setSelectedCartesiaModel] = useState<string>(
    selectedModels?.tts ?? ""
  );
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setErrors([]);

    try {
      const result = await saveSelectedModels({
        stt: selectedDeepgramModel,
        llm: selectedOpenaiModel,
        tts: selectedCartesiaModel,
      });

      if (result.isValid) {
        onComplete();
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

  const handleClose = () => {
    setErrors([]);
    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={handleClose}>
      <DialogContent className="bg-secondary border-primary border-2 shadow-xl">
        <DialogHeader className="border-b border-white/90 pb-2 w-11/12">
          <DialogTitle className="text-primary text-xl font-semibold">Select Models</DialogTitle>
          <DialogDescription className="text-secondary-text">
            Choose the models you want to use for each service.
          </DialogDescription>
        </DialogHeader>

        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-md p-2 mb-2 mx-auto">
            <ul className="text-red-700 text-sm space-y-1">
              {errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="pr-6">
            <Label htmlFor="deepgram-model" className="text-oxford-blue font-medium">
              Select Deepgram Model
            </Label>
            <Select value={selectedDeepgramModel} onValueChange={setSelectedDeepgramModel}>
              <SelectTrigger className="bg-primary text-secondary">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent className="bg-primary border-secondary text-secondary">
                {DEEPGRAM_MODELS.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="pr-6">
            <Label htmlFor="openai-model" className="text-oxford-blue font-medium">
              Select OpenAI Model
            </Label>
            <Select value={selectedOpenaiModel} onValueChange={setSelectedOpenaiModel}>
              <SelectTrigger className="bg-primary text-secondary">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent className="bg-primary border-secondary text-secondary">
                {OPENAI_MODELS.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {withCartesia && (
            <div className="pr-6">
              <Label htmlFor="cartesia-model" className="text-oxford-blue font-medium">
                Select Cartesia Model
              </Label>
              <Select value={selectedCartesiaModel} onValueChange={setSelectedCartesiaModel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent className="bg-primary border-secondary text-secondary">
                  {CARTESIA_MODELS.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="w-full">
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-primary hover:bg-primary/90 disabled:bg-battleship-gray disabled:cursor-not-allowed float-end text-secondary font-medium h-8 transition-colors"
            >
              Start
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
