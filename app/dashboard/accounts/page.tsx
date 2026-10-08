import { AccountForm, AssignmentForm } from "@/features/finance/components/owner-forms";
import { Button } from "@/components/ui/button";
import { toggleFinancialAccount } from "@/features/finance/actions";
import { Empty, Page as FinancePage, PageHeader, Panel, Tabs, TransactionAmount } from "@/features/finance/components/ui";
import { getOwnerWorkspace } from "@/lib/finance/queries";
import { requireOwner } from "@/lib/session";

export default async function Page({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  await requireOwner();
  const query = await searchParams;
  const type = query.type === "CASH" ? "CASH" : "BANK";
  const { accounts, providers, tellers } = await getOwnerWorkspace();
  const shown = accounts.filter((item) => item.type === type);
  const main = shown.find((item) => item.kind === "MAIN");
  const children = shown.filter((item) => item.kind === "CHILD");
  const bank = accounts.filter((item) => item.type === "BANK" && item.kind === "CHILD" && item.active);
  const cash = accounts.filter((item) => item.type === "CASH" && item.kind === "CHILD" && item.active);
  return <FinancePage>
    <PageHeader title="Accounts" description="Main and child accounts with live ledger balances." />
    <Tabs active={type} base="/dashboard/accounts" />
    {main ? <Panel className="p-5"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wider text-primary">Main {type.toLowerCase()}</p><h2 className="mt-1 text-lg font-semibold">{main.name}</h2><p className="text-sm text-muted-foreground">{main.code} · Global, nonassignable · {main.active ? "Active" : "Inactive"}</p></div><div className="flex items-center gap-3"><TransactionAmount value={main.balance} />{!main.active ? <form action={toggleFinancialAccount}><input type="hidden" name="accountId" value={main.id} /><input type="hidden" name="active" value="true" /><Button size="sm" variant="outline" className="text-primary">Activate</Button></form> : null}</div></div></Panel> : <Panel><Empty>Matching main account is not configured.</Empty></Panel>}
    <Panel>
      <div className="border-b px-5 py-4"><h2 className="font-semibold">Child accounts</h2></div>
      {children.length ? <div className="divide-y">{children.map((item) => <div key={item.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[1fr_auto_auto] sm:items-center"><div><p className="font-medium">{item.name} <span className={item.active ? "text-xs text-primary" : "text-xs text-muted-foreground"}>{item.active ? "Active" : "Inactive"}</span></p><p className="text-xs text-muted-foreground">{item.code}{item.provider ? ` · ${item.provider.name}` : ""}</p><p className="mt-1 text-xs text-muted-foreground">Assigned: {item.assignments.length ? item.assignments.map((a) => a.user.name).join(", ") : "No teller"}</p></div><TransactionAmount value={item.balance} /><form action={toggleFinancialAccount}><input type="hidden" name="accountId" value={item.id} /><input type="hidden" name="active" value={String(!item.active)} /><Button size="sm" variant="outline" disabled={item.active && item.assignments.length > 0} title={item.active && item.assignments.length > 0 ? "Reassign staff before deactivating" : undefined} className={item.active ? "text-destructive" : "text-primary"}>{item.active ? "Deactivate" : "Activate"}</Button></form></div>)}</div> : <Empty>No child accounts yet.</Empty>}
    </Panel>
    {main ? <Panel className="p-5"><h2 className="mb-4 font-semibold">Add {type.toLowerCase()} child</h2><AccountForm type={type} mainId={main.id} providers={providers} /></Panel> : null}
    <Panel className="p-5"><h2 className="mb-1 font-semibold">Assign teller accounts</h2><p className="mb-4 text-sm text-muted-foreground">Each teller receives one Bank and one Cash child account. An account supports up to two staff.</p><AssignmentForm tellers={tellers} bank={bank} cash={cash} /></Panel>
  </FinancePage>;
}
