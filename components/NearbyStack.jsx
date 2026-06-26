"use client";

export default function NearbyStack({ loading, places, onSelect, onClose, error }) {
  return (
    <div className="absolute right-4 top-[72px] z-[1000] w-80 max-w-[calc(100vw-2rem)]">
      <div className="overflow-hidden rounded-xl border border-black/[0.06] bg-white/95 shadow-sm backdrop-blur">
        <div className="flex items-center justify-between border-b border-black/[0.04] px-5 py-4">
          <div>
            <p className="font-serif text-xl leading-tight tracking-[-0.02em] text-foreground">
              Closest places
            </p>
            <p className="mt-0.5 text-[13px] font-medium uppercase leading-tight tracking-[-0.04em] text-foreground/40">
              Pick the spot you remember
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-foreground/30 transition-opacity hover:text-foreground/70"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="thin-scroll max-h-[60vh] divide-y divide-black/[0.04] overflow-y-auto">
          {loading && (
            <div className="px-5 py-6 text-center text-[13px] font-medium uppercase tracking-[-0.03em] text-foreground/40">
              Searching nearby…
            </div>
          )}
          {error && !loading && (
            <div className="px-5 py-6 text-center text-[13px] text-rose-600">{error}</div>
          )}
          {!loading && !error && places.length === 0 && (
            <div className="px-5 py-6 text-center text-[13px] tracking-[-0.02em] text-foreground/40">
              No establishments found right here. Try clicking a little closer to a building.
            </div>
          )}
          {!loading &&
            places.map((p) => (
              <button
                key={p.googlePlaceId}
                onClick={() => onSelect(p)}
                className="block w-full px-5 py-3 text-left opacity-70 transition-opacity hover:opacity-100"
              >
                <p className="text-[14px] font-medium tracking-[-0.03em] text-foreground">{p.name}</p>
                {p.type && (
                  <p className="text-[12px] font-medium uppercase tracking-[-0.02em] text-primary">{p.type}</p>
                )}
                {p.address && (
                  <p className="mt-0.5 text-[12px] tracking-[-0.02em] text-foreground/40">{p.address}</p>
                )}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
