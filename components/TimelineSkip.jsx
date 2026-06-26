"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Smooth-scroll the given element to `targetTop` over `duration` ms
 * using an ease-in-out cubic curve.
 */
function smoothScrollTo(el, targetTop, duration = 1300) {
  const start = el.scrollTop;
  const dist = targetTop - start;
  if (dist === 0) return;
  const t0 = performance.now();

  function step(now) {
    const p = Math.min((now - t0) / duration, 1);
    const ease =
      p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
    el.scrollTop = start + dist * ease;
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/**
 * Renders up/down skip arrows over the timeline when contributions
 * are off-screen above or below the visible scroll area.
 *
 * Props:
 *  - scrollRef : React ref to the overflow-y-auto container
 *  - items     : array of { c, y } from layoutTimeline
 *  - padTop    : extra px above the first dot inside the scroll content (default 16 for py-4)
 */
export default function TimelineSkip({ scrollRef, items, padTop = 16 }) {
  const [above, setAbove] = useState(null); // y of nearest off-screen-above item
  const [below, setBelow] = useState(null); // y of nearest off-screen-below item

  const compute = useCallback(() => {
    const el = scrollRef.current;
    if (!el || items.length === 0) {
      setAbove(null);
      setBelow(null);
      return;
    }

    const top = el.scrollTop;
    const bot = top + el.clientHeight;

    let nearestAbove = null;
    let nearestBelow = null;

    for (const { y } of items) {
      const dotCenter = padTop + y;
      // dot is 36px tall, consider it visible if its center is within the viewport
      if (dotCenter < top + 18) {
        // off-screen above — keep the closest (largest y that's still above)
        if (nearestAbove === null || y > nearestAbove) nearestAbove = y;
      } else if (dotCenter > bot - 18) {
        // off-screen below — keep the closest (smallest y that's still below)
        if (nearestBelow === null || y < nearestBelow) nearestBelow = y;
      }
    }

    setAbove(nearestAbove);
    setBelow(nearestBelow);
  }, [scrollRef, items, padTop]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    compute();
    el.addEventListener("scroll", compute, { passive: true });
    window.addEventListener("resize", compute);
    return () => {
      el.removeEventListener("scroll", compute);
      window.removeEventListener("resize", compute);
    };
  }, [scrollRef, compute]);

  // Also recompute when items change (e.g. new contribution added)
  useEffect(compute, [compute]);

  function scrollTo(y) {
    const el = scrollRef.current;
    if (!el) return;
    // Scroll so the dot is centered vertically
    const target = padTop + y - el.clientHeight / 2;
    smoothScrollTo(el, Math.max(0, target), 1300);
  }

  // Position arrows on the timeline line (left ~42px = px-4 + lineX 26)
  const arrowLeft = 30; // centered on timeline line

  return (
    <>
      {above !== null && (
        <button
          onClick={() => scrollTo(above)}
          className="timeline-skip-btn absolute z-10"
          style={{ left: arrowLeft, top: 8 }}
          aria-label="Skip to previous contribution"
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path
              d="M11 16L11 6M11 6L6 11M11 6L16 11"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
      {below !== null && (
        <button
          onClick={() => scrollTo(below)}
          className="timeline-skip-btn absolute z-10"
          style={{ left: arrowLeft, bottom: 8 }}
          aria-label="Skip to next contribution"
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path
              d="M11 6L11 16M11 16L16 11M11 16L6 11"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
    </>
  );
}
