"use server";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { requireOwner } from "@/lib/session";
import type { FinanceFormState } from "@/features/finance/actions";

export async function changeOwnPassword(_state: FinanceFormState, data: FormData): Promise<FinanceFormState> {
  await requireOwner();
  const currentPassword = String(data.get("currentPassword") ?? "");
  const newPassword = String(data.get("newPassword") ?? "");
  const confirmation = String(data.get("confirmPassword") ?? "");
  if (!currentPassword) return { status: "error", message: "Enter your current password." };
  if (newPassword.length < 8 || newPassword.length > 128) return { status: "error", message: "New password must be between 8 and 128 characters." };
  if (newPassword !== confirmation) return { status: "error", message: "New passwords do not match." };
  try {
    await auth.api.changePassword({
      headers: await headers(),
      body: { currentPassword, newPassword, revokeOtherSessions: true },
    });
  } catch (error) {
    if (error instanceof APIError && error.body?.code === "INVALID_PASSWORD") {
      return { status: "error", message: "Current password is incorrect." };
    }
    return { status: "error", message: "Password could not be changed. Please try again." };
  }
  return { status: "idle", message: "Password changed. Other sessions have been signed out." };
}
