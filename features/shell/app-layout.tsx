import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowDownToLine, ArrowUpFromLine, BarChart3, Landmark, LayoutDashboard, LogOut, Repeat2, ShieldCheck, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { signOut } from "@/features/shell/actions/sign-out";
import { requireOwner } from "@/lib/session";

export async function AppLayout({ children }: { children: ReactNode }) {
  const session = await requireOwner();
  const links = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/cash-in", label: "Cash In", icon: ArrowDownToLine },
    { href: "/dashboard/cash-out", label: "Cash Out", icon: ArrowUpFromLine },
    { href: "/dashboard/accounts", label: "Accounts", icon: Landmark },
    { href: "/dashboard/transfers", label: "Transfers", icon: Repeat2 },
    { href: "/dashboard/capital", label: "Capital", icon: BarChart3 },
    { href: "/dashboard/users", label: "Users", icon: Users },
    { href: "/dashboard/summary", label: "Summary", icon: BarChart3 },
  ];

  return (
    <div className="min-h-svh bg-page lg:grid lg:grid-cols-[15rem_1fr]">
      <aside className="hidden border-r border-white/10 bg-brand-dark text-white lg:flex lg:flex-col">
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
          <span className="grid size-8 place-items-center rounded-lg bg-brand-light text-sm font-semibold">
            U
          </span>
          <span className="text-xs font-semibold tracking-[0.12em]">UMT MONEY</span>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-emerald-50/80 hover:bg-white/10 hover:text-white"><Icon className="size-4" aria-hidden="true" />{label}</Link>)}
        </nav>
        <div className="border-t border-white/10 p-4 text-xs leading-5 text-emerald-50/60">
          <span className="flex items-center gap-2">
            <ShieldCheck className="size-4" aria-hidden="true" />
            Secure owner workspace
          </span>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="flex h-16 items-center justify-between border-b bg-background px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 lg:hidden">
            <span className="grid size-8 place-items-center rounded-lg bg-brand-dark text-sm font-semibold text-white">
              U
            </span>
            <span className="text-xs font-semibold tracking-wide">UMT MONEY</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-5">{session.user.name}</p>
              <p className="text-xs text-muted-foreground">
                Owner
              </p>
            </div>
            <form action={signOut}>
              <Button type="submit" variant="outline" size="sm">
                <LogOut className="size-4" aria-hidden="true" />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </form>
          </div>
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b bg-background px-3 py-2 lg:hidden">
          {links.map(({ href, label }) => <Link key={href} href={href} className="whitespace-nowrap rounded-md px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground">{label}</Link>)}
        </nav>
        {children}
      </div>
    </div>
  );
}
