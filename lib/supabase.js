import { createClient } from "@supabase/supabase-js";

// Server-only Supabase client using the service role key. Never import this from
// a "use client" component — the service role key must never reach the browser.
// All database + storage access goes through API route handlers, which run on
// the server, so this is the single point of access.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Supports the new "sb_secret_..." key as well as the legacy service_role JWT.
const serviceKey =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

let cached = null;

export function getSupabaseAdmin() {
  if (!url || !serviceKey) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local"
    );
  }
  if (!cached) {
    cached = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cached;
}

export const CONTRIBUTIONS_BUCKET = "contributions";
