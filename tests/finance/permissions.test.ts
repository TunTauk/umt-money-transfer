import assert from "node:assert/strict";
import test from "node:test";

import {
  assertCanCreateCashTransaction,
  assertCanCreateCapitalTransaction,
  assertCanDeleteTransaction,
  assertCanViewSummary,
} from "../../lib/finance/permissions";

const owner = { id: "owner", role: "OWNER" as const, active: true };
const teller = { id: "teller", role: "TELLER" as const, active: true };

test("owners can perform owner-only operations", () => {
  assert.doesNotThrow(() => assertCanCreateCapitalTransaction(owner));
  assert.doesNotThrow(() => assertCanDeleteTransaction(owner));
  assert.doesNotThrow(() => assertCanViewSummary(owner));
});

test("tellers can create cash transactions but cannot mutate or view summaries", () => {
  assert.doesNotThrow(() => assertCanCreateCashTransaction(teller));
  assert.throws(() => assertCanDeleteTransaction(teller), /Owner permission required/);
  assert.throws(() => assertCanViewSummary(teller), /Owner permission required/);
});

test("inactive staff cannot use finance permissions", () => {
  assert.throws(
    () => assertCanCreateCashTransaction({ ...teller, active: false }),
    /Inactive staff/,
  );
});
