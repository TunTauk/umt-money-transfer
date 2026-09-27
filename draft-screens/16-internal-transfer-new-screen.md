# Internal Transfer Screen - New

Design reference: [`design/design.pen`](../design/design.pen), node `YWNBw`.

## Access And Form

Owner only. The selected `BANK` or `CASH` tab fixes the type for the operation.

| Field | Rule |
|---|---|
| Direction | `Main -> Child` or `Child -> Main` |
| Child | Active child selector for the selected type |
| Amount | Positive MMK amount |
| Note | Optional |

The matching main account is implied and cannot be changed. Child-to-child,
Bank-to-Cash, and Cash-to-Bank transfers are unavailable. **Transfer** posts the
balanced entries immediately and atomically; there is no transaction status or
later Complete action.
