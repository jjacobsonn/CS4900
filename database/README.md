# Database setup — one command

Initialize the **PostgreSQL** schema, baseline seed data, and **all** SQL migrations with a single npm script from the **repo root**.

---

## Prerequisites

- **PostgreSQL** running (`pg_isready` succeeds).
- **`psql`** on your `PATH`.
- **`backend/.env`** (copy from `backend/.env.example`) with at least:

| Variable | Purpose |
|----------|---------|
| `DB_HOST` | Default `localhost` |
| `DB_PORT` | Default `5432` |
| `DB_USER` | Default `postgres` |
| `DB_PASSWORD` | Set if your server requires a password |
| `DB_NAME` | App database name, default `vellum` |

The setup script uses the same variables as `backend/src/config/database.js`.

---

## Recommended: full bootstrap

```bash
npm run db:setup
```

Alias: `npm run init-db` (same command).

This runs:

1. **`database/setup.sql`** against database **`postgres`** — creates **`vellum`** if needed, core tables, lookups, sample assets, etc.
2. Every **`backend/db/migrations/*.sql`** file in **sorted filename order** against **`DB_NAME`** (usually `vellum`) — projects/clients, asset columns, client workflow statuses, activity + role seeds, etc.

## Deployment-safe migrations (Vercel / shared envs)

Use migrations as the source of truth for deploys:

```bash
npm run db:deploy
```

Alias: `npm run db:migrate` (same command).

This applies only `backend/db/migrations/*.sql` in sorted order against `DB_NAME` and does not run local bootstrap SQL.

## Team sync: reset and rebuild from scratch

When a teammate needs their local DB to exactly match the current repo schema and seeds, run:

```bash
npm run db:sync
```

Alias: `npm run db:reset` (same command).

This will:

1. Terminate active connections to `DB_NAME`.
2. Drop the database if it exists.
3. Recreate and seed via `database/setup.sql`.
4. Re-apply all SQL migrations in sorted order.

Use this after pulling migration/schema changes from teammates.

## Seed hashing note

Seed users now use real bcrypt hashes (no placeholder hash values in seed SQL).

Re-running is mostly safe: migrations use `IF NOT EXISTS` / `ON CONFLICT` where appropriate. For a **clean slate**, run `npm run db:sync`.

**Production:** do not rely on dev seeds; see [deployment-and-super-admin.md](../assets/docs/sprint-2/deployment-and-super-admin.md).

---

## Verify

```bash
psql -U postgres -d vellum -c "\dt"
psql -U postgres -d vellum -c "SELECT id, email FROM users ORDER BY id;"
```

---

## Troubleshooting

| Issue | What to try |
|-------|-------------|
| `psql: command not found` | Install PostgreSQL client tools; add `bin` to `PATH`. |
| `password authentication failed` | Set `DB_PASSWORD` in `backend/.env` to match `pg_hba` / role password. |
| `permission denied to create database` | Use a superuser (`postgres`) or a role with `CREATEDB`. |
| Script stops on a migration | Fix the underlying error; `ON_ERROR_STOP` is enabled so failures are visible. |

---

## Manual psql (optional)

If you cannot use npm:

```bash
psql -h localhost -p 5432 -U postgres -d postgres -v ON_ERROR_STOP=1 -f database/setup.sql
# then each migration against vellum, in sorted order:
psql -h localhost -p 5432 -U postgres -d vellum -v ON_ERROR_STOP=1 -f backend/db/migrations/<file>.sql
```

Prefer **`npm run db:setup`** so credentials stay in one place.
