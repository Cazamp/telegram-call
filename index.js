require("dotenv").config();
const express = require("express");
const twilio = require("twilio");

const app = express();
app.use(express.json());

// ==============================
// Twilio client
// ==============================
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// ==============================
// Telegram Webhook Endpoint
// ==============================
app.post("/telegram", async (req, res) => {
  try {
    console.log("RAW TELEGRAM UPDATE ↓↓↓");
    console.log(JSON.stringify(req.body, null, 2));

    // Extraer texto del mensaje (normal, reenviado o caption)
    const message =
      req.body.message?.text ||
      req.body.message?.caption ||
      req.body.edited_message?.text ||
      "";

    if (!message) {
      return res.sendStatus(200);
    }

    const text = message.toUpperCase();

    // Detectar BUY o SELL
    if (text.includes("BUY") || text.includes("SELL")) {
      console.log("SIGNAL DETECTED:", text);

      await client.calls.create({
        to: process.env.TO_NUMBER,
        from: process.env.TWILIO_NUMBER,
        url: "http://demo.twilio.com/docs/voice.xml",
      });

      console.log("📞 CALL TRIGGERED");
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("Telegram error:", err);
    res.sendStatus(500);
  }
});

// ==============================
// Health check
// ==============================
app.get("/", (req, res) => {
  res.send("Telegram Call Service running");
});

// ==============================
// Start server
// ==============================
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

