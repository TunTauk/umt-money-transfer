import assert from "node:assert/strict";
import test from "node:test";

import {
  assertBalanced,
  planCapitalTransaction,
  planCashTransaction,
  planInternalTransfer,
  reverseLedgerPlan,
  toMmk,
} from "../../lib/finance/ledger-plan";
import type { CashTransactionInput } from "../../lib/finance/types";

for (const type of ["CASH_IN", "CASH_OUT"] as const) {
  const base = { type, receivingAccountId: "receiving", payingAccountId: "paying", amount: "100", feeAmount: "2", feeMode: "DEDUCTED" as const };

  test(`${type} deducted receives amount plus fee and pays amount`, () => {
    const plan = planCashTransaction({ ...base, feeAccountId: "ignored" });
    assert.equal(plan.amount, 100n);
    assert.equal(plan.feeAmount, 2n);
    assert.deepEqual(plan.entries, [
      { financialAccountId: "receiving", side: "DEBIT", amount: 102n, memo: "Customer funds received" },
      { financialAccountId: "paying", side: "CREDIT", amount: 100n, memo: "Customer funds paid" },
      { systemAccount: "FEE_INCOME", side: "CREDIT", amount: 2n, memo: "Fee earned" },
    ]);
    assertBalanced(plan.entries);
  });

  test(`${type} separate receives and pays amount, receiving the fee independently`, () => {
    const plan = planCashTransaction({ ...base, feeMode: "SEPARATE", feeAccountId: "fee" });
    assert.deepEqual(plan.entries, [
      { financialAccountId: "receiving", side: "DEBIT", amount: 100n, memo: "Customer funds received" },
      { financialAccountId: "paying", side: "CREDIT", amount: 100n, memo: "Customer funds paid" },
      { financialAccountId: "fee", side: "DEBIT", amount: 2n, memo: "Fee received separately" },
      { systemAccount: "FEE_INCOME", side: "CREDIT", amount: 2n, memo: "Fee earned" },
    ]);
    assertBalanced(plan.entries);
  });

  for (const feeMode of ["DEDUCTED", "SEPARATE"] as const) {
    test(`${type} ${feeMode} zero fee needs no fee account or income entry`, () => {
      const plan = planCashTransaction({ ...base, feeMode, feeAmount: 0n });
      assert.deepEqual(plan.entries, [
        { financialAccountId: "receiving", side: "DEBIT", amount: 100n, memo: "Customer funds received" },
        { financialAccountId: "paying", side: "CREDIT", amount: 100n, memo: "Customer funds paid" },
      ]);
    });

    test(`${type} ${feeMode} permits fee greater than amount`, () => {
      const plan = planCashTransaction({ ...base, feeMode, feeAmount: 150n, feeAccountId: "fee" });
      assert.equal(plan.entries[0].amount, feeMode === "DEDUCTED" ? 250n : 100n);
      assert.equal(plan.entries[1].amount, 100n);
      assert.equal(plan.entries.at(-1)?.amount, 150n);
      assertBalanced(plan.entries);
    });

    test(`${type} ${feeMode} permits the same child for receiving, paying, and fee`, () => {
      const plan = planCashTransaction({ ...base, feeMode, receivingAccountId: "same", payingAccountId: "same", feeAccountId: "same" });
      assert.ok(plan.entries.filter((entry) => entry.financialAccountId).every((entry) => entry.financialAccountId === "same"));
      const net = plan.entries.reduce((sum, entry) => sum + (entry.financialAccountId ? (entry.side === "DEBIT" ? entry.amount : -entry.amount) : 0n), 0n);
      assert.equal(net, 2n);
      assertBalanced(plan.entries);
    });

    test(`${type} ${feeMode} reversal cancels each original entry`, () => {
      const plan = planCashTransaction({ ...base, feeMode, feeAccountId: "fee" });
      const reversal = reverseLedgerPlan(plan.entries);
      assertBalanced(reversal);
      for (const [index, original] of plan.entries.entries()) {
        assert.deepEqual(reversal[index], {
          ...original,
          side: original.side === "DEBIT" ? "CREDIT" : "DEBIT",
          memo: `Reversal: ${original.memo}`,
        });
      }
    });
  }

  test(`${type} validates required accounts, amount, fee, type, and mode`, () => {
    for (const field of ["receivingAccountId", "payingAccountId"] as const) {
      for (const value of ["", " ", undefined]) {
        assert.throws(() => planCashTransaction({ ...base, [field]: value } as CashTransactionInput), /is required/);
      }
    }
    for (const feeAccountId of [undefined, null, "", " "]) {
      assert.throws(() => planCashTransaction({ ...base, feeMode: "SEPARATE", feeAccountId }), /Separate fee requires a fee account/);
    }
    for (const amount of [0n, -1n, "1.5", 1.5, Number.MAX_SAFE_INTEGER + 1]) {
      assert.throws(() => planCashTransaction({ ...base, amount }));
    }
    for (const feeAmount of [-1n, "-1", "0.5", 0.5, Number.MAX_SAFE_INTEGER + 1]) {
      assert.throws(() => planCashTransaction({ ...base, feeAmount }));
    }
    assert.throws(() => planCashTransaction({ ...base, type: "INVALID" } as unknown as CashTransactionInput), /Invalid cash transaction type/);
    assert.throws(() => planCashTransaction({ ...base, feeMode: "INVALID" } as unknown as CashTransactionInput), /Invalid fee mode/);
  });
}

test("MMK accepts only positive exact integers", () => {
  assert.equal(toMmk("9007199254740993"), 9007199254740993n);
  assert.throws(() => toMmk(1.5), /safe integer/);
  assert.throws(() => toMmk(Number.MAX_SAFE_INTEGER + 1), /safe integer/);
  assert.throws(() => toMmk("1.00"), /integer MMK/);
  assert.throws(() => toMmk(0n), /greater than zero/);
});

test("internal transfer, capital, and reversal plans remain balanced", () => {
  const transfer = planInternalTransfer({ sourceAccountId: "main", destinationAccountId: "child", amount: 500n });
  const capital = planCapitalTransaction({ type: "CAPITAL_DEPOSIT", mainAccountId: "main", amount: 1000n });
  const reversal = reverseLedgerPlan(capital.entries);
  assertBalanced(transfer.entries);
  assertBalanced(capital.entries);
  assertBalanced(reversal);
  assert.equal(reversal[0].side, "CREDIT");
  assert.equal(reversal[1].side, "DEBIT");
  assert.throws(() => planInternalTransfer({ sourceAccountId: "same", destinationAccountId: "same", amount: 1n }), /must differ/);
});
