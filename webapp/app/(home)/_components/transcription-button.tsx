"use client";

import { motion } from "framer-motion";
import { PiChatCenteredFill, PiChatCenteredSlashFill } from "react-icons/pi";

interface ToggleButtonProps {
  isVisible: boolean;
  onToggle: () => void;
}

export function TranscriptionButton({ isVisible, onToggle }: ToggleButtonProps) {
  return (
    <motion.div
      whileTap={{
        scale: 0.8,
        transition: { duration: 0.1, ease: "easeOut" },
      }}
      onTapStart={onToggle}
      style={{
        minWidth: "54px", // Maintains hit area (50px button + 4px padding)
        minHeight: "54px",
        touchAction: "manipulation", // Prevents zoom on mobile
      }}
      className="bg-transparent rounded-full p-2"
      tabIndex={-1}
    >
      <motion.button
        whileHover={{
          scale: 1.1,
          transition: { duration: 0.2 },
        }}
        className="rounded-full control-button flex justify-center items-center shadow-black/10 shadow-sm"
        style={{
          touchAction: "manipulation", // Prevents zoom on mobile
        }}
      >
        {isVisible ? (
          <PiChatCenteredFill className="text-oxford-blue h-6 w-6" />
        ) : (
          <PiChatCenteredSlashFill className="text-oxford-blue h-6 w-6" />
        )}
      </motion.button>
    </motion.div>
  );
}
