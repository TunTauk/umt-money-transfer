import { CalendarDays, Database, LockKeyhole, ServerCog } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireSession } from "@/lib/session";

const foundations = [
  {
    title: "Server-side reads",
    description: "Server Components query Prisma without a browser data layer.",
    icon: Database,
  },
  {
    title: "Server Actions",
    description: "Mutations remain authenticated, validated, and transactional.",
    icon: ServerCog,
  },
  {
    title: "Database sessions",
    description: "Better Auth sessions are checked for every protected request.",
    icon: LockKeyhole,
  },
];

export async function DashboardPage() {
  const session = await requireSession();
  const date = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "long",
    timeZone: "Asia/Yangon",
  }).format(new Date());

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">
              Welcome back, {session.user.name}
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              Dashboard
            </h1>
            <p className="mt-2 text-muted-foreground">
              The application foundation is ready for the money-transfer domain.
            </p>
          </div>
          <div className="flex w-fit items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm text-muted-foreground">
            <CalendarDays className="size-4" aria-hidden="true" />
            {date}
          </div>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {foundations.map(({ title, description, icon: Icon }) => (
            <Card key={title} className="gap-4">
              <CardHeader className="flex-row items-center gap-3 pb-0">
                <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <CardTitle>{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="leading-6">
                  {description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </section>

        <Card className="mt-6 overflow-hidden border-primary/20">
          <div className="h-1 bg-primary" />
          <CardHeader>
            <CardTitle>Next domain step</CardTitle>
            <CardDescription className="max-w-2xl leading-6">
              Add financial accounts, transactions, and immutable ledger entries
              to Prisma. Monetary mutations should use a single
              <code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-xs text-foreground">
                prisma.$transaction
              </code>
              inside an authorized Server Action.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </main>
  );
}
