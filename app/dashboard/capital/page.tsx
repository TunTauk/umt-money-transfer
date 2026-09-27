import Link from "next/link";
import { Button } from "@/components/ui/button";
import { removeTransaction } from "@/features/finance/actions";
import { CapitalForm } from "@/features/finance/components/owner-forms";
import { Empty, Page as FinancePage, PageHeader, Panel, Tabs, TransactionAmount } from "@/features/finance/components/ui";
import { getCapitalTransactions } from "@/lib/finance/queries";
import { requireOwner } from "@/lib/session";

export default async function Page({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  await requireOwner();
  const type = (await searchParams).type === "CASH" ? "CASH" : "BANK";
  const items = await getCapitalTransactions(type);
  return <FinancePage><PageHeader title="Capital" description="Owner equity movements against the matching main account." /><Tabs active={type} base="/dashboard/capital" />
    <Panel className="p-5"><h2 className="mb-4 font-semibold">Create capital entry</h2><CapitalForm type={type} /></Panel>
    <Panel>{items.length ? <div className="divide-y">{items.map((item) => <div key={item.id} className="flex flex-wrap items-center gap-4 px-5 py-4"><div className="min-w-0 flex-1"><p className="font-medium">{item.type === "CAPITAL_DEPOSIT" ? "Deposit" : "Withdrawal"}</p><p className="text-xs text-muted-foreground">{item.reference} · {item.note || "None"} · {item.createdAt.toLocaleString("en-GB", { timeZone: "Asia/Yangon" })}</p></div><TransactionAmount value={item.amount} /><Button asChild variant="outline" size="sm"><Link href={`/dashboard/capital/${item.id}/edit`}>Edit</Link></Button><form action={removeTransaction}><input type="hidden" name="id" value={item.id} /><input type="hidden" name="returnTo" value={`/dashboard/capital?type=${type}`} /><Button variant="ghost" size="sm" className="text-destructive">Delete</Button></form></div>)}</div> : <Empty>No posted {type.toLowerCase()} capital entries.</Empty>}</Panel>
  </FinancePage>;
}
