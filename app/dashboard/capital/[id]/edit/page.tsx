import { notFound } from "next/navigation";
import { CapitalForm } from "@/features/finance/components/owner-forms";
import { Page as FinancePage, PageHeader, Panel } from "@/features/finance/components/ui";
import { getOwnerTransaction } from "@/lib/finance/queries";
import { requireOwner } from "@/lib/session";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await requireOwner();
  const item = await getOwnerTransaction((await params).id);
  if (!item || !["CAPITAL_DEPOSIT", "CAPITAL_WITHDRAWAL"].includes(item.type) || !item.accountType) notFound();
  return <FinancePage><PageHeader title={`Edit ${item.reference}`} description="The old posting will be reversed before the replacement is posted." /><Panel className="p-5"><CapitalForm type={item.accountType} transaction={item} /></Panel></FinancePage>;
}
