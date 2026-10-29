"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";

export function FormDialog({ title, description, triggerLabel, children }: { title: string; description: string; triggerLabel: string; children: ReactNode }) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const [formKey, setFormKey] = useState(0);

  return <>
    <Button type="button" onClick={() => {
      setFormKey((key) => key + 1);
      dialog.current?.showModal();
    }}><Plus className="size-4" aria-hidden="true" />{triggerLabel}</Button>
    <dialog
      ref={dialog}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
      className="m-auto max-h-[calc(100svh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-xl border bg-background p-6 text-foreground shadow-xl backdrop:bg-black/40"
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.current?.close();
      }}
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 id={`${id}-title`} className="text-xl font-semibold">{title}</h2>
          <p id={`${id}-description`} className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <Button type="button" variant="ghost" size="icon" aria-label="Close dialog" className="-mr-2 -mt-2 shrink-0" onClick={() => dialog.current?.close()}><X className="size-4" aria-hidden="true" /></Button>
      </div>
      <div key={formKey}>{children}</div>
      <div className="mt-5 flex justify-end border-t pt-4">
        <Button type="button" variant="outline" onClick={() => dialog.current?.close()}>Close</Button>
      </div>
    </dialog>
  </>;
}
