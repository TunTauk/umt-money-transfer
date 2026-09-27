import { financeInvariant } from "./errors";
import type {
  CapitalTransactionType,
  CashTransactionType,
  FeeMode,
  LedgerPlanEntry,
  MoneyInput,
} from "./types";

export function toMmk(value: MoneyInput, field = "amount"): bigint {
  if (typeof value === "bigint") {
    financeInvariant(value > 0n, `${field} must be greater than zero`);
    return value;
  }

  if (typeof value === "number") {
    financeInvariant(
      Number.isSafeInteger(value) && value > 0,
      `${field} must be a positive safe integer`,
    );
    return BigInt(value);
  }

  financeInvariant(/^\d+$/.test(value), `${field} must be an integer MMK amount`);
  const amount = BigInt(value);
  financeInvariant(amount > 0n, `${field} must be greater than zero`);
  return amount;
}

export function toNonNegativeMmk(value: MoneyInput, field: string): bigint {
  if (typeof value === "bigint") {
    financeInvariant(value >= 0n, `${field} cannot be negative`);
    return value;
  }
  if (typeof value === "number") {
    financeInvariant(
      Number.isSafeInteger(value) && value >= 0,
      `${field} must be a non-negative safe integer`,
    );
    return BigInt(value);
  }
  financeInvariant(/^\d+$/.test(value), `${field} must be an integer MMK amount`);
  return BigInt(value);
}

export function assertBalanced(entries: readonly LedgerPlanEntry[]): void {
  financeInvariant(entries.length >= 2, "A posting requires at least two ledger entries");
  const debit = entries.reduce(
    (sum, entry) => sum + (entry.side === "DEBIT" ? entry.amount : 0n),
    0n,
  );
  const credit = entries.reduce(
    (sum, entry) => sum + (entry.side === "CREDIT" ? entry.amount : 0n),
    0n,
  );
  financeInvariant(debit === credit, "Ledger plan is not balanced");
}

function requireSeparateFeeAccount(feeAccountId: string | null | undefined): string {
  financeInvariant(
    typeof feeAccountId === "string" && feeAccountId.length > 0,
    "Separate fee requires a fee account",
  );
  return feeAccountId;
}

export function planCashTransaction(input: {
  type: CashTransactionType;
  accountId: string;
  amount: MoneyInput;
  feeAmount: MoneyInput;
  feeMode: FeeMode;
  feeAccountId?: string | null;
}): { amount: bigint; feeAmount: bigint; entries: LedgerPlanEntry[] } {
  const amount = toMmk(input.amount);
  const feeAmount = toNonNegativeMmk(input.feeAmount, "feeAmount");
  const entries: LedgerPlanEntry[] = [];

  if (input.feeMode === "SEPARATE" && feeAmount > 0n) {
    const feeAccountId = requireSeparateFeeAccount(input.feeAccountId);
    if (input.type === "CASH_IN") {
      entries.push(
        { systemAccount: "CUSTOMER_CLEARING", side: "DEBIT", amount, memo: "Customer funds received" },
        { financialAccountId: input.accountId, side: "CREDIT", amount, memo: "Cash In settled" },
        { financialAccountId: feeAccountId, side: "DEBIT", amount: feeAmount, memo: "Cash In fee received" },
        { systemAccount: "FEE_INCOME", side: "CREDIT", amount: feeAmount, memo: "Fee earned" },
      );
    } else {
      entries.push(
        { financialAccountId: input.accountId, side: "DEBIT", amount, memo: "Cash Out settled" },
        { systemAccount: "CUSTOMER_CLEARING", side: "CREDIT", amount, memo: "Customer funds paid" },
        { financialAccountId: feeAccountId, side: "DEBIT", amount: feeAmount, memo: "Cash Out fee received" },
        { systemAccount: "FEE_INCOME", side: "CREDIT", amount: feeAmount, memo: "Fee earned" },
      );
    }
  } else {
    if (input.type === "CASH_IN") {
      entries.push(
        { systemAccount: "CUSTOMER_CLEARING", side: "DEBIT", amount: amount + feeAmount, memo: "Customer funds received" },
        { financialAccountId: input.accountId, side: "CREDIT", amount, memo: "Cash In settled" },
      );
    } else {
      entries.push(
        { financialAccountId: input.accountId, side: "DEBIT", amount: amount + feeAmount, memo: "Cash Out settled" },
        { systemAccount: "CUSTOMER_CLEARING", side: "CREDIT", amount, memo: "Customer funds paid" },
      );
    }
    if (feeAmount > 0n) {
      entries.push({ systemAccount: "FEE_INCOME", side: "CREDIT", amount: feeAmount, memo: "Fee earned" });
    }
  }

  assertBalanced(entries);
  return { amount, feeAmount, entries };
}

export function planInternalTransfer(input: {
  sourceAccountId: string;
  destinationAccountId: string;
  amount: MoneyInput;
}): { amount: bigint; entries: LedgerPlanEntry[] } {
  financeInvariant(input.sourceAccountId !== input.destinationAccountId, "Transfer accounts must differ");
  const amount = toMmk(input.amount);
  const entries: LedgerPlanEntry[] = [
    { financialAccountId: input.destinationAccountId, side: "DEBIT", amount, memo: "Internal transfer received" },
    { financialAccountId: input.sourceAccountId, side: "CREDIT", amount, memo: "Internal transfer sent" },
  ];
  assertBalanced(entries);
  return { amount, entries };
}

export function planCapitalTransaction(input: {
  type: CapitalTransactionType;
  mainAccountId: string;
  amount: MoneyInput;
}): { amount: bigint; entries: LedgerPlanEntry[] } {
  const amount = toMmk(input.amount);
  const depositing = input.type === "CAPITAL_DEPOSIT";
  const entries: LedgerPlanEntry[] = [
    {
      financialAccountId: input.mainAccountId,
      side: depositing ? "DEBIT" : "CREDIT",
      amount,
      memo: depositing ? "Capital deposited" : "Capital withdrawn",
    },
    {
      systemAccount: "OWNER_EQUITY",
      side: depositing ? "CREDIT" : "DEBIT",
      amount,
      memo: depositing ? "Owner equity increased" : "Owner equity decreased",
    },
  ];
  assertBalanced(entries);
  return { amount, entries };
}

export function reverseLedgerPlan(
  entries: readonly Pick<LedgerPlanEntry, "financialAccountId" | "systemAccount" | "side" | "amount" | "memo">[],
): LedgerPlanEntry[] {
  const reversal = entries.map((entry) => ({
    ...(entry.financialAccountId
      ? { financialAccountId: entry.financialAccountId }
      : { systemAccount: entry.systemAccount! }),
    side: entry.side === "DEBIT" ? "CREDIT" as const : "DEBIT" as const,
    amount: entry.amount,
    memo: `Reversal: ${entry.memo}`,
  }));
  assertBalanced(reversal);
  return reversal;
}
