import Link from "next/link";
import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { removeTransaction } from "@/features/finance/actions";
import { TransferForm } from "@/features/finance/components/owner-forms";
import { Empty, Page as FinancePage, PageHeader, Panel, Tabs, TransactionAmount } from "@/features/finance/components/ui";
import { getInternalTransfers, getOwnerWorkspace } from "@/lib/finance/queries";
import { requireOwner } from "@/lib/session";

export default async function Page({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  await requireOwner();
  const type = (await searchParams).type === "CASH" ? "CASH" : "BANK";
  const [items, workspace] = await Promise.all([getInternalTransfers(type), getOwnerWorkspace()]);
  const children = workspace.accounts.filter((item) => item.type === type && item.kind === "CHILD" && item.active);
  return <FinancePage><PageHeader title="Internal transfers" description="Move funds between a global main and child account." /><Tabs active={type} base="/dashboard/transfers" />
    <Panel className="p-5"><h2 className="mb-4 font-semibold">Create transfer</h2><TransferForm type={type} children={children} /></Panel>
    <Panel>{items.length ? <div className="divide-y">{items.map((item) => <details key={item.id} className="group"><summary className="flex cursor-pointer list-none items-center gap-4 px-5 py-4"><div className="min-w-0 flex-1"><p className="font-medium">{item.sourceAccount?.name} → {item.destinationAccount?.name}</p><p className="text-xs text-muted-foreground">{item.reference} · {item.createdAt.toLocaleString("en-GB", { timeZone: "Asia/Yangon" })}</p></div><TransactionAmount value={item.amount} /><ChevronDown className="size-5 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden="true" /></summary><div className="flex flex-wrap items-center gap-2 bg-muted/40 px-5 py-4 text-sm"><p className="mr-auto text-muted-foreground">{item.note || "None"}</p><Button asChild variant="outline" size="sm"><Link href={`/dashboard/transfers/${item.id}/edit`}>Edit</Link></Button><form action={removeTransaction}><input type="hidden" name="id" value={item.id} /><input type="hidden" name="returnTo" value={`/dashboard/transfers?type=${type}`} /><Button variant="ghost" size="sm" className="text-destructive">Delete</Button></form></div></details>)}</div> : <Empty>No posted {type.toLowerCase()} transfers.</Empty>}</Panel>
  </FinancePage>;
}
