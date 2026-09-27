# Overview & Terminology

## Business

UMT is a single-location Myanmar money-transfer shop with two customer flows.
Both record the customer's name, required phone, one amount, a fee and its
mode, an optional note, and one selected `BANK` or `CASH` account. The system
generates the compact Cash In/Out ID, a separate reference, and the posting
timestamp.

### Cash In

The selected account decreases by the amount. Posting credits the selected
account by the amount and debits Customer Clearing. The fee uses one of two
modes: **DEDUCTED** (ပမာဏမှ ဖျတ်မည်) is netted inside the transfer;
**SEPARATE** (သီးသန့်ပေးမည်) is collected from a fee account. Either way Fee
Income is credited by the fee.

### Cash Out

The selected account increases by the amount in `SEPARATE` mode and by amount +
fee in `DEDUCTED` mode. Posting debits the selected account and credits Customer
Clearing; fee handling uses the same two modes as Cash In.

Screens and business language use **Cash In** and **Cash Out**. Legacy file
names may still contain "deposit" or "withdrawal" only to preserve links.

## Access Channels

- Owners use the website. The website rejects Teller sign-in and protects all
  dashboard routes with the Owner role.
- Tellers use the mobile experience. It is limited to assigned-account
  balances, Cash In/Out creation and viewing, an operational summary, and the
  Teller's profile.

## Financial Accounts

UMT has exactly two independent real main accounts:

- **Main Bank** (`BANK`)
- **Main Cash** (`CASH`)

Each type initially has four child accounts and can gain more. A main balance
is its own ledger balance; it does not include child balances. Child Bank total
and child Cash total are separately aggregated from active and historical
child account ledger balances as applicable to the report.

The dashboard shows the independent main balance, child total, and category
total for Bank and Cash, plus a grand total across both categories.

Each Teller has exactly one active child Bank assignment and exactly one
active child Cash assignment. A child account can be assigned to at most two
staff. Owners manage assignments from Account management. Main accounts cannot
be assigned.

## Internal Operations

- **Internal Transfer:** owner-only movement within one type, either Main to
  Child or Child to Main. Bank and Cash are never mixed by this operation.
- **Capital:** owner-only deposit to or withdrawal from the main account that
  matches the selected Bank or Cash tab.

All financial operations post immediately and atomically. Corrections preserve
the original ledger history through reversal entries.
