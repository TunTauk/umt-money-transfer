import { FormDialog } from "@/features/finance/components/form-dialog";
import { CapitalForm } from "@/features/finance/components/owner-forms";
import { Empty, Page as FinancePage, PageHeader, Panel, Tabs, TransactionAmount } from "@/features/finance/components/ui";
import { getCapitalTransactions } from "@/lib/finance/queries";
import { requireOwner } from "@/lib/session";

export default async function Page({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  await requireOwner();
  const type = (await searchParams).type === "CASH" ? "CASH" : "BANK";
  const items = await getCapitalTransactions(type);
  return <FinancePage><PageHeader title="Capital" description="Owner equity movements against the matching main account. To reverse an entry, create an opposite movement for the same amount." /><div className="flex flex-wrap items-center justify-between gap-3"><Tabs active={type} base="/capital" /><FormDialog key={type} title="Create capital entry" description={`Record a deposit or withdrawal for the main ${type.toLowerCase()} account.`} triggerLabel="Create capital entry"><CapitalForm type={type} className="grid gap-4" /></FormDialog></div>
    <Panel>{items.length ? <div className="divide-y">{items.map((item) => <div key={item.id} className="flex flex-wrap items-center gap-4 px-5 py-4"><div className="min-w-0 flex-1"><p className="font-medium">{item.type === "CAPITAL_DEPOSIT" ? "Deposit" : "Withdrawal"}</p><p className="text-xs text-muted-foreground">{item.reference} · {item.note || "None"} · {item.createdAt.toLocaleString("en-GB", { timeZone: "Asia/Yangon" })}</p></div><TransactionAmount value={item.amount} /></div>)}</div> : <Empty>No posted {type.toLowerCase()} capital entries.</Empty>}</Panel>
  </FinancePage>;
}
