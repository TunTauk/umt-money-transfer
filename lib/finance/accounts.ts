import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

import { assertValidChildParent } from "./account-rules";
import { financeInvariant } from "./errors";
import { assertCanManageAccounts, assertCanManageStaffAssignments } from "./permissions";
import type { AccountType, FinanceActor } from "./types";

function requiredText(value: string, field: string): string {
  const normalized = value.trim();
  financeInvariant(normalized.length > 0, `${field} is required`);
  return normalized;
}

export async function createProvider(
  actor: FinanceActor,
  input: { code: string; name: string },
) {
  assertCanManageAccounts(actor);
  return prisma.provider.create({
    data: {
      code: requiredText(input.code, "code").toUpperCase(),
      name: requiredText(input.name, "name"),
    },
  });
}

export async function createFinancialAccount(
  actor: FinanceActor,
  input: {
    providerId?: string | null;
    code: string;
    name: string;
    type: AccountType;
    kind: "MAIN" | "CHILD";
    parentId?: string | null;
  },
) {
  assertCanManageAccounts(actor);

  return prisma.$transaction(async (tx) => {
    const providerId = input.providerId?.trim() || null;
    if (providerId) {
      const provider = await tx.provider.findUnique({ where: { id: providerId } });
      financeInvariant(provider?.active, "Active provider not found", "NOT_FOUND");
    }

    if (input.kind === "MAIN") {
      financeInvariant(!input.parentId, "Main accounts cannot have a parent");
      financeInvariant(!providerId, "Global main accounts cannot have a provider");
    } else {
      financeInvariant(input.parentId, "Child accounts require a parent");
      const parent = await tx.financialAccount.findUnique({ where: { id: input.parentId } });
      financeInvariant(parent, "Parent account not found", "NOT_FOUND");
      assertValidChildParent(input.type, parent);
    }

    return tx.financialAccount.create({
      data: {
        providerId,
        code: requiredText(input.code, "code").toUpperCase(),
        name: requiredText(input.name, "name"),
        type: input.type,
        kind: input.kind,
        parentId: input.kind === "CHILD" ? input.parentId : null,
        mainSlot: input.kind === "MAIN" ? input.type : null,
      },
    });
  }, { isolationLevel: "Serializable" });
}

export async function assignTellerAccounts(
  actor: FinanceActor,
  input: { userId: string; bankAccountId: string; cashAccountId: string },
) {
  assertCanManageStaffAssignments(actor);

  return prisma.$transaction(async (tx) => {
    const [user, bank, cash] = await Promise.all([
      tx.user.findUnique({ where: { id: input.userId } }),
      tx.financialAccount.findUnique({ where: { id: input.bankAccountId } }),
      tx.financialAccount.findUnique({ where: { id: input.cashAccountId } }),
    ]);
    financeInvariant(user?.active && user.role === "TELLER", "Active teller not found", "NOT_FOUND");
    financeInvariant(bank?.active && bank.kind === "CHILD" && bank.type === "BANK", "Assignable bank child not found");
    financeInvariant(cash?.active && cash.kind === "CHILD" && cash.type === "CASH", "Assignable cash child not found");
    for (const accountId of [bank.id, cash.id]) {
      const otherStaffCount = await tx.staffAccountAssignment.count({
        where: { financialAccountId: accountId, userId: { not: user.id } },
      });
      financeInvariant(otherStaffCount < 2, "A child account can be assigned to at most two staff", "CONFLICT");
    }

    const assignments = await Promise.all([
      tx.staffAccountAssignment.upsert({
        where: { userId_accountType: { userId: user.id, accountType: "BANK" } },
        create: {
          userId: user.id,
          accountType: "BANK",
          financialAccountId: bank.id,
          createdById: actor.id,
        },
        update: { financialAccountId: bank.id, createdById: actor.id },
      }),
      tx.staffAccountAssignment.upsert({
        where: { userId_accountType: { userId: user.id, accountType: "CASH" } },
        create: {
          userId: user.id,
          accountType: "CASH",
          financialAccountId: cash.id,
          createdById: actor.id,
        },
        update: { financialAccountId: cash.id, createdById: actor.id },
      }),
    ]);

    return assignments;
  }, { isolationLevel: "Serializable" satisfies Prisma.TransactionIsolationLevel });
}

export async function setFinancialAccountActive(
  actor: FinanceActor,
  accountId: string,
  active: boolean,
) {
  assertCanManageAccounts(actor);
  return prisma.$transaction(async (tx) => {
    const account = await tx.financialAccount.findUnique({
      where: { id: accountId },
      include: { _count: { select: { assignments: true } } },
    });
    financeInvariant(account, "Financial account not found", "NOT_FOUND");
    if (!active) {
      financeInvariant(account.kind !== "MAIN", "Main accounts cannot be deactivated");
      financeInvariant(account._count.assignments === 0, "Reassign staff before deactivating this account", "CONFLICT");
    }
    if (account.active === active) return account;
    return tx.financialAccount.update({ where: { id: accountId }, data: { active } });
  });
}
