import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { auth } from "@/lib/auth";

export const getSession = cache(async function getSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
});

export async function requireSession() {
  const session = await getSession();

  if (!session || !session.user.active) {
    redirect("/login");
  }

  return session;
}

export async function requireOwner() {
  const session = await requireSession();

  if (session.user.role !== "OWNER") {
    throw new Error("Forbidden");
  }

  return session;
}
