import { FinanceError, financeInvariant } from "./errors";
import type { FinanceActor } from "./types";

export function assertActiveActor(actor: FinanceActor): void {
  financeInvariant(actor.active, "Inactive staff cannot access finance", "FORBIDDEN");
}

export function assertOwner(actor: FinanceActor): void {
  assertActiveActor(actor);
  if (actor.role !== "OWNER") {
    throw new FinanceError("Owner permission required", "FORBIDDEN");
  }
}

export function assertCanCreateCashTransaction(actor: FinanceActor): void {
  assertActiveActor(actor);
  financeInvariant(
    actor.role === "OWNER" || actor.role === "TELLER",
    "Cash transaction permission required",
    "FORBIDDEN",
  );
}

export const assertCanManageAccounts = assertOwner;
export const assertCanManageStaffAssignments = assertOwner;
export const assertCanCreateInternalTransfer = assertOwner;
export const assertCanCreateCapitalTransaction = assertOwner;
export const assertCanEditTransaction = assertOwner;
export const assertCanDeleteTransaction = assertOwner;
export const assertCanViewSummary = assertOwner;
