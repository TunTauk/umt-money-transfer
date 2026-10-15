import { financeInvariant } from "./errors";

export function normalizeCustomerPhone(value: string | null | undefined): string {
  const phone = value?.trim() ?? "";
  financeInvariant(phone.length > 0, "customerPhone is required");
  const message = "Customer phone must be a complete Myanmar mobile number (09..., +959...).";
  financeInvariant(/^\+?[0-9\s()-]+$/.test(phone), message);
  const normalized = phone.replace(/[\s()-]/g, "").replace(/^(?:\+959|00959|959)/, "09");
  financeInvariant(/^09[0-9]{7,9}$/.test(normalized), message);
  return normalized;
}
