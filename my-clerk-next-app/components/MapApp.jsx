"use client";

import { useEffect, useState } from "react";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import MapView from "./MapView";
import NearbyStack from "./NearbyStack";
import PlacePanel from "./PlacePanel";
import { fetchJson } from "@/lib/api";

const DEFAULT_CENTER = [40.758, -73.9855]; // Times Square

export default function MapApp() {
  const [places, setPlaces] = useState([]);
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [dropMode, setDropMode] = useState(false);
  const [tempMarker, setTempMarker] = useState(null);
  const [nearby, setNearby] = useState(null); // { loading, places, error }
  const [selectedPlaceId, setSelectedPlaceId] = useState(null);
  const [creating, setCreating] = useState(false);

  // Load all existing places for the map dots.
  useEffect(() => {
    fetchJson("/api/places")
      .then((d) => setPlaces(d.places || []))
      .catch((err) => console.warn("Could not load places:", err.message));
  }, []);

  // Center on the user's location if they allow it.
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCenter([pos.coords.latitude, pos.coords.longitude]),
      () => {},
      { enableHighAccuracy: false, timeout: 5000 }
    );
  }, []);

  async function handleMapClick(latlng) {
    if (!dropMode) return;
    setTempMarker(latlng);
    setNearby({ loading: true, places: [], error: "" });
    try {
      const data = await fetchJson(
        `/api/places/nearby?lat=${latlng.lat}&lng=${latlng.lng}`
      );
      setNearby({ loading: false, places: data.places || [], error: "" });
    } catch (err) {
      setNearby({ loading: false, places: [], error: err.message });
    }
  }

  function closeNearby() {
    setNearby(null);
    setTempMarker(null);
    setDropMode(false);
  }

  async function handleSelectNearby(googlePlace) {
    setCreating(true);
    try {
      const data = await fetchJson("/api/places", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          googlePlaceId: googlePlace.googlePlaceId,
          name: googlePlace.name,
          address: googlePlace.address,
          lat: googlePlace.lat,
          lng: googlePlace.lng,
        }),
      });

      // Add a dot for newly created places.
      setPlaces((prev) =>
        prev.some((p) => p.id === data.place.id) ? prev : [...prev, data.place]
      );
      setSelectedPlaceId(data.place.id);
      closeNearby();
    } catch (err) {
      setNearby((n) => ({ ...(n || { places: [] }), loading: false, error: err.message }));
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="relative h-full w-full">
      <MapView
        places={places}
        onMapClick={handleMapClick}
        onDotClick={setSelectedPlaceId}
        dropMode={dropMode}
        tempMarker={tempMarker}
        panelOpen={!!selectedPlaceId}
        center={center}
      />

      {/* Brand + auth — top left so it never collides with the panel or stack */}
      <div className="pointer-events-none absolute left-4 top-4 z-[1000] flex flex-col gap-3">
        <div className="pointer-events-auto w-72 rounded-2xl border border-black/10 bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
          <h1 className="text-lg font-extrabold tracking-tight text-zinc-900">
            🕰️ Glimpse
          </h1>
          <p className="text-xs text-zinc-500">
            A living map of what places used to be.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
                  Sign in
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="rounded-full bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-700">
                  Sign up
                </button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <UserButton afterSignOutUrl="/" />
              <span className="text-sm text-zinc-600">You&apos;re signed in</span>
            </Show>
          </div>
        </div>
      </div>

      {/* Pin-drop control — bottom center */}
      <div className="absolute bottom-6 left-1/2 z-[1000] -translate-x-1/2">
        <Show when="signed-in">
          {dropMode ? (
            <button
              onClick={closeNearby}
              className="rounded-full bg-rose-600 px-6 py-3 text-sm font-semibold text-white shadow-xl hover:bg-rose-700"
            >
              Click a spot on the map — or cancel
            </button>
          ) : (
            <button
              onClick={() => setDropMode(true)}
              className="rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-xl hover:bg-blue-700"
            >
              📍 Drop a pin to add a memory
            </button>
          )}
        </Show>
        <Show when="signed-out">
          <SignInButton mode="modal">
            <button className="rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-xl hover:bg-blue-700">
              📍 Sign in to contribute
            </button>
          </SignInButton>
        </Show>
      </div>

      {creating && (
        <div className="absolute inset-0 z-[1200] flex items-center justify-center bg-black/20">
          <div className="rounded-xl bg-white px-5 py-3 text-sm font-medium text-zinc-700 shadow-xl">
            Adding place…
          </div>
        </div>
      )}

      {nearby && (
        <NearbyStack
          loading={nearby.loading}
          places={nearby.places}
          error={nearby.error}
          onSelect={handleSelectNearby}
          onClose={closeNearby}
        />
      )}

      {selectedPlaceId && (
        <PlacePanel
          placeId={selectedPlaceId}
          onClose={() => setSelectedPlaceId(null)}
        />
      )}
    </div>
  );
}
