# Payout Screen — List

Design reference: [`design/design.pen`](../design/design.pen), node
`h6DRsc` ("Payout - List"). Uses the shared shell components `MYYNH`
("Sidebar") and `MwM47` ("Topbar"), instanced with the "Payout" nav item
active. The create form is a separate top-level screen — see
[Payout Screen — New](14-payout-new-screen.md).

## Purpose

List/search surface for `PAYOUT` transactions — someone elsewhere
transfers money into one of our accounts, we verify it landed, then pay
the recipient cash. See
[Overview](../spec/01-overview.md#payout-elsewhere--customer) for the
business definition — this is called out there as the **highest-risk
flow** in the business, since paying cash against a claimed transfer that
turns out to be fake/already-used is the main fraud exposure. Creatable
by Teller or Admin/Owner (see
[Transactions & Lifecycle](../spec/04-transactions-lifecycle.md#types)).

## Page header
- Title "Payout Transactions", subtitle describing the flow.
- Primary button "New Payout" → navigates to
  [Payout Screen — New](14-payout-new-screen.md) (`pu68x`), a separate
  top-level screen rather than a modal or an inline panel — same pattern
  as [Send](12-send-new-screen.md), given both need real space for form +
  supporting content (summary card for Send, verification + duplicate
  warning for Payout).

## Filter bar
Search box plus five filter chips: **Status**, **Date range**,
**Account**, **Created by**, **Amount** — scoped implicitly to
`type = PAYOUT`, matching the pattern used on the
[Send screen](11-send-screen.md#filter-bar). This is the full search +
filter surface for Payout — there's no separate cross-type Transactions
screen (see [Dashboard](10-dashboard-screen.md#recent-activity-panel-cy2xq)
for why).

## Table columns

| Column | Content |
|---|---|
| Reference | Internal `reference_no`, e.g. `PYT-8821` (brand-colored) |
| Customer | Recipient name (who walks in and gets paid) |
| Source | The account the incoming transfer landed in |
| Status | Badge — Pending / Completed / Cancelled / Voided |
| Created by | Staff name |
| — | Row actions (`ellipsis` menu) |

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
  [Send screen](11-send-screen.md#open-questions).
