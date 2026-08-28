# Login Screen

Design reference: [`design/design.pen`](../design/design.pen), node `bi8Au`
("Login - Default"). Two additional states exist on the same canvas:
`KgNAx` ("Login - Error State") and `pZvyt` ("Login - Disabled Account").

## Purpose

Staff authentication entry point for the admin console. Single form, no
role branching at this stage — `OWNER` and `TELLER` share the same login
screen; role determines what they see after signing in (see
[RBAC](../spec/05-rbac.md)).

## Layout

Two-panel, full-bleed (1440×1024 desktop reference):

- **Brand panel** (left, 560px, `$brand-dark` background) — wordmark,
  headline ("Send and receive with confidence."), one-line product
  description, and a footer line ("Staff access only · MMK") with a
  shield icon.
- **Form panel** (right, fills remaining width, `$bg` background) —
  centered 400px-wide login card.

## Login card contents

| Element | Detail |
|---|---|
| Title | "Sign in" |
| Subtitle | "Enter your phone number and password to continue." |
| Phone number field | Label + input with leading phone icon, placeholder `09xxxxxxxxx` |
| Password field | Label + input with leading lock icon and trailing show/hide (`eye-off`) icon, masked placeholder |
| Submit button | Full-width "Sign in", `$brand` fill |

**Phone number, not email** — matches the data model
([`User.phone`](../spec/02-data-model.md#user) is the login identifier; there is
no email field), so password recovery is admin-mediated rather than a
self-service email reset link. The screen no longer surfaces this path
directly (the "Forgot your password? Contact your admin to reset it."
help row was removed) — see Open Questions below.

## States

### Default
Empty fields, neutral borders, no messaging.

### Error — invalid credentials (`KgNAx`)
- Red-bordered inputs (`$error` stroke) on both fields.
- Error banner above the fields: "Incorrect phone number or password.
  Please try again." (`$error` text on `$error-bg`, `circle-alert` icon).
- Field values are retained (not cleared) so the user can see what they
  typed.

### Disabled account (`pZvyt`)
Distinct from a bad password — reflects `User.active = false`
([Data Model](../spec/02-data-model.md#user): "disabled accounts can't log in").
- Fields keep neutral (non-error) borders — the credentials themselves
  weren't wrong.
- Banner copy: "This account has been disabled. Contact your admin to
  restore access." (`ban` icon instead of `circle-alert`).
- Submit button rendered in a muted/disabled visual state
  (`$text-tertiary` fill).

## Design tokens used

| Token | Value | Usage |
|---|---|---|
| `$brand-dark` | `#0B3B2E` | Brand panel background |
| `$brand` | `#0F6D4E` | Primary button, links |
| `$brand-light` | `#3FA980` | Logo mark background |
| `$bg` | `#F7F8F7` | Form panel background |
| `$surface` | `#FFFFFF` | Input backgrounds |
| `$text-primary` | `#121815` | Headings, labels, typed values |
| `$text-secondary` | `#667169` | Subtext, help copy |
| `$text-tertiary` | `#9AA39C` | Placeholders, icons |
| `$border` | `#E1E5E1` | Default input border |
| `$error` | `#C4331F` | Error state border/text |
| `$error-bg` | `#FCEEEC` | Error banner background |
| `$font` | Inter | All text |

## Open questions

- **No visible password-recovery path.** The "Forgot your password?
  Contact your admin to reset it." help row was removed from all three
  states. Since there's no self-service reset (no email field, per
  [Data Model](../spec/02-data-model.md#user)), a locked-out teller now
  has no on-screen guidance at all — recovery relies entirely on knowing
  to go find the owner, who resets it from the
  [User Management screen](21-user-management-screen.md#reset-password).
  Confirm this is intentional, or that guidance exists elsewhere
  (physical signage, onboarding, etc.).
- Session mechanism (cookie vs. JWT) — not a design concern but affects
  whether "remember me" belongs on this screen.
- Rate limiting / lockout after repeated failed attempts is not yet
  reflected in any state — worth a fourth state if/when that's decided.
