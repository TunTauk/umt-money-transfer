import { CashEditPage } from "@/features/finance/cash-pages";
export default async function Page({ params }: { params: Promise<{ id: string }> }) { return <CashEditPage type="CASH_OUT" id={(await params).id} />; }
