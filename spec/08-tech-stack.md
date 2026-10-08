# Tech Stack

- **Owner website:** responsive Next.js application and API routes, protected
  by the `OWNER` role.
- **Staff mobile:** standalone mobile interaction prototype in
  `prototype/mobile`; production API integration and native packaging are a
  separate delivery.
- **Database:** MySQL/InnoDB.
- **ORM:** Prisma. Each business record and its balanced ledger entries must
  commit in one database transaction.
- **Authentication:** Better Auth database sessions with email/password login
  and `OWNER` / `TELLER` authorization.
- **Search:** MySQL search is sufficient for a single location.

Out of scope: native app-store packaging, screenshot upload/object storage,
OCR, multi-location support, multi-currency, and a user-facing transaction
status workflow.
