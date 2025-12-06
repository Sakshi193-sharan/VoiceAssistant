import {
  useVoiceAssistant,
  BarVisualizer,
  VoiceAssistantControlBar,
  useTranscriptions,
  useLocalParticipant,
} from "@livekit/components-react";
import { useEffect, useState } from "react";
import "./SimpleVoiceAssistant.css";

const Message = ({ type, text }) => {
  return (
    <div className="message">
      <strong className={`message-${type}`}>
        {type === "agent" ? "Agent: " : "You: "}
      </strong>
      <span className="message-text">{text}</span>
    </div>
  );
};

const SimpleVoiceAssistant = () => {
  const { state, audioTrack, agentTranscriptions } = useVoiceAssistant();
  const localParticipant = useLocalParticipant();

  // transcriptions is an array of segments
  const { data: transcriptions } = useTranscriptions();

  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const userId = localParticipant?.identity;

    const allTranscriptions = transcriptions ?? [];

    const userMessages =
      allTranscriptions
        .filter((t) => t.participantIdentity === userId)
        .map((t) => ({ ...t, type: "user" })) ?? [];

    const agentMessages =
      agentTranscriptions?.map((t) => ({ ...t, type: "agent" })) ?? [];

    const allMessages = [...agentMessages, ...userMessages].sort(
      (a, b) => a.firstReceivedTime - b.firstReceivedTime
    );

    // Avoid infinite re‑render: only update if messages actually changed
    setMessages((prev) => {
      if (
        prev.length === allMessages.length &&
        prev.every(
          (m, i) =>
            m.id === allMessages[i].id &&
            m.type === allMessages[i].type &&
            m.text === allMessages[i].text
        )
      ) {
        return prev;
      }
      return allMessages;
    });
  }, [agentTranscriptions, transcriptions, localParticipant]);

  if (!state) {
    return <div>Loading voice assistant...</div>;
  }

  return (
    <div className="voice-assistant-container">
      <div className="visualizer-container">
        <BarVisualizer state={state} barCount={7} trackRef={audioTrack} />
      </div>
      <div className="control-section">
        <VoiceAssistantControlBar />
        <div className="conversation">
          {messages.length === 0 ? (
            <div>No messages yet. Start speaking!</div>
          ) : (
            messages.map((msg, index) => (
              <Message key={msg.id || index} type={msg.type} text={msg.text} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SimpleVoiceAssistant;
