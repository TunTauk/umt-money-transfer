"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { SummaryMode, SummaryStaff } from "@/lib/finance/summary";
import { controlClass, Field } from "./ui";

export function SummaryFilters({ mode, date, month, staffId, staff }: { mode: SummaryMode; date: string; month: string; staffId: string; staff: SummaryStaff[] }) {
  const [view, setView] = useState(mode);
  return <form action="/summary" className="flex flex-wrap items-end gap-3 rounded-xl border bg-background p-4">
    <fieldset className="min-w-0"><legend className="mb-1.5 text-xs font-medium text-muted-foreground">Income view</legend><div className="flex rounded-lg bg-muted p-1">
      {(["daily", "monthly"] as const).map((value) => <label key={value} className={`cursor-pointer rounded-md px-4 py-1.5 text-sm font-medium has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring ${view === value ? "bg-background text-primary shadow-sm" : "text-muted-foreground"}`}><input className="sr-only" type="radio" name="mode" value={value} checked={view === value} onChange={() => setView(value)} />{value === "daily" ? "Daily" : "Monthly"}</label>)}
    </div></fieldset>
    {view === "daily" ? <Field label="Date"><input className={controlClass} type="date" name="date" defaultValue={date} required /></Field> : <Field label="Month"><input className={controlClass} type="month" name="month" defaultValue={month} required /></Field>}
    <div className="min-w-48 flex-1"><Field label="Teller / staff"><select className={controlClass} name="staffId" defaultValue={staffId}><option value="">All staff</option>{staffId && !staff.some((user) => user.id === staffId) ? <option value={staffId}>Unknown staff member</option> : null}{staff.map((user) => <option key={user.id} value={user.id}>{user.name} · {user.role === "OWNER" ? "Owner" : "Teller"}{!user.active ? " (inactive)" : ""}</option>)}</select></Field></div>
    <Button type="submit"><CalendarDays className="size-4" aria-hidden="true" />Apply</Button>
  </form>;
}
