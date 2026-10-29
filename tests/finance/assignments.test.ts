import assert from "node:assert/strict";
import test from "node:test";

import type { Prisma } from "../../generated/prisma/client";
import type { AccountType, FinanceActor } from "../../lib/finance/types";

type Assignment = {
  userId: string;
  accountType: AccountType;
  financialAccountId: string;
  createdById: string;
};

function fixture() {
  const accounts = [
    { id: "bank", type: "BANK", kind: "CHILD", active: true },
    { id: "cash", type: "CASH", kind: "CHILD", active: true },
    { id: "main-bank", type: "BANK", kind: "MAIN", active: true },
    { id: "main-cash", type: "CASH", kind: "MAIN", active: true },
    { id: "inactive-bank", type: "BANK", kind: "CHILD", active: false },
    { id: "inactive-cash", type: "CASH", kind: "CHILD", active: false },
  ];
  const user = { id: "teller", role: "TELLER", active: true };
  const assignments: Assignment[] = [
    { userId: "teller", accountType: "BANK", financialAccountId: "old-bank", createdById: "old-owner" },
    { userId: "teller", accountType: "CASH", financialAccountId: "old-cash", createdById: "old-owner" },
    { userId: "other", accountType: "BANK", financialAccountId: "old-bank", createdById: "old-owner" },
    { userId: "other", accountType: "CASH", financialAccountId: "old-cash", createdById: "old-owner" },
  ];
  const writes: string[] = [];
  const reads: string[] = [];
  let transactions = 0;
  const tx = {
    user: {
      async findUnique({ where }: { where: { id: string } }) {
        reads.push("user");
        return where.id === user.id ? user : null;
      },
    },
    financialAccount: {
      async findUnique({ where }: { where: { id: string } }) {
        assert.equal(writes.length, 0, "Account validation must precede all writes");
        reads.push(where.id);
        return accounts.find((account) => account.id === where.id) ?? null;
      },
    },
    staffAccountAssignment: {
      async count({ where }: { where: { financialAccountId: string; userId: { not: string } } }) {
        assert.equal(writes.length, 0, "Capacity validation must precede all writes");
        assert.equal(where.userId.not, user.id);
        reads.push(`count:${where.financialAccountId}`);
        return assignments.filter((assignment) => assignment.financialAccountId === where.financialAccountId && assignment.userId !== where.userId.not).length;
      },
      async upsert({ where, create, update }: {
        where: { userId_accountType: { userId: string; accountType: AccountType } };
        create: Assignment;
        update: { financialAccountId: string; createdById: string };
      }) {
        writes.push(`upsert:${create.accountType}`);
        const existing = assignments.find((assignment) => assignment.userId === where.userId_accountType.userId && assignment.accountType === where.userId_accountType.accountType);
        if (existing) {
          Object.assign(existing, update);
          return existing;
        }
        assignments.push(create);
        return create;
      },
      async deleteMany({ where }: { where: { userId: string; accountType: { in: AccountType[] } } }) {
        writes.push(`delete:${where.accountType.in.join(",")}`);
        let count = 0;
        for (let index = assignments.length - 1; index >= 0; index--) {
          if (assignments[index].userId === where.userId && where.accountType.in.includes(assignments[index].accountType)) {
            assignments.splice(index, 1);
            count++;
          }
        }
        return { count };
      },
    },
  };
  return {
    tx: tx as unknown as Prisma.TransactionClient,
    accounts, user, assignments, writes, reads,
    get transactions() { return transactions; },
    startTransaction() { transactions++; },
  };
}

let db = fixture();
// Inject a database double before importing the backend, avoiding a live database.
const globals = globalThis as unknown as { prisma?: unknown };
const previousPrisma = globals.prisma;
globals.prisma = {
  async $transaction(operation: (tx: Prisma.TransactionClient) => Promise<unknown>, options: { isolationLevel: string }) {
    assert.equal(options.isolationLevel, "Serializable");
    db.startTransaction();
    return operation(db.tx);
  },
};
const { assignTellerAccounts } = await import("../../lib/finance/accounts");
globals.prisma = previousPrisma;

const owner: FinanceActor = { id: "owner", role: "OWNER", active: true };
const both = { userId: "teller", bankAccountId: "bank", cashAccountId: "cash" };

for (const selectedType of ["BANK", "CASH"] as const) {
  for (const empty of [undefined, "", "   "]) {
    test(`${selectedType}-only replacement removes the ${String(empty)} other type`, async () => {
      db = fixture();
      const others = structuredClone(db.assignments.filter((assignment) => assignment.userId === "other"));
      const result = await assignTellerAccounts(owner, {
        userId: "teller",
        ...(selectedType === "BANK" ? { bankAccountId: " bank ", cashAccountId: empty } : { bankAccountId: empty, cashAccountId: " cash " }),
      });
      assert.equal(db.transactions, 1);
      assert.deepEqual(result.map((assignment) => assignment.accountType), [selectedType]);
      assert.deepEqual(db.assignments.filter((assignment) => assignment.userId === "teller"), [{
        userId: "teller", accountType: selectedType, financialAccountId: selectedType.toLowerCase(), createdById: owner.id,
      }]);
      assert.deepEqual(db.assignments.filter((assignment) => assignment.userId === "other"), others);
      assert.deepEqual(db.writes, [`upsert:${selectedType}`, `delete:${selectedType === "BANK" ? "CASH" : "BANK"}`]);
      assert.deepEqual(db.reads, ["user", selectedType.toLowerCase(), `count:${selectedType.toLowerCase()}`]);
    });
  }
}

test("both accounts replace old assignments and validate both before writing", async () => {
  db = fixture();
  const result = await assignTellerAccounts(owner, both);
  assert.deepEqual(result.map((assignment) => assignment.financialAccountId), ["bank", "cash"]);
  assert.ok(result.every((assignment) => assignment.createdById === owner.id));
  assert.deepEqual(db.writes, ["upsert:BANK", "upsert:CASH"]);
  assert.deepEqual(db.reads, ["user", "bank", "count:bank", "cash", "count:cash"]);
  assert.equal(db.assignments.filter((assignment) => assignment.userId === "teller").length, 2);
});

test("upserts create assignments when the teller has none", async () => {
  db = fixture();
  db.assignments.splice(0, 2);
  const result = await assignTellerAccounts(owner, both);
  assert.equal(result.length, 2);
  assert.equal(db.assignments.filter((assignment) => assignment.userId === "teller").length, 2);
});

test("at least one nonempty account is required without writes", async () => {
  for (const bankAccountId of [undefined, "", " "]) {
    for (const cashAccountId of [undefined, "", " "]) {
      db = fixture();
      const before = structuredClone(db.assignments);
      await assert.rejects(assignTellerAccounts(owner, { userId: "teller", bankAccountId, cashAccountId }), /At least one account/);
      assert.deepEqual(db.writes, []);
      assert.deepEqual(db.assignments, before);
    }
  }
});

for (const accountType of ["BANK", "CASH"] as const) {
  test(`${accountType} capacity rejects both and single replacements without any writes`, async () => {
    for (const single of [false, true]) {
      db = fixture();
      for (const userId of ["staff-1", "staff-2"]) {
        db.assignments.push({ userId, accountType, financialAccountId: accountType.toLowerCase(), createdById: owner.id });
      }
      const before = structuredClone(db.assignments);
      await assert.rejects(assignTellerAccounts(owner, single
        ? { userId: "teller", ...(accountType === "BANK" ? { bankAccountId: "bank" } : { cashAccountId: "cash" }) }
        : both), { code: "CONFLICT" });
      assert.deepEqual(db.writes, []);
      assert.deepEqual(db.assignments, before);
    }
  });

  test(`${accountType} capacity excludes the same teller and permits a second staff member`, async () => {
    db = fixture();
    db.assignments.find((assignment) => assignment.userId === "teller" && assignment.accountType === accountType)!.financialAccountId = accountType.toLowerCase();
    db.assignments.push({ userId: "staff-1", accountType, financialAccountId: accountType.toLowerCase(), createdById: owner.id });
    await assignTellerAccounts(owner, both);
    assert.equal(db.assignments.filter((assignment) => assignment.financialAccountId === accountType.toLowerCase()).length, 2);
  });

  test(`${accountType} rejects main, inactive, wrong-type and missing accounts without writes`, async () => {
    for (const invalid of [`main-${accountType.toLowerCase()}`, `inactive-${accountType.toLowerCase()}`, accountType === "BANK" ? "cash" : "bank", "missing"]) {
      db = fixture();
      const before = structuredClone(db.assignments);
      await assert.rejects(assignTellerAccounts(owner, { ...both, [accountType === "BANK" ? "bankAccountId" : "cashAccountId"]: invalid }), /Assignable .* child not found/);
      assert.deepEqual(db.writes, []);
      assert.deepEqual(db.assignments, before);
    }
  });
}

test("target must be an existing active teller", async () => {
  for (const invalid of ["missing", "inactive", "owner"]) {
    db = fixture();
    if (invalid === "inactive") db.user.active = false;
    if (invalid === "owner") db.user.role = "OWNER";
    const before = structuredClone(db.assignments);
    await assert.rejects(assignTellerAccounts(owner, { ...both, userId: invalid === "missing" ? "missing" : "teller" }), { code: "NOT_FOUND" });
    assert.deepEqual(db.writes, []);
    assert.deepEqual(db.assignments, before);
  }
});

test("only an active owner may manage assignments", async () => {
  for (const actor of [{ ...owner, active: false }, { id: "teller", role: "TELLER" as const, active: true }, { id: "teller", role: "TELLER" as const, active: false }]) {
    db = fixture();
    await assert.rejects(assignTellerAccounts(actor, both), { code: "FORBIDDEN" });
    assert.equal(db.transactions, 0);
    assert.deepEqual(db.reads, []);
    assert.deepEqual(db.writes, []);
  }
});

test("initial assignments can share the user-creation transaction", async () => {
  db = fixture();
  const result = await assignTellerAccounts(owner, both, db.tx);
  assert.equal(db.transactions, 0, "Must not open a separate transaction during teller creation");
  assert.equal(result.length, 2);
  assert.deepEqual(db.writes, ["upsert:BANK", "upsert:CASH"]);
});

test("initial assignments reject full accounts before assignment writes", async () => {
  db = fixture();
  db.assignments.push(
    { userId: "staff-1", accountType: "BANK", financialAccountId: "bank", createdById: owner.id },
    { userId: "staff-2", accountType: "BANK", financialAccountId: "bank", createdById: owner.id },
  );
  await assert.rejects(assignTellerAccounts(owner, both, db.tx), { code: "CONFLICT" });
  assert.equal(db.transactions, 0);
  assert.deepEqual(db.writes, []);
});
