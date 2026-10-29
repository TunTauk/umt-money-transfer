"use client";

import { useState } from "react";
import type { FinancialAccount } from "@/generated/prisma/client";

import { saveInternalTransfer } from "@/features/finance/actions";
import { FormShell } from "./form-shell";
import { controlClass, Field } from "./ui";

export function TransferForm({ type, accounts, className = "grid gap-4 md:grid-cols-[1fr_1.4fr_1fr_1.5fr_auto] md:items-end" }: { type: "BANK" | "CASH"; accounts: FinancialAccount[]; className?: string }) {
  const [direction, setDirection] = useState<"MAIN_TO_CHILD" | "CHILD_TO_MAIN">("MAIN_TO_CHILD");
  const [childId, setChildId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  return <FormShell action={saveInternalTransfer} preserveValues submitLabel="Create transfer" className={className}>
    <input type="hidden" name="accountType" value={type} />
    <Field label="Direction"><select className={controlClass} name="direction" value={direction} onChange={(event) => setDirection(event.target.value as "MAIN_TO_CHILD" | "CHILD_TO_MAIN")}><option value="MAIN_TO_CHILD">Main to child</option><option value="CHILD_TO_MAIN">Child to main</option></select></Field>
    <Field label="Child account"><select className={controlClass} name="childAccountId" value={childId} onChange={(event) => setChildId(event.target.value)} required><option value="" disabled>Select child</option>{accounts.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
    <Field label="Amount"><input className={controlClass} name="amount" inputMode="numeric" pattern="[0-9]+" value={amount} onChange={(event) => setAmount(event.target.value)} required /></Field>
    <Field label="Note (optional)"><input className={controlClass} name="note" value={note} onChange={(event) => setNote(event.target.value)} /></Field>
  </FormShell>;
}
