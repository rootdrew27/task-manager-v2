
import React, {ChangeEvent, useCallback, useState} from "react";
import debounce from 'lodash.debounce';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RiChatVoiceAiLine } from "react-icons/ri";
import { handleKeysAndModels } from "@/lib/agent/setup";

// Predetermined model options
const OPENAI_MODELS = [
  { id: "gpt-4o", name: "GPT-4o" },
  { id: "gpt-4o-mini", name: "GPT-4o Mini" },
  { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo" }
];

const DEEPGRAM_MODELS = [
  { id: "nova-2", name: "Nova-2" },
  { id: "nova", name: "Nova" },
  { id: "whisper-large", name: "Whisper Large" }
];

const CARTESIA_MODELS = [
  { id: "sonic-english", name: "Sonic English" },
  { id: "sonic-multilingual", name: "Sonic Multilingual" }
];



export function AgentButton(props: {onConnectButtonClicked: () => void}) {
  const [isValidConfig, setIsValidConfig] = useState(false);

  if (isValidConfig){
    return (
      <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.8 }}
          transition={{ duration: 0.4, delay: 0 }}
          className="text-center uppercase bg-white flex items-center justify-center text-black rounded-full h-[50px] w-[50px]"
          onClick={() => props.onConnectButtonClicked()}
        >
          <RiChatVoiceAiLine className="h-6 w-6" />
      </motion.button>
    )
  }
  else {
    return (
      <APIKeyModal setConfigStatus={setIsValidConfig}>
        <motion.button
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.8 }}
            transition={{ duration: 0.4, delay: 0 }}
            className="text-center uppercase bg-white flex items-center justify-center text-black rounded-full h-[50px] w-[50px]"
          >
            <RiChatVoiceAiLine className="h-6 w-6" />
        </motion.button>
      </APIKeyModal>
    )
  }
} 

export function APIKeyModal({children, setConfigStatus}: {  children: React.ReactNode, setConfigStatus: React.Dispatch<React.SetStateAction<boolean>>  }){
  const [selectedOpenaiModel, setSelectedOpenaiModel] = useState<string>("");
  const [selectedDeepgramModel, setSelectedDeepgramModel] = useState<string>("");
  const [selectedCartesiaModel, setSelectedCartesiaModel] = useState<string>("");
  const [apiKeys, setApiKeys] = useState({
    deepgram: "",
    openai: "",
    cartesia: ""
  });
  const [showModels, setShowModels] = useState({
    deepgram: false,
    openai: false,
    cartesia: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChangeOpenAI = (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setApiKeys(prev => ({ ...prev, openai: value }));
    setShowModels(prev => ({ ...prev, openai: value.trim().length > 0 }));
  };
    
  const handleChangeDeepgram = (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setApiKeys(prev => ({ ...prev, deepgram: value }));
    setShowModels(prev => ({ ...prev, deepgram: value.trim().length > 0 }));
  };
    
  const handleChangeCartesia = (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setApiKeys(prev => ({ ...prev, cartesia: value }));
    setShowModels(prev => ({ ...prev, cartesia: value.trim().length > 0 }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setErrors([]);
    setIsSuccess(false);
    
    try {
      const result = await handleKeysAndModels({
        apiKeys,
        selectedModels: {
          deepgram: selectedDeepgramModel,
          openai: selectedOpenaiModel,
          cartesia: selectedCartesiaModel
        }
      });
      
      if (result.isValid) {
        setIsSuccess(true);
        setConfigStatus(true);
        console.log('Setup successful!', result.validatedServices);
      } else {
        setErrors(result.errors || ['Unknown validation error']);
      }
    } catch (error) {
      setErrors(['Failed to validate configuration. Please try again.']);
    } finally {
      setIsLoading(false);
    }
  };
  return (
      <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Paste your API Keys</DialogTitle>
          <DialogDescription className="muted">Note: Obtain your API Keys from the respective sites.</DialogDescription>
        </DialogHeader>
        
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <div className="text-red-800 text-sm font-medium mb-1">Validation Errors:</div>
            <ul className="text-red-700 text-sm space-y-1">
              {errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}
        
        {isSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3">
            <div className="text-green-800 text-sm font-medium">
              ✅ Configuration validated successfully!
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-3">
            <Label htmlFor="deepgram-api-key">Deepgram API Key</Label>
            <Input id="deepgram-api-key" name="deepgram-api-key" placeholder="" onChange={handleChangeDeepgram} />
            {showModels.deepgram && (
              <div className="grid gap-2">
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
          </div>
          <div className="grid gap-3">
            <Label htmlFor="openai-api-key">OpenAI API Key</Label>
            <Input id="openai-api-key" name="openai-api-key" placeholder="" onChange={handleChangeOpenAI}/>
            {showModels.openai && (
              <div className="grid gap-2">
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
          </div>
          <div className="grid gap-3">
            <Label htmlFor="cartesia-api-key">Cartesia API Key (Optional)</Label>
            <Input id="cartesia-api-key" name="cartesia-api-key" placeholder="" onChange={handleChangeCartesia} />
            {showModels.cartesia && (
              <div className="grid gap-2">
                <Label htmlFor="cartesia-model">Select Cartesia Voice</Label>
                <Select value={selectedCartesiaModel} onValueChange={setSelectedCartesiaModel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a voice" />
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
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            {isLoading ? 'Validating...' : 'Save Configuration'}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  )
}