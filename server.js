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

// Fallback to index.html for all requests (supports SPA routing)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
