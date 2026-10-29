import type { FinancialAccount, Provider } from "@/generated/prisma/client";

import { addChildAccount, assignTeller, provisionTeller, saveCapitalTransaction } from "@/features/finance/actions";
import { FormShell } from "./form-shell";
import { controlClass, Field } from "./ui";

export function CapitalForm({ type, className = "grid gap-4 md:grid-cols-[1.2fr_1fr_2fr_auto] md:items-end" }: { type: "BANK" | "CASH"; className?: string }) {
  return <FormShell action={saveCapitalTransaction} submitLabel="Create entry" className={className}>
    <input type="hidden" name="accountType" value={type} />
    <Field label="Movement"><select className={controlClass} name="type" defaultValue="CAPITAL_DEPOSIT"><option value="CAPITAL_DEPOSIT">Deposit</option><option value="CAPITAL_WITHDRAWAL">Withdrawal</option></select></Field>
    <Field label="Amount"><input className={controlClass} name="amount" inputMode="numeric" pattern="[0-9]+" required /></Field>
    <Field label="Note (optional)"><input className={controlClass} name="note" /></Field>
  </FormShell>;
}

export function AccountForm({ type, mainId, providers, className = "grid gap-4 md:grid-cols-[1fr_1.5fr_1.5fr_auto] md:items-end" }: { type: "BANK" | "CASH"; mainId: string; providers: Provider[]; className?: string }) {
  return <FormShell action={addChildAccount} submitLabel="Add account" className={className}>
    <input type="hidden" name="type" value={type} /><input type="hidden" name="parentId" value={mainId} />
    <Field label="Code"><input className={controlClass} name="code" required /></Field>
    <Field label="Name"><input className={controlClass} name="name" required /></Field>
    <Field label={type === "BANK" ? "Provider" : "Provider (optional)"}><select className={controlClass} name="providerId" required={type === "BANK"}><option value="">{type === "BANK" ? "Select provider" : "None"}</option>{providers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
  </FormShell>;
}

export function TellerAccountFields({ bank, cash, bankAccountId = "", cashAccountId = "" }: { bank: FinancialAccount[]; cash: FinancialAccount[]; bankAccountId?: string; cashAccountId?: string }) {
  return <>
    <p className="col-span-full text-sm font-normal text-muted-foreground">Select at least one account. Each child account supports up to two staff.</p>
    <Field label="Bank account (optional)"><select className={controlClass} name="bankAccountId" defaultValue={bankAccountId}><option value="">None</option>{bank.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
    <Field label="Cash account (optional)"><select className={controlClass} name="cashAccountId" defaultValue={cashAccountId}><option value="">None</option>{cash.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
  </>;
}

export function AssignmentForm({ userId, bank, cash, bankAccountId, cashAccountId }: { userId: string; bank: FinancialAccount[]; cash: FinancialAccount[]; bankAccountId?: string; cashAccountId?: string }) {
  return <FormShell action={assignTeller} submitLabel="Save assignment" className="grid gap-4" preserveValues>
    <input type="hidden" name="userId" value={userId} />
    <TellerAccountFields bank={bank} cash={cash} bankAccountId={bankAccountId} cashAccountId={cashAccountId} />
    <p className="text-sm text-muted-foreground">None removes the existing assignment of that type. Changes affect access; existing transactions and balances stay with their original accounts.</p>
  </FormShell>;
}

export function StaffForm({ bank, cash, className = "grid gap-4" }: { bank: FinancialAccount[]; cash: FinancialAccount[]; className?: string }) {
  return <FormShell action={provisionTeller} submitLabel="Create user" className={className} preserveValues>
    <Field label="Name"><input className={controlClass} name="name" required /></Field>
    <Field label="Email"><input className={controlClass} name="email" type="email" autoComplete="off" required /></Field>
    <Field label="Initial password"><input className={controlClass} name="password" type="password" minLength={8} autoComplete="new-password" required /></Field>
    <TellerAccountFields bank={bank} cash={cash} />
  </FormShell>;
}
