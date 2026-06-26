import { searchPlaces } from "@/lib/places";

// GET /api/places/search?q=..  -> up to 5 text search results.
export async function GET(request) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q");

  if (!q || !q.trim()) {
    return Response.json({ error: "q (query) is required" }, { status: 400 });
  }

  try {
    const places = await searchPlaces(q.trim(), 5);
    return Response.json({ places });
  } catch (err) {
    console.error("text search failed:", err);
    return Response.json({ error: "Search failed" }, { status: 502 });
  }
}
