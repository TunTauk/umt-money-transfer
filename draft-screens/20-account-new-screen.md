# Account Management Screen - New Child

Design reference: [`design/design.pen`](../design/design.pen), node `wwO0x`.
This document supersedes conflicting fields in the static reference.

## Access And Purpose

Owner-only form for expanding the child accounts under Main Bank or Main Cash.
The two main accounts are fixed business accounts and cannot be created here.

| Field | Rule |
|---|---|
| Type | Fixed from the active `BANK` or `CASH` tab |
| Parent | Read-only matching main account |
| Name | Required child account name |
| Provider | Optional; Bank only |
| Account number | Optional; Bank only |
| Active | On by default |

Staff assignment is managed from the child row on Account management, not from
this create form. Creating additional children does not change main balances or
existing assignments.
