# Ledger & Accounting

## Why double-entry

Balances need to be trustworthy and auditable at any moment, without a
separate end-of-day batch job. Storing a live `balance` column and mutating
it on every transaction is how these numbers drift from reality. Instead:

- Every `COMPLETED` transaction posts two or more immutable `LedgerEntry`
  rows that balance (total debits = total credits).
- An account's balance is always `SUM(credits) − SUM(debits)` over its
  entries, computed live.
- Corrections never edit history — a mistake is fixed by voiding (which
  posts a reversing entry) and, if needed, re-entering correctly.

Standard accounting convention used here:

- **Asset accounts** (`Cash`, `Bank`, `Wallet`) increase on **debit**,
  decrease on **credit**.
- **Income accounts** (`Fee Income`) increase on **credit**.

## Worked examples

### Send

Customer hands over K100,000 cash (K98,000 principal + K2,000 fee). We wire
K98,000 out via KBZ #1 to the recipient's account.

| Account | Side | Amount |
|---|---|---|
| Cash | Debit | 100,000 |
| KBZ #1 | Credit | 98,000 |
| Fee Income | Credit | 2,000 |

Debits (100,000) = Credits (98,000 + 2,000). Balanced.

### Payout

Someone wired K100,000 into Wave #2. We verify it landed, then pay the
recipient K98,000 cash and keep K2,000 fee.

| Account | Side | Amount |
|---|---|---|
| Wave #2 | Debit | 100,000 |
| Cash | Credit | 98,000 |
| Fee Income | Credit | 2,000 |

### Internal Transfer

KBZ #1 → Wave #2, K500,000, no fee.

| Account | Side | Amount |
|---|---|---|
| Wave #2 | Debit | 500,000 |
| KBZ #1 | Credit | 500,000 |

### Capital Deposit

Owner deposits K1,000,000 of their own money into KBZ #1 to start the day.

| Account | Side | Amount |
|---|---|---|
| KBZ #1 | Debit | 1,000,000 |
| Owner Equity | Credit | 1,000,000 |

`Owner Equity` is a reporting-only account, same pattern as `Fee Income` —
not real money, just tracks where capital came from/went for reporting.

### Void example

A completed Send (above) turns out to be wrong and is voided. The reversal
posts the exact opposite entries — original entries are untouched:

| Account | Side | Amount |
|---|---|---|
| Cash | Credit | 100,000 |
| KBZ #1 | Debit | 98,000 |
| Fee Income | Debit | 2,000 |

## Reports

- **Live balances** — per account, plus total cash + total across all
  accounts, computed on demand from `LedgerEntry`.
- **Profit** — sum of `Fee Income` credits over a date range.
- **Daily reconciliation** — admin/owner enters the actual counted cash and
  actual bank/wallet app balance for each account; system shows expected
  (from the ledger) vs. actual, and flags variance. This is a check, not a
  correction mechanism — a variance gets investigated, not silently
  adjusted into the ledger.
