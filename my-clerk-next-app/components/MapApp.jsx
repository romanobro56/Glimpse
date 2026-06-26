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

      {/* Brand + auth — top left */}
      <div className="pointer-events-none absolute left-4 top-4 z-[1000] flex flex-col gap-3">
        <div className="pointer-events-auto w-64 rounded-xl border border-black/[0.06] bg-white/95 px-5 py-4 shadow-sm backdrop-blur">
          <h1 className="font-serif text-[26px] font-normal leading-tight tracking-[-0.04em] text-foreground">
            Glimpse
          </h1>
          <p className="mt-0.5 text-[13px] font-medium uppercase leading-tight tracking-[-0.04em] text-foreground/40">
            What places used to be
          </p>
          <div className="mt-4 flex items-center gap-2">
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button className="rounded-full border border-foreground/15 px-4 py-1.5 text-[13px] font-medium uppercase tracking-[-0.03em] text-foreground/60 transition-opacity hover:text-foreground">
                  Sign in
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="rounded-full bg-primary px-4 py-1.5 text-[13px] font-medium uppercase tracking-[-0.03em] text-white transition-colors hover:bg-primary-hover">
                  Sign up
                </button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <UserButton afterSignOutUrl="/" />
              <span className="text-[13px] font-medium uppercase tracking-[-0.03em] text-foreground/40">
                Signed in
              </span>
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
              className="rounded-full bg-foreground/80 px-6 py-3 text-[13px] font-medium uppercase tracking-[-0.03em] text-white shadow-lg transition-colors hover:bg-foreground"
            >
              Click a spot on the map — or cancel
            </button>
          ) : (
            <button
              onClick={() => setDropMode(true)}
              className="rounded-full bg-secondary px-6 py-3 text-[13px] font-medium uppercase tracking-[-0.03em] text-foreground shadow-lg transition-colors hover:bg-secondary/80"
            >
              Drop a pin to add a memory
            </button>
          )}
        </Show>
        <Show when="signed-out">
          <SignInButton mode="modal">
            <button className="rounded-full bg-secondary px-6 py-3 text-[13px] font-medium uppercase tracking-[-0.03em] text-foreground shadow-lg transition-colors hover:bg-secondary/80">
              Sign in to contribute
            </button>
          </SignInButton>
        </Show>
      </div>

      {creating && (
        <div className="absolute inset-0 z-[1200] flex items-center justify-center bg-black/15">
          <div className="rounded-xl bg-white px-5 py-3 text-[13px] font-medium uppercase tracking-[-0.03em] text-foreground/60 shadow-lg">
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
