import assert from "node:assert/strict";
import test from "node:test";

import { formatMyanmarDateTimeLocal, parseMyanmarDateTime } from "../../lib/finance/datetime";
import { normalizeCustomerPhone } from "../../lib/finance/phone";

test("Myanmar datetime-local values use UTC+06:30 while explicit offsets are preserved", () => {
  assert.equal(parseMyanmarDateTime("2026-09-25T12:00").toISOString(), "2026-09-25T05:30:00.000Z");
  assert.equal(parseMyanmarDateTime("2026-09-25T12:00:00Z").toISOString(), "2026-09-25T12:00:00.000Z");
  assert.equal(parseMyanmarDateTime("2026-09-25T12:00:00+06:30").toISOString(), "2026-09-25T05:30:00.000Z");
  assert.equal(formatMyanmarDateTimeLocal(new Date("2026-09-25T05:30:00.000Z")), "2026-09-25T12:00");
});

test("customer phone normalization stores searchable Myanmar digits", () => {
  for (const subscriber of ["1234567", "12345678", "123456789", "0000000"]) {
    for (const prefix of ["09", "+959", "959", "00959"]) {
      assert.equal(normalizeCustomerPhone(`${prefix}${subscriber}`), `09${subscriber}`);
    }
  }
  for (const phone of [
    "+95 9 123-456-789",
    "09 123 456 789",
    "  (09) 123-456-789  ",
    "+95 (9) 123-456-789",
    "0095 (9) 123-456-789",
    "95 (9) 123-456-789",
    "09\t123\n456 789",
  ]) {
    assert.equal(normalizeCustomerPhone(phone), "09123456789", phone);
  }
});

test("customer phone normalization preserves the required empty error", () => {
  for (const phone of [undefined, null, "", " \t\n "]) {
    assert.throws(() => normalizeCustomerPhone(phone), /customerPhone is required/);
  }
});

test("customer phone normalization rejects incomplete or malformed mobile numbers", () => {
  for (const phone of [
    "09",
    "09abccd",
    "09123456789abc",
    "abc09123456789",
    "09123456",
    "091234567890",
    "+959",
    "959",
    "00959",
    "+959123456",
    "9591234567890",
    "009591234567890",
    "08123456789",
    "123456789",
    "+96123456789",
    "00968123456789",
    "+09123456789",
    "09+123456789",
    "++959123456789",
    "(+959)123456789",
    "09123456789+",
    "09.123456789",
    "09/123456789",
    "09_123456789",
    "09#123456789",
    "()-",
  ]) {
    assert.throws(
      () => normalizeCustomerPhone(phone),
      { name: "FinanceError", message: "Customer phone must be a complete Myanmar mobile number (09..., +959...).", code: "INVALID_INPUT" },
      phone,
    );
  }
});
