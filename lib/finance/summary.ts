import { formatMyanmarDateTimeLocal, parseMyanmarDateTime } from "./datetime";

export type SummaryMode = "daily" | "monthly";
export type SummaryFilters = { mode?: string; date?: string; month?: string; staffId?: string };
export type SummaryStaff = { id: string; name: string; email: string; role: "OWNER" | "TELLER"; active: boolean };

export function summaryPeriod(input: SummaryFilters = {}, now = new Date()) {
  const today = formatMyanmarDateTimeLocal(now).slice(0, 10);
  const candidate = input.date ?? "";
  const candidateStart = parseMyanmarDateTime(`${candidate}T00:00`);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(candidate) && Number.isFinite(candidateStart.getTime()) && formatMyanmarDateTimeLocal(candidateStart).slice(0, 10) === candidate ? candidate : today;
  const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(input.month ?? "") ? input.month! : today.slice(0, 7);
  const mode: SummaryMode = input.mode === "monthly" ? "monthly" : "daily";
  const start = parseMyanmarDateTime(`${mode === "daily" ? date : `${month}-01`}T00:00`);
  const end = new Date(start);
  if (mode === "daily") end.setUTCDate(end.getUTCDate() + 1);
  else {
    // Shift in local calendar time; Myanmar has a fixed UTC+06:30 offset.
    const local = new Date(start.getTime() + 390 * 60_000);
    local.setUTCMonth(local.getUTCMonth() + 1);
    end.setTime(local.getTime() - 390 * 60_000);
  }
  const bucketCount = mode === "daily" ? 24 : Math.round((end.getTime() - start.getTime()) / 86_400_000);
  return { mode, date, month, staffId: input.staffId?.trim() ?? "", start, end, bucketCount };
}

export type SummaryPeriod = ReturnType<typeof summaryPeriod>;
export type SummaryFeeEntry = { side: "DEBIT" | "CREDIT"; amount: bigint; createdAt: Date; transaction: { createdById: string } };
export type SummaryTransaction = { id: string; createdById: string; createdAt: Date };

export function aggregateIncome(period: SummaryPeriod, entries: SummaryFeeEntry[], transactions: SummaryTransaction[], staff: SummaryStaff[]) {
  const buckets = Array.from({ length: period.bucketCount }, (_, index) => ({
    label: period.mode === "daily" ? `${String(index).padStart(2, "0")}:00` : String(index + 1).padStart(2, "0"),
    detail: period.mode === "daily" ? `${period.date} ${String(index).padStart(2, "0")}:00–${String(index).padStart(2, "0")}:59` : `${period.month}-${String(index + 1).padStart(2, "0")}`,
    credits: 0n, reversals: 0n, net: 0n,
  }));
  const rows = new Map(staff.filter((user) => !period.staffId || period.staffId === user.id).map((user) => [user.id, { ...user, credits: 0n, reversals: 0n, net: 0n, transactions: 0 }]));
  const inPeriod = (date: Date) => date >= period.start && date < period.end;
  let credits = 0n;
  let reversals = 0n;
  let transactionCount = 0;
  for (const entry of entries) {
    const staffId = entry.transaction.createdById;
    if (!inPeriod(entry.createdAt) || (period.staffId && period.staffId !== staffId)) continue;
    const row = rows.get(staffId);
    const local = formatMyanmarDateTimeLocal(entry.createdAt);
    const index = period.mode === "daily" ? Number(local.slice(11, 13)) : Number(local.slice(8, 10)) - 1;
    const bucket = buckets[index];
    if (entry.side === "CREDIT") {
      credits += entry.amount;
      bucket.credits += entry.amount;
      if (row) row.credits += entry.amount;
    } else {
      reversals += entry.amount;
      bucket.reversals += entry.amount;
      if (row) row.reversals += entry.amount;
    }
    bucket.net = bucket.credits - bucket.reversals;
    if (row) row.net = row.credits - row.reversals;
  }
  for (const transaction of transactions) {
    if (!inPeriod(transaction.createdAt) || (period.staffId && period.staffId !== transaction.createdById)) continue;
    transactionCount++;
    const row = rows.get(transaction.createdById);
    if (row) row.transactions++;
  }
  return { credits, reversals, netIncome: credits - reversals, transactionCount, buckets, byStaff: [...rows.values()] };
}
