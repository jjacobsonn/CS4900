# Sprint review — technical deliverables

Checklist for demos and engineering reviews: environment, code paths, tests, and honest status.

## 1. Environment

- [ ] Prerequisites match root [README.md](../../../README.md) (Node, PostgreSQL, `.env`).
- [ ] `npm install` at repo root; `npm run db:setup` (or equivalent) applied.
- [ ] API and GUI URLs documented (e.g. `http://localhost:3000/api`, `http://localhost:5173`).

## 2. Code paths to show

- [ ] **Service → database** — e.g. `backend/src/services/assetService.js` and routes under `backend/src/routes/`.
- [ ] **GUI → API** — e.g. `frontend/src/api/assets.ts` and pages under `frontend/src/pages/`.

## 3. Automated tests

From repo root: **`npm test`** (`npm run test:backend`, `npm run test:frontend`).

| Layer | How this repo tests |
|--------|---------------------|
| API / services | Jest + Supertest; `pg` mocked in `backend/src/__tests__/` |
| React pages / utils | Jest + RTL; API mocked; see `frontend/src/**/*.test.ts(x)` |
| Workflow status mapping | `frontend/src/utils/assetStatus.test.ts`, `workflowReview.test.ts` |

Details: [tests/README.md](../../../tests/README.md).

## 4. Demo and gaps

- [ ] New behavior since last review (uploads, review actions, versions, etc.).
- [ ] Known issues: [engineering/CODE-LEFT-TO-DO.md](../engineering/CODE-LEFT-TO-DO.md).

---

**Last updated:** March 2026
