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
  const { groups, recent, grandTotal } = await getDashboardData(actor);
  return <Page>
    <PageHeader title={`Welcome, ${session.user.name}`} description="Live balances from the posted ledger." />
    {grandTotal !== null ? <Panel className="overflow-hidden border-primary/30 bg-brand-dark p-6 text-white shadow-lg"><p className="text-sm font-semibold tracking-wide text-emerald-100">စုစုပေါင်းလက်ကျန်</p><p className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{formatMoney(grandTotal)}</p><div className="mt-5 h-1 w-16 rounded-full bg-brand-light" /></Panel> : null}
    <section className={`grid gap-4 sm:grid-cols-2 ${session.user.role === "OWNER" ? "xl:grid-cols-3" : "max-w-3xl"}`}>
      {groups.map((group, index) => <Panel key={group.label} className="p-5">
        <div className="flex items-center justify-between"><p className="text-sm font-medium text-muted-foreground">{group.label}</p><span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">{index % 2 ? <WalletCards className="size-4" /> : <Landmark className="size-4" />}</span></div>
        <p className="mt-5 text-2xl font-semibold tracking-tight tabular-nums">{formatMoney(group.value)}</p>
      </Panel>)}
    </section>
    <Panel>
      <div className="flex items-center justify-between border-b px-5 py-4"><div><h2 className="font-semibold">Recent activity</h2><p className="text-sm text-muted-foreground">Latest posted ledger activity</p></div></div>
      {recent.length ? <div className="divide-y">{recent.map((item) => <div key={item.id} className="flex items-center gap-4 px-5 py-4"><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{labels[item.type]}</p><p className="truncate text-xs text-muted-foreground">{item.reference} · {item.account?.name ?? item.sourceAccount?.name ?? item.destinationAccount?.name ?? "Main account"} · {item.createdAt.toLocaleString("en-GB", { timeZone: "Asia/Yangon" })}</p></div><TransactionAmount value={item.amount} /></div>)}</div> : <Empty>No posted activity yet.</Empty>}
    </Panel>
  </Page>;
}
