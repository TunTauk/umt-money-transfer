# User Management Screen — New

Design reference: [`design/design.pen`](../design/design.pen), node
`vz3nM` ("Add Staff (Modal)"). A centered modal (460px) over a dimmed
backdrop, opened from the "Add Staff" button on
[User Management Screen — List](21-user-management-screen.md). Previously
that button had nowhere to go — this screen fills that gap.

## Purpose

Create form for a `User` (staff account) — Owner or Teller. Owner only,
per the "Manage staff logins (create/disable teller, reset password)" row
in [RBAC](../spec/05-rbac.md), which is Owner-exclusive with no Teller
access at all. See [Data Model](../spec/02-data-model.md#user) for the
underlying fields.

Same modal pattern as
[Internal Transfer](16-internal-transfer-new-screen.md#modal-contents),
[Capital](18-capital-new-screen.md#modal-contents), and
[Account](20-account-new-screen.md#modal-contents) — few enough fields
that a full page isn't warranted.

## Modal contents

| Element | Detail |
|---|---|
| Title | "Add Staff", with a close (`x`) icon |
| Full Name | Free text |
| Phone Number | Free text, phone icon — this is the login identifier per [Data Model](../spec/02-data-model.md#user); there is no email field anywhere on `User` |
| Role | Two-way toggle: **Teller** (active by default) / **Owner** — Teller is the default selection since it's expected to be the far more common case; owner accounts should be rare |
| Initial Password | Text field with a **Generate** action — since there's no self-service signup, the owner sets (or generates) the starting password directly |
| Note | Informational banner: "Share this password with the staff member directly — there's no email to send it to." — makes explicit, at the moment of creation, that password delivery is entirely manual |
| Actions | Cancel / "Add Staff" |

The password field and its note directly address the gap flagged on the
[Login screen](09-login-screen.md#open-questions): since there's no
self-service reset, this modal is where a new teller's very first
password actually originates, and the note exists so the owner doesn't
create the account and forget the teller still needs the password handed
to them some other way (in person, over the phone, etc.).

## Open questions

- Whether this same modal serves **Edit** (presumably from the list's
  `ellipsis` menu) is unconfirmed — an edit flow wouldn't show the
  Initial Password field (that's what "Reset password" on the list is
  for, per
  [User Management Screen — List](21-user-management-screen.md#open-questions)),
  so Edit likely needs a lighter variant of this same modal rather than
  reusing it outright.
- Whether role can be changed after creation (promote/demote) isn't
  decided — same open question carried over from the list doc.
- Password generation behavior (character set, length, whether it's
  guaranteed to satisfy any future password policy) isn't specified.
