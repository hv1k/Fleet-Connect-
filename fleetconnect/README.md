# FleetConnect

## Setup
- Copy `.env.example` to `.env` and fill in required values.
- Deploy or run on a static server plus serverless functions (the `api/` folder).

## Required Environment Variables
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `JWT_SECRET`
- `INVOICE_WEBHOOK_SECRET`
- `CLAUDE_API_KEY`

Optional:
- `SUPABASE_ANON_KEY`
- `ENABLE_DEMO_LOGIN` (set to `true` to enable demo login)
