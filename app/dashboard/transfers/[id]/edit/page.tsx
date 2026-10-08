import { notFound } from "next/navigation";
import { TransferForm } from "@/features/finance/components/owner-forms";
import { Page as FinancePage, PageHeader, Panel } from "@/features/finance/components/ui";
import { getOwnerTransaction, getOwnerWorkspace } from "@/lib/finance/queries";
import { requireOwner } from "@/lib/session";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await requireOwner();
  const item = await getOwnerTransaction((await params).id);
  if (!item || item.type !== "INTERNAL_TRANSFER" || !item.accountType) notFound();
  const { accounts } = await getOwnerWorkspace();
  const children = accounts.filter((account) => account.type === item.accountType && account.kind === "CHILD" && account.active);
  return <FinancePage><PageHeader title={`Edit ${item.reference}`} description="The old posting will be reversed before the replacement is posted." /><Panel className="p-5"><TransferForm type={item.accountType} children={children} transaction={item} /></Panel></FinancePage>;
}
