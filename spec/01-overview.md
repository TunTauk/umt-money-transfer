# Overview & Terminology

## The business

A single-location Myanmar money-transfer shop. Two customer-facing services,
both charging a transaction fee:

### Send (customer → elsewhere)

Customer walks in, hands over cash (principal + fee). We transfer the
principal to the recipient's bank/wallet account elsewhere, using one of our
own accounts (e.g. KBZ, Wave) to send it. We keep the fee.

- Burmese: ငွေပို့
- Money movement: Cash in (principal + fee) → one of our accounts out (principal)

### Payout (elsewhere → customer)

Someone elsewhere transfers money into one of our accounts. The recipient
comes to our location; after we verify the transfer actually landed, we pay
them cash (principal minus fee, or principal with fee collected separately —
either way we keep the fee).

- Burmese: ငွေထုတ်
- Money movement: One of our accounts in (principal) → cash out (principal − fee)
- **Highest-risk flow**: paying out cash against a claimed transfer that
  turns out to be fake/already-used is the main fraud exposure in this
  business. See [OCR & Payout Verification](06-ocr-payout-verification.md)
  and the PENDING status in [Transactions & Lifecycle](04-transactions-lifecycle.md).

### Internal Transfer

Moving money between our own accounts (e.g. KBZ #1 → Wave #2), no customer
involved, no fee. Admin/owner only.

### Capital Deposit / Withdrawal

Owner injecting or pulling money from an account or cash drawer (e.g.
funding an account at the start of the day, or withdrawing profit).
Admin/owner only.

## Accounts we hold money in

- **Cash** — the physical cash drawer
- **Bank** — multiple KBZ Bank accounts (and potentially other banks)
- **Wallet** — multiple Wave Money accounts (and potentially other mobile
  wallets)

Each is tracked as an `Account` record with a live, derived balance — see
[Ledger & Accounting](03-ledger-accounting.md).

## Why "Send" / "Payout" and not "Cash-in" / "Cash-out"

"Cash-in/cash-out" gets confusing once you're also using those words for
moving cash into/out of your own bank accounts (a different concept). "Send"
and "Payout" match how customers already understand the service (and how
it's phrased on real money-transfer shop signage in Myanmar: ပို့ငွေ / ထုတ်ငွေ),
and map cleanly to enum values (`SEND`, `PAYOUT`) without ambiguity.
