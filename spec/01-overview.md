# Overview & Terminology

## The business

A single-location Myanmar money-transfer shop. Two customer-facing services,
both charging a transaction fee:

### Cash In

A walk-in hands over cash (principal + fee); we put the principal into the
**recipient's** bank/wallet account elsewhere, using one of our own accounts
(e.g. KBZ, Wave) to send it. We keep the fee.

This isn't framed as a transfer between two named people — only the
recipient (whose account receives the money) is recorded as a party on the
transaction. Whoever physically handed over the cash isn't tracked as a
formal identity; see [Why "Cash In"/"Cash Out"](#why-cash-in--cash-out-and-not-deposit--withdrawal-and-not-send--payout)
below for the reasoning.

- Burmese: ငွေပို့
- Money movement: Cash in (principal + fee) → one of our accounts out (principal)

### Cash Out

Someone has already transferred money into one of our accounts. A recipient
comes to our location; after we verify the transfer actually landed, we pay
them cash (principal minus fee, or principal with fee collected separately —
either way we keep the fee).

As with Cash In, only one party is recorded: the recipient collecting cash.
Whoever originally sent the money in isn't tracked as a formal identity —
the transaction's link to reality is the transfer's own reference number
and amount, verified against the screenshot, not a person's name.

- Burmese: ငွေထုတ်
- Money movement: One of our accounts in (principal) → cash out (principal − fee)
- **Highest-risk flow**: paying out cash against a claimed transfer that
  turns out to be fake/already-used is the main fraud exposure in this
  business. See [OCR & Verification](06-ocr-verification.md)
  and the PENDING status in [Transactions & Lifecycle](04-transactions-lifecycle.md).

**Naming note**: this type was briefly called `DEPOSIT`, which collided
with the unrelated, internal-only
[Capital Deposit / Withdrawal](#capital-deposit--withdrawal) type —
`DEPOSIT` (customer-facing) and `CAPITAL_DEPOSIT` (owner-only) share a
root word despite being distinct enum values. Renamed to `CASH_IN` to
remove that overlap entirely; see
[Why "Cash In"/"Cash Out"](#why-cash-in--cash-out-and-not-deposit--withdrawal-and-not-send--payout)
below for the full history.

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
  identically in every flow (Cash In, Cash Out, ledger posting, account
  pickers).

Each is tracked as an `Account` record with a live, derived balance — see
[Ledger & Accounting](03-ledger-accounting.md).

## Why "Cash In" / "Cash Out" and not "Deposit" / "Withdrawal" and not "Send" / "Payout"

Originally named "Send"/"Payout," matching how customers hear about the
service and how it's phrased on real money-transfer shop signage in Myanmar
(ပို့ငွေ / ထုတ်ငွေ). Renamed to "Deposit"/"Withdrawal" because "Send" implies
a transfer *between two named people* ("this person sends to that
person"), which doesn't match what the system actually records: only one
party's identity is ever captured (the recipient — see
[Cash In](#cash-in) and [Cash Out](#cash-out) above), not two.

Renamed a second time, to "Cash In"/"Cash Out," because "Deposit"/
"Withdrawal" collided with the pre-existing, unrelated
[Capital Deposit / Withdrawal](#capital-deposit--withdrawal) type —
"a Deposit" (customer-facing) and "a Capital Deposit" (owner-only) share a
root word despite being different enum values, which risked confusing
staff in conversation. "Cash In"/"Cash Out" describes the same one-party
movement (money going into one recipient's account / cash coming out
against money already with us) without that overlap — see the
[naming note](#cash-out) above, since `CAPITAL_DEPOSIT`/
`CAPITAL_WITHDRAWAL` kept their original names and only the customer-facing
pair changed.

An earlier draft of this document rejected "cash-in/cash-out" outright, on
the reasoning that those words are also used for moving cash into/out of
your own bank accounts (i.e. Capital Deposit/Withdrawal) and would be
ambiguous. That concern turned out to point at the real problem but the
wrong culprit: the ambiguity was `Deposit`/`Withdrawal` colliding with
`Capital Deposit`/`Capital Withdrawal`, not "cash in"/"cash out" as
phrases — the internal-only type kept the word "Capital" in front of it
throughout, so there's no literal name collision, just a shared root word
worth being deliberate about in staff-facing copy.
