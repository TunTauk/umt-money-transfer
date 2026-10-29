import { createHash } from "node:crypto";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

import { assertCashAccountSelection } from "./account-rules";
import { financeInvariant, TransferConfirmationRequired } from "./errors";
import { normalizeCustomerPhone } from "./phone";
import {
  planCapitalTransaction,
  planCashTransaction,
  planInternalTransfer,
  toNonNegativeMmk,
} from "./ledger-plan";
import {
  assertCanCreateCapitalTransaction,
  assertCanCreateCashTransaction,
  assertCanCreateInternalTransfer,
  assertCanCancelTransaction,
} from "./permissions";
import { generateSystemReference } from "./reference";
import type {
  CapitalTransactionInput,
  CashTransactionInput,
  FinanceActor,
  FeeMode,
  InternalTransferInput,
  LedgerPlanEntry,
} from "./types";

type DbTransaction = Prisma.TransactionClient;

function requiredText(value: string | null | undefined, field: string): string {
  const normalized = value?.trim() ?? "";
  financeInvariant(normalized.length > 0, `${field} is required`);
  return normalized;
}

function optionalText(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function fingerprint(value: Record<string, string | null>): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function systemReferenceFor(reference: string): string {
  let systemReference = generateSystemReference();
  while (systemReference === reference) systemReference = generateSystemReference();
  return systemReference;
}

function ledgerData(
  entries: readonly LedgerPlanEntry[],
  postingVersion: number,
  kind: "POSTING" | "REVERSAL" = "POSTING",
  revisionId?: string,
) {
  return entries.map((entry, sequence) => ({
    postingVersion,
    kind,
    sequence,
    financialAccountId: entry.financialAccountId ?? null,
    systemAccount: entry.systemAccount ?? null,
    side: entry.side,
    amount: entry.amount,
    memo: entry.memo,
    revisionId,
  }));
}

async function serializable<T>(operation: (tx: DbTransaction) => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await prisma.$transaction(operation, { isolationLevel: "Serializable" });
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (attempt < 2 && (code === "P2002" || code === "P2034")) continue;
      throw error;
    }
  }
}

async function resolveCashAccount(
  tx: DbTransaction,
  actor: FinanceActor,
  submittedAccountId: string,
  field: string,
  expectedType?: "BANK" | "CASH",
) {
  const accountId = requiredText(submittedAccountId, field);
  const account = await tx.financialAccount.findUnique({ where: { id: accountId } });
  financeInvariant(account, `${field} account not found`, "NOT_FOUND");
  assertCashAccountSelection(actor.role, expectedType ?? account.type, account);

  if (actor.role === "TELLER") {
    const assignment = await tx.staffAccountAssignment.findUnique({
      where: { userId_accountType: { userId: actor.id, accountType: account.type } },
      select: { financialAccountId: true },
    });
    financeInvariant(assignment?.financialAccountId === account.id, `Teller must be assigned the submitted ${field}`, "FORBIDDEN");
  }

  return account;
}

async function resolveFeeAccount(
  tx: DbTransaction,
  actor: FinanceActor,
  input: CashTransactionInput,
  feeAmount: bigint,
): Promise<string | null> {
  if (input.feeMode !== "SEPARATE" || feeAmount <= 0n) return null;

  const feeAccountId = optionalText(input.feeAccountId);
  financeInvariant(feeAccountId, "feeAccountId is required for separate fee mode");
  const feeAccount = await resolveCashAccount(tx, actor, feeAccountId, "feeAccountId");
  return feeAccount.id;
}

async function resolveTransferAccounts(
  tx: DbTransaction,
  input: InternalTransferInput,
) {
  const child = await tx.financialAccount.findUnique({ where: { id: input.childAccountId } });
  financeInvariant(child?.active && child.kind === "CHILD", "Active child account not found", "NOT_FOUND");
  financeInvariant(child.type === input.accountType, "Child account type does not match transfer type");

  const main = await tx.financialAccount.findUnique({ where: { mainSlot: input.accountType } });
  financeInvariant(
    main?.active && main.kind === "MAIN" && main.type === input.accountType && !main.parentId && !main.providerId,
    "Active global main account not found",
    "NOT_FOUND",
  );

  let parentId = child.parentId;
  const visited = new Set([child.id]);
  while (parentId && parentId !== main.id) {
    financeInvariant(!visited.has(parentId), "Account hierarchy contains a cycle", "CONFLICT");
    visited.add(parentId);
    const parent = await tx.financialAccount.findUnique({ where: { id: parentId } });
    financeInvariant(parent?.active, "Account hierarchy parent not found or inactive", "CONFLICT");
    financeInvariant(parent.type === child.type, "Account hierarchy types do not match", "CONFLICT");
    financeInvariant(parent.kind === "CHILD", "Child account is not under its global main", "CONFLICT");
    parentId = parent.parentId;
  }
  financeInvariant(parentId === main.id, "Child account is not under its global main", "CONFLICT");
  return { child, main };
}

export async function createCashTransaction(actor: FinanceActor, input: CashTransactionInput) {
  assertCanCreateCashTransaction(actor);

  return serializable(async (tx) => {
    const receiving = await resolveCashAccount(tx, actor, input.receivingAccountId, "receivingAccountId", input.type === "CASH_IN" ? "CASH" : "BANK");
    const paying = await resolveCashAccount(tx, actor, input.payingAccountId, "payingAccountId", input.type === "CASH_IN" ? "BANK" : "CASH");
    // Retain the primary settlement fields for existing downstream consumers.
    const account = input.type === "CASH_IN" ? paying : receiving;
    const feeAmount = toNonNegativeMmk(input.feeAmount, "feeAmount");
    const feeAccountId = await resolveFeeAccount(tx, actor, input, feeAmount);
    const plan = planCashTransaction({
      type: input.type,
      receivingAccountId: receiving.id,
      payingAccountId: paying.id,
      amount: input.amount,
      feeAmount,
      feeMode: input.feeMode,
      feeAccountId,
    });
    const normalized = {
      reference: requiredText(input.reference, "reference"),
      type: input.type,
      providerId: account.providerId,
      accountType: account.type,
      accountId: account.id,
      sourceAccountId: paying.id,
      destinationAccountId: receiving.id,
      amount: plan.amount.toString(),
      feeAmount: plan.feeAmount.toString(),
      feeMode: input.feeMode,
      feeAccountId,
      customerName: optionalText(input.customerName),
      customerPhone: normalizeCustomerPhone(input.customerPhone),
      note: optionalText(input.note),
    };
    const requestFingerprint = fingerprint(normalized);
    const existing = await tx.financialTransaction.findUnique({
      where: { reference: normalized.reference },
      include: { ledgerEntries: true },
    });
    if (existing) {
      financeInvariant(existing.requestFingerprint === requestFingerprint, "Transaction reference is already used by different input", "CONFLICT");
      return existing;
    }

    return tx.financialTransaction.create({
      data: {
        ...normalized,
        systemReference: systemReferenceFor(normalized.reference),
        amount: plan.amount,
        feeAmount: plan.feeAmount,
        requestFingerprint,
        createdById: actor.id,
        ledgerEntries: { create: ledgerData(plan.entries, 1) },
      },
      include: { ledgerEntries: true },
    });
  });
}

async function confirmTransferBalance(
  tx: DbTransaction,
  actor: FinanceActor,
  input: InternalTransferInput,
  source: { id: string; name: string },
  normalized: Record<string, string | null> & { reference: string; amount: string },
) {
  const totals = await tx.ledgerEntry.groupBy({
    by: ["side"],
    where: { financialAccountId: source.id },
    _sum: { amount: true },
  });
  const balance = totals.reduce((net, entry) =>
    net + (entry.side === "DEBIT" ? 1n : -1n) * (entry._sum.amount ?? 0n), 0n);
  const available = balance;
  const amount = BigInt(normalized.amount);
  if (amount <= available) return;

  const confirmationKey = fingerprint({
    ...normalized,
    actorId: actor.id,
    sourceBalance: balance.toString(),
    availableBalance: available.toString(),
  });
  if (input.confirmationKey !== confirmationKey) {
    throw new TransferConfirmationRequired(
      `Source account "${source.name}" has an available balance of ${available} MMK. Transferring ${amount} MMK will result in a negative balance of ${available - amount} MMK. Confirm to proceed.`,
      confirmationKey,
      normalized.reference,
    );
  }
}

export async function createInternalTransfer(actor: FinanceActor, input: InternalTransferInput) {
  assertCanCreateInternalTransfer(actor);
  return serializable(async (tx) => {
    const { child, main } = await resolveTransferAccounts(tx, input);
    const source = input.direction === "MAIN_TO_CHILD" ? main : child;
    const destination = input.direction === "MAIN_TO_CHILD" ? child : main;
    const plan = planInternalTransfer({ sourceAccountId: source.id, destinationAccountId: destination.id, amount: input.amount });
    const normalized = {
      reference: requiredText(input.reference, "reference"),
      accountType: input.accountType,
      transferDirection: input.direction,
      sourceAccountId: source.id,
      destinationAccountId: destination.id,
      amount: plan.amount.toString(),
      note: optionalText(input.note),
    };
    const requestFingerprint = fingerprint(normalized);
    const existing = await tx.financialTransaction.findUnique({
      where: { reference: normalized.reference },
      include: { ledgerEntries: true },
    });
    if (existing) {
      financeInvariant(existing.requestFingerprint === requestFingerprint, "Transaction reference is already used by different input", "CONFLICT");
      return existing;
    }
    await confirmTransferBalance(tx, actor, input, source, normalized);
    return tx.financialTransaction.create({
      data: {
        ...normalized,
        systemReference: systemReferenceFor(normalized.reference),
        type: "INTERNAL_TRANSFER",
        amount: plan.amount,
        requestFingerprint,
        createdById: actor.id,
        ledgerEntries: { create: ledgerData(plan.entries, 1) },
      },
      include: { ledgerEntries: true },
    });
  });
}

export async function createCapitalTransaction(actor: FinanceActor, input: CapitalTransactionInput) {
  assertCanCreateCapitalTransaction(actor);
  return serializable(async (tx) => {
    const main = await tx.financialAccount.findUnique({
      where: { mainSlot: input.accountType },
    });
    financeInvariant(
      main?.active && main.kind === "MAIN" && main.type === input.accountType && !main.providerId,
      "Active global main account not found",
      "NOT_FOUND",
    );
    const plan = planCapitalTransaction({ type: input.type, mainAccountId: main.id, amount: input.amount });
    const normalized = {
      reference: requiredText(input.reference, "reference"),
      accountType: input.accountType,
      capitalAccountId: main.id,
      amount: plan.amount.toString(),
      note: optionalText(input.note),
      type: input.type,
    };
    const requestFingerprint = fingerprint(normalized);
    const existing = await tx.financialTransaction.findUnique({
      where: { reference: normalized.reference },
      include: { ledgerEntries: true },
    });
    if (existing) {
      financeInvariant(existing.requestFingerprint === requestFingerprint, "Transaction reference is already used by different input", "CONFLICT");
      return existing;
    }
    return tx.financialTransaction.create({
      data: {
        ...normalized,
        systemReference: systemReferenceFor(normalized.reference),
        amount: plan.amount,
        requestFingerprint,
        createdById: actor.id,
        ledgerEntries: { create: ledgerData(plan.entries, 1) },
      },
      include: { ledgerEntries: true },
    });
  });
}

function auditSnapshot(transaction: {
  reference: string;
  systemReference: string;
  type: string;
  status: string;
  postingVersion: number;
  providerId: string | null;
  accountId: string | null;
  sourceAccountId: string | null;
  destinationAccountId: string | null;
  capitalAccountId: string | null;
  feeAmount: bigint | null;
  feeMode: FeeMode | null;
  feeAccountId: string | null;
  amount: bigint | null;
  customerName: string | null;
  customerPhone: string | null;
  note: string | null;
  accountType?: string | null;
  transferDirection?: string | null;
}) {
  return {
    reference: transaction.reference,
    systemReference: transaction.systemReference,
    type: transaction.type,
    status: transaction.status,
    postingVersion: transaction.postingVersion,
    providerId: transaction.providerId,
    accountId: transaction.accountId,
    sourceAccountId: transaction.sourceAccountId,
    destinationAccountId: transaction.destinationAccountId,
    capitalAccountId: transaction.capitalAccountId,
    feeAmount: transaction.feeAmount?.toString() ?? null,
    feeMode: transaction.feeMode ?? null,
    feeAccountId: transaction.feeAccountId ?? null,
    amount: transaction.amount?.toString() ?? null,
    customerName: transaction.customerName,
    customerPhone: transaction.customerPhone,
    note: transaction.note,
    accountType: transaction.accountType ?? null,
    transferDirection: transaction.transferDirection ?? null,
  };
}

export async function cancelCashTransaction(actor: FinanceActor, transactionId: string) {
  assertCanCancelTransaction(actor);
  return serializable(async (tx) => {
    const existing = await tx.financialTransaction.findUnique({ where: { id: transactionId } });
    financeInvariant(existing, "Transaction not found", "NOT_FOUND");
    financeInvariant(existing.type === "CASH_IN" || existing.type === "CASH_OUT", "Only cash transactions can be cancelled. Reverse capital entries and transfers with an opposite transaction.", "FORBIDDEN");
    if (existing.status === "DELETED") return existing;
    const currentEntries = await tx.ledgerEntry.findMany({
      where: { transactionId, postingVersion: existing.postingVersion, kind: "POSTING" },
      orderBy: { sequence: "asc" },
    });
    financeInvariant(currentEntries.length >= 2, "Current ledger posting is missing", "CONFLICT");
    // Keep the existing DELETED/DELETE storage values for compatibility.
    // Cancellation retains the original record and appends exact ledger reversals.
    const before = auditSnapshot(existing);
    const revision = await tx.transactionRevision.create({
      data: {
        transactionId,
        revision: existing.postingVersion,
        action: "DELETE",
        before,
        after: { ...before, status: "DELETED", operation: "CANCEL" },
        actorId: actor.id,
      },
    });
    await tx.ledgerEntry.createMany({
      data: currentEntries.map((entry, sequence) => ({
        transactionId,
        revisionId: revision.id,
        postingVersion: existing.postingVersion,
        kind: "REVERSAL" as const,
        sequence,
        financialAccountId: entry.financialAccountId,
        systemAccount: entry.systemAccount,
        side: entry.side === "DEBIT" ? "CREDIT" as const : "DEBIT" as const,
        amount: entry.amount,
        memo: `Reversal: ${entry.memo ?? "ledger entry"}`,
        reversalOfId: entry.id,
      })),
    });
    return tx.financialTransaction.update({
      where: { id: transactionId },
      data: { status: "DELETED", deletedAt: new Date(), deletedById: actor.id },
    });
  });
}
