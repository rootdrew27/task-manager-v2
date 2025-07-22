"use client";

import type { ConnectionDetails } from "@/app/api/connection-details/route";
import { Settings } from "@/components/settings";
import { useTasks } from "@/hooks/useTasks";
import { ApiKeyValidity, SelectedModels } from "@/types/agent";
import { RoomContext } from "@livekit/components-react";
import { Room } from "livekit-client";
import { useCallback, useMemo, useState } from "react";
// import { GiConsoleController } from "react-icons/gi";
import { SimpleVoiceAssistant } from "./agent-ui";
import { TaskManager } from "./task-manager";

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
    <div className="flex flex-col h-full w-full items-center lg:flex-row lg:space-y-0 lg:space-x-4 lg:items-stretch">
      <RoomContext.Provider value={room}>
        <div className="lk-room-container flex flex-1 items-center justify-center mx-auto">
          <SimpleVoiceAssistant
            onConnectButtonClicked={onConnectButtonClicked}
            apiKeyValidity={apiKeyValidity}
            setApiKeyValidity={setApiKeyValidity}
            selectedModels={selectedModels}
          />
        </div>
        <div className="flex-1 flex flex-col justify-center p-2">
          <TaskManager tasks={tasks} />
        </div>
        <div className="flex-1 flex flex-col justify-center items-center p-2">
          <Settings
            apiKeyValidity={apiKeyValidity}
            setApiKeyValidity={setApiKeyValidity}
            selectedModels={selectedModels}
            setSelectedModels={setSelectedModels}
          />
        </div>
      </RoomContext.Provider>
    </div>
  );
};
