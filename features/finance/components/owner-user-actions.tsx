"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { changeOwnPassword } from "@/features/auth/actions/change-password";
import { updateOwnerAccess, type FinanceFormState } from "@/features/finance/actions";
import { FormNotice } from "./form-notice";
import { FormShell } from "./form-shell";
import { controlClass, Field } from "./ui";

export function OwnPasswordForm() {
  return <details className="min-w-48 text-left">
    <summary className="cursor-pointer text-right font-medium text-primary">Change password</summary>
    <FormShell action={changeOwnPassword} submitLabel="Update password" className="mt-4 w-64 space-y-4">
      <Field label="Current password"><input className={controlClass} name="currentPassword" type="password" autoComplete="current-password" required /></Field>
      <Field label="New password"><input className={controlClass} name="newPassword" type="password" autoComplete="new-password" minLength={8} maxLength={128} required /></Field>
      <Field label="Confirm new password"><input className={controlClass} name="confirmPassword" type="password" autoComplete="new-password" minLength={8} maxLength={128} required /></Field>
    </FormShell>
  </details>;
}

export function OwnerUserActions({ userId, name, active }: { userId: string; name: string; active: boolean }) {
  const [state, action, pending] = useActionState(updateOwnerAccess, { status: "idle" } as FinanceFormState);
  return <form action={action} className="space-y-3" onSubmit={(event) => {
    const button = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    if (button?.value === "delete" && !window.confirm(`Delete owner ${name}? This permanently removes their account and sign-in access.`)) event.preventDefault();
  }}>
    <input type="hidden" name="userId" value={userId} />
    {state.message ? <FormNotice status={state.status === "idle" ? "success" : state.status} message={state.message} /> : null}
    <div className="flex justify-end gap-2">
      <Button size="sm" variant="outline" name="operation" value={active ? "deactivate" : "activate"} disabled={pending} className={active ? "text-destructive" : "text-primary"}>{active ? "Deactivate" : "Activate"}</Button>
      <Button size="sm" variant="outline" name="operation" value="delete" disabled={pending} className="text-destructive">Delete</Button>
    </div>
  </form>;
}
