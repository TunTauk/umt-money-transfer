"use client";

import { useState } from "react";
import type { FinancialAccount, FinancialTransaction } from "@/generated/prisma/client";

import { saveCashTransaction } from "@/features/finance/actions";
import { FormShell } from "./form-shell";
import { controlClass, Field, textareaClass } from "./ui";

const feeModes = [
  { value: "DEDUCTED", label: "ပမာဏမှ ဖျတ်မည်", hint: "Included in received total" },
  { value: "SEPARATE", label: "သီးသန့်ပေးမည်", hint: "Paid separately" },
] as const;

export function CashForm({
  type,
  accounts,
  transaction,
}: {
  type: "CASH_IN" | "CASH_OUT";
  accounts: FinancialAccount[];
  transaction?: FinancialTransaction;
}) {
  const childAccounts = accounts.filter((item) => item.active && item.kind === "CHILD");
  const receivingType = type === "CASH_IN" ? "CASH" : "BANK";
  const payingType = type === "CASH_IN" ? "BANK" : "CASH";
  const receivingAccounts = childAccounts.filter((item) => item.type === receivingType);
  const payingAccounts = childAccounts.filter((item) => item.type === payingType);
  const [receivingId, setReceivingId] = useState(receivingAccounts.find((item) => item.id === (
    transaction?.destinationAccountId ?? (type === "CASH_OUT" ? transaction?.accountId : null)
  ))?.id ?? "");
  const [payingId, setPayingId] = useState(payingAccounts.find((item) => item.id === (
    transaction?.sourceAccountId ?? (type === "CASH_IN" ? transaction?.accountId : null)
  ))?.id ?? "");
  const [feeMode, setFeeMode] = useState<"DEDUCTED" | "SEPARATE">(transaction?.feeMode ?? "DEDUCTED");
  const [feeAccountId, setFeeAccountId] = useState(childAccounts.find((item) => item.id === transaction?.feeAccountId)?.id ?? "");
  const [amountValue, setAmountValue] = useState(transaction?.amount?.toString() ?? "");
  const [feeValue, setFeeValue] = useState(transaction?.feeAmount?.toString() ?? "0");
  const feeRequired = /^\d+$/.test(feeValue) && BigInt(feeValue) > 0n;
  const accountOptions = (["BANK", "CASH"] as const).map((accountType) => {
    const group = childAccounts.filter((item) => item.type === accountType);
    return group.length ? <optgroup key={accountType} label={accountType === "BANK" ? "Bank Accounts" : "Cash Accounts"}>
      {group.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
    </optgroup> : null;
  });

  return (
    <FormShell action={saveCashTransaction} submitLabel={transaction ? "Save changes" : "Create transaction"}>
      <input type="hidden" name="type" value={type} />
      {transaction ? <><input type="hidden" name="id" value={transaction.id} /><input type="hidden" name="reference" value={transaction.reference} /></> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Customer name"><input className={controlClass} name="customerName" defaultValue={transaction?.customerName ?? ""} required /></Field>
        <Field label="Customer phone"><input className={controlClass} name="customerPhone" inputMode="tel" defaultValue={transaction?.customerPhone ?? ""} required /></Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Receive Into"><select className={controlClass} name="receivingAccountId" value={receivingId} onChange={(event) => setReceivingId(event.target.value)} required><option value="" disabled>Select {receivingType.toLowerCase()} account</option>{receivingAccounts.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
        <Field label="Pay From"><select className={controlClass} name="payingAccountId" value={payingId} onChange={(event) => setPayingId(event.target.value)} required><option value="" disabled>Select {payingType.toLowerCase()} account</option>{payingAccounts.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Amount paid to customer" hint="Whole MMK only"><input className={controlClass} name="amount" inputMode="numeric" pattern="[0-9]+" value={amountValue} onChange={(event) => setAmountValue(event.target.value)} required /></Field>
        <Field label="Fee" hint="Whole MMK only"><input className={controlClass} name="feeAmount" inputMode="numeric" pattern="[0-9]+" value={feeValue} onChange={(event) => setFeeValue(event.target.value)} required /></Field>
        <fieldset className="grid gap-1.5">
          <legend className="mb-1.5 text-sm font-medium">Fee mode (အခကြေး)</legend>
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1" role="radiogroup" aria-label="Fee mode">
            {feeModes.map((mode) => <label key={mode.value} className={`flex cursor-pointer flex-col items-center justify-center rounded-md px-3 py-2 text-center text-sm font-medium transition-colors has-[:checked]:bg-background has-[:checked]:text-primary has-[:checked]:shadow-sm ${feeMode === mode.value ? "" : "text-muted-foreground"}`}>
              <input type="radio" name="feeMode" value={mode.value} className="sr-only" checked={feeMode === mode.value} onChange={() => setFeeMode(mode.value)} />
              <span>{mode.label}</span>
              <span className="text-[10px] font-normal opacity-70">{mode.hint}</span>
            </label>)}
          </div>
        </fieldset>
        {feeMode === "SEPARATE" ? <Field label="Receive fee into" hint={feeRequired ? "The fee increases this account separately." : "Optional when fee is 0"}>
          <select className={controlClass} name="feeAccountId" value={feeAccountId} onChange={(event) => setFeeAccountId(event.target.value)} required={feeRequired}><option value="">{feeRequired ? "Select fee receiving account" : "Optional"}</option>{accountOptions}</select>
        </Field> : <p className="self-end text-sm text-muted-foreground">Receive the amount plus fee from the customer. Pay the entered amount to the customer.</p>}
      </div>
      <Field label="Note (optional)"><textarea className={textareaClass} name="note" defaultValue={transaction?.note ?? ""} /></Field>
    </FormShell>
  );
}
