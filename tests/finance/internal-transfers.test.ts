import assert from "node:assert/strict";
import test from "node:test";

import type { Prisma } from "../../generated/prisma/client";
import { FinanceError, TransferConfirmationRequired } from "../../lib/finance/errors";
import type { FinanceActor, InternalTransferInput } from "../../lib/finance/types";

type Entry = {
  id: string;
  transactionId: string;
  postingVersion: number;
  kind: string;
  financialAccountId: string | null;
  systemAccount: string | null;
  side: "DEBIT" | "CREDIT";
  amount: bigint;
  memo: string | null;
};

function fixture() {
  const accounts = (["BANK", "CASH"] as const).flatMap((type) => [
    { id: `main-${type}`, name: `Main ${type}`, type, kind: "MAIN", mainSlot: type, parentId: null, providerId: null, active: true },
    ...["child", "other"].map((prefix) => ({
      id: `${prefix}-${type}`, name: `${prefix} ${type}`, type, kind: "CHILD", mainSlot: null,
      parentId: `main-${type}`, providerId: null, active: true,
    })),
  ]);
  let stored: Record<string, unknown> | null = null;
  const entries: Entry[] = [];
  const creates: Record<string, unknown>[] = [];
  const updates: Record<string, unknown>[] = [];
  const revisions: Record<string, unknown>[] = [];
  const ledgerWrites: Record<string, unknown>[][] = [];
  let balanceReads = 0;
  let postingReads = 0;
  function addEntries(data: Record<string, unknown>[]) {
    entries.push(...data.map((entry, index) => ({ id: `entry-${entries.length + index}`, ...entry }) as Entry));
  }
  const tx = {
    financialAccount: {
      async findUnique({ where }: { where: { id?: string; mainSlot?: string } }) {
        return accounts.find((account) => where.id ? account.id === where.id : account.mainSlot === where.mainSlot) ?? null;
      },
    },
    financialTransaction: {
      async findUnique() { return stored; },
      async create({ data }: { data: Record<string, unknown> }) {
        creates.push(data);
        stored = { id: "transfer", status: "POSTED", postingVersion: 1, ...data };
        const posting = data.ledgerEntries as { create: Record<string, unknown>[] };
        addEntries(posting.create.map((entry) => ({ ...entry, transactionId: "transfer" })));
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
      async groupBy({ by, where, _sum }: { by: string[]; where: { financialAccountId: string }; _sum: { amount: boolean } }) {
        balanceReads += 1;
        assert.deepEqual(by, ["side"]);
        assert.deepEqual(_sum, { amount: true });
        return (["DEBIT", "CREDIT"] as const).map((side) => ({
          side,
          _sum: { amount: entries.filter((entry) => entry.financialAccountId === where.financialAccountId && entry.side === side)
            .reduce((sum, entry) => sum + entry.amount, 0n) },
        }));
      },
      async findMany({ where }: { where: { transactionId: string; postingVersion: number; kind: string } }) {
        postingReads += 1;
        assert.equal(where.kind, "POSTING");
        return entries.filter((entry) => entry.transactionId === where.transactionId && entry.postingVersion === where.postingVersion && entry.kind === where.kind);
      },
      async createMany({ data }: { data: Record<string, unknown>[] }) {
        ledgerWrites.push(data);
        addEntries(data);
      },
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
    entries, creates, updates, revisions, ledgerWrites,
    seed(accountId: string, amount: bigint) {
      addEntries([{ transactionId: "seed", postingVersion: 1, kind: "POSTING", financialAccountId: accountId,
        systemAccount: null, side: amount >= 0n ? "DEBIT" : "CREDIT", amount: amount >= 0n ? amount : -amount, memo: "Seed" }]);
    },
    patchStored(data: Record<string, unknown>) { stored = { ...stored, ...data }; },
    clearWrites() { creates.length = updates.length = revisions.length = ledgerWrites.length = 0; },
    get balanceReads() { return balanceReads; },
    get postingReads() { return postingReads; },
  };
}

let db = fixture();
const globals = globalThis as unknown as { prisma?: unknown };
const previousPrisma = globals.prisma;
globals.prisma = {
  async $transaction(operation: (tx: Prisma.TransactionClient) => Promise<unknown>, options: { isolationLevel: string }) {
    assert.equal(options.isolationLevel, "Serializable");
    return operation(db.tx);
  },
};
const { createInternalTransfer, editInternalTransfer } = await import("../../lib/finance/transactions");
globals.prisma = previousPrisma;

const owner: FinanceActor = { id: "owner", role: "OWNER", active: true };
const input: InternalTransferInput = {
  reference: "TRANSFER-1", accountType: "BANK", direction: "MAIN_TO_CHILD", childAccountId: "child-BANK", amount: "100",
};

function noWrites() {
  assert.equal(db.creates.length, 0);
  assert.equal(db.updates.length, 0);
  assert.equal(db.revisions.length, 0);
  assert.equal(db.ledgerWrites.length, 0);
}

async function warning(operation: Promise<unknown>) {
  let result: TransferConfirmationRequired | undefined;
  await assert.rejects(operation, (error: unknown) => {
    assert.ok(error instanceof TransferConfirmationRequired);
    assert.ok(error instanceof FinanceError);
    assert.equal(error.code, "CONFLICT");
    assert.equal(error.name, "TransferConfirmationRequired");
    assert.match(error.confirmationKey, /^[a-f0-9]{64}$/);
    result = error;
    return true;
  });
  noWrites();
  return result!;
}

for (const accountType of ["BANK", "CASH"] as const) {
  for (const direction of ["MAIN_TO_CHILD", "CHILD_TO_MAIN"] as const) {
    const request = { ...input, accountType, direction, childAccountId: `child-${accountType}` };
    const sourceId = `${direction === "MAIN_TO_CHILD" ? "main" : "child"}-${accountType}`;
    for (const balance of [100n, 150n]) {
      test(`${accountType} ${direction} needs no confirmation with ${balance} MMK`, async () => {
        db = fixture();
        db.seed(sourceId, balance + 50n);
        db.seed(sourceId, -50n);
        const result = await createInternalTransfer(owner, request);
        assert.equal(result.sourceAccountId, sourceId);
        assert.equal(db.creates.length, 1);
      });
    }
    test(`${accountType} ${direction} warns before writes and permits confirmed overdraft`, async () => {
      db = fixture();
      db.seed(sourceId, 40n);
      const error = await warning(createInternalTransfer(owner, request));
      assert.equal(error.reference, request.reference);
      assert.ok(error.message.includes(direction === "MAIN_TO_CHILD" ? `Main ${accountType}` : `child ${accountType}`));
      assert.match(error.message, /40 MMK.*100 MMK.*negative balance of -60 MMK/);
      const result = await createInternalTransfer(owner, { ...request, confirmationKey: error.confirmationKey });
      assert.equal(result.amount, 100n);
      assert.equal(db.creates.length, 1);
      const reads = db.balanceReads;
      assert.strictEqual(await createInternalTransfer(owner, request), result);
      assert.strictEqual(await createInternalTransfer(owner, { ...request, confirmationKey: "stale" }), result);
      assert.equal(db.balanceReads, reads);
      await assert.rejects(createInternalTransfer(owner, { ...request, amount: "101" }), /different input/);
      assert.equal(db.balanceReads, reads);
    });
  }
}

test("already negative source still requires confirmation", async () => {
  db = fixture();
  db.seed("main-BANK", -20n);
  const error = await warning(createInternalTransfer(owner, input));
  assert.match(error.message, /-20 MMK.*100 MMK.*-120 MMK/);
});

for (const change of ["balance", "amount", "source", "destination", "type", "note", "reference", "actor"] as const) {
  test(`changed ${change} invalidates confirmation`, async () => {
    db = fixture();
    const first = await warning(createInternalTransfer(owner, input));
    if (change === "balance") db.seed("main-BANK", -1n);
    const changed = {
      ...input, confirmationKey: first.confirmationKey,
      ...(change === "amount" ? { amount: "101" } : {}),
      ...(change === "source" ? { direction: "CHILD_TO_MAIN" as const } : {}),
      ...(change === "destination" ? { childAccountId: "other-BANK" } : {}),
      ...(change === "type" ? { accountType: "CASH" as const, childAccountId: "child-CASH" } : {}),
      ...(change === "note" ? { note: "Changed" } : {}),
      ...(change === "reference" ? { reference: "TRANSFER-2" } : {}),
    };
    const second = await warning(createInternalTransfer(change === "actor" ? { ...owner, id: "other-owner" } : owner, changed));
    assert.notEqual(second.confirmationKey, first.confirmationKey);
    await createInternalTransfer(change === "actor" ? { ...owner, id: "other-owner" } : owner, { ...changed, confirmationKey: second.confirmationKey });
  });
}

test("confirmation uses normalized amount, note and reference", async () => {
  db = fixture();
  const error = await warning(createInternalTransfer(owner, { ...input, reference: " TRANSFER-1 ", amount: 100n, note: " hello " }));
  assert.equal(error.reference, input.reference);
  await createInternalTransfer(owner, { ...input, amount: "100", note: "hello", confirmationKey: error.confirmationKey });
});

async function existingTransfer() {
  db = fixture();
  db.seed("main-BANK", 100n);
  await createInternalTransfer(owner, input);
  db.clearWrites();
}

test("edit restores original source funds and reuses posting entries for reversal", async () => {
  await existingTransfer();
  const result = await editInternalTransfer(owner, "transfer", input);
  assert.equal(result?.postingVersion, 2);
  assert.equal(result?.reference, input.reference);
  assert.equal(db.postingReads, 1);
  assert.equal(db.revisions.length, 1);
  assert.equal(db.ledgerWrites.length, 2);
  assert.equal(db.ledgerWrites[0][1].side, "DEBIT");
  assert.equal(db.ledgerWrites[0][1].amount, 100n);
  const reads = db.balanceReads;
  assert.strictEqual(await createInternalTransfer(owner, input), result);
  assert.equal(db.balanceReads, reads);
});

test("edit warns on effective source balance before revision or ledger writes", async () => {
  await existingTransfer();
  const changed = { ...input, amount: "120" };
  const error = await warning(editInternalTransfer(owner, "transfer", changed));
  assert.match(error.message, /100 MMK.*120 MMK.*-20 MMK/);
  await editInternalTransfer(owner, "transfer", { ...changed, confirmationKey: error.confirmationKey });
  assert.equal(db.updates[0].amount, 120n);
});

test("switching edit direction removes original receipt from the new source balance", async () => {
  await existingTransfer();
  const changed = { ...input, direction: "CHILD_TO_MAIN" as const };
  const error = await warning(editInternalTransfer(owner, "transfer", changed));
  assert.match(error.message, /child BANK.*0 MMK.*100 MMK.*-100 MMK/);
  await editInternalTransfer(owner, "transfer", { ...changed, confirmationKey: error.confirmationKey });
});

test("new edit source does not gain funds from an unrelated original posting", async () => {
  await existingTransfer();
  const changed = { ...input, direction: "CHILD_TO_MAIN" as const, childAccountId: "other-BANK" };
  const error = await warning(editInternalTransfer(owner, "transfer", changed));
  assert.match(error.message, /other BANK.*0 MMK/);
  db.seed("other-BANK", 100n);
  await editInternalTransfer(owner, "transfer", changed);
});

for (const change of ["balance", "version", "id"] as const) {
  test(`edit confirmation becomes stale after ${change} changes`, async () => {
    await existingTransfer();
    const changed = { ...input, amount: "120" };
    const first = await warning(editInternalTransfer(owner, "transfer", changed));
    if (change === "balance") db.seed("main-BANK", -1n);
    if (change === "version") {
      db.patchStored({ postingVersion: 2 });
      for (const entry of db.entries.filter((entry) => entry.transactionId === "transfer")) entry.postingVersion = 2;
    }
    if (change === "id") db.patchStored({ id: "other-transfer" });
    const second = await warning(editInternalTransfer(owner, "transfer", { ...changed, confirmationKey: first.confirmationKey }));
    assert.notEqual(second.confirmationKey, first.confirmationKey);
  });
}

test("edit cannot change reference and missing postings fail without writes", async () => {
  await existingTransfer();
  await assert.rejects(editInternalTransfer(owner, "transfer", { ...input, reference: "OTHER" }), /reference cannot be changed/);
  noWrites();
  db.entries.splice(1);
  await assert.rejects(editInternalTransfer(owner, "transfer", input), /Current ledger posting is missing/);
  noWrites();
});

test("confirmation never bypasses owner and active staff permissions", async () => {
  db = fixture();
  const error = await warning(createInternalTransfer(owner, input));
  const confirmed = { ...input, confirmationKey: error.confirmationKey };
  for (const actor of [{ ...owner, role: "TELLER" as const }, { ...owner, active: false }]) {
    for (const operation of [createInternalTransfer(actor, confirmed), editInternalTransfer(actor, "transfer", confirmed)]) {
      await assert.rejects(operation, (error: unknown) => {
        assert.ok(error instanceof FinanceError);
        assert.equal(error.code, "FORBIDDEN");
        return true;
      });
    }
  }
  assert.equal(db.balanceReads, 1);
  noWrites();
});
