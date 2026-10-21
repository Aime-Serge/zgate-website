# Website database

PostgreSQL for the website, used by the CMS (`backend/`) only. The public site has no database access. Separate from the e-learning database in every environment (ADR-007, ADR-008). The schema is Django's: each CMS app's `migrations/` folder (`backend/<app>/migrations/`), applied with `python manage.py migrate`, never SQL here. Tables keep Django's default names (`<app>_<model>`, e.g. `leads_lead`, `accounts_user`, `wagtailcore_page`) in the `public` schema.

| File                  | What it is                                                                                                                  |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `init/01-roles.sql`   | Creates `zgate_website`, the migration owner `zgate_website_owner` and the app role `zgate_website_app` (rows only, no DDL) |
| `postgresql.conf`     | Production settings: statement and idle-in-transaction timeouts, slow-query logging                                         |
| `postgresql.dev.conf` | Local development: the same guard rails with a small memory footprint (`compose.yml` at the repository root)                                |
| `backup.sh`           | `pg_dump` (custom format), optional `age` encryption, retention                                                             |
| `restore.sh`          | `pg_restore` into an existing empty database; needs `RESTORE_CONFIRM=yes`                                                   |

## Roles

- Migrations run as `zgate_website_owner`: `pnpm db:migrate` locally (it swaps in `DATABASE_MIGRATION_URL`), the `website-migrate` job in Compose and on deploy, which reads the owner URL from `/etc/zgate/website-migrate.env` (`backend/deploy/`).
- New schema changes start in a model: `python manage.py makemigrations`, then review the generated file like code. CI fails if a model change has no migration.
- The running CMS connects as `zgate_website_app`: `SELECT`, `INSERT`, `UPDATE`, `DELETE` on tables the owner creates, through default privileges.
- Restore as the owner role, so restored tables keep the same owner and grants.

## What the database itself enforces

The CMS validates everything in Python first (forms, `save()`, the admin). The database enforces the rules that matter most a second time, so no path around the application (a bulk `update()`, a shell, a script, SQL) can break them. Every rule has a test that writes around the model on purpose (`*/tests/test_integrity.py`, `audit/tests/test_audit_log.py`).

| Rule                                                                                                                          | How                                                      | Migration                       |
| ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | ------------------------------- |
| A lead's submission, consent and attribution never change (`IMMUTABLE_FIELDS`); staff change only status and notes           | Trigger `leads_lead_keep_submission`                     | `leads/0003_integrity`          |
| Every lead has contact consent, a name, a contact and a notice version; a waitlist lead names its course; choices are valid | CHECK constraints `lead_*`                               | `leads/0003_integrity`          |
| A course people are waiting for can't be deleted (unpublish it instead)                                                     | `Lead.course` is `PROTECT`; the admin hides Delete        | `leads/0003_integrity`          |
| The audit log is append-only: no DELETE, no UPDATE except unlinking a deleted account (its email stays)                      | Trigger `audit_auditlog_append_only` + CHECK `auditlog_*` | `audit/0002_integrity`          |
| One staff account per email, ignoring case                                                                                    | Unique index on `lower(email)`                           | `accounts/0002_integrity`       |
| Redirects start with `/` and never point to themselves; one social account per network; fixed lists stay fixed            | CHECK / UNIQUE constraints                               | `content/0006_integrity`        |

**Relationships.** Child rows of a page, division, course or settings (`*Item`, intakes, social links) are deleted with their parent (`CASCADE`). A lead's course is `PROTECT`. An audit entry's actor is `SET_NULL`, with the email kept as a snapshot. Service areas are fixed reference data, seeded by `leads/0002`.

**Transactions.** Each CMS request is one transaction (`ATOMIC_REQUESTS`): a change and its audit entry commit together or not at all, and webhooks and emails (`on_commit`) go only after the commit. `/api/health` and `/api/ready` opt out, so they still answer when the database is down.

**Working with the triggers:**

- Changing `IMMUTABLE_FIELDS`, or the audit log's columns, needs a new migration that drops and re-creates the trigger; the integrity tests fail until it does.
- Deleting audit entries at the end of a retention period is a reviewed migration that drops the trigger, deletes and re-creates it. Never application code.
- Only the table owner (`zgate_website_owner`) can disable a trigger; the running CMS (`zgate_website_app`) can't.
- On SQLite (local tests only), a later migration that rebuilds one of these tables drops its trigger; the tests catch that too.

## Backup targets

| What           | Target                                                                                                                   |
| -------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Database       | **Nightly** logical backup (`backup.sh`), encrypted, copied off the host; keep 30 days. Data-loss window: up to 24 hours |
| Uploaded media | Nightly archive of the media volume, alongside the dump (`docs/DEPLOYMENT.md`)                                           |
| Restore test   | Every quarter, into a scratch database. A backup that was never restored doesn't count                                   |

The website holds leads and consent records (personal data), so dumps are encrypted (`BACKUP_AGE_RECIPIENT`) and stay in Rwanda (ADR-004).

## Example

```bash
PGHOST=data-host.internal PGUSER=zgate_website_owner PGDATABASE=zgate_website \
  BACKUP_DIR=/var/backups/zgate BACKUP_AGE_RECIPIENT=age1... ./backup.sh

PGDATABASE=zgate_website_restore_test RESTORE_CONFIRM=yes \
  BACKUP_AGE_IDENTITY=~/.age/backup.key ./restore.sh /var/backups/zgate/zgate_website-<stamp>.dump.age
```
