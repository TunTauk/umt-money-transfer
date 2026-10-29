import { Button } from "@/components/ui/button";
import { toggleTeller } from "@/features/finance/actions";
import { OwnerUserActions, OwnPasswordForm } from "@/features/finance/components/owner-user-actions";
import { CreateUserDialog } from "@/features/finance/components/create-user-dialog";
import { Empty, Page as FinancePage, PageHeader, Panel } from "@/features/finance/components/ui";
import { FormDialog } from "@/features/finance/components/form-dialog";
import { AssignmentForm } from "@/features/finance/components/owner-forms";
import { getCashFormAccounts, getUsers } from "@/lib/finance/queries";
import { requireOwner } from "@/lib/session";

export default async function Page() {
  const session = await requireOwner();
  const [users, accounts] = await Promise.all([getUsers(), getCashFormAccounts(session.user)]);
  const bank = accounts.filter((account) => account.type === "BANK");
  const cash = accounts.filter((account) => account.type === "CASH");
  return <FinancePage><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><PageHeader title="Users" description="Staff identity, access, and account assignments." /><CreateUserDialog bank={bank} cash={cash} /></div>
    <Panel>{users.length ? <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-5 py-3">Staff</th><th className="px-5 py-3">Role</th><th className="px-5 py-3">Access</th><th className="px-5 py-3">Assignments</th><th className="px-5 py-3 text-right">Action</th></tr></thead><tbody className="divide-y">{users.map((user) => <tr key={user.id}><td className="px-5 py-4"><p className="font-medium">{user.name}{user.id === session.user.id ? <span className="ml-2 text-xs text-muted-foreground">(You)</span> : null}</p><p className="text-xs text-muted-foreground">{user.email}</p></td><td className="px-5 py-4">{user.role === "OWNER" ? "Owner" : "Teller"}</td><td className="px-5 py-4"><span className={user.active ? "text-primary" : "text-destructive"}>{user.active ? "Active" : "Disabled"}</span></td><td className="px-5 py-4">{user.role === "OWNER" ? "Global access" : user.financialAccountAssignments.length ? user.financialAccountAssignments.map((item) => `${item.accountType}: ${item.financialAccount.name}`).join(" · ") : "Not assigned"}</td><td className="px-5 py-4 text-right">{user.role === "TELLER" ? <div className="flex flex-wrap justify-end gap-2">{user.active ? <FormDialog title="Edit teller accounts" description={`Change the accounts assigned to ${user.name}.`} triggerLabel="Edit accounts"><AssignmentForm userId={user.id} bank={bank} cash={cash} bankAccountId={user.financialAccountAssignments.find((item) => item.accountType === "BANK")?.financialAccountId} cashAccountId={user.financialAccountAssignments.find((item) => item.accountType === "CASH")?.financialAccountId} /></FormDialog> : null}<form action={toggleTeller}><input type="hidden" name="userId" value={user.id} /><input type="hidden" name="active" value={String(!user.active)} /><Button size="sm" variant="outline" className={user.active ? "text-destructive" : "text-primary"}>{user.active ? "Deactivate" : "Activate"}</Button></form></div> : user.id === session.user.id ? <OwnPasswordForm /> : <OwnerUserActions userId={user.id} name={user.email} active={user.active} />}</td></tr>)}</tbody></table></div> : <Empty>No staff users found.</Empty>}</Panel>
  </FinancePage>;
}
