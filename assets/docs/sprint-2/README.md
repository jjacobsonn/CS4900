# Sprint 2 — Vellum (summary & doc map)

**Product:** Vellum — digital asset review and approval (mobile-first).  
**Run & test:** [README.md](../../../README.md), [tests/README.md](../../../tests/README.md), `npm test`.

**Sprint overview (high level):** [feb-mar-2026-ship-log.md](feb-mar-2026-ship-log.md) — what we added since Sprint 1, by feature area.

---

## Shipped in this line of work

- **Workflow statuses** — Internal/client status keys in the API; UI maps lookup names to dashboard buckets (`frontend/src/utils/assetStatus.ts`).
- **Reviewer actions** — Approve / Request changes send `approved_internal` and `changes_requested_internal` when the asset is in **In Internal Review** or legacy **In Review** (`frontend/src/utils/workflowReview.ts`).
- **Uploads** — Broad file types; optional asset type, project link, external URL.
- **Versions** — List and uploads on asset detail; admin can edit/delete versions; audit where implemented.
- **Roles** — Designer, reviewer, manager, client reviewer, admin (see role matrix below).

---

## Documentation modules

### [requirements/](requirements/)

Vision, FR/NFR, personas, flows, IA, asset types, traceability.

### [roles-and-workflow/](roles-and-workflow/)

[role-permission-matrix.md](roles-and-workflow/role-permission-matrix.md), [workflow-templates-and-permissions.md](roles-and-workflow/workflow-templates-and-permissions.md).

### [engineering/](engineering/)

Implementation notes, real-DB status, backlog: [CODE-LEFT-TO-DO.md](engineering/CODE-LEFT-TO-DO.md).

### [operations/](operations/)

[Review / demo checklist](operations/sprint-review-checklist.md).

### [qa/](qa/)

[test-strategy.md](qa/test-strategy.md), [test-cases-functional.md](qa/test-cases-functional.md).

---

## Related

**See also:** [Re-Implementation Plan](../project-management/reimplementation-plan.md) | [Code left to do](engineering/CODE-LEFT-TO-DO.md) | [Architecture revision ideas](../architecture-revise.md) | [Doc versioning](../DOC-VERSIONING.md) | [Review prep & cadence](../project-management/review-prep-and-cadence.md) | [Project Follow-up](../project-management/project-follow-up.md)

**Roles & workflow (Sprint 2):** [Role permission matrix](roles-and-workflow/role-permission-matrix.md) · [Workflow templates & permissions](roles-and-workflow/workflow-templates-and-permissions.md).

- Sprint 1 baseline: [sprint-1/README.md](../sprint-1/README.md)
- Status / follow-up: [project-follow-up.md](../project-management/project-follow-up.md)
- White-box strategy: [tests/testing-plan-whitebox.md](../../../tests/testing-plan-whitebox.md)

---

**Last updated:** March 2026
