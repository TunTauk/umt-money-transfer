import assert from "node:assert/strict";
import test from "node:test";

import type { FinanceActor } from "../../lib/finance/types";

const owner: FinanceActor = { id: "owner", role: "OWNER", active: true };
let users: FinanceActor[];
let writes: string[];
let deleteError: string | undefined;
const globals = globalThis as unknown as { prisma?: unknown };
const previous = globals.prisma;
globals.prisma = {
  async $transaction(operation: (tx: unknown) => Promise<unknown>, options: { isolationLevel: string }) {
    assert.equal(options.isolationLevel, "Serializable");
    return operation({
      user: {
        async findUnique({ where }: { where: { id: string } }) { return users.find((user) => user.id === where.id) ?? null; },
        async update({ where, data }: { where: { id: string }; data: { active: boolean } }) {
          writes.push(`active:${where.id}:${data.active}`);
          return Object.assign(users.find((user) => user.id === where.id)!, data);
        },
        async delete({ where }: { where: { id: string } }) {
          if (deleteError) throw { code: deleteError };
          writes.push(`delete:${where.id}`);
          const target = users.find((user) => user.id === where.id);
          users = users.filter((user) => user.id !== where.id);
          return target;
        },
      },
      authSession: {
        async deleteMany({ where }: { where: { userId: string } }) { writes.push(`sessions:${where.userId}`); },
      },
    });
  },
};
const { manageOtherOwner } = await import("../../lib/finance/owners");
globals.prisma = previous;

function reset() {
  users = [{ ...owner }, { ...owner, id: "other" }];
  writes = [];
  deleteError = undefined;
}

test("deactivating another owner revokes their sessions", async () => {
  reset();
  await manageOtherOwner(owner, "other", "deactivate");
  assert.deepEqual(writes, ["active:other:false", "sessions:other"]);
  assert.equal(users.find((user) => user.id === "other")!.active, false);
});

test("an owner can reactivate another owner", async () => {
  reset();
  users[1].active = false;
  await manageOtherOwner(owner, "other", "activate");
  assert.deepEqual(writes, ["active:other:true"]);
});

test("an owner can delete another owner", async () => {
  reset();
  await manageOtherOwner(owner, "other", "delete");
  assert.deepEqual(users, [owner]);
  assert.deepEqual(writes, ["delete:other"]);
});

for (const operation of ["deactivate", "delete"] as const) {
  test(`an owner cannot ${operation} themselves`, async () => {
    reset();
    await assert.rejects(manageOtherOwner(owner, owner.id, operation), { code: "FORBIDDEN" });
    assert.deepEqual(writes, []);
  });
}

test("tellers and inactive owners cannot manage owners", async () => {
  for (const actor of [{ ...owner, role: "TELLER" as const }, { ...owner, active: false }]) {
    reset();
    await assert.rejects(manageOtherOwner(actor, "other", "delete"), { code: "FORBIDDEN" });
    assert.deepEqual(writes, []);
  }
});

test("stale actor access is rechecked in the transaction", async () => {
  for (const change of [{ active: false }, { role: "TELLER" as const }]) {
    reset();
    Object.assign(users[0], change);
    await assert.rejects(manageOtherOwner(owner, "other", "delete"), { code: "FORBIDDEN" });
    assert.deepEqual(writes, []);
  }
});

test("targets must be existing owners", async () => {
  for (const target of ["missing", "other"]) {
    reset();
    users[1].role = "TELLER";
    await assert.rejects(manageOtherOwner(owner, target, "deactivate"), { code: "NOT_FOUND" });
    assert.deepEqual(writes, []);
  }
});

test("financial references block deletion with a useful error", async () => {
  reset();
  deleteError = "P2003";
  await assert.rejects(manageOtherOwner(owner, "other", "delete"), /Deactivate the account instead/);
  assert.equal(users.length, 2);
  assert.deepEqual(writes, []);
});

test("concurrent changes return a retryable error", async () => {
  reset();
  deleteError = "P2034";
  await assert.rejects(manageOtherOwner(owner, "other", "delete"), /Refresh and try again/);
});
