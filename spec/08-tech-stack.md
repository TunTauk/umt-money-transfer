# Tech Stack

## Single Next.js app — no separate mobile app

Originally scoped as Next.js (API + admin console) + a React Native/Capacitor
mobile app. The mobile app's only real purpose turned out to be a single
screen: photo upload + OCR autofill for Payout verification (see
[OCR & Payout Verification](06-ocr-payout-verification.md)). That doesn't
justify a second codebase/deployment target — a mobile-responsive page in
the same Next.js app (camera-capable file input works fine in mobile
browsers) covers it with far less to build and maintain. Revisit only if a
real need for offline capture queuing or push notifications shows up later.

- **Framework**: Next.js (App Router) — admin console + teller screens
  (responsive) + API routes, one codebase.
- **Database**: MySQL (InnoDB).
- **ORM**: Prisma — a `Transaction` and its `LedgerEntry` rows must commit
  atomically, which a relational DB with real transactions gives for free.
- **OCR**: Tesseract.js, self-hosted (see
  [OCR & Payout Verification](06-ocr-payout-verification.md) for why — free,
  keeps customer PII off third-party servers).
- **File storage**: S3-compatible object storage (e.g. Cloudflare R2 or AWS
  S3) for uploaded Payout screenshots (`TransactionAttachment`), not local
  disk — durability for evidence tied to a financial record.
- **Auth**: Better Auth with database sessions and staff login (email +
  password), role-based (`OWNER` / `TELLER`).

## Deliberately not doing (for now)

- No multi-branch/location support — single location only.
- No multi-currency — MMK only.
- No dedicated search engine — MySQL `LIKE` with a case-insensitive collation is
  enough at this scale.
- No cloud OCR API — self-hosted Tesseract.js instead.
- No granular permissions system — two hardcoded roles checked directly in
  route/API handlers.
