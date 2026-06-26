"use client";

import { useEffect, useRef, useState } from "react";
import { fetchJson } from "@/lib/api";

export default function SearchBar({ active, onActivate, onSelect, onClose }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);

  // Focus the input whenever the bar becomes active
  useEffect(() => {
    if (active) inputRef.current?.focus();
  }, [active]);

  // Clear state when deactivated
  useEffect(() => {
    if (!active) {
      setQuery("");
      setResults(null);
    }
  }, [active]);

  async function doSearch(q) {
    if (!q.trim()) {
      setResults(null);
      return;
    }
    setResults({ loading: true, places: [], error: "" });
    try {
      const data = await fetchJson(`/api/places/search?q=${encodeURIComponent(q.trim())}`);
      setResults({ loading: false, places: data.places || [], error: "" });
    } catch (err) {
      setResults({ loading: false, places: [], error: err.message });
    }
  }

  function handleChange(e) {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    if (!val.trim()) {
      setResults(null);
      return;
    }
    debounceRef.current = setTimeout(() => doSearch(val), 400);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      clearTimeout(debounceRef.current);
      doSearch(query);
    }
    if (e.key === "Escape") {
      setQuery("");
      setResults(null);
      onClose?.();
    }
  }

  const searchIcon = (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0 text-foreground/30">
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M11 11L14.5 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );

  // Inactive state — looks like a clickable pill
  if (!active) {
    return (
      <button
        onClick={onActivate}
        className="flex items-center gap-2 rounded-xl border border-black/[0.06] bg-white/95 px-4 py-3 shadow-sm backdrop-blur transition-colors hover:border-black/[0.12]"
      >
        {searchIcon}
        <span className="text-[13px] tracking-[-0.02em] text-foreground/40">Search places...</span>
      </button>
    );
  }

  // Active state — input in the same spot, results dropdown below
  return (
    <div className="w-72">
      <div className="overflow-hidden rounded-xl border border-black/[0.06] bg-white/95 shadow-sm backdrop-blur">
        <div className="flex items-center gap-2 px-4 py-3">
          {searchIcon}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Search places..."
            className="w-full bg-transparent text-[13px] tracking-[-0.02em] text-foreground placeholder:text-foreground/30 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="shrink-0 text-foreground/30 transition-opacity hover:text-foreground/70"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {results && (
          <div className="thin-scroll max-h-[50vh] divide-y divide-black/[0.04] overflow-y-auto border-t border-black/[0.04]">
            {results.loading && (
              <div className="px-5 py-5 text-center text-[13px] font-medium uppercase tracking-[-0.03em] text-foreground/40">
                Searching...
              </div>
            )}
            {results.error && !results.loading && (
              <div className="px-5 py-5 text-center text-[13px] text-rose-600">
                {results.error}
              </div>
            )}
            {!results.loading && !results.error && results.places.length === 0 && (
              <div className="px-5 py-5 text-center text-[13px] tracking-[-0.02em] text-foreground/40">
                No results found.
              </div>
            )}
            {!results.loading &&
              results.places.map((p) => (
                <button
                  key={p.googlePlaceId}
                  onClick={() => onSelect(p)}
                  className="block w-full px-5 py-3 text-left opacity-70 transition-opacity hover:opacity-100"
                >
                  <p className="text-[14px] font-medium tracking-[-0.03em] text-foreground">
                    {p.name}
                  </p>
                  {p.type && (
                    <p className="text-[12px] font-medium uppercase tracking-[-0.02em] text-primary">
                      {p.type}
                    </p>
                  )}
                  {p.address && (
                    <p className="mt-0.5 text-[12px] tracking-[-0.02em] text-foreground/40">
                      {p.address}
                    </p>
                  )}
                </button>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
