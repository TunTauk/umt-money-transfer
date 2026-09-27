# Capital Screen - New

Design reference: [`design/design.pen`](../design/design.pen), node `yaGax`.

## Access And Form

Owner only. The selected `BANK` or `CASH` tab fixes the matching main account;
there is no account selector.

| Field | Rule |
|---|---|
| Operation | Deposit or Withdrawal |
| Main account | Read-only Main Bank or Main Cash, based on the active tab |
| Amount | Positive MMK amount |
| Note | Optional |

**Create** posts the capital event and balanced Owner Equity entries immediately
and atomically. There is no pending state or later completion step.
