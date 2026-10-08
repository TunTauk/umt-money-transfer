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
const { createCashTransaction, editCashTransaction, deleteFinancialTransaction } = await import("../../lib/finance/transactions");
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
    for (const operation of ["CREATE", "EDIT"] as const) {
      test(`${actor.role} rejects every wrong ${type} leg combination on ${operation} without writes`, async () => {
        for (const receivingAccountId of ["bank", "cash"]) {
          for (const payingAccountId of ["bank", "cash"]) {
            if (receivingAccountId === (type === "CASH_IN" ? "cash" : "bank") &&
                payingAccountId === (type === "CASH_IN" ? "bank" : "cash")) continue;
            db = fixture();
            const validInput = {
              ...input, type,
              receivingAccountId: type === "CASH_IN" ? "cash" : "bank",
              payingAccountId: type === "CASH_IN" ? "bank" : "cash",
            };
            const old = operation === "EDIT" ? await createCashTransaction(actor, validInput) : null;
            if (old) {
              const posting = db.creates[0].ledgerEntries as { create: StoredEntry[] };
              db.postings.push(...posting.create.map((entry, index) => ({ ...entry, id: `entry-${index}` })));
            }
            const originalPosting = structuredClone(db.postings);
            const invalidInput = { ...input, type, receivingAccountId, payingAccountId };
            await assert.rejects(operation === "CREATE"
              ? createCashTransaction(actor, invalidInput)
              : editCashTransaction(actor, "transaction", invalidInput),
            actor.role === "TELLER" && operation === "EDIT"
              ? /Owner permission required/
              : /Active (bank|cash) account not found/);
            assert.equal(db.creates.length, operation === "EDIT" ? 1 : 0);
            assert.equal(db.updates.length, 0);
            assert.equal(db.revisions.length, 0);
            assert.equal(db.ledgerWrites.length, 0);
            assert.deepEqual(db.postings, originalPosting);
            assert.strictEqual(await db.tx.financialTransaction.findUnique({ where: { id: "transaction" } }), old);
          }
        }
      });
    }
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

for (const historical of ["nullable", "bank-bank", "bank-cash", "cash-bank", "cash-cash", "new"]) {
  for (const type of ["CASH_IN", "CASH_OUT"] as const) {
    test(`editing ${historical} ${type} audits account legs and reverses stored ledger`, async () => {
      db = fixture();
      const receivingAccountId = type === "CASH_IN" ? "cash" : "bank";
      const payingAccountId = type === "CASH_IN" ? "bank" : "cash";
      const old = await createCashTransaction(owner, { ...input, type, receivingAccountId, payingAccountId });
      const sourceAccountId = historical === "nullable" ? null : historical === "new" ? payingAccountId : historical.split("-")[1];
      const destinationAccountId = historical === "nullable" ? null : historical === "new" ? receivingAccountId : historical.split("-")[0];
      db.setStored({ ...old, sourceAccountId, destinationAccountId });
      db.postings.push(
        { id: "entry-1", financialAccountId: destinationAccountId, systemAccount: historical === "nullable" ? "CUSTOMER_CLEARING" : null, side: "DEBIT", amount: 102n, memo: "Original receive" },
        { id: "entry-2", financialAccountId: sourceAccountId ?? "bank", systemAccount: null, side: "CREDIT", amount: 100n, memo: "Original pay" },
        { id: "entry-3", financialAccountId: null, systemAccount: "FEE_INCOME", side: "CREDIT", amount: 2n, memo: "Original fee" },
      );
      const originalPosting = structuredClone(db.postings);
      const editedInput = { ...input, type, receivingAccountId: `other-${receivingAccountId}`, payingAccountId: `other-${payingAccountId}`, feeMode: "SEPARATE" as const, feeAccountId: "bank" };
      const edited = await editCashTransaction(owner, "transaction", editedInput);
      const before = db.revisions[0].before as Record<string, unknown>;
      const after = db.revisions[0].after as Record<string, unknown>;
      assert.equal(before.sourceAccountId, sourceAccountId);
      assert.equal(before.destinationAccountId, destinationAccountId);
      assert.equal(after.sourceAccountId, editedInput.payingAccountId);
      assert.equal(after.destinationAccountId, editedInput.receivingAccountId);
      assert.equal(edited?.sourceAccountId, editedInput.payingAccountId);
      assert.equal(edited?.destinationAccountId, editedInput.receivingAccountId);
      assert.equal(edited?.accountId, "other-bank");
      assert.equal(edited?.postingVersion, 2);
      assert.equal(db.ledgerWrites.length, 2);
      for (const [index, original] of originalPosting.entries()) {
        const reversed = db.ledgerWrites[0][index];
        assert.equal(reversed.financialAccountId, original.financialAccountId);
        assert.equal(reversed.systemAccount, original.systemAccount);
        assert.equal(reversed.amount, original.amount);
        assert.equal(reversed.side, original.side === "DEBIT" ? "CREDIT" : "DEBIT");
        assert.equal(reversed.reversalOfId, original.id);
        assert.equal(reversed.kind, "REVERSAL");
      }
      assert.deepEqual(db.postings, originalPosting);
      assert.equal(db.ledgerWrites[1][0].financialAccountId, editedInput.receivingAccountId);
      assert.equal(db.ledgerWrites[1][1].financialAccountId, editedInput.payingAccountId);
      assert.equal(db.ledgerWrites[1][2].financialAccountId, "bank");
      assert.ok(db.ledgerWrites[1].every((entry) => entry.postingVersion === 2));
      assert.strictEqual(await createCashTransaction(owner, editedInput), edited);
    });
  }
}

test("deleting historical cash reverses stored entries without filling null account legs", async () => {
  db = fixture();
  const old = await createCashTransaction(owner, input);
  db.setStored({ ...old, sourceAccountId: null, destinationAccountId: null });
  db.postings.push(
    { id: "receive", financialAccountId: null, systemAccount: "CUSTOMER_CLEARING", side: "DEBIT", amount: 100n, memo: "Legacy receive" },
    { id: "pay", financialAccountId: "bank", systemAccount: null, side: "CREDIT", amount: 100n, memo: "Legacy pay" },
  );
  const deleted = await deleteFinancialTransaction(owner, "transaction");
  assert.equal(deleted.sourceAccountId, null);
  assert.equal(deleted.destinationAccountId, null);
  assert.equal(db.ledgerWrites[0][0].systemAccount, "CUSTOMER_CLEARING");
  assert.equal(db.ledgerWrites[0][0].side, "CREDIT");
  assert.equal((db.revisions[0].before as Record<string, unknown>).sourceAccountId, null);
  assert.equal(db.updates[0].status, "DELETED");
});
