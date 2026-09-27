import { CashListPage } from "@/features/finance/cash-pages";
import { parseCashTransactionFilters } from "@/lib/finance/queries";
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) { return <CashListPage type="CASH_IN" filters={parseCashTransactionFilters(await searchParams)} />; }
