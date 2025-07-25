"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

interface AudioLevelMonitorProps {
  className?: string;
  deviceId?: string;
}

export function AudioLevelMonitor({ className, deviceId }: AudioLevelMonitorProps) {
  const [audioLevel, setAudioLevel] = useState(0);
  const animationFrameRef = useRef<number>(null);
  const analyserRef = useRef<AnalyserNode>(null);
  const dataArrayRef = useRef<Uint8Array>(null);
  const streamRef = useRef<MediaStream>(null);

  const setupAudioAnalysis = useCallback(async () => {
    try {
      // Get user media with specific device ID
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: deviceId ? { deviceId: { exact: deviceId } } : true,
      });

      streamRef.current = stream;
      const audioTrack = stream.getAudioTracks()[0];
      if (!audioTrack) return;

      // Create audio context and analyser
      const audioContext = new window.AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();

      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);

      analyserRef.current = analyser;
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);

      const updateAudioLevel = () => {
        if (!analyserRef.current || !dataArrayRef.current) return;

        analyserRef.current.getByteFrequencyData(dataArrayRef.current);

        // Calculate RMS (Root Mean Square) for more accurate level detection
        let sum = 0;
        for (let i = 0; i < dataArrayRef.current.length; i++) {
          sum += dataArrayRef.current[i] * dataArrayRef.current[i];
        }
        const rms = Math.sqrt(sum / dataArrayRef.current.length);
        const level = Math.min(rms / 128, 1); // Normalize to 0-1 range

        setAudioLevel(level);
        animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
      };

      updateAudioLevel();

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }
        audioContext.close();
      };
    } catch (error) {
      console.error("Error setting up audio analysis:", error);
      return () => {};
    }
  }, [deviceId]);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    setupAudioAnalysis().then((cleanupFn) => {
      cleanup = cleanupFn;
    });

    return () => {
      if (cleanup) cleanup();
    };
  }, [setupAudioAnalysis]);

  const getBarColor = (level: number) => {
    if (level < 0.3) return "bg-white/50";
    if (level < 0.7) return "bg-white/70";
    return "bg-white";
  };

  const numBars = 6;
  const barThresholds = Array.from({ length: numBars }, (_, i) => (i + 1) / numBars);

  return (
    <div className={cn("flex flex-col justify-center gap-0.5", className)}>
      {/* Visual bars - horizontal */}
      <div className="flex flex-col gap-0.5 w-12">
        {barThresholds.reverse().map((threshold, index) => {
          const isActive = audioLevel >= threshold;
          return (
            <motion.div
              key={index}
              className={cn(
                "h-0.5 rounded-full transition-colors duration-75",
                isActive ? getBarColor(audioLevel) : "bg-white/50"
              )}
              style={{
                width: "100%",
              }}
              animate={{
                opacity: isActive ? 1 : 0.65,
                scaleX: isActive ? 0.4 : 0.35,
              }}
              transition={{ duration: 0.1 }}
            />
          );
        })}
      </div>
    </div>
  );
}
