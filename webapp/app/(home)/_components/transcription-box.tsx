"use client";

import { useState } from "react";
import { HiOutlineChatBubbleBottomCenterText } from "react-icons/hi2";
import { IoClose } from "react-icons/io5";

export function TranscriptionBox() {
  const [isVisible, setIsVisible] = useState(true);

  const closeBox = () => {
    setIsVisible(false);
  };

  const openBox = () => {
    setIsVisible(true);
  };

  if (!isVisible) {
    return (
      <button
        onClick={openBox}
        className="fixed left-1/2 transform -translate-x-1/2 
                   bottom-32 md:bottom-11
                   z-10 bg-slate-800 hover:bg-slate-700 
                   border border-white/10 rounded-lg 
                   px-4 py-2 text-white text-sm
                   flex items-center gap-2
                   transition-colors duration-200"
      >
        <HiOutlineChatBubbleBottomCenterText className="w-4 h-4" />
        Show Transcription
      </button>
    );
  }

  return (
    <div
      className="fixed left-1/2 transform -translate-x-1/2 
                    bottom-32 xl:bottom-8 
                    z-10 min-w-[448px] w-[75%] xl:w-[600px]
                    bg-black/20 backdrop-blur-md
                    border border-white/10 rounded-lg
                    "
    >
      {/* Close button positioned absolute in top right */}
      <button
        onClick={closeBox}
        className="absolute top-2 right-2 text-white/70 hover:text-white hover:bg-white/10 
                   rounded p-1 transition-colors duration-200"
      >
        <IoClose className="w-4 h-4" />
      </button>

      {/* Content */}
      <div className="px-4 py-3 pr-10 text-white text-sm text-left">
        Transcription will appear here... Transcription will appear here... Transcription will
        appear here... Transcription will appear here...
      </div>
    </div>
  );
}
