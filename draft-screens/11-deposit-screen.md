# Deposit Screen — List

Design reference: [`design/design.pen`](../design/design.pen), node
`FNQQT` ("Deposit - List"). Uses the shared Sidebar/Topbar shell,
instanced with the "Deposit" nav item active. The create form is a
separate top-level screen — see [Deposit Screen — New](12-deposit-new-screen.md).

## Purpose

List/search surface for `DEPOSIT` transactions — a walk-in hands over cash
(principal + fee), we wire the principal into the recipient's account
elsewhere via one of our own accounts. See
[Overview](../spec/01-overview.md#deposit-cash-in--recipients-account) for
the business definition and
[Ledger & Accounting](../spec/03-ledger-accounting.md#deposit) for the
double-entry posting. Creatable by Teller or Admin/Owner (see
[Transactions & Lifecycle](../spec/04-transactions-lifecycle.md#types)).

## Page header
- Title "Deposit Transactions", subtitle describing the flow.
- Primary button "New Deposit" → navigates to
  [Deposit Screen — New](12-deposit-new-screen.md), a separate top-level
  screen rather than a modal or an inline panel — matches how
  Withdrawal's create flow is also its own screen, given both need real
  space for form + summary/verification content.

### Filter bar
Search box ("Search by name, phone, reference...") plus five filter
chips: **Status**, **Date range**, **Account**, **Created by**,
**Amount** — the full filter set defined in
[Search & Filter](../spec/07-search-filter.md#structured-filters), scoped
implicitly to `type = DEPOSIT` since this is the type-specific list. Note
per that spec, **Created by** is Admin/Owner only.

This is Deposit's dedicated search — there's no separate cross-type
Transactions screen in this design (see
[Dashboard](10-dashboard-screen.md#recent-activity-panel-cy2xq) for why
that was removed in favor of per-screen search).

### Table columns

| Column | Content |
|---|---|
| Reference | Internal `reference_no`, e.g. `DEP-10231` (brand-colored, links to detail) |
| Customer | `recipient_name` only — there is no second party to show. Earlier drafts of this screen showed `"{sender_name} → {recipient_name}"`; that format was dropped along with the `sender_*` fields themselves, since [only the recipient's identity is recorded](../spec/02-data-model.md#transaction) |
| Destination | The account money was wired out through |
| Fee | Bold, right-weighted visually |
| Status | Badge — Pending / Completed / Cancelled / Voided (see color table in [Dashboard spec](10-dashboard-screen.md#status-badge-colors-shared-pattern)) |
| Created by | Staff name |
| Date | Created timestamp |
| — | Row actions — labeled buttons ("Edit"/"Cancel" for `PENDING` rows, "Void" for `COMPLETED` rows, none for terminal `CANCELLED`/`VOIDED` rows), not an icon-only `ellipsis` menu — end users aren't assumed to recognize icon meaning, and the action count per row is small enough (at most two) that a menu adds a click without saving space |

Amount (principal) is deliberately not a separate column here — Fee is
the number a teller scans for; principal detail lives in the row/detail
view. Revisit if usage shows principal is needed at a glance too.

## Open questions

- Row-level detail/edit view (clicking a reference or the "Edit" action)
  isn't designed yet — needed for "Edit fields of own `PENDING`
  transaction" and the `PENDING → COMPLETED` / `CANCELLED` transitions
  from [Transactions & Lifecycle](../spec/04-transactions-lifecycle.md#transitions--permissions).
- No amount-range or type-specific sort control shown on the list beyond
  the shared filter chips — confirm whether Deposit needs its own sort
  beyond the global "Newest first / Amount high→low" from
  [Search & Filter](../spec/07-search-filter.md#sort).
