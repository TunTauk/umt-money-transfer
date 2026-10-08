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
  assert.equal(normalizeCustomerPhone("+95 9 123-456-789"), "09123456789");
  assert.equal(normalizeCustomerPhone("09 123 456 789"), "09123456789");
  assert.throws(() => normalizeCustomerPhone(""), /customerPhone is required/);
});
