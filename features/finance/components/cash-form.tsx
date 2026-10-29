"use client";

import { useState } from "react";
import type { FinancialAccount } from "@/generated/prisma/client";

import { feeCollectionAccountId, type FeeCollection } from "@/lib/finance/fee-collection";
import { saveCashTransaction } from "@/features/finance/actions";
import { FormShell } from "./form-shell";
import { controlClass, Field, textareaClass } from "./ui";

const feeMethods = [
  { value: "CASH", label: "Accept with cash" },
  { value: "ACCOUNT", label: "Accept with account" },
] as const;

export function CashForm({
  type,
  accounts,
}: {
  type: "CASH_IN" | "CASH_OUT";
  accounts: FinancialAccount[];
}) {
  const childAccounts = accounts.filter((item) => item.active && item.kind === "CHILD");
  const receivingType = type === "CASH_IN" ? "CASH" : "BANK";
  const payingType = type === "CASH_IN" ? "BANK" : "CASH";
  const receivingAccounts = childAccounts.filter((item) => item.type === receivingType);
  const payingAccounts = childAccounts.filter((item) => item.type === payingType);
  const [receivingId, setReceivingId] = useState("");
  const [payingId, setPayingId] = useState("");
  const [feeCollection, setFeeCollection] = useState<FeeCollection>("CASH");
  const [amountValue, setAmountValue] = useState("");
  const [feeValue, setFeeValue] = useState("0");
  const feeAccountId = feeCollectionAccountId(type, feeCollection, receivingId, payingId);
  const feeAccount = childAccounts.find((item) => item.id === feeAccountId);

  return (
    <FormShell action={saveCashTransaction} preserveValues submitLabel="Create transaction">
      <input type="hidden" name="type" value={type} />
      <div className="grid items-start gap-4 sm:grid-cols-2">
        <Field label="Customer name"><input className={controlClass} name="customerName" required /></Field>
        <Field label="Customer phone"><input className={controlClass} name="customerPhone" type="tel" inputMode="tel" required /></Field>
      </div>
      <div className="grid items-start gap-4 sm:grid-cols-2">
        <Field label="Receive Into"><select className={controlClass} name="receivingAccountId" value={receivingId} onChange={(event) => setReceivingId(event.target.value)} required><option value="" disabled>Select {receivingType.toLowerCase()} account</option>{receivingAccounts.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
        <Field label="Pay From"><select className={controlClass} name="payingAccountId" value={payingId} onChange={(event) => setPayingId(event.target.value)} required><option value="" disabled>Select {payingType.toLowerCase()} account</option>{payingAccounts.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
      </div>
      <div className="grid items-start gap-4 sm:grid-cols-2">
        <Field label="Amount paid to customer"><input className={controlClass} name="amount" inputMode="numeric" pattern="[0-9]+" value={amountValue} onChange={(event) => setAmountValue(event.target.value)} required /></Field>
        <Field label="Fee"><input className={controlClass} name="feeAmount" inputMode="numeric" pattern="[0-9]+" value={feeValue} onChange={(event) => setFeeValue(event.target.value)} required /></Field>
        <fieldset className="grid min-w-0 content-start gap-1.5">
          <legend className="mb-1.5 text-sm font-medium">Accept fee</legend>
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1" role="radiogroup" aria-label="Accept fee">
            {feeMethods.map((mode) => <label key={mode.value} className={`flex cursor-pointer flex-col items-center justify-center rounded-md px-3 py-2 text-center text-sm font-medium transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:checked]:bg-background has-[:checked]:text-primary has-[:checked]:shadow-sm ${feeCollection === mode.value ? "" : "text-muted-foreground"}`}>
              <input type="radio" name="feeCollection" value={mode.value} className="sr-only" checked={feeCollection === mode.value} onChange={() => setFeeCollection(mode.value)} />
              <span>{mode.label}</span>
            </label>)}
          </div>
        </fieldset>
        <p className="text-sm text-muted-foreground sm:pt-7" aria-live="polite">{feeAccount
          ? `Fee received into: ${feeAccount.name}`
          : `Select the transaction’s ${feeCollection === "CASH" ? "cash" : "bank"} account above to receive the fee.`}</p>
      </div>
      <Field label="Note (optional)"><textarea className={textareaClass} name="note" /></Field>
    </FormShell>
  );
}
