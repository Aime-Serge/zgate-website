import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" ADD COLUMN "lead_notification_email" varchar;
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_lead_notification_email" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" DROP COLUMN "lead_notification_email";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_lead_notification_email";`)
}
