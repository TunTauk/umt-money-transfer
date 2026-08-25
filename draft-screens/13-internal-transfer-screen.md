# Internal Transfer Screen

Design reference: [`design/design.pen`](../design/design.pen) — two nodes:
`GQPgE` ("Internal Transfer - List") and `YWNBw` ("Internal Transfer -
New (Modal)"). The list uses the shared shell components `MYYNH`
("Sidebar") and `MwM47` ("Topbar"), instanced with the "Internal
Transfer" nav item active. The create form is a modal overlay rather than
a full page, reflecting how much simpler this flow is than Send/Payout.

## Purpose

Moves money between our own accounts (e.g. KBZ #1 → Wave #2) — no
customer involved, no fee. Admin/Owner only, both to create and to view
who's moving capital around. See
[Overview](../spec/01-overview.md#internal-transfer) and the double-entry example
in [Ledger & Accounting](../spec/03-ledger-accounting.md#internal-transfer).

## List view (`GQPgE`)

### Page header
- Title "Internal Transfer", subtitle: "Move money between our own
  accounts — no fee, admin/owner only."
- Primary button "New Transfer" → opens the modal.

No filter bar on this screen (unlike Send/Payout) — internal transfer
volume is expected to be low enough that filters aren't load-bearing yet.
Revisit if that assumption breaks.

### Table columns

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

## Create — "New Internal Transfer" (`YWNBw`)

A centered modal (460px) over a dimmed backdrop, not a full page —
reflects that this is a 3-field operation with no OCR, no customer
identity capture, and no compliance note field.

| Element | Detail |
|---|---|
| From account | Dropdown over active `Account` records |
| Swap control | Small circular button between the two account fields to flip From/To — a convenience for the common "oops, backwards" case |
| To account | Dropdown over active `Account` records |
| Amount (MMK) | Single amount field — no separate fee field, since Internal Transfer never has one |
| Note (optional) | Free text |
| No-fee banner | "No fee is applied — moving money between our own accounts." — a plain informational note (not a warning color), reassurance rather than an alert |
| Actions | Cancel / "Transfer" |

Unlike Send and Payout, there's no summary/total card here — with a
single amount and no fee, there's nothing to compute or reconcile before
submit.

## Open questions

- Whether "Transfer" should save as `PENDING` (matching Send/Payout, per
  [Transactions & Lifecycle](../spec/04-transactions-lifecycle.md#statuses)) or
  go straight to `COMPLETED` — the spec's state machine applies uniformly
  to all transaction types, but an internal transfer between our own
  accounts has no external counterparty to wait on, so a same-step
  complete may make more sense. Confirm before wiring this up; the modal
  currently doesn't commit to either in its copy.
- No detail/edit view designed yet, same gap as
  [Send](11-send-screen.md#open-questions) and
  [Payout](12-payout-screen.md#open-questions).
