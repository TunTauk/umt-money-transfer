# Internal Transfer Screen — New

Design reference: [`design/design.pen`](../design/design.pen), node
`YWNBw` ("Internal Transfer - New (Modal)"). A centered modal (460px)
over a dimmed backdrop, opened from the "New Transfer" button on
[Internal Transfer Screen — List](15-internal-transfer-screen.md) — not
a full page, reflecting that this is a 3-field operation with no OCR, no
customer identity capture, and no compliance note field.

## Purpose

Create form for an internal transfer — moving money between our own
accounts (e.g. KBZ #1 → Wave #2), no customer involved, no fee.
Admin/Owner only. See
[Overview](../spec/01-overview.md#internal-transfer) and the
double-entry example in
[Ledger & Accounting](../spec/03-ledger-accounting.md#internal-transfer).

## Modal contents

| Element | Detail |
|---|---|
| Title | "New Internal Transfer", with a close (`x`) icon |
| From account | Dropdown over active `Account` records |
| Swap control | Small circular button between the two account fields to flip From/To — a convenience for the common "oops, backwards" case |
| To account | Dropdown over active `Account` records |
| Amount (MMK) | Single amount field — no separate fee field, since Internal Transfer never has one |
| Note (optional) | Free text |
| Actions | Cancel / "Transfer" |

Unlike Cash In and Cash Out, there's no summary/total card here — with a
single amount and no fee, there's nothing to compute or reconcile before
submit.

## Open questions

- Whether "Transfer" should save as `PENDING` (matching Cash In/Cash Out,
  per [Transactions & Lifecycle](../spec/04-transactions-lifecycle.md#statuses)) or
  go straight to `COMPLETED` — the spec's state machine applies uniformly
  to all transaction types, but an internal transfer between our own
  accounts has no external counterparty to wait on, so a same-step
  complete may make more sense. Confirm before wiring this up; the modal
  currently doesn't commit to either in its copy.
- No detail/edit view designed yet, same gap as
  [Cash In](12-cash-in-new-screen.md#open-questions) and
  [Cash Out](14-cash-out-new-screen.md#open-questions).
