# ListingLift

AI-powered Airbnb listing optimizer. Analyzes your listing and produces a prioritized report with title rewrites, pricing benchmarks, photo audit, and action plan.

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd airbnb
npm install
```

### 2. Environment variables

Fill in `.env.local`:

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase dashboard → Project Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard → Project Settings → API → service_role secret |
| `ANTHROPIC_API_KEY` | platform.anthropic.com → API Keys |
| `APIFY_API_KEY` | console.apify.com → Settings → Integrations → API token |

### 3. Supabase database

Run the migration in the Supabase SQL editor (or via `supabase db push`):

```
supabase/migrations/001_init.sql
```

This creates the `profiles` and `reports` tables, enables RLS, and sets up a trigger that auto-creates a profile row whenever a new user signs up.

### 4. Supabase Auth

In the Supabase dashboard under **Authentication → URL Configuration**:

- **Site URL**: `http://localhost:3000` (swap for your production domain)
- **Redirect URLs**: add `http://localhost:3000/auth/callback`

For Google OAuth (optional):

1. Create OAuth credentials at [console.cloud.google.com](https://console.cloud.google.com)
2. Add them in Supabase → Authentication → Providers → Google

### 5. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## User flow

1. **Landing page** → paste Airbnb URL → `/preview` (blurred mock report + signup gate)
2. **Sign up / Sign in** → `/auth`
3. **Analyze** → `/analyze` → Apify scrapes listing, Claude analyzes, result saved to Supabase
4. **Results** → `/results/[id]` (full report, PDF download)
5. **Dashboard** → `/dashboard` (all past reports)

## Run limits

- First report: free (`free_runs_used` 0 → 1)
- Subsequent reports: require `paid_runs > 0` — set via `/pricing` (Stripe not yet wired; shows toast only)

## Tech stack

- **Next.js 15** App Router
- **Supabase** — auth + PostgreSQL database
- **Anthropic** — `claude-opus-4-7` for listing analysis
- **Apify** — `tri_angle~airbnb-rooms-urls-scraper` (listing) + `tri_angle~airbnb-scraper` (comps)
- **react-to-pdf** — PDF export
