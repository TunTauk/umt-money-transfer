# Data Model

Entities only — see [Ledger & Accounting](03-ledger-accounting.md) for how
`LedgerEntry` rows are derived from a `Transaction`, and
[Transactions & Lifecycle](04-transactions-lifecycle.md) for the status
state machine.

## User

Staff account.

| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| name | string | |
| email | string | unique login identifier |
| password_hash | string | managed by Better Auth in its credential account table |
| role | enum | `OWNER`, `TELLER` |
| active | boolean | disabled accounts can't log in |
| created_at | timestamp | |

Better Auth manages the credential account and database-backed sessions. There
is no public sign-up flow; owners provision staff accounts.

## Account

A real place money sits.

| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| name | string | e.g. "KBZ - 09xxxxxxx", "Wave - 09xxxxxxx", "Cash Drawer" |
| type | enum | `CASH`, `BANK`, `WALLET` |
| provider | string \| null | e.g. "KBZ Bank", "Wave Money" — null for `CASH` |
| account_number | string \| null | masked in UI where sensible |
| active | boolean | deactivated accounts are hidden from new-transaction pickers but keep history |
| created_at | timestamp | |

Balance is **not** a stored column — it's derived live as the sum of the
account's `LedgerEntry` rows. See [Ledger & Accounting](03-ledger-accounting.md).

## Transaction

One customer or internal event. **Deliberately one table for both**
customer transactions (`SEND`, `PAYOUT`) and internal ones
(`INTERNAL_TRANSFER`, `CAPITAL_DEPOSIT`, `CAPITAL_WITHDRAWAL`), not split —
see [Design decision: single Transaction table](#design-decision-single-transaction-table)
below.

| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| reference_no | string | internal, human-shareable reference (e.g. for receipts) |
| type | enum | `SEND`, `PAYOUT`, `INTERNAL_TRANSFER`, `CAPITAL_DEPOSIT`, `CAPITAL_WITHDRAWAL` |
| status | enum | `PENDING`, `COMPLETED`, `CANCELLED`, `VOIDED` |
| amount | decimal | principal amount (MMK) |
| fee | decimal | 0 for non-customer types |
| source_account_id | uuid \| null | account/cash money comes from (type-dependent) |
| destination_account_id | uuid \| null | account/cash money goes to (type-dependent) |
| sender_name | string \| null | customer-facing types only |
| sender_phone | string \| null | normalized format, see [Search & Filter](07-search-filter.md) |
| recipient_name | string \| null | |
| recipient_phone | string \| null | normalized format |
| external_reference_no | string \| null | reference number extracted from a Payout screenshot (OCR) — see uniqueness note in [OCR & Payout Verification](06-ocr-payout-verification.md) |
| note | string \| null | free text — also the catch-all for any compliance-relevant detail, since no fixed threshold rule exists yet (see [RBAC](05-rbac.md) open item) |
| created_by | uuid (User) | |
| created_at | timestamp | |
| completed_at | timestamp \| null | |
| voided_by | uuid (User) \| null | |
| voided_at | timestamp \| null | |
| void_reason | string \| null | |
| cancelled_by | uuid (User) \| null | |
| cancelled_at | timestamp \| null | |
| cancel_reason | string \| null | |

## LedgerEntry

Immutable. Never edited or deleted — corrections happen via a reversing
transaction (`VOIDED` status), not by mutating history.

| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| transaction_id | uuid | |
| account_id | uuid | |
| side | enum | `DEBIT`, `CREDIT` |
| amount | decimal | always positive; `side` determines direction |
| created_at | timestamp | |

Only `COMPLETED` transactions produce `LedgerEntry` rows. A `VOIDED`
transaction gets a second set of entries (the reversal) rather than deleting
the first set.

### Design decision: single Transaction table

Considered splitting customer transactions (Send/Payout) from internal ones
(Internal Transfer, Capital Deposit/Withdrawal) into separate tables, since
`sender_name`/`sender_phone`/`recipient_name`/`recipient_phone`/
`external_reference_no` are `NULL` for internal types. Kept as one table:

- All types share the identical status state machine
  (`PENDING`/`COMPLETED`/`CANCELLED`/`VOIDED`) and audit fields
  (`created_by`/`voided_by`/`cancelled_by`) — splitting duplicates this.
- `LedgerEntry.transaction_id` stays a single, non-polymorphic FK. Splitting
  the source table would force `LedgerEntry` to reference either of two
  tables depending on type — added complexity in exactly the part of the
  system (debit/credit integrity) that most needs to stay simple.
- Account history and the transaction search/filter screen
  ([Search & Filter](07-search-filter.md)) need to query across all types
  together — one table means a plain `WHERE`; two tables means a `UNION`
  everywhere those features touch.
- The cost — 5 nullable columns on internal-type rows — is small enough to
  accept rather than design around.

Contrast with `TransactionAttachment` below, which *is* split out: that
data is one-to-many (multiple upload attempts) and a genuinely different
concern (file storage + OCR metadata) from the financial fact a Transaction
represents. Sender/recipient info is one-to-one and central to what a
Send/Payout transaction *is* — pulling it into a joined table would only
move the nullability from a column to a relation while adding a JOIN to
every list/search query, without solving a real problem.

## TransactionAttachment

Supporting evidence for a transaction — currently: Payout verification
screenshots. Deliberately a separate table from `Transaction` rather than a
`file_url` column on it — see [OCR & Payout Verification](06-ocr-payout-verification.md#storage--attachments)
for why.

| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| transaction_id | uuid | FK → Transaction |
| file_url | string | path in object storage (S3-compatible) |
| file_type | string | mime type |
| uploaded_by | uuid (User) | |
| uploaded_at | timestamp | |
| ocr_raw_text | text \| null | raw OCR output — kept for debugging/improving provider rules later |
| ocr_extracted_fields | json \| null | structured fields OCR extracted at upload time (amount, reference, date) — a snapshot, kept separate from whatever the teller ultimately entered on the Transaction, so the two can be compared later |

A transaction can have more than one attachment (e.g. a blurry first upload
followed by a clearer re-upload) — all are kept, not overwritten.

## FeeIncome

Not a real money account — a reporting-only ledger for revenue. Every
`COMPLETED` `SEND`/`PAYOUT` transaction with a nonzero fee posts one entry
here (credit side), used for the profit summary in
[Ledger & Accounting](03-ledger-accounting.md).
