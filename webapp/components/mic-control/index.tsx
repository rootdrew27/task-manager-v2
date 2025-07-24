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
        whileHover={{
          scale: 1.1,
          transition: { duration: 0.2 },
        }}
        className="bg-transparent rounded-full p-2"
      >
        {/* Combined Button Container */}
        <div
          className={cn(
            "flex items-center rounded-full border border-primary bg-primary shadow-black/10 shadow-sm",
            isMuted && "border-red-200 shadow-sm shadow-red-100"
          )}
        >
          {/* Mute/Unmute Button */}
          <motion.button
            onClick={toggleMute}
            className={cn(
              "h-[50px] w-[50px] rounded-l-full bg-primary border-0 relative flex justify-center items-center focus:outline-none focus:ring-0 focus:ring-offset-0 transition-colors",
              isMuted
                ? "bg-red-50 text-red-600 hover:bg-red-100"
                : "text-oxford-blue hover:bg-secondary/10"
            )}
          >
            {isMuted ? (
              <MicOff className="h-4 w-4" strokeWidth={2.5} />
            ) : (
              <Mic className="h-4 w-4 text-oxford-blue" strokeWidth={2.5} />
            )}
            {/* Visual divider as pseudo-element */}
            <motion.div
              className={cn(
                "absolute right-0 top-1/2 -translate-y-1/2 w-px h-6",
                isMuted ? "bg-red-200" : "bg-secondary"
              )}
              style={{ scale: 1 / 1.04 }}
              whileHover={{ scale: 1 / 1.04 }}
            />
          </motion.button>

          {/* Dropdown Trigger */}
          <Select
            value={selectedMic}
            onValueChange={setSelectedMic}
            onOpenChange={setIsDropdownOpen}
          >
            <SelectTrigger
              className={cn(
                "w-[50px] border-0 h-[50px] rounded-r-full bg-primary hover:bg-secondary/10 transition-colors",
                "focus:outline-none focus:ring-0 focus:ring-offset-0",
                "[&>svg]:hidden", // Hide the default Radix chevron
                "shadow-none"
              )}
            >
              <motion.div
                animate={{ rotate: isDropdownOpen ? 180 : 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <motion.span className="inline-block">
                  <ChevronDown
                    className={cn("h-4 w-4", isMuted ? "text-red-600" : "text-oxford-blue")}
                  />
                </motion.span>
              </motion.div>
            </SelectTrigger>
            <SelectContent
              align="end"
              className="min-w-[250px] bg-primary border-secondary text-secondary"
            >
              <div className="px-2 py-1.5 text-xs font-medium text-oxford-blue border-b border-secondary">
                Microphone Selection
              </div>
              {micDevices.map((device) => (
                <SelectItem key={device.deviceId} value={device.deviceId}>
                  <div className="flex items-center gap-2">
                    <Mic className="h-3 w-3 text-oxford-blue" />
                    <span className="text-oxford-blue">
                      {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
                    </span>
                  </div>
                </SelectItem>
              ))}
              {micDevices.length === 0 && (
                <SelectItem value="no-devices" disabled>
                  <div className="flex items-center gap-2">
                    <MicOff className="h-3 w-3 text-oxford-blue/50" />
                    <span className="text-oxford-blue/50">No microphones found</span>
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
