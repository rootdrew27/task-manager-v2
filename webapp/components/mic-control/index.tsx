"use client";

import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ChevronDown, Mic, MicOff } from "lucide-react";
import { useEffect, useState } from "react";

export function MicControl() {
  const [isMuted, setIsMuted] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedMic, setSelectedMic] = useState<string>("");
  const [micDevices, setMicDevices] = useState<MediaDeviceInfo[]>([]);

  // Get available microphone devices
  useEffect(() => {
    const getMicDevices = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter((device) => device.kind === "audioinput");
        setMicDevices(audioInputs);
        if (audioInputs.length > 0 && !selectedMic) {
          setSelectedMic(audioInputs[0].deviceId);
        }
      } catch (error) {
        console.error("Error accessing microphones:", error);
      }
    };

    getMicDevices();
  }, [selectedMic]);

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.03 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        className="relative"
      >
        {/* Combined Button Container */}
        <div
          className={cn(
            "flex items-center rounded-full border-0 transition-all duration-200 bg-white",
            isMuted ? "border-red-200 shadow-sm shadow-red-100" : "border-gray-200"
          )}
        >
          {/* Mute/Unmute Button */}
          <button
            onClick={toggleMute}
            className={cn(
              "h-[50px] w-[50px] rounded-l-full border-0 relative",
              isMuted
                ? "bg-red-50 text-red-600 hover:bg-red-100"
                : "bg-transparent text-gray-600 hover:bg-gray-50"
            )}
          >
            <motion.span className="inline-block">
              {isMuted ? (
                <MicOff className="h-4 w-4" strokeWidth={2.5} />
              ) : (
                <Mic className="h-4 w-4" strokeWidth={2.5} />
              )}
            </motion.span>
            {/* Visual divider as pseudo-element */}
            <div
              className={cn(
                "absolute right-0 top-1/2 -translate-y-1/2 w-px h-6 transition-colors duration-200",
                isMuted ? "bg-red-200" : "bg-gray-200"
              )}
            />
          </button>

          {/* Dropdown Trigger */}
          <Select
            value={selectedMic}
            onValueChange={setSelectedMic}
            onOpenChange={setIsDropdownOpen}
          >
            <SelectTrigger
              className={cn(
                "w-[50px] border-0 h-[50px] rounded-r-full hover:bg-gray-50 transition-colors",
                "focus:outline-none focus:ring-0 focus:ring-offset-0",
                "[&>svg]:hidden" // Hide the default Radix chevron
              )}
            >
              <motion.div
                animate={{ rotate: isDropdownOpen ? 180 : 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-colors duration-200",
                    isMuted ? "text-red-600" : "text-gray-600"
                  )}
                />
              </motion.div>
            </SelectTrigger>
            <SelectContent align="end" className="min-w-[250px]">
              <div className="px-2 py-1.5 text-xs font-medium text-gray-500 border-b">
                Microphone Selection
              </div>
              {micDevices.map((device) => (
                <SelectItem key={device.deviceId} value={device.deviceId}>
                  <div className="flex items-center gap-2">
                    <Mic className="h-3 w-3 text-gray-400" />
                    {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
                  </div>
                </SelectItem>
              ))}
              {micDevices.length === 0 && (
                <SelectItem value="no-devices" disabled>
                  <div className="flex items-center gap-2">
                    <MicOff className="h-3 w-3 text-gray-400" />
                    No microphones found
                  </div>
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      </motion.div>
    </>
  );
}
