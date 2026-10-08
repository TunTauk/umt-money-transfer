import { createHash } from "node:crypto";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

import { assertCashAccountSelection } from "./account-rules";
import { financeInvariant } from "./errors";
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
  assertCanDeleteTransaction,
  assertCanEditTransaction,
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

async function resolveCashAccounts(
  tx: DbTransaction,
  actor: FinanceActor,
  input: CashTransactionInput,
) {
  let accountId = input.accountId;

  if (actor.role === "TELLER") {
    const assignment = await tx.staffAccountAssignment.findUnique({
      where: { userId_accountType: { userId: actor.id, accountType: input.accountType } },
      select: { financialAccountId: true },
    });
    financeInvariant(assignment, `Teller requires an assigned ${input.accountType} account`, "FORBIDDEN");
    accountId = assignment.financialAccountId;
  } else {
    financeInvariant(accountId, "accountId is required");
  }

  const account = await tx.financialAccount.findUnique({ where: { id: accountId } });
  assertCashAccountSelection(actor.role, input.accountType, account);
  return account;
}

async function resolveFeeAccount(
  tx: DbTransaction,
  actor: FinanceActor,
  input: CashTransactionInput,
  feeAmount: bigint,
): Promise<string | null> {
  if (input.feeMode !== "SEPARATE" || feeAmount <= 0n) return null;

  if (actor.role === "TELLER") {
    const feeAccountType = input.feeAccountType ?? input.accountType;
    const assignment = await tx.staffAccountAssignment.findUnique({
      where: { userId_accountType: { userId: actor.id, accountType: feeAccountType } },
      select: { financialAccount: { select: { id: true, active: true } } },
    });
    financeInvariant(
      assignment?.financialAccount?.active,
      `Teller requires an active assigned ${feeAccountType} fee account`,
      "FORBIDDEN",
    );
    return assignment.financialAccount.id;
  }

  const feeAccountId = input.feeAccountId?.trim() ?? "";
  financeInvariant(feeAccountId.length > 0, "feeAccountId is required for separate fee mode");
  const feeAccount = await tx.financialAccount.findUnique({ where: { id: feeAccountId } });
  const expectedType = input.feeAccountType ?? input.accountType;
  financeInvariant(feeAccount?.active, "Active fee account not found", "NOT_FOUND");
  financeInvariant(
    feeAccount.type === expectedType,
    `Fee account must be a ${expectedType} account`,
    "INVALID_INPUT",
  );
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

function cashSnapshot(input: {
  reference: string;
  systemReference: string;
  type: "CASH_IN" | "CASH_OUT";
  providerId: string | null;
  accountType: "BANK" | "CASH";
  accountId: string;
  amount: bigint;
  feeAmount: bigint;
  feeMode: FeeMode | null;
  feeAccountId: string | null;
  customerName: string | null;
  customerPhone: string;
  note: string | null;
}) {
  return {
    reference: input.reference,
    systemReference: input.systemReference,
    type: input.type,
    providerId: input.providerId,
    accountType: input.accountType,
    accountId: input.accountId,
    amount: input.amount.toString(),
    feeAmount: input.feeAmount.toString(),
    feeMode: input.feeMode,
    feeAccountId: input.feeAccountId,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    note: input.note,
  };
}

export async function createCashTransaction(actor: FinanceActor, input: CashTransactionInput) {
  assertCanCreateCashTransaction(actor);

  return serializable(async (tx) => {
    const account = await resolveCashAccounts(tx, actor, input);
    const feeAmount = toNonNegativeMmk(input.feeAmount, "feeAmount");
    const feeAccountId = await resolveFeeAccount(tx, actor, input, feeAmount);
    const plan = planCashTransaction({
      type: input.type,
      accountId: account.id,
      amount: input.amount,
      feeAmount,
      feeMode: input.feeMode,
      feeAccountId,
    });
    const normalized = {
      reference: requiredText(input.reference, "reference"),
      type: input.type,
      providerId: account.providerId,
      accountType: input.accountType,
      accountId: account.id,
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

export async function editCashTransaction(
  actor: FinanceActor,
  transactionId: string,
  input: CashTransactionInput,
) {
  assertCanEditTransaction(actor);
  return serializable(async (tx) => {
    const existing = await tx.financialTransaction.findUnique({ where: { id: transactionId } });
    financeInvariant(existing, "Transaction not found", "NOT_FOUND");
    financeInvariant(existing.status === "POSTED", "Deleted transactions cannot be edited", "CONFLICT");
    financeInvariant(existing.type === "CASH_IN" || existing.type === "CASH_OUT", "Transaction is not a cash transaction");
    if (input.reference !== undefined) {
      financeInvariant(input.reference.trim() === existing.reference, "Transaction reference cannot be changed");
    }
    const account = await resolveCashAccounts(tx, actor, input);
    const feeAmount = toNonNegativeMmk(input.feeAmount, "feeAmount");
    const feeAccountId = await resolveFeeAccount(tx, actor, input, feeAmount);
    const plan = planCashTransaction({
      type: input.type,
      accountId: account.id,
      amount: input.amount,
      feeAmount,
      feeMode: input.feeMode,
      feeAccountId,
    });
    const after = cashSnapshot({
      reference: existing.reference,
      systemReference: existing.systemReference,
      type: input.type,
      providerId: account.providerId,
      accountType: input.accountType,
      accountId: account.id,
      amount: plan.amount,
      feeAmount: plan.feeAmount,
      feeMode: input.feeMode,
      feeAccountId,
      customerName: optionalText(input.customerName),
      customerPhone: normalizeCustomerPhone(input.customerPhone),
      note: optionalText(input.note),
    });
    const requestFingerprint = fingerprint({
      reference: after.reference,
      type: after.type,
      providerId: after.providerId,
      accountType: after.accountType,
      accountId: after.accountId,
      amount: after.amount,
      feeAmount: after.feeAmount,
      feeMode: after.feeMode,
      feeAccountId: after.feeAccountId,
      customerName: after.customerName,
      customerPhone: after.customerPhone,
      note: after.note,
    });
    const currentEntries = await tx.ledgerEntry.findMany({
      where: { transactionId, postingVersion: existing.postingVersion, kind: "POSTING" },
      orderBy: { sequence: "asc" },
    });
    financeInvariant(currentEntries.length >= 2, "Current ledger posting is missing", "CONFLICT");
    const before = cashSnapshot({
      reference: existing.reference,
      systemReference: existing.systemReference,
      type: existing.type,
      providerId: existing.providerId,
      accountType: existing.accountType!,
      accountId: existing.accountId!,
      amount: existing.amount!,
      feeAmount: existing.feeAmount!,
      feeMode: existing.feeMode,
      feeAccountId: existing.feeAccountId,
      customerName: existing.customerName,
      customerPhone: existing.customerPhone!,
      note: existing.note,
    });
    const revision = await tx.transactionRevision.create({
      data: { transactionId, revision: existing.postingVersion, action: "EDIT", before, after, actorId: actor.id },
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
    const nextVersion = existing.postingVersion + 1;
    await tx.financialTransaction.update({
      where: { id: transactionId },
      data: {
        type: input.type,
        providerId: account.providerId,
        accountType: input.accountType,
        accountId: account.id,
        amount: plan.amount,
        feeAmount: plan.feeAmount,
        feeMode: input.feeMode,
        feeAccountId,
        customerName: after.customerName,
        customerPhone: after.customerPhone,
        note: after.note,
        requestFingerprint,
        postingVersion: nextVersion,
      },
    });
    await tx.ledgerEntry.createMany({
      data: ledgerData(plan.entries, nextVersion, "POSTING", revision.id).map((entry) => ({ ...entry, transactionId })),
    });
    return tx.financialTransaction.findUniqueOrThrow({
      where: { id: transactionId },
      include: { ledgerEntries: true, revisions: true },
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

async function appendReversal(
  tx: DbTransaction,
  transactionId: string,
  postingVersion: number,
  revisionId: string,
) {
  const currentEntries = await tx.ledgerEntry.findMany({
    where: { transactionId, postingVersion, kind: "POSTING" },
    orderBy: { sequence: "asc" },
  });
  financeInvariant(currentEntries.length >= 2, "Current ledger posting is missing", "CONFLICT");
  await tx.ledgerEntry.createMany({
    data: currentEntries.map((entry, sequence) => ({
      transactionId,
      revisionId,
      postingVersion,
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
}

export async function editInternalTransfer(
  actor: FinanceActor,
  transactionId: string,
  input: InternalTransferInput,
) {
  assertCanEditTransaction(actor);
  return serializable(async (tx) => {
    const existing = await tx.financialTransaction.findUnique({ where: { id: transactionId } });
    financeInvariant(existing, "Transaction not found", "NOT_FOUND");
    financeInvariant(existing.status === "POSTED", "Deleted transactions cannot be edited", "CONFLICT");
    financeInvariant(existing.type === "INTERNAL_TRANSFER", "Transaction is not an internal transfer");
    financeInvariant(input.reference.trim() === existing.reference, "Transaction reference cannot be changed");
    const { child, main } = await resolveTransferAccounts(tx, input);
    const source = input.direction === "MAIN_TO_CHILD" ? main : child;
    const destination = input.direction === "MAIN_TO_CHILD" ? child : main;
    const plan = planInternalTransfer({ sourceAccountId: source.id, destinationAccountId: destination.id, amount: input.amount });
    const normalized = {
      reference: existing.reference,
      accountType: input.accountType,
      transferDirection: input.direction,
      sourceAccountId: source.id,
      destinationAccountId: destination.id,
      amount: plan.amount.toString(),
      note: optionalText(input.note),
    };
    const after = {
      ...auditSnapshot(existing),
      ...normalized,
      providerId: null,
      postingVersion: existing.postingVersion + 1,
    };
    const requestFingerprint = fingerprint(normalized);
    const revision = await tx.transactionRevision.create({
      data: {
        transactionId,
        revision: existing.postingVersion,
        action: "EDIT",
        before: auditSnapshot(existing),
        after,
        actorId: actor.id,
      },
    });
    await appendReversal(tx, transactionId, existing.postingVersion, revision.id);
    const nextVersion = existing.postingVersion + 1;
    await tx.financialTransaction.update({
      where: { id: transactionId },
      data: {
        providerId: null,
        accountType: input.accountType,
        transferDirection: input.direction,
        sourceAccountId: source.id,
        destinationAccountId: destination.id,
        amount: plan.amount,
        note: after.note,
        requestFingerprint,
        postingVersion: nextVersion,
      },
    });
    await tx.ledgerEntry.createMany({
      data: ledgerData(plan.entries, nextVersion, "POSTING", revision.id).map((entry) => ({ ...entry, transactionId })),
    });
    return tx.financialTransaction.findUniqueOrThrow({
      where: { id: transactionId },
      include: { ledgerEntries: true, revisions: true },
    });
  });
}

export async function editCapitalTransaction(
  actor: FinanceActor,
  transactionId: string,
  input: CapitalTransactionInput,
) {
  assertCanEditTransaction(actor);
  return serializable(async (tx) => {
    const existing = await tx.financialTransaction.findUnique({ where: { id: transactionId } });
    financeInvariant(existing, "Transaction not found", "NOT_FOUND");
    financeInvariant(existing.status === "POSTED", "Deleted transactions cannot be edited", "CONFLICT");
    financeInvariant(
      existing.type === "CAPITAL_DEPOSIT" || existing.type === "CAPITAL_WITHDRAWAL",
      "Transaction is not a capital transaction",
    );
    financeInvariant(input.reference.trim() === existing.reference, "Transaction reference cannot be changed");
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
      reference: existing.reference,
      accountType: input.accountType,
      capitalAccountId: main.id,
      amount: plan.amount.toString(),
      note: optionalText(input.note),
      type: input.type,
    };
    const after = {
      ...auditSnapshot(existing),
      ...normalized,
      providerId: null,
      postingVersion: existing.postingVersion + 1,
    };
    const requestFingerprint = fingerprint(normalized);
    const revision = await tx.transactionRevision.create({
      data: {
        transactionId,
        revision: existing.postingVersion,
        action: "EDIT",
        before: auditSnapshot(existing),
        after,
        actorId: actor.id,
      },
    });
    await appendReversal(tx, transactionId, existing.postingVersion, revision.id);
    const nextVersion = existing.postingVersion + 1;
    await tx.financialTransaction.update({
      where: { id: transactionId },
      data: {
        type: input.type,
        providerId: null,
        accountType: input.accountType,
        capitalAccountId: main.id,
        amount: plan.amount,
        note: after.note,
        requestFingerprint,
        postingVersion: nextVersion,
      },
    });
    await tx.ledgerEntry.createMany({
      data: ledgerData(plan.entries, nextVersion, "POSTING", revision.id).map((entry) => ({ ...entry, transactionId })),
    });
    return tx.financialTransaction.findUniqueOrThrow({
      where: { id: transactionId },
      include: { ledgerEntries: true, revisions: true },
    });
  });
}

export async function deleteFinancialTransaction(actor: FinanceActor, transactionId: string) {
  assertCanDeleteTransaction(actor);
  return serializable(async (tx) => {
    const existing = await tx.financialTransaction.findUnique({ where: { id: transactionId } });
    financeInvariant(existing, "Transaction not found", "NOT_FOUND");
    if (existing.status === "DELETED") return existing;
    const currentEntries = await tx.ledgerEntry.findMany({
      where: { transactionId, postingVersion: existing.postingVersion, kind: "POSTING" },
      orderBy: { sequence: "asc" },
    });
    financeInvariant(currentEntries.length >= 2, "Current ledger posting is missing", "CONFLICT");
    const before = auditSnapshot(existing);
    const revision = await tx.transactionRevision.create({
      data: {
        transactionId,
        revision: existing.postingVersion,
        action: "DELETE",
        before,
        after: { ...before, status: "DELETED" },
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
