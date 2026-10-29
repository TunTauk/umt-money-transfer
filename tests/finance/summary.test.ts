import assert from "node:assert/strict";
import test from "node:test";

import { aggregateIncome, summaryPeriod, type SummaryFeeEntry, type SummaryStaff } from "../../lib/finance/summary";

const now = new Date("2026-10-24T18:00:00Z");
const staff: SummaryStaff[] = [
  { id: "teller-a", name: "Teller A", email: "a@example.com", role: "TELLER", active: true },
  { id: "teller-b", name: "Teller B", email: "b@example.com", role: "TELLER", active: false },
  { id: "owner", name: "Owner", email: "owner@example.com", role: "OWNER", active: true },
];
const entry = (amount: bigint, side: "DEBIT" | "CREDIT", time: string, userId = "teller-a"): SummaryFeeEntry => ({ amount, side, createdAt: new Date(time), transaction: { createdById: userId } });

test("daily boundaries use Myanmar midnight and an exclusive end", () => {
  const period = summaryPeriod({}, now);
  assert.equal(period.date, "2026-10-25");
  assert.equal(period.start.toISOString(), "2026-10-24T17:30:00.000Z");
  assert.equal(period.end.toISOString(), "2026-10-25T17:30:00.000Z");
  assert.equal(period.bucketCount, 24);
});

test("monthly boundaries handle leap years and year rollover", () => {
  for (const [month, days, start, end] of [
    ["2024-02", 29, "2024-01-31T17:30:00.000Z", "2024-02-29T17:30:00.000Z"],
    ["2025-02", 28, "2025-01-31T17:30:00.000Z", "2025-02-28T17:30:00.000Z"],
    ["2026-12", 31, "2026-11-30T17:30:00.000Z", "2026-12-31T17:30:00.000Z"],
  ] as const) {
    const period = summaryPeriod({ mode: "monthly", month }, now);
    assert.equal(period.bucketCount, days);
    assert.equal(period.start.toISOString(), start);
    assert.equal(period.end.toISOString(), end);
  }
});

test("invalid date, month and mode fall back to the current Myanmar period", () => {
  const period = summaryPeriod({ date: "2026-02-30", month: "2026-13", mode: "invalid" }, now);
  assert.equal(period.mode, "daily");
  assert.equal(period.date, "2026-10-25");
  assert.equal(period.month, "2026-10");
});

test("income, staff totals and hourly buckets reconcile, including reversals and zero-fee transactions", () => {
  const period = summaryPeriod({ date: "2026-10-25" }, now);
  const entries = [
    entry(100n, "CREDIT", "2026-10-24T17:30:00Z"),
    entry(30n, "DEBIT", "2026-10-24T18:30:00Z"),
    entry(50n, "CREDIT", "2026-10-25T10:00:00Z", "teller-b"),
    entry(5n, "CREDIT", "2026-10-25T17:29:59.999Z", "owner"),
    entry(900n, "CREDIT", "2026-10-24T17:29:59.999Z"),
    entry(900n, "CREDIT", "2026-10-25T17:30:00Z"),
  ];
  const report = aggregateIncome(period, entries, [
    { id: "a", createdById: "teller-a", createdAt: period.start },
    { id: "zero-fee", createdById: "teller-a", createdAt: period.start },
    { id: "cancelled", createdById: "teller-b", createdAt: period.start },
    { id: "next-day", createdById: "owner", createdAt: period.end },
  ], staff);
  assert.equal(report.credits, 155n);
  assert.equal(report.reversals, 30n);
  assert.equal(report.netIncome, 125n);
  assert.equal(report.transactionCount, 3);
  assert.equal(report.buckets[0].net, 100n);
  assert.equal(report.buckets[1].net, -30n);
  assert.equal(report.buckets[23].net, 5n);
  assert.equal(report.buckets.reduce((sum, bucket) => sum + bucket.net, 0n), report.netIncome);
  assert.equal(report.byStaff.reduce((sum, row) => sum + row.net, 0n), report.netIncome);
  assert.equal(report.byStaff.find((row) => row.id === "teller-a")?.transactions, 2);
  assert.equal(report.byStaff.find((row) => row.id === "teller-b")?.net, 50n);
});

test("staff filter attributes a later cancellation to the original creator, not the cancelling owner", () => {
  const period = summaryPeriod({ mode: "monthly", month: "2026-10", staffId: "teller-a" }, now);
  const report = aggregateIncome(period, [
    entry(80n, "DEBIT", "2026-10-01T00:00:00Z"),
    entry(100n, "CREDIT", "2026-09-01T00:00:00Z"),
    entry(200n, "CREDIT", "2026-10-01T00:00:00Z", "owner"),
  ], [], staff);
  assert.equal(report.netIncome, -80n);
  assert.equal(report.transactionCount, 0);
  assert.equal(report.byStaff.length, 1);
  assert.equal(report.byStaff[0].id, "teller-a");
  assert.equal(report.byStaff[0].net, -80n);
  assert.equal(report.buckets[0].net, -80n);
  assert.equal(report.buckets.length, 31);
  assert.ok(report.buckets.slice(1).every((bucket) => bucket.net === 0n));
});

test("large MMK income retains exact integer precision", () => {
  const period = summaryPeriod({}, now);
  const amount = 9007199254740993n;
  const report = aggregateIncome(period, [entry(amount, "CREDIT", period.start.toISOString()), entry(2n, "DEBIT", period.start.toISOString())], [], staff);
  assert.equal(report.netIncome, amount - 2n);
});

test("empty periods return complete zero buckets and staff rows", () => {
  const period = summaryPeriod({}, now);
  const report = aggregateIncome(period, [], [], staff);
  assert.equal(report.netIncome, 0n);
  assert.equal(report.buckets.length, 24);
  assert.equal(report.byStaff.length, 3);
  assert.ok(report.buckets.every((bucket) => bucket.net === 0n));
});
