# Transactions & Lifecycle

## Types

| Type | Who creates it | Fee | Involves customer identity |
|---|---|---|---|
| `DEPOSIT` | Teller or Admin/Owner | Yes | Yes — recipient only, see [Overview](01-overview.md#deposit-cash-in--recipients-account) |
| `WITHDRAWAL` | Teller or Admin/Owner | Yes | Yes — recipient only, see [Overview](01-overview.md#withdrawal-money-already-with-us--cash-out) |
| `INTERNAL_TRANSFER` | Admin/Owner only | No | No |
| `CAPITAL_DEPOSIT` | Admin/Owner only | No | No |
| `CAPITAL_WITHDRAWAL` | Admin/Owner only | No | No |

Note the naming overlap: `WITHDRAWAL` (customer-facing, has a fee, has a
recipient) and `CAPITAL_WITHDRAWAL` (owner pulling their own money, no fee,
no customer) are distinct enum values, but share a root word — same for
`DEPOSIT`/`CAPITAL_DEPOSIT`. See the naming note in
[Overview](01-overview.md#deposit-cash-in--recipients-account).

## Statuses

| Status | Meaning | Ledger impact |
|---|---|---|
| `PENDING` | Created but not finalized. For Withdrawal: awaiting confirmation the incoming transfer actually cleared. For Deposit: awaiting the outbound wire being sent. | None |
| `COMPLETED` | Money has actually moved both ways; receipt issued. | Ledger entries posted |
| `CANCELLED` | Stopped before completion — never happened. | None (record kept for history) |
| `VOIDED` | Was `COMPLETED`, later found wrong and reversed. | Reversing entries posted; original entries untouched |

Only `COMPLETED` transactions post to the ledger. This keeps balance math
simple (no partial/two-phase postings), at the cost of a small window where
a teller may be physically holding cash for a still-`PENDING` transaction
that the system doesn't count yet — closes as soon as it's marked
`COMPLETED`.

## Why PENDING matters most for Withdrawal

The dangerous moment: a customer claims a transfer was sent and shows a
screenshot. If cash is paid out immediately and the screenshot is
fake/edited/reused, that cash is gone with no recourse. Flow:

1. Teller uploads screenshot → OCR prefills the form → saved as `PENDING`.
2. Teller actually checks the account (bank app / SMS notification) and
   confirms the money is really there.
3. Teller pays cash, marks `COMPLETED`.

## Transitions & permissions

| Transition | Teller | Admin/Owner |
|---|---|---|
| Create → `PENDING` (Deposit/Withdrawal) | ✅ | ✅ |
| Create → `PENDING` (Internal Transfer, Capital Deposit/Withdrawal) | ❌ | ✅ |
| Edit fields of own `PENDING` transaction | ✅ (own only) | ✅ (any) |
| `PENDING` → `COMPLETED` | ✅ | ✅ |
| `PENDING` → `CANCELLED` | ❌ | ✅ |
| `COMPLETED` → `VOIDED` | ❌ | ✅ |

**Why cancel is admin/owner only, not just at PENDING→COMPLETED:** a teller
who could freely cancel their own pending transaction could also collect
real cash from a customer, then cancel the transaction to erase the record
and keep the cash — no ledger trace exists for a `PENDING` transaction, so
cancelling it removes the only record that it ever happened. Restricting
cancel to admin/owner closes that hole. Editing a `PENDING` transaction's
*fields* (not its status) is still allowed for tellers, since that's about
fixing their own mistake on the way to completing it, not making it
disappear.

**Operational implication:** since this control only works if someone
actually looks, the admin console should surface a **pending transactions
view sorted by age**, so a stale `PENDING` transaction (possible sign of
cash collected but not reported) gets noticed.

## Fraud/data-integrity guardrails (non-blocking, by design)

Two checks were deliberately made **warnings, not hard blocks** — the team
preferred trusting staff judgment over rigid rules that could get in the way
of real edge cases:

- **Insufficient balance**: completing a transaction that would take an
  account's recorded balance negative shows a warning but is still allowed.
- **Duplicate external reference**: completing a Deposit or Withdrawal
  whose OCR'd `external_reference_no` matches one already used on a
  completed transaction shows a warning but the teller can proceed at
  their own judgment.

## OPEN

- No fixed compliance/KYC amount threshold is enforced (e.g. "require NRC
  above X kyat"). Use the transaction `note` field for anything relevant
  until/unless a specific rule needs to be encoded.
