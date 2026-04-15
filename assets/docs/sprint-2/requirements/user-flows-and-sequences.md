## User Flows and Sequences — Vellum (Sprint 2)

This document defines the primary Sprint 2 user flows and sequence-level interactions between roles and core entities.

It supersedes the Sprint 0 use case descriptions as the canonical view of how users interact with the expanded system.

---

### 1. Overview

Sprint 2 introduces structured projects, workflows, and roles. The main flows focus on:

1. Project and workflow setup (Admin, Manager)
2. Asset creation and versioning (Designer)
3. Internal review loop (Internal Reviewer, Designer)
4. Client review and final approval (Client Reviewer, Manager)
5. Post-approval management and audit (Manager, Admin)

Each flow describes:

- Primary actors
- Preconditions
- Main steps
- Postconditions

These flows are the basis for functional requirements and test cases.

---

### 2. Flow: Create Project and Configure Workflow

**Primary Actor:** Manager  
**Supporting Actors:** Admin (workflow template author)  

**Preconditions:**

- Manager is authenticated and has permissions to create projects.
- At least one workflow template exists (created by Admin), or the Manager is allowed to configure a project-specific workflow.

**Main Flow:**

1. Manager navigates to “Create Project”.
2. Manager selects a client (existing or new) and enters project details (name, description, dates).
3. Manager selects a **workflow template** (e.g., “Standard Brand Review”).
4. System loads the template’s stages (e.g., Designer → Brand → Legal → Client).
5. Manager assigns:
   - Designers responsible for creation.
   - Internal Reviewers for internal stages.
   - Client Reviewers for the client stage (if applicable).
6. Manager sets project-level metadata (e.g., priority, due date).
7. System creates the project, associates it with the client, and stores the workflow configuration.

**Postconditions:**

- A project exists with:
  - Linked client.
  - Configured workflow stages.
  - Assigned Designers and Reviewers.
- The project appears in Manager and Designer dashboards.

---

### 3. Flow: Designer Creates and Iterates on Assets

**Primary Actor:** Designer  
**Supporting Actors:** Manager (provides brief)  

**Preconditions:**

- Designer is authenticated and assigned to at least one project.
- Project has been created with an active workflow.

**Main Flow:**

1. Designer opens a project and views assigned tasks or deliverables.
2. Designer selects a deliverable and reviews the brief/requirements.
3. Designer uploads an **initial version** of an asset or links to an external tool (e.g., Figma URL, Google Doc).
4. System creates `Version 1.0` for the asset:
   - Sets approval status to “In Progress” or “Not Ready for Review”.
   - Marks this as the current version.
5. Designer marks the asset as **Ready for Internal Review** when prepared for review.
6. System transitions the asset to the first review stage and notifies assigned Internal Reviewers.

**Iteration Loop (upon feedback):**

7. If changes are requested, Designer:
   - Reviews comments and requested changes.
   - Creates a new version:
     - Minor version (e.g., `v1.1`, `v1.2`) for small edits within the same review cycle.
     - Major version (e.g., `v2.0`) when requirements or scope change significantly.
   - Adds an optional change summary.
8. System:
   - Stores the new version as immutable.
   - Updates the current version pointer.
   - Sets status back to “Ready for Internal Review”.

**Postconditions:**

- Assets under the project have a clear version history.
- Each version is associated with comments and approval states.
- Internal Reviewers can see which versions are ready for them to review.

---

### 4. Flow: Internal Review Loop

**Primary Actor:** Internal Reviewer  
**Supporting Actors:** Designer, Manager  

**Preconditions:**

- Internal Reviewer is authenticated and assigned to one or more review stages for the project.
- At least one asset version is in a “Ready for Internal Review” state.

**Main Flow:**

1. Internal Reviewer opens their **Review Queue** dashboard.
2. System displays assets (and specific versions) awaiting their review, with relevant metadata (client, project, due date).
3. Reviewer selects an item to review and:
   - Views the asset preview (when supported) or downloads it.
   - Reviews associated comments and change history.
4. Reviewer leaves comments:
   - Tied to the specific version.
   - Optionally tagged as blocking vs non-blocking.
5. Reviewer chooses one of:
   - **Request Changes**:
     - System sets status to “Changes Requested”.
     - Notifies the Designer(s) responsible.
   - **Approve to Next Stage**:
     - System transitions the asset to the next workflow stage (e.g., another internal stage or Client Review).
     - Records the approval with user attribution and timestamp.

**Postconditions:**

- If changes were requested:
  - Designers see updated tasks and comments.
  - Asset remains in the internal review loop until resubmitted.
- If approved:
  - Asset progresses to the next stage (e.g., another internal reviewer or Client Review).
  - Manager can see updated status at the project level.

---

### 5. Flow: Client Review and Final Approval

**Primary Actors:** Client Reviewer, Manager  
**Supporting Actors:** Internal Reviewer  

**Preconditions:**

- Internal stages have been completed per the project’s workflow.
- Asset version has reached the “Client Review” stage.
- Client Reviewer has access (via login or secure link) to the asset.

**Main Flow:**

1. Client Reviewer accesses Vellum via a simplified client portal or secure link.
2. System presents a list of assets awaiting their review, with minimal but clear metadata.
3. Client Reviewer selects an asset:
   - Views the specific version designated for client review.
   - Optionally reviews a brief or summary of changes.
4. Client Reviewer can:
   - Add comments or questions.
   - Choose “Approve” or “Request Changes”.
5. System:
   - If “Request Changes”:
     - Marks asset as “Client Changes Requested”.
     - Notifies Manager and Designers.
   - If “Approve”:
     - Marks this version as **Client Approved**.
     - Marks asset/version as **Approved/Final** within the project.

**Postconditions:**

- Approved versions are clearly marked as such and locked against silent overwrite.
- Manager sees which assets are fully client-approved and ready for release.
- Approval records include Client Reviewer identity and timestamps.

---

### 6. Flow: Post-Approval Management and Audit

**Primary Actors:** Manager, Admin  

**Preconditions:**

- At least one asset in a project has a client-approved version.

**Main Flow (Manager):**

1. Manager opens the project overview.
2. System displays:
   - List of assets, current statuses, and approved versions.
   - Any items still in review or needing changes.
3. Manager:
   - Marks approved assets as **Published** or **Delivered** when they are released.
   - Optionally archives older or superseded assets.

**Main Flow (Admin / Manager Audit):**

4. Admin or Manager opens **Audit / History** view.
5. System provides:
   - Version history for each asset.
   - Approval history (who approved which version and when).
   - Timeline of status changes and key actions.
6. Admin or Manager can export relevant audit logs (e.g., CSV or PDF) for reporting or compliance.

**Postconditions:**

- Teams can demonstrate, after the fact, exactly how and when each asset was reviewed and approved.
- Old projects can be archived while preserving their audit history.

---

### 7. Supporting Flow: User and Role Management

**Primary Actor:** Admin  

**Preconditions:**

- Admin is authenticated with system-level privileges.

**Main Flow:**

1. Admin navigates to the Users & Roles section.
2. Admin:
   - Creates new users.
   - Assigns one or more roles (Admin, Manager, Designer, Internal Reviewer, Client Reviewer).
   - Optionally associates users with default clients or teams.
3. System validates and stores user and role assignments.

**Postconditions:**

- Users have appropriate levels of access and appear in assignment pickers (for projects, assets, and workflows).
- Role changes are captured in audit logs.

---

### 8. Sequence Diagram References

For each major flow above, Sprint 2 sequence diagrams should be created or updated to reflect:

- Actors (user roles)
- System components (frontend, backend API, database)
- Core entities (Organization, Client, Project, Asset, Version, Workflow, Stage, Comment, ApprovalRecord)

The diagrams are not included inline here but should be maintained alongside this document (e.g., as images or diagram source files) and referenced by section (e.g., “Figure 3.1: Internal Review Loop Sequence”).

