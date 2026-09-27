# RBAC

Two roles exist: `OWNER` and `TELLER`.

| Capability | Teller | Owner |
|---|---|---|
| Log in with email/password | Mobile only | Website only |
| Create Cash In / Cash Out | Choose type; matching assigned child account is read-only | Choose type and any active matching main/child account |
| View Cash In / Cash Out | Assigned-account records, including shared-account records | All records |
| Edit or delete a transaction | No | Yes, through audited reversal rules |
| View dashboard | Assigned-account mobile dashboard | Full website dashboard |
| Accounts | No | Yes |
| Internal Transfer | No | Yes |
| Capital | No | Yes |
| Staff management | No | Yes |
| Summary and reconciliation | Own mobile activity summary only | Full summary and reconciliation |

Owners assign accounts from Account management. Every Teller has exactly one
active child Bank and one active child Cash assignment; each child supports no
more than two staff. Main accounts are never assignable. Cash In/Out access is
scoped to the single selected account; choosing an account type never permits a
Teller to substitute another account.

Website authentication rejects Teller accounts. Mobile navigation does not
expose Owner-only routes or edit/delete controls. A Teller's mobile summary is
informational and scoped to assigned-account activity; it does not include the
Owner's reconciliation workflow.
