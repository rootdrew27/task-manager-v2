"use client";

interface TranscriptionBoxProps {
  isVisible: boolean;
  onClose: () => void;
}

export function TranscriptionBox({ isVisible }: TranscriptionBoxProps) {
  if (!isVisible) {
    return null;
  }

  return (
    <div
      className="fixed left-1/2 transform -translate-x-1/2 translate-y-1
                    bottom-32 2xl:bottom-7
                    z-10 min-w-[448px] w-[65%] xl:w-[600px]
                    bg-primary/30 border border-primary rounded-lg
                    shadow-black/10 shadow-sm backdrop-blur-lg"
    >
      {/* Content */}
      <div className="px-4 py-2 h-20 text-oxford-blue text-sm text-left overflow-y-auto scrollbar">
        Transcription will appear here... Transcription will appear here... Transcription will
        appear here... Transcription will appear here. This is additional text, that I am writing,
        as a mock up for an agent response. And I suppose I could use some additional text, for
        which I will try my best to accurately type, despite the clear hinderance to my speed.
      </div>
    </div>
  );
}
