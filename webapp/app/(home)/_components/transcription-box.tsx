"use client";

import { useRoomContext } from "@livekit/components-react";
import { useEffect, useState } from "react";

interface TranscriptionBoxProps {
  isVisible: boolean;
  onClose: () => void;
}

export function TranscriptionBox({ isVisible }: TranscriptionBoxProps) {
  const [liveMessage, setLiveMessage] = useState("");
  const [completeMessages, setCompleteMessages] = useState<string[]>([]);
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

  if (!isVisible) {
    return null;
  }

  let msgContent;
  if (completeMessages.length === 0 && liveMessage === "") {
    msgContent = (
      <p className=" text-oxford-blue/60 font-family-playfair">• Agent feedback appears here...</p>
    );
  } else {
    msgContent = (
      <>
        {completeMessages.map((msg, index) => (
          <div key={index} className="p-1 text-oxford-blue">
            • {msg}
          </div>
        ))}
        <div className="p-1 text-oxford-blue">{liveMessage && `• ${liveMessage}`}</div>
      </>
    );
  }

  return (
    <div
      className="fixed left-1/2 transform -translate-x-1/2 translate-y-1.5
                    bottom-32 2xl:bottom-7
                    z-10 min-w-[448px] w-[65%] xl:w-[600px]
                    bg-primary/30 border border-primary rounded-lg
                    shadow-black/10 shadow-sm backdrop-blur-lg"
    >
      {/* Content */}
      <div className="px-4 py-2 h-20 text-oxford-blue text-sm text-left overflow-y-auto scrollbar">
        {msgContent}
      </div>
    </div>
  );
}
