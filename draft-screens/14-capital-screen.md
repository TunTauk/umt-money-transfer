# Capital Deposit / Withdrawal Screen

Design reference: [`design/design.pen`](../design/design.pen), node
`vDIto` ("Capital - List"). Uses the shared shell components `MYYNH`
("Sidebar") and `MwM47` ("Topbar"), instanced with the "Capital" nav item
active.

## Purpose

Owner injecting or pulling capital from an account or the cash drawer —
e.g. funding an account at the start of the day, or withdrawing profit.
Admin/Owner only, both types. See
[Overview](01-overview.md#capital-deposit--withdrawal) and the
double-entry example in
[Ledger & Accounting](03-ledger-accounting.md#capital-deposit), where the
offsetting side posts to the reporting-only `Owner Equity` account (same
pattern as `Fee Income` — not real money, just tracks where capital came
from/went for reporting).

## List view (`vDIto`)

### Page header
- Title "Capital Deposit / Withdrawal", subtitle: "Owner injecting or
  pulling capital from an account or the cash drawer."
- Primary button "New Entry" — no create form has been designed yet for
  this screen (see Open Questions).

No filter bar — same reasoning as
[Internal Transfer](13-internal-transfer-screen.md#list-view-gqpge):
low expected volume, admin-only, doesn't yet justify filter chips.

### Table columns

| Column | Content |
|---|---|
| Reference | Internal `reference_no`, e.g. `CAP-115` (brand-colored) |
| Type | **Deposit** / **Withdrawal** tag — green with `arrow-down-left` icon for Deposit, red with `arrow-up-right` icon for Withdrawal. Arrow direction reflects money's direction relative to the account, not a judgment of good/bad |
| Account | The account or Cash Drawer affected |
| Amount | Bold |
| Status | Badge — same `PENDING → COMPLETED` state machine as every other transaction type, per the single-`Transaction`-table design in [Data Model](02-data-model.md#design-decision-single-transaction-table) |
| Created by | Always an Owner |
| — | Row actions |

No Fee column, matching
[Internal Transfer](13-internal-transfer-screen.md#table-columns) — `fee`
is always 0 for this type per
[Data Model](02-data-model.md#transaction).

## Type tag colors

| Type | Background | Text/Icon | Icon |
|---|---|---|---|
| Deposit | `#EAF7EF` | `$brand` (`#0F6D4E`) | `arrow-down-left` |
| Withdrawal | `#FCEEEC` | `$error` (`#C4331F`) | `arrow-up-right` |

Distinct from the transaction-status badge palette (Pending/Completed/
Cancelled/Voided) defined in the
[Dashboard spec](10-dashboard-screen.md#status-badge-colors-shared-pattern) —
this is a separate "type" dimension, not a status.

## Open questions

- **No create form exists yet.** The "New Entry" button has nowhere to
  go. Given how close this is structurally to Internal Transfer (single
  account picker + amount, admin-only, no fee), the
  [Internal Transfer modal](13-internal-transfer-screen.md#create--new-internal-transfer-ywnbw)
  is the natural pattern to adapt: swap the From/To account pair for a
  single **Account** field plus a **Deposit / Withdrawal** toggle (similar
  to the Provider toggle on the [Payout form](12-payout-screen.md#1-provider--screenshot)).
- Same `PENDING` vs. same-step-`COMPLETED` question as raised for
  [Internal Transfer](13-internal-transfer-screen.md#open-questions) —
  worth deciding once, since the answer likely applies to both types.
- No detail/edit view designed, same gap as the other transaction-type
  screens.
