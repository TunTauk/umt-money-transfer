import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";

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

  if (session?.user.active) {
    redirect("/dashboard");
  }

  return (
    <main className="grid min-h-svh lg:grid-cols-[minmax(24rem,0.78fr)_1.22fr]">
      <section className="relative hidden overflow-hidden bg-brand-dark px-12 py-10 text-white lg:flex lg:flex-col">
        <div className="absolute -right-36 -top-28 size-96 rounded-full border border-white/10" />
        <div className="absolute -bottom-48 left-20 size-[34rem] rounded-full border border-white/10" />
        <div className="relative flex items-center gap-3 text-sm font-semibold tracking-wide">
          <span className="grid size-9 place-items-center rounded-lg bg-brand-light">
            U
          </span>
          UMT MONEY TRANSFER
        </div>

        <div className="relative my-auto max-w-md">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.28em] text-emerald-200">
            Everyday operations, clearly managed
          </p>
          <h1 className="text-5xl font-semibold leading-[1.08] tracking-[-0.04em]">
            Send and receive with confidence.
          </h1>
          <p className="mt-6 max-w-sm text-base leading-7 text-emerald-50/70">
            One secure workspace for staff, transfers, payouts, and accountable
            cash movement.
          </p>
        </div>

        <div className="relative flex items-center gap-2 text-sm text-emerald-50/65">
          <ShieldCheck className="size-4" aria-hidden="true" />
          Staff access only <span aria-hidden="true">&middot;</span> MMK
        </div>
      </section>

      <section className="flex items-center justify-center bg-page px-5 py-12 sm:px-10">
        <div className="w-full max-w-[26rem]">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
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
              <LoginForm />
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
