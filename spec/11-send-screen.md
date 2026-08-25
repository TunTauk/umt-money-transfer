# Send Screen

Design reference: [`design/design.pen`](../design/design.pen) — two nodes:
`u6DD6` ("Send - List") and `JYyqN` ("Send - New"). Both use the shared
shell components `MYYNH` ("Sidebar") and `MwM47` ("Topbar"), instanced
with the "Send" nav item active.

## Purpose

CRUD surface for `SEND` transactions — customer hands over cash
(principal + fee), we wire the principal out via one of our accounts. See
[Overview](01-overview.md#send-customer--elsewhere) for the business
definition and [Ledger & Accounting](03-ledger-accounting.md#send) for the
double-entry posting. Creatable by Teller or Admin/Owner (see
[Transactions & Lifecycle](04-transactions-lifecycle.md#types)).

## List view (`u6DD6`)

### Page header
- Title "Send Transactions", subtitle describing the flow.
- Primary button "New Send" → opens the create form.

### Filter bar
Search box ("Search by name, phone, reference...") plus four filter
chips: **Status**, **Date range**, **Account**, **Created by** — a subset
of the full filter set defined in
[Search & Filter](07-search-filter.md#structured-filters), scoped
implicitly to `type = SEND` since this is the type-specific list. Note
per that spec, **Created by** is Admin/Owner only.

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

## Create form — "New Send" (`JYyqN`)

Two-column layout: form card (flexible width) + a summary card (fixed
340px) pinned to the right so the customer-facing total is always
visible while filling the form.

### Form card sections

1. **Sender** — Name, Phone (phone icon)
2. **Recipient** — Name, Phone (phone icon)
3. **Send Via (our account)** — dropdown over active `Account` records
   (the account that wires the principal out)
4. **Amount** — Principal (MMK), Fee (MMK) — two fields side by side
5. **Note (optional)** — free text; per
   [Data Model](02-data-model.md#transaction), this is the catch-all for
   any compliance-relevant detail since no fixed KYC threshold exists yet
6. **Actions** — Cancel / "Save as Pending" — the transaction always
   lands as `PENDING` first, per the state machine in
   [Transactions & Lifecycle](04-transactions-lifecycle.md#statuses); a
   separate action later transitions it to `COMPLETED`.

### Summary card

Dark (`$brand-dark`) panel showing the computed totals so the number the
customer needs to hand over is unambiguous:

| Row | Value |
|---|---|
| Principal | K 200,000 |
| Fee | K 3,000 |
| — divider — | |
| **Customer pays** | K 203,000 (bold) |
| **Wired out** | K 200,000 (bold) |

Below the totals, a warning banner (amber `#F5D488` on translucent white)
surfaces the **insufficient-balance guardrail** from
[Transactions & Lifecycle](04-transactions-lifecycle.md#fraud/data-integrity-guardrails-non-blocking-by-design):
non-blocking by design — the teller can still proceed, this is advisory
only.

## Open questions

- Row-level detail/edit view (clicking a reference or the `ellipsis` menu)
  isn't designed yet — needed for "Edit fields of own `PENDING`
  transaction" and the `PENDING → COMPLETED` / `CANCELLED` transitions
  from [Transactions & Lifecycle](04-transactions-lifecycle.md#transitions--permissions).
- No amount-range or type-specific sort control shown on the list beyond
  the shared filter chips — confirm whether Send needs its own sort
  beyond the global "Newest first / Amount high→low" from
  [Search & Filter](07-search-filter.md#sort).
