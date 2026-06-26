"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Show, SignInButton } from "@clerk/nextjs";
import Timeline, { layoutTimeline } from "./Timeline";
import TimelineSkip from "./TimelineSkip";
import ContributeForm from "./ContributeForm";
import { fetchJson } from "@/lib/api";

function fmtFull(iso) {
  return new Date(iso + "T00:00:00").toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function Detail({ contribution }) {
  if (!contribution) return null;
  const c = contribution;
  return (
    <div className="sticky top-0 ml-2 flex-1 self-start pb-10">
      <div className="rounded-xl border border-black/[0.04] bg-background p-5">
        <div className="mb-2 flex items-center gap-2">
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-white ${
              c.is_current ? "bg-secondary" : "bg-primary"
            }`}
          >
            {c.index}
          </span>
          <span className="text-[13px] font-medium tracking-[-0.03em] text-foreground">
            {c.is_current ? "Here today" : fmtFull(c.memory_date)}
          </span>
        </div>

        {c.title && (
          <h4 className="font-serif text-xl leading-tight tracking-[-0.02em] text-foreground">{c.title}</h4>
        )}
        <p className="mt-1 text-[12px] font-medium uppercase tracking-[-0.02em] text-foreground/40">
          {c.is_current ? "Current establishment (from Google)" : `Shared by ${c.author_name}`}
        </p>

        {c.image_urls?.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {c.image_urls.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`memory ${i + 1}`}
                  className="aspect-square w-full rounded-lg object-cover"
                />
              </a>
            ))}
          </div>
        )}

        {c.body && (
          <p className="mt-3 whitespace-pre-wrap text-[14px] leading-relaxed tracking-[-0.02em] text-foreground/70">
            {c.body}
          </p>
        )}

        {c.is_current && !c.body && (
          <p className="mt-3 text-[14px] tracking-[-0.02em] text-foreground/40">
            This is what&apos;s here now. Scroll the timeline to travel back — or add a
            memory of what used to be.
          </p>
        )}
      </div>
    </div>
  );
}

export default function PlacePanel({ placeId, onClose }) {
  const [data, setData] = useState(null); // { place, contributions }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const json = await fetchJson(`/api/places/${placeId}`);
      setData(json);
      setSelectedId((prev) =>
        prev && json.contributions.some((c) => c.id === prev)
          ? prev
          : json.contributions[0]?.id ?? null
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [placeId]);

  useEffect(() => {
    load();
  }, [load]);

  const scrollRef = useRef(null);
  const selected = data?.contributions.find((c) => c.id === selectedId) || null;
  const layout = data ? layoutTimeline(data.contributions) : null;

  return (
    <aside className="absolute right-0 top-0 z-[1050] flex h-full w-[40%] min-w-[360px] flex-col border-l border-black/[0.06] bg-white shadow-lg">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-black/[0.06] px-5 py-4">
        <div className="min-w-0">
          <h2 className="truncate font-serif text-[26px] leading-tight tracking-[-0.04em] text-foreground">
            {data?.place?.name || (loading ? "Loading…" : "Place")}
          </h2>
          {data?.place?.address && (
            <p className="mt-0.5 truncate text-[12px] font-medium uppercase tracking-[-0.02em] text-foreground/40">
              {data.place.address}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          className="shrink-0 rounded-full p-1.5 text-foreground/30 transition-opacity hover:text-foreground/70"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between border-b border-black/[0.04] px-5 py-2.5">
        <p className="text-[12px] font-medium uppercase tracking-[-0.02em] text-foreground/40">
          {data ? `${data.contributions.length} moment${data.contributions.length === 1 ? "" : "s"} in time` : ""}
        </p>
        <Show when="signed-in">
          <button
            onClick={() => setShowForm(true)}
            className="rounded-full bg-secondary px-4 py-1.5 text-[12px] font-medium uppercase tracking-[-0.02em] text-foreground transition-colors hover:bg-secondary/80"
          >
            + Add a memory
          </button>
        </Show>
        <Show when="signed-out">
          <SignInButton mode="modal">
            <button className="rounded-full border border-primary/30 px-4 py-1.5 text-[12px] font-medium uppercase tracking-[-0.02em] text-primary transition-opacity hover:border-primary/60">
              Sign in to contribute
            </button>
          </SignInButton>
        </Show>
      </div>

      {/* Body: timeline + detail */}
      <div className="relative flex-1 overflow-hidden">
        <div className="thin-scroll h-full overflow-y-auto px-4 py-4" ref={scrollRef}>
          {loading && (
            <p className="text-[13px] font-medium uppercase tracking-[-0.03em] text-foreground/40">
              Loading timeline…
            </p>
          )}
          {error && <p className="text-[13px] text-rose-600">{error}</p>}
          {!loading && !error && data && (
            <div className="flex">
              <Timeline
                contributions={data.contributions}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
              <Detail contribution={selected} />
            </div>
          )}
        </div>
        {layout && layout.items.length > 1 && (
          <TimelineSkip scrollRef={scrollRef} items={layout.items} />
        )}
      </div>

      {showForm && data?.place && (
        <ContributeForm
          placeId={placeId}
          placeName={data.place.name}
          onClose={() => setShowForm(false)}
          onCreated={(contribution) => {
            setShowForm(false);
            setSelectedId(contribution.id);
            load();
          }}
        />
      )}
    </aside>
  );
}
