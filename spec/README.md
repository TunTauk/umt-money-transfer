# UMT Money Transfer — Spec

Internal system for a Myanmar money-transfer shop: customers hand over cash
that gets wired to a recipient elsewhere ("Cash In"), or receive cash here
against a transfer that landed in one of our accounts ("Cash Out"). The
system tracks every kyat across our bank/wallet accounts and cash drawer,
and collects a fee on every transaction.

## Scope

- **Next.js app** (single codebase): admin console + mobile-responsive
  teller screens + API routes.
- **No separate mobile app.** The only mobile-specific need (photo upload +
  OCR autofill for Cash Out verification) is handled by a responsive page
  in the same app — see [OCR & Verification](06-ocr-verification.md).
- **Single location**, single currency (MMK), Postgres + Prisma.

## Documents

1. [Overview & Terminology](01-overview.md) — business flows, keyword choices
2. [Data Model](02-data-model.md) — entities and fields
3. [Ledger & Accounting](03-ledger-accounting.md) — double-entry model, worked examples
4. [Transactions & Lifecycle](04-transactions-lifecycle.md) — types, statuses, transitions
5. [RBAC](05-rbac.md) — roles and permission matrix
6. [OCR & Verification](06-ocr-verification.md) — upload/OCR flow
7. [Search & Filter](07-search-filter.md) — transaction list search/filter spec
8. [Tech Stack](08-tech-stack.md) — architecture decisions

## Status

This is a requirements/design spec from a brainstorming pass — not yet
implemented. Open items are marked **OPEN** in the relevant document.
