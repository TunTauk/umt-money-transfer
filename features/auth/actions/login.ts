"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { APIError } from "better-auth/api";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { isValidEmail, normalizeEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

const loginSchema = z.object({
  email: z
    .string()
    .transform(normalizeEmail)
    .refine(isValidEmail, "Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export type LoginState = {
  status: "idle" | "error" | "disabled";
  message?: string;
  fields?: { email?: string };
  errors?: {
    email?: string[];
    password?: string[];
  };
};

export async function login(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const fields = { email: String(formData.get("email") ?? "") };
  const result = loginSchema.safeParse({
    email: fields.email,
    password: formData.get("password"),
  });

  if (!result.success) {
    return {
      status: "error",
      message: "Check the highlighted fields and try again.",
      fields,
      errors: result.error.flatten().fieldErrors,
    };
  }

  try {
    const response = await auth.api.signInEmail({
      body: {
        email: result.data.email,
        password: result.data.password,
      },
      headers: await headers(),
    });

    if (response.user.role !== "OWNER") {
      if (!response.token) {
        throw new Error("Missing session token for rejected staff login");
      }

      await prisma.authSession.deleteMany({
        where: { token: response.token },
      });
      return {
        status: "error",
        message: "Staff accounts must use the mobile app.",
        fields,
      };
    }
  } catch (error) {
    if (error instanceof APIError && error.message === "ACCOUNT_DISABLED") {
      return {
        status: "disabled",
        message:
          "This account has been disabled. Contact your owner to restore access.",
        fields,
      };
    }

    return {
      status: "error",
      message: "Incorrect email or password. Please try again.",
      fields,
    };
  }

  redirect("/dashboard");
}
