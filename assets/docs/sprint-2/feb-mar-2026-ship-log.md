# Sprint 2 — What we added since the last sprint

This is a **high-level** picture of how Vellum grew from the Sprint 1 baseline into the current Sprint 2 line of work. It stays at the feature and outcome level; deeper requirements, roles, tests, and engineering notes live in the [Sprint 2 doc modules](./README.md).

---

## Workflow and roles

The product now reflects a clearer **internal vs client-facing** review story, with **stricter rules** for who may upload, who may review, and who has admin powers. Reviewers can take **real approve / request-changes** actions that line up with how the backend expects status changes, instead of only changing labels in the UI.

## Assets and uploads

**Uploads** support a **wider range of file types** and more optional context (for example tying work to a project or recording external references). **In-app preview** covers more kinds of content where the platform allows it, not only the simplest media types.

## Versions and editing

**Version history** is a first-class part of the asset experience: teams can add and manage versions and related attachments. **Admins** can do heavier **editing and cleanup** on an asset—metadata, ownership, replacing the main file, and moderating discussion on the page—with safeguards appropriate to privileged accounts.

## Projects and clients

Work is **grouped beyond a flat list**: **clients and projects** appear in the data model and product flows so assets sit in a clearer organizational context.

## Security and API usage

The app now uses **token-based authentication** for protected APIs, closer to how a real product would behave: after login, requests carry proper credentials instead of informal shortcuts.

## Admin and visibility

**Admin-oriented** views and **activity-style** summaries help operators see what is happening in the system. **Navigation and permissions** were tightened so people only see what their role should see, and the interface makes it clearer **who is signed in**.

## Platform hygiene

**Database migrations** and a **repeatable setup path** make it easier to apply schema and seed changes in a consistent way across machines and demos.

## Quality and documentation

**Automated tests** were expanded around assets, the dashboard, detail pages, upload flows, permissions, and workflow/status behavior. The backend suite also includes **JWT signing and verification** tests (`jwtService`) so token behavior stays aligned with session-based API auth without needing a running database. **Documentation** was reorganized into clear areas—requirements, workflow, engineering, QA, and operations—so Sprint 2 is easier to review and hand off. The canonical **inventory of test files and how to run them** lives in the repo [test guide](../../../tests/README.md).

---

## Testing in one line

Run **all unit tests** from the repo root with **`npm test`**. Full **end-to-end login** is still exercised through **manual smoke** checks as described in the repo test guide.

**Automated coverage (unit, mocked):** backend **assets API** (including JWT 401/403 and multipart upload), **user role service**, **JWT helpers**; frontend **dashboard, asset detail, upload** pages plus **format, permissions, asset status, and workflow review** utilities. Login, admin CRUD, and most non-asset routes are **not** covered by automated tests yet—see the test guide and [engineering gaps](./engineering/CODE-LEFT-TO-DO.md).

---

## Related links

- [Sprint 2 doc index](./README.md)  
- [Review checklist](./operations/sprint-review-checklist.md)  
- [Test strategy](./qa/test-strategy.md)  
- [How to run tests](../../../tests/README.md)  
- [Project follow-up](../project-management/project-follow-up.md)  
- [Remaining engineering gaps](./engineering/CODE-LEFT-TO-DO.md)

---

**Last updated:** March 2026 — aligned with repo test guide (backend JWT helper tests + suite inventory).
