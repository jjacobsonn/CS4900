# Database setup — init-db

How to run the database initialization script for Vellum so the backend can connect and the app (including login) works.

---

## Prerequisites

- **PostgreSQL** installed and running (e.g. `pg_isready` succeeds, or `brew services start postgresql` on macOS).
- **psql** available on your PATH (comes with PostgreSQL).
- You have a superuser or DB owner account (default: `postgres`).

---

## Run init-db (recommended)

From the **project root** (the repo root where `package.json` and `database/` live):

```bash
npm run init-db
```

This runs:

```bash
psql -U postgres -d postgres -f database/setup.sql
```

- **-U postgres** — connect as user `postgres` (change if your DB user is different).
- **-d postgres** — connect to the default `postgres` database first (the script will create/use `vellum`).
- **-f database/setup.sql** — execute the setup script.

If your PostgreSQL user is not `postgres`, either:

- Set the `PGUSER` environment variable, e.g. `PGUSER=myuser npm run init-db`, or  
- Run the equivalent `psql` command with your user:

  ```bash
  psql -U your_username -d postgres -f database/setup.sql
  ```

---

## What the script does

- Creates the **vellum** database if it does not exist.
- Connects to **vellum** and:
  - Creates schema (tables, lookups, assets, users, comments, versions, etc.).
  - Inserts default lookup data (roles, statuses, comment types).
  - Inserts seeded users (`admin@vellum.test`, `designer@vellum.test`, `reviewer@vellum.test`) and sample assets/comments.
  - Creates indexes and triggers as defined in `setup.sql`.

After a successful run, the backend can use the `vellum` database and you can log in with the seeded accounts (see [tests/README.md](../tests/README.md) for login details).

---

## Verify

```bash
psql -U postgres -d vellum -c "\dt"
```

You should see the application tables. To check seeded users:

```bash
psql -U postgres -d vellum -c "SELECT id, email FROM users;"
```

---

## Troubleshooting

| Issue | What to try |
|-------|-------------|
| `psql: command not found` | Add PostgreSQL bin to PATH or use the full path to `psql`. |
| `connection refused` | Start PostgreSQL (e.g. `brew services start postgresql`, or your OS service manager). |
| `password authentication failed` | Use the correct user/password; for local trust auth, ensure `pg_hba.conf` allows it. |
| `permission denied to create database` | Run as a superuser (e.g. `postgres`) or a user with `CREATEDB`. |
| Script already run / “relation already exists” | Safe to re-run; the script uses `IF NOT EXISTS` and `ON CONFLICT DO NOTHING` where appropriate. For a clean slate, drop and recreate the database, then run `npm run init-db` again. |

---

## Direct psql (no npm)

If you prefer not to use npm:

```bash
# From project root
psql -U postgres -d postgres -f database/setup.sql
```

Or from inside psql:

```bash
psql -U postgres -d postgres
\i database/setup.sql
```

(Use the path that resolves to `database/setup.sql` from your current directory.)
