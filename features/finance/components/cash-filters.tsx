"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { ChevronDown, Search, SlidersHorizontal } from "lucide-react";

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
  const [expanded, setExpanded] = useState(false);
  const filterId = useId();
  const advancedKeys = ["dateFrom", "dateTo", "accountId", ...(owner ? ["createdById"] as const : []), "minAmount", "maxAmount"] as const;
  const activeCount = advancedKeys.filter((key) => filters[key]?.trim()).length;
  const hasFilters = Object.values(values).some((value) => value?.trim());
  function change(name: keyof CashTransactionFilters, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  return <form action={base} className="rounded-xl border bg-background p-3">
    <div className="flex flex-wrap items-center gap-2">
      <label className="min-w-0 basis-full sm:flex-1 sm:basis-0">
        <span className="sr-only">Search transactions</span>
        <span className="relative block"><Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" aria-hidden="true" /><input className={`${controlClass} pl-9`} name="q" value={values.q ?? ""} onChange={(event) => change("q", event.target.value)} placeholder="Customer, phone, or note" /></span>
      </label>
      <Button type="button" variant={expanded || activeCount ? "outline" : "ghost"} className="h-10" aria-expanded={expanded} aria-controls={filterId} onClick={() => setExpanded((open) => !open)}>
        <SlidersHorizontal className="size-4" aria-hidden="true" />Filters
        {activeCount ? <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-xs text-primary" aria-label={`${activeCount} active filters`}>{activeCount}</span> : null}
        <ChevronDown className={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`} aria-hidden="true" />
      </Button>
      <Button type="submit">Apply</Button>
      {hasFilters ? <Button asChild variant="ghost"><Link href={base} onClick={() => { setValues({}); setExpanded(false); }}>Reset</Link></Button> : null}
    </div>
    <div id={filterId} hidden={!expanded}>
      <div className="mt-3 grid items-start gap-3 border-t pt-3 sm:grid-cols-2 lg:grid-cols-3">
    <label className="grid min-w-0 gap-1.5 text-xs font-medium text-muted-foreground">From<input className={controlClass} name="dateFrom" type="date" value={values.dateFrom ?? ""} onChange={(event) => change("dateFrom", event.target.value)} /></label>
    <label className="grid min-w-0 gap-1.5 text-xs font-medium text-muted-foreground">To<input className={controlClass} name="dateTo" type="date" value={values.dateTo ?? ""} onChange={(event) => change("dateTo", event.target.value)} /></label>
    <label className="grid min-w-0 gap-1.5 text-xs font-medium text-muted-foreground">Account<select className={controlClass} name="accountId" value={values.accountId ?? ""} onChange={(event) => change("accountId", event.target.value)}><option value="">All accounts</option>{accounts.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.type.toLowerCase()})</option>)}</select></label>
    {owner ? <label className="grid min-w-0 gap-1.5 text-xs font-medium text-muted-foreground">Created by<select className={controlClass} name="createdById" value={values.createdById ?? ""} onChange={(event) => change("createdById", event.target.value)}><option value="">All staff</option>{creators.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.email})</option>)}</select></label> : null}
    <label className="grid min-w-0 gap-1.5 text-xs font-medium text-muted-foreground">Minimum MMK<input className={controlClass} name="minAmount" inputMode="numeric" pattern="[0-9]*" value={values.minAmount ?? ""} onChange={(event) => change("minAmount", event.target.value)} /></label>
    <label className="grid min-w-0 gap-1.5 text-xs font-medium text-muted-foreground">Maximum MMK<input className={controlClass} name="maxAmount" inputMode="numeric" pattern="[0-9]*" value={values.maxAmount ?? ""} onChange={(event) => change("maxAmount", event.target.value)} /></label>
      </div>
    </div>
  </form>;
}
