"use client";

import { AudioLevelMonitor } from "@/components/audio-level-monitor";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  useConnectionState,
  useLocalParticipant,
  useMediaDeviceSelect,
  usePersistentUserChoices,
  usePreviewTracks,
  useRoomContext,
} from "@livekit/components-react";
import { motion } from "framer-motion";
import { ConnectionState, LocalAudioTrack, Track } from "livekit-client";
import { ChevronDown, Mic, MicOff } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

export function MicControl() {
  const [isMuted, setIsMuted] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const connectionState = useConnectionState(room);

  const { userChoices, saveAudioInputDeviceId } = usePersistentUserChoices({
    preventSave: false,
  });

  // Get preview tracks for device selection
  const tracks = usePreviewTracks({
    audio: { deviceId: userChoices.audioDeviceId },
  });

  const audioTrack = useMemo(
    () => tracks?.filter((track) => track.kind === Track.Kind.Audio)[0] as LocalAudioTrack,
    [tracks]
  );

  const { devices, activeDeviceId, setActiveMediaDevice } = useMediaDeviceSelect({
    kind: "audioinput",
    room,
    track: audioTrack,
  });

  console.log(activeDeviceId);

  const handleToggleMicrophone = useCallback(
    async (enabled: boolean) => {
      try {
        if (enabled) {
          console.log("Enabling mic: ", activeDeviceId);
          await localParticipant.setMicrophoneEnabled(true, {
            deviceId: activeDeviceId || undefined,
          });
        } else {
          console.log("disabling mic");
          await localParticipant.setMicrophoneEnabled(false);
        }
      } catch (error) {
        console.error("Error toggling microphone:", error);
      }
    },
    [localParticipant, activeDeviceId]
  );

  const toggleMute = useCallback(() => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    if (connectionState === ConnectionState.Connected) {
      handleToggleMicrophone(!newMutedState);
    }
  }, [isMuted, handleToggleMicrophone, connectionState]);

  // Auto-enable microphone when room connects
  useEffect(() => {
    if (connectionState === ConnectionState.Connected && !isMuted) {
      handleToggleMicrophone(true);
    }
  }, [handleToggleMicrophone, isMuted, connectionState]);

  const handleAudioDeviceChange = useCallback(
    async (deviceId: string) => {
      saveAudioInputDeviceId(deviceId);
      setActiveMediaDevice(deviceId);

      // If microphone is currently enabled, enable the new device
      if (!isMuted && connectionState === ConnectionState.Connected) {
        await handleToggleMicrophone(true);
      }
    },
    [saveAudioInputDeviceId, setActiveMediaDevice, isMuted, connectionState, handleToggleMicrophone]
  );

  // Sync user preferences with active device
  useEffect(() => {
    console.log("in useeffect", activeDeviceId);

    if (userChoices.audioDeviceId && userChoices.audioDeviceId !== activeDeviceId) {
      setActiveMediaDevice(userChoices.audioDeviceId);
    }
  }, [userChoices.audioDeviceId, activeDeviceId, setActiveMediaDevice]);

  // reset wrong activeDeviceId
  useEffect(() => {
    if (
      devices.length > 0 &&
      !devices
        .map((device) => {
          return device.deviceId;
        })
        .includes(activeDeviceId)
    ) {
      setActiveMediaDevice("default");
      saveAudioInputDeviceId("default");
    }
  }, [setActiveMediaDevice, devices, activeDeviceId, saveAudioInputDeviceId]);

  return (
    <div className="flex">
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
              "h-[50px] w-[50px] rounded-l-full bg-primary border-0 relative flex justify-center items-center hover:cursor-pointer focus:outline-none focus:ring-0 focus:ring-offset-0 transition-colors",
              isMuted
                ? "bg-red-50 text-red-600 hover:bg-red-100"
                : "text-oxford-blue hover:bg-secondary/10"
            )}
          >
            {isMuted ? (
              <MicOff className="h-4 w-4" strokeWidth={2.5} />
            ) : (
              <Mic className="h-4 w-4" strokeWidth={2.5} />
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
            value={activeDeviceId || ""}
            onValueChange={handleAudioDeviceChange}
            onOpenChange={setIsDropdownOpen}
          >
            <SelectTrigger
              className={cn(
                "w-[50px] border-0 h-[50px] rounded-r-full bg-primary hover:bg-secondary/10 transition-colors hover:cursor-pointer",
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
              {devices.map((device) => (
                <SelectItem key={device.deviceId} value={device.deviceId}>
                  <div className="flex items-center gap-2">
                    <Mic className="h-3 w-3 text-oxford-blue" />
                    <span className="text-oxford-blue">
                      {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
                    </span>
                  </div>
                </SelectItem>
              ))}
              {devices.length === 0 && (
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
      {/* Audio Level Monitor */}
      {!isMuted && (
        <div className="flex items-center justify-center w-5 p-0">
          <AudioLevelMonitor deviceId={activeDeviceId || undefined} />
        </div>
      )}
    </div>
  );
}
