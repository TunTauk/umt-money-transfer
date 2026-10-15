"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, X } from "lucide-react";

export function SuccessToast({ message }: { message: string }) {
  const [visible, setVisible] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const remaining = useRef(4000);

  useEffect(() => {
    if (!visible || hovered || focused) return;

    const started = performance.now();
    const timer = window.setTimeout(() => setVisible(false), remaining.current);
    return () => {
      window.clearTimeout(timer);
      remaining.current = Math.max(0, remaining.current - (performance.now() - started));
    };
  }, [visible, hovered, focused]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-x-4 top-4 z-[100] flex items-start gap-3 rounded-lg border border-primary/30 bg-background bg-linear-to-r from-primary/10 to-primary/5 p-3 text-sm text-primary shadow-lg sm:left-auto sm:right-6 sm:top-6 sm:w-96 sm:max-w-[calc(100vw-3rem)]"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") setVisible(false);
      }}
    >
      <CheckCircle2 className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <p className="min-w-0 flex-1 self-center break-words" role="status" aria-atomic="true">{message}</p>
      <button
        type="button"
        aria-label="Dismiss notification"
        className="-m-1 flex size-8 shrink-0 items-center justify-center rounded-md hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        onClick={() => setVisible(false)}
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
