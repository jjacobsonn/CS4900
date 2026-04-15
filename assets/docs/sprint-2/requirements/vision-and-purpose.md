## Vision and Purpose — Vellum (Sprint 2)

This document refines the product vision for Vellum based on Sprint 0 and expands it into a more realistic multi-role workflow system.

It supersedes the Sprint 0 high-level concept descriptions and should be treated as the current source of truth for product direction.

---

### 1. Product Vision

Vellum is a workflow platform for managing the lifecycle of project documents and creative assets from **request → creation → review → approval → release**, with clear ownership, version control, and accountability.

Instead of acting as a simple file drop with comments, Vellum provides:

- **Structured projects and workflows** rather than a flat list of files.
- **Role-aware experiences** for Admins, Managers, Designers, and Reviewers (including client-side reviewers).
- **First-class versioning and audit trails** so teams always know which version is approved, who approved it, and why.

The initial implementation focuses on a **creative agency / internal marketing team** use case, but the underlying concepts apply to any organization that needs controlled document and asset approvals.

---

### 2. Target Users and Context

For Sprint 2, Vellum is designed around a single organization (e.g., an agency or internal creative department) that serves multiple **clients** and runs multiple **projects** per client.

- **Organization**: The overall tenant (e.g., “Acme Creative”). For now the system assumes a single organization per deployment.
- **Client**: A customer served by the organization (e.g., “Nike”, “Coca‑Cola”). Clients group projects and assets.
- **Project**: A concrete initiative for a client (e.g., “Nike Summer 2026 Campaign”), which contains assets, workflows, tasks, and approvals.

Within this context, Vellum supports the following primary system roles:

- **Admin (Superadmin)**: Manages users, roles, workflow templates, and organization settings.
- **Manager**: Owns projects, defines requirements, assigns Designers and Reviewers, and owns final sign-off.
- **Designer (Contributor)**: Creates and iterates on assets and documents, manages versions, and responds to feedback.
- **Internal Reviewer**: Reviews work on behalf of the organization (e.g., brand, marketing, product).
- **Client Reviewer**: External reviewer representing the client, typically with a simplified view and limited permissions.

Personas and detailed role behaviors are defined in `personas-and-roles.md`.

---

### 3. Core Problems Vellum Solves

Compared to traditional ad hoc tools (email, chat threads, shared drives), Vellum addresses the following pain points:

- **Scattered feedback**  
  Feedback is buried across email chains, messaging apps, and document comments, making it hard to see the full picture.

- **Version confusion**  
  Teams struggle to know which version is “the one”, whether it is approved, and what changed since the last review.

- **Unclear ownership and status**  
  It is often unclear who is responsible for an asset right now, which step it is in, and what is blocking progress.

- **Weak auditability**  
  There is no reliable record of who approved what, when, and for which exact version—especially risky in regulated or high‑visibility work.

Vellum’s goal is to provide a **single, authoritative system of record** for the lifecycle of project assets, with structured workflows and clear responsibility.

---

### 4. High-Level Solution Overview

At a high level, Vellum provides:

- **Project and workflow management**
  - Projects grouped under clients within an organization.
  - Configurable **workflow templates** that define the sequence of review stages (e.g., Designer → Brand → Legal → Client).
  - Role-based permissions that determine who can move work between stages.

- **Asset and version lifecycle**
  - Assets belong to projects and can have multiple **versions**.
  - Each version:
    - Is immutable once created.
    - Has a clear status (e.g., In Progress, Ready for Internal Review, In Client Review, Approved, Published, Archived).
    - Is associated with comments, change summaries, and approvals.
  - Exactly one version is the **current official version** for day-to-day use.

- **Role-aware user experiences**
  - **Designer** sees a task- and version-centric view: what to work on next, which comments are open, and how to resubmit.
  - **Reviewer** sees a streamlined review queue: assets waiting for their decision, with minimal friction on desktop and mobile.
  - **Manager** sees dashboards highlighting bottlenecks, overdue items, and overall project status.
  - **Admin** configures users, roles, permissions, and workflow templates for the entire organization.

- **Audit trails and compliance**
  - Every approval, rejection, and status change is tracked with user attribution, timestamps, and the specific version affected.
  - Approval logs can be reviewed and exported for audits and stakeholder reporting.

---

### 5. Primary User Flows (Overview)

Detailed flows and sequence diagrams are defined in `user-flows-and-sequences.md`. At a summary level, Sprint 2 focuses on the following end-to-end flows:

1. **Create Project and Configure Workflow**
   - Manager creates a new project under a client.
   - Manager selects or configures a workflow template defining stages and reviewers.
   - Manager assigns Designers and Reviewers to the project.

2. **Designer Work and Version Iteration**
   - Designer receives a task/brief, uploads initial asset versions, and marks them as In Progress.
   - Designer moves versions to “Ready for Internal Review” when ready.

3. **Internal Review Loop**
   - Internal Reviewers see assets awaiting their review.
   - They add comments, request changes, or approve for the next stage.
   - Designer iterates, uploads new versions (minor or major), and resubmits.

4. **Client Review and Final Approval**
   - Client Reviewers receive a simplified review interface focused on clarity and ease-of-use.
   - They provide comments or approvals; final approval locks the version and promotes it to Approved/Published.

5. **Post-Approval Management and Audit**
   - Manager reviews approved assets, marks them as Published, and ensures they are delivered.
   - Admins and Managers can inspect approval history and export audit logs.

---

### 6. Scope and Non-Goals for Sprint 2

Sprint 2 expands the conceptual model beyond single-file reviews but remains focused on a realistic and implementable core:

- **In Scope**
  - Single-organization model with support for clients and projects.
  - Core roles: Admin, Manager, Designer, Internal Reviewer, Client Reviewer.
  - Basic workflow templates and project-specific reviewer assignments.
  - Versioning rules (major vs. minor versions, current version, immutability).
  - Role-aware dashboards and queues (at least basic views).
  - Audit trails for approvals and status changes.

- **Out of Scope (Future Work, to be documented but not implemented in Sprint 2)**
  - Full multi-tenant SaaS with cross-organization single sign-on.
  - Rich Digital Asset Management (DAM) features such as AI tagging, large-scale search, or complex rights management.
  - Deep third-party integrations (e.g., Slack, Figma, Google Drive) beyond simple external links.

---

### 7. Relationship to Other Sprint 2 Documents

This vision document provides the narrative anchor for all Sprint 2 artifacts. It should be read alongside:

- `personas-and-roles.md` — detailed personas, role definitions, and responsibilities.
- `user-flows-and-sequences.md` — updated flows and sequence diagrams.
- `information-architecture-and-entities.md` — entities, relationships, and database-level concepts.
- `functional-requirements.md` — updated functional requirements aligned with the expanded scope.
- `nonfunctional-requirements.md` — non-functional requirements emphasizing traceability, performance, and usability.
- `test-strategy.md` and related testing docs — how the above will be validated.

Collectively, these documents define the upgraded “real deal” Vellum system for Sprint 2.

