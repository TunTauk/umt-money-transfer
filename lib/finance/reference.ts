import { randomUUID } from "node:crypto";

export function generateSystemReference(now = new Date()): string {
  const date = now.toISOString().slice(0, 10).replaceAll("-", "");
  const fragment = randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase();
  return `SYS-${date}-${fragment}`;
}
