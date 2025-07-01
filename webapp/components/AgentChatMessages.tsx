"use client";

import { useRoomContext } from "@livekit/components-react";
import { useEffect, useState } from "react";

export function AgentChatMessages() {
  const [liveMessage, setLiveMessage] = useState("");
  const [completeMessages, setCompleteMessages] = useState<string[]>(["How can I help you?"]);
  const room = useRoomContext();

  useEffect(() => {
    async function typeText(text: string) {
      for (const char of text) {
        setLiveMessage((prev) => prev + char);
        await new Promise((res) => setTimeout(res, 30)); // Typing delay (adjust to your taste)
      }

      setCompleteMessages((prev) => [...prev, text]);
      setLiveMessage("");
    }

    room.registerTextStreamHandler("task-assistant--text", async (reader) => {
      try {
        const currentMsg = await reader.readAll();
        await typeText(currentMsg);
      } catch (error) {
        console.log(
          `Error while reading text stream from task-assistant--text topic. Error: ${error}`
        );
      }
    });

    return () => {
      room.unregisterTextStreamHandler("task-assistant--text");
    };
  }, [room]);

  return (
    <div className="space-y-4 p-4 overflow-y-auto">
      {completeMessages.map((msg, index) => (
        <div key={index} className="bg-zinc-800 rounded-md p-2">
          {msg}
        </div>
      ))}
      {liveMessage && <div className="bg-zinc-800 rounded-md p-2">{liveMessage}</div>}
    </div>
  );
}
