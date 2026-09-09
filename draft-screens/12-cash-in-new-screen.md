# Deposit Screen — New

Design reference: [`design/design.pen`](../design/design.pen), node
`OChsR` ("Deposit - New"). A separate top-level screen (not a modal, not a
section nested inside the list) — reached via the "New Deposit" button on
[Deposit Screen — List](11-deposit-screen.md). Uses the shared
Sidebar/Topbar shell, instanced with the "Deposit" nav item active.

## Purpose

Create form for a `DEPOSIT` transaction — a walk-in hands over cash
(principal + fee), we wire the principal into the recipient's account
elsewhere via one of our own accounts. See
[Overview](../spec/01-overview.md#deposit-cash-in--recipients-account) for
the business definition and
[Ledger & Accounting](../spec/03-ledger-accounting.md#deposit) for the
double-entry posting. Creatable by Teller or Admin/Owner (see
[Transactions & Lifecycle](../spec/04-transactions-lifecycle.md#types)).

Only the recipient's identity is captured — there is no "Sender" section.
Whoever physically hands over the cash isn't a tracked party on the
transaction; see [Overview](../spec/01-overview.md#deposit-cash-in--recipients-account)
for why "Deposit" replaced "Send" as the name for this flow.

## Page header

- Back arrow → returns to [Deposit Screen — List](11-deposit-screen.md).
- Title "New Deposit", subtitle: "Cash in from customer, deposited into
  the recipient's account."

## Layout

Two-column body: form card (flexible width) + a summary card (fixed
340px) pinned to the right so the customer-facing total is always
visible while filling the form.

### Form card sections

Mirrors [Withdrawal's](14-withdrawal-new-screen.md) section order and OCR
pattern — screenshot first, then recipient identity, then reference/time,
then our account, then amount — so a teller who knows one form knows the
other.

1. **Screenshot** — Provider dropdown (**KBZ Bank**, **Wave Money**, and
   further providers as onboarded — see
   [Withdrawal's provider field](14-withdrawal-new-screen.md#1-provider--screenshot))
   plus a dropzone for the outbound wire confirmation. **Reversal of an
   earlier decision**: this now runs OCR exactly like Withdrawal's
   screenshot does (see
   [OCR & Verification](../spec/06-ocr-verification.md#ocr-on-deposit)) —
   extracted fields prefill Amount, External Reference No., Transfer
   Date/Time, and Recipient Name, all reviewed by the teller before
   saving. The screenshot itself stays optional (Deposit has no external
   claim that needs verifying), but OCR runs automatically whenever one
   is provided.
2. **Recipient** — Name (OCR-sourced when a screenshot is provided, since
   an outbound wire confirmation typically shows who the transfer went
   to — carries a green "OCR" badge and a highlighted border), Phone
   (always manual — phone numbers don't appear on transfer confirmations).
   This is the *only* identity section on the form — see
   [Purpose](#purpose) above for why there's no Sender section.
3. **Reference & Transfer Time** — External Reference No., Transfer
   Date/Time — both OCR-sourced, same as on Withdrawal.
4. **Our Account** — Bank Account (dropdown over active `Account` records
   — the account that wires the principal out; always manual, teller
   confirms which account, never OCR-sourced) and **Cash Account**
   (dropdown over `type = CASH` accounts — which cash drawer received the
   customer's payment; matters once more than one cash drawer/register
   exists).
5. **Amount** — Principal (MMK, OCR-sourced), Fee (MMK, always manual —
   never shown on a transfer confirmation) — two fields side by side,
   plus a **Fee kept in** dropdown (any active account, not limited to
   the two already selected — see the open note on this below) so the
   teller states explicitly which account actually retains the fee,
   rather than it being a hardcoded assumption.
6. **Note (optional)** — free text; per
   [Data Model](../spec/02-data-model.md#transaction), this is the
   catch-all for any compliance-relevant detail since no fixed KYC
   threshold exists yet
7. **Actions** — Cancel / "Save as Pending" — the transaction always
   lands as `PENDING` first, per the state machine in
   [Transactions & Lifecycle](../spec/04-transactions-lifecycle.md#statuses);
   a separate action later transitions it to `COMPLETED`.

**Deliberately not added**, unlike Withdrawal: the "Confirm" independent-
verification checklist, and the duplicate-reference warning side column.
Both exist on Withdrawal specifically because it carries real fraud
exposure (paying cash against an unverified external claim, per
[Overview](../spec/01-overview.md#withdrawal-money-already-with-us--cash-out))
— Deposit has no equivalent risk, since we perform the outbound wire
ourselves rather than trusting someone else's claim.

### Summary card

Dark (`$brand-dark`) panel showing the computed totals so the number the
customer needs to hand over is unambiguous:

| Row | Value |
|---|---|
| Principal | K 200,000 |
| Fee | K 3,000 |
| — divider — | |
| **Customer pays** | K 203,000 (bold) |
| **Deposited** | K 200,000 (bold) |

Below the totals, a warning banner (amber `#F5D488` on translucent white)
surfaces the **insufficient-balance guardrail** from
[Transactions & Lifecycle](../spec/04-transactions-lifecycle.md#fraud/data-integrity-guardrails-non-blocking-by-design):
non-blocking by design — the teller can still proceed, this is advisory
only.

## Open questions

- **Fee Account is a fully open dropdown, not constrained to the
  transaction's own two accounts.** Routing the fee to a third account
  not otherwise touched by the transaction is a real extra money
  movement (physically moving that cash), not just a bookkeeping label —
  it turns the usual 3-entry ledger post into 5 entries. Worth confirming
  this tradeoff is intentional before implementation, versus constraining
  the dropdown to just Cash Account / Bank Account.
- On Cancel or successful save, does the flow return to the
  [Deposit list](11-deposit-screen.md), or somewhere else (e.g. the new
  transaction's detail view once that exists)? Not yet decided.
- Same row-level detail/edit view gap noted on the list screen applies
  here too — once a `PENDING` Deposit needs editing
  (per [Transactions & Lifecycle](../spec/04-transactions-lifecycle.md#transitions--permissions)),
  it's unclear whether that reuses this same screen in an "edit" mode or
  needs a distinct one.
