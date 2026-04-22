const express = require("express");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the current directory
app.use(express.static(__dirname));

// Contact Form Endpoint
app.post("/api/contact", async (req, res) => {
  const { name, message } = req.body;

  if (!name || !message) {
    return res.status(400).json({ error: "Name and message are required." });
  }

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    console.error("DISCORD_WEBHOOK_URL is not defined in .env");
    return res.status(500).json({ error: "Server configuration error." });
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        embeds: [
          {
            title: "New Contact Form Submission",
            color: 0xd4a853, // --gold
            fields: [
              { name: "Name", value: name, inline: true },
              { name: "Message", value: message },
            ],
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    });

    if (response.ok) {
      res.status(200).json({ success: true });
    } else {
      console.error("Discord Webhook Error:", response.statusText);
      res.status(500).json({ error: "Failed to send message to Discord." });
    }
  } catch (error) {
    console.error("Contact Form Error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Spotify API helper functions
let spotifyAccessToken = null;
let spotifyTokenExpiry = 0;

async function getSpotifyAccessToken() {
  const currentTime = Date.now();
  if (spotifyAccessToken && currentTime < spotifyTokenExpiry) {
    return spotifyAccessToken;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    console.error("Missing Spotify credentials in .env");
    return null;
  }

  try {
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + Buffer.from(clientId + ":" + clientSecret).toString("base64"),
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    const data = await response.json();
    if (data.access_token) {
      spotifyAccessToken = data.access_token;
      spotifyTokenExpiry = currentTime + data.expires_in * 1000 - 60000; // Expire 1 minute early
      return spotifyAccessToken;
    }
  } catch (error) {
    console.error("Error refreshing Spotify token:", error);
  }
  return null;
}

// Spotify Now Playing Endpoint
app.get("/api/now-playing", async (req, res) => {
  const token = await getSpotifyAccessToken();
  if (!token) {
    return res.status(500).json({ error: "Failed to authenticate with Spotify." });
  }

  try {
    const response = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 204 || response.status > 400) {
      return res.status(200).json({ isPlaying: false });
    }

    const song = await response.json();
    if (!song.track_window && !song.item) {
        return res.status(200).json({ isPlaying: false });
    }

    const isPlaying = song.is_playing;
    const title = song.item.name;
    const artist = song.item.artists.map((_artist) => _artist.name).join(", ");
    const album = song.item.album.name;
    const albumImageUrl = song.item.album.images[0].url;
    const songUrl = song.item.external_urls.spotify;

    res.status(200).json({
      album,
      albumImageUrl,
      artist,
      isPlaying,
      songUrl,
      title,
    });
  } catch (error) {
    console.error("Spotify API Error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Fallback to index.html for all requests (supports SPA routing)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
