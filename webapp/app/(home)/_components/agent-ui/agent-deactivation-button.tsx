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
      onClick={handleDisconnect}
      className="bg-transparent rounded-full hover:cursor-auto p-2 button-wrapper-touch-optimized"
      tabIndex={-1}
    >
      <motion.button
        whileHover={{
          scale: 1.1,
          transition: { duration: 0.2 },
        }}
        className="control-button flex items-center justify-center rounded-full touch-manipulation"
      >
        <IoClose className="h-5 w-5 text-oxford-blue" />
      </motion.button>
    </motion.div>
  );
}
