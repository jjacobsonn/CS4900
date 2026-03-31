## Functional Requirements — Vellum (Sprint 2)

This document updates the Sprint 0 functional requirements to reflect the expanded multi-role workflow, projects, clients, and versioning model defined in Sprint 2.

It supersedes `assets/docs/sprint-0/functional-requirements.md` as the current set of functional requirements.

---

### 1. User Authentication and Authorization

**FR-1.1** The system shall allow users to authenticate using secure credentials.  
**FR-1.2** The system shall enforce role-based access control (RBAC) for all protected actions.  
**FR-1.3** The system shall support at least the following roles:

- Admin (Superadmin)
- Manager
- Designer (Contributor)
- Internal Reviewer
- Client Reviewer

**FR-1.4** The system shall restrict administrative actions (user management, workflow template management, organization settings) to Admin users.  
**FR-1.5** The system shall restrict project creation and workflow configuration to users with Manager or Admin roles.  
**FR-1.6** The system shall restrict approval actions at each workflow stage to users assigned to that stage and holding an appropriate role (e.g., Internal Reviewer, Manager, Client Reviewer).  
**FR-1.7** The system shall ensure that each user can only access projects, assets, and actions permitted by their organization, role, and assignments.

---

### 2. Organization, Client, and Project Management

**FR-2.1** The system shall allow Admin or Manager users to create and manage **Clients** under the organization.  
**FR-2.2** The system shall allow Manager users to create **Projects** associated with a specific Client.  
**FR-2.3** When creating a project, the system shall allow the Manager to specify:

- Project name and description
- Client
- Priority and due date (optional)
- Associated workflow template

**FR-2.4** The system shall persist project-level metadata and display it in project overviews.  
**FR-2.5** The system shall allow Manager users to assign users (Designers, Internal Reviewers, Client Reviewers) to a project.  
**FR-2.6** The system shall display, for each project, a summary of:

- Number of assets in each workflow state
- Upcoming or overdue items
- Overall project status (e.g., Active, Completed, Archived)

---

### 3. Workflow Templates and Project Workflows

**FR-3.1** The system shall allow Admin users to create and manage reusable **Workflow Templates**.  
**FR-3.2** Each Workflow Template shall consist of an ordered list of stages (e.g., Designer, Brand Review, Legal Review, Client Review).  
**FR-3.3** For each template stage, the system shall allow Admins to define:

- A stage name
- Allowed roles to approve at that stage
- Whether approval is required to progress

**FR-3.4** When a Manager creates a project, the system shall allow selection of an existing Workflow Template to instantiate project-specific workflow stages.  
**FR-3.5** The system shall allow Manager users to assign users to specific stages of a project (e.g., which Reviewer handles “Brand Review” for this project).  
**FR-3.6** The system shall enforce the order of workflow stages for asset versions within a project.  
**FR-3.7** The system shall prevent skipping required stages unless explicitly overridden by an Admin.

---

### 4. Asset and Version Management

**FR-4.1** The system shall allow Designers to create **Assets** within a project.  
**FR-4.2** For each asset, the system shall store:

- Title and description
- Associated project
- Asset type (e.g., image, document, external link)
- Creation timestamp and creator

**FR-4.3** The system shall allow Designers to upload or link the **initial version** of an asset.  
**FR-4.4** For each asset version, the system shall store:

- Immutable version identifiers (major and minor version numbers)
- Storage location or external reference
- File metadata (original filename, size, MIME type) when applicable
- Change summary (optional)
- Creation timestamp and creator

**FR-4.5** The system shall automatically mark the first version of an asset as version `1.0`.  
**FR-4.6** The system shall allow Designers to create **minor versions** (e.g., `1.1`, `1.2`) of an asset within the same major version.  
**FR-4.7** The system shall allow Designers to create **major versions** (e.g., `2.0`) of an asset when requirements or scope change significantly.  
**FR-4.8** The system shall maintain a complete, immutable version history for each asset.  
**FR-4.9** At any time, the system shall designate exactly one version of an asset as the **current version** for daily use.  
**FR-4.10** The system shall prevent silent overwriting of approved versions; creating a new major version shall be required to supersede an approved version.

---

### 5. Version Status and Workflow Progression

**FR-5.1** For each asset version, the system shall track a structured workflow status that includes, at minimum:

- In Progress
- Ready for Internal Review
- In Internal Review
- Changes Requested (Internal)
- Ready for Client Review
- In Client Review
- Client Changes Requested
- Approved
- Published
- Archived

**FR-5.2** The system shall associate each version’s status with a specific project workflow stage (when applicable).  
**FR-5.3** The system shall allow Designers to move a version from “In Progress” to “Ready for Internal Review” when they are ready for review.  
**FR-5.4** The system shall allow assigned Internal Reviewers to:

- Mark an asset version as “Changes Requested (Internal)”
- Approve the version to progress to the next internal or client stage

**FR-5.5** The system shall allow assigned Client Reviewers to:

- Mark an asset version as “Client Changes Requested”
- Approve the version as final client-approved

**FR-5.6** The system shall record all status changes with user attribution and timestamps.  
**FR-5.7** The system shall display the current status and stage of each asset version prominently in asset and project views.

---

### 6. Feedback and Commenting

**FR-6.1** The system shall allow Designers, Internal Reviewers, Managers, and Client Reviewers to leave comments on specific asset versions.  
**FR-6.2** Each comment shall be associated with:

- A specific asset version
- The author
- A creation timestamp

**FR-6.3** The system shall support threaded comments and indicate which comments are **Open** vs **Resolved**.  
**FR-6.4** The system shall allow Designers or Reviewers to mark comments as resolved when addressed.  
**FR-6.5** The system shall display comments in chronological order within the context of the specific version, with clear indication of comment status.

---

### 7. Dashboards and Queues

**FR-7.1** The system shall provide a **Designer dashboard** showing:

- Assets and tasks assigned to the Designer
- Current versions and statuses
- Pending changes requests and due dates

**FR-7.2** The system shall provide a **Reviewer dashboard** showing:

- List of asset versions awaiting the user’s review
- Client, project, and due date information for each item

**FR-7.3** The system shall provide a **Manager dashboard** showing:

- Projects owned by the Manager
- Summary of assets by status and stage
- Overdue or at-risk items

**FR-7.4** The system shall provide an **Admin overview** of:

- System-wide asset counts by status
- Projects and clients activity
- High-level user and workflow health (e.g., number of overdue items per client)

---

### 8. Notifications

**FR-8.1** The system shall notify relevant users when:

- A version enters a stage that requires their review.
- Changes are requested on an asset they own or are assigned to.
- A client-approved version is finalized for an asset in their project.

**FR-8.2** Notifications may be delivered by in-app mechanisms initially; external notifications (e.g., email, chat integrations) can be considered as future enhancements.  
**FR-8.3** The system shall allow users to see unread notifications and mark them as read.

---

### 9. Audit and History

**FR-9.1** The system shall maintain an audit history for each asset version that includes:

- Version creation
- Status transitions
- Approval and rejection actions
- Key configuration changes affecting that version (e.g., reassignment of reviewer)

**FR-9.2** The system shall allow Admins and Managers to view audit history for any asset and project.  
**FR-9.3** The system shall support exporting approval and status history for a project or asset to a machine-readable format (e.g., CSV) for reporting.

---

### 10. Mobile-First Review Support

**FR-10.1** The system shall provide mobile-friendly views for:

- Reviewer and Client Reviewer queues
- Asset previews where feasible
- Approve / request changes actions

**FR-10.2** The system shall support basic commenting workflows on mobile devices.  
**FR-10.3** The system shall ensure that all core review and approval actions can be performed on mobile without requiring desktop-only features.

---

### 11. Administrative Management

**FR-11.1** The system shall allow Admin users to create, update, deactivate, and reactivate user accounts.  
**FR-11.2** The system shall allow Admin users to assign and revoke roles for users.  
**FR-11.3** The system shall log administrative actions (e.g., role changes, workflow template edits) for audit purposes.

---

### 12. Traceability

**FR-12.1** Each functional requirement shall be traceable to one or more user flows defined in `user-flows-and-sequences.md`.  
**FR-12.2** Each functional requirement shall be associated with at least one test case in `test-cases-functional.md`.  
**FR-12.3** A traceability matrix shall be maintained in `traceability-matrix.md`.

