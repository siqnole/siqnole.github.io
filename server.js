const express = require("express");
const path = require("path");
const cheerio = require("cheerio");
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

// Last.fm Now Playing Endpoint
app.get("/api/now-playing", async (req, res) => {
  const apiKey = process.env.LASTFM_API_KEY;
  const username = process.env.LASTFM_USERNAME;

  if (!apiKey || !username) {
    console.error("Missing Last.fm credentials in .env");
    return res.status(500).json({ error: "Server configuration error." });
  }

  try {
    const url = `http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${username}&api_key=${apiKey}&format=json&limit=1`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.recenttracks || !data.recenttracks.track || data.recenttracks.track.length === 0) {
      return res.status(200).json({ isPlaying: false });
    }

    const track = data.recenttracks.track[0];
    const isPlaying = track["@attr"] && track["@attr"].nowplaying === "true";

    if (!isPlaying) {
      return res.status(200).json({ isPlaying: false });
    }

    res.status(200).json({
      title: track.name,
      artist: track.artist["#text"],
      album: track.album["#text"],
      albumImageUrl: track.image[track.image.length - 1]["#text"], // Largest image
      songUrl: track.url,
      isPlaying: true,
    });
  } catch (error) {
    console.error("Last.fm API Error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

const fs = require('fs');

// StoryGraph Reading Status Endpoint
app.get("/api/reading", async (req, res) => {
  try {
    const username = "siq";
    // We use allOrigins proxy to bypass Cloudflare's strict datacenter blocking on Render.
    // Since the profile is public, using a proxy completely removes the need for managing expiring session cookies.
    const url = `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://app.thestorygraph.com/currently-reading/${username}`)}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
      }
    });
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const books = [];
    const seenTitles = new Set();
    
    $(".book-pane-content").each((i, el) => {
      // Find the specific title link that contains text
      const titleEl = $(el).find("h3 a[href^='/books/']").first();
      // Find the specific author link
      const authorEl = $(el).find("a[href^='/authors/']").first();
      // Find the specific cover art
      const imageEl = $(el).find(".book-cover img").first();
      
      const title = titleEl.text().trim();
      const author = authorEl.text().trim();
      
      if (title && author && !seenTitles.has(title)) {
        seenTitles.add(title);
        books.push({
          title: title,
          author: author,
          imageUrl: imageEl.attr("src"),
          bookUrl: `https://app.thestorygraph.com${titleEl.attr("href")}`
        });
      }
    });

    res.status(200).json({
      books,
      isReading: books.length > 0
    });
  } catch (error) {
    console.error("StoryGraph Scraper Error:", error);
    res.status(500).json({ error: "Failed to fetch reading status." });
  }
});

// Fallback to index.html for all requests (supports SPA routing)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
