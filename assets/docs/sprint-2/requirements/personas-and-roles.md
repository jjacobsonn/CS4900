## Personas and Roles — Vellum (Sprint 2)

This document refines the Sprint 0 personas to reflect the expanded, multi-role workflow defined in Sprint 2.

It supersedes `assets/docs/sprint-0/personas.md` as the current description of users and roles.

---

### 1. Overview of Roles

Vellum supports the following primary roles in Sprint 2:

- **Admin (Superadmin)**
- **Manager**
- **Designer (Contributor)**
- **Internal Reviewer**
- **Client Reviewer**

Roles are assigned at the organization level and used to control permissions at the project and asset level. A single user may hold multiple roles (e.g., Manager + Internal Reviewer) depending on organizational needs.

---

### 2. Persona: Admin (Superadmin)

**Role:** Creative Lead / System Administrator  
**Primary Goals:**

- Ensure the system reflects the organization’s structure (users, roles, clients, projects).
- Configure consistent review workflows and policies.
- Maintain accountability, auditability, and security.

**Responsibilities:**

- Create and manage user accounts and role assignments.
- Configure organization-wide settings (e.g., default workflow templates).
- Define and maintain workflow templates used by Managers when creating projects.
- Monitor overall system health, usage, and asset status across clients and projects.

**Usage Characteristics:**

- Primarily desktop usage.
- Interacts with the system intermittently but with high-level breadth.
- Needs high-visibility dashboards and configuration tools more than day-to-day review UX.

**Key Challenges:**

- Maintaining consistent review standards across many projects and teams.
- Limited time to investigate detailed asset histories manually.
- Balancing security (least privilege) with ease of use.

**How Vellum Helps:**

- Centralized management of users, roles, and workflow templates.
- System-level views of projects, assets, and approval states.
- Clear audit logs for key actions (role changes, workflow changes, approvals).

---

### 3. Persona: Manager

**Role:** Project Owner / Account Manager / Marketing Manager  
**Primary Goals:**

- Deliver high-quality assets to clients on time.
- Coordinate Designers and Reviewers across multiple projects.
- Quickly identify bottlenecks and resolve blockers.

**Responsibilities:**

- Create and configure projects under specific clients.
- Select appropriate workflow templates and assign Designers and Reviewers.
- Track project progress and ensure reviews happen on schedule.
- Own final internal approval and decide when to send work to clients.

**Usage Characteristics:**

- Uses both desktop and mobile.
- Frequently checks dashboards and review queues.
- Needs at-a-glance indicators of project health and upcoming deadlines.

**Key Challenges:**

- Juggling many assets and tasks across multiple projects.
- Limited visibility into where work is stuck (Designer vs Reviewer vs Client).
- Difficulty proving to stakeholders that a given asset was reviewed properly.

**How Vellum Helps:**

- Project-level dashboards showing status by stage, assignee, and due date.
- Clear assignment of responsibilities per asset and stage.
- Single source of truth for approval state and history across all assets in a project.

---

### 4. Persona: Designer (Contributor)

**Role:** Designer / Content Creator / Copywriter  
**Primary Goals:**

- Understand what needs to be created and when.
- Incorporate feedback efficiently and accurately.
- Ensure the correct version of their work is reviewed and approved.

**Responsibilities:**

- Review project briefs and requirements.
- Create initial versions of assets and upload or link them into Vellum.
- Respond to comments and requested changes.
- Create new versions (major/minor) and move assets through the workflow.

**Usage Characteristics:**

- Uses both desktop (primary) and mobile (for quick checks).
- Interacts heavily with specific assets and comment threads.
- Needs clarity about which version is under review and what changes are requested.

**Key Challenges:**

- Feedback scattered across tools and stakeholders.
- Manual version naming and tracking.
- Uncertainty about which comments are still open or blocking.

**How Vellum Helps:**

- Clear per-asset task lists, with status and due dates.
- Version history with explicit “current version” and approval state.
- Comment threads tied to specific versions, with statuses (open/resolved).

---

### 5. Persona: Internal Reviewer

**Role:** Brand Manager / Product Stakeholder / Legal Reviewer (Internal)  
**Primary Goals:**

- Ensure assets meet internal standards (brand, legal, product).
- Provide clear, actionable feedback quickly.
- Approve work confidently knowing they are looking at the correct version.

**Responsibilities:**

- Review assets assigned to them at specific workflow stages.
- Leave comments and request changes where needed.
- Approve work to promote it to the next stage (e.g., Client Review).

**Usage Characteristics:**

- Frequently uses mobile for quick approvals and comments.
- Engages in short, focused sessions rather than long editing blocks.
- Needs a prioritized queue of “items waiting for me”.

**Key Challenges:**

- Too many requests across multiple channels.
- Difficulty knowing which items are urgent or blocking.
- Confusion over whether feedback has been incorporated into the latest version.

**How Vellum Helps:**

- A role-specific review queue listing items that need their attention.
- Simple approve / request changes actions, optimized for mobile and desktop.
- Clear links between their feedback and subsequent versions.

---

### 6. Persona: Client Reviewer

**Role:** External Client Stakeholder / Approver  
**Primary Goals:**

- Quickly understand what they are being asked to approve.
- Provide minimal but clear feedback.
- Ensure the delivered asset matches agreed requirements.

**Responsibilities:**

- Review specific assets that have reached the “Client Review” stage.
- Provide comments on issues or misalignments.
- Approve final versions or request changes.

**Usage Characteristics:**

- Typically uses a simplified, web-based interface (often on mobile).
- Does not manage projects, users, or workflows.
- Needs a low-friction experience with minimal learning curve.

**Key Challenges:**

- Overly complex tools not adapted to occasional use.
- Apps that expose too much internal detail (confusing for external stakeholders).
- Difficulty confirming they are viewing the final, ready-for-approval version.

**How Vellum Helps:**

- Focused, minimal UI with only the assets and actions relevant to them.
- Clear indication of “this is the version you are approving”.
- Simple approve / request changes controls and comment threads.

---

### 7. Role-to-Permission Mapping (High Level)

The table below summarizes which high-level capabilities are associated with each role. Detailed permission rules will be defined in `workflow-templates-and-permissions.md` and the API documentation.

- **Admin (Superadmin)**
  - Manage users, roles, and organization settings.
  - Create and maintain workflow templates.
  - View all organizations, clients, projects, assets, and approvals.
  - Override approval states in exceptional cases.

- **Manager**
  - Create and edit clients and projects.
  - Assign Designers and Reviewers to projects and stages.
  - View all assets and versions within projects they own.
  - Approve or re-open work at key stages (project-level authority).

- **Designer**
  - View and work on assigned projects and assets.
  - Upload and manage versions (subject to versioning rules).
  - Move assets between “In Progress” and “Ready for Review” states.
  - Read and respond to comments; mark comment threads as resolved.

- **Internal Reviewer**
  - View and review assets assigned to them or their stage.
  - Comment, request changes, and approve to the next stage.
  - Cannot edit core project configuration or workflow templates.

- **Client Reviewer**
  - Access only assets explicitly shared with them for Client Review.
  - Comment and approve / request changes on those assets.
  - No access to internal configuration, other projects, or internal-only comments (if configured).

These roles and behaviors drive the user flows, requirements, and tests defined in the remaining Sprint 2 documentation.

