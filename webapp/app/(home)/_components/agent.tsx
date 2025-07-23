"use client";

import type { ConnectionDetails } from "@/app/api/connection-details/route";
import { MicControl } from "@/components/mic-control";
import { Settings } from "@/components/settings";
import { useTasks } from "@/hooks/useTasks";
import { ApiKeyValidity, SelectedModels } from "@/types/agent";
import { RoomContext } from "@livekit/components-react";
import { Room } from "livekit-client";
import { useCallback, useMemo, useState } from "react";
// import { GiConsoleController } from "react-icons/gi";
import { SimpleVoiceAssistant } from "./agent-ui";
import { TaskManager } from "./task-manager";
import { TranscriptionBox } from "./transcription-box";

interface AgentProps {
  initTasks: TaskInfo[];
  apiKeyValidity: ApiKeyValidity | null;
  selectedModels: SelectedModels | null;
}

export const Agent = (props: AgentProps) => {
  const room = useMemo(() => new Room(), []);
  const [apiKeyValidity, setApiKeyValidity] = useState(props.apiKeyValidity);
  const [selectedModels, setSelectedModels] = useState(props.selectedModels);

  const onConnectButtonClicked = useCallback(async () => {
    const url = new URL(
      process.env.NEXT_PUBLIC_CONN_DETAILS_ENDPOINT ?? "/api/connection-details",
      window.location.origin
    );
    const response = await fetch(url.toString());
    const connectionDetailsData: ConnectionDetails = await response.json();

    await room.connect(connectionDetailsData.serverUrl, connectionDetailsData.participantToken);
    console.log("connected to livekit room");
    await room.localParticipant.setMicrophoneEnabled(true);
  }, [room]);

  const initTasks = props.initTasks;
  const { tasks } = useTasks({ room, initTasks });

  return (
    <RoomContext.Provider value={room}>
      <div className="h-full w-full flex flex-col items-center justify-between relative">
        <div className="flex justify-center w-full p-2 min-h-[80%] max-h-[80%] overflow-y-auto">
          <TaskManager tasks={tasks} />
        </div>
        <div className="flex justify-between w-10/12">
          <div className="flex gap-x-4 px-4 py-4 bg-slate-800 rounded-full">
            <SimpleVoiceAssistant
              onConnectButtonClicked={onConnectButtonClicked}
              apiKeyValidity={apiKeyValidity}
              setApiKeyValidity={setApiKeyValidity}
              selectedModels={selectedModels}
            />
            <MicControl />
          </div>
          <div className="px-4 py-4 bg-slate-800 rounded-full">
            <Settings
              apiKeyValidity={apiKeyValidity}
              setApiKeyValidity={setApiKeyValidity}
              selectedModels={selectedModels}
              setSelectedModels={setSelectedModels}
            />
          </div>
        </div>
        <TranscriptionBox />
      </div>
    </RoomContext.Provider>
  );
};
