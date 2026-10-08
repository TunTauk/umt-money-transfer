# Ledger & Accounting

## Rules

- Every operation posts balanced, immutable ledger entries immediately.
- The business record and all ledger entries commit atomically or all fail.
- Real account balances are derived from ledger entries.
- Main Bank and Main Cash are independent real balances. Neither rolls up its
  children.
- Child Bank and child Cash totals are calculated separately.
- Owner corrections use exact reversal entries; posted history is never edited.

Asset accounts increase on debit and decrease on credit. Customer Clearing,
Fee Income, and Owner Equity are system ledgers, not assignable real accounts.

## Cash In And Cash Out Fees

`amount` is the actual transfer value and `fee` is non-negative; there is no
`fee <= amount` rule. One of two fee modes applies:

- **DEDUCTED** (ပမာဏမှ ဖျတ်မည်): the fee is netted inside the transfer. No
  fee account is used.
- **SEPARATE** (သီးသန့်ပေးမည်): the fee is collected from a separate fee
  account.

A fee account is required only in `SEPARATE` mode with fee > 0. An Owner picks
any active account of the chosen type; a Teller uses the active assigned child
account of that type, enforced by the server.

The selected account always moves by the amount for Cash In (credit) and for
`SEPARATE` Cash Out (debit). In `DEDUCTED` Cash Out the incoming value is
amount + fee, so the selected account is debited by amount + fee while the
customer is paid the amount through Customer Clearing.

## Cash In

For amount K100,000 and fee K2,000.

`DEDUCTED`:

| Account | Side | Amount |
|---|---|---|
| Customer Clearing | Debit | 102,000 |
| Selected account | Credit | 100,000 |
| Fee Income | Credit | 2,000 |

`SEPARATE`:

| Account | Side | Amount |
|---|---|---|
| Customer Clearing | Debit | 100,000 |
| Selected account | Credit | 100,000 |
| Fee account | Debit | 2,000 |
| Fee Income | Credit | 2,000 |

## Cash Out

For amount K100,000 and fee K2,000.

`DEDUCTED`:

| Account | Side | Amount |
|---|---|---|
| Selected account | Debit | 102,000 |
| Customer Clearing | Credit | 100,000 |
| Fee Income | Credit | 2,000 |

`SEPARATE`:

| Account | Side | Amount |
|---|---|---|
| Selected account | Debit | 100,000 |
| Customer Clearing | Credit | 100,000 |
| Fee account | Debit | 2,000 |
| Fee Income | Credit | 2,000 |

A zero fee posts no fee entries and needs no fee account.

## Internal Transfer

An owner selects `BANK` or `CASH`, then Main to Child or Child to Main. Debit
the destination and credit the source by the same amount. Child-to-child,
main-to-main, and Bank-to-Cash transfers are not supported by this operation.

## Capital

Capital Deposit debits the selected type's fixed main account and credits Owner
Equity. Capital Withdrawal reverses those sides. Child accounts cannot be used.

## Edit And Delete

- **Edit:** in one atomic operation, post the exact reversal of the original
  entries and post a corrected replacement record with new balanced entries.
- **Delete:** post the exact reversal, then soft-delete the business record.

Both actions are owner-only and retain actor, time, reason/note, and links
between original, reversal, and replacement records.
