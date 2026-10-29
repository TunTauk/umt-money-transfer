import { prisma } from "@/lib/prisma";
import { financeInvariant } from "./errors";
import { assertOwner } from "./permissions";
import type { FinanceActor } from "./types";

export async function manageOtherOwner(
  actor: FinanceActor,
  userId: string,
  operation: "activate" | "deactivate" | "delete",
) {
  assertOwner(actor);
  financeInvariant(actor.id !== userId, "You cannot deactivate or delete your own account", "FORBIDDEN");
  financeInvariant(["activate", "deactivate", "delete"].includes(operation), "Invalid owner action");

  try {
    return await prisma.$transaction(async (tx) => {
      // Recheck the actor within the transaction so concurrent owner changes
      // cannot remove every active owner using stale sessions.
      const currentOwner = await tx.user.findUnique({ where: { id: actor.id } });
      financeInvariant(currentOwner?.active && currentOwner.role === "OWNER", "Active owner permission required", "FORBIDDEN");
      const target = await tx.user.findUnique({ where: { id: userId } });
      financeInvariant(target?.role === "OWNER", "Owner not found", "NOT_FOUND");

      if (operation === "delete") {
        // Foreign keys protect financial history; credentials and sessions cascade.
        return tx.user.delete({ where: { id: userId } });
      }
      const updated = await tx.user.update({ where: { id: userId }, data: { active: operation === "activate" } });
      if (operation === "deactivate") await tx.authSession.deleteMany({ where: { userId } });
      return updated;
    }, { isolationLevel: "Serializable" });
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? error.code : undefined;
    financeInvariant(code !== "P2003", "This owner has financial history or account assignments. Deactivate the account instead.", "CONFLICT");
    financeInvariant(code !== "P2034", "Another owner changed access at the same time. Refresh and try again.", "CONFLICT");
    throw error;
  }
}
