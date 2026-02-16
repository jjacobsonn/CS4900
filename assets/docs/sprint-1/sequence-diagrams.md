## Sequence Diagrams — Vellum

This document illustrates key interaction flows between the user, frontend client, backend API, and database.
These diagrams describe system behavior for the most critical use cases identified in Sprint 0.

---

## Sequence Diagram 1: Upload New File (Initial Version)

**Use Case:** UC-02 — Upload Asset
**Primary Actor:** Designer

```
Designer
   |
   | 1. Select file + submit upload
   v
Frontend (React)
   |
   | 2. POST /api/files (multipart/form-data)
   v
Backend API (Express)
   |
   | 3. Validate auth + role (DESIGNER)
   | 4. Persist file metadata
   | 5. Create FileVersion v1
   | 6. Set approval status = PENDING_REVIEW
   v
Database (PostgreSQL)
   |
   | 7. Persist File + FileVersion
   v
Backend API
   |
   | 8. Return file + version info
   v
Frontend
   |
   | 9. Display file in list with status
   v
Designer
```

---

## Sequence Diagram 2: Upload Revised File Version

**Use Case:** UC-07 — Upload Revised Asset Version
**Primary Actor:** Designer

```
Designer
   |
   | 1. Upload revised file
   v
Frontend
   |
   | 2. POST /api/files/{fileId}/versions
   v
Backend API
   |
   | 3. Validate auth + role (DESIGNER)
   | 4. Create new immutable FileVersion
   | 5. Mark new version as current
   | 6. Reset approval status = PENDING_REVIEW
   v
Database
   |
   | 7. Persist FileVersion
   | 8. Update File.current_version_id
   v
Backend API
   |
   | 9. Return updated file + version info
   v
Frontend
   |
   | 10. Display updated version and status
   v
Designer
```

---

## Sequence Diagram 3: Review and Approve File

**Use Case:** UC-06 — Update Approval Status
**Primary Actor:** Reviewer

```
Reviewer
   |
   | 1. Select approval action (Approve / Request Changes)
   v
Frontend
   |
   | 2. PATCH /api/files/{fileId}/status
   v
Backend API
   |
   | 3. Validate auth + role (REVIEWER)
   | 4. Validate allowed state transition
   | 5. Update File.status
   | 6. Create ApprovalHistory entry
   v
Database
   |
   | 7. Persist status + approval history
   v
Backend API
   |
   | 8. Return updated approval state
   v
Frontend
   |
   | 9. Update UI with new status
   v
Reviewer
```

---

## Notes

* These sequence diagrams represent logical behavior, not implementation detail.
* All database operations are transactional to ensure consistency.
* Authorization checks are enforced before any state mutation.
* Each sequence maps directly to defined use cases and API contracts.

---

## Design Intent

These diagrams demonstrate:

* Clear separation of concerns
* Structured approval workflows
* Predictable state transitions
* Support for immutable version history

They will guide implementation and unit testing in subsequent sprints.