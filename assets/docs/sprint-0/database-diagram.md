## Database Diagram (ERD) — Vellum

This document describes the logical database schema for the Vellum system.
The schema is designed to support versioned file reviews, structured approval workflows, role-based access control, and auditability.

The database uses a **relational model** to enforce data integrity and maintain clear relationships between users, files, versions, comments, and approval history.

---

## Entity Overview

The core entities in the system are:

* User
* File
* FileVersion
* Comment
* ApprovalHistory

---

## 1. User

Represents an authenticated system user.

**Fields:**

* `id` (PK)
* `email` (unique)
* `password_hash`
* `role` (DESIGNER, REVIEWER, ADMIN)
* `is_active`
* `created_at`
* `updated_at`

**Notes:**

* Roles are enforced at the application layer via RBAC.
* Passwords are stored as secure hashes only.

---

## 2. File

Represents a logical file under review (independent of versions).

**Fields:**

* `id` (PK)
* `name`
* `mime_type`
* `extension`
* `size_bytes`
* `status` (PENDING_REVIEW, CHANGES_REQUESTED, APPROVED)
* `current_version_id` (FK → FileVersion.id)
* `created_by` (FK → User.id)
* `created_at`
* `updated_at`

**Notes:**

* A File always has exactly one current version.
* Approval status is stored at the File level.
* File metadata applies to the current version.

---

## 3. FileVersion

Represents an immutable snapshot of a file at a point in time.

**Fields:**

* `id` (PK)
* `file_id` (FK → File.id)
* `version_number`
* `file_path` or `file_url`
* `created_at`

**Notes:**

* Versions are immutable once created.
* Version numbers are sequential per file.
* Historical versions are preserved for auditability.

---

## 4. Comment

Represents feedback left on a specific file version.

**Fields:**

* `id` (PK)
* `file_id` (FK → File.id)
* `file_version_id` (FK → FileVersion.id)
* `author_id` (FK → User.id)
* `body`
* `created_at`

**Notes:**

* Comments are always associated with a specific version.
* This prevents ambiguity when files change over time.

---

## 5. ApprovalHistory

Represents an audit log of approval state transitions.

**Fields:**

* `id` (PK)
* `file_id` (FK → File.id)
* `file_version_id` (FK → FileVersion.id)
* `from_status`
* `to_status`
* `changed_by` (FK → User.id)
* `changed_at`

**Notes:**

* Approval history is append-only.
* Enables traceability of decisions over time.
* Supports compliance and debugging use cases.

---

## Relationships Summary

* A **User** can create many **Files**
* A **File** has many **FileVersions**
* A **File** has exactly one **current FileVersion**
* A **FileVersion** belongs to one **File**
* A **Comment** belongs to one **FileVersion**
* A **User** can create many **Comments**
* A **File** has many **ApprovalHistory** records
* A **User** can perform many **ApprovalHistory** actions

---

## ERD Summary (Textual)

```
User ──< File ──< FileVersion
  │         │
  │         ├─< Comment
  │         │
  │         └─< ApprovalHistory
```

---

## Design Rationale

* Relational modeling ensures strong consistency and referential integrity.
* Versioning is explicit and immutable.
* Approval is treated as structured system data.
* The schema supports future enhancements without breaking existing data.

---

## Notes

* This ERD represents the logical design for Sprint 0.
* Physical implementation details (indexes, constraints) will be refined during implementation.
* The schema directly maps to the API contracts and use cases defined in earlier documents.