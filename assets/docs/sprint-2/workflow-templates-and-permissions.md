## Workflow Templates and Permissions — Vellum (Sprint 2)

This document defines example workflow templates and summarizes key permission rules that govern how roles interact with stages and asset versions.

It complements `functional-requirements.md`, `personas-and-roles.md`, and `user-flows-and-sequences.md`.

---

### 1. Workflow Templates Overview

Workflow templates provide reusable patterns for how assets move from creation to approval. Managers select a template when creating a project, then assign users to the stages in that project.

Each template defines:

- The ordered list of stages.
- Which roles can approve at each stage.
- Whether a stage is required for completion.

---

### 2. Example Template: Standard Brand Review

**Description:** Default workflow for typical marketing or creative assets.

**Stages (in order):**

1. **Design / Creation**
   - **Purpose:** Designer creates and iterates on the asset until ready for internal review.
   - **Allowed roles to move status forward:** Designer, Manager.
   - **Required to complete project:** Yes.

2. **Brand Review**
   - **Purpose:** Ensure brand consistency, messaging, and visual standards.
   - **Allowed roles to approve:** Internal Reviewer (Brand), Manager.
   - **Required to complete project:** Yes.

3. **Legal Review (Optional)**
   - **Purpose:** Validate legal disclaimers, regulatory requirements, and risk.
   - **Allowed roles to approve:** Internal Reviewer (Legal), Manager.
   - **Required to complete project:** Optional (can be toggled per project).

4. **Client Review**
   - **Purpose:** Client stakeholder reviews and approves asset for final use.
   - **Allowed roles to approve:** Client Reviewer, Manager.
   - **Required to complete project:** Yes.

5. **Publish**
   - **Purpose:** Manager confirms asset is released/published.
   - **Allowed roles to approve:** Manager, Admin.
   - **Required to complete project:** Yes.

---

### 3. Example Template: Internal-Only Quick Review

**Description:** Lightweight workflow for internal-only documents or low-risk assets.

**Stages:**

1. **Design / Creation**
   - **Allowed roles to move status forward:** Designer, Manager.
   - **Required:** Yes.

2. **Internal Approval**
   - **Allowed roles to approve:** Manager, Internal Reviewer.
   - **Required:** Yes.

3. **Publish (Internal)**
   - **Allowed roles:** Manager, Admin.
   - **Required:** Yes.

There is no client review in this template; once internal approval is granted, the asset can be published internally.

---

### 4. Stage-Level Permission Rules (Summary)

The following table summarizes which roles can perform which actions at each type of stage. Concrete checks are enforced at the API layer.

- **Design / Creation Stage**
  - Designer:
    - Create and update asset versions.
    - Move status between `In Progress` and `Ready for Internal Review`.
  - Manager:
    - Override and move status if needed (e.g., re-open work).

- **Internal Review Stages (Brand, Legal, etc.)**
  - Internal Reviewer:
    - View assigned assets and versions.
    - Add comments.
    - Request changes (moves version to `Changes Requested (Internal)`).
    - Approve to next stage.
  - Manager:
    - Perform any Reviewer action.
    - Reassign reviewers for the stage.

- **Client Review Stage**
  - Client Reviewer:
    - View only assets explicitly shared for Client Review.
    - Add comments.
    - Approve or request changes.
  - Manager:
    - Perform client approval actions on behalf of the client (if necessary).
    - Re-open client-approved assets if issues are discovered.

- **Publish Stage**
  - Manager:
    - Mark approved versions as Published.
    - Archive old or superseded assets.
  - Admin:
    - Override publication state in exceptional cases.

---

### 5. Status Transitions and Guards (Conceptual)

Status transitions for a given version should follow a predictable state machine. At a high level:

- `In Progress` → `Ready for Internal Review`  
  - Initiated by Designer or Manager.

- `Ready for Internal Review` → `In Internal Review`  
  - System transitions when a Reviewer begins review.

- `In Internal Review` → `Changes Requested (Internal)`  
  - Initiated by Internal Reviewer or Manager.

- `In Internal Review` → `Ready for Client Review` (or next internal stage)  
  - Initiated by Internal Reviewer or Manager upon approval.

- `Ready for Client Review` → `In Client Review`  
  - System transitions when a Client Reviewer opens the item.

- `In Client Review` → `Client Changes Requested`  
  - Initiated by Client Reviewer or Manager.

- `In Client Review` → `Approved`  
  - Initiated by Client Reviewer or Manager upon approval.

- `Approved` → `Published`  
  - Initiated by Manager or Admin.

- `Approved` / `Published` → New Major Version (`v+1.0`)  
  - Initiated by Designer or Manager when creating a new major version; previous version remains locked and approved.

Implementation details (e.g., exact state identifiers and guard logic) are specified in backend design and test cases but must respect this conceptual state machine.

---

### 6. Future Enhancements (Beyond Sprint 2)

The following capabilities are recognized but not in scope for Sprint 2 implementation:

- Per-project custom stage definitions beyond template-derived configurations.
- Conditional stages based on asset type or client.
- Dynamic parallel review stages (e.g., multiple review tracks that must all complete).
- Fine-grained permissions (e.g., read-only internal reviewers, separate “Client Observer” role).

These potential enhancements can be documented in future iterations of this file as the system evolves.

