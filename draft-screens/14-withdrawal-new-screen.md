# Payout Screen — New

Design reference: [`design/design.pen`](../design/design.pen), node
`pu68x` ("Payout - New"). A separate top-level screen (not a modal, not a
section nested inside the list) — reached via the "New Payout" button on
[Payout Screen — List](13-payout-screen.md). Uses the shared shell
components `MYYNH` ("Sidebar") and `MwM47` ("Topbar"), instanced with the
"Payout" nav item active.

## Purpose

Create/verify form for a `PAYOUT` transaction — someone elsewhere
transferred money into one of our accounts; the teller uploads the
transfer screenshot, OCR prefills the form, and every field is reviewed
before the cash goes out. See
[OCR & Payout Verification](../spec/06-ocr-payout-verification.md#flow)
for the full procedure this screen implements, and
[Transactions & Lifecycle](../spec/04-transactions-lifecycle.md#why-pending-matters-most-for-payout)
for why this is the highest-risk flow in the business. Creatable by
Teller or Admin/Owner.

The form intentionally mirrors
[Send's](12-send-new-screen.md#form-card-sections) structure — both now
capture Sender + Recipient identity and both support a screenshot
attachment — so a teller who knows one form already knows most of the
other. The two still diverge where the underlying flows genuinely
differ: Payout's fields are OCR-prefilled and it carries the
verification checklist + duplicate-reference guardrail, since it's the
higher-risk direction (cash goes out); Send's attachment is optional
supporting evidence with no OCR, since nothing needs to be extracted from
it.

## Page header

- Back arrow → returns to [Payout Screen — List](13-payout-screen.md).
- Title "New Payout", subtitle: "Upload the transfer screenshot to
  prefill the form, then verify before paying out."

## Layout

Two-column layout: form card (flexible width) + a 320px side column with
a duplicate-reference warning and a flow guide. Structured as three
numbered sections mirroring the actual procedure from
[OCR & Payout Verification](../spec/06-ocr-payout-verification.md#flow),
plus an unnumbered Recipient section between steps 2 and 3 (identity
capture isn't part of the OCR/verification procedure itself, so it isn't
folded into the numbering):

### 1. Provider & Screenshot
- Provider dropdown — **KBZ Bank**, **Wave Money**, **AYA Bank**, **CB
  Bank**, **True Money**, and further providers as they're onboarded —
  picked by the teller up front rather than auto-detected, since
  anchoring OCR rules on a known provider layout is far more reliable
  (per the OCR spec's rationale). A dropdown replaces the earlier
  two-option toggle so the control scales as more banks/wallets are
  added, without needing a redesign each time — also brings this screen
  in line with [OCR & Payout Verification](../spec/06-ocr-payout-verification.md#flow),
  which already describes provider selection as a dropdown.
- Dropzone showing the uploaded screenshot (filename, "Uploaded · OCR
  complete" status) with a "Replace" action for re-upload.

### 2. Verify Extracted Fields
Each OCR-sourced field carries a small green "OCR" badge (sparkle icon)
and a highlighted (`$brand-light`) border, visually distinguishing
machine-filled fields from manually-entered ones:

| Field | OCR-sourced? |
|---|---|
| Amount (MMK) | Yes |
| External Reference No. | Yes |
| Transfer Date/Time | Yes |
| Into Account | No — dropdown, teller confirms which of our accounts received it |
| Sender Name (from transfer) | Yes — flagged with an inline warning: "Burmese-script OCR is less reliable — double-check against the screenshot," per the spec's note that Burmese-script OCR accuracy is weaker than numerals/Latin text |

This directly implements the spec's core rule: **OCR output never
auto-submits** — every field is editable and teller-reviewed before save.

### Recipient (walk-in customer)

A second identity section, added below Sender — mirrors the
[Send create form's](12-send-new-screen.md#form-card-sections) Sender +
Recipient pattern. `Sender Name` (OCR-sourced, above) is whoever
transferred the money in from elsewhere; **Recipient Name** and
**Recipient Phone** are who actually walks in and collects the cash —
two distinct people, both worth capturing. Neither recipient field comes
from the screenshot (the walk-in customer isn't on it), so both are
plain manually-entered fields, laid out in the same row as **Fee (MMK)**
to keep the form's total height in check.

### 3. Confirm
A single checkbox-style confirmation: "I independently checked the
bank/wallet app (not just this screenshot) and confirmed the transfer
actually landed." This encodes step 8 of the OCR spec's flow — the
independent verification step that exists specifically because a
screenshot alone is not trustworthy evidence.

**Actions**: Cancel / "Save as Pending" — same as Send, this always lands
as `PENDING` first (awaiting the independent verification above), then
transitions to `COMPLETED` once cash is paid out.

## Side column

**Duplicate Warning** (`$error` bordered, shown conditionally): "Possible
duplicate reference — WM2408241 was already used on a completed payout
(PYT-8790, 12 Aug). You can still proceed at your judgment." Implements
the **duplicate external reference guardrail** from
[Transactions & Lifecycle](../spec/04-transactions-lifecycle.md#fraud/data-integrity-guardrails-non-blocking-by-design) —
non-blocking by design, teller judgment overrides.

**Guide Card**: a numbered 3-step reminder of the payout flow (upload →
verify → pay & complete), reinforcing the procedure without requiring the
teller to leave the form.

## Open questions

- **OCR rule coverage per provider.** [OCR & Payout Verification](../spec/06-ocr-payout-verification.md#open)
  notes that anchor keywords/regex only exist for KBZ and Wave so far.
  Widening the provider dropdown to AYA Bank, CB Bank, True Money, etc.
  means those newly-listed providers won't actually prefill anything in
  [Verify Extracted Fields](#2-verify-extracted-fields) until their own
  parsing rules are built — worth deciding whether to hide/label
  unsupported providers as "manual entry only" until then, rather than
  silently showing an empty OCR pass.
- Multiple attachments per transaction (e.g. a blurry re-upload followed
  by a clearer one, per [Data Model](../spec/02-data-model.md#transactionattachment))
  aren't represented in the Dropzone — it currently shows only the latest
  upload. Worth a "view all attachments" affordance once that matters.
- On Cancel or successful save, does the flow return to the
  [Payout list](13-payout-screen.md), or somewhere else (e.g. the new
  transaction's detail view once that exists)? Same open question as
  [Send](12-send-new-screen.md#open-questions).
