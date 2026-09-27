"use client";

import { useState } from "react";
import type { FinancialAccount, FinancialTransaction } from "@/generated/prisma/client";

import { saveCashTransaction } from "@/features/finance/actions";
import { FormShell } from "./form-shell";
import { controlClass, Field, textareaClass } from "./ui";

const feeModes = [
  { value: "DEDUCTED", label: "ပမာဏမှ ဖျတ်မည်", hint: "Deduct from amount" },
  { value: "SEPARATE", label: "သီးသန့်ပေးမည်", hint: "Paid separately" },
] as const;

export function CashForm({
  type,
  accounts,
  teller,
  transaction,
}: {
  type: "CASH_IN" | "CASH_OUT";
  accounts: FinancialAccount[];
  teller: boolean;
  transaction?: FinancialTransaction;
}) {
  const initialType = transaction?.accountType
    ?? accounts.find((item) => item.id === transaction?.accountId)?.type
    ?? "BANK";
  const [accountType, setAccountType] = useState<"BANK" | "CASH">(initialType);
  const [feeMode, setFeeMode] = useState<"DEDUCTED" | "SEPARATE">(transaction?.feeMode ?? "DEDUCTED");
  const [feeAccountType, setFeeAccountType] = useState<"BANK" | "CASH">(
    transaction?.feeAccount?.type ?? initialType,
  );
  const [feeValue, setFeeValue] = useState(transaction?.feeAmount?.toString() ?? "0");
  const feeRequired = /^\d+$/.test(feeValue) && BigInt(feeValue) > 0n;

  const matchingAccounts = accounts.filter((item) => item.type === accountType);
  const assigned = matchingAccounts[0];
  const selectedId = transaction?.accountType === accountType ? transaction.accountId ?? "" : "";
  const feeAccounts = accounts.filter((item) => item.type === feeAccountType);
  const assignedFeeAccount = feeAccounts[0];
  const selectedFeeId = transaction?.feeMode === feeMode && transaction.feeAccount?.type === feeAccountType
    ? transaction.feeAccountId ?? ""
    : "";

  return (
    <FormShell action={saveCashTransaction} submitLabel={transaction ? "Save changes" : "Create transaction"}>
      <input type="hidden" name="type" value={type} />
      {transaction ? <><input type="hidden" name="id" value={transaction.id} /><input type="hidden" name="reference" value={transaction.reference} /></> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Customer name"><input className={controlClass} name="customerName" defaultValue={transaction?.customerName ?? ""} required /></Field>
        <Field label="Customer phone"><input className={controlClass} name="customerPhone" inputMode="tel" defaultValue={transaction?.customerPhone ?? ""} required /></Field>
        <Field label="Account type"><select className={controlClass} name="accountType" value={accountType} onChange={(event) => setAccountType(event.target.value as "BANK" | "CASH")}><option value="BANK">Bank</option><option value="CASH">Cash</option></select></Field>
        <Field label="Account">
          {teller ? <><input type="hidden" name="accountId" value={assigned?.id ?? ""} /><input className={controlClass} value={assigned?.name ?? `No assigned ${accountType.toLowerCase()} account`} disabled /></> : <select key={accountType} className={controlClass} name="accountId" defaultValue={selectedId} required><option value="" disabled>Select {accountType.toLowerCase()} account</option>{matchingAccounts.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.kind.toLowerCase()})</option>)}</select>}
        </Field>
        <Field label="Amount" hint="Whole MMK only"><input className={controlClass} name="amount" inputMode="numeric" pattern="[0-9]+" defaultValue={transaction?.amount?.toString() ?? ""} required /></Field>
        <Field label="Fee" hint="Whole MMK only"><input className={controlClass} name="feeAmount" inputMode="numeric" pattern="[0-9]+" defaultValue={transaction?.feeAmount?.toString() ?? "0"} onChange={(event) => setFeeValue(event.target.value)} required /></Field>
        <Field label="Fee mode (အခကြေး)">
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1" role="radiogroup" aria-label="Fee mode">
            {feeModes.map((mode) => <label key={mode.value} className={`flex cursor-pointer flex-col items-center justify-center rounded-md px-3 py-2 text-center text-sm font-medium transition-colors has-[:checked]:bg-background has-[:checked]:text-primary has-[:checked]:shadow-sm ${feeMode === mode.value ? "" : "text-muted-foreground"}`}>
              <input type="radio" name="feeMode" value={mode.value} className="sr-only" checked={feeMode === mode.value} onChange={() => setFeeMode(mode.value)} />
              <span>{mode.label}</span>
              <span className="text-[10px] font-normal opacity-70">{mode.hint}</span>
            </label>)}
          </div>
        </Field>
        {feeMode === "SEPARATE" ? <>
          <Field label="Fee account type"><select className={controlClass} name={teller ? undefined : "feeAccountType"} value={feeAccountType} onChange={(event) => setFeeAccountType(event.target.value as "BANK" | "CASH")}><option value="BANK">Bank</option><option value="CASH">Cash</option></select></Field>
          <Field label="Fee account" hint={feeRequired ? undefined : "Optional when fee is 0"}>
            {teller
              ? <><input type="hidden" name="feeAccountType" value={feeAccountType} /><input className={controlClass} value={assignedFeeAccount?.name ?? `No assigned ${feeAccountType.toLowerCase()} account`} disabled /></>
              : <select key={`${feeMode}-${feeAccountType}`} className={controlClass} name="feeAccountId" defaultValue={selectedFeeId} required={feeRequired}><option value="">{feeRequired ? "Select fee account" : "Optional"}</option>{feeAccounts.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.kind.toLowerCase()})</option>)}</select>}
          </Field>
        </> : null}
      </div>
      <Field label="Note (optional)"><textarea className={textareaClass} name="note" defaultValue={transaction?.note ?? ""} /></Field>
    </FormShell>
  );
}
