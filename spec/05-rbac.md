# RBAC

Two roles: `TELLER`, `OWNER` (admin/owner — same role, full access). No
granular permissions table — two roles is simple enough to check directly
in route/API handlers rather than building a general permissions system.

| Capability | Teller | Admin/Owner |
|---|---|---|
| Create Cash In / Cash Out | ✅ | ✅ |
| Edit own `PENDING` transaction | ✅ (own only) | ✅ (any) |
| `PENDING` → `COMPLETED` | ✅ | ✅ |
| View account balances | ✅ | ✅ |
| View own transaction history | ✅ | ✅ (all staff) |
| `PENDING` → `CANCELLED` | ❌ | ✅ |
| `COMPLETED` → `VOIDED` | ❌ | ✅ |
| Internal Transfer | ❌ | ✅ |
| Capital Deposit / Withdrawal | ❌ | ✅ |
| Manage accounts (add/edit/deactivate KBZ/Wave/Cash) | ❌ | ✅ |
| Manage staff logins (create/disable teller, reset password) | ❌ | ✅ |
| Summary report (totals across accounts + cash, fee profit) | ❌ | ✅ |
| Filter transaction list by staff member (see [Search & Filter](07-search-filter.md)) | ❌ | ✅ |

Rationale for the split is covered inline where each decision was made — see
[Transactions & Lifecycle](04-transactions-lifecycle.md) for why cancel/void
specifically are admin-only.
