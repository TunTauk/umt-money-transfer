# Internal Transfer Screen — List

Design reference: [`design/design.pen`](../design/design.pen), node
`GQPgE` ("Internal Transfer - List"). Uses the shared shell components
`MYYNH` ("Sidebar") and `MwM47` ("Topbar"), instanced with the "Internal
Transfer" nav item active. The create form is a separate screen (a modal,
not a full page) — see
[Internal Transfer Screen — New](16-internal-transfer-new-screen.md).

## Purpose

List surface for internal transfers — moving money between our own
accounts (e.g. KBZ #1 → Wave #2), no customer involved, no fee.
Admin/Owner only, both to create and to view who's moving capital around.
See [Overview](../spec/01-overview.md#internal-transfer) and the
double-entry example in
[Ledger & Accounting](../spec/03-ledger-accounting.md#internal-transfer).

## Page header
- Title "Internal Transfer", subtitle: "Move money between our own
  accounts — no fee, admin/owner only."
- Primary button "New Transfer" → opens
  [Internal Transfer Screen — New](16-internal-transfer-new-screen.md)
  (`YWNBw`) as a modal overlay, not a full page — reflects how much
  simpler this flow is than Deposit/Withdrawal.

## Filter bar
Search box ("Search by account, reference...") plus five filter chips:
**Status**, **Date range**, **Account**, **Created by**, **Amount** — the
full filter set defined in
[Search & Filter](../spec/07-search-filter.md#structured-filters), scoped
implicitly to `type = INTERNAL_TRANSFER`, matching the pattern on
[Deposit](11-deposit-screen.md#filter-bar) and
[Withdrawal](13-withdrawal-screen.md#filter-bar).

This screen previously had no filter bar at all, on the reasoning that
internal transfer volume is low enough that filters aren't load-bearing.
That held while a separate cross-type Transactions screen existed as a
fallback for anyone who needed to search this data. With that screen
removed (see
[Dashboard](10-dashboard-screen.md#recent-activity-panel-cy2xq) for why),
every type-specific list needs its own complete search — otherwise
Internal Transfer data would have no search surface anywhere.

## Table columns

| Column | Content |
|---|---|
| Reference | Internal `reference_no`, e.g. `TRF-441` (brand-colored) |
| From | Source account name |
| To | Destination account name |
| Amount | Bold |
| Status | Badge — this type still goes through the same `PENDING → COMPLETED` state machine as customer transactions (per [Data Model](../spec/02-data-model.md#design-decision-single-transaction-table): one `Transaction` table, one status machine, for every type) |
| Created by | Always an Owner, per RBAC — the column is kept for consistency with the other transaction lists rather than because the value varies |
| — | Row actions |

No Fee column — internal transfers are always `fee = 0` per
[Data Model](../spec/02-data-model.md#transaction) ("0 for non-customer types"),
so showing it would just be dead space on every row.

## Open questions

- No detail/edit view designed yet, same gap as
  [Deposit](11-deposit-screen.md#open-questions) and
  [Withdrawal](13-withdrawal-screen.md#open-questions).
