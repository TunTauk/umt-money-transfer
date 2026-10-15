import { ChevronDown } from "lucide-react";

import { TransferForm } from "@/features/finance/components/transfer-form";
import { FormNotice } from "@/features/finance/components/form-notice";
import { TransactionRowActions } from "@/features/finance/components/transaction-row-actions";
import { Empty, Page as FinancePage, PageHeader, Panel, Tabs, TransactionAmount } from "@/features/finance/components/ui";
import { getInternalTransfers, getOwnerWorkspace } from "@/lib/finance/queries";
import { requireOwner } from "@/lib/session";

export default async function Page({ searchParams }: { searchParams: Promise<{ type?: string; saved?: string; reference?: string }> }) {
  await requireOwner();
  const query = await searchParams;
  const type = query.type === "CASH" ? "CASH" : "BANK";
  const [items, workspace] = await Promise.all([getInternalTransfers(type), getOwnerWorkspace()]);
  const children = workspace.accounts.filter((item) => item.type === type && item.kind === "CHILD" && item.active);
  return <FinancePage><PageHeader title="Internal transfers" description="Move funds between a global main and child account." /><Tabs active={type} base="/dashboard/transfers" />
    {query.saved === "created" || query.saved === "updated" ? <FormNotice key={`${query.saved}-${query.reference ?? ""}`} status="success" message={query.saved === "created" ? "Transfer created successfully." : "Transfer updated successfully."} /> : null}
    <Panel className="p-5"><h2 className="mb-4 font-semibold">Create transfer</h2><TransferForm key={`${type}-${query.reference ?? ""}`} type={type} accounts={children} /></Panel>
    <Panel>{items.length ? <div className="divide-y">{items.map((item) => <div key={item.id} className="relative">
      <details className="group">
        <summary className="grid cursor-pointer list-none grid-cols-[minmax(0,1fr)_auto_auto] items-start gap-4 px-5 py-4 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:grid-cols-[minmax(0,1fr)_auto_auto_auto] [&::-webkit-details-marker]:hidden">
          <div className="min-w-0"><p className="break-words font-medium">{item.sourceAccount?.name} → {item.destinationAccount?.name}</p><p className="break-all text-xs text-muted-foreground">{item.reference} · {item.createdAt.toLocaleString("en-GB", { timeZone: "Asia/Yangon" })}</p></div>
          <div className="hidden pt-1 sm:block"><TransactionAmount value={item.amount} /></div>
          <span className="h-8 w-20 sm:w-40" aria-hidden="true" />
          <ChevronDown className="mt-1.5 size-5 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden="true" />
          <div className="col-span-full sm:hidden"><TransactionAmount value={item.amount} /></div>
        </summary>
        <div className="bg-muted/40 px-5 py-4 text-sm"><p className="text-muted-foreground">{item.note || "None"}</p></div>
      </details>
      <TransactionRowActions id={item.id} base="/dashboard/transfers" returnTo={`/dashboard/transfers?type=${type}`} />
    </div>)}</div> : <Empty>No posted {type.toLowerCase()} transfers.</Empty>}</Panel>
  </FinancePage>;
}
