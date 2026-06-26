import { getSupabaseAdmin } from "@/lib/supabase";

// GET /api/places/[id] -> the place plus all its contributions, newest first,
// each annotated with its timeline index (most recent = 1). Public.
export async function GET(request, { params }) {
  const { id } = await params;
  let supabase;
  try {
    supabase = getSupabaseAdmin();
  } catch (err) {
    console.error("supabase init failed:", err);
    return Response.json({ error: err.message || "Server error" }, { status: 500 });
  }

  const { data: place, error: placeErr } = await supabase
    .from("places")
    .select("id, name, address, lat, lng")
    .eq("id", id)
    .maybeSingle();

  if (placeErr) {
    console.error("get place failed:", placeErr);
    return Response.json({ error: "Failed to load place" }, { status: 500 });
  }
  if (!place) {
    return Response.json({ error: "Place not found" }, { status: 404 });
  }

  const { data: contributions, error: contribErr } = await supabase
    .from("contributions")
    .select(
      "id, user_id, author_name, title, body, image_urls, memory_date, is_current, created_at"
    )
    .eq("place_id", id)
    .order("memory_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (contribErr) {
    console.error("get contributions failed:", contribErr);
    return Response.json({ error: "Failed to load contributions" }, { status: 500 });
  }

  // Index by recency: newest is 1, then 1 + the index of the next-more-recent.
  const indexed = (contributions || []).map((c, i) => ({ ...c, index: i + 1 }));

  return Response.json({ place, contributions: indexed });
}
