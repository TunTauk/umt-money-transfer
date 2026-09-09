# Cash In Screen — New

Design reference: [`design/design.pen`](../design/design.pen), node
`OChsR` ("Cash In - New"). A separate top-level screen (not a modal, not a
section nested inside the list) — reached via the "New Cash In" button on
[Cash In Screen — List](11-cash-in-screen.md). Uses the shared
Sidebar/Topbar shell, instanced with the "Cash In" nav item active.

## Purpose

Create form for a `CASH_IN` transaction — a walk-in hands over cash
(principal + fee), we wire the principal into the recipient's account
elsewhere via one of our own accounts. See
[Overview](../spec/01-overview.md#cash-in) for
the business definition and
[Ledger & Accounting](../spec/03-ledger-accounting.md#cash-in) for the
double-entry posting. Creatable by Teller or Admin/Owner (see
[Transactions & Lifecycle](../spec/04-transactions-lifecycle.md#types)).

Only the recipient's identity is captured — there is no "Sender" section.
Whoever physically hands over the cash isn't a tracked party on the
transaction; see [Overview](../spec/01-overview.md#cash-in)
for the full naming history ("Send" → "Deposit" → "Cash In").

## Page header

- Back arrow → returns to [Cash In Screen — List](11-cash-in-screen.md).
- Title "New Cash In", subtitle: "Cash in from customer, wired out to
  the recipient's account."

## Layout

Two-column body: form card (flexible width) + a summary card (fixed
340px) pinned to the right so the customer-facing total is always
visible while filling the form.

### Form card sections

Mirrors [Cash Out's](14-cash-out-new-screen.md) section order and OCR
pattern — screenshot first, then recipient identity, then reference/time,
then our account, then amount — so a teller who knows one form knows the
other.

1. **Screenshot** — Provider dropdown (**KBZ Bank**, **Wave Money**, and
   further providers as onboarded — see
   [Cash Out's provider field](14-cash-out-new-screen.md#1-provider--screenshot))
   plus a dropzone for the outbound wire confirmation. **Reversal of an
   earlier decision**: this now runs OCR exactly like Cash Out's
   screenshot does (see
   [OCR & Verification](../spec/06-ocr-verification.md#ocr-on-cash-in)) —
   extracted fields prefill Amount, External Reference No., Transfer
   Date/Time, and Recipient Name, all reviewed by the teller before
   saving. The screenshot itself stays optional (Cash In has no external
   claim that needs verifying), but OCR runs automatically whenever one
   is provided.
2. **Recipient** — Name (OCR-sourced when a screenshot is provided, since
   an outbound wire confirmation typically shows who the transfer went
   to — carries a green "OCR" badge and a highlighted border), Phone
   (always manual — phone numbers don't appear on transfer confirmations).
   This is the *only* identity section on the form — see
   [Purpose](#purpose) above for why there's no Sender section.
3. **Reference & Transfer Time** — External Reference No., Transfer
   Date/Time — both OCR-sourced, same as on Cash Out.
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

**Deliberately not added**, unlike Cash Out: the "Confirm" independent-
verification checklist, and the duplicate-reference warning side column.
Both exist on Cash Out specifically because it carries real fraud
exposure (paying cash against an unverified external claim, per
[Overview](../spec/01-overview.md#cash-out))
— Cash In has no equivalent risk, since we perform the outbound wire
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
| **Wired out** | K 200,000 (bold) |

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
  [Cash In list](11-cash-in-screen.md), or somewhere else (e.g. the new
  transaction's detail view once that exists)? Not yet decided.
- Same row-level detail/edit view gap noted on the list screen applies
  here too — once a `PENDING` Cash In needs editing
  (per [Transactions & Lifecycle](../spec/04-transactions-lifecycle.md#transitions--permissions)),
  it's unclear whether that reuses this same screen in an "edit" mode or
  needs a distinct one.
