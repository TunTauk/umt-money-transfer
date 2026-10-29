import assert from "node:assert/strict";
import test from "node:test";

import { feeCollectionAccountId } from "../../lib/finance/fee-collection";
import { planCashTransaction } from "../../lib/finance/ledger-plan";

for (const type of ["CASH_IN", "CASH_OUT"] as const) {
  const receivingAccountId = type === "CASH_IN" ? "cash" : "bank";
  const payingAccountId = type === "CASH_IN" ? "bank" : "cash";
  for (const collection of ["CASH", "ACCOUNT"] as const) {
    test(`${type} fee accepted with ${collection} increases the selected account once`, () => {
      const feeAccountId = feeCollectionAccountId(type, collection, receivingAccountId, payingAccountId);
      assert.equal(feeAccountId, collection === "CASH" ? "cash" : "bank");
      const plan = planCashTransaction({ type, receivingAccountId, payingAccountId, amount: "100", feeAmount: "5", feeMode: "SEPARATE", feeAccountId });
      const accountNet = (id: string) => plan.entries.filter((entry) => entry.financialAccountId === id)
        .reduce((net, entry) => net + (entry.side === "DEBIT" ? entry.amount : -entry.amount), 0n);
      assert.equal(accountNet(receivingAccountId), 100n + (feeAccountId === receivingAccountId ? 5n : 0n));
      assert.equal(accountNet(payingAccountId), -100n + (feeAccountId === payingAccountId ? 5n : 0n));
      assert.equal(plan.entries.filter((entry) => entry.systemAccount === "FEE_INCOME").reduce((sum, entry) => sum + entry.amount, 0n), 5n);
      assert.equal(plan.entries.reduce((net, entry) => net + (entry.side === "DEBIT" ? entry.amount : -entry.amount), 0n), 0n);
    });
  }
}

test("unsupported and missing fee methods are rejected", () => {
  for (const method of ["", "DEDUCTED", "SEPARATE", "invalid"]) {
    assert.throws(() => feeCollectionAccountId("CASH_IN", method, "cash", "bank"), /Choose how to accept the fee/);
  }
});

test("zero fee adds no fee posting", () => {
  const plan = planCashTransaction({ type: "CASH_OUT", receivingAccountId: "bank", payingAccountId: "cash", amount: "100", feeAmount: "0", feeMode: "SEPARATE", feeAccountId: "cash" });
  assert.equal(plan.entries.length, 2);
});
