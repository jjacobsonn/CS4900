## Functional Requirements — Vellum

This document defines the core functional capabilities of the Vellum system.
All requirements are written to support fast, mobile-first file reviews, structured approval workflows, and role-based access control.

---

### 1. User Authentication and Authorization

FR-1.1 The system shall allow users to authenticate using secure credentials.

FR-1.2 The system shall enforce role-based access control (RBAC) for all protected actions.

FR-1.3 The system shall support at least three user roles:

* Designer / Contributor
* Creative Reviewer
* Admin / Project Owner

FR-1.4 The system shall restrict approval actions to users with Reviewer or Admin roles.

FR-1.5 The system shall restrict user and role management actions to Admin users only.

---

### 2. File Management

FR-2.1 The system shall allow Designers to upload files of multiple types, including but not limited to:

* Images
* PDFs
* Office documents (e.g., DOCX)
* Text and code files
* CSV and JSON files
* Archive files (e.g., ZIP)

FR-2.2 The system shall associate each file with:

* An owning user
* A creation timestamp
* Original filename
* File type (MIME type)
* File size

FR-2.3 The system shall display a list of files accessible to the authenticated user.

FR-2.4 The system shall allow users to view detailed information for a selected file.

FR-2.5 The system shall allow users to download uploaded files.

---

### 3. File Versioning

FR-3.1 The system shall maintain a version history for each file.

FR-3.2 The system shall designate exactly one version of a file as the current version at any time.

FR-3.3 The system shall allow Designers to upload a new version of an existing file.

FR-3.4 The system shall preserve previous versions as immutable historical records.

FR-3.5 The system shall associate feedback and approval state with a specific file version.

---

### 4. Feedback and Commenting

FR-4.1 The system shall allow Reviewers and Designers to leave comments on files.

FR-4.2 The system shall associate each comment with:

* A specific file
* A specific file version
* The user who created the comment
* A creation timestamp

FR-4.3 The system shall display comments in chronological order within the file detail view.

---

### 5. Approval Workflow

FR-5.1 The system shall model file approval status as structured system data.

FR-5.2 The system shall support the following approval states:

* Pending Review
* Changes Requested
* Approved

FR-5.3 The system shall allow Reviewers and Admins to update a file’s approval status.

FR-5.4 The system shall record approval state changes with user attribution and timestamps.

FR-5.5 The system shall display the current approval state prominently within the file view.

---

### 6. Administrative Management

FR-6.1 The system shall allow Admin users to create, update, and deactivate user accounts.

FR-6.2 The system shall allow Admin users to assign roles to users.

FR-6.3 The system shall provide Admin users with a system-level view of file status across the system.

---

### 7. Mobile-First Access

FR-7.1 The system shall provide full review and approval functionality on mobile devices.

FR-7.2 The system shall allow Reviewers to approve or request changes using a minimal interaction flow suitable for mobile use.

FR-7.3 The system shall provide file previews when supported by the file type and fall back to download-only access when previews are not supported.

---

## Notes

* These functional requirements define the minimum viable system for Sprint 0 planning.
* The system is designed to review **files**, not limited to creative assets.
* File preview support is intentionally lightweight to avoid enterprise bloat.
* Implementation details, validations, and error handling will be refined in subsequent sprints.
* Each functional requirement will be traceable to one or more use cases defined in the Sprint 0 Use Case document.