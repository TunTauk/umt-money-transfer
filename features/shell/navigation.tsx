"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowDownToLine, ArrowUpFromLine, BarChart3, Landmark, LayoutDashboard, Repeat2, Users } from "lucide-react";

import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/cash-in", label: "Cash In", icon: ArrowDownToLine },
  { href: "/cash-out", label: "Cash Out", icon: ArrowUpFromLine },
  { href: "/accounts", label: "Accounts", icon: Landmark },
  { href: "/transfers", label: "Transfers", icon: Repeat2 },
  { href: "/capital", label: "Capital", icon: BarChart3 },
  { href: "/users", label: "Users", icon: Users },
  { href: "/summary", label: "Summary", icon: BarChart3 },
];

export function Navigation({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  return <nav aria-label={mobile ? "Mobile navigation" : "Main navigation"} className={mobile
    ? "flex gap-1 overflow-x-auto border-b bg-background px-3 py-2 lg:hidden"
    : "flex-1 space-y-1 p-3"}>
    {links.map(({ href, label, icon: Icon }) => {
      const active = pathname === href || pathname.startsWith(`${href}/`);
      return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={cn(
        mobile
          ? "whitespace-nowrap rounded-md px-3 py-2 text-xs font-medium transition-colors"
          : "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        mobile
          ? active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
          : active ? "bg-white/15 text-white ring-1 ring-inset ring-white/20" : "text-emerald-50/80 hover:bg-white/10 hover:text-white",
      )}>
        {!mobile ? <Icon className="size-4" aria-hidden="true" /> : null}{label}
      </Link>;
    })}
  </nav>;
}
