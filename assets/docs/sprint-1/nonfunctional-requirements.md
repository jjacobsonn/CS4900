## Non-Functional Requirements — Vellum

This document defines measurable quality attributes for the Vellum system.
All non-functional requirements are written to support fast reviews, mobile-first usability, reliable file handling, system security, and maintainability.

---

### 1. Usability

NFR-1.1 A user shall be able to approve or request changes on a file in **three or fewer interactions** from the file list view.

NFR-1.2 A reviewer shall be able to leave a comment on a file in **three or fewer interactions** on both desktop and mobile devices.

NFR-1.3 All primary workflows (view file, comment, approve, request changes) shall be fully functional on mobile devices without requiring desktop-only features.

NFR-1.4 The system shall provide clear and persistent visual indicators of a file’s current approval state.

NFR-1.5 When file preview is not supported, the system shall clearly indicate download-only behavior without blocking review actions.

---

### 2. Performance

NFR-2.1 The file list view shall load in **under 2 seconds** for up to **50 files** on a standard home Wi-Fi connection.

NFR-2.2 File detail pages shall load in **under 2 seconds** for files with up to **100 associated comments**.

NFR-2.3 Approval state changes shall be persisted and reflected in the UI within **500 milliseconds** of submission.

NFR-2.4 File uploads up to **50 MB** shall complete within **5 seconds** on a standard home Wi-Fi connection.

---

### 3. Reliability and Data Integrity

NFR-3.1 The system shall maintain exactly **one canonical current version** per file at all times.

NFR-3.2 Historical file versions shall be immutable once created.

NFR-3.3 Approval state transitions shall be atomic and shall not result in partial or inconsistent system states.

NFR-3.4 Feedback and approval data shall always be associated with a specific file version.

---

### 4. Security

NFR-4.1 User passwords shall be stored using a secure one-way hashing algorithm (e.g., bcrypt or Argon2).

NFR-4.2 Authenticated sessions shall be managed using signed JSON Web Tokens (JWTs) with an expiration time not exceeding **15 minutes**.

NFR-4.3 Role-based access control rules shall be enforced at the API level for all protected endpoints.

NFR-4.4 Users shall only be able to access files and actions permitted by their assigned role.

NFR-4.5 The system shall reject executable or potentially unsafe file types (e.g., `.exe`, `.dll`) based on a defined upload policy.

---

### 5. Scalability

NFR-5.1 The system shall support at least **100 registered users** without architectural changes.

NFR-5.2 The system shall support at least **1,000 stored files** without degradation of core review workflows.

NFR-5.3 The system architecture shall allow horizontal scaling of the web server layer.

---

### 6. Maintainability and Testability

NFR-6.1 Business logic shall be isolated from transport and persistence layers to enable unit testing with mocks.

NFR-6.2 All core business logic shall be testable without requiring a live database or running web server.

NFR-6.3 The system shall use a consistent API response format to simplify testing and client integration.

---

### 7. Deployment and Configuration

NFR-7.1 The system shall be configurable and runnable in a local development environment using documented setup steps.

NFR-7.2 Environment-specific configuration values (e.g., database credentials, secrets) shall not be hardcoded in source code.

---

## Notes

* These non-functional requirements are measurable and testable.
* They align with Vellum’s philosophy of fast, lightweight file reviews without enterprise bloat.
* Compliance with these requirements will be validated through unit tests and manual user acceptance testing.
