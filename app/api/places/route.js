import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase";

// GET /api/places  -> all places (for the map dots). Public.
export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("places")
      .select("id, name, address, lat, lng");

    if (error) {
      console.error("list places failed:", error.message, error);
      const hint =
        error.code === "PGRST205"
          ? " — run supabase/schema.sql in your Supabase SQL editor to create the tables."
          : "";
      return Response.json({ error: `Failed to load places${hint}` }, { status: 500 });
    }
    return Response.json({ places: data });
  } catch (err) {
    console.error("list places crashed:", err);
    return Response.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

// POST /api/places  -> create (or return existing) place from a selected Google
// establishment, and seed its first "current" contribution. Requires auth.
export async function POST(request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Sign in to add a place" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { googlePlaceId, name, address, lat, lng } = body || {};
  if (!name || typeof lat !== "number" || typeof lng !== "number") {
    return Response.json({ error: "name, lat, lng are required" }, { status: 400 });
  }

  let supabase;
  try {
    supabase = getSupabaseAdmin();
  } catch (err) {
    console.error("supabase init failed:", err);
    return Response.json({ error: err.message || "Server error" }, { status: 500 });
  }

  // Dedupe by Google place id so the same establishment isn't added twice.
  if (googlePlaceId) {
    const { data: existing } = await supabase
      .from("places")
      .select("id, name, address, lat, lng")
      .eq("google_place_id", googlePlaceId)
      .maybeSingle();
    if (existing) {
      return Response.json({ place: existing, created: false });
    }
  }

  const { data: place, error: placeErr } = await supabase
    .from("places")
    .insert({
      google_place_id: googlePlaceId || null,
      name,
      address: address || null,
      lat,
      lng,
    })
    .select("id, name, address, lat, lng")
    .single();

  if (placeErr) {
    // Unique race: another request inserted the same google_place_id first.
    if (placeErr.code === "23505" && googlePlaceId) {
      const { data: existing } = await supabase
        .from("places")
        .select("id, name, address, lat, lng")
        .eq("google_place_id", googlePlaceId)
        .maybeSingle();
      if (existing) return Response.json({ place: existing, created: false });
    }
    console.error("create place failed:", placeErr);
    return Response.json({ error: "Failed to create place" }, { status: 500 });
  }

  // Seed the auto-generated "current" contribution: dated today, titled with the
  // current establishment name fetched from Google. This is index 1 on the timeline.
  const today = new Date().toISOString().slice(0, 10);
  const { error: contribErr } = await supabase.from("contributions").insert({
    place_id: place.id,
    user_id: null,
    author_name: "Current establishment",
    title: name,
    body: "",
    memory_date: today,
    is_current: true,
  });
  if (contribErr) {
    console.error("seed current contribution failed:", contribErr);
  }

  return Response.json({ place, created: true });
}
