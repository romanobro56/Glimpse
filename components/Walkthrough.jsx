"use client";

import { useEffect, useState } from "react";
import { SignUpButton } from "@clerk/nextjs";

const STORAGE_KEY = "glimpse_walkthrough_seen";

const steps = [
  {
    title: "Welcome to Glimpse",
    body: "Glimpse is a living map of memories. Discover what places used to be — and share what you remember.",
  },
  {
    title: "Explore the map",
    body: "Click any dot on the map to see a place\u2019s timeline. Scroll through contributions from the community to travel back in time.",
  },
  {
    title: "Share a memory",
    body: "Sign in and drop a pin on a place you remember. Add a date, a description, and photos to tell the world what used to be there.",
  },
];

export default function Walkthrough() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setVisible(true);
      }
    } catch {
      // localStorage blocked — skip walkthrough
    }
  }, []);

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
  }

  if (!visible) return null;

  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-black/40 p-6">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        {/* Close button */}
        <button
          onClick={dismiss}
          className="absolute right-4 top-4 rounded-full p-1.5 text-foreground/30 transition-opacity hover:text-foreground/70"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Content */}
        <div className="px-8 pb-2 pt-10">
          <h2 className="font-serif text-[28px] leading-tight tracking-[-0.04em] text-foreground">
            {current.title}
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed tracking-[-0.02em] text-foreground/60">
            {current.body}
          </p>
        </div>

        {/* Step dots */}
        <div className="flex justify-center gap-2 px-8 py-4">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`h-2 rounded-full transition-all ${
                i === step ? "w-6 bg-primary" : "w-2 bg-foreground/15 hover:bg-foreground/25"
              }`}
              aria-label={`Step ${i + 1}`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between border-t border-black/[0.06] px-8 py-5">
          {step > 0 ? (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="text-[13px] font-medium uppercase tracking-[-0.03em] text-foreground/40 transition-opacity hover:text-foreground/70"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
            {isLast ? (
              <>
                <button
                  onClick={dismiss}
                  className="rounded-full bg-primary px-6 py-2.5 text-[13px] font-medium uppercase tracking-[-0.03em] text-white transition-colors hover:bg-primary-hover"
                >
                  All set
                </button>
                <SignUpButton mode="modal">
                  <button
                    onClick={dismiss}
                    className="rounded-full border border-foreground/15 px-6 py-2.5 text-[13px] font-medium uppercase tracking-[-0.03em] text-foreground/60 transition-opacity hover:text-foreground"
                  >
                    Sign up
                  </button>
                </SignUpButton>
              </>
            ) : (
              <button
                onClick={() => setStep((s) => s + 1)}
                className="rounded-full bg-primary px-6 py-2.5 text-[13px] font-medium uppercase tracking-[-0.03em] text-white transition-colors hover:bg-primary-hover"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
