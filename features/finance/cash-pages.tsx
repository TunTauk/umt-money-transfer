import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronDown, Pencil, Search, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CashForm } from "@/features/finance/components/cash-form";
import { Empty, Page, PageHeader, Panel, TransactionAmount, controlClass } from "@/features/finance/components/ui";
import { removeTransaction } from "@/features/finance/actions";
import { getCashFilterOptions, getCashFormAccounts, getCashTransaction, getCashTransactions, type CashTransactionFilters } from "@/lib/finance/queries";
import { requireSession } from "@/lib/session";
import type { FinanceActor } from "@/lib/finance";

function actor(session: Awaited<ReturnType<typeof requireSession>>): FinanceActor {
  return { id: session.user.id, role: session.user.role, active: session.user.active };
}

function route(type: "CASH_IN" | "CASH_OUT") { return type === "CASH_IN" ? "/dashboard/cash-in" : "/dashboard/cash-out"; }
function title(type: "CASH_IN" | "CASH_OUT") { return type === "CASH_IN" ? "Cash In" : "Cash Out"; }
function dateTime(value: Date) { return value.toLocaleString("en-GB", { timeZone: "Asia/Yangon" }); }
function feeModeLabel(feeMode: string | null) { return feeMode === "SEPARATE" ? "သီးသန့်ပေးမည် (Separate)" : "ပမာဏမှ ဖျတ်မည် (Deducted)"; }

function FeePill({ feeMode, feeAccountType }: { feeMode: string | null; feeAccountType?: string | null }) {
  const separate = feeMode === "SEPARATE";
  const cls = separate
    ? feeAccountType === "BANK" ? "bg-sky-100 text-sky-800" : "bg-amber-100 text-amber-800"
    : "bg-primary/10 text-primary";
  return <span className={`rounded-full px-2 py-1 text-[10px] font-bold tracking-wide ${cls}`}>{separate ? feeAccountType ?? "—" : "ဖျတ်"}</span>;
}

export async function CashListPage({ type, filters = {} }: { type: "CASH_IN" | "CASH_OUT"; filters?: CashTransactionFilters }) {
  const session = await requireSession();
  const financeActor = actor(session);
  const [transactions, options] = await Promise.all([
    getCashTransactions(financeActor, type, filters),
    getCashFilterOptions(financeActor),
  ]);
  const base = route(type);
  return <Page>
    <PageHeader title={title(type)} description={session.user.role === "OWNER" ? "All active transactions" : "Transactions involving your assigned accounts"} action={{ href: `${base}/new`, label: `New ${title(type).toLowerCase()}` }} />
    <form className="grid gap-3 rounded-xl border bg-background p-4 sm:grid-cols-2 lg:grid-cols-4">
      <label className="relative sm:col-span-2"><Search className="absolute left-3 top-3 size-4 text-muted-foreground" /><input className={`${controlClass} pl-9`} name="q" defaultValue={filters.q} placeholder="Reference, customer, phone, or note" /></label>
      <label className="grid gap-1 text-xs font-medium text-muted-foreground">From<input className={controlClass} name="dateFrom" type="date" defaultValue={filters.dateFrom} /></label>
      <label className="grid gap-1 text-xs font-medium text-muted-foreground">To<input className={controlClass} name="dateTo" type="date" defaultValue={filters.dateTo} /></label>
      <label className="grid gap-1 text-xs font-medium text-muted-foreground">Account<select className={controlClass} name="accountId" defaultValue={filters.accountId ?? ""}><option value="">All accounts</option>{options.accounts.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.type.toLowerCase()})</option>)}</select></label>
      {session.user.role === "OWNER" ? <label className="grid gap-1 text-xs font-medium text-muted-foreground">Created by<select className={controlClass} name="createdById" defaultValue={filters.createdById ?? ""}><option value="">All staff</option>{options.creators.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.email})</option>)}</select></label> : null}
      <label className="grid gap-1 text-xs font-medium text-muted-foreground">Minimum MMK<input className={controlClass} name="minAmount" inputMode="numeric" pattern="[0-9]*" defaultValue={filters.minAmount} /></label>
      <label className="grid gap-1 text-xs font-medium text-muted-foreground">Maximum MMK<input className={controlClass} name="maxAmount" inputMode="numeric" pattern="[0-9]*" defaultValue={filters.maxAmount} /></label>
      <div className="flex items-end gap-2"><Button type="submit" variant="outline">Apply filters</Button><Button asChild type="button" variant="ghost"><Link href={base}>Reset</Link></Button></div>
    </form>
    <Panel>{transactions.length ? <div className="divide-y">
      <div className="hidden grid-cols-[.8fr_1.2fr_1fr_1.2fr_1fr_1.1fr_auto] gap-4 bg-muted/60 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:grid"><span>Reference</span><span>Customer</span><span>Phone</span><span>Account</span><span>Amount</span><span>Fee / Location</span><span className="sr-only">Details</span></div>
      {transactions.map((item) => <details key={item.id} className="group">
        <summary className="grid cursor-pointer list-none grid-cols-[1fr_auto] items-center gap-4 px-5 py-4 outline-none hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring md:grid-cols-[.8fr_1.2fr_1fr_1.2fr_1fr_1.1fr_auto] [&::-webkit-details-marker]:hidden">
          <div><span className="text-xs text-muted-foreground md:hidden">Reference</span><p className="font-mono text-sm font-semibold text-primary">{item.reference}</p></div>
          <div className="hidden min-w-0 md:block"><p className="truncate font-medium">{item.customerName}</p></div>
          <div className="hidden min-w-0 md:block"><p className="truncate font-mono text-sm">{item.customerPhone}</p></div>
          <div className="hidden min-w-0 md:block"><p className="truncate text-sm">{item.account?.name}</p></div>
          <div className="hidden md:block"><TransactionAmount value={item.amount} /></div>
          <div className="hidden items-center gap-2 md:flex"><strong className="font-mono text-sm">{new Intl.NumberFormat("en-US").format(item.feeAmount ?? 0n)} MMK</strong><FeePill feeMode={item.feeMode} feeAccountType={item.feeAccount?.type} /></div>
          <ChevronDown className="size-5 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden="true" />
          <div className="col-span-2 grid grid-cols-2 gap-3 border-t pt-3 md:hidden"><div><p className="text-xs text-muted-foreground">Customer</p><p className="truncate text-sm font-medium">{item.customerName}</p></div><div><p className="text-xs text-muted-foreground">Phone</p><p className="truncate font-mono text-sm">{item.customerPhone}</p></div><div><p className="text-xs text-muted-foreground">Account</p><p className="truncate text-sm">{item.account?.name}</p></div><div><p className="text-xs text-muted-foreground">Amount</p><TransactionAmount value={item.amount} /></div><div className="col-span-2"><p className="text-xs text-muted-foreground">Fee / Location</p><p className="flex items-center gap-2"><strong className="font-mono text-sm">{new Intl.NumberFormat("en-US").format(item.feeAmount ?? 0n)} MMK</strong><FeePill feeMode={item.feeMode} feeAccountType={item.feeAccount?.type} /></p></div></div>
        </summary>
        <div className="border-t bg-muted/30 px-5 py-5"><dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"><div><dt className="text-xs font-medium text-muted-foreground">ကိုးကား</dt><dd className="mt-1 break-all text-sm font-medium">{item.systemReference}</dd></div><div><dt className="text-xs font-medium text-muted-foreground">Created</dt><dd className="mt-1 text-sm">{dateTime(item.createdAt)}</dd></div><div><dt className="text-xs font-medium text-muted-foreground">Creator</dt><dd className="mt-1 truncate text-sm">{item.createdBy.email}</dd></div><div><dt className="text-xs font-medium text-muted-foreground">Fee mode</dt><dd className="mt-1 text-sm">{feeModeLabel(item.feeMode)}</dd></div>{item.feeMode === "SEPARATE" ? <div><dt className="text-xs font-medium text-muted-foreground">Fee account</dt><dd className="mt-1 text-sm">{item.feeAccount?.name ?? "—"}</dd></div> : null}<div><dt className="text-xs font-medium text-muted-foreground">Note</dt><dd className="mt-1 text-sm">{item.note || "None"}</dd></div></dl>{session.user.role === "OWNER" ? <div className="mt-5 flex gap-2 border-t pt-4"><Button asChild variant="outline" size="sm"><Link href={`${base}/${item.id}/edit`}><Pencil className="size-4" />Edit</Link></Button><form action={removeTransaction}><input type="hidden" name="id" value={item.id} /><input type="hidden" name="returnTo" value={base} /><Button variant="ghost" size="sm" className="text-destructive"><Trash2 className="size-4" />Delete</Button></form></div> : null}</div>
      </details>)}
    </div> : <Empty>No active {title(type).toLowerCase()} transactions found.</Empty>}</Panel>
  </Page>;
}

export async function CashCreatePage({ type }: { type: "CASH_IN" | "CASH_OUT" }) {
  const session = await requireSession();
  const accounts = await getCashFormAccounts(actor(session));
  return <Page><PageHeader title={`New ${title(type)}`} description="Post the transaction immediately to the ledger." /><Panel className="p-5 sm:p-6"><CashForm type={type} accounts={accounts} teller={session.user.role === "TELLER"} /></Panel></Page>;
}

export async function CashDetailPage({ type, id }: { type: "CASH_IN" | "CASH_OUT"; id: string }) {
  const session = await requireSession();
  const item = await getCashTransaction(actor(session), id);
  if (!item || item.type !== type) notFound();
  const base = route(type);
  const rows = [
    ["Customer", item.customerName], ["Phone", item.customerPhone], ["ကိုးကား", item.systemReference],
    ["Created", dateTime(item.createdAt)], ["Account type", item.accountType], ["Account", item.account?.name],
    ["Amount", `${item.amount?.toString()} MMK`], ["Fee", `${item.feeAmount?.toString()} MMK`], ["Fee mode", feeModeLabel(item.feeMode)],
    ...(item.feeMode === "SEPARATE" ? [["Fee account", item.feeAccount?.name ?? "—"] as [string, string | null | undefined]] : []),
    ["Created by", item.createdBy.email], ["Note", item.note || "None"],
  ];
  return <Page><PageHeader title={item.reference} description={title(type)} /><Panel className="p-5 sm:p-6"><dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">{rows.map(([label, value]) => <div key={label}><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt><dd className="mt-1 text-sm font-medium">{value}</dd></div>)}</dl>{session.user.role === "OWNER" ? <div className="mt-6 flex gap-2 border-t pt-5"><Button asChild><Link href={`${base}/${id}/edit`}><Pencil className="size-4" />Edit</Link></Button><form action={removeTransaction}><input type="hidden" name="id" value={id} /><input type="hidden" name="returnTo" value={base} /><Button variant="outline" className="text-destructive"><Trash2 className="size-4" />Delete</Button></form></div> : null}</Panel></Page>;
}

export async function CashEditPage({ type, id }: { type: "CASH_IN" | "CASH_OUT"; id: string }) {
  const session = await requireSession();
  if (session.user.role !== "OWNER") notFound();
  const [item, accounts] = await Promise.all([getCashTransaction(actor(session), id), getCashFormAccounts(actor(session))]);
  if (!item || item.type !== type) notFound();
  return <Page><PageHeader title={`Edit ${item.reference}`} description="Saving reverses the current posting and creates a new ledger version." /><Panel className="p-5 sm:p-6"><CashForm type={type} accounts={accounts} teller={false} transaction={item} /></Panel></Page>;
}
