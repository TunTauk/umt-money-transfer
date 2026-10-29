"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  assignTellerAccounts,
  createCapitalTransaction,
  createCashTransaction,
  createFinancialAccount,
  createInternalTransfer,
  createTeller,
  cancelCashTransaction,
  FinanceError,
  setFinancialAccountActive,
  setTellerActive,
  type FinanceActor,
} from "@/lib/finance";
import { requireOwner, requireSession } from "@/lib/session";
import { TransferConfirmationRequired } from "@/lib/finance/errors";
import { feeCollectionAccountId } from "@/lib/finance/fee-collection";
import { manageOtherOwner } from "@/lib/finance/owners";

export type FinanceFormState = {
  status: "idle" | "error" | "warning";
  message?: string;
  confirmation?: { key: string; reference: string };
};

function actorFrom(session: Awaited<ReturnType<typeof requireSession>>): FinanceActor {
  return { id: session.user.id, role: session.user.role, active: session.user.active };
}

function field(formData: FormData, name: string) {
  return String(formData.get(name) ?? "");
}

function oneOf<T extends string>(value: string, choices: readonly T[], label: string): T {
  if (!choices.includes(value as T)) throw new FinanceError(`${label} is invalid`, "INVALID_INPUT");
  return value as T;
}

function reference(prefix: string) {
  const stamp = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
  return `${prefix}-${stamp}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

function cashReference(prefix: "CI" | "CO") {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 6).toUpperCase()}`;
}

function message(error: unknown) {
  if (error instanceof FinanceError) return error.message;
  if (error instanceof Error && error.message.includes("Unique constraint")) return "That code or reference is already in use.";
  console.error(error);
  return "The request could not be completed. Please try again.";
}

export async function saveCashTransaction(
  _state: FinanceFormState,
  formData: FormData,
): Promise<FinanceFormState> {
  const session = await requireSession();
  const actor = actorFrom(session);
  const id = field(formData, "id");
  if (id) return { status: "error", message: "Transactions cannot be edited. An owner can cancel a cash transaction and create a new one." };
  let type: "CASH_IN" | "CASH_OUT";
  try {
    type = oneOf(field(formData, "type"), ["CASH_IN", "CASH_OUT"] as const, "Transaction type");
    const customerName = field(formData, "customerName").trim();
    const customerPhone = field(formData, "customerPhone").trim();
    if (!customerName) throw new FinanceError("Customer name is required", "INVALID_INPUT");
    if (!customerPhone.replace(/\D/g, "")) throw new FinanceError("Customer phone is required", "INVALID_INPUT");
    const input = {
      reference: cashReference(type === "CASH_IN" ? "CI" : "CO"),
      type,
      receivingAccountId: field(formData, "receivingAccountId"),
      payingAccountId: field(formData, "payingAccountId"),
      amount: field(formData, "amount"),
      feeAmount: field(formData, "feeAmount"),
      feeMode: "SEPARATE" as const,
      feeAccountId: feeCollectionAccountId(type, field(formData, "feeCollection"), field(formData, "receivingAccountId"), field(formData, "payingAccountId")),
      customerName,
      customerPhone,
      note: field(formData, "note"),
    };
    await createCashTransaction(actor, input);
  } catch (error) {
    return { status: "error", message: message(error) };
  }
  const route = type === "CASH_IN" ? "/cash-in" : "/cash-out";
  revalidatePath("/dashboard");
  revalidatePath(route);
  redirect(route);
}

export async function saveInternalTransfer(state: FinanceFormState, formData: FormData): Promise<FinanceFormState> {
  const session = await requireOwner();
  const actor = actorFrom(session);
  const id = field(formData, "id");
  let savedReference: string;
  try {
    const input = {
      reference: field(formData, "reference") || state.confirmation?.reference || reference("TR"),
      accountType: oneOf(field(formData, "accountType"), ["BANK", "CASH"] as const, "Account type"),
      direction: oneOf(field(formData, "direction"), ["MAIN_TO_CHILD", "CHILD_TO_MAIN"] as const, "Direction"),
      childAccountId: field(formData, "childAccountId"),
      amount: field(formData, "amount"),
      note: field(formData, "note"),
      confirmationKey: field(formData, "confirmationKey") || undefined,
    };
    if (id) throw new FinanceError("Transfers cannot be edited. Create an opposite transfer to reverse them.", "FORBIDDEN");
    await createInternalTransfer(actor, input);
    savedReference = input.reference;
  } catch (error) {
    if (error instanceof TransferConfirmationRequired) {
      return {
        status: "warning", message: error.message,
        confirmation: { key: error.confirmationKey, reference: error.reference },
      };
    }
    return { status: "error", message: message(error) };
  }
  revalidatePath("/dashboard");
  revalidatePath("/transfers");
  redirect(`/transfers?type=${field(formData, "accountType")}&saved=created&reference=${encodeURIComponent(savedReference)}`);
}

export async function saveCapitalTransaction(_state: FinanceFormState, formData: FormData): Promise<FinanceFormState> {
  const session = await requireOwner();
  const actor = actorFrom(session);
  const id = field(formData, "id");
  try {
    const input = {
      reference: field(formData, "reference") || reference("CAP"),
      accountType: oneOf(field(formData, "accountType"), ["BANK", "CASH"] as const, "Account type"),
      type: oneOf(field(formData, "type"), ["CAPITAL_DEPOSIT", "CAPITAL_WITHDRAWAL"] as const, "Capital type"),
      amount: field(formData, "amount"),
      note: field(formData, "note"),
    };
    if (id) throw new FinanceError("Capital entries cannot be edited. Create an opposite capital entry to reverse them.", "FORBIDDEN");
    await createCapitalTransaction(actor, input);
  } catch (error) {
    return { status: "error", message: message(error) };
  }
  revalidatePath("/dashboard");
  revalidatePath("/capital");
  redirect(`/capital?type=${field(formData, "accountType")}`);
}

export async function cancelTransaction(_state: FinanceFormState, formData: FormData): Promise<FinanceFormState> {
  const session = await requireOwner();
  try {
    await cancelCashTransaction(actorFrom(session), field(formData, "id"));
  } catch (error) {
    return { status: "error", message: message(error) };
  }
  revalidatePath("/", "layout");
  return { status: "idle", message: "Transaction cancelled. The amount and fee have been reversed." };
}

export async function addChildAccount(_state: FinanceFormState, formData: FormData): Promise<FinanceFormState> {
  const session = await requireOwner();
  const actor = actorFrom(session);
  try {
    const type = oneOf(field(formData, "type"), ["BANK", "CASH"] as const, "Account type");
    const providerId = field(formData, "providerId") || null;
    if (type === "BANK" && !providerId) throw new FinanceError("Provider is required for a bank child", "INVALID_INPUT");
    await createFinancialAccount(actor, {
      code: field(formData, "code"), name: field(formData, "name"), type, kind: "CHILD",
      parentId: field(formData, "parentId"), providerId,
    });
  } catch (error) {
    return { status: "error", message: message(error) };
  }
  revalidatePath("/accounts");
  redirect(`/accounts?type=${field(formData, "type")}`);
}

export async function assignTeller(_state: FinanceFormState, formData: FormData): Promise<FinanceFormState> {
  const session = await requireOwner();
  try {
    await assignTellerAccounts(actorFrom(session), {
      userId: field(formData, "userId"), bankAccountId: field(formData, "bankAccountId"), cashAccountId: field(formData, "cashAccountId"),
    });
  } catch (error) {
    return { status: "error", message: message(error) };
  }
  revalidatePath("/accounts");
  revalidatePath("/users");
  revalidatePath("/", "layout");
  return { status: "idle", message: "Assignment saved." };
}

export async function provisionTeller(_state: FinanceFormState, formData: FormData): Promise<FinanceFormState> {
  const session = await requireOwner();
  try {
    await createTeller(actorFrom(session), {
      name: field(formData, "name"),
      email: field(formData, "email"),
      password: field(formData, "password"),
      bankAccountId: field(formData, "bankAccountId"),
      cashAccountId: field(formData, "cashAccountId"),
    });
  } catch (error) {
    return { status: "error", message: message(error) };
  }
  revalidatePath("/users");
  revalidatePath("/accounts");
  return { status: "idle", message: "Teller created with account assignments." };
}

export async function toggleTeller(formData: FormData) {
  const session = await requireOwner();
  await setTellerActive(actorFrom(session), field(formData, "userId"), field(formData, "active") === "true");
  revalidatePath("/users");
  revalidatePath("/accounts");
}

export async function updateOwnerAccess(_state: FinanceFormState, formData: FormData): Promise<FinanceFormState> {
  const session = await requireOwner();
  try {
    const operation = oneOf(field(formData, "operation"), ["activate", "deactivate", "delete"] as const, "Owner action");
    await manageOtherOwner(actorFrom(session), field(formData, "userId"), operation);
  } catch (error) {
    return { status: "error", message: message(error) };
  }
  revalidatePath("/users");
  revalidatePath("/accounts");
  return { status: "idle", message: "Owner access updated." };
}

export async function toggleFinancialAccount(formData: FormData) {
  const session = await requireOwner();
  await setFinancialAccountActive(actorFrom(session), field(formData, "accountId"), field(formData, "active") === "true");
  revalidatePath("/accounts");
  revalidatePath("/dashboard");
}
