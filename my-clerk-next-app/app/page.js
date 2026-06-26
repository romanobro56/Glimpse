"use client";

import dynamic from "next/dynamic";

const MapApp = dynamic(() => import("@/components/MapApp"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#d4e8f0] font-serif text-lg tracking-tight text-foreground/40">
      Loading map…
    </div>
  ),
});

export default function Home() {
  return (
    <main className="h-full w-full">
      <MapApp />
    </main>
  );
}
