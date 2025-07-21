"use client";

import type { ConnectionDetails } from "@/app/api/connection-details/route";
import { Settings } from "@/components/Settings";
import { useTasks } from "@/hooks/useTasks";
import { SelectedModels } from "@/types/agent";
import { RoomContext } from "@livekit/components-react";
import { Room } from "livekit-client";
import { useCallback, useMemo } from "react";
// import { GiConsoleController } from "react-icons/gi";
import { SimpleVoiceAssistant } from "./agent-ui";
import { TaskManager } from "./task-manager";

export const Agent = ({
  initTasks,
  selectedModels,
}: {
  initTasks: TaskInfo[];
  selectedModels: SelectedModels | null;
}) => {
  const room = useMemo(() => new Room(), []);

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

  // TODO: Consider moving the following into its own hook file
  const { tasks } = useTasks({ room, initTasks });

  return (
    <div className="flex flex-col h-full w-full items-center lg:flex-row lg:space-y-0 lg:space-x-4 lg:items-stretch">
      <RoomContext.Provider value={room}>
        <div className="lk-room-container flex flex-1 items-center justify-center mx-auto">
          <SimpleVoiceAssistant
            onConnectButtonClicked={onConnectButtonClicked}
            isValidConfig={!!selectedModels}
          />
        </div>
        <div className="flex-1 flex flex-col justify-center p-2">
          <TaskManager tasks={tasks} />
        </div>
        <div className="flex-1 flex flex-col justify-center items-center p-2">
          <Settings />
        </div>
      </RoomContext.Provider>
    </div>
  );
};
