# Re-Implementation Plan — Architecture Revisions

**Started:** February 2026  
**Purpose:** Order and track the work from [architecture-revise.md](../architecture-revise.md) without losing history. Keeps old docs, journals, and a clear place for revised specs.

---

## 1. How we handle docs and history

- **Do not rename existing docs to "v1.2".** Renaming everything (e.g. `achitecture.md` → `achitecture-v1.2.md`) clutters paths and breaks links; "current" becomes unclear.
- **Keep current docs as the baseline.**  
  - `sprint-1/` stays as-is (Sprint 1 snapshot).  
  - `project-management/`, `personal/` stay as-is.
- **Put new/revised content in one place.**  
  - New folder: **`sprint-2/`** (or **`revision/`**) for revised architecture, requirements, versioning spec, API changes, etc.  
  - When we update a *concept* (e.g. versioning, admin scope), we add or edit docs in `sprint-2/` and leave `sprint-1/` unchanged so "before vs after" is obvious.
- **Optional one-time archive.** If you want a safety snapshot of "everything before we changed it," copy `sprint-1/` to `archive/sprint-1-baseline/` once (or rely on git history). No need to version every file in the filename.
- **Journals.** Keep using `personal/personal-journal-jj.md` and `personal-journal-lw.md`. Log at the end of each chunk of work (e.g. "Completed: Reviewer upload disabled; next: Admin user list").

**Summary:** Old = unchanged in `sprint-1/`. New/revised = `sprint-2/` (or `revision/`). Journals = same files, keep updating.

---

## 2. Phases (what to do in order)

### Phase 0 — Prep (no code yet)

- [x] **Decide folder name** for revised specs: `sprint-2/` (matches Spring-2 overview).
- [x] **Create that folder** and add a short `README.md` in it.
- [x] **Optional:** Copy `sprint-1/` → `archive/sprint-1-baseline/` once (done).
- [ ] **Journal:** One short entry that we started re-implementation and chose the doc strategy above.

### Phase 1 — Quick wins (code + minimal doc)

- [x] **Reviewer: Upload disabled like Admin**  
  - Code: Upload nav disabled when `!canAccessUpload(role)`; `/upload` redirects to `/dashboard` for reviewer. Done Feb 2026.
- [x] **Backend Test: hide from standard users**  
  - Code: Backend Test nav + route restricted to `role === "admin"`. Done Feb 2026.
- [x] **Admin: List all users**  
  - Code: Admin shows "All users in database" table (Email | Role) with role dropdown; loading/error state. **Note:** Backend has no `GET /api/users` yet—add users route for real data.
- [ ] **Journal:** Entry per person: what you did, what’s next.

### Phase 2 — Versioning (design then code)

- [ ] **Design in docs first**  
  - Add `sprint-2/versioning-spec.md` (or similar): what is a version (snapshot), when we create one, metadata (who, when, trigger), Git-like actions (push/pull/merge/discard).  
  - Update `sprint-2/database-diagram.md` (or add a one-pager) for `file_versions` (or equivalent) and any new tables.  
  - Update `sprint-2/api-json-contracts.md` for new/updated endpoints (e.g. versions list, revert, submit for review).
- [ ] **Implement**  
  - Backend: tables, endpoints.  
  - Frontend: Versions tab, actions (submit for review, revert, etc.).  
- [ ] **Journal:** Short note when versioning design is done and when first implementation is done.

### Phase 3 — Admin scope and company (later)

- [ ] **Design**  
  - Doc in `sprint-2/`: company/tenant model, scoped admin, user flow (invite, list, deactivate).  
- [ ] **Implement** when ready (likely after versioning).

---

## 3. Which documents to add or update (and where)

| Topic | Where it lives now | Where to add/revise |
|-------|--------------------|---------------------|
| Architecture revision ideas | `architecture-revise.md` | Keep; update "Next Steps" as we complete work |
| Revised architecture (final) | — | `sprint-2/architecture.md` (or `sprint-2/architecture-revised.md`) |
| Versioning behavior & data model | — | `sprint-2/versioning-spec.md` (new) |
| API changes (versions, admin) | `sprint-1/api-json-contracts.md` | `sprint-2/api-json-contracts.md` (add new endpoints) |
| DB schema changes | `sprint-1/database-diagram.md` | `sprint-2/database-diagram.md` or `sprint-2/schema-changes.md` |
| Admin user flow / company | — | `sprint-2/admin-and-tenant.md` (when we do Phase 3) |
| Schedule / follow-up | `project-management/schedule.md`, `project-management/project-follow-up.md` | Update as usual; mark re-implementation tasks |
| Personal journals | `personal/personal-journal-*.md` | Keep; log after each phase or chunk |

**Rule:** Anything that describes "how things work after we change them" goes in `sprint-2/` (or chosen folder). Anything that describes "how things were at Sprint 1" stays in `sprint-1/` and is not renamed to v1.2.

---

## 4. Suggested way to start *today*

1. **Create the revision folder**  
   - e.g. `assets/docs/sprint-2/` with a one-paragraph `README.md`: "Revised specs for architecture revisions (versioning, admin, reviewer, dev tools). Baseline remains sprint-1."
2. **Do Phase 0 checklist** (folder name, optional archive, one journal entry).
3. **Start Phase 1** with the first code change (e.g. Reviewer upload disabled), then Backend Test visibility, then Admin user list. Update `architecture-revise.md` or a short `sprint-2/CHANGELOG.md` as you complete each item.
4. **Revisit this plan** after Phase 1 — adjust Phase 2 and 3 and doc list as needed.

No need to re-edit every existing doc up front. Edit or add docs *when* we touch that part of the product (e.g. versioning spec when we design versioning, API contract when we add endpoints).

---

## 5. Quick reference: doc versioning

- **Old / baseline:** `sprint-1/` — do not rename files to v1.2; leave as-is.
- **New / revised:** `sprint-2/` (or `revision/`) — new and updated specs.
- **Ideas / log:** `architecture-revise.md` — update "Next Steps" and summary as we go.
- **Journals:** `personal/personal-journal-*.md` — keep current; log re-implementation progress.
- **Plan:** This file — update checkboxes and phases as we go.
