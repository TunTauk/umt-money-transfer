import { createAuth } from "@/lib/auth-config";

export const auth = createAuth();

export type Session = typeof auth.$Infer.Session;
