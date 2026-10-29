import { redirect } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "@/features/auth/components/login-form";
import { getSession } from "@/lib/session";

export async function LoginPage() {
  const session = await getSession();

  if (session?.user.active && session.user.role === "OWNER") {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-page px-5 py-12 sm:px-10">
      <div className="w-full max-w-[26rem]">
        <div className="mb-8 flex items-center justify-center gap-3">
          <span className="grid size-9 place-items-center rounded-lg bg-brand-dark text-sm font-semibold text-white">
            U
          </span>
          <span className="text-sm font-semibold tracking-wide">
            UMT MONEY TRANSFER
          </span>
        </div>
        <Card className="border-border/80 shadow-[0_24px_70px_-35px_rgba(11,59,46,0.35)]">
          <CardHeader className="pb-1">
            <CardTitle className="text-2xl">Sign in</CardTitle>
            <CardDescription className="pt-1 leading-6">
              Enter your email address and password to continue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm staffOnlyMessage={session?.user.role === "TELLER"} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
