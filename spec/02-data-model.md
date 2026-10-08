# Data Model

This is a business-level model. Exact implementation names may vary, but the
relationships and constraints are required.

## User

| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| name | string | Staff display name |
| email | string | Unique login identifier |
| password_hash | string | Credential-managed |
| role | enum | `OWNER`, `TELLER` |
| active | boolean | Inactive users cannot log in or create records |
| created_at | timestamp | |

Customers do not log in. Their phone number remains on Cash In and Cash Out
records.

## Account

| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| name | string | Human-readable account name |
| type | enum | `BANK`, `CASH` |
| level | enum | `MAIN`, `CHILD` |
| parent_id | uuid \| null | Required for a child; null for a main |
| provider | string \| null | Optional Bank provider |
| account_number | string \| null | Optional external account identifier |
| active | boolean | Inactive accounts cannot be used for new records |
| created_at | timestamp | |

Required invariants:

- There is one Main Bank and one Main Cash account. They are real, independent
  ledger accounts.
- A child has the same type as its parent main account.
- Each type starts with four child accounts and supports additional children.
- Main balances never include child balances. Child totals are separate sums.

## AccountAssignment

| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| user_id | uuid | Teller only |
| account_id | uuid | Active child account only |
| active | boolean | Preserves assignment history |
| assigned_by | uuid | Owner |
| assigned_at | timestamp | |
| ended_at | timestamp \| null | |

Every active Teller must have exactly one active child `BANK` assignment and
one active child `CASH` assignment. A child account supports at most two active
staff assignments. Main accounts cannot be assigned.

## Transaction

One immediately posted business event.

| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| compact_id | string | System-generated display ID; `CI-...` or `CO-...` for Cash In/Out |
| reference_no | string | Separate system-generated reference |
| type | enum | `CASH_IN`, `CASH_OUT`, `INTERNAL_TRANSFER`, `CAPITAL_DEPOSIT`, `CAPITAL_WITHDRAWAL`, `REVERSAL` |
| selected_account_id | uuid \| null | One active `BANK` or `CASH` main/child account; required for Cash In/Out |
| amount | decimal \| null | Actual transfer value; one positive amount; required for Cash In/Out |
| fee | decimal | Non-negative; zero for internal and capital operations |
| fee_mode | enum \| null | `DEDUCTED` or `SEPARATE`; Cash In/Out only |
| fee_account_id | uuid \| null | Fee account; required only when `SEPARATE` and fee > 0 |
| customer_name | string \| null | Cash In/Out only |
| customer_phone | string \| null | Required for Cash In/Out; normalized for search |
| note | string \| null | |
| created_by | uuid | |
| created_at | timestamp | System-generated posting time |
| reverses_transaction_id | uuid \| null | Links an audited reversal |
| replacement_for_id | uuid \| null | Links an owner's corrected repost |
| deleted_at | timestamp \| null | Soft deletion after reversal |
| deleted_by | uuid \| null | Owner who deleted it |

There is no user-facing transaction status field. Records post at creation.
Owner Edit creates a reversal and corrected repost; Owner Delete creates a
reversal and soft-deletes the original business record.

For Cash In/Out, `selected_account_id` must match the chosen account type. An
Owner may use any active main or child account. A Teller must use the active
assigned child account for the chosen type.

In `SEPARATE` mode with a positive fee, `fee_account_id` must reference an
active account of the chosen type. An Owner may use any active account of that
type; a Teller's fee account is the active assigned child account of that type,
enforced by the server. `DEDUCTED` mode uses no fee account.

## LedgerEntry

Immutable entry linked to a transaction and ledger account. Amounts are
positive and debit/credit determines direction. All entries for a creation,
edit, or deletion commit in one database transaction. Balances are derived
from ledger entries, never stored on `Account`.
