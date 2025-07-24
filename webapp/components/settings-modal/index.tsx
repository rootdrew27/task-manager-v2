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
      <DialogContent className="bg-secondary border-primary border-2 shadow-xl">
        <Tabs defaultValue="models" className="w-full min-h-[350px]">
          <DialogHeader className="border-b border-secondary pb-4">
            <DialogTitle className="text-primary text-xl font-semibold">Settings</DialogTitle>
            <DialogDescription className="text-secondary-text">
              Update your AI model preferences for voice assistance.
            </DialogDescription>
          </DialogHeader>
          <div className=" relative right-1">
            <TabsList className="bg-secondary border border-primary">
              <TabsTrigger
                value="models"
                className="data-[state=active]:bg-primary data-[state=active]:text-secondary text-oxford-blue hover:bg-powder-blue/50 transition-colors"
              >
                Model Selection
              </TabsTrigger>
              <TabsTrigger
                value="apikeys"
                className="data-[state=active]:bg-primary data-[state=active]:text-secondary text-oxford-blue hover:bg-powder-blue/50 transition-colors"
              >
                API Keys
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="models" className="w-full mt-4">
            <ModelSelection selectedModels={selectedModels} setSelectedModels={setSelectedModels} />
          </TabsContent>
          <TabsContent value="apikeys" className="w-full mt-4">
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
