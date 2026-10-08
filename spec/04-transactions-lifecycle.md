# Transactions & Lifecycle

## Creation

| Type | Creator | Posting |
|---|---|---|
| Cash In | Teller or Owner | Immediate and atomic |
| Cash Out | Teller or Owner | Immediate and atomic |
| Internal Transfer | Owner only | Immediate and atomic |
| Capital Deposit / Withdrawal | Owner only | Immediate and atomic |

There is no user-facing `PENDING`, `COMPLETED`, or `CANCELLED` workflow.
Screens must not expose status filters, status columns, Complete actions, or
pending monitoring. A create form has one **Create** action; leaving the form
is ordinary navigation, not a transaction cancellation state.

## Cash In And Cash Out

- Customer phone is required; note is optional.
- The system generates a compact `CI`/`CO` ID, a separate reference, and the
  posting timestamp. There is no external-reference or manual date/time input.
- No screenshot upload, OCR, or verification checkbox is used.
- Each record has one positive amount, a non-negative fee, and one selected
  account. There is no `fee <= amount` rule.
- The fee mode is `DEDUCTED` (ပမာဏမှ ဖျတ်မည်) or `SEPARATE`
  (သီးသန့်ပေးမည်). A fee account is required only for `SEPARATE` with
  fee > 0: Owners pick any active account of the chosen type; the server forces
  a Teller's assigned account of that type.
- Owners choose `BANK` or `CASH`, then one active matching main/child account.
- Tellers choose `BANK` or `CASH`; the matching active assigned child account
  is displayed read-only.

## Visibility And Corrections

Tellers create and view records involving their assigned accounts. If two staff
share a child account, each can view records involving that shared account,
regardless of creator. Tellers cannot edit or delete any posted record.

Owners can view all records. Owner **Edit** means audited reversal plus an
immediate corrected repost. Owner **Delete** means audited reversal plus soft
delete. Both operations are atomic and preserve ledger history.
