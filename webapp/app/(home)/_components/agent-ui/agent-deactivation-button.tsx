"use client";

import { useRoomContext } from "@livekit/components-react";
import { motion } from "framer-motion";
import React from "react";
import { IoClose } from "react-icons/io5";

export function AgentDeactivationButton() {
  const room = useRoomContext();

  const handleDisconnect = () => {
    room.disconnect();
  };

  return (
    <motion.div
      whileTap={{ scale: 0.8, transition: { duration: 0.1, ease: "easeOut" } }}
      style={{
        minWidth: "54px", // Maintains hit area (50px button + 4px padding)
        minHeight: "54px",
        touchAction: "manipulation", // Prevents zoom on mobile
      }}
      onClick={handleDisconnect}
      className="bg-transparent rounded-full hover:cursor-auto p-2"
      tabIndex={-1}
    >
      <motion.button
        whileHover={{
          scale: 1.1,
          transition: { duration: 0.2 },
        }}
        style={{
          touchAction: "manipulation", // Prevents zoom on mobile
        }}
        className="control-button flex items-center justify-center rounded-full"
      >
        <IoClose className="h-5 w-5 text-oxford-blue" />
      </motion.button>
    </motion.div>
  );
}
