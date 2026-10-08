import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

import { financialTransactionVisibilityWhere } from "./access";
import type { AccountType, FinanceActor } from "./types";

export function formatMoney(value: bigint | number | string) {
  return `${new Intl.NumberFormat("en-US").format(BigInt(value))} MMK`;
}

export async function getAccountBalances(accountIds?: string[]) {
  const accountWhere = accountIds ? { id: { in: accountIds } } : {};
  const [accounts, entries] = await Promise.all([
    prisma.financialAccount.findMany({
      where: accountWhere,
      orderBy: [{ type: "asc" }, { kind: "desc" }, { name: "asc" }],
      include: {
        provider: true,
        assignments: { include: { user: true } },
      },
    }),
    prisma.ledgerEntry.findMany({
      where: accountIds
        ? { financialAccountId: { in: accountIds } }
        : { financialAccountId: { not: null } },
      select: { financialAccountId: true, side: true, amount: true },
    }),
  ]);
  const balances = new Map<string, bigint>();
  for (const entry of entries) {
    if (!entry.financialAccountId) continue;
    const signed = entry.side === "DEBIT" ? entry.amount : -entry.amount;
    balances.set(entry.financialAccountId, (balances.get(entry.financialAccountId) ?? 0n) + signed);
  }
  return accounts.map((account) => ({ ...account, balance: balances.get(account.id) ?? 0n }));
}

export async function getDashboardData(actor: FinanceActor) {
  const visibility = await financialTransactionVisibilityWhere(actor);
  const assignedIds = actor.role === "TELLER"
    ? (await prisma.staffAccountAssignment.findMany({
        where: { userId: actor.id },
        select: { financialAccountId: true },
      })).map((item) => item.financialAccountId)
    : undefined;
  const [accounts, recent] = await Promise.all([
    getAccountBalances(assignedIds),
    prisma.financialTransaction.findMany({
      where: { AND: [{ status: "POSTED" }, visibility] },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { account: true, sourceAccount: true, destinationAccount: true },
    }),
  ]);
  const total = (type: AccountType, kind: "MAIN" | "CHILD") =>
    accounts.filter((item) => item.type === type && item.kind === kind).reduce((sum, item) => sum + item.balance, 0n);
  const groups = actor.role === "OWNER"
    ? [
      { label: "ပင်မဘဏ်", value: total("BANK", "MAIN") },
      { label: "ဘဏ်ခွဲများ", value: total("BANK", "CHILD") },
      { label: "စုစုပေါင်းဘဏ်", value: total("BANK", "MAIN") + total("BANK", "CHILD") },
      { label: "ပင်မငွေသား", value: total("CASH", "MAIN") },
      { label: "ငွေသားခွဲများ", value: total("CASH", "CHILD") },
      { label: "စုစုပေါင်းငွေသား", value: total("CASH", "MAIN") + total("CASH", "CHILD") },
    ]
    : (["BANK", "CASH"] as const).map((type) => {
        const account = accounts.find((item) => item.type === type);
        return { label: account ? `${account.name} (${type === "BANK" ? "Bank" : "Cash"})` : `No assigned ${type.toLowerCase()}`, value: account?.balance ?? 0n };
      });
  const grandTotal = actor.role === "OWNER"
    ? groups.reduce((sum, group, index) => index === 2 || index === 5 ? sum + group.value : sum, 0n)
    : null;
  return { groups, recent, grandTotal };
}

export type CashTransactionFilters = {
  q?: string;
  dateFrom?: string;
  dateTo?: string;
  accountId?: string;
  createdById?: string;
  minAmount?: string;
  maxAmount?: string;
};

export function parseCashTransactionFilters(input: Record<string, string | string[] | undefined>): CashTransactionFilters {
  const first = (key: keyof CashTransactionFilters) => {
    const value = input[key];
    return Array.isArray(value) ? value[0] : value;
  };
  return {
    q: first("q"),
    dateFrom: first("dateFrom"),
    dateTo: first("dateTo"),
    accountId: first("accountId"),
    createdById: first("createdById"),
    minAmount: first("minAmount"),
    maxAmount: first("maxAmount"),
  };
}

function mmkFilter(value?: string) {
  if (!value || !/^\d+$/.test(value)) return undefined;
  const amount = BigInt(value);
  return amount <= 9_223_372_036_854_775_807n ? amount : undefined;
}

function dayBoundary(value: string | undefined, end: boolean) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const date = new Date(`${value}T00:00:00+06:30`);
  if (Number.isNaN(date.getTime())) return undefined;
  const myanmarCalendarDate = new Date(date.getTime() + 6.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
  if (myanmarCalendarDate !== value) return undefined;
  if (end) date.setUTCDate(date.getUTCDate() + 1);
  return date;
}

export async function getCashTransactions(actor: FinanceActor, type: "CASH_IN" | "CASH_OUT", filters: CashTransactionFilters = {}) {
  const visibility = await financialTransactionVisibilityWhere(actor);
  const term = filters.q?.trim() ?? "";
  const phoneTerm = term.replace(/\D/g, "").replace(/^959/, "09");
  const searchWhere: Prisma.FinancialTransactionWhereInput = term
    ? { OR: [
        { reference: { contains: term } },
        { systemReference: { contains: term } },
        { customerName: { contains: term } },
        { customerPhone: { contains: term } },
        ...(phoneTerm && phoneTerm !== term ? [{ customerPhone: { contains: phoneTerm } }] : []),
        { note: { contains: term } },
      ] }
    : {};
  const dateFrom = dayBoundary(filters.dateFrom, false);
  const dateTo = dayBoundary(filters.dateTo, true);
  const minAmount = mmkFilter(filters.minAmount);
  const maxAmount = mmkFilter(filters.maxAmount);
  const amountRange = {
    ...(minAmount !== undefined ? { gte: minAmount } : {}),
    ...(maxAmount !== undefined ? { lte: maxAmount } : {}),
  };
  const structured: Prisma.FinancialTransactionWhereInput[] = [];
  if (dateFrom || dateTo) structured.push({
    createdAt: { ...(dateFrom ? { gte: dateFrom } : {}), ...(dateTo ? { lt: dateTo } : {}) },
  });
  if (filters.accountId) structured.push({ accountId: filters.accountId });
  if (actor.role === "OWNER" && filters.createdById) structured.push({ createdById: filters.createdById });
  if (minAmount !== undefined || maxAmount !== undefined) structured.push({
    amount: amountRange,
  });
  return prisma.financialTransaction.findMany({
    where: { AND: [{ type, status: "POSTED" }, visibility, searchWhere, ...structured] },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { account: true, feeAccount: true, createdBy: true },
  });
}

export async function getCashFilterOptions(actor: FinanceActor) {
  const [accounts, creators] = await Promise.all([
    getCashFormAccounts(actor),
    actor.role === "OWNER"
      ? prisma.user.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, email: true } })
      : Promise.resolve([]),
  ]);
  return { accounts, creators };
}

export async function getCashTransaction(actor: FinanceActor, id: string) {
  const visibility = await financialTransactionVisibilityWhere(actor);
  return prisma.financialTransaction.findFirst({
    where: { AND: [{ id, status: "POSTED", type: { in: ["CASH_IN", "CASH_OUT"] } }, visibility] },
    include: { account: true, feeAccount: true, provider: true, createdBy: true, revisions: true },
  });
}

export async function getCashFormAccounts(actor: FinanceActor) {
  if (actor.role === "TELLER") {
    const assignments = await prisma.staffAccountAssignment.findMany({
      where: { userId: actor.id },
      include: { financialAccount: true },
    });
    return assignments.map((item) => item.financialAccount);
  }
  return prisma.financialAccount.findMany({
    where: { active: true },
    orderBy: [{ type: "asc" }, { kind: "asc" }, { name: "asc" }],
  });
}

export async function getOwnerWorkspace() {
  const [accounts, providers, tellers] = await Promise.all([
    getAccountBalances(),
    prisma.provider.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.user.findMany({
      where: { role: "TELLER", active: true },
      orderBy: { name: "asc" },
      include: { financialAccountAssignments: { include: { financialAccount: true } } },
    }),
  ]);
  return { accounts, providers, tellers };
}

export async function getInternalTransfers(type: AccountType) {
  return prisma.financialTransaction.findMany({
    where: { type: "INTERNAL_TRANSFER", accountType: type, status: "POSTED" },
    orderBy: { createdAt: "desc" },
    include: { sourceAccount: true, destinationAccount: true, createdBy: true },
  });
}

export async function getCapitalTransactions(type: AccountType) {
  return prisma.financialTransaction.findMany({
    where: { type: { in: ["CAPITAL_DEPOSIT", "CAPITAL_WITHDRAWAL"] }, accountType: type, status: "POSTED" },
    orderBy: { createdAt: "desc" },
    include: { capitalAccount: true, createdBy: true },
  });
}

export async function getOwnerTransaction(id: string) {
  return prisma.financialTransaction.findFirst({ where: { id, status: "POSTED" } });
}

export async function getUsers() {
  return prisma.user.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
    include: { financialAccountAssignments: { include: { financialAccount: true } } },
  });
}

export async function getSummary() {
  const [accounts, feeEntries] = await Promise.all([
    getAccountBalances(),
    prisma.ledgerEntry.findMany({
      where: { systemAccount: "FEE_INCOME" },
      select: { side: true, amount: true },
    }),
  ]);
  const feeIncome = feeEntries.reduce(
    (sum, entry) => sum + (entry.side === "CREDIT" ? entry.amount : -entry.amount),
    0n,
  );
  return { accounts, feeIncome };
}
