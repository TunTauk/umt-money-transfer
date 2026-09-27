"use client";

import { useActionState, type ReactNode } from "react";
import { AlertCircle, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { FinanceFormState } from "@/features/finance/actions";

const initialState: FinanceFormState = { status: "idle" };

export function FormShell({
  action,
  children,
  submitLabel = "Save",
  className = "space-y-5",
}: {
  action: (state: FinanceFormState, data: FormData) => Promise<FinanceFormState>;
  children: ReactNode;
  submitLabel?: string;
  className?: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  return (
    <form action={formAction} className={className}>
      {state.message ? (
        <div className={state.status === "error" ? "flex gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive" : "rounded-lg bg-primary/10 p-3 text-sm text-primary"} role={state.status === "error" ? "alert" : "status"}>
          {state.status === "error" ? <AlertCircle className="mt-0.5 size-4 shrink-0" /> : null}
          {state.message}
        </div>
      ) : null}
      {children}
      <Button type="submit" disabled={pending}>
        {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
        {pending ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
