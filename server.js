import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";

const app = express();

// Accept JSON bodies up to ~1 MB
app.use(bodyParser.json({ limit: "1mb" }));

// CORS: allow all origins for now (we can lock to your static site later)
app.use(cors());

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

let supabase = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log("✅ Supabase client initialized");
} else {
  console.warn("⚠️  SUPABASE_URL or SUPABASE_KEY not set - database writes disabled");
}

// Health check
app.get("/health", (_req, res) => res.status(200).send("ok"));

// Forms will POST here
app.post("/ingest/lead", async (req, res) => {
  console.log("INGEST:", req.body);

  // Validate required fields
  const { name, email, phone, source, external_submission_id, page_url } = req.body;

  if (!name || !email || !phone) {
    return res.status(400).json({
      status: "error",
      message: "Missing required fields: name, email, or phone"
    });
  }

  // If Supabase is not configured, return placeholder
  if (!supabase) {
    console.warn("⚠️  Supabase not configured - returning placeholder");
    return res.status(202).json({
      status: "accepted",
      lead_id: "no-db",
      message: "Supabase not configured"
    });
  }

  try {
    // Prepare lead data for insertion matching existing schema
    const leadData = {
      source: source || "webflow",
      external_submission_id: external_submission_id || null,
      name: name,
      email: email,
      phone_raw: phone, // Using phone_raw to match existing schema
      country: req.body.country || null,
      utm: req.body.utm || {}, // Store UTM as JSONB object
      page_url: page_url || null,
      status: "new",
      created_at: new Date().toISOString()
    };

    // Insert into Supabase
    const { data, error } = await supabase
      .from("leads")
      .insert([leadData])
      .select();

    if (error) {
      console.error("❌ Supabase insert error:", error);
      return res.status(500).json({
        status: "error",
        message: "Database error: " + error.message,
        code: error.code
      });
    }

    console.log("✅ Lead inserted successfully:", data[0].id);

    // Log event to lead_events table
    if (data && data[0]) {
      const eventData = {
        lead_id: data[0].id,
        event_type: "lead_created",
        event_data: { source: leadData.source, page_url: leadData.page_url },
        created_at: new Date().toISOString()
      };

      await supabase.from("lead_events").insert([eventData]);
    }

    return res.status(202).json({
      status: "accepted",
      lead_id: data[0].id
    });

  } catch (err) {
    console.error("❌ Unexpected error:", err);
    return res.status(500).json({
      status: "error",
      message: "Internal server error: " + err.message
    });
  }
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
