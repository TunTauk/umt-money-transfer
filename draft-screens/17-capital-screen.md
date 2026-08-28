# Capital Deposit / Withdrawal Screen — List

Design reference: [`design/design.pen`](../design/design.pen), node
`vDIto` ("Capital - List"). Uses the shared shell components `MYYNH`
("Sidebar") and `MwM47` ("Topbar"), instanced with the "Capital" nav item
active. The create form is a separate screen (a modal, not a full page)
— see
[Capital Deposit / Withdrawal Screen — New](18-capital-new-screen.md).

## Purpose

List surface for capital deposits/withdrawals — owner injecting or
pulling capital from an account or the cash drawer, e.g. funding an
account at the start of the day, or withdrawing profit. Admin/Owner only,
both types. See
[Overview](../spec/01-overview.md#capital-deposit--withdrawal) and the
double-entry example in
[Ledger & Accounting](../spec/03-ledger-accounting.md#capital-deposit), where the
offsetting side posts to the reporting-only `Owner Equity` account (same
pattern as `Fee Income` — not real money, just tracks where capital came
from/went for reporting).

## Page header
- Title "Capital Deposit / Withdrawal", subtitle: "Owner injecting or
  pulling capital from an account or the cash drawer."
- Primary button "New Entry" → opens
  [Capital Deposit / Withdrawal Screen — New](18-capital-new-screen.md)
  (`yaGax`) as a modal overlay, matching the
  [Internal Transfer](16-internal-transfer-new-screen.md) pattern this
  screen's create form was adapted from.

## Filter bar
Search box ("Search by account, reference...") plus five filter chips:
**Status**, **Date range**, **Account**, **Created by**, **Amount** — the
full filter set defined in
[Search & Filter](../spec/07-search-filter.md#structured-filters), scoped
implicitly to Capital's two types (`CAPITAL_DEPOSIT` /
`CAPITAL_WITHDRAWAL`), matching the pattern on
[Internal Transfer](15-internal-transfer-screen.md#filter-bar).

Same reasoning as Internal Transfer for why this exists now: this screen
previously had no filter bar (low expected volume, admin-only), which
held while a separate cross-type Transactions screen served as a search
fallback. That screen is gone (see
[Dashboard](10-dashboard-screen.md#recent-activity-panel-cy2xq)), so every
type-specific list — including this one — needs its own complete search.

## Table columns

| Column | Content |
|---|---|
| Reference | Internal `reference_no`, e.g. `CAP-115` (brand-colored) |
| Type | **Deposit** / **Withdrawal** tag — green with `arrow-down-left` icon for Deposit, red with `arrow-up-right` icon for Withdrawal. Arrow direction reflects money's direction relative to the account, not a judgment of good/bad |
| Account | The account or Cash Drawer affected |
| Amount | Bold |
| Status | Badge — same `PENDING → COMPLETED` state machine as every other transaction type, per the single-`Transaction`-table design in [Data Model](../spec/02-data-model.md#design-decision-single-transaction-table) |
| Created by | Always an Owner |
| — | Row actions |

No Fee column, matching
[Internal Transfer](15-internal-transfer-screen.md#table-columns) — `fee`
is always 0 for this type per
[Data Model](../spec/02-data-model.md#transaction).

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

- No detail/edit view designed, same gap as the other transaction-type
  screens.
