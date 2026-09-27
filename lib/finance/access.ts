import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

import { FinanceError } from "./errors";
import { assertActiveActor } from "./permissions";
import type { FinanceActor } from "./types";

export async function financialTransactionVisibilityWhere(
  actor: FinanceActor,
): Promise<Prisma.FinancialTransactionWhereInput> {
  assertActiveActor(actor);
  if (actor.role === "OWNER") return {};

  const accountIds = (
    await prisma.staffAccountAssignment.findMany({
      where: { userId: actor.id },
      select: { financialAccountId: true },
    })
  ).map((assignment) => assignment.financialAccountId);

  if (accountIds.length === 0) return { id: { in: [] } };
  return {
    OR: [
      { accountId: { in: accountIds } },
      { sourceAccountId: { in: accountIds } },
      { destinationAccountId: { in: accountIds } },
      { capitalAccountId: { in: accountIds } },
      { feeAccountId: { in: accountIds } },
    ],
  };
}

export async function getFinancialTransactionForActor(
  actor: FinanceActor,
  transactionId: string,
) {
  const visibility = await financialTransactionVisibilityWhere(actor);
  const transaction = await prisma.financialTransaction.findFirst({
    where: { AND: [{ id: transactionId }, visibility] },
    include: { ledgerEntries: { orderBy: [{ postingVersion: "asc" }, { sequence: "asc" }] }, revisions: true },
  });
  if (!transaction) throw new FinanceError("Transaction not found or not visible", "NOT_FOUND");
  return transaction;
}
