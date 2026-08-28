# Send Screen — New

Design reference: [`design/design.pen`](../design/design.pen), node
`JYyqN` ("Send - New"). A separate top-level screen (not a modal, not a
section nested inside the list) — reached via the "New Send" button on
[Send Screen — List](11-send-screen.md). Uses the shared shell components
`MYYNH` ("Sidebar") and `MwM47` ("Topbar"), instanced with the "Send" nav
item active.

## Purpose

Create form for a `SEND` transaction — customer hands over cash
(principal + fee), we wire the principal out via one of our accounts. See
[Overview](../spec/01-overview.md#send-customer--elsewhere) for the
business definition and
[Ledger & Accounting](../spec/03-ledger-accounting.md#send) for the
double-entry posting. Creatable by Teller or Admin/Owner (see
[Transactions & Lifecycle](../spec/04-transactions-lifecycle.md#types)).

## Page header

- Back arrow → returns to [Send Screen — List](11-send-screen.md).
- Title "New Send", subtitle: "Cash in from customer, wired out to
  recipient."

## Layout

Two-column body: form card (flexible width) + a summary card (fixed
340px) pinned to the right so the customer-facing total is always
visible while filling the form.

### Form card sections

1. **Sender** — Name, Phone (phone icon)
2. **Recipient** — Name, Phone (phone icon)
3. **Send Via (our account)** — dropdown over active `Account` records
   (the account that wires the principal out)
4. **Amount** — Principal (MMK), Fee (MMK) — two fields side by side
5. **Proof of Transfer (optional)** — a dropzone for attaching a
   screenshot of the outbound wire confirmation, matching the upload
   pattern on the [Payout create form](14-payout-new-screen.md#1-provider--screenshot).
   Unlike Payout's dropzone, this one has no provider toggle and doesn't
   run OCR — Send doesn't need to *extract* anything from the screenshot,
   it's optional supporting evidence attached after the wire is sent, not
   a source that prefills the form
6. **Note (optional)** — free text; per
   [Data Model](../spec/02-data-model.md#transaction), this is the
   catch-all for any compliance-relevant detail since no fixed KYC
   threshold exists yet
7. **Actions** — Cancel / "Save as Pending" — the transaction always
   lands as `PENDING` first, per the state machine in
   [Transactions & Lifecycle](../spec/04-transactions-lifecycle.md#statuses);
   a separate action later transitions it to `COMPLETED`.

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
[Transactions & Lifecycle](../spec/04-transactions-lifecycle.md#fraud/data-integrity-guardrails-non-blocking-by-design):
non-blocking by design — the teller can still proceed, this is advisory
only.

## Open questions

- **`TransactionAttachment` scope.** [Data Model](../spec/02-data-model.md#transactionattachment)
  currently describes this table as "supporting evidence for a
  transaction — currently: Payout verification screenshots." Adding an
  upload to Send means that table (or its usage) needs to widen to cover
  both types, or Send's attachment needs its own storage path — worth
  confirming before implementation.
- On Cancel or successful save, does the flow return to the
  [Send list](11-send-screen.md), or somewhere else (e.g. the new
  transaction's detail view once that exists)? Not yet decided.
- Same row-level detail/edit view gap noted on the list screen applies
  here too — once a `PENDING` Send needs editing
  (per [Transactions & Lifecycle](../spec/04-transactions-lifecycle.md#transitions--permissions)),
  it's unclear whether that reuses this same screen in an "edit" mode or
  needs a distinct one.
