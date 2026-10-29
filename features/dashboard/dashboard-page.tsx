import Link from "next/link";
import { Landmark, WalletCards } from "lucide-react";

import { getDashboardData, formatMoney } from "@/lib/finance/queries";
import { requireSession } from "@/lib/session";
import { Empty, Page, PageHeader, Panel, TransactionAmount } from "@/features/finance/components/ui";
import type { FinanceActor } from "@/lib/finance";

const labels: Record<string, string> = {
  CASH_IN: "Cash in", CASH_OUT: "Cash out", INTERNAL_TRANSFER: "Internal transfer",
  CAPITAL_DEPOSIT: "Capital deposit", CAPITAL_WITHDRAWAL: "Capital withdrawal",
};

export async function DashboardPage() {
  const session = await requireSession();
  const actor: FinanceActor = { id: session.user.id, role: session.user.role, active: session.user.active };
  const { groups, recent, grandTotal, accounts } = await getDashboardData(actor);
  return <Page>
    <PageHeader title={`Welcome, ${session.user.name}`} description="Live balances from the posted ledger." />
    {grandTotal !== null ? <Panel className="overflow-hidden border-primary/30 bg-brand-dark p-6 text-white shadow-lg"><p className="text-sm font-semibold tracking-wide text-emerald-100">စုစုပေါင်းလက်ကျန်</p><p className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{formatMoney(grandTotal)}</p><div className="mt-5 h-1 w-16 rounded-full bg-brand-light" /></Panel> : null}
    <section className={`grid gap-4 sm:grid-cols-2 ${session.user.role === "OWNER" ? "xl:grid-cols-3" : "max-w-3xl"}`}>
      {groups.map((group, index) => <Panel key={group.label} className="p-5">
        <div className="flex items-center justify-between"><p className="text-sm font-medium text-muted-foreground">{group.label}</p><span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">{index % 2 ? <WalletCards className="size-4" /> : <Landmark className="size-4" />}</span></div>
        <p className="mt-5 text-2xl font-semibold tracking-tight tabular-nums">{formatMoney(group.value)}</p>
      </Panel>)}
    </section>
    <section aria-labelledby="account-balances-title" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 id="account-balances-title" className="text-lg font-semibold">Account balances</h2><p className="text-sm text-muted-foreground">Current balance of each main and child account.</p></div>
        {session.user.role === "OWNER" ? <Link href="/accounts" className="text-sm font-medium text-primary hover:underline">Manage accounts</Link> : null}
      </div>
      <div className="grid items-start gap-4 lg:grid-cols-2">
        {(["BANK", "CASH"] as const).map((type) => {
          const items = accounts.filter((account) => account.type === type).sort((a, b) =>
            a.kind === b.kind ? a.name.localeCompare(b.name) : a.kind === "MAIN" ? -1 : 1);
          const Icon = type === "BANK" ? Landmark : WalletCards;
          return <Panel key={type}>
            <div className="flex items-center gap-3 border-b px-5 py-4"><Icon className="size-4 text-primary" aria-hidden="true" /><h3 className="font-semibold">{type === "BANK" ? "Bank accounts" : "Cash accounts"}</h3><span className="ml-auto text-xs text-muted-foreground">{items.length} accounts</span></div>
            {items.length ? <ul className="divide-y">{items.map((account) => <li key={account.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-4">
              <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="break-words text-sm font-medium">{account.name}</p><span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${account.kind === "MAIN" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{account.kind === "MAIN" ? "Main" : "Child"}</span>{!account.active ? <span className="text-xs text-muted-foreground">Inactive</span> : null}</div><p className="mt-1 break-words text-xs text-muted-foreground">{account.code}{account.provider ? ` · ${account.provider.name}` : ""}</p></div>
              <p className={`shrink-0 text-right font-mono text-sm font-semibold tabular-nums ${account.balance < 0n ? "text-destructive" : ""}`}>{formatMoney(account.balance)}</p>
            </li>)}</ul> : <Empty>No {type.toLowerCase()} accounts available.</Empty>}
          </Panel>;
        })}
      </div>
    </section>
    <Panel>
      <div className="flex items-center justify-between border-b px-5 py-4"><div><h2 className="font-semibold">Recent activity</h2><p className="text-sm text-muted-foreground">Latest posted ledger activity</p></div></div>
      {recent.length ? <div className="divide-y">{recent.map((item) => {
        const account = item.account ?? item.sourceAccount ?? item.destinationAccount;
        const accountType = account?.type ?? item.accountType;
        return <div key={item.id} className="flex items-center gap-4 px-5 py-4"><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{labels[item.type]}</p><p className="truncate text-xs text-muted-foreground">{item.reference} · {account?.name ?? "Main account"}{accountType ? ` (${accountType === "BANK" ? "Bank" : "Cash"})` : ""} · {item.createdAt.toLocaleString("en-GB", { timeZone: "Asia/Yangon" })}</p></div><TransactionAmount value={item.amount} /></div>;
      })}</div> : <Empty>No posted activity yet.</Empty>}
    </Panel>
  </Page>;
}
