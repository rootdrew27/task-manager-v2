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
      className="bg-transparent rounded-full p-2 button-wrapper-touch-optimized"
      tabIndex={-1}
    >
      <motion.button
        whileHover={{
          scale: 1.1,
          transition: { duration: 0.2 },
        }}
        className="rounded-full control-button flex justify-center items-center shadow-black/10 shadow-sm touch-manipulation"
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
