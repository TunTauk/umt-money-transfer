"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { CashTransactionFilters } from "@/lib/finance/queries";
import { controlClass } from "./ui";

export function CashFilters({ filters, accounts, creators, owner, base }: {
  filters: CashTransactionFilters;
  accounts: { id: string; name: string; type: "BANK" | "CASH" }[];
  creators: { id: string; name: string; email: string }[];
  owner: boolean;
  base: string;
}) {
  const [values, setValues] = useState(filters);
  function change(name: keyof CashTransactionFilters, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  return <form action={base} className="grid items-start gap-4 rounded-xl border bg-background p-4 sm:grid-cols-2 lg:grid-cols-4">
    <label className="grid min-w-0 gap-1.5 text-xs font-medium text-muted-foreground sm:col-span-2">Search
      <span className="relative"><Search className="pointer-events-none absolute left-3 top-3 size-4" aria-hidden="true" /><input className={`${controlClass} pl-9`} name="q" value={values.q ?? ""} onChange={(event) => change("q", event.target.value)} placeholder="Reference, customer, phone, or note" /></span>
    </label>
    <label className="grid min-w-0 gap-1.5 text-xs font-medium text-muted-foreground">From<input className={controlClass} name="dateFrom" type="date" value={values.dateFrom ?? ""} onChange={(event) => change("dateFrom", event.target.value)} /></label>
    <label className="grid min-w-0 gap-1.5 text-xs font-medium text-muted-foreground">To<input className={controlClass} name="dateTo" type="date" value={values.dateTo ?? ""} onChange={(event) => change("dateTo", event.target.value)} /></label>
    <label className="grid min-w-0 gap-1.5 text-xs font-medium text-muted-foreground">Account<select className={controlClass} name="accountId" value={values.accountId ?? ""} onChange={(event) => change("accountId", event.target.value)}><option value="">All accounts</option>{accounts.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.type.toLowerCase()})</option>)}</select></label>
    {owner ? <label className="grid min-w-0 gap-1.5 text-xs font-medium text-muted-foreground">Created by<select className={controlClass} name="createdById" value={values.createdById ?? ""} onChange={(event) => change("createdById", event.target.value)}><option value="">All staff</option>{creators.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.email})</option>)}</select></label> : null}
    <label className="grid min-w-0 gap-1.5 text-xs font-medium text-muted-foreground">Minimum MMK<input className={controlClass} name="minAmount" inputMode="numeric" pattern="[0-9]*" value={values.minAmount ?? ""} onChange={(event) => change("minAmount", event.target.value)} /></label>
    <label className="grid min-w-0 gap-1.5 text-xs font-medium text-muted-foreground">Maximum MMK<input className={controlClass} name="maxAmount" inputMode="numeric" pattern="[0-9]*" value={values.maxAmount ?? ""} onChange={(event) => change("maxAmount", event.target.value)} /></label>
    <div className="col-span-full flex flex-wrap gap-2 border-t pt-4"><Button type="submit" variant="outline">Apply filters</Button><Button asChild variant="ghost"><Link href={base} onClick={() => setValues({})}>Reset</Link></Button></div>
  </form>;
}
