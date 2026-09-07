"use client";

import { useActionState, useState } from "react";
import {
  AlertCircle,
  Ban,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login, type LoginState } from "@/features/auth/actions/login";
import { cn } from "@/lib/utils";

const initialState: LoginState = { status: "idle" };

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction, pending] = useActionState(login, initialState);
  const hasError = state.status === "error";

  return (
    <form action={formAction} className="space-y-5">
      {state.message ? (
        <div
          role="alert"
          className={cn(
            "flex gap-3 rounded-lg px-4 py-3 text-sm",
            state.status === "disabled"
              ? "bg-amber-50 text-amber-900"
              : "bg-destructive/10 text-destructive",
          )}
        >
          {state.status === "disabled" ? (
            <Ban className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          ) : (
            <AlertCircle
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />
          )}
          <span>{state.message}</span>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="email">Email address</Label>
        <div className="relative">
          <Mail
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="name@example.com"
            defaultValue={state.fields?.email}
            aria-invalid={Boolean(state.errors?.email) || hasError}
            aria-describedby={state.errors?.email ? "email-error" : undefined}
            className={cn(
              "pl-10",
              hasError && "border-destructive focus-visible:border-destructive",
            )}
            required
          />
        </div>
        {state.errors?.email ? (
          <p id="email-error" className="text-sm text-destructive">
            {state.errors.email[0]}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <LockKeyhole
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Enter your password"
            aria-invalid={Boolean(state.errors?.password) || hasError}
            aria-describedby={
              state.errors?.password ? "password-error" : undefined
            }
            className={cn(
              "px-10",
              hasError && "border-destructive focus-visible:border-destructive",
            )}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="size-4" aria-hidden="true" />
            ) : (
              <Eye className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>
        {state.errors?.password ? (
          <p id="password-error" className="text-sm text-destructive">
            {state.errors.password[0]}
          </p>
        ) : null}
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        ) : null}
        {pending ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
