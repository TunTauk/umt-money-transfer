import assert from "node:assert/strict";
import test from "node:test";

import type { Prisma } from "../../generated/prisma/client";
import type { CashTransactionInput, FinanceActor } from "../../lib/finance/types";

type StoredEntry = {
  id: string;
  financialAccountId: string | null;
  systemAccount: "CUSTOMER_CLEARING" | "FEE_INCOME" | null;
  side: "DEBIT" | "CREDIT";
  amount: bigint;
  memo: string;
};

function fixture() {
  const child = { kind: "CHILD", active: true, parentId: "main", mainSlot: null };
  const accounts = [
    { ...child, id: "bank", type: "BANK", providerId: "provider" },
    { ...child, id: "cash", type: "CASH", providerId: null },
    { ...child, id: "other-bank", type: "BANK", providerId: "other-provider" },
    { ...child, id: "other-cash", type: "CASH", providerId: null },
    { ...child, id: "main-bank", type: "BANK", providerId: null, kind: "MAIN" },
    { ...child, id: "inactive", type: "CASH", providerId: null, active: false },
  ];
  const assignments = new Map([["BANK", "bank"], ["CASH", "cash"]]);
  let stored: Record<string, unknown> | null = null;
  const postings: StoredEntry[] = [];
  const ledgerWrites: Record<string, unknown>[][] = [];
  const revisions: Record<string, unknown>[] = [];
  const creates: Record<string, unknown>[] = [];
  const updates: Record<string, unknown>[] = [];
  const tx = {
    financialAccount: {
      async findUnique({ where }: { where: { id: string } }) {
        return accounts.find((account) => account.id === where.id) ?? null;
      },
    },
    staffAccountAssignment: {
      async findUnique({ where }: { where: { userId_accountType: { userId: string; accountType: string } } }) {
        assert.equal(where.userId_accountType.userId, "teller");
        const financialAccountId = assignments.get(where.userId_accountType.accountType);
        return financialAccountId ? { financialAccountId } : null;
      },
    },
    financialTransaction: {
      async findUnique() { return stored; },
      async create({ data }: { data: Record<string, unknown> }) {
        creates.push(data);
        stored = { id: "transaction", status: "POSTED", postingVersion: 1, ...data };
        return stored;
      },
      async update({ data }: { data: Record<string, unknown> }) {
        updates.push(data);
        stored = { ...stored, ...data };
        return stored;
      },
      async findUniqueOrThrow() { return stored; },
    },
    ledgerEntry: {
      async findMany({ where }: { where: { postingVersion: number; kind: string } }) {
        assert.equal(where.postingVersion, stored?.postingVersion);
        assert.equal(where.kind, "POSTING");
        return postings;
      },
      async createMany({ data }: { data: Record<string, unknown>[] }) { ledgerWrites.push(data); },
    },
    transactionRevision: {
      async create({ data }: { data: Record<string, unknown> }) {
        revisions.push(data);
        return { id: "revision" };
      },
    },
  };
  return {
    tx: tx as unknown as Prisma.TransactionClient,
    accounts, assignments, postings, ledgerWrites, revisions, creates, updates,
    setStored(value: Record<string, unknown>) { stored = value; },
  };
}

let db = fixture();
// Inject a database double before importing the backend, avoiding a live database.
const globals = globalThis as unknown as { prisma?: unknown };
const previousPrisma = globals.prisma;
globals.prisma = {
  async $transaction(operation: (tx: Prisma.TransactionClient) => Promise<unknown>) {
    return operation(db.tx);
  },
};
const { createCashTransaction, cancelCashTransaction } = await import("../../lib/finance/transactions");
globals.prisma = previousPrisma;

const owner: FinanceActor = { id: "owner", role: "OWNER", active: true };
const teller: FinanceActor = { id: "teller", role: "TELLER", active: true };
const input: CashTransactionInput = {
  reference: "CASH-1", type: "CASH_IN", receivingAccountId: "cash", payingAccountId: "bank",
  amount: "100", feeAmount: "2", feeMode: "DEDUCTED", customerPhone: "09123456789",
};

for (const type of ["CASH_IN", "CASH_OUT"] as const) {
  const receivingAccountId = type === "CASH_IN" ? "cash" : "bank";
  const payingAccountId = type === "CASH_IN" ? "bank" : "cash";
  const validInput = { ...input, type, receivingAccountId, payingAccountId };
  test(`${type} rejects invalid phones without financial changes`, async () => {
    for (const customerPhone of ["09abccd", "09", "09123456789abc"]) {
      db = fixture();
      await assert.rejects(createCashTransaction(owner, { ...validInput, customerPhone }), /complete Myanmar mobile number/);
      assert.equal(db.creates.length, 0);

    }
  });
  for (const actor of [owner, teller]) {
    test(`${actor.role} creates ${type} using independent submitted accounts`, async () => {
      db = fixture();
      const result = await createCashTransaction(actor, validInput);
      assert.equal(result.sourceAccountId, payingAccountId);
      assert.equal(result.destinationAccountId, receivingAccountId);
      assert.equal(result.accountId, "bank");
      assert.equal(result.accountType, "BANK");
      assert.equal(result.providerId, "provider");
      const posting = db.creates[0].ledgerEntries as { create: Record<string, unknown>[] };
      assert.equal(posting.create[0].financialAccountId, receivingAccountId);
      assert.equal(posting.create[1].financialAccountId, payingAccountId);
      assert.ok(posting.create.every((entry) => entry.systemAccount !== "CUSTOMER_CLEARING"));
    });
  }

  test(`${type} fingerprints both accounts and retries identical input idempotently`, async () => {
    db = fixture();
    const result = await createCashTransaction(owner, validInput);
    assert.strictEqual(await createCashTransaction(owner, validInput), result);
    assert.equal(db.creates.length, 1);
    await assert.rejects(createCashTransaction(owner, { ...validInput, receivingAccountId: `other-${receivingAccountId}` }), /different input/);
    await assert.rejects(createCashTransaction(owner, { ...validInput, payingAccountId: `other-${payingAccountId}` }), /different input/);
  });
}

for (const type of ["CASH_IN", "CASH_OUT"] as const) {
  for (const actor of [owner, teller]) {
    test(`${actor.role} rejects wrong ${type} account legs before writing`, async () => {
      for (const receivingAccountId of ["bank", "cash"]) {
        for (const payingAccountId of ["bank", "cash"]) {
          if (receivingAccountId === (type === "CASH_IN" ? "cash" : "bank") && payingAccountId === (type === "CASH_IN" ? "bank" : "cash")) continue;
          db = fixture();
          await assert.rejects(createCashTransaction(actor, { ...input, type, receivingAccountId, payingAccountId }), /Active (bank|cash) account not found/);
          assert.equal(db.creates.length, 0);
          assert.equal(db.updates.length, 0);
          assert.equal(db.ledgerWrites.length, 0);
        }
      }
    });
  }
}

for (const field of ["receivingAccountId", "payingAccountId", "feeAccountId"] as const) {
  test(`${field} must be an active child for owners and tellers`, async () => {
    for (const actor of [owner, teller]) {
      for (const invalid of ["main-bank", "inactive", "missing", ""]) {
        db = fixture();
        await assert.rejects(createCashTransaction(actor, { ...input, feeMode: "SEPARATE", feeAccountId: "cash", [field]: invalid }));
        assert.equal(db.creates.length, 0);
      }
    }
  });

  test(`teller cannot substitute an unassigned submitted ${field}`, async () => {
    db = fixture();
    await assert.rejects(createCashTransaction(teller, {
      ...input, feeMode: "SEPARATE", feeAccountId: "cash", [field]: field === "receivingAccountId" ? "other-cash" : "other-bank",
    }), /must be assigned the submitted/);
    assert.equal(db.creates.length, 0);
  });
}

test("explicit fee account is independent of settlement", async () => {
  for (const actor of [owner, teller]) {
    for (const type of ["CASH_IN", "CASH_OUT"] as const) {
      for (const feeAccountId of ["bank", "cash"]) {
        db = fixture();
        const receivingAccountId = type === "CASH_IN" ? "cash" : "bank";
        const payingAccountId = type === "CASH_IN" ? "bank" : "cash";
        const result = await createCashTransaction(actor, {
          ...input, type, receivingAccountId, payingAccountId, feeMode: "SEPARATE", feeAccountId,
        });
        assert.equal(result.feeAccountId, feeAccountId);
        assert.equal(result.sourceAccountId, payingAccountId);
        assert.equal(result.destinationAccountId, receivingAccountId);
        const posting = db.creates[0].ledgerEntries as { create: StoredEntry[] };
        assert.equal(posting.create[2].financialAccountId, feeAccountId);
      }
    }
  }
});

test("missing teller assignments fail for both submitted legs", async () => {
  for (const accountType of ["BANK", "CASH"]) {
    db = fixture();
    db.assignments.delete(accountType);
    await assert.rejects(createCashTransaction(teller, input), /must be assigned the submitted/);
  }
});

test("a submitted blank fee ID is rejected rather than replaced by an assignment", async () => {
  for (const feeAccountId of ["", " "]) {
    db = fixture();
    await assert.rejects(createCashTransaction(teller, {
      ...input, feeMode: "SEPARATE", feeAccountId,
    }), /feeAccountId is required/);
  }
});

test("positive separate fees require an explicit account", async () => {
  for (const actor of [owner, teller]) {
    db = fixture();
    await assert.rejects(createCashTransaction(actor, { ...input, feeMode: "SEPARATE" }), /feeAccountId is required/);
  }
  db = fixture();
  db.assignments.set("BANK", "other-bank");
  await assert.rejects(createCashTransaction(teller, {
    ...input, payingAccountId: "other-bank", feeMode: "SEPARATE", feeAccountId: "bank",
  }), /must be assigned the submitted feeAccountId/);
});

test("deducted and zero-fee separate modes ignore fee accounts", async () => {
  for (const options of [{ feeMode: "DEDUCTED" as const, feeAmount: "2" }, { feeMode: "SEPARATE" as const, feeAmount: "0" }]) {
    db = fixture();
    const result = await createCashTransaction(teller, { ...input, ...options, feeAccountId: "missing" });
    assert.equal(result.feeAccountId, null);
  }
});

test("cancelling historical cash reverses stored entries without filling null account legs", async () => {
  db = fixture();
  const old = await createCashTransaction(owner, input);
  db.setStored({ ...old, sourceAccountId: null, destinationAccountId: null });
  db.postings.push(
    { id: "receive", financialAccountId: null, systemAccount: "CUSTOMER_CLEARING", side: "DEBIT", amount: 100n, memo: "Legacy receive" },
    { id: "pay", financialAccountId: "bank", systemAccount: null, side: "CREDIT", amount: 100n, memo: "Legacy pay" },
  );
  const deleted = await cancelCashTransaction(owner, "transaction");
  assert.equal(deleted.sourceAccountId, null);
  assert.equal(deleted.destinationAccountId, null);
  assert.equal(db.ledgerWrites[0][0].systemAccount, "CUSTOMER_CLEARING");
  assert.equal(db.ledgerWrites[0][0].side, "CREDIT");
  assert.equal((db.revisions[0].before as Record<string, unknown>).sourceAccountId, null);
  assert.equal(db.updates[0].status, "DELETED");
});

for (const type of ["INTERNAL_TRANSFER", "CAPITAL_DEPOSIT", "CAPITAL_WITHDRAWAL"] as const) {
  test(`${type} rejects cancellation without changing records or ledger`, async () => {
    for (const status of ["POSTED", "DELETED"] as const) {
      db = fixture();
      db.setStored({ id: "immutable", type, status, postingVersion: 1 });
      await assert.rejects(cancelCashTransaction(owner, "immutable"), { code: "FORBIDDEN" });
      assert.equal(db.updates.length, 0);
      assert.equal(db.revisions.length, 0);
      assert.equal(db.ledgerWrites.length, 0);
      assert.equal(db.creates.length, 0);
    }
  });
}

for (const type of ["CASH_IN", "CASH_OUT"] as const) {
  for (const feeMode of ["DEDUCTED", "SEPARATE"] as const) {
    test(`${type} cancellation exactly offsets principal and ${feeMode} fee and preserves the original`, async () => {
      db = fixture();
      const original = await createCashTransaction(owner, {
        ...input, type, feeMode, feeAccountId: "cash",
        receivingAccountId: type === "CASH_IN" ? "cash" : "bank",
        payingAccountId: type === "CASH_IN" ? "bank" : "cash",
      });
      const snapshot = structuredClone(original);
      const posting = db.creates[0].ledgerEntries as { create: StoredEntry[] };
      db.postings.push(...posting.create.map((entry, index) => ({ ...entry, id: `entry-${index}` })));
      const originalPosting = structuredClone(db.postings);
      const cancelled = await cancelCashTransaction(owner, "transaction");
      assert.deepEqual(original, snapshot);
      assert.deepEqual(db.postings, originalPosting);
      assert.equal(cancelled.status, "DELETED");
      assert.equal(cancelled.deletedById, owner.id);
      assert.ok(cancelled.deletedAt instanceof Date);
      assert.equal(cancelled.amount, original.amount);
      assert.equal(cancelled.feeAmount, original.feeAmount);
      assert.equal(db.creates.length, 1);
      assert.equal(db.updates.length, 1);
      assert.equal(db.revisions.length, 1);
      assert.equal(db.revisions[0].actorId, owner.id);
      assert.equal((db.revisions[0].after as { operation: string }).operation, "CANCEL");
      for (const [index, entry] of originalPosting.entries()) {
        const reversal = db.ledgerWrites[0][index];
        assert.equal(reversal.financialAccountId, entry.financialAccountId);
        assert.equal(reversal.systemAccount, entry.systemAccount);
        assert.equal(reversal.amount, entry.amount);
        assert.equal(reversal.side, entry.side === "DEBIT" ? "CREDIT" : "DEBIT");
        assert.equal(reversal.reversalOfId, entry.id);
      }
      assert.strictEqual(await cancelCashTransaction(owner, "transaction"), cancelled);
      assert.equal(db.ledgerWrites.length, 1, "Repeated cancellation must not reverse twice");
      assert.equal(db.revisions.length, 1);
    });
  }
}

test("only active owners can cancel cash transactions", async () => {
  for (const actor of [teller, { ...owner, active: false }, { ...teller, active: false }]) {
    db = fixture();
    await assert.rejects(cancelCashTransaction(actor, "transaction"), { code: "FORBIDDEN" });
    assert.equal(db.updates.length, 0);
    assert.equal(db.revisions.length, 0);
    assert.equal(db.ledgerWrites.length, 0);
  }
});

test("missing transactions and missing postings fail before writes", async () => {
  db = fixture();
  await assert.rejects(cancelCashTransaction(owner, "missing"), { code: "NOT_FOUND" });
  await createCashTransaction(owner, input);
  await assert.rejects(cancelCashTransaction(owner, "transaction"), /Current ledger posting is missing/);
  assert.equal(db.updates.length, 0);
  assert.equal(db.revisions.length, 0);
  assert.equal(db.ledgerWrites.length, 0);
});
