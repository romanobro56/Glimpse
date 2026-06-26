"use client";

import { useRef, useState } from "react";
import { fetchJson } from "@/lib/api";

const MAX_BODY = 10000;
const MAX_IMAGES = 5;

function yesterdayISO() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export default function ContributeForm({ placeId, placeName, onClose, onCreated }) {
  const [date, setDate] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileInput = useRef(null);

  const max = yesterdayISO();

  function onPickFiles(e) {
    const picked = Array.from(e.target.files || []);
    const combined = [...files, ...picked].slice(0, MAX_IMAGES);
    setFiles(combined);
    if (fileInput.current) fileInput.current.value = "";
  }

  function removeFile(i) {
    setFiles((f) => f.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!date) return setError("Pick the date this memory is from.");
    if (!body.trim() && files.length === 0)
      return setError("Add some text or at least one image.");

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.set("placeId", placeId);
      fd.set("memoryDate", date);
      fd.set("title", title);
      fd.set("body", body);
      files.forEach((f) => fd.append("images", f));

      const data = await fetchJson("/api/contributions", { method: "POST", body: fd });
      onCreated(data.contribution);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <div className="absolute inset-0 z-[1100] flex items-center justify-center bg-black/25 p-4">
      <div className="thin-scroll max-h-full w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-lg">
        <div className="flex items-start justify-between border-b border-black/[0.04] px-5 py-4">
          <div>
            <h3 className="font-serif text-xl leading-tight tracking-[-0.02em] text-foreground">
              Add a memory
            </h3>
            <p className="mt-0.5 text-[13px] font-medium uppercase tracking-[-0.04em] text-foreground/40">
              What did <span className="normal-case text-foreground/60">{placeName}</span> used to be?
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

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          <div>
            <label className="mb-1 block text-[12px] font-medium uppercase tracking-[-0.02em] text-foreground/40">
              Date of this memory
            </label>
            <input
              type="date"
              value={date}
              max={max}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-foreground/10 bg-white px-3 py-2 text-[14px] tracking-[-0.02em] text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              required
            />
            <p className="mt-1 text-[11px] tracking-[-0.02em] text-foreground/30">
              Must be in the past — the present is reserved for what&apos;s here now.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-[12px] font-medium uppercase tracking-[-0.02em] text-foreground/40">
              What was it? <span className="normal-case font-normal text-foreground/25">(optional title)</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Tower Records"
              className="w-full rounded-lg border border-foreground/10 bg-white px-3 py-2 text-[14px] tracking-[-0.02em] text-foreground placeholder:text-foreground/25 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="mb-1 block text-[12px] font-medium uppercase tracking-[-0.02em] text-foreground/40">
              Your memory
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value.slice(0, MAX_BODY))}
              rows={5}
              placeholder="Describe what this place used to be, or a memory you have of it…"
              className="w-full resize-y rounded-lg border border-foreground/10 bg-white px-3 py-2 text-[14px] tracking-[-0.02em] text-foreground placeholder:text-foreground/25 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <div className="mt-1 text-right text-[11px] tracking-[-0.02em] text-foreground/25">
              {body.length.toLocaleString()} / {MAX_BODY.toLocaleString()}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[12px] font-medium uppercase tracking-[-0.02em] text-foreground/40">
              Photos <span className="normal-case font-normal text-foreground/25">(up to {MAX_IMAGES})</span>
            </label>
            {files.length > 0 && (
              <div className="mb-2 grid grid-cols-3 gap-2">
                {files.map((f, i) => (
                  <div key={i} className="group relative aspect-square overflow-hidden rounded-lg border border-foreground/[0.06]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={URL.createObjectURL(f)}
                      alt={f.name}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="absolute right-1 top-1 rounded-full bg-black/60 px-1.5 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
            {files.length < MAX_IMAGES && (
              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                multiple
                onChange={onPickFiles}
                className="block w-full text-[12px] tracking-[-0.02em] text-foreground/50 file:mr-3 file:rounded-full file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-[12px] file:font-medium file:text-primary hover:file:bg-primary/20"
              />
            )}
          </div>

          {error && <p className="text-[13px] text-rose-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-4 py-2 text-[13px] font-medium uppercase tracking-[-0.03em] text-foreground/40 transition-opacity hover:text-foreground/70"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-primary px-5 py-2 text-[13px] font-medium uppercase tracking-[-0.03em] text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
            >
              {submitting ? "Posting…" : "Post memory"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
