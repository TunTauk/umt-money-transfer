import { Page as FinancePage, PageHeader, Panel, TransactionAmount } from "@/features/finance/components/ui";
import { getSummary } from "@/lib/finance/queries";
import { requireOwner } from "@/lib/session";

export default async function Page() {
  await requireOwner();
  const { accounts, feeIncome } = await getSummary();
  const groups = (["BANK", "CASH"] as const).map((type) => ({
    type,
    main: accounts.filter((item) => item.type === type && item.kind === "MAIN").reduce((sum, item) => sum + item.balance, 0n),
    children: accounts.filter((item) => item.type === type && item.kind === "CHILD").reduce((sum, item) => sum + item.balance, 0n),
  }));
  return <FinancePage><PageHeader title="Financial summary" description="Ledger-derived balances and recognized fee income." /><section className="grid gap-4 sm:grid-cols-2">{groups.map((group) => <Panel key={group.type} className="p-5"><p className="text-xs font-semibold uppercase tracking-wider text-primary">{group.type}</p><div className="mt-4 flex justify-between border-b pb-3"><span className="text-sm text-muted-foreground">Main</span><TransactionAmount value={group.main} /></div><div className="flex justify-between pt-3"><span className="text-sm text-muted-foreground">Children total</span><TransactionAmount value={group.children} /></div></Panel>)}</section><Panel className="border-primary/20 bg-primary/[0.03] p-6"><p className="text-sm font-medium text-muted-foreground">Fee income</p><p className="mt-2 text-3xl font-semibold text-primary"><TransactionAmount value={feeIncome} /></p><p className="mt-2 text-xs text-muted-foreground">Net credits to the Fee Income system ledger account.</p></Panel></FinancePage>;
}
