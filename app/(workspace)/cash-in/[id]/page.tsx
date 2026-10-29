import { CashDetailPage } from "@/features/finance/cash-pages";
export default async function Page({ params }: { params: Promise<{ id: string }> }) { return <CashDetailPage type="CASH_IN" id={(await params).id} />; }
