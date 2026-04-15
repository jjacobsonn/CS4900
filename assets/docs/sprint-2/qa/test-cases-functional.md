## Functional Test Cases — Vellum (Sprint 2)

This document lists representative functional test cases for Vellum based on the Sprint 2 requirements.

It is not exhaustive, but it establishes a clear pattern for adding additional test cases.

---

### 1. Format

Each test case includes:

- **ID**: Unique identifier (e.g., TC-001).
- **Related Requirements**: IDs from `functional-requirements.md` (FR-*) and, where relevant, `nonfunctional-requirements.md` (NFR-*).
- **Title**: Short description.
- **Preconditions**: Required state before executing the test.
- **Steps**: Ordered actions.
- **Expected Result**: Observable outcome(s).

---

### 2. Authentication and Authorization

**TC-001**  
**Related Requirements:** FR-1.1, FR-1.2  
**Title:** User logs in with valid credentials  
**Preconditions:**

- User account exists and is active.

**Steps:**

1. Navigate to login page.
2. Enter valid username and password.
3. Submit login form.

**Expected Result:**

- System authenticates user and redirects to their default dashboard (e.g., “My Work”).

---

**TC-002**  
**Related Requirements:** FR-1.2, FR-1.4, FR-11.1  
**Title:** Non-admin user cannot access admin-only features  
**Preconditions:**

- A user with the Designer role only exists and is active.

**Steps:**

1. Log in as Designer.
2. Attempt to navigate to the Users & Roles admin page (e.g., via URL or hidden link).

**Expected Result:**

- Access is denied (e.g., 403 response or “Not Authorized” message).
- Designer cannot create or modify user accounts.

---

### 3. Project and Workflow Management

**TC-010**  
**Related Requirements:** FR-2.2, FR-2.3, FR-3.4  
**Title:** Manager creates a project with a workflow template  
**Preconditions:**

- A Manager user exists and is authenticated.
- At least one workflow template (“Standard Brand Review”) exists.
- At least one Client exists.

**Steps:**

1. As Manager, navigate to “Create Project”.
2. Select an existing Client.
3. Enter project name and description.
4. Select the “Standard Brand Review” workflow template.
5. Save the project.

**Expected Result:**

- Project is created and visible in the project list.
- Project shows the stages defined by the selected workflow template.

---

**TC-011**  
**Related Requirements:** FR-2.5, FR-3.5  
**Title:** Manager assigns users to project roles and stages  
**Preconditions:**

- A project exists.
- At least one Designer, Internal Reviewer, and Client Reviewer exist.

**Steps:**

1. As Manager, open the project’s People or Workflow configuration.
2. Assign a Designer to the project.
3. Assign an Internal Reviewer to the “Brand Review” stage.
4. Assign a Client Reviewer to the “Client Review” stage.

**Expected Result:**

- Assignments are saved.
- The assigned users appear in relevant pickers and dashboards.

---

### 4. Asset and Version Management

**TC-020**  
**Related Requirements:** FR-4.1, FR-4.3, FR-4.5, FR-4.9  
**Title:** Designer uploads initial asset version  
**Preconditions:**

- A project exists and Designer is assigned to it.

**Steps:**

1. As Designer, navigate to the project.
2. Create a new asset with a title and description.
3. Upload a file for the asset.

**Expected Result:**

- Asset is created with version `1.0`.
- This version is marked as the current version.
- Asset appears in the project asset list.

---

**TC-021**  
**Related Requirements:** FR-4.6, FR-4.8, FR-4.9  
**Title:** Designer creates a minor version of an asset  
**Preconditions:**

- An asset with version `1.0` exists.

**Steps:**

1. As Designer, open the asset.
2. Upload an updated file as a new version, selecting “Minor version”.

**Expected Result:**

- A new version `1.1` is created.
- Previous version `1.0` remains unchanged.
- `1.1` is marked as the current version.

---

**TC-022**  
**Related Requirements:** FR-4.7, FR-4.10  
**Title:** Designer creates a major version after approval  
**Preconditions:**

- Asset version `1.0` has been approved and marked as final for the client.

**Steps:**

1. As Designer or Manager, open the asset.
2. Choose to create a new major version.
3. Upload a new file as version `2.0`.

**Expected Result:**

- Version `2.0` is created and set as current.
- Version `1.0` remains approved, locked, and unchanged.
- There is no way to overwrite the contents of `1.0`.

---

### 5. Internal Review

**TC-030**  
**Related Requirements:** FR-5.3, FR-5.4, FR-6.1–FR-6.5  
**Title:** Internal Reviewer requests changes on an asset version  
**Preconditions:**

- An asset version is in “Ready for Internal Review”.
- An Internal Reviewer is assigned to the current stage.

**Steps:**

1. As Internal Reviewer, open the review queue.
2. Select the asset version ready for review.
3. Add a comment describing required changes.
4. Choose “Request Changes”.

**Expected Result:**

- Asset version status changes to “Changes Requested (Internal)”.
- Comment appears linked to the specific version and is marked Open.
- Designer sees the asset in their dashboard under items needing changes.

---

**TC-031**  
**Related Requirements:** FR-5.4, FR-5.6  
**Title:** Internal Reviewer approves to next stage  
**Preconditions:**

- An asset version is in “In Internal Review”.
- Internal Reviewer is assigned.

**Steps:**

1. As Internal Reviewer, review the asset.
2. Choose “Approve”.

**Expected Result:**

- Asset version moves to the next configured stage (e.g., Legal or Client Review).
- Approval record is created with reviewer identity and timestamp.

---

### 6. Client Review and Final Approval

**TC-040**  
**Related Requirements:** FR-5.5, FR-6.1, FR-6.3  
**Title:** Client Reviewer approves asset version  
**Preconditions:**

- Asset version has reached the Client Review stage.
- Client Reviewer has access.

**Steps:**

1. As Client Reviewer, open the client review portal or link.
2. View the asset version.
3. Optionally add a comment.
4. Click “Approve”.

**Expected Result:**

- Asset version is marked as Approved / Client Approved.
- Approval record includes Client Reviewer’s identity and timestamp.
- Manager sees the asset as approved and ready to publish.

---

**TC-041**  
**Related Requirements:** FR-5.5, FR-5.6  
**Title:** Client Reviewer requests changes  
**Preconditions:**

- Same as TC-040.

**Steps:**

1. As Client Reviewer, open the asset version.
2. Add a comment describing requested changes.
3. Select “Request Changes”.

**Expected Result:**

- Asset version status becomes “Client Changes Requested”.
- Designer and Manager see the change request and comments.

---

### 7. Dashboards and Queues

**TC-050**  
**Related Requirements:** FR-7.1, FR-7.2  
**Title:** Designer and Reviewer dashboards show correct items  
**Preconditions:**

- Project exists with at least one asset in each of several states (e.g., In Progress, Ready for Internal Review, In Client Review).
- Designer and Reviewer are assigned to relevant assets/stages.

**Steps:**

1. As Designer, open the Designer dashboard.
2. As Reviewer, open the Reviewer dashboard.

**Expected Result:**

- Designer dashboard lists only assets/tasks where the Designer has work to do.
- Reviewer dashboard lists only versions that are in stages awaiting that Reviewer’s action.

---

### 8. Audit and History

**TC-060**  
**Related Requirements:** FR-9.1–FR-9.3  
**Title:** Audit history records approvals and status changes  
**Preconditions:**

- An asset has progressed through several statuses and approvals.

**Steps:**

1. As Manager or Admin, open the asset’s history view.
2. Examine the audit entries.
3. Export the audit log for that asset (if supported in UI).

**Expected Result:**

- Audit history shows a chronological list of:
  - Version creation events.
  - Status changes.
  - Approvals and rejections, including actor and timestamps.
- Exported data matches what is shown in the UI.

