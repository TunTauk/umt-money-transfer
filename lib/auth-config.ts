import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";

import { prisma } from "@/lib/prisma";

type AuthOptions = {
  allowSignUp?: boolean;
  serverActions?: boolean;
};

export function createAuth({
  allowSignUp = false,
  serverActions = true,
}: AuthOptions = {}) {
  return betterAuth({
    appName: "UMT Money Transfer",
    database: prismaAdapter(prisma, {
      provider: "mysql",
    }),
    emailAndPassword: {
      enabled: true,
      disableSignUp: !allowSignUp,
      minPasswordLength: 8,
    },
    user: {
      additionalFields: {
        role: {
          type: ["OWNER", "TELLER"],
          required: true,
          defaultValue: "TELLER",
          input: false,
        },
        active: {
          type: "boolean",
          required: true,
          defaultValue: true,
          input: false,
        },
      },
    },
    session: {
      modelName: "AuthSession",
    },
    account: {
      modelName: "AuthAccount",
      identityStrategy: "provider-id",
    },
    verification: {
      modelName: "AuthVerification",
    },
    advanced: {
      database: {
        generateId: "uuid",
      },
    },
    databaseHooks: {
      session: {
        create: {
          before: async (session) => {
            const user = await prisma.user.findUnique({
              where: { id: session.userId },
              select: { active: true },
            });

            if (!user?.active) {
              throw new APIError("FORBIDDEN", {
                message: "ACCOUNT_DISABLED",
              });
            }

            return { data: session };
          },
        },
      },
    },
    plugins: serverActions ? [nextCookies()] : [],
  });
}
