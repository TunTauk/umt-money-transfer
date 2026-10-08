import { Button } from "@/components/ui/button";
import { toggleTeller } from "@/features/finance/actions";
import { StaffForm } from "@/features/finance/components/owner-forms";
import { Empty, Page as FinancePage, PageHeader, Panel } from "@/features/finance/components/ui";
import { getUsers } from "@/lib/finance/queries";
import { requireOwner } from "@/lib/session";

export default async function Page() {
  await requireOwner();
  const users = await getUsers();
  return <FinancePage><PageHeader title="Users" description="Staff identity, access, and account assignments." />
    <Panel className="p-5"><h2 className="mb-1 font-semibold">Provision teller</h2><p className="mb-4 text-sm text-muted-foreground">Creates an active teller without exposing public signup.</p><StaffForm /></Panel>
    <Panel>{users.length ? <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-5 py-3">Staff</th><th className="px-5 py-3">Role</th><th className="px-5 py-3">Access</th><th className="px-5 py-3">Assignments</th><th className="px-5 py-3 text-right">Action</th></tr></thead><tbody className="divide-y">{users.map((user) => <tr key={user.id}><td className="px-5 py-4"><p className="font-medium">{user.name}</p><p className="text-xs text-muted-foreground">{user.email}</p></td><td className="px-5 py-4">{user.role === "OWNER" ? "Owner" : "Teller"}</td><td className="px-5 py-4"><span className={user.active ? "text-primary" : "text-destructive"}>{user.active ? "Active" : "Disabled"}</span></td><td className="px-5 py-4">{user.role === "OWNER" ? "Global access" : user.financialAccountAssignments.length ? user.financialAccountAssignments.map((item) => `${item.accountType}: ${item.financialAccount.name}`).join(" · ") : "Not assigned"}</td><td className="px-5 py-4 text-right">{user.role === "TELLER" ? <form action={toggleTeller}><input type="hidden" name="userId" value={user.id} /><input type="hidden" name="active" value={String(!user.active)} /><Button size="sm" variant="outline" className={user.active ? "text-destructive" : "text-primary"}>{user.active ? "Deactivate" : "Activate"}</Button></form> : null}</td></tr>)}</tbody></table></div> : <Empty>No staff users found.</Empty>}</Panel>
  </FinancePage>;
}
