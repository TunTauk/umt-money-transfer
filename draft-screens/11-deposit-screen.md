# Send Screen — List

Design reference: [`design/design.pen`](../design/design.pen), node
`u6DD6` ("Send - List"). Uses the shared shell components `MYYNH`
("Sidebar") and `MwM47` ("Topbar"), instanced with the "Send" nav item
active. The create form is a separate top-level screen — see
[Send Screen — New](12-send-new-screen.md).

## Purpose

List/search surface for `SEND` transactions — customer hands over cash
(principal + fee), we wire the principal out via one of our accounts. See
[Overview](../spec/01-overview.md#send-customer--elsewhere) for the business
definition and [Ledger & Accounting](../spec/03-ledger-accounting.md#send) for the
double-entry posting. Creatable by Teller or Admin/Owner (see
[Transactions & Lifecycle](../spec/04-transactions-lifecycle.md#types)).

## Page header
- Title "Send Transactions", subtitle describing the flow.
- Primary button "New Send" → navigates to
  [Send Screen — New](12-send-new-screen.md) (`JYyqN`), a separate
  top-level screen rather than a modal or an inline panel — matches how
  Payout's create flow is also its own screen, given both need real
  space for form + summary/verification content.

### Filter bar
Search box ("Search by name, phone, reference...") plus five filter
chips: **Status**, **Date range**, **Account**, **Created by**,
**Amount** — the full filter set defined in
[Search & Filter](../spec/07-search-filter.md#structured-filters), scoped
implicitly to `type = SEND` since this is the type-specific list. Note
per that spec, **Created by** is Admin/Owner only.

This is Send's dedicated search — there's no separate cross-type
Transactions screen in this design (see
[Dashboard](10-dashboard-screen.md#recent-activity-panel-cy2xq) for why
that was removed in favor of per-screen search).

### Table columns

| Column | Content |
|---|---|
| Reference | Internal `reference_no`, e.g. `SND-10231` (brand-colored, links to detail) |
| Customer | `"{sender_name} → {recipient_name}"` |
| Destination | The account money was wired out through |
| Fee | Bold, right-weighted visually |
| Status | Badge — Pending / Completed / Cancelled / Voided (see color table in [Dashboard spec](10-dashboard-screen.md#status-badge-colors-shared-pattern)) |
| Created by | Staff name |
| Date | Created timestamp |
| — | Row actions (`ellipsis` menu) |

Amount (principal) is deliberately not a separate column here — Fee is
the number a teller scans for; principal detail lives in the row/detail
view. Revisit if usage shows principal is needed at a glance too.

## Open questions

- Row-level detail/edit view (clicking a reference or the `ellipsis` menu)
  isn't designed yet — needed for "Edit fields of own `PENDING`
  transaction" and the `PENDING → COMPLETED` / `CANCELLED` transitions
  from [Transactions & Lifecycle](../spec/04-transactions-lifecycle.md#transitions--permissions).
- No amount-range or type-specific sort control shown on the list beyond
  the shared filter chips — confirm whether Send needs its own sort
  beyond the global "Newest first / Amount high→low" from
  [Search & Filter](../spec/07-search-filter.md#sort).
