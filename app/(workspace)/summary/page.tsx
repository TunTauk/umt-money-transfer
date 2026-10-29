import { ArrowDownLeft, ArrowUpRight, ChevronDown, ReceiptText, TrendingUp } from "lucide-react";

import { Page as FinancePage, PageHeader, Panel, Empty, TransactionAmount } from "@/features/finance/components/ui";
import { SummaryFilters } from "@/features/finance/components/summary-filters";
import { IncomeChart } from "@/features/finance/components/income-chart";
import { formatMoney, getSummary } from "@/lib/finance/queries";
import type { SummaryFilters as SummaryFilterValues } from "@/lib/finance/summary";
import { requireOwner } from "@/lib/session";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireOwner();
  const query = await searchParams;
  const first = (key: keyof SummaryFilterValues) => Array.isArray(query[key]) ? query[key][0] : query[key];
  const report = await getSummary({ mode: first("mode"), date: first("date"), month: first("month"), staffId: first("staffId") });
  const { accounts, period, staff } = report;
  const periodLabel = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Yangon", year: "numeric", month: "long", ...(period.mode === "daily" ? { day: "numeric" as const } : {}),
  }).format(period.start);
  const selectedStaff = staff.find((user) => user.id === period.staffId);
  const metrics = [
    { label: "Net fee income", value: formatMoney(report.netIncome), hint: "Fee credits minus reversals", icon: TrendingUp, primary: true },
    { label: "Fee credits", value: formatMoney(report.credits), hint: "Income posted in this period", icon: ArrowUpRight },
    { label: "Reversed fees", value: formatMoney(report.reversals), hint: "Cancellations and adjustments", icon: ArrowDownLeft },
    { label: "Transactions created", value: report.transactionCount.toLocaleString("en-US"), hint: "Includes subsequently cancelled transactions", icon: ReceiptText },
  ];
  const groups = (["BANK", "CASH"] as const).map((type) => ({
    type,
    main: accounts.filter((item) => item.type === type && item.kind === "MAIN").reduce((sum, item) => sum + item.balance, 0n),
    children: accounts.filter((item) => item.type === type && item.kind === "CHILD").reduce((sum, item) => sum + item.balance, 0n),
  }));
  const rows = [...report.byStaff].sort((a, b) => a.net === b.net ? a.name.localeCompare(b.name) : a.net > b.net ? -1 : 1);

  return <FinancePage>
    <PageHeader title="Financial summary" description="Daily and monthly fee income, with a breakdown by teller." />
    <SummaryFilters key={`${period.mode}-${period.date}-${period.month}-${period.staffId}`} mode={period.mode} date={period.date} month={period.month} staffId={period.staffId} staff={staff} />
    <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-lg font-semibold">{periodLabel}<span className="ml-2 text-sm font-normal text-muted-foreground">{selectedStaff?.name ?? (period.staffId ? "Unknown staff member" : "All staff")}</span></h2><span className="text-xs text-muted-foreground">Myanmar time · UTC+06:30</span></div>
    <section aria-label="Income totals" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map(({ label, value, hint, icon: Icon, primary }) => <Panel key={label} className={`p-5 ${primary ? "border-primary/20 bg-brand-dark text-white" : ""}`}>
        <div className="flex items-center justify-between gap-2"><p className={`text-sm font-medium ${primary ? "text-emerald-100" : "text-muted-foreground"}`}>{label}</p><Icon className={`size-4 shrink-0 ${primary ? "text-emerald-200" : "text-primary"}`} aria-hidden="true" /></div>
        <p className={`mt-4 break-words text-2xl font-semibold tracking-tight tabular-nums ${primary && report.netIncome < 0n ? "text-red-200" : ""}`}>{value}</p>
        <p className={`mt-2 text-xs ${primary ? "text-emerald-100/75" : "text-muted-foreground"}`}>{hint}</p>
      </Panel>)}
    </section>
    <Panel className="p-5 sm:p-6"><div className="mb-5"><h2 className="font-semibold">Income trend</h2><p className="mt-1 text-sm text-muted-foreground">{period.mode === "daily" ? "Hour by hour for the selected day." : "Day by day for the selected month."}</p></div><IncomeChart key={`${period.mode}-${period.date}-${period.month}-${period.staffId}`} mode={period.mode} points={report.buckets.map((bucket) => ({ ...bucket, credits: bucket.credits.toString(), reversals: bucket.reversals.toString(), net: bucket.net.toString() }))} /></Panel>
    <Panel>
      <div className="border-b px-5 py-4"><h2 className="font-semibold">Income by teller / staff</h2><p className="mt-1 text-sm text-muted-foreground">Attributed to the staff member who created the original transaction.</p></div>
      {rows.length ? <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="border-b bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-5 py-3">Staff</th><th className="px-5 py-3 text-right">Transactions</th><th className="px-5 py-3 text-right">Fee credits</th><th className="px-5 py-3 text-right">Reversed fees</th><th className="px-5 py-3 text-right">Net income</th></tr></thead><tbody className="divide-y">{rows.map((row) => <tr key={row.id}><td className="px-5 py-4"><p className="font-medium">{row.name}<span className="ml-2 text-xs font-normal text-muted-foreground">{row.role === "OWNER" ? "Owner" : "Teller"}{!row.active ? " · Inactive" : ""}</span></p><p className="text-xs text-muted-foreground">{row.email}</p></td><td className="px-5 py-4 text-right tabular-nums">{row.transactions}</td><td className="whitespace-nowrap px-5 py-4 text-right font-mono">{formatMoney(row.credits)}</td><td className="whitespace-nowrap px-5 py-4 text-right font-mono text-muted-foreground">{formatMoney(row.reversals)}</td><td className={`whitespace-nowrap px-5 py-4 text-right font-mono font-semibold ${row.net < 0n ? "text-destructive" : "text-primary"}`}>{formatMoney(row.net)}</td></tr>)}</tbody></table></div> : <Empty>No staff match this filter.</Empty>}
      <p className="border-t px-5 py-4 text-xs leading-5 text-muted-foreground">Income is based on fee ledger posting time. Reversals reduce income on the day they are posted, even when the original transaction was created earlier. Capital movements and transfers are not income.</p>
    </Panel>
    <details className="group rounded-xl border bg-background"><summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-sm font-semibold [&::-webkit-details-marker]:hidden">Current account balances<ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden="true" /></summary><div className="border-t p-5"><p className="mb-4 text-xs text-muted-foreground">Live balances across all accounts. These are independent of the income date and staff filters.</p><section className="grid gap-4 sm:grid-cols-2">{groups.map((group) => <Panel key={group.type} className="p-5"><p className="text-xs font-semibold uppercase tracking-wider text-primary">{group.type}</p><div className="mt-4 flex justify-between gap-3 border-b pb-3"><span className="text-sm text-muted-foreground">Main</span><TransactionAmount value={group.main} /></div><div className="flex justify-between gap-3 pt-3"><span className="text-sm text-muted-foreground">Children total</span><TransactionAmount value={group.children} /></div></Panel>)}</section></div></details>
  </FinancePage>;
}
