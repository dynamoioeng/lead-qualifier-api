# Lead Qualifier API

Node.js/Express API for ingesting leads from webforms and integrating with Supabase.

## Features

- ✅ Lead ingestion from Webflow forms
- ✅ Supabase database integration
- ✅ Duplicate suppression via external_submission_id
- ✅ Event logging to lead_events table
- ✅ WhatsApp webhook endpoint (360dialog)
- ✅ CORS enabled for static site integration

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Set the following environment variables in your Render dashboard:

- `SUPABASE_URL` - Your Supabase project URL (e.g., `https://xxxxx.supabase.co`)
- `SUPABASE_KEY` - Your Supabase anon/public API key
- `PORT` - (Optional) Server port, defaults to 10000

### 3. Supabase Database Schema

Ensure your Supabase database has the following tables:

#### `leads` table

```sql
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT,
  external_submission_id TEXT UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  country TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  gclid TEXT,
  page_url TEXT,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_phone ON leads(phone);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
```

#### `lead_events` table

```sql
CREATE TABLE lead_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lead_events_lead_id ON lead_events(lead_id);
CREATE INDEX idx_lead_events_type ON lead_events(event_type);
```

#### `lead_messages` table (for future WhatsApp integration)

```sql
CREATE TABLE lead_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  direction TEXT NOT NULL, -- 'inbound' or 'outbound'
  message_text TEXT,
  message_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lead_messages_lead_id ON lead_messages(lead_id);
```

### 4. Deploy to Render

1. Push code to GitHub
2. In Render dashboard, connect the repository
3. Set environment variables (SUPABASE_URL, SUPABASE_KEY)
4. Deploy

## API Endpoints

### POST /ingest/lead

Ingests a lead from a webform.

**Request Body:**

```json
{
  "source": "webflow",
  "external_submission_id": "unique-id",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+971501234567",
  "country": "United Arab Emirates",
  "utm": {
    "utm_source": "google",
    "utm_medium": "cpc",
    "utm_campaign": "spring-2025",
    "gclid": "abc123"
  },
  "page_url": "https://example.com/landing-page"
}
```

**Response:**

```json
{
  "status": "accepted",
  "lead_id": "uuid-here"
}
```

### POST /webhooks/whatsapp

Receives WhatsApp webhooks from 360dialog (for future implementation).

### GET /health

Health check endpoint.

## Testing

Test the API with curl:

```bash
curl -X POST https://lead-qualifier-api.onrender.com/ingest/lead \
  -H "Content-Type: application/json" \
  -d '{
    "source": "webflow",
    "external_submission_id": "test-'$(date +%s)'",
    "name": "Test User",
    "email": "test@example.com",
    "phone": "+971501234567",
    "country": "United Arab Emirates",
    "utm": {},
    "page_url": "https://object1uae.com/UAE/elar1s-axis.html"
  }'
```

## Troubleshooting

### "lead_id": "no-db" in response

This means the Supabase environment variables are not set. Check:

1. `SUPABASE_URL` is set in Render environment variables
2. `SUPABASE_KEY` is set in Render environment variables
3. Redeploy after setting environment variables

### Database errors

Check:

1. Supabase tables exist with correct schema
2. Supabase API key has correct permissions
3. Render logs for detailed error messages

## License

Private - Dynamo IO Engineering

