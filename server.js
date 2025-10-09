import express from "express";
import bodyParser from "body-parser";
import cors from "cors";

const app = express();

// Accept JSON bodies up to ~1 MB
app.use(bodyParser.json({ limit: "1mb" }));

// CORS: allow all origins for now (we can lock to your static site later)
app.use(cors());

// Health check
app.get("/health", (_req, res) => res.status(200).send("ok"));

// Forms will POST here
app.post("/ingest/lead", async (req, res) => {
  // For now: just echo we received it (we'll wire logic later)
  console.log("INGEST:", req.body);
  res.status(202).json({ status: "accepted", lead_id: "placeholder" });
});

// 360dialog will POST WhatsApp webhooks here (delivery + inbound)
app.post("/webhooks/whatsapp", async (req, res) => {
  console.log("WHATSAPP WEBHOOK:", req.body);
  res.status(200).json({ received: true });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`API listening on ${PORT}`);
});
