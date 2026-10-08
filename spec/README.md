# UMT Money Transfer - Specification

Internal, single-location MMK money-transfer system for Cash In and Cash Out
services. This directory is the authoritative source for business rules.

## Scope

- One responsive Next.js application for owners and tellers.
- Email/password staff login. Customer phone numbers remain transaction data.
- Two independent real main accounts: one `BANK` and one `CASH`.
- Cash In/Out selects one account and one amount; IDs, references, and posting
  timestamps are system-generated.
- Immediate, atomic ledger posting. There is no user-facing transaction status
  workflow.
- Single location and single currency (MMK).

## Documents

1. [Overview & Terminology](01-overview.md)
2. [Data Model](02-data-model.md)
3. [Ledger & Accounting](03-ledger-accounting.md)
4. [Transactions & Lifecycle](04-transactions-lifecycle.md)
5. [RBAC](05-rbac.md)
6. [Manual Entry; OCR Out of Scope](06-ocr-verification.md)
7. [Search & Filter](07-search-filter.md)
8. [Tech Stack](08-tech-stack.md)
