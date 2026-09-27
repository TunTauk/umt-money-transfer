import type { FinancialAccount, FinancialTransaction, Provider, User } from "@/generated/prisma/client";

import { addChildAccount, assignTeller, provisionTeller, saveCapitalTransaction, saveInternalTransfer } from "@/features/finance/actions";
import { FormShell } from "./form-shell";
import { controlClass, Field } from "./ui";

export function TransferForm({ type, children, transaction }: { type: "BANK" | "CASH"; children: FinancialAccount[]; transaction?: FinancialTransaction }) {
  const selectedChild = transaction ? (transaction.sourceAccountId === children.find((a) => a.id === transaction.sourceAccountId)?.id ? transaction.sourceAccountId : transaction.destinationAccountId) : "";
  return <FormShell action={saveInternalTransfer} submitLabel={transaction ? "Save transfer" : "Create transfer"} className="grid gap-4 md:grid-cols-[1fr_1.4fr_1fr_1.5fr_auto] md:items-end">
    <input type="hidden" name="accountType" value={type} />{transaction ? <><input type="hidden" name="id" value={transaction.id} /><input type="hidden" name="reference" value={transaction.reference} /></> : null}
    <Field label="Direction"><select className={controlClass} name="direction" defaultValue={transaction?.transferDirection ?? "MAIN_TO_CHILD"}><option value="MAIN_TO_CHILD">Main to child</option><option value="CHILD_TO_MAIN">Child to main</option></select></Field>
    <Field label="Child account"><select className={controlClass} name="childAccountId" defaultValue={selectedChild ?? ""} required><option value="" disabled>Select child</option>{children.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
    <Field label="Amount"><input className={controlClass} name="amount" inputMode="numeric" pattern="[0-9]+" defaultValue={transaction?.amount?.toString() ?? ""} required /></Field>
    <Field label="Note (optional)"><input className={controlClass} name="note" defaultValue={transaction?.note ?? ""} /></Field>
  </FormShell>;
}

export function CapitalForm({ type, transaction }: { type: "BANK" | "CASH"; transaction?: FinancialTransaction }) {
  return <FormShell action={saveCapitalTransaction} submitLabel={transaction ? "Save entry" : "Create entry"} className="grid gap-4 md:grid-cols-[1.2fr_1fr_2fr_auto] md:items-end">
    <input type="hidden" name="accountType" value={type} />{transaction ? <><input type="hidden" name="id" value={transaction.id} /><input type="hidden" name="reference" value={transaction.reference} /></> : null}
    <Field label="Movement"><select className={controlClass} name="type" defaultValue={transaction?.type ?? "CAPITAL_DEPOSIT"}><option value="CAPITAL_DEPOSIT">Deposit</option><option value="CAPITAL_WITHDRAWAL">Withdrawal</option></select></Field>
    <Field label="Amount"><input className={controlClass} name="amount" inputMode="numeric" pattern="[0-9]+" defaultValue={transaction?.amount?.toString() ?? ""} required /></Field>
    <Field label="Note (optional)"><input className={controlClass} name="note" defaultValue={transaction?.note ?? ""} /></Field>
  </FormShell>;
}

export function AccountForm({ type, mainId, providers }: { type: "BANK" | "CASH"; mainId: string; providers: Provider[] }) {
  return <FormShell action={addChildAccount} submitLabel="Add account" className="grid gap-4 md:grid-cols-[1fr_1.5fr_1.5fr_auto] md:items-end">
    <input type="hidden" name="type" value={type} /><input type="hidden" name="parentId" value={mainId} />
    <Field label="Code"><input className={controlClass} name="code" required /></Field>
    <Field label="Name"><input className={controlClass} name="name" required /></Field>
    <Field label={type === "BANK" ? "Provider" : "Provider (optional)"}><select className={controlClass} name="providerId" required={type === "BANK"}><option value="">{type === "BANK" ? "Select provider" : "None"}</option>{providers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
  </FormShell>;
}

export function AssignmentForm({ tellers, bank, cash }: { tellers: User[]; bank: FinancialAccount[]; cash: FinancialAccount[] }) {
  return <FormShell action={assignTeller} submitLabel="Save assignment" className="grid gap-4 md:grid-cols-[1.3fr_1fr_1fr_auto] md:items-end">
    <Field label="Teller"><select className={controlClass} name="userId" required><option value="">Select teller</option>{tellers.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.email})</option>)}</select></Field>
    <Field label="Bank account"><select className={controlClass} name="bankAccountId" required><option value="">Select bank</option>{bank.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
    <Field label="Cash account"><select className={controlClass} name="cashAccountId" required><option value="">Select cash</option>{cash.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
  </FormShell>;
}

export function StaffForm() {
  return <FormShell action={provisionTeller} submitLabel="Create teller" className="grid gap-4 md:grid-cols-[1fr_1.4fr_1fr_auto] md:items-end">
    <Field label="Name"><input className={controlClass} name="name" required /></Field>
    <Field label="Email"><input className={controlClass} name="email" type="email" autoComplete="off" required /></Field>
    <Field label="Initial password"><input className={controlClass} name="password" type="password" minLength={8} autoComplete="new-password" required /></Field>
  </FormShell>;
}
