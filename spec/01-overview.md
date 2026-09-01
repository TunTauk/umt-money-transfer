# Overview & Terminology

## The business

A single-location Myanmar money-transfer shop. Two customer-facing services,
both charging a transaction fee:

### Deposit (cash in → recipient's account)

A walk-in hands over cash (principal + fee); we put the principal into the
**recipient's** bank/wallet account elsewhere, using one of our own accounts
(e.g. KBZ, Wave) to send it. We keep the fee.

This isn't framed as a transfer between two named people — only the
recipient (whose account receives the money) is recorded as a party on the
transaction. Whoever physically handed over the cash isn't tracked as a
formal identity; see [Why "Deposit"/"Withdrawal"](#why-deposit--withdrawal-and-not-send--payout)
below for the reasoning.

- Burmese: ငွေပို့
- Money movement: Cash in (principal + fee) → one of our accounts out (principal)

### Withdrawal (money already with us → cash out)

Someone has already transferred money into one of our accounts. A recipient
comes to our location; after we verify the transfer actually landed, we pay
them cash (principal minus fee, or principal with fee collected separately —
either way we keep the fee).

As with Deposit, only one party is recorded: the recipient collecting cash.
Whoever originally sent the money in isn't tracked as a formal identity —
the transaction's link to reality is the transfer's own reference number
and amount, verified against the screenshot, not a person's name.

- Burmese: ငွေထုတ်
- Money movement: One of our accounts in (principal) → cash out (principal − fee)
- **Highest-risk flow**: paying out cash against a claimed transfer that
  turns out to be fake/already-used is the main fraud exposure in this
  business. See [OCR & Verification](06-ocr-verification.md)
  and the PENDING status in [Transactions & Lifecycle](04-transactions-lifecycle.md).

**Naming note**: `DEPOSIT`/`WITHDRAWAL` are also used below for
[Capital Deposit / Withdrawal](#capital-deposit--withdrawal), a completely
different, internal-only transaction type. The two aren't the same enum
value (`DEPOSIT` vs `CAPITAL_DEPOSIT`) and shouldn't collide in code, but
the shared vocabulary is worth flagging — worth double-checking that staff
don't confuse "a Deposit" (customer-facing, has a fee, has a recipient)
with "a Capital Deposit" (owner injecting their own money, no fee, no
customer) in conversation or training material.

### Internal Transfer

Moving money between our own accounts (e.g. KBZ #1 → Wave #2), no customer
involved, no fee. Admin/owner only.

### Capital Deposit / Withdrawal

Owner injecting or pulling money from an account or cash drawer (e.g.
funding an account at the start of the day, or withdrawing profit).
Admin/owner only.

## Accounts we hold money in

- **Cash** — the physical cash drawer
- **Bank** — multiple KBZ Bank accounts, Wave Money accounts, and
  potentially other banks or mobile wallets. Mobile wallets aren't a
  separate `Account.type` — they're `BANK` too, distinguished only by
  `provider` (e.g. "Wave Money" vs "KBZ Bank"), since the two behave
  identically in every flow (Deposit, Withdrawal, ledger posting, account
  pickers).

Each is tracked as an `Account` record with a live, derived balance — see
[Ledger & Accounting](03-ledger-accounting.md).

## Why "Deposit" / "Withdrawal" and not "Send" / "Payout"

Originally named "Send"/"Payout," matching how customers hear about the
service and how it's phrased on real money-transfer shop signage in Myanmar
(ပို့ငွေ / ထုတ်ငွေ). Renamed because "Send" implies a transfer *between two
named people* ("this person sends to that person"), which doesn't match
what the system actually records: only one party's identity is ever
captured (the recipient — see [Deposit](#deposit-cash-in--recipients-account)
and [Withdrawal](#withdrawal-money-already-with-us--cash-out) above), not
two. "Deposit" (money going into one recipient's account) and "Withdrawal"
(cash coming out against money already with us) describe a one-party
movement accurately, where "Send"/"Payout" implied a second party that was
never actually tracked.

"Cash-in/cash-out" was considered and rejected for the same reason it was
originally: those words are also used for moving cash into/out of your own
bank accounts (a different concept, e.g. Capital Deposit/Withdrawal), so
reusing them here would be ambiguous.
