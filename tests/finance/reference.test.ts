import assert from "node:assert/strict";
import test from "node:test";

import { generateSystemReference } from "../../lib/finance/reference";

test("system references are dated, unique, and distinct from compact references", () => {
  const now = new Date("2026-09-26T12:00:00.000Z");
  const first = generateSystemReference(now);
  const second = generateSystemReference(now);

  assert.match(first, /^SYS-20260926-[0-9A-F]{12}$/);
  assert.notEqual(first, second);
  assert.notEqual(first, "CI-000123");
});
