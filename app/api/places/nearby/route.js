import { findNearbyPlaces } from "@/lib/places";

// GET /api/places/nearby?lat=..&lng=..  -> up to 5 closest establishments.
// Public: used to populate the selection stack after a map click.
export async function GET(request) {
  const { searchParams } = request.nextUrl;
  const lat = parseFloat(searchParams.get("lat"));
  const lng = parseFloat(searchParams.get("lng"));

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return Response.json({ error: "lat and lng are required" }, { status: 400 });
  }

  try {
    const places = await findNearbyPlaces(lat, lng, 5);
    return Response.json({ places });
  } catch (err) {
    console.error("nearby search failed:", err);
    return Response.json({ error: "Nearby search failed" }, { status: 502 });
  }
}
