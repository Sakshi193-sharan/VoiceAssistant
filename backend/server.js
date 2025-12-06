// backend/server.js

require("dotenv").config();

const path = require("path");
console.log("Loaded .env from:", path.resolve(__dirname, ".env"));
console.log("LIVEKIT_API_KEY before override:", process.env.LIVEKIT_API_KEY);
console.log("LIVEKIT_URL before override:", process.env.LIVEKIT_URL);
console.log("LIVEKIT_API_SECRET set before override:", !!process.env.LIVEKIT_API_SECRET);

// 🔒 Hard‑set the values here to avoid any .env / dotenvx confusion
process.env.LIVEKIT_URL = "wss://car-service-centre-rpropqdn.livekit.cloud";
process.env.LIVEKIT_API_KEY = "APIZudiDipxWU32";
process.env.LIVEKIT_API_SECRET = "DPim3OMeCn3zWOe5OJxZwYfm3R9I0ypvzEVYxSt6eWaC";

console.log("LIVEKIT_API_KEY after override:", process.env.LIVEKIT_API_KEY);
console.log("LIVEKIT_URL after override:", process.env.LIVEKIT_URL);
console.log(
  "LIVEKIT_API_SECRET set after override:",
  !!process.env.LIVEKIT_API_SECRET
);

const express = require("express");
const { AccessToken } = require("livekit-server-sdk");

const app = express();

app.get("/api/getToken", async (req, res) => {
  try {
    const identity = req.query.name || "anonymous";
    console.log("getToken called for identity:", identity);

    const at = new AccessToken(
      process.env.LIVEKIT_API_KEY,
      process.env.LIVEKIT_API_SECRET,
      {
        identity,
        ttl: 60 * 60,
      }
    );

    at.addGrant({
      roomJoin: true,
      room: "room1",
      canPublish: true,
      canSubscribe: true,
    });

    const token = await at.toJwt();
    console.log("Generated token length:", token && token.length);

    if (!token) {
      throw new Error("toJwt() returned empty");
    }

    res.type("text/plain").send(token);
  } catch (err) {
    console.error("Error in /api/getToken:", err);
    res.status(500).send("token error");
  }
});

app.listen(3000, () => {
  console.log("Token server listening on http://localhost:3000");
});
