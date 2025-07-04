"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ApiKeyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApiKeysSet: (keys: ApiKeys) => void;
}

interface ApiKeys {
  openaiKey: string;
  deepgramKey: string;
  cartesiaKey?: string;
}

export function ApiKeyModal({ open, onOpenChange, onApiKeysSet }: ApiKeyModalProps) {
  const [openaiKey, setOpenaiKey] = useState("");
  const [deepgramKey, setDeepgramKey] = useState("");
  const [cartesiaKey, setCartesiaKey] = useState("");
  const [isValidating, setIsValidating] = useState(false);

  const handleSave = async () => {
    if (!openaiKey.trim() || !deepgramKey.trim()) {
      alert("OpenAI and Deepgram API keys are required");
      return;
    }

    setIsValidating(true);
    
    // Store API keys in localStorage
    const apiKeys: ApiKeys = {
      openaiKey: openaiKey.trim(),
      deepgramKey: deepgramKey.trim(),
      cartesiaKey: cartesiaKey.trim() || undefined,
    };

    localStorage.setItem("apiKeys", JSON.stringify(apiKeys));
    
    setIsValidating(false);
    onApiKeysSet(apiKeys);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>API Key Setup</DialogTitle>
          <DialogDescription>
            Please enter your API keys to activate the voice assistant. Your keys will be stored locally in your browser.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="openai-key">OpenAI API Key *</Label>
            <Input
              id="openai-key"
              type="password"
              placeholder="sk-..."
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="deepgram-key">Deepgram API Key *</Label>
            <Input
              id="deepgram-key"
              type="password"
              placeholder="Your Deepgram API key"
              value={deepgramKey}
              onChange={(e) => setDeepgramKey(e.target.value)}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="cartesia-key">Cartesia API Key (Optional)</Label>
            <Input
              id="cartesia-key"
              type="password"
              placeholder="Your Cartesia API key"
              value={cartesiaKey}
              onChange={(e) => setCartesiaKey(e.target.value)}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            onClick={handleSave} 
            disabled={!openaiKey.trim() || !deepgramKey.trim() || isValidating}
          >
            {isValidating ? "Saving..." : "Save API Keys"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}