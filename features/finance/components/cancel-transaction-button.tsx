"use client";

import { useActionState } from "react";
import { Ban } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cancelTransaction, type FinanceFormState } from "@/features/finance/actions";

export function CancelTransactionButton({ id }: { id: string }) {
  const [state, action, pending] = useActionState(cancelTransaction, { status: "idle" } as FinanceFormState);
  return <form action={action} onSubmit={(event) => {
    if (!window.confirm("Cancel this transaction? Its amount and fee will be reversed. The original record will remain in the history.")) event.preventDefault();
  }}>
    <input type="hidden" name="id" value={id} />
    <Button type="submit" variant="outline" size="sm" className="text-destructive" disabled={pending}><Ban className="size-4" aria-hidden="true" />{pending ? "Cancelling..." : "Cancel transaction"}</Button>
    {state.message ? <p role={state.status === "error" ? "alert" : "status"} className={`mt-2 max-w-xs text-sm ${state.status === "error" ? "text-destructive" : "text-primary"}`}>{state.message}</p> : null}
  </form>;
}
