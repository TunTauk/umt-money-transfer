import { notFound } from "next/navigation";
import { ChevronDown } from "lucide-react";

import { CashForm } from "@/features/finance/components/cash-form";
import { CashFilters } from "@/features/finance/components/cash-filters";
import { CancelTransactionButton } from "@/features/finance/components/cancel-transaction-button";
import { Empty, Page, PageHeader, Panel, TransactionAmount } from "@/features/finance/components/ui";
import { getCashFilterOptions, getCashFormAccounts, getCashTransaction, getCashTransactions, type CashTransactionFilters } from "@/lib/finance/queries";
import { requireSession } from "@/lib/session";
import type { FinanceActor } from "@/lib/finance";

function actor(session: Awaited<ReturnType<typeof requireSession>>): FinanceActor {
  return { id: session.user.id, role: session.user.role, active: session.user.active };
}

function route(type: "CASH_IN" | "CASH_OUT") { return type === "CASH_IN" ? "/cash-in" : "/cash-out"; }
function title(type: "CASH_IN" | "CASH_OUT") { return type === "CASH_IN" ? "Cash In" : "Cash Out"; }
function dateTime(value: Date) { return value.toLocaleString("en-GB", { timeZone: "Asia/Yangon" }); }
function feeModeLabel(feeMode: string | null, feeAccountType?: string | null) {
  if (feeMode !== "SEPARATE") return "Included in received total (legacy)";
  return feeAccountType === "CASH" ? "Accept with cash" : feeAccountType === "BANK" ? "Accept with account" : "—";
}

function AccountMovement({ item }: { item: { account: { name: string } | null; destinationAccount: { name: string } | null; sourceAccount: { name: string } | null } }) {
  if (!item.destinationAccount && !item.sourceAccount) return <p className="truncate text-sm">{item.account?.name}</p>;
  return <div className="space-y-1 text-sm"><p className="truncate" title={item.destinationAccount?.name}><span className="text-xs text-muted-foreground">Receive: </span>{item.destinationAccount?.name ?? "Not recorded"}</p><p className="truncate" title={item.sourceAccount?.name}><span className="text-xs text-muted-foreground">Pay: </span>{item.sourceAccount?.name ?? "Not recorded"}</p></div>;
}

function FeePill({ feeMode, feeAccountType }: { feeMode: string | null; feeAccountType?: string | null }) {
  const separate = feeMode === "SEPARATE";
  const cls = separate
    ? feeAccountType === "BANK" ? "bg-sky-100 text-sky-800" : "bg-amber-100 text-amber-800"
    : "bg-primary/10 text-primary";
  return <span className={`rounded-full px-2 py-1 text-[10px] font-bold tracking-wide ${cls}`}>{separate ? feeAccountType === "CASH" ? "Cash" : feeAccountType === "BANK" ? "Account" : "—" : "Included (legacy)"}</span>;
}

export async function CashListPage({ type, filters = {} }: { type: "CASH_IN" | "CASH_OUT"; filters?: CashTransactionFilters }) {
  const session = await requireSession();
  const financeActor = actor(session);
  const owner = session.user.role === "OWNER";
  const [transactions, options] = await Promise.all([
    getCashTransactions(financeActor, type, filters),
    getCashFilterOptions(financeActor),
  ]);
  const base = route(type);
  const columns = owner ? "xl:grid-cols-[1.2fr_1fr_1.2fr_1fr_1fr_auto_auto]" : "xl:grid-cols-[1.2fr_1fr_1.2fr_1fr_1fr_auto]";
  return <Page>
    <PageHeader title={title(type)} description={owner ? "Transaction history, including cancellations" : "Transactions involving your assigned accounts"} action={{ href: `${base}/new`, label: `New ${title(type).toLowerCase()}` }} />
    <CashFilters key={`${base}-${JSON.stringify(filters)}`} filters={filters} accounts={options.accounts} creators={options.creators} owner={owner} base={base} />
    <Panel>{transactions.length ? <div className="divide-y">
      <div className={`hidden gap-4 bg-muted/60 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground xl:grid ${columns}`}>
        <span>Customer</span><span>Phone</span><span>Account</span><span>Amount</span><span>Fee / Location</span>{owner ? <span className="w-44 text-center">Action</span> : null}<span className="w-5"><span className="sr-only">Details</span></span>
      </div>
      {transactions.map((item) => <div key={item.id} className={`relative ${item.status === "DELETED" ? "bg-muted/20" : ""}`}>
        <details className="group">
          <summary className={`grid cursor-pointer list-none grid-cols-[minmax(0,1fr)_auto] items-start gap-4 px-5 py-4 outline-none hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring xl:items-center [&::-webkit-details-marker]:hidden ${columns}`}>
            <div className="min-w-0"><p className="truncate font-medium">{item.customerName || "Customer"}</p>{item.status === "DELETED" ? <span className="mt-1 inline-block rounded-full bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive">Cancelled</span> : null}</div>
            <div className="hidden min-w-0 xl:block"><p className="truncate font-mono text-sm">{item.customerPhone}</p></div>
            <div className="hidden min-w-0 xl:block"><AccountMovement item={item} /></div>
            <div className="hidden min-w-0 xl:block"><TransactionAmount value={item.amount} /></div>
            <div className="hidden min-w-0 flex-wrap items-center gap-2 xl:flex"><strong className="font-mono text-sm">{new Intl.NumberFormat("en-US").format(item.feeAmount ?? 0n)} MMK</strong><FeePill feeMode={item.feeMode} feeAccountType={item.feeAccount?.type} /></div>
            {owner ? <span className="hidden h-8 w-44 xl:block" aria-hidden="true" /> : null}
            <ChevronDown className="mt-1.5 size-5 text-muted-foreground transition-transform group-open:rotate-180 xl:mt-0" aria-hidden="true" />
            <div className="col-span-full grid grid-cols-2 gap-3 border-t pt-3 xl:hidden">
              <div className="min-w-0"><p className="text-xs text-muted-foreground">Phone</p><p className="truncate font-mono text-sm">{item.customerPhone}</p></div><div className="min-w-0"><p className="text-xs text-muted-foreground">Accounts</p><AccountMovement item={item} /></div><div><p className="text-xs text-muted-foreground">Amount</p><TransactionAmount value={item.amount} /></div><div><p className="text-xs text-muted-foreground">Fee / Location</p><p className="flex flex-wrap items-center gap-2"><strong className="font-mono text-sm">{new Intl.NumberFormat("en-US").format(item.feeAmount ?? 0n)} MMK</strong><FeePill feeMode={item.feeMode} feeAccountType={item.feeAccount?.type} /></p></div>
            </div>
          </summary>
          <div className="border-t bg-muted/30 px-5 py-5"><dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div><dt className="text-xs font-medium text-muted-foreground">Created</dt><dd className="mt-1 text-sm">{dateTime(item.createdAt)}</dd></div>
            <div><dt className="text-xs font-medium text-muted-foreground">Creator</dt><dd className="mt-1 truncate text-sm">{item.createdBy.email}</dd></div>
            <div><dt className="text-xs font-medium text-muted-foreground">Accept fee</dt><dd className="mt-1 text-sm">{feeModeLabel(item.feeMode, item.feeAccount?.type)}</dd></div>
            {item.feeMode === "SEPARATE" ? <div><dt className="text-xs font-medium text-muted-foreground">Fee account</dt><dd className="mt-1 text-sm">{item.feeAccount?.name ?? "—"}</dd></div> : null}
            <div><dt className="text-xs font-medium text-muted-foreground">Note</dt><dd className="mt-1 text-sm">{item.note || "None"}</dd></div>
            {item.deletedAt ? <><div><dt className="text-xs font-medium text-muted-foreground">Cancelled at</dt><dd className="mt-1 text-sm">{dateTime(item.deletedAt)}</dd></div><div><dt className="text-xs font-medium text-muted-foreground">Cancelled by</dt><dd className="mt-1 text-sm">{item.deletedBy?.email ?? "—"}</dd></div></> : null}
          </dl></div>
        </details>
        {owner && item.status === "POSTED" ? <div className="px-5 pb-4 xl:absolute xl:right-14 xl:top-4 xl:w-44 xl:p-0"><CancelTransactionButton id={item.id} /></div> : null}
      </div>)}
    </div> : <Empty>No {title(type).toLowerCase()} transactions found.</Empty>}</Panel>
  </Page>;
}

export async function CashCreatePage({ type }: { type: "CASH_IN" | "CASH_OUT" }) {
  const session = await requireSession();
  const accounts = await getCashFormAccounts(actor(session));
  return <Page><PageHeader title={`New ${title(type)}`} /><Panel className="p-5 sm:p-6"><CashForm type={type} accounts={accounts} /></Panel></Page>;
}

export async function CashDetailPage({ type, id }: { type: "CASH_IN" | "CASH_OUT"; id: string }) {
  const session = await requireSession();
  const item = await getCashTransaction(actor(session), id);
  if (!item || item.type !== type) notFound();
  const rows = [
    ["Customer", item.customerName], ["Phone", item.customerPhone],
    ["Status", item.status === "POSTED" ? "Active" : "Cancelled"], ["Created", dateTime(item.createdAt)],
    ...(item.sourceAccountId || item.destinationAccountId
      ? [["Receive Into", item.destinationAccount?.name ?? "Not recorded"], ["Pay From", item.sourceAccount?.name ?? "Not recorded"]]
      : [["Account type", item.accountType], ["Account", item.account?.name]]),
    ["Amount", `${item.amount?.toString()} MMK`], ["Fee", `${item.feeAmount?.toString()} MMK`], ["Accept fee", feeModeLabel(item.feeMode, item.feeAccount?.type)],
    ...(item.feeMode === "SEPARATE" ? [["Fee account", item.feeAccount?.name ?? "—"]] : []),
    ["Created by", item.createdBy.email], ["Note", item.note || "None"],
    ...(item.deletedAt ? [["Cancelled at", dateTime(item.deletedAt)], ["Cancelled by", item.deletedBy?.email ?? "—"]] : []),
  ];
  return <Page><PageHeader title={`${title(type)} transaction`} /><Panel className="p-5 sm:p-6"><dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">{rows.map(([label, value]) => <div key={label}><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt><dd className="mt-1 text-sm font-medium">{value}</dd></div>)}</dl>{session.user.role === "OWNER" && item.status === "POSTED" ? <div className="mt-6 border-t pt-5"><CancelTransactionButton id={id} /></div> : null}</Panel></Page>;
}
