import { financeInvariant } from "./errors";
import type { CashTransactionType } from "./types";

export type FeeCollection = "CASH" | "ACCOUNT";

export function feeCollectionAccountId(
  type: CashTransactionType,
  collection: string,
  receivingAccountId: string,
  payingAccountId: string,
): string {
  financeInvariant(collection === "CASH" || collection === "ACCOUNT", "Choose how to accept the fee");
  const cashAccountId = type === "CASH_IN" ? receivingAccountId : payingAccountId;
  const bankAccountId = type === "CASH_IN" ? payingAccountId : receivingAccountId;
  return collection === "CASH" ? cashAccountId : bankAccountId;
}
