## Role Permission Matrix — Model B (Sprint 2)

This document defines the adopted authorization model for Sprint 2.

Model B principle: **Designers are the primary operators with the most day-to-day asset control**, while Admin focuses on system governance and Manager focuses on coordination/oversight.

---

### Roles

- `designer` — primary operator for asset lifecycle and project work.
- `reviewer` — quality gate for review feedback and decisions.
- `manager` — project owner, assignment/coordination, escalation/override.
- `client_reviewer` — external review actor for client-stage approvals only.
- `admin` — superadmin governance for users/roles/system policies.

---

### Backend permissions (current Sprint 2 implementation)

| Capability | designer | reviewer | manager | client_reviewer | admin |
|---|---:|---:|---:|---:|---:|
| List/view assets | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create asset | ✅ | ❌ | ✅ | ❌ | ✅ |
| Edit asset metadata (title/description/type/url) | ✅ | ❌ | ✅ | ❌ | ✅ |
| Reassign owner | ❌ | ❌ | ✅ | ❌ | ✅ |
| Add comment | ✅ | ✅ | ✅ | ✅ | ✅ |
| Delete comment | ✅ | ❌ | ✅ | ❌ | ✅ |
| Create new version | ✅ | ❌ | ✅ | ❌ | ✅ |
| Edit/delete version | ✅ | ❌ | ✅ | ❌ | ✅ |
| Delete asset | ✅ | ❌ | ✅ | ❌ | ✅ |
| View version audit log | ✅ | ❌ | ✅ | ❌ | ✅ |
| Internal status transitions | ✅ | ✅ | ✅ | ❌ | ✅ |
| Client status transitions | ❌ | ❌ | ✅ | ✅ | ✅ |
| User/role management | ❌ | ❌ | ❌ | ❌ | ✅ |

---

### Status transition responsibilities

#### Internal workflow keys

- `draft`
- `in_progress`
- `ready_for_internal_review`
- `in_internal_review`
- `changes_requested_internal`
- `approved_internal`

Allowed roles: `designer`, `reviewer`, `manager`, `admin`

#### Client workflow keys

- `ready_for_client_review`
- `in_client_review`
- `client_changes_requested`
- `approved_client`

Allowed roles: `client_reviewer`, `manager`, `admin`

---

### Notes for future hardening

- Add assignment-aware checks (e.g., reviewer must be assigned to project/stage).
- Add ownership-aware checks (e.g., designer can only edit/delete assets in assigned projects).
- Add immutable approval records for every client/internal approval action.
- Add policy toggles by organization (e.g., “designers can/cannot delete assets”).

