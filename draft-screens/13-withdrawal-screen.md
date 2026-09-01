# Withdrawal Screen — List

Design reference: [`design/design.pen`](../design/design.pen), node
`Lro1Y` ("Withdrawal - List"). Uses the shared Sidebar/Topbar shell,
instanced with the "Withdrawal" nav item active. The create form is a
separate top-level screen — see
[Withdrawal Screen — New](14-withdrawal-new-screen.md).

## Purpose

List/search surface for `WITHDRAWAL` transactions — someone has already
transferred money into one of our accounts, we verify it landed, then pay
a recipient cash. See
[Overview](../spec/01-overview.md#withdrawal-money-already-with-us--cash-out)
for the business definition — this is called out there as the
**highest-risk flow** in the business, since paying cash against a
claimed transfer that turns out to be fake/already-used is the main fraud
exposure. Creatable by Teller or Admin/Owner (see
[Transactions & Lifecycle](../spec/04-transactions-lifecycle.md#types)).

## Page header
- Title "Withdrawal Transactions", subtitle describing the flow.
- Primary button "New Withdrawal" → navigates to
  [Withdrawal Screen — New](14-withdrawal-new-screen.md), a separate
  top-level screen rather than a modal or an inline panel — same pattern
  as [Deposit](12-deposit-new-screen.md), given both need real space for
  form + supporting content (summary card for both, plus verification +
  duplicate warning for Withdrawal specifically).

## Filter bar
Search box plus five filter chips: **Status**, **Date range**,
**Account**, **Created by**, **Amount** — scoped implicitly to
`type = WITHDRAWAL`, matching the pattern used on the
[Deposit screen](11-deposit-screen.md#filter-bar). This is the full search
+ filter surface for Withdrawal — there's no separate cross-type
Transactions screen (see
[Dashboard](10-dashboard-screen.md#recent-activity-panel-cy2xq) for why).

## Table columns

Matches [Deposit's](11-deposit-screen.md#table-columns) column set for
consistency between the two forms — Fee and Date were originally left off
this list before that alignment pass:

| Column | Content |
|---|---|
| Reference | Internal `reference_no`, e.g. `WDL-8821` (brand-colored) |
| Customer | Recipient name (who walks in and gets paid) — the only party recorded, per [Data Model](../spec/02-data-model.md#transaction) |
| Source | The account the incoming transfer landed in |
| Fee | Bold, right-weighted visually |
| Status | Badge — Pending / Completed / Cancelled / Voided |
| Created by | Staff name |
| Date | Created timestamp |
| — | Row actions — labeled buttons ("Edit"/"Cancel" for `PENDING` rows, "Void" for `COMPLETED` rows, none for terminal `CANCELLED`/`VOIDED` rows), not an icon-only `ellipsis` menu — same reasoning as [Deposit's list](11-deposit-screen.md#table-columns) |

`external_reference_no` was originally shown as its own column here but
was dropped — it's already surfaced prominently on the create/verify form
(with the duplicate-reference guardrail live at entry time), so repeating
it in the list added width without adding a decision the teller makes
from the list view. It remains on `TransactionAttachment` /
`Transaction.external_reference_no` in the data model and is searchable
from this screen's own search box (per the free-text rules in
[Search & Filter](../spec/07-search-filter.md#free-text-search)) if
someone needs to look it up later.

## Open questions

- Row-level detail/edit view isn't designed yet — same gap noted on the
  [Deposit screen](11-deposit-screen.md#open-questions).
