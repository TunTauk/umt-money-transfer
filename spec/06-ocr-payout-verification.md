# OCR & Payout Verification

## Why this exists

The only mobile-specific requirement in the whole system: a teller
photographs/uploads a screenshot of a transfer confirmation (from the KBZ or
Wave app) so that key fields auto-fill on the Payout form instead of being
typed by hand. This does **not** need a separate installable app — a
mobile-responsive page in the same Next.js app, using a camera-capable file
input, covers it. See [Tech Stack](08-tech-stack.md) for why a separate
React Native/Capacitor app was ruled out.

## Flow

1. Teller starts a new Payout, selects the provider (**KBZ** or **Wave**)
   from a dropdown before/after upload. Asking the teller to pick the
   provider up front, rather than trying to auto-detect it from the image,
   makes rule-matching far more reliable.
2. Teller uploads/photographs the screenshot. File is stored in object
   storage and a `TransactionAttachment` row is created — see
   [Storage & attachments](#storage--attachments) below.
3. Server runs OCR (Tesseract.js, self-hosted — see below) on the image.
4. Provider-specific rules extract fields from the OCR'd text by anchoring
   on known labels (e.g. "Amount", "Transaction ID"/reference no., date) —
   different regex/parsing rules per provider, since KBZ and Wave screens
   are laid out differently. Raw OCR text and the extracted fields are
   saved on the `TransactionAttachment` row (`ocr_raw_text`,
   `ocr_extracted_fields`) as a snapshot of what OCR actually produced.
5. Extracted fields prefill the Payout form: amount, `external_reference_no`,
   date/time. Sender name (often Burmese script) is prefilled best-effort
   but expected to need manual correction — OCR accuracy on Burmese script
   is weaker than on numerals/Latin text.
6. Teller reviews every field against the actual screenshot before
   proceeding — **OCR output never auto-submits**.
7. Transaction is saved as `PENDING`.
8. Teller independently confirms the transfer actually landed in the
   relevant account (checking the bank/wallet app or an SMS notification —
   not just trusting the uploaded screenshot).
9. Teller pays out cash, marks `COMPLETED`.

## Storage & attachments

The uploaded image and its OCR output are **not** stored as columns on
`Transaction` — they live in a separate `TransactionAttachment` table (see
[Data Model](02-data-model.md#transactionattachment)), one-to-many from
Transaction. Reasons: a re-upload shouldn't overwrite/lose the first
attempt, OCR metadata (raw text, confidence, extracted-fields snapshot) is
about the evidence rather than the transaction fact, and keeping the two
separate makes it possible to later compare what OCR extracted against what
the teller actually entered — useful both for improving the parsing rules
and as a fraud signal if the two diverge significantly.

Image files are stored in **S3-compatible object storage** (e.g. Cloudflare
R2 or AWS S3) rather than local disk — durability matters for evidence tied
to a financial record, and object storage survives server loss without a
separate backup process. Only the OCR processing itself is self-hosted
(Tesseract.js); the files just need durable storage, not a paid API.

## OCR engine: Tesseract.js (self-hosted), not a paid API

- **Free** — open source, no API key, no per-call billing, no usage cap.
  Runs on our own server as part of the Node process.
- **Private** — screenshots contain customer names, phone numbers, and
  amounts. Keeping OCR in-house means that data never leaves our
  infrastructure, unlike sending every image to a third-party cloud OCR API
  (Google Vision, AWS Textract, Azure).
- **Tradeoff accepted**: lower accuracy than a cloud API, particularly on
  Burmese script. Acceptable because OCR is only ever prefilling a form a
  human reviews before confirming — never a source of truth on its own.

## Fraud guardrail: duplicate reference number

If a completed Payout already used the same `external_reference_no` as the
one being entered, the system warns (does not block — see
[Transactions & Lifecycle](04-transactions-lifecycle.md) for why this and
the insufficient-balance check were deliberately left as warnings rather
than hard blocks). This catches the same real transfer being used to claim
a second payout.

## OPEN

- Exact anchor keywords/regex per provider (KBZ vs. Wave) need to be built
  against real sample screenshots once available — not designed sight
  unseen.
