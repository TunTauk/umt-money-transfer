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

test("Deducted Cash In credits the selected account with amount only and earns the fee", () => {
  const plan = planCashTransaction({
    type: "CASH_IN",
    accountId: "selected",
    amount: "100",
    feeAmount: "2",
    feeMode: "DEDUCTED",
  });

  assert.deepEqual(plan.entries, [
    { systemAccount: "CUSTOMER_CLEARING", side: "DEBIT", amount: 102n, memo: "Customer funds received" },
    { financialAccountId: "selected", side: "CREDIT", amount: 100n, memo: "Cash In settled" },
    { systemAccount: "FEE_INCOME", side: "CREDIT", amount: 2n, memo: "Fee earned" },
  ]);
  assert.doesNotThrow(() => assertBalanced(plan.entries));
});

test("Deducted Cash Out debits the selected account with amount plus fee and earns the fee", () => {
  const plan = planCashTransaction({
    type: "CASH_OUT",
    accountId: "selected",
    amount: 100n,
    feeAmount: 2n,
    feeMode: "DEDUCTED",
  });

  assert.deepEqual(plan.entries, [
    { financialAccountId: "selected", side: "DEBIT", amount: 102n, memo: "Cash Out settled" },
    { systemAccount: "CUSTOMER_CLEARING", side: "CREDIT", amount: 100n, memo: "Customer funds paid" },
    { systemAccount: "FEE_INCOME", side: "CREDIT", amount: 2n, memo: "Fee earned" },
  ]);
  assert.doesNotThrow(() => assertBalanced(plan.entries));
});

test("Deducted mode ignores any submitted fee account", () => {
  const plan = planCashTransaction({
    type: "CASH_IN",
    accountId: "selected",
    amount: 100n,
    feeAmount: 2n,
    feeMode: "DEDUCTED",
    feeAccountId: "fee-account",
  });

  assert.ok(plan.entries.every((entry) => entry.financialAccountId !== "fee-account"));
});

test("Deducted Cash Out allows a fee greater than amount", () => {
  const plan = planCashTransaction({
    type: "CASH_OUT",
    accountId: "selected",
    amount: 100n,
    feeAmount: 150n,
    feeMode: "DEDUCTED",
  });

  assert.deepEqual(plan.entries, [
    { financialAccountId: "selected", side: "DEBIT", amount: 250n, memo: "Cash Out settled" },
    { systemAccount: "CUSTOMER_CLEARING", side: "CREDIT", amount: 100n, memo: "Customer funds paid" },
    { systemAccount: "FEE_INCOME", side: "CREDIT", amount: 150n, memo: "Fee earned" },
  ]);
  assert.doesNotThrow(() => assertBalanced(plan.entries));
});

test("Separate Cash In moves only the amount through the selected account and the fee through the fee account", () => {
  const plan = planCashTransaction({
    type: "CASH_IN",
    accountId: "selected",
    amount: 100n,
    feeAmount: 2n,
    feeMode: "SEPARATE",
    feeAccountId: "fee-account",
  });

  assert.deepEqual(plan.entries, [
    { systemAccount: "CUSTOMER_CLEARING", side: "DEBIT", amount: 100n, memo: "Customer funds received" },
    { financialAccountId: "selected", side: "CREDIT", amount: 100n, memo: "Cash In settled" },
    { financialAccountId: "fee-account", side: "DEBIT", amount: 2n, memo: "Cash In fee received" },
    { systemAccount: "FEE_INCOME", side: "CREDIT", amount: 2n, memo: "Fee earned" },
  ]);
  assert.doesNotThrow(() => assertBalanced(plan.entries));
});

test("Separate Cash Out moves only the amount through the selected account and the fee through the fee account", () => {
  const plan = planCashTransaction({
    type: "CASH_OUT",
    accountId: "selected",
    amount: 100n,
    feeAmount: 2n,
    feeMode: "SEPARATE",
    feeAccountId: "fee-account",
  });

  assert.deepEqual(plan.entries, [
    { financialAccountId: "selected", side: "DEBIT", amount: 100n, memo: "Cash Out settled" },
    { systemAccount: "CUSTOMER_CLEARING", side: "CREDIT", amount: 100n, memo: "Customer funds paid" },
    { financialAccountId: "fee-account", side: "DEBIT", amount: 2n, memo: "Cash Out fee received" },
    { systemAccount: "FEE_INCOME", side: "CREDIT", amount: 2n, memo: "Fee earned" },
  ]);
  assert.doesNotThrow(() => assertBalanced(plan.entries));
});

test("Separate mode with a zero fee behaves like a plain move", () => {
  const cashIn = planCashTransaction({
    type: "CASH_IN",
    accountId: "selected",
    amount: 100n,
    feeAmount: 0n,
    feeMode: "SEPARATE",
  });
  const cashOut = planCashTransaction({
    type: "CASH_OUT",
    accountId: "selected",
    amount: 100n,
    feeAmount: 0n,
    feeMode: "SEPARATE",
  });

  assert.deepEqual(cashIn.entries, [
    { systemAccount: "CUSTOMER_CLEARING", side: "DEBIT", amount: 100n, memo: "Customer funds received" },
    { financialAccountId: "selected", side: "CREDIT", amount: 100n, memo: "Cash In settled" },
  ]);
  assert.deepEqual(cashOut.entries, [
    { financialAccountId: "selected", side: "DEBIT", amount: 100n, memo: "Cash Out settled" },
    { systemAccount: "CUSTOMER_CLEARING", side: "CREDIT", amount: 100n, memo: "Customer funds paid" },
  ]);
});

test("Separate mode with a positive fee requires a non-empty fee account", () => {
  assert.throws(
    () => planCashTransaction({
      type: "CASH_IN",
      accountId: "selected",
      amount: 100n,
      feeAmount: 2n,
      feeMode: "SEPARATE",
    }),
    /Separate fee requires a fee account/,
  );
  assert.throws(
    () => planCashTransaction({
      type: "CASH_OUT",
      accountId: "selected",
      amount: 100n,
      feeAmount: 2n,
      feeMode: "SEPARATE",
      feeAccountId: "",
    }),
    /Separate fee requires a fee account/,
  );
  assert.throws(
    () => planCashTransaction({
      type: "CASH_IN",
      accountId: "selected",
      amount: 100n,
      feeAmount: 2n,
      feeMode: "SEPARATE",
      feeAccountId: null,
    }),
    /Separate fee requires a fee account/,
  );
});

test("cash transactions require a positive amount and nonnegative fee", () => {
  assert.throws(
    () => planCashTransaction({
      type: "CASH_IN",
      accountId: "selected",
      amount: 0n,
      feeAmount: 0n,
      feeMode: "DEDUCTED",
    }),
    /greater than zero/,
  );
  assert.throws(
    () => planCashTransaction({
      type: "CASH_IN",
      accountId: "selected",
      amount: 100n,
      feeAmount: -1n,
      feeMode: "SEPARATE",
      feeAccountId: "fee-account",
    }),
    /cannot be negative/,
  );
});

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

  assert.doesNotThrow(() => assertBalanced(transfer.entries));
  assert.doesNotThrow(() => assertBalanced(capital.entries));
  assert.doesNotThrow(() => assertBalanced(reversal));
  assert.equal(reversal[0].side, "CREDIT");
  assert.equal(reversal[1].side, "DEBIT");
});
