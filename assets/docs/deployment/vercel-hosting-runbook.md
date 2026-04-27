# Vercel Hosting Runbook (Frontend + Hosted Backend + Semester Data)

This project is easiest to host with:

- Frontend on **Vercel**
- Backend (Express) on **Railway/Render/Fly**
- PostgreSQL on **Neon/Supabase/managed Postgres**

## Why this split

The backend is a long-running Express service with local upload serving (`/uploads`), which is a better fit for container/app hosts than serverless functions.

## 1) Deploy backend first

Set backend environment variables on your backend host:

- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `JWT_SECRET`
- `NODE_ENV=production`

Then deploy backend and note your backend base URL, for example:

`https://vellum-api.example.com`

## 2) Move semester data to hosted DB

From repo root:

```bash
# export local full snapshot (schema + data + uploads archive)
npm run db:snapshot:export
```

Set target DB env vars locally for import:

```bash
export TARGET_DB_HOST=...
export TARGET_DB_PORT=5432
export TARGET_DB_NAME=...
export TARGET_DB_USER=...
export TARGET_DB_PASSWORD=...
export TARGET_DB_SSLMODE=require
```

Import snapshot:

```bash
npm run db:snapshot:import -- backups/<your-latest>.dump
```

Or one command:

```bash
npm run db:snapshot:ship
```

After import, run migrations against target DB to ensure schema is current.

## 3) Deploy frontend to Vercel

In Vercel project settings:

- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`

Set Vercel environment variable:

- `VITE_API_BASE_URL=https://vellum-api.example.com/api`

(`frontend/.env.vercel.example` includes the expected format.)

## 4) Verify after deploy

- Login works against hosted backend
- Dashboard and projects load real DB records
- Comments and asset versions appear
- Uploads create records (and serve correctly from backend host)
