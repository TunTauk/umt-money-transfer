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

Mirrors [Payout's](14-payout-new-screen.md) section order and OCR pattern
— screenshot first, then identity, then reference/time, then our account,
then amount — so a teller who knows one form knows the other.

1. **Screenshot** — Provider dropdown (**KBZ Bank**, **Wave Money**, and
   further providers as onboarded — see
   [Payout's provider field](14-payout-new-screen.md#1-provider--screenshot))
   plus a dropzone for the outbound wire confirmation. **Reversal of an
   earlier decision**: this now runs OCR exactly like Payout's screenshot
   does (see [OCR & Payout Verification](../spec/06-ocr-payout-verification.md#ocr-on-send)) —
   extracted fields prefill Amount, External Reference No., Transfer
   Date/Time, and Recipient Name, all reviewed by the teller before
   saving. The screenshot itself stays optional (Send has no external
   claim that needs verifying), but OCR runs automatically whenever one
   is provided.
2. **Sender** — Name, Phone (phone icon). Always manually entered — the
   sender is the walk-in customer standing at the counter, never
   something a screenshot shows.
3. **Recipient** — Name (OCR-sourced when a screenshot is provided, since
   an outbound wire confirmation typically shows who the transfer went
   to — carries the same green "OCR" badge and Burmese-script reliability
   caveat as [Payout's Sender Name field](14-payout-new-screen.md#2-verify-extracted-fields)),
   Phone (always manual — phone numbers don't appear on transfer
   confirmations). **Note the swap**: it's Recipient that's OCR-sourced
   here, not Sender — opposite of Payout, because Send's screenshot is
   *our own outbound* confirmation (shows who we sent to), while Payout's
   screenshot is *someone else's inbound* transfer (shows who sent it).
4. **Reference & Transfer Time** — External Reference No., Transfer
   Date/Time — both OCR-sourced, same as on Payout.
5. **Our Account** — Bank/Wallet Account (dropdown over active `Account`
   records — the account that wires the principal out; always manual,
   teller confirms which account, never OCR-sourced) and **Cash
   Account** (dropdown over `type = CASH` accounts — which cash drawer
   received the customer's payment; matters once more than one cash
   drawer/register exists).
6. **Amount** — Principal (MMK, OCR-sourced), Fee (MMK, always manual —
   never shown on a transfer confirmation) — two fields side by side,
   plus a **Fee kept in** toggle (Cash Account or the Bank/Wallet
   account) so the teller states explicitly which account actually
   retains the fee, rather than it being a hardcoded assumption.
7. **Note (optional)** — free text; per
   [Data Model](../spec/02-data-model.md#transaction), this is the
   catch-all for any compliance-relevant detail since no fixed KYC
   threshold exists yet
8. **Actions** — Cancel / "Save as Pending" — the transaction always
   lands as `PENDING` first, per the state machine in
   [Transactions & Lifecycle](../spec/04-transactions-lifecycle.md#statuses);
   a separate action later transitions it to `COMPLETED`.

**Deliberately not added**, unlike Payout: the "Confirm" independent-
verification checklist, and the duplicate-reference warning side column.
Both exist on Payout specifically because it carries real fraud exposure
(paying cash against an unverified external claim, per
[Overview](../spec/01-overview.md#payout-elsewhere--customer)) — Send has
no equivalent risk, since we perform the outbound wire ourselves rather
than trusting someone else's claim.

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

- ~~`TransactionAttachment` scope~~ — resolved: Send now shares the same
  OCR/attachment mechanism as Payout (see
  [OCR & Payout Verification](../spec/06-ocr-payout-verification.md#ocr-on-send)),
  so [Data Model](../spec/02-data-model.md#transactionattachment)'s
  description should widen from "Payout verification screenshots" to
  cover both types.
- On Cancel or successful save, does the flow return to the
  [Send list](11-send-screen.md), or somewhere else (e.g. the new
  transaction's detail view once that exists)? Not yet decided.
- Same row-level detail/edit view gap noted on the list screen applies
  here too — once a `PENDING` Send needs editing
  (per [Transactions & Lifecycle](../spec/04-transactions-lifecycle.md#transitions--permissions)),
  it's unclear whether that reuses this same screen in an "edit" mode or
  needs a distinct one.
