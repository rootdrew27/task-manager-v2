import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiKeyValidity, SelectedModels } from "@/types/agent";
import { APIKeySelection } from "./apikey-selection";
import { ModelSelection } from "./model-selection";

interface SettingsModalProps {
  onClose: () => void;
  apiKeyValidity: ApiKeyValidity | null;
  setApiKeyValidity: (validity: ApiKeyValidity | null) => void;
  selectedModels: SelectedModels | null;
  setSelectedModels: (models: SelectedModels | null) => void;
}

export function SettingsModal({
  onClose,
  apiKeyValidity,
  setApiKeyValidity,
  selectedModels,
  setSelectedModels,
}: SettingsModalProps) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <Tabs defaultValue="account" className="w-full min-h-[400px]">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription className="muted">
              Update your AI model preferences for voice assistance.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 relative right-1">
            <TabsList>
              <TabsTrigger value="models">Model Selection</TabsTrigger>
              <TabsTrigger value="apikeys">API Keys</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="models" className="w-full">
            <ModelSelection selectedModels={selectedModels} setSelectedModels={setSelectedModels} />
          </TabsContent>
          <TabsContent value="apikeys" className="w-full">
            <APIKeySelection
              apiKeyValidity={apiKeyValidity}
              setApiKeyValidity={setApiKeyValidity}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
