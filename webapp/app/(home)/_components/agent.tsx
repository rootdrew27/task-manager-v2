"use client";

import type { ConnectionDetails } from "@/app/api/connection-details/route";
import { MicControl } from "@/components/mic-control";
import { Settings } from "@/components/settings";
import { useTasks } from "@/hooks/useTasks";
import { ApiKeyValidity, SelectedModels } from "@/types/agent";
import { RoomContext } from "@livekit/components-react";
import { motion } from "framer-motion";
import { Room, RoomEvent } from "livekit-client";
import { useCallback, useEffect, useMemo, useState } from "react";
// import { GiConsoleController } from "react-icons/gi";
import { SimpleVoiceAssistant } from "./agent-ui";
import { TaskManager } from "./task-manager";
import { TranscriptionBox } from "./transcription-box";
import { TranscriptionButton } from "./transcription-button";

interface AgentProps {
  initTasks: TaskInfo[];
  apiKeyValidity: ApiKeyValidity | null;
  selectedModels: SelectedModels | null;
}

export const Agent = (props: AgentProps) => {
  const room = useMemo(() => new Room(), []);
  const [apiKeyValidity, setApiKeyValidity] = useState(props.apiKeyValidity);
  const [selectedModels, setSelectedModels] = useState(props.selectedModels);
  const [isTranscriptionVisible, setIsTranscriptionVisible] = useState(true);

  const onConnectButtonClicked = useCallback(async () => {
    const url = new URL(
      process.env.NEXT_PUBLIC_CONN_DETAILS_ENDPOINT ?? "/api/connection-details",
      window.location.origin
    );
    const response = await fetch(url.toString());
    const connectionDetailsData: ConnectionDetails = await response.json();

    await room.connect(connectionDetailsData.serverUrl, connectionDetailsData.participantToken);
  }, [room]);

  useEffect(() => {
    const onMediaDevicesError = (error: Error) => {
      console.error({
        title: "Encountered an error with your media devices",
        description: `${error.name}: ${error.message}`,
      });
    };
    room.on(RoomEvent.MediaDevicesError, onMediaDevicesError);

    return () => {
      room.off(RoomEvent.MediaDevicesError, onMediaDevicesError);
    };
  }, [room]);

  const initTasks = props.initTasks;
  const { tasks } = useTasks({ room, initTasks });

  return (
    <RoomContext.Provider value={room}>
      <div className="h-full w-full flex flex-col items-center justify-between relative bg-secondary overflow-hidden">
        <div className="flex justify-center w-full p-2 min-h-[80%] max-h-[80%] overflow-y-auto">
          <TaskManager tasks={tasks} />
        </div>
        <div className="flex flex-col items-center w-full py-0.5 ">
          {" "}
          {/* NOTE: The py-0.5 smooths the button animation (somehow) */}
          <motion.div
            className="flex justify-between w-8/12 2xl:w-9/12 max-w-[1100px] min-w-[448px] bg-walnut-brown border border-primary rounded-full shadow-black/10 shadow-sm"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.5, ease: "easeOut" }}
          >
            <div className="flex p-1 rounded-full">
              <SimpleVoiceAssistant
                onConnectButtonClicked={onConnectButtonClicked}
                apiKeyValidity={apiKeyValidity}
                setApiKeyValidity={setApiKeyValidity}
                selectedModels={selectedModels}
              />
              <MicControl />
            </div>
            <div className="p-1 flex rounded-full">
              <TranscriptionButton
                isVisible={isTranscriptionVisible}
                onToggle={() => setIsTranscriptionVisible(!isTranscriptionVisible)}
              />
              <Settings
                apiKeyValidity={apiKeyValidity}
                setApiKeyValidity={setApiKeyValidity}
                selectedModels={selectedModels}
                setSelectedModels={setSelectedModels}
              />
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8, ease: "easeIn" }}
          >
            <TranscriptionBox
              isVisible={isTranscriptionVisible}
              onClose={() => setIsTranscriptionVisible(false)}
            />
          </motion.div>
        </div>
      </div>
    </RoomContext.Provider>
  );
};
