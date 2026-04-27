# Hosting runbook (Vercel + Render + Postgres)

Spring 2026 capstone deployment: **Vercel** (React/Vite frontend), **Render** (Express API + managed Postgres). This doc is the detailed checklist; the README links here and lists public URLs only.

## Production URLs (public)

| Service | URL |
|---------|-----|
| Web app | https://cs-4900-frontend.vercel.app/ |
| API root | https://vellum-backend-unc1.onrender.com/ |
| Health | https://vellum-backend-unc1.onrender.com/api/health |

Do **not** paste database passwords, full `DATABASE_URL` secrets, or `JWT_SECRET` into this file or into Git.

---

## Why this split

The backend is a long-running Express app that serves uploads under `/uploads`. That fits **Render Web Services** (or similar) better than Vercel serverless functions. The static/Vite frontend fits **Vercel**.

---

## 1) Render: PostgreSQL

1. Create a **Postgres** instance (same region as the API, e.g. Oregon).
2. **Connect → Internal:** copy the full `postgresql://…` URL for use on Render only.
3. **Connect → External:** use hostname `*.oregon-postgres.render.com` and credentials when connecting **from your laptop** (snapshots, `psql`, `npm run db:render:sync`).

---

## 2) Render: Web Service (backend)

1. **New Web Service** from GitHub `jjacobsonn/CS4900`, branch `main`.
2. **Root Directory:** `backend`
3. **Build Command:** `npm install`
4. **Start Command:** `npm run start`
5. **Instance:** Free tier is fine for class demos (cold starts possible).

### Environment variables (names only)

- **`DATABASE_URL`** — Internal Postgres URL from step 1 (single string; preferred over splitting `DB_*` manually). The app reads this in `backend/src/config/database.js`.
- **`JWT_SECRET`** — long random secret (generate locally, e.g. `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`). Required for login.
- **`NODE_ENV`** — `production`
- Optional: **`DB_SSL=true`** if you use split `DB_*` against a host that requires TLS and see SSL errors.

Do **not** commit these values to the repository.

---

## 3) Copy local database → Render (semester data)

Prerequisites: `pg_dump`, `pg_restore`, `psql` on your PATH (e.g. Homebrew PostgreSQL client).

1. **`backend/.env.render.sync`** (gitignored): copy `backend/.env.render.sync.example` and set **`TARGET_DB_HOST`**, **`TARGET_DB_PORT`**, **`TARGET_DB_NAME`**, **`TARGET_DB_USER`**, **`TARGET_DB_PASSWORD`**, **`TARGET_DB_SSLMODE=require`** using the **External** connection from the Render Postgres dashboard.
2. From repo root:

```bash
npm run db:render:sync
```

That runs **`db:snapshot:ship`** (export from local `backend/.env` DB, restore into Render) then **`db:deploy`** against the hosted DB.

Alternatives (manual env in shell instead of `.env.render.sync`): `npm run db:snapshot:export`, `npm run db:snapshot:ship`, then `npm run db:deploy` with `DB_*` / `TARGET_*` and `PGSSLMODE=require` as documented in repo `package.json` comments.

### Render CLI (optional)

```bash
brew install render   # if needed
render login
render workspace set
render psql <postgres-service-name> -c "SELECT COUNT(*) FROM users;" -o text
```

Use the **postgres service name or `dpg-…` id** from the dashboard.

---

## 4) Vercel: frontend

1. **Import** GitHub `jjacobsonn/CS4900`, branch `main`.
2. **Root Directory:** `frontend`
3. **Framework:** Vite (auto).
4. **Build:** `npm run build` — **Output:** `dist` (defaults).
5. **Environment variables (Production):**

- **`VITE_API_BASE_URL`** = `https://vellum-backend-unc1.onrender.com/api` (no trailing slash after `api`).

6. **Deploy.** Redeploy after any change to `VITE_*` vars (they are baked in at build time).

See also `frontend/.env.vercel.example`.

---

## 5) Verify

- Open the Vercel URL; login should hit Render `/api/auth/login`.
- `GET /api/health` returns JSON with `"status":"ok"`.
- Dashboard lists match data you synced.

**Uploads:** files live on the Render web service disk; free tiers may lose ephemeral disk on redeploy. Re-upload or add object storage for production-grade persistence.

---

## Security checklist

- Never commit **`backend/.env`**, **`backend/.env.render.sync`**, or secrets inside connection URLs.
- Rotate Postgres and redeploy env if credentials were exposed.
- Use a production-only **`JWT_SECRET`** on Render; do not reuse shared dev secrets in public docs.

---

## Related repo files

- `frontend/vercel.json` — SPA fallback for client-side routing.
- `frontend/.env.vercel.example` — template for `VITE_API_BASE_URL`.
- `scripts/db-snapshot-export.mjs`, `db-snapshot-import.mjs`, `db-snapshot-ship.mjs`, `render-sync-to-hosted.mjs`
- `backend/.env.render.sync.example` — template for hosted DB targets (copy to gitignored `backend/.env.render.sync`).
