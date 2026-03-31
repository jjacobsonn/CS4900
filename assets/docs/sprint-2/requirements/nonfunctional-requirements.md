## Non-Functional Requirements — Vellum (Sprint 2)

This document updates the Sprint 0 non-functional requirements to align with the expanded Sprint 2 scope (projects, workflows, roles, and auditability).

It supersedes `assets/docs/sprint-0/nonfunctional-requirements.md` as the current set of non-functional requirements.

---

### 1. Usability

**NFR-1.1** A Reviewer or Client Reviewer shall be able to approve or request changes on an asset version in **three or fewer interactions** from their review queue.  
**NFR-1.2** A user shall be able to leave a comment on an asset version in **three or fewer interactions** on both desktop and mobile devices.  
**NFR-1.3** All primary workflows (view project, view asset, comment, approve, request changes) shall be fully functional on mobile devices without requiring desktop-only features.  
**NFR-1.4** The system shall provide clear and persistent visual indicators of:

- The current status of each asset version.
- Whether a version is the current official version.
- Which stage of the workflow the version is currently in.

**NFR-1.5** The system shall provide role-aware dashboards that show users only the most relevant information and actions by default (e.g., review queue for Reviewers, project overview for Managers).

---

### 2. Performance

Assume a “standard home/office Wi-Fi connection” for performance targets.

**NFR-2.1** The project list view shall load in **under 2 seconds** for up to **50 projects**.  
**NFR-2.2** The asset list view within a project shall load in **under 2 seconds** for up to **100 assets**.  
**NFR-2.3** The review queue view for a Reviewer shall load in **under 2 seconds** for up to **50 pending items**.  
**NFR-2.4** Asset detail pages, including version and comment metadata, shall load in **under 2 seconds** for assets with up to:

- 20 versions
- 200 comments

**NFR-2.5** Approval state changes and comment submissions shall be persisted and reflected in the UI within **500 milliseconds** of submission, under normal load.  
**NFR-2.6** File uploads up to **50 MB** shall complete within **5 seconds** under typical conditions, not including user network variability.

---

### 3. Reliability and Data Integrity

**NFR-3.1** The system shall maintain exactly **one canonical current version** per asset at all times.  
**NFR-3.2** Historical asset versions shall be immutable once created; existing versions shall never be modified in place.  
**NFR-3.3** Approval state transitions shall be atomic and shall not result in partial or inconsistent system states (e.g., a version cannot be both “In Internal Review” and “Approved” simultaneously).  
**NFR-3.4** Feedback (comments) and approvals shall always be associated with a specific asset version, never with the asset as a whole only.  
**NFR-3.5** Critical operations (version creation, approvals, workflow stage changes) shall be designed to be idempotent when retried to avoid duplicate records under transient failures.

---

### 4. Security

**NFR-4.1** User passwords shall be stored using a secure, one-way hashing algorithm (e.g., bcrypt or Argon2) with appropriate salt and cost parameters.  
**NFR-4.2** Authenticated sessions shall be managed using signed JSON Web Tokens (JWTs) or equivalent, with an expiration time not exceeding **15 minutes** of inactivity.  
**NFR-4.3** Role-based access control rules shall be enforced at the API level for all protected endpoints, not just in the user interface.  
**NFR-4.4** Users shall only be able to access organizations, clients, projects, assets, and actions permitted by their assigned roles and project assignments.  
**NFR-4.5** The system shall implement an upload policy that rejects executable or unsafe file types (e.g., `.exe`, `.dll`) and validates file types by both extension and MIME type when storing files.  
**NFR-4.6** The system shall log authentication failures and administrative actions (e.g., role changes, workflow template edits) for security auditing.

---

### 5. Scalability

**NFR-5.1** The system shall support at least **100 registered users** and **10 concurrent active users** without architectural changes.  
**NFR-5.2** The system shall support at least:

- **1,000 stored assets** per organization
- **10,000 asset versions** in total

without degradation of core review workflows beyond the performance targets specified above.  
**NFR-5.3** The system architecture shall allow horizontal scaling of stateless web server components without significant redesign.

---

### 6. Maintainability and Testability

**NFR-6.1** Business logic (e.g., workflow transitions, versioning rules, permission checks) shall be isolated from transport and persistence layers to enable unit testing with mocks.  
**NFR-6.2** Core business logic shall be testable without requiring a live database or running web server (e.g., via dependency injection or in-memory adapters).  
**NFR-6.3** The system shall use a consistent API response format (e.g., standardized error envelope) to simplify testing and client integration.  
**NFR-6.4** The codebase shall follow a documented project structure to ease onboarding and code reviews (documented separately in architecture docs).

---

### 7. Deployment and Configuration

**NFR-7.1** The system shall be runnable in a local development environment using documented setup steps (e.g., `README` and environment sample files).  
**NFR-7.2** Environment-specific configuration values (e.g., database credentials, secrets, file storage keys) shall not be hardcoded in source code and shall be provided via environment variables or configuration files excluded from source control.  
**NFR-7.3** The system shall provide a configuration mechanism for upload size limits, allowed file types, and optional external integrations.

---

### 8. Auditability and Compliance

**NFR-8.1** The system shall maintain an audit log of:

- Version creation events
- Status transitions
- Approval and rejection actions
- Administrative configuration changes (e.g., role updates, workflow template changes)

**NFR-8.2** Audit logs shall include at minimum:

- Actor (user identifier)
- Action type
- Target entity (e.g., asset version, project, workflow template)
- Timestamp

**NFR-8.3** Audit log entries shall be immutable once written and shall not be editable via the standard application interfaces.  
**NFR-8.4** Authorized users (Admin, Manager) shall be able to export audit data for a project or client to a machine-readable format (e.g., CSV) for compliance reporting.

---

### 9. Documentation and Traceability

**NFR-9.1** All functional and non-functional requirements shall be traceable to one or more user flows (see `user-flows-and-sequences.md`).  
**NFR-9.2** All functional requirements shall be traceable to at least one test case (see `test-cases-functional.md`).  
**NFR-9.3** The traceability matrix in `traceability-matrix.md` shall be maintained and updated for new or changed requirements.  
**NFR-9.4** The system’s deployment and configuration steps shall be documented and kept in sync with actual practice (e.g., updates to environment variables or services must be reflected in setup documentation).

