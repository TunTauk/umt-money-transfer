import assert from "node:assert/strict";
import test from "node:test";

const globals = globalThis as unknown as { prisma?: unknown };
const previousPrisma = globals.prisma;
let assignedIds = ["old-bank", "old-cash"];
const reads: string[] = [];
globals.prisma = {
  staffAccountAssignment: {
    async findMany({ where }: { where: { userId: string } }) {
      reads.push(where.userId);
      return assignedIds.map((financialAccountId) => ({ financialAccountId }));
    },
  },
};
const { financialTransactionVisibilityWhere } = await import("../../lib/finance/access");
globals.prisma = previousPrisma;

test("reassignment changes account history visibility on the next request", async () => {
  const actor = { id: "teller", role: "TELLER" as const, active: true };
  assignedIds = ["old-bank", "old-cash"];
  const before = JSON.stringify(await financialTransactionVisibilityWhere(actor));
  assert.ok(before.includes("old-bank"));
  assignedIds = ["new-bank"];
  const after = JSON.stringify(await financialTransactionVisibilityWhere(actor));
  assert.ok(after.includes("new-bank"));
  assert.ok(!after.includes("old-bank"));
  assert.ok(!after.includes("old-cash"));
  assert.deepEqual(reads, ["teller", "teller"]);
});

test("owners retain global history access regardless of assignments", async () => {
  assert.deepEqual(await financialTransactionVisibilityWhere({ id: "owner", role: "OWNER", active: true }), {});
});
