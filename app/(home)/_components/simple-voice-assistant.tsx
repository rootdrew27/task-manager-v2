"use client";

import { AgentChatMessages } from "@/components/AgentChatMessages";
import { NoAgentNotification } from "@/components/NoAgentNotification";
import { RoomAudioRenderer, useVoiceAssistant } from "@livekit/components-react";
import { AnimatePresence, motion } from "framer-motion";
import { AgentVisualizer } from "./agent-visualizer";
import { ControlBar } from "./control-bar";

function SimpleVoiceAssistant(props: { onConnectButtonClicked: () => void }) {
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
            <motion.button
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.8 }}
              transition={{ duration: 0.4, delay: 0 }}
              className="text-center uppercase bg-white text-black rounded-full h-[100px] w-[100px]"
              onClick={() => props.onConnectButtonClicked()}
            >
              Activate
            </motion.button>
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
