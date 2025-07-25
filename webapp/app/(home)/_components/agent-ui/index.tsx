"use client";

import { ApiKeyValidity, SelectedModels } from "@/types/agent";
import { RoomAudioRenderer, useVoiceAssistant } from "@livekit/components-react";
import { AnimatePresence, motion } from "framer-motion";
import { Dispatch, SetStateAction } from "react";
import { AgentButton } from "./agent-button";
import { AgentDeactivationButton } from "./agent-deactivation-button";

function SimpleVoiceAssistant(props: {
  onConnectButtonClicked: () => void;
  apiKeyValidity: ApiKeyValidity | null;
  setApiKeyValidity: Dispatch<SetStateAction<ApiKeyValidity | null>>;
  selectedModels: SelectedModels | null;
}) {
  const { state: agentState } = useVoiceAssistant();

  return (
    <div className="hover:cursor-pointer">
      {agentState === "disconnected" ? (
        <AnimatePresence mode="wait">
          <motion.div
            key="disconnected"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.09, 0.5, 0.245, 1.055] }}
            className="grid items-center justify-center h-full"
          >
            <AgentButton
              onConnectButtonClicked={props.onConnectButtonClicked}
              apiKeyValidity={props.apiKeyValidity}
              setApiKeyValidity={props.setApiKeyValidity}
              selectedModels={props.selectedModels}
            />
          </motion.div>
        </AnimatePresence>
      ) : (
        <div>
          <AgentDeactivationButton />
          <RoomAudioRenderer />
        </div>
      )}
    </div>
  );
}

export { SimpleVoiceAssistant };
