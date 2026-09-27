import "server-only";

import { createAuth } from "@/lib/auth-config";
import { isValidEmail, normalizeEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

import { financeInvariant } from "./errors";
import { assertOwner } from "./permissions";
import type { FinanceActor } from "./types";

export async function createTeller(
  actor: FinanceActor,
  input: { name: string; email: string; password: string },
) {
  assertOwner(actor);
  const name = input.name.trim();
  const email = normalizeEmail(input.email);
  financeInvariant(name.length > 0, "Name is required");
  financeInvariant(isValidEmail(email), "Enter a valid email address");
  financeInvariant(input.password.length >= 8, "Initial password must be at least 8 characters");
  financeInvariant(!await prisma.user.findUnique({ where: { email }, select: { id: true } }), "A user with this email already exists", "CONFLICT");

  const provisioningAuth = createAuth({ allowSignUp: true, serverActions: false });
  const result = await provisioningAuth.api.signUpEmail({ body: { name, email, password: input.password } });
  try {
    return await prisma.user.update({
      where: { id: result.user.id },
      data: { name, role: "TELLER", active: true },
    });
  } finally {
    await prisma.authSession.deleteMany({ where: { userId: result.user.id } });
  }
}

export async function setTellerActive(actor: FinanceActor, userId: string, active: boolean) {
  assertOwner(actor);
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId } });
    financeInvariant(user?.role === "TELLER", "Teller not found", "NOT_FOUND");
    const updated = await tx.user.update({ where: { id: user.id }, data: { active } });
    if (!active) await tx.authSession.deleteMany({ where: { userId: user.id } });
    return updated;
  });
}
