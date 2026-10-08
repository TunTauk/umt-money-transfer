import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function Page({ children }: { children: ReactNode }) {
  return <main className="p-4 sm:p-6 lg:p-8"><div className="mx-auto max-w-7xl space-y-6">{children}</div></main>;
}

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: { href: string; label: string } }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>{description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}</div>
      {action ? <Button asChild><Link href={action.href}>{action.label}</Link></Button> : null}
    </div>
  );
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <Card className={`gap-0 overflow-hidden ${className}`}>{children}</Card>;
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return <label className="grid gap-1.5 text-sm font-medium">{label}{children}{hint ? <span className="text-xs font-normal text-muted-foreground">{hint}</span> : null}</label>;
}

export const controlClass = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:bg-muted";
export const textareaClass = "min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15";

export function Empty({ children }: { children: ReactNode }) {
  return <div className="px-6 py-12 text-center text-sm text-muted-foreground">{children}</div>;
}

export function Tabs({ active, base }: { active: "BANK" | "CASH"; base: string }) {
  return <div className="flex w-fit rounded-lg bg-muted p-1">{(["BANK", "CASH"] as const).map((type) => <Link key={type} href={`${base}?type=${type}`} className={`rounded-md px-5 py-2 text-sm font-medium ${active === type ? "bg-background text-primary shadow-sm" : "text-muted-foreground"}`}>{type === "BANK" ? "Bank" : "Cash"}</Link>)}</div>;
}

export function TransactionAmount({ value }: { value: bigint | null }) {
  return <span className="font-mono text-sm font-semibold tabular-nums">{new Intl.NumberFormat("en-US").format(value ?? 0n)} MMK</span>;
}
