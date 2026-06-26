// Google Places API (New) helper. Runs server-side only so the API key is
// never exposed to the browser. We use Nearby Search ranked by DISTANCE to find
// the establishments closest to where the user clicked on the map.

const NEARBY_URL = "https://places.googleapis.com/v1/places:searchNearby";

export async function findNearbyPlaces(lat, lng, max = 5) {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) throw new Error("GOOGLE_MAPS_API_KEY is not set");

  const res = await fetch(NEARBY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.location,places.primaryTypeDisplayName",
    },
    body: JSON.stringify({
      maxResultCount: Math.min(Math.max(max, 1), 20),
      rankPreference: "DISTANCE",
      locationRestriction: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: 250.0, // metres; required by the API even when ranking by distance
        },
      },
    }),
    // Places responses are request-specific; never cache.
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google Places error (${res.status}): ${text}`);
  }

  const data = await res.json();
  const places = data.places || [];
  return places.slice(0, max).map((p) => ({
    googlePlaceId: p.id,
    name: p.displayName?.text || "Unnamed place",
    address: p.formattedAddress || "",
    type: p.primaryTypeDisplayName?.text || "",
    lat: p.location?.latitude,
    lng: p.location?.longitude,
  }));
}
