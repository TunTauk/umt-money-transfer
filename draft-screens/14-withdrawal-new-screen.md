# Withdrawal Screen — New

Design reference: [`design/design.pen`](../design/design.pen), node
`CfAa1` ("Withdrawal - New"). A separate top-level screen (not a modal,
not a section nested inside the list) — reached via the "New Withdrawal"
button on [Withdrawal Screen — List](13-withdrawal-screen.md). Uses the
shared Sidebar/Topbar shell, instanced with the "Withdrawal" nav item
active. A second variant, "Withdrawal - New (No OCR Provider)", shows the
fallback state when the selected provider has no OCR support yet — see
[Providers](19-account-management-screen.md) and the note under
[Section 1](#1-provider--screenshot).

## Purpose

Create/verify form for a `WITHDRAWAL` transaction — someone has already
transferred money into one of our accounts; the teller uploads the
transfer screenshot, OCR prefills the form, and every field is reviewed
before the cash goes out. See
[OCR & Verification](../spec/06-ocr-verification.md#flow) for the full
procedure this screen implements, and
[Transactions & Lifecycle](../spec/04-transactions-lifecycle.md#why-pending-matters-most-for-withdrawal)
for why this is the highest-risk flow in the business. Creatable by
Teller or Admin/Owner.

Only the recipient's identity is captured — there is no "Sender" section.
Whoever originally sent the money in isn't a tracked party on the
transaction; the transaction's link to reality is the transfer's own
reference number and amount (verified against the screenshot), not a
person's name. See
[Overview](../spec/01-overview.md#withdrawal-money-already-with-us--cash-out)
for the full reasoning.

The form mirrors [Deposit's](12-deposit-new-screen.md#form-card-sections)
section order (screenshot, recipient identity, reference/time, our
account, amount) so a teller who knows one form knows most of the other.
The two still diverge where the underlying flows genuinely differ:
Withdrawal's transaction-fact fields are OCR-prefilled and it carries the
verification checklist + duplicate-reference guardrail, since it's the
higher-risk direction (cash goes out); Deposit's screenshot is optional
supporting evidence with OCR as a convenience, not a verification
requirement.

## Page header

- Back arrow → returns to [Withdrawal Screen — List](13-withdrawal-screen.md).
- Title "New Withdrawal", subtitle: "Upload the transfer screenshot to
  prefill the form, then verify before paying out."

## Layout

Two-column layout: form card (flexible width) + a 320px side column.

### Form card sections

### 1. Provider & Screenshot
- Provider dropdown — **KBZ Bank**, **Wave Money**, **AYA Bank**, **CB
  Bank**, **True Money**, and further providers as they're onboarded —
  picked by the teller up front rather than auto-detected, since
  anchoring OCR rules on a known provider layout is far more reliable
  (per the OCR spec's rationale). Backed by a real `Provider` entity
  (`id`, `name`, `has_ocr_feature`) rather than a hardcoded list, so
  admins can add providers without a code change — see the
  [Providers screen](19-account-management-screen.md). New providers
  default to `has_ocr_feature = false`.
- Dropzone showing the uploaded screenshot (filename, "Uploaded · OCR
  complete" status) with a "Replace" action for re-upload. **When the
  selected provider has `has_ocr_feature = false`** (the "No OCR
  Provider" variant of this screen), the status instead reads "Uploaded ·
  Manual entry required," every field below that would otherwise be
  OCR-sourced renders as a plain empty field with no badge, and the
  duplicate-reference warning in the side column is replaced with an
  "OCR not available" notice — there's no extracted reference number to
  check for reuse.

### 2. Recipient (walk-in customer)

The only identity section on the form — see [Purpose](#purpose) above for
why there's no Sender section. **Recipient Name** and **Recipient Phone**
are always manually entered, laid out side by side. Neither field is
OCR-sourced (the walk-in customer isn't shown on the inbound transfer
screenshot).

### 3. Reference & Transfer Time
Both fields carry a small green "OCR" badge (sparkle icon) and a
highlighted (`$brand-light`) border, visually distinguishing machine-filled
fields from manually-entered ones:

| Field | OCR-sourced? |
|---|---|
| External Reference No. | Yes |
| Transfer Date/Time | Yes |

**No name is extracted anywhere on this screen** — since only the
recipient is recorded and the recipient never appears on an *inbound*
transfer's screenshot, there's no person field left for OCR to fill (see
[OCR & Verification](../spec/06-ocr-verification.md#flow) step 5). This
directly implements the spec's core rule: **OCR output never
auto-submits** — every field is editable and teller-reviewed before save.

### 4. Our Account
**Into Account (Bank)** — dropdown, teller confirms which of our accounts
received it; never OCR-sourced. **Cash Account** — dropdown over
`type = CASH` accounts, which drawer pays the cash out; matters once more
than one cash drawer/register exists.

### 5. Amount
**Amount (MMK)** — OCR-sourced, carries the same badge/border treatment as
the Reference & Transfer Time fields. **Fee (MMK)** — always manual, never
shown on a transfer confirmation. A **Fee kept in** dropdown sits alongside
(any active account, not limited to the two already selected — see the
open note on this on [Deposit's](12-deposit-new-screen.md#open-questions)
equivalent field) so the teller states explicitly which account actually
retains the fee.

### 6. Confirm
A single checkbox-style confirmation: "I independently checked the
bank/wallet app (not just this screenshot) and confirmed the transfer
actually landed." This encodes step 8 of the OCR spec's flow — the
independent verification step that exists specifically because a
screenshot alone is not trustworthy evidence.

**Actions**: Cancel / "Save as Pending" — same as Deposit, this always
lands as `PENDING` first (awaiting the independent verification above),
then transitions to `COMPLETED` once cash is paid out.

## Side column

**Summary card** (`$brand-dark`, matches
[Deposit's](12-deposit-new-screen.md#summary-card) card style and
position): Amount received, Fee, and Cash to pay out — added so both
create forms have the same always-visible running total, even though
Withdrawal doesn't collect money from a customer the way Deposit does.

**Duplicate Warning** (`$error` bordered, shown conditionally): "Possible
duplicate reference — WM2408241 was already used on a completed
withdrawal (WDL-8790, 12 Aug). You can still proceed at your judgment."
Implements the **duplicate external reference guardrail** from
[Transactions & Lifecycle](../spec/04-transactions-lifecycle.md#fraud/data-integrity-guardrails-non-blocking-by-design)
— non-blocking by design, teller judgment overrides. Replaced with an
"OCR not available" notice when the selected provider has no OCR support
(see [Section 1](#1-provider--screenshot)).

**Guide Card**: a numbered 3-step reminder of the withdrawal flow (upload
→ verify → pay & complete), reinforcing the procedure without requiring
the teller to leave the form.

## Open questions

- **OCR rule coverage per provider.** [OCR & Verification](../spec/06-ocr-verification.md#open)
  notes that anchor keywords/regex only exist for KBZ and Wave so far. The
  `Provider.has_ocr_feature` flag (see [Section 1](#1-provider--screenshot))
  resolves how the UI should behave for unsupported providers — this
  screen's "No OCR Provider" variant is that resolution.
- Multiple attachments per transaction (e.g. a blurry re-upload followed
  by a clearer one, per [Data Model](../spec/02-data-model.md#transactionattachment))
  aren't represented in the Dropzone — it currently shows only the latest
  upload. Worth a "view all attachments" affordance once that matters.
- On Cancel or successful save, does the flow return to the
  [Withdrawal list](13-withdrawal-screen.md), or somewhere else (e.g. the
  new transaction's detail view once that exists)? Same open question as
  [Deposit](12-deposit-new-screen.md#open-questions).
