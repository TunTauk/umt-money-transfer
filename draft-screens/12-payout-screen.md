# Payout Screen

Design reference: [`design/design.pen`](../design/design.pen) — two nodes:
`h6DRsc` ("Payout - List") and `pu68x` ("Payout - New"). Both use the
shared shell components `MYYNH` ("Sidebar") and `MwM47` ("Topbar"),
instanced with the "Payout" nav item active.

## Purpose

CRUD surface for `PAYOUT` transactions — someone elsewhere transfers
money into one of our accounts, we verify it landed, then pay the
recipient cash. See [Overview](01-overview.md#payout-elsewhere--customer)
for the business definition — this is called out there as the
**highest-risk flow** in the business, since paying cash against a
claimed transfer that turns out to be fake/already-used is the main fraud
exposure. Creatable by Teller or Admin/Owner (see
[Transactions & Lifecycle](04-transactions-lifecycle.md#types)).

## List view (`h6DRsc`)

### Page header
- Title "Payout Transactions", subtitle describing the flow.
- Primary button "New Payout" → opens the create form.

### Filter bar
Search box plus four filter chips: **Status**, **Date range**,
**Account**, **Created by** — scoped implicitly to `type = PAYOUT`,
matching the pattern used on the [Send screen](11-send-screen.md#filter-bar).

### Table columns

| Column | Content |
|---|---|
| Reference | Internal `reference_no`, e.g. `PYT-8821` (brand-colored) |
| Customer | Recipient name (who walks in and gets paid) |
| Source | The account the incoming transfer landed in |
| Status | Badge — Pending / Completed / Cancelled / Voided |
| Created by | Staff name |
| — | Row actions (`ellipsis` menu) |

`external_reference_no` was originally shown as its own column here but
was dropped — it's already surfaced prominently on the create/verify form
(with the duplicate-reference guardrail live at entry time), so repeating
it in the list added width without adding a decision the teller makes
from the list view. It remains on `TransactionAttachment` /
`Transaction.external_reference_no` in the data model and is searchable
from the [global Transactions screen](../spec/07-search-filter.md#free-text-search)
if someone needs to look it up later.

## Create form — "New Payout" (`pu68x`)

Two-column layout: form card (flexible width) + a 320px side column with
a duplicate-reference warning and a flow guide. Structured as three
numbered sections, mirroring the actual procedure from
[OCR & Payout Verification](06-ocr-payout-verification.md#flow):

### 1. Provider & Screenshot
- Provider toggle — **KBZ Bank** / **Wave Money** — picked by the teller
  up front rather than auto-detected, since anchoring OCR rules on a
  known provider layout is far more reliable (per the OCR spec's
  rationale).
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
| Sender Name | Yes — flagged with an inline warning: "Burmese-script OCR is less reliable — double-check against the screenshot," per the spec's note that Burmese-script OCR accuracy is weaker than numerals/Latin text |
| Into Account | No — dropdown, teller confirms which of our accounts received it |
| Fee (MMK) | No — manually entered |

This directly implements the spec's core rule: **OCR output never
auto-submits** — every field is editable and teller-reviewed before save.

### 3. Confirm
A single checkbox-style confirmation: "I independently checked the
bank/wallet app (not just this screenshot) and confirmed the transfer
actually landed." This encodes step 8 of the OCR spec's flow — the
independent verification step that exists specifically because a
screenshot alone is not trustworthy evidence.

**Actions**: Cancel / "Save as Pending" — same as Send, this always lands
as `PENDING` first (awaiting the independent verification above), then
transitions to `COMPLETED` once cash is paid out.

### Side column

**Duplicate Warning** (`$error` bordered, shown conditionally): "Possible
duplicate reference — WM2408241 was already used on a completed payout
(PYT-8790, 12 Aug). You can still proceed at your judgment." Implements
the **duplicate external reference guardrail** from
[Transactions & Lifecycle](04-transactions-lifecycle.md#fraud/data-integrity-guardrails-non-blocking-by-design) —
non-blocking by design, teller judgment overrides.

**Guide Card**: a numbered 3-step reminder of the payout flow (upload →
verify → pay & complete), reinforcing the procedure without requiring the
teller to leave the form.

## Open questions

- Row-level detail/edit view isn't designed yet — same gap noted on the
  [Send screen](11-send-screen.md#open-questions).
- Multiple attachments per transaction (e.g. a blurry re-upload followed
  by a clearer one, per [Data Model](02-data-model.md#transactionattachment))
  aren't represented in the Dropzone — it currently shows only the latest
  upload. Worth a "view all attachments" affordance once that matters.
