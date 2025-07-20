import { build_task_obj_from_livekit } from "@/lib/task";
import { Room, RoomEvent } from "livekit-client";
import { useEffect, useState } from "react";

interface useTasksProps {
  room: Room;
  initTasks: TaskInfo[];
}

export function useTasks(props: useTasksProps) {
  const [tasks, setTasks] = useState(props.initTasks);

  useEffect(() => {
    const handleUpdatedRoomMetadata = () => {
      const metadata = props.room?.metadata;
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

    props.room.on("roomMetadataChanged", handleUpdatedRoomMetadata);

    props.room.on(RoomEvent.MediaDevicesError, onDeviceFailure);

    // Clean up
    return () => {
      props.room.off("roomMetadataChanged", handleUpdatedRoomMetadata);
      props.room.off(RoomEvent.MediaDevicesError, onDeviceFailure);
      props.room.unregisterTextStreamHandler("task-assistant--text");
    };
  }, [props.room, tasks]);

  return {
    tasks,
  };
}

function onDeviceFailure(error: Error) {
  console.error(error);
  alert(
    "Error acquiring microphone permissions. Please make sure you grant the necessary permissions in your browser and reload the tab"
  );
}
