import assert from "node:assert/strict";
import test from "node:test";

import {
  assertCashAccountSelection,
  assertValidChildParent,
} from "../../lib/finance/account-rules";

test("hierarchy requires matching type but not matching provider", () => {
  assert.doesNotThrow(() => assertValidChildParent("BANK", {
    type: "BANK",
    kind: "MAIN",
    active: true,
    providerId: null,
    parentId: null,
    mainSlot: "BANK",
  }));
  assert.throws(() => assertValidChildParent("CASH", {
    type: "BANK",
    kind: "CHILD",
    active: true,
    providerId: "bank-provider",
    parentId: "main",
    mainSlot: null,
  }), /types must match/);
});

test("children can only be attached directly to the matching global main", () => {
  const base = { type: "BANK" as const, kind: "MAIN" as const, active: true, providerId: null, parentId: null, mainSlot: "BANK" as const };
  assert.throws(() => assertValidChildParent("BANK", { ...base, kind: "CHILD" }), /global main/);
  assert.throws(() => assertValidChildParent("BANK", { ...base, parentId: "other" }), /cannot have a parent/);
  assert.throws(() => assertValidChildParent("BANK", { ...base, providerId: "provider" }), /cannot have a provider/);
  assert.throws(() => assertValidChildParent("BANK", { ...base, mainSlot: "CASH" }), /main slot/);
});

test("cash selections require active matching children for owners and tellers", () => {
  const mainBank = { type: "BANK" as const, kind: "MAIN" as const, active: true, providerId: null, parentId: null, mainSlot: "BANK" as const };
  const childBank = { type: "BANK" as const, kind: "CHILD" as const, active: true, providerId: "provider", parentId: "main", mainSlot: null };

  assert.throws(() => assertCashAccountSelection("OWNER", "BANK", mainBank), /must be a child account/);
  assert.doesNotThrow(() => assertCashAccountSelection("OWNER", "BANK", childBank));
  assert.doesNotThrow(() => assertCashAccountSelection("TELLER", "BANK", childBank));
  assert.throws(
    () => assertCashAccountSelection("TELLER", "BANK", mainBank),
    /must be a child account/,
  );
  assert.throws(
    () => assertCashAccountSelection("OWNER", "CASH", childBank),
    /active cash account not found/i,
  );
  assert.throws(
    () => assertCashAccountSelection("OWNER", "BANK", { ...childBank, active: false }),
    /active bank account not found/i,
  );
  for (const role of ["OWNER", "TELLER"] as const) {
    assert.doesNotThrow(() => assertCashAccountSelection(role, "CASH", { ...childBank, type: "CASH" }));
    assert.throws(() => assertCashAccountSelection(role, "BANK", null), /not found/i);
    assert.throws(() => assertCashAccountSelection(role, "BANK", { ...childBank, active: false }), /not found/i);
  }
});
