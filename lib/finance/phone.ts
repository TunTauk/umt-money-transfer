import { financeInvariant } from "./errors";

export function normalizeCustomerPhone(value: string | null | undefined): string {
  const digits = value?.replace(/\D/g, "") ?? "";
  financeInvariant(digits.length > 0, "customerPhone is required");
  if (digits.startsWith("00959")) return `09${digits.slice(5)}`;
  if (digits.startsWith("959")) return `09${digits.slice(3)}`;
  return digits;
}
