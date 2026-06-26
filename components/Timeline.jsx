"use client";

const MS_DAY = 86400000;
const TOP = 70;
const MIN_GAP = 116;
const PX_PER_DAY = 0.45;
const TAIL = 460;

function fmtDate(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function layoutTimeline(contributions) {
  if (contributions.length === 0) return { items: [], totalHeight: TOP + TAIL };
  const ref = new Date(contributions[0].memory_date + "T00:00:00").getTime();
  let prev = TOP;
  const items = contributions.map((c, i) => {
    const days = Math.max(0, (ref - new Date(c.memory_date + "T00:00:00").getTime()) / MS_DAY);
    const proportional = TOP + days * PX_PER_DAY;
    const y = i === 0 ? TOP : Math.max(prev + MIN_GAP, proportional);
    prev = y;
    return { c, y };
  });
  return { items, totalHeight: prev + TAIL };
}

export default function Timeline({ contributions, selectedId, onSelect }) {
  const { items, totalHeight } = layoutTimeline(contributions);
  const lineX = 26;

  return (
    <div className="relative shrink-0" style={{ width: 150, height: totalHeight }}>
      {/* The line — copper gradient fading out */}
      <div
        className="absolute w-[2px]"
        style={{
          left: lineX,
          top: 12,
          height: totalHeight - 12,
          background:
            "linear-gradient(to bottom, #77cff6 0%, #77cff6 70%, rgba(119,207,246,0) 100%)",
        }}
      />

      {items.map(({ c, y }) => {
        const selected = c.id === selectedId;
        return (
          <div key={c.id} className="absolute left-0" style={{ top: y, transform: "translateY(-50%)" }}>
            <button
              onClick={() => onSelect(c.id)}
              className={[
                "relative flex h-9 w-9 items-center justify-center rounded-full border-2 text-[11px] font-bold transition-all",
                selected
                  ? "scale-110 border-primary bg-primary text-foreground shadow-md"
                  : c.is_current
                  ? "border-primary/60 bg-primary/20 text-foreground hover:bg-primary/30"
                  : "border-primary/40 bg-primary/10 text-foreground hover:bg-primary/25",
              ].join(" ")}
              style={{ marginLeft: lineX - 18 + 2 }}
              title={fmtDate(c.memory_date)}
            >
              {c.index}
            </button>
            <div
              className="pointer-events-none absolute whitespace-nowrap text-[11px] leading-tight tracking-[-0.03em]"
              style={{ left: lineX + 26, top: "50%", transform: "translateY(-50%)" }}
            >
              <div className="font-medium text-foreground/70">
                {c.is_current ? "Now" : fmtDate(c.memory_date)}
              </div>
              {!c.is_current && (
                <div className="text-foreground/30">{new Date(c.memory_date + "T00:00:00").getFullYear()}</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
