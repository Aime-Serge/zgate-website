# Website database

PostgreSQL for the website, used by the CMS (`website/backend`) only. The public site has no database access. Separate from the e-learning database in every environment (ADR-007, ADR-008). The schema lives in `website/backend/src/migrations/` (Payload migrations), never here.

| File                  | What it is                                                                                                                  |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `init/01-roles.sql`   | Creates `zgate_website`, the migration owner `zgate_website_owner` and the app role `zgate_website_app` (rows only, no DDL) |
| `postgresql.conf`     | Production settings: statement and idle-in-transaction timeouts, slow-query logging                                         |
| `postgresql.dev.conf` | Local development: the same guard rails with a small memory footprint (`deploy/compose.yml`)                                |
| `backup.sh`           | `pg_dump` (custom format), optional `age` encryption, retention                                                             |
| `restore.sh`          | `pg_restore` into an existing empty database; needs `RESTORE_CONFIRM=yes`                                                   |

## Roles

- Migrations run as `zgate_website_owner` (`DATABASE_MIGRATION_URL` locally; the `website-migrate` job in Compose).
- The running CMS connects as `zgate_website_app`: `SELECT`, `INSERT`, `UPDATE`, `DELETE` on tables the owner creates, through default privileges.
- Restore as the owner role, so restored tables keep the same owner and grants.

## Backup targets

| What           | Target                                                                                                                   |
| -------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Database       | **Nightly** logical backup (`backup.sh`), encrypted, copied off the host; keep 30 days. Data-loss window: up to 24 hours |
| Uploaded media | Nightly archive of the media volume, alongside the dump (`docs/runbooks/WEBSITE_DEPLOY.md`)                              |
| Restore test   | Every quarter, into a scratch database. A backup that was never restored doesn't count                                   |

The website holds leads and consent records (personal data), so dumps are encrypted (`BACKUP_AGE_RECIPIENT`) and stay in Rwanda (ADR-004).

## Example

```bash
PGHOST=data-host.internal PGUSER=zgate_website_owner PGDATABASE=zgate_website \
  BACKUP_DIR=/var/backups/zgate BACKUP_AGE_RECIPIENT=age1... ./backup.sh

PGDATABASE=zgate_website_restore_test RESTORE_CONFIRM=yes \
  BACKUP_AGE_IDENTITY=~/.age/backup.key ./restore.sh /var/backups/zgate/zgate_website-<stamp>.dump.age
```
