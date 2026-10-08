# Staff Management Screen - New

Design reference: [`design/design.pen`](../design/design.pen), node `vz3nM`.

## Access And Fields

Owner only.

| Field | Rule |
|---|---|
| Full name | Required |
| Email | Required unique login identifier |
| Role | Teller or Owner |
| Initial password | Owner-set or generated credential |

Customer phone is not a staff login field. Account assignments are not selected
here: the Owner assigns Teller child accounts from Account management. A Teller
cannot be active until exactly one child Bank and one child Cash assignment are
in place.
