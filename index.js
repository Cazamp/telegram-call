require("dotenv").config();

// ==============================
// Debug ENV VARS (solo logs)
// ==============================
console.log("TWILIO_ACCOUNT_SID:", process.env.TWILIO_ACCOUNT_SID ? "OK" : "MISSING");
console.log("TWILIO_AUTH_TOKEN:", process.env.TWILIO_AUTH_TOKEN ? "OK" : "MISSING");
console.log("TWILIO_NUMBER:", process.env.TWILIO_NUMBER || "MISSING");
console.log("TO_NUMBER:", process.env.TO_NUMBER || "MISSING");
console.log("TELEGRAM_BOT_TOKEN:", process.env.TELEGRAM_BOT_TOKEN ? "OK" : "MISSING");

// ==============================
// Imports
// ==============================
const express = require("express");
const twilio = require("twilio");

const app = express();
app.use(express.json());

// ==============================
// Twilio client (NO toca)
// ==============================
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// ==============================
// Telegram Webhook Endpoint
// ==============================
app.post("/telegram", async (req, res) => {
  // ⚠️ RESPONDEMOS 200 SIEMPRE
  res.sendStatus(200);

  try {
    console.log("RAW TELEGRAM UPDATE ↓↓↓");
    console.log(JSON.stringify(req.body, null, 2));

    // Extraer texto del mensaje
    const message =
      req.body.message?.text ||
      req.body.message?.caption ||
      req.body.edited_message?.text ||
      "";

    if (!message) {
      console.log("ℹ️ No text message, ignored");
      return;
    }

    const text = message.toUpperCase();

    // Detectar BUY o SELL
    if (!text.includes("BUY") && !text.includes("SELL")) {
      console.log("ℹ️ Message ignored:", text);
      return;
    }

    console.log("🚨 SIGNAL DETECTED:", text);

    // ==============================
    // Validar variables Twilio
    // ==============================
    if (
      !process.env.TWILIO_ACCOUNT_SID ||
      !process.env.TWILIO_AUTH_TOKEN ||
      !process.env.TWILIO_NUMBER ||
      !process.env.TO_NUMBER
    ) {
      console.error("❌ Missing Twilio environment variables");
      return;
    }

    // ==============================
    // Trigger Call
    // ==============================
    try {
      await client.calls.create({
        to: process.env.TO_NUMBER,
        from: process.env.TWILIO_NUMBER,
        url: "http://demo.twilio.com/docs/voice.xml",
      });

      console.log("📞 CALL TRIGGERED SUCCESSFULLY");
    } catch (twilioErr) {
      console.error("❌ Twilio call failed:", twilioErr.message);
    }

  } catch (err) {
    console.error("❌ Unexpected Telegram handler error:", err.message);
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
  console.log(`🚀 Server running on port ${PORT}`);
});
