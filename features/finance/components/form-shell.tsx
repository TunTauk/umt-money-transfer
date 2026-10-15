"use client";

import { startTransition, useActionState, type ReactNode } from "react";
import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { FinanceFormState } from "@/features/finance/actions";
import { FormNotice } from "./form-notice";

const initialState: FinanceFormState = { status: "idle" };

export function FormShell({
  action,
  children,
  submitLabel = "Save",
  className = "space-y-5",
  preserveValues = false,
}: {
  action: (state: FinanceFormState, data: FormData) => Promise<FinanceFormState>;
  children: ReactNode;
  submitLabel?: string;
  className?: string;
  preserveValues?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  return (
    <form action={formAction} className={className} onSubmit={preserveValues ? (event) => {
      // Dispatch manually to avoid React resetting fields before correction or confirmation.
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      startTransition(() => formAction(data));
    } : undefined}>
      {state.message && !(pending && state.status === "idle") ? <FormNotice status={state.status === "idle" ? "success" : state.status} message={state.message} /> : null}
      {state.status === "warning" && state.confirmation ? <label key={state.confirmation.key} className="col-span-full flex items-start gap-2 text-sm">
        <input className="mt-1 size-4 shrink-0 accent-primary" type="checkbox" name="confirmationKey" value={state.confirmation.key} required />
        <span>I understand the source balance will become negative and want to proceed.</span>
      </label> : null}
      {children}
      <Button type="submit" disabled={pending} className="w-fit justify-self-start">
        {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
        {pending ? "Saving..." : state.status === "warning" ? "Confirm transfer" : submitLabel}
      </Button>
    </form>
  );
}
