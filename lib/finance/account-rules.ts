import { financeInvariant } from "./errors";
import type { AccountType, FinanceActor } from "./types";

interface AccountRuleInput {
  type: AccountType;
  kind: "MAIN" | "CHILD";
  active: boolean;
  providerId: string | null;
  parentId: string | null;
  mainSlot: AccountType | null;
}

export function assertValidChildParent(
  childType: AccountType,
  parent: AccountRuleInput,
): void {
  financeInvariant(parent.active, "Parent account is inactive");
  financeInvariant(parent.type === childType, "Parent and child account types must match");
  financeInvariant(parent.kind === "MAIN", "Child account parent must be a global main account");
  financeInvariant(!parent.parentId, "Global main account cannot have a parent");
  financeInvariant(!parent.providerId, "Global main account cannot have a provider");
  financeInvariant(parent.mainSlot === childType, "Parent main slot must match child account type");
}

export function assertCashAccountSelection(
  role: FinanceActor["role"],
  expectedType: AccountType,
  account: AccountRuleInput | null | undefined,
): asserts account is AccountRuleInput {
  financeInvariant(account?.active && account.type === expectedType, `Active ${expectedType.toLowerCase()} account not found`);
  if (role === "TELLER") {
    financeInvariant(account.kind === "CHILD", `Teller ${expectedType.toLowerCase()} assignment must be a child account`, "FORBIDDEN");
  }
}
