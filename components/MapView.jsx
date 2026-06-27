"use client";

import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Copper dot for an existing place on the map.
const dotIcon = L.divIcon({
  className: "",
  html: '<div class="place-dot"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

// Pin marker for the spot the user just clicked while dropping a pin.
const pinIcon = L.divIcon({
  className: "",
  html: `<div style="position:relative;width:30px;height:42px;">
    <svg width="30" height="42" viewBox="0 0 30 42" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 0C6.7 0 0 6.7 0 15c0 11 15 27 15 27s15-16 15-27C30 6.7 23.3 0 15 0z" fill="#bf774a"/>
      <circle cx="15" cy="15" r="6" fill="#fff"/>
    </svg>
  </div>`,
  iconSize: [30, 42],
  iconAnchor: [15, 42],
});

function ClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

// Leaflet must recompute its size when the container width changes (panel open/close).
function ResizeOnLayout({ trigger }) {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 260);
    return () => clearTimeout(t);
  }, [trigger, map]);
  return null;
}

export default function MapView({
  places,
  onMapClick,
  onDotClick,
  dropMode,
  tempMarker,
  panelOpen,
  center,
}) {
  return (
    <div className={`h-full w-full ${dropMode ? "drop-cursor" : ""}`}>
      <MapContainer center={center} zoom={13} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution='<a href="https://jawg.io" title="Tiles Courtesy of Jawg Maps" target="_blank">&copy; <b>Jawg</b>Maps</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={`https://tile.jawg.io/jawg-lagoon/{z}/{x}/{y}{r}.png?access-token=${process.env.NEXT_PUBLIC_JAWG_TOKEN}`}
          minZoom={0}
          maxZoom={22}
        />
        <ClickHandler onMapClick={onMapClick} />
        <ResizeOnLayout trigger={panelOpen} />

        {places.map((p) => (
          <Marker
            key={p.id}
            position={[p.lat, p.lng]}
            icon={dotIcon}
            eventHandlers={{ click: () => onDotClick(p.id) }}
          />
        ))}

        {tempMarker && (
          <Marker position={[tempMarker.lat, tempMarker.lng]} icon={pinIcon} />
        )}
      </MapContainer>
    </div>
  );
}
