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
        await new Promise((res) => setTimeout(res, 30)); // Typing delay (adjust to taste)
      }

      setCompleteMessages((prev) => [...prev, text]);
      setLiveMessage("");
    }

    room.registerTextStreamHandler("lk.transcription", async (reader, participantInfo) => {
      try {
        if (participantInfo.identity !== room.localParticipant.identity) {
          const message = await reader.readAll();
          await typeText(message);
        }
      } catch (error) {
        console.log(
          `Error while reading text stream from task-assistant--text topic. Error: ${error}`
        );
      }
    });

    return () => {
      // room.unregisterTextStreamHandler("task-assistant--text");
      room.unregisterTextStreamHandler("lk.transcription");
    };
  }, [room]);

  return (
    <div className="space-y-4 p-4 overflow-y-auto">
      {completeMessages.map((msg, index) => (
        <div
          key={index}
          className="bg-secondary border border-primary rounded-md p-3 text-oxford-blue"
        >
          {msg}
        </div>
      ))}
      {liveMessage && (
        <div className="bg-secondary border border-primary rounded-md p-3 text-oxford-blue">
          {liveMessage}
        </div>
      )}
    </div>
  );
}
