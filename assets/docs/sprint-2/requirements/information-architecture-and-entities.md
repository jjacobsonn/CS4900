## Information Architecture and Entities — Vellum (Sprint 2)

This document defines the core entities, relationships, and high-level information architecture for Vellum in Sprint 2.

It expands upon and supersedes the Sprint 0 database and asset concepts by introducing organizations, clients, projects, workflows, and richer versioning.

---

### 1. High-Level Structure

At a high level, Vellum models:

- **Organization**: The top-level tenant (assumed single-tenant per deployment for Sprint 2).
- **Client**: A customer served by the organization.
- **Project**: A concrete initiative for a client.
- **Workflow & Stages**: A structured sequence of review steps for a project.
- **Asset & Versions**: Individual items of work (documents, images, etc.) and their immutable revisions.
- **Comments & Approvals**: Feedback and decisions tied to specific asset versions.
- **Users & Roles**: People interacting with the system and their role-based permissions.

The relationships between these elements guide both backend schema and frontend navigation.

---

### 2. Core Entities and Relationships

#### 2.1 Organization

- Represents the tenant/account (e.g., “Acme Creative Agency”).
- For Sprint 2, we model a single organization per deployment.

**Key attributes (conceptual):**

- `id`
- `name`
- `createdAt`

**Relationships:**

- Has many **Clients**.
- Has many **Users**.
- Has many **WorkflowTemplates**.

---

#### 2.2 Client

- Represents an external customer or business unit that commissions work.

**Key attributes:**

- `id`
- `organizationId`
- `name`
- `description` (optional)
- `createdAt`

**Relationships:**

- Belongs to an **Organization**.
- Has many **Projects**.

---

#### 2.3 Project

- Represents a concrete initiative for a given client (e.g., “Spring 2026 Launch Campaign”).

**Key attributes:**

- `id`
- `clientId`
- `name`
- `description`
- `status` (e.g., Active, Completed, Archived)
- `priority`
- `dueDate` (optional)
- `createdAt`
- `createdByUserId`
- `workflowTemplateId` (template from which the project’s workflow was derived)

**Relationships:**

- Belongs to a **Client**.
- Has many **Assets**.
- Has many **ProjectWorkflowStages** (instantiated from a **WorkflowTemplate**).
- Has many **Assignments** (linking users to roles within the project).

---

#### 2.4 WorkflowTemplate and ProjectWorkflowStage

**WorkflowTemplate**

- Defines a reusable workflow pattern that Managers can apply to projects.

**Key attributes:**

- `id`
- `organizationId`
- `name` (e.g., “Standard Brand Review”)
- `description`
- `isActive`
- `createdByUserId`

**Relationships:**

- Belongs to an **Organization**.
- Has many **WorkflowTemplateStages** (definition of steps).

**WorkflowTemplateStage**

- Defines a single stage within a template (e.g., “Brand Review”, “Legal Review”, “Client Review”).

**Key attributes:**

- `id`
- `workflowTemplateId`
- `orderIndex` (stage ordering)
- `name`
- `allowedRolesToApprove` (e.g., [Internal Reviewer, Manager])
- `requiresApproval` (boolean)

**ProjectWorkflowStage**

- Concrete instance of a template stage for a specific project.

**Key attributes:**

- `id`
- `projectId`
- `templateStageId` (optional link back to template definition)
- `orderIndex`
- `name`

**Relationships:**

- Belongs to a **Project**.
- Has many **StageAssignments** (who can review/approve at this stage).
- Is referenced by **AssetVersionStatus** records to indicate which stage a version is in.

---

#### 2.5 Asset

- Represents a single deliverable within a project (e.g., “Homepage Hero Image”, “Campaign Brief PDF”).

**Key attributes:**

- `id`
- `projectId`
- `title`
- `description`
- `assetType` (e.g., image, document, link)
- `createdAt`
- `createdByUserId`

**Relationships:**

- Belongs to a **Project**.
- Has many **AssetVersions**.
- May have many **Tags** (optional, future enhancement).

---

#### 2.6 AssetVersion

- Represents an immutable revision of an asset.

**Key attributes:**

- `id`
- `assetId`
- `versionNumberMajor` (integer, e.g., 1, 2, 3)
- `versionNumberMinor` (integer, e.g., 0, 1, 2)
- `storageLocation` (file path, URL, etc.)
- `fileMetadata` (original filename, size, MIME type, etc.)
- `changeSummary` (optional)
- `createdAt`
- `createdByUserId`

**Relationships:**

- Belongs to an **Asset**.
- Has many **Comments**.
- Has many **ApprovalRecords**.
- Has one active **AssetVersionStatus** (current status in workflow).

---

#### 2.7 AssetVersionStatus

- Captures the current workflow status of a specific asset version.

**Key attributes:**

- `assetVersionId`
- `currentStageId` (ProjectWorkflowStage)
- `state` (e.g., InProgress, ReadyForInternalReview, InInternalReview, ChangesRequested, InClientReview, ClientChangesRequested, Approved, Published, Archived)
- `isCurrentForAsset` (boolean: true if this version is the official current version)
- `updatedAt`

**Relationships:**

- Belongs to an **AssetVersion**.
- References a **ProjectWorkflowStage**.

---

#### 2.8 Comment

- Represents user feedback tied to a specific asset version.

**Key attributes:**

- `id`
- `assetVersionId`
- `authorUserId`
- `body`
- `createdAt`
- `status` (e.g., Open, Resolved)
- `severity` or `type` (optional; e.g., Blocking, NonBlocking)

**Relationships:**

- Belongs to an **AssetVersion**.
- Belongs to a **User** (author).

---

#### 2.9 ApprovalRecord

- Represents an approval or rejection decision for a specific asset version at a specific stage.

**Key attributes:**

- `id`
- `assetVersionId`
- `stageId` (ProjectWorkflowStage)
- `actorUserId`
- `action` (e.g., Approve, RequestChanges)
- `comment` (optional short note)
- `createdAt`

**Relationships:**

- Belongs to an **AssetVersion**.
- Belongs to a **ProjectWorkflowStage**.
- Belongs to a **User**.

---

#### 2.10 User, Role, and Assignments

**User**

**Key attributes:**

- `id`
- `organizationId`
- `name`
- `email`
- `status` (e.g., Active, Deactivated)
- `createdAt`

**Relationships:**

- Belongs to an **Organization**.
- Has many **UserRoles**.
- Has many **Assignments** and **StageAssignments**.

**Role**

- Conceptual role values (Admin, Manager, Designer, InternalReviewer, ClientReviewer).

**UserRole**

- Links a user to one or more roles within the organization.

**Assignment**

- Links a user to a specific project (e.g., Designer on Project X, Manager on Project Y).

**StageAssignment**

- Links a user (usually Reviewer or Manager) to a specific **ProjectWorkflowStage**.

---

### 3. Navigation and Information Architecture

From a user experience perspective, the information architecture is organized as follows:

- **Top Navigation**
  - Organization context (implicit for Sprint 2).
  - Access to:
    - `Clients`
    - `Projects`
    - `My Work` / `My Queue`
    - `Admin` (for Admin users)

- **Client View**
  - List of projects for that client.
  - Aggregate status of assets and stages across the client.

- **Project View**
  - Overview:
    - Summary of workflow stages and progress.
    - Key dates and metrics.
  - Tabs or sections:
    - `Assets` (with filters by status, stage, assignee).
    - `Activity / Audit` (key actions and approvals).
    - `People` (assignments and roles).

- **Asset View**
  - Current version preview and metadata.
  - Version history (timeline).
  - Comments and approval history per version.
  - Actions allowed based on user’s role and current stage.

---

### 4. Versioning Model

Sprint 2 formalizes versioning:

- **Major version** (`versionNumberMajor`): Incremented when scope or requirements change significantly (e.g., v1.0 → v2.0).
- **Minor version** (`versionNumberMinor`): Incremented for iterations within the same major version (e.g., v1.0 → v1.1 → v1.2).

Rules:

- Each `AssetVersion` is immutable after creation.
- Exactly one `AssetVersion` per `Asset` has `isCurrentForAsset = true`.
- Approvals and comments always reference a specific `AssetVersion`.
- Once a version is marked Approved/Published, it cannot be silently overwritten; a new major version must be created.

---

### 5. Relationship to Database Diagram

This conceptual model should be reflected in the Sprint 2 database diagram (updated from Sprint 0). The diagram should:

- Represent the entities and relationships described here.
- Highlight key foreign keys (e.g., `projectId`, `assetId`, `assetVersionId`, `stageId`, `userId`).
- Make it straightforward to trace a single asset’s lifecycle from creation through approval and publication.

The database diagram is maintained separately (e.g., `database-diagram-sprint-2.*`) but must remain consistent with this document.

