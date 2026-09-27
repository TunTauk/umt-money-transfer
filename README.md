# UMT Money Transfer

A server-first staff application built with Next.js 16, Better Auth, Prisma 7,
MySQL, Tailwind CSS 4, and shadcn/ui.

## Architecture

- `app/` contains only Next.js route entry points and the required global CSS;
  route implementations live under `features/`.
- Server Components perform reads directly through Prisma.
- Server Actions handle mutations, validation, and authorization.
- Better Auth stores sessions in MySQL and exposes only its required Route
  Handler at `/api/auth/[...all]`.
- Client Components are limited to browser interaction. There is no React
  Query cache or client-side data hydration layer.
- Every protected page and every Server Action validates its own
  session. Layout protection is for navigation behavior, not authorization.
- Financial mutations should use `prisma.$transaction` and should not use
  optimistic UI.

## Prerequisites

- Node.js 20.19 or newer
- pnpm 11
- An existing MySQL database using InnoDB

## Install Packages

Run these commands from the repository root:

```bash
pnpm add better-auth @better-auth/prisma-adapter @prisma/client@7 @prisma/adapter-mariadb mariadb dotenv zod lucide-react class-variance-authority clsx tailwind-merge @radix-ui/react-slot server-only
pnpm add -D prisma@7 tsx
```

The shadcn configuration and initial `Button`, `Input`, `Label`, and `Card`
components are already checked in. Do not run `shadcn init` over them. Add
future components with:

```bash
pnpm dlx shadcn@latest add <component>
```

## Environment

Create your local environment file:

```bash
cp .env.example .env
```

Set `DATABASE_URL` to an existing MySQL database and replace every placeholder.
Generate an authentication secret with:

```bash
openssl rand -base64 32
```

The initial owner variables are read only by the explicit seed command. Staff
sign in with their email address and password.

## Database Setup

Generate Prisma Client:

```bash
pnpm db:generate
```

Validate the schema:

```bash
pnpm db:validate
```

Push the Prisma schema directly to the database:

```bash
pnpm db:push
```

Create or restore the initial owner account and seed the Main Bank, Main Cash,
and initial child accounts:

```bash
pnpm db:seed
```

The seed is idempotent. If the configured email already exists, it restores
that user to an active `OWNER` but does not replace the existing password.

## Development

Start the application:

```bash
pnpm dev
```

Then open [http://localhost:3000](http://localhost:3000) and sign in with the
initial owner email and password from `.env`.

## Checks

Run these after installation and database setup:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

No public sign-up endpoint is enabled. Owners provision teller accounts from
the protected staff management screen and assign their Bank and Cash accounts
from Account management.
