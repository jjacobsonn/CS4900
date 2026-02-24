# Documentation Versioning — How We Keep History

**Short version:** We don’t rename old docs to "v1.2". We keep the old set as-is and put revised content in a separate place.

---

## Strategy

| Content | Location | Purpose |
|--------|----------|---------|
| **Sprint 1 baseline** | `sprint-1/` | Unchanged snapshot of architecture, requirements, API, DB from Sprint 1. |
| **Revised / new specs** | `sprint-2/` (or `revision/`) | Updated architecture, versioning, admin, API changes. |
| **Ideas and rework log** | `architecture-revise.md` | Discussion and "what we did" summary; update as we implement. |
| **Plan** | `project-management/reimplementation-plan.md` | Phases, checklists, which docs to add when. |
| **Journals** | `personal/personal-journal-*.md` | Same files; keep logging work and decisions. |

Optional: one-time copy of `sprint-1/` to `archive/sprint-1-baseline/` if you want a frozen backup.

---

## Why not "v1.2" in filenames?

- Renaming many files (e.g. `achitecture.md` → `achitecture-v1.2.md`) breaks links and READMEs.
- It’s unclear which file is "current" (v1.2 or v2?).
- Git already keeps history; a single "baseline" folder (`sprint-1/`) is enough to mean "before revisions."

So: **old = sprint-1 (unchanged). New = sprint-2 (or revision/).** No version suffixes in doc names unless you really want one file per major version (e.g. `architecture-v2.md`) and are okay updating references.
