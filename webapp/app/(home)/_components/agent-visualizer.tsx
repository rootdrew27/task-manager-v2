import { BarVisualizer, useVoiceAssistant } from "@livekit/components-react";

function AgentVisualizer() {
  const { state: agentState, audioTrack } = useVoiceAssistant();

  return (
    <div className="h-[200px] w-44">
      <BarVisualizer
        state={agentState}
        barCount={6}
        trackRef={audioTrack}
        className="agent-visualizer"
        options={{ minHeight: 10 }}
      />
    </div>
  );
}

export { AgentVisualizer };
