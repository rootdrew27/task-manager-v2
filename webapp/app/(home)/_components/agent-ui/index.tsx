"use client";

import { AgentChatMessages } from "@/app/(home)/_components/agent-ui/AgentChatMessages";
import { NoAgentNotification } from "@/app/(home)/_components/agent-ui/NoAgentNotification";
import { ApiKeyValidity, SelectedModels } from "@/types/agent";
import { RoomAudioRenderer, useVoiceAssistant } from "@livekit/components-react";
import { AnimatePresence, motion } from "framer-motion";
import { Dispatch, SetStateAction } from "react";
import { AgentButton } from "./agent-button";
import { AgentVisualizer } from "./agent-visualizer";
import { ControlBar } from "./control-bar";

function SimpleVoiceAssistant(props: {
  onConnectButtonClicked: () => void;
  apiKeyValidity: ApiKeyValidity | null;
  setApiKeyValidity: Dispatch<SetStateAction<ApiKeyValidity | null>>;
  selectedModels: SelectedModels | null;
}) {
  const { state: agentState } = useVoiceAssistant();

  return (
    <div className="hover:cursor-pointer">
      <AnimatePresence mode="wait">
        {agentState === "disconnected" ? (
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
        ) : (
          <motion.div
            key="connected"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.09, 0.5, 0.245, 1.055] }}
            className="flex flex-col items-center gap-4 h-full"
          >
            <AgentVisualizer />
            <div className="flex-1 w-full">
              <AgentChatMessages />
              {/* <TranscriptionView /> */}
            </div>
            <div className="w-full">
              <ControlBar onConnectButtonClicked={props.onConnectButtonClicked} />
            </div>
            <RoomAudioRenderer />
            <NoAgentNotification state={agentState} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export { SimpleVoiceAssistant };
