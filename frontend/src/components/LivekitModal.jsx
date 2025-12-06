import { useState } from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
} from "@livekit/components-react";
import SimpleVoiceAssistant from "./SimpleVoiceAssistant";

const LivekitModal = ({ setShowSupport }) => {
  const [isSubmittingName, setIsSubmittingName] = useState(true);
  const [name, setName] = useState("");
  const [token, setToken] = useState(null);

  const getToken = async (userName) => {
    try {
      console.log("Fetching token for:", userName);
      const response = await fetch(
        `/api/getToken?name=${encodeURIComponent(userName)}`
      );
      console.log("getToken status:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const t = await response.text();
      console.log("token length:", t.length);

      setToken(t);
      setIsSubmittingName(false);
    } catch (error) {
      console.error("Token fetch error:", error);
      alert("Could not get token from backend. Check /api/getToken.");
    }
  };

  const handleNameSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      getToken(name);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="support-room">
          {isSubmittingName ? (
            <form onSubmit={handleNameSubmit} className="name-form">
              <h2>Enter your name to connect with support</h2>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
              />
              <button type="submit">Connect</button>
              <button
                type="button"
                className="cancel-button"
                onClick={() => setShowSupport(false)}
              >
                Cancel
              </button>
            </form>
          ) : token ? (
            <LiveKitRoom
              serverUrl={
                import.meta.env.VITE_LIVEKIT_URL ||
                "wss://car-service-centre-rpropqdn.livekit.cloud"
              }
              token="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NjQ5NTQ0NjAsImlkZW50aXR5IjoidGltIiwiaXNzIjoiQVBJWnVkaURpcHhXVTMyIiwibmJmIjoxNzY0OTUzNTYwLCJzdWIiOiJ0aW0iLCJ2aWRlbyI6eyJjYW5QdWJsaXNoIjp0cnVlLCJjYW5QdWJsaXNoRGF0YSI6dHJ1ZSwiY2FuU3Vic2NyaWJlIjp0cnVlLCJyb29tIjoicm9vbTEiLCJyb29tSm9pbiI6dHJ1ZX19.6sp_IDzHhrWTDB7AyaXk06drwOV7prqbuvZ9lhO2VI0"
              audio={true}          // publish mic on connect [web:11]
              onDisconnected={() => {
                setShowSupport(false);
                setIsSubmittingName(true);
                setToken(null);
                setName("");
              }}
            >
              <RoomAudioRenderer />   
              <SimpleVoiceAssistant />
            </LiveKitRoom>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default LivekitModal;
