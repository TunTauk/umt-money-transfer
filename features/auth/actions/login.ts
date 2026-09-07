"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { APIError } from "better-auth/api";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { isValidEmail, normalizeEmail } from "@/lib/email";

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
    await auth.api.signInEmail({
      body: {
        email: result.data.email,
        password: result.data.password,
      },
      headers: await headers(),
    });
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
