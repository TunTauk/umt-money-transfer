# User Management Screen

Design reference: [`design/design.pen`](../design/design.pen), node
`yPc7P` ("Users - List"). Uses the shared shell components `MYYNH`
("Sidebar") and `MwM47` ("Topbar"), instanced with the "Users" nav item
active.

## Purpose

Owner-only screen for managing staff logins — create tellers, disable
accounts, reset passwords. Maps directly to the `User` entity in
[Data Model](02-data-model.md#user) and the "Manage staff logins" row in
[RBAC](05-rbac.md), which is Owner-only, no Teller access at all (not
even to view).

## List view (`yPc7P`)

### Page header
- Title "Staff Users", subtitle: "Manage teller and owner logins. Owner
  only."
- Primary button "Add Staff".

No filter bar or search — staff count is expected to be small (a handful
of tellers plus the owner), so filtering doesn't earn its space here.

### Table columns

| Column | Content |
|---|---|
| Name | Avatar (initials, e.g. "AA") + name |
| Phone | The login identifier — per [Data Model](02-data-model.md#user), there is no email field, phone is the only credential identity |
| Role | Badge — **Owner** (filled `$brand-dark`, white text) vs. **Teller** (outlined, neutral) — the filled treatment for Owner mirrors how few of these accounts should exist and makes them easy to spot in a longer list |
| Status | Dot + "Active"/"Disabled" |
| Created | Account creation date |
| — | "Reset password" (always visible, text link) + row `ellipsis` menu |

### Reset password

Shown as a standing text-link action on every row, not tucked into the
overflow menu — reflects that this is the *only* password-recovery path
in the whole system, since there's no self-service email reset (no email
field exists on `User`). See
[Login screen](09-login-screen.md#phone-number-not-email) for the
front-door side of this: "Forgot your password? Contact your admin to
reset it." This screen is where that contact actually resolves.

### Disabled accounts

Nilar Aye's row shows `Status = Disabled` (grey dot, "Disabled" label,
not the green "Active" dot other rows use) — corresponds to `User.active
= false` in [Data Model](02-data-model.md#user): "disabled accounts can't
log in." A disabled account attempting to log in hits the
[Login screen's disabled-account state](09-login-screen.md#disabled-account-pzvyt).

## Open questions

- **No Add Staff / Edit Staff form designed yet.** Based on the `User`
  fields, it would need: Name, Phone, Role (Owner/Teller), and for
  creation, an initial password (set by the owner, since there's no
  self-service signup). Likely a modal, matching the
  [Internal Transfer](13-internal-transfer-screen.md#create--new-internal-transfer-ywnbw)
  pattern.
- "Reset password" flow isn't designed — does it generate a temporary
  password shown once, send nothing (owner communicates it out-of-band),
  or something else? Affects whether this needs its own confirmation
  modal.
- Row `ellipsis` menu contents (Edit, Disable/Enable) aren't specified —
  Disable in particular should probably confirm, since it immediately
  locks a teller out.
- Whether an owner can demote/promote role after creation, or role is
  fixed at creation time, isn't decided.
