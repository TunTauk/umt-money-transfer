# Login Screen

Design reference: [`design/design.pen`](../design/design.pen), nodes `bi8Au`,
`KgNAx`, and `pZvyt`. The reference may predate this authoritative behavior.

## Purpose

This website form authenticates Owners only. A successful Teller credential is
rejected with a message directing staff to the mobile app, and the created
session is invalidated. Staff authenticate through the separate mobile login.

## Fields And Actions

| Element | Detail |
|---|---|
| Email | Unique staff login identifier |
| Password | Masked credential with show/hide control |
| Sign in | Authenticates an Owner for the website |

Login is email/password, not phone/password. Customer phone remains a Cash In
and Cash Out record field and is not an authentication identifier. There is no
public sign-up. Owners create and disable staff and reset passwords.

Invalid credentials show a generic error. An inactive account shows a
disabled-account message and cannot sign in. Teller credentials show the mobile
app message and cannot access website dashboard routes.
