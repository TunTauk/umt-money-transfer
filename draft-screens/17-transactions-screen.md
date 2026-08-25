# Transactions Screen

Design reference: [`design/design.pen`](../design/design.pen), node
`RxrJE` ("Transactions - List"). Uses the shared shell components
`MYYNH` ("Sidebar") and `MwM47` ("Topbar"), instanced with the
"Transactions" nav item active.

## Purpose

The unified, cross-type transaction search — implements
[Search & Filter](../spec/07-search-filter.md) in full. Unlike the type-specific
lists ([Send](11-send-screen.md), [Payout](12-payout-screen.md),
[Internal Transfer](13-internal-transfer-screen.md),
[Capital](14-capital-screen.md)), this screen queries across every
`Transaction` row regardless of `type` — enabled by the single-table
design in [Data Model](../spec/02-data-model.md#design-decision-single-transaction-table):
"one table means a plain `WHERE`; two tables means a `UNION` everywhere."

## Page header

- Title "All Transactions", subtitle: "Search and filter across every
  transaction type."
- "Export CSV" button — implements the CSV/Excel export noted as an open
  item in [Search & Filter](../spec/07-search-filter.md#open): "cheap to add once
  the filter query exists — serialize the same result set." Shown here as
  designed-but-unconfirmed, matching that spec's caveat: "confirm
  before/at implementation time."

## Search box

Full-width, single free-text field: "Search sender, recipient, phone,
reference, or note..." Matches the spec exactly — one box, OR logic
across sender name/phone, recipient name/phone, `external_reference_no`,
`note`, and internal `reference_no` (see
[Search & Filter](../spec/07-search-filter.md#free-text-search)). Deliberately
not split into per-field inputs, since staff "usually don't know in
advance whether they're about to type a name or a phone number."

## Filter bar

Six chips, each showing its current value inline (e.g. "Date range: This
week") rather than a generic label — lets a teller see active filters at
a glance without opening each one:

| Filter | Values | Notes |
|---|---|---|
| Date range | Today / Yesterday / This week / This month / Custom | Defaults to "This week" |
| Type | Send / Payout / Internal Transfer / Capital Deposit / Capital Withdrawal (multi-select) | |
| Status | Pending / Completed / Cancelled / Voided (multi-select) | |
| Account | Multi-select over `Account` — matches transactions where the account is source or destination | |
| Created by | Multi-select over `User` | **Admin/Owner only** — per [Search & Filter](../spec/07-search-filter.md#structured-filters), this is also the mechanism for reviewing a specific teller's activity (ties back to the pending-transaction monitoring note in [Transactions & Lifecycle](../spec/04-transactions-lifecycle.md#operational-implication)) |
| Amount | Min / max range | |

All filters combine with each other and the search box using AND logic,
per the spec.

## Table columns

| Column | Content |
|---|---|
| Type | Neutral outlined chip — Send, Payout, Internal Transfer, Capital Deposit, Capital Withdrawal — distinct styling from the colored type-tags used on the [Capital screen](14-capital-screen.md#type-tag-colors), since here Type is one filterable dimension among several, not the primary thing being scanned |
| Reference | Internal `reference_no` (brand-colored) |
| Party | Customer name for Send/Payout; "—" for internal types (Internal Transfer, Capital Deposit/Withdrawal have no customer identity, per [Data Model](../spec/02-data-model.md#transaction)) |
| Amount | Bold |
| Account | Source/destination account, or "KBZ → Wave" style for Internal Transfer |
| Status | Badge — shared palette across all screens |
| By | Staff name (abbreviated header — full "Created by" label lives in the filter chip) |
| Date | Right-aligned, most-space column |

## Sort

Not shown as an explicit control in this mock, but per
[Search & Filter](../spec/07-search-filter.md#sort) the two supported sorts are
**Newest first** (default) and **Amount, high → low**. Needs a sort
control added — see Open Questions.

## Open questions

- **Sort control missing.** The spec defines two sort options but no UI
  element for switching between them exists on this screen yet — add a
  sort dropdown, likely near the Export button.
- **Pagination** — spec calls for standard offset/cursor pagination
  ([Search & Filter](../spec/07-search-filter.md#implementation-notes)); not yet
  represented (mock shows a fixed 6 rows with empty space below). Needs a
  pagination control at the bottom of the Table Panel.
- Row click-through to a detail view isn't designed, same gap noted on
  every type-specific screen.
- Whether the CSV export respects the current filter/search state or
  always exports everything should be confirmed alongside the export
  feature itself (open item in the underlying spec).
