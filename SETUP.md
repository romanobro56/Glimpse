# Glimpse — setup

A living map of locations and **what they used to be**, built on Next.js 16 + Clerk +
OpenStreetMap (Leaflet) + Google Places + Supabase.

## 1. Supabase (database + image storage)

1. Create a free project at <https://app.supabase.com>.
2. Open **SQL Editor** and run the contents of [`supabase/schema.sql`](./supabase/schema.sql).
   This creates the `places` and `contributions` tables and a public `contributions`
   storage bucket.
   - If the `insert into storage.buckets …` line errors, create the bucket manually:
     **Storage → New bucket → name `contributions`, Public = on**.
3. In **Project Settings → API keys**, copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - a **Secret key** (`sb_secret_...`) → `SUPABASE_SECRET_KEY` (server-only; bypasses RLS, never exposed to the browser)
4. Paste both into `.env.local`.

> This app uses **Clerk** for auth, not Supabase Auth — so the database is accessed
> server-side with the secret key. The publishable/anon key alone can't perform our
> writes (RLS would block them).

## 2. Environment variables

`.env.local` already contains the Clerk, Google Maps, Supabase URL, and publishable key.
Fill in the secret key:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...   # <-- the one you still need to add
```

After editing `.env.local`, **restart `npm run dev`** so the new value loads.

> The Google Places API key must have **Places API (New)** enabled in Google Cloud Console.

## 3. Run

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

## How it works

- **Anyone** can browse the map and read contributions.
- **Signed-in** users can drop a pin: clicking the map queries Google for the ~5 closest
  establishments (shown top-right). Selecting one creates the place (if new) and seeds its
  first contribution — dated *today*, titled with the current Google establishment name.
- Each later contribution is a **dated memory** (a past date, up to 5 images, 10 000 chars).
- Clicking a map dot opens a right-hand panel (40% wide) with a **vertical timeline**.
  Contributions are indexed by recency (now = 1) and spaced proportionally to elapsed time,
  so recent memories cluster near the top and old ones sit far below — the line continues
  off-screen past the oldest dot.

## Deploy to Vercel

Push to GitHub, import the repo in Vercel, and add the same env vars
(`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_MAPS_API_KEY`, and the
Clerk keys) in the Vercel project settings.
