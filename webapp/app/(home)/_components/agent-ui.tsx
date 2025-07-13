"use client";

import type { ConnectionDetails } from "@/app/api/connection-details/route";
import { Settings } from "@/components/Settings";
import { build_task_obj_from_livekit } from "@/lib/task";
import { SelectedModels } from "@/types/agent";
import { RoomContext } from "@livekit/components-react";
import { Room, RoomEvent } from "livekit-client";
import { useCallback, useEffect, useState } from "react";
// import { GiConsoleController } from "react-icons/gi";
import { SimpleVoiceAssistant } from "./simple-voice-assistant";
import { TaskManager } from "./task-manager";

function onDeviceFailure(error: Error) {
  console.error(error);
  alert(
    "Error acquiring microphone permissions. Please make sure you grant the necessary permissions in your browser and reload the tab"
  );
}

export const AgentUI = ({
  initTasks,
  selectedModels,
}: {
  initTasks: TaskInfo[];
  selectedModels: SelectedModels | null;
}) => {
  const [room] = useState(new Room());
  const [tasks, setTasks] = useState(initTasks);

  const onConnectButtonClicked = useCallback(async () => {
    const url = new URL(
      process.env.NEXT_PUBLIC_CONN_DETAILS_ENDPOINT ?? "/api/connection-details",
      window.location.origin
    );
    const response = await fetch(url.toString());
    const connectionDetailsData: ConnectionDetails = await response.json();

    await room.connect(connectionDetailsData.serverUrl, connectionDetailsData.participantToken);
    await room.localParticipant.setMicrophoneEnabled(true);
  }, [room]);

  // TODO: Consider moving the following into its own hook file
  useEffect(() => {
    const handleUpdatedRoomMetadata = () => {
      const metadata = room?.metadata;
      if (metadata) {
        console.log(metadata);
        const { update_type, data, updated_at } = JSON.parse(metadata);
        console.log(`Updated metadata with timestamp: ${updated_at}`);

        if (update_type === "CREATE") {
          console.log("Creating a task");
          console.log(`Data: ${JSON.stringify(data)}`);
          setTasks((prev) => [...prev, build_task_obj_from_livekit(data)]);
        } else if (update_type === "EDIT") {
          const { initial_name, task: new_task } = data;

          console.log("Editing tasks.");
          console.log(`Current tasks: ${JSON.stringify(tasks)}`);
          setTasks((tasks) =>
            tasks.map((task) => {
              if (task.name.trim().toLowerCase() === initial_name.trim().toLowerCase()) {
                return build_task_obj_from_livekit(new_task);
              } else {
                return task;
              }
            })
          );
        } else if (update_type === "DELETE") {
          const { name } = data;
          console.log(`Deleting a task: ${name}`);
          console.log(`Current tasks: ${JSON.stringify(tasks)}`);
          setTasks((tasks) =>
            tasks.filter((task) => task.name.trim().toLowerCase() !== name.trim().toLowerCase())
          );
        } else {
          throw new Error(`Update type (${update_type}) is invalid.`);
        }
      }
    };

    room.on("roomMetadataChanged", handleUpdatedRoomMetadata);

    room.on(RoomEvent.MediaDevicesError, onDeviceFailure);

    // Clean up
    return () => {
      room.off("roomMetadataChanged", handleUpdatedRoomMetadata);
      room.off(RoomEvent.MediaDevicesError, onDeviceFailure);
      room.unregisterTextStreamHandler("task-assistant--text");
    };
  }, [room, tasks]);

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
