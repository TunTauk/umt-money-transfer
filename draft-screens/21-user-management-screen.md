# Staff Management Screen

Design reference: [`design/design.pen`](../design/design.pen), node `yPc7P`.

## Access And Purpose

Owner only. The screen creates and manages email/password staff logins, roles,
active state, and password resets. Tellers cannot view it.

The list shows name, email, role, active state, assigned child Bank, assigned
child Cash, and account actions. Assignments are read-only links here; the Owner
changes them from Account management.

An active Teller must always have exactly one active child Bank and one active
child Cash assignment. Deactivation preserves transaction and assignment
history. Reactivation requires a valid assignment pair.
